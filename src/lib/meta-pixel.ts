/**
 * Meta Pixel (browser only), ONLY when NEXT_PUBLIC_META_PIXEL_ID is set AND the visitor accepted
 * cookies (src/lib/consent.ts). Before that nothing from Meta loads: no script, no cookie, no request.
 *
 * What Meta receives: page views and, when the server confirms a BUILD/SCALE request, one `Lead`
 * with `content_name` = the service and the lead id as `eventID` (deduplication now, and against
 * the Conversions API later). Never form fields, names, e-mails or phones: automatic configuration
 * is off (no automatic button/page events) and there is no advanced matching (also keep
 * "Automatic advanced matching" off in Events Manager).
 *
 * One Lead per lead id: remembered for the tab (sessionStorage) and in memory, so a double click,
 * a re-render or a retry never counts twice. Revoking consent stops the pixel and deletes the Meta
 * cookies of this site (`_fbp`, `_fbc`).
 */
export const META_PIXEL_SRC = "https://connect.facebook.net/en_US/fbevents.js";
export const LEADS_SENT_KEY = "likin.pixel.leads.v1";
const MAX_REMEMBERED = 20;

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FbqFn;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
  allowDuplicatePageViews?: boolean;
};

export type PixelHost = {
  fbq?: FbqFn;
  _fbq?: FbqFn;
  document: Pick<Document, "createElement" | "head"> & { cookie: string };
  location: { hostname: string };
  sessionStorage?: Pick<Storage, "getItem" | "setItem">;
};

/** The pixel id from the environment: digits only, or null (pixel off). */
export function pixelIdFrom(raw: string | undefined): string | null {
  const v = raw?.trim();
  return v && /^\d{6,20}$/.test(v) ? v : null;
}

/** Cookie strings that delete Meta's first-party cookies on this host and its parent domains. */
export function metaCookieDeletions(hostname: string): string[] {
  const parts = hostname.split(".").filter(Boolean);
  const domains: (string | null)[] = [null];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`.${parts.slice(i).join(".")}`);
  return ["_fbp", "_fbc"].flatMap((name) => domains.map((d) => `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`));
}

/** Meta's base code, as a function: the queueing `fbq` stub plus the async fbevents.js script. */
function installBaseCode(host: PixelHost) {
  if (host.fbq) return;
  const n = function () {
    // Meta's stub: queue the call until fbevents.js takes over (it expects `arguments`).
    // eslint-disable-next-line prefer-rest-params
    const args = arguments as unknown as unknown[];
    if (n.callMethod) Reflect.apply(n.callMethod, n, args); // fbevents.js expects the stub as `this`
    else n.queue.push(args);
  } as FbqFn;
  host.fbq = n;
  if (!host._fbq) host._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  const script = host.document.createElement("script");
  script.async = true;
  script.src = META_PIXEL_SRC;
  host.document.head.appendChild(script);
}

export type MetaPixel = ReturnType<typeof createMetaPixel>;

export function createMetaPixel(pixelId: string | null, getHost: () => PixelHost | undefined) {
  let loaded = false;
  let granted = false;
  const sentInMemory = new Set<string>();
  const call = (...args: unknown[]) => getHost()?.fbq?.(...args);

  const remembered = (): string[] => {
    try {
      const raw = getHost()?.sessionStorage?.getItem(LEADS_SENT_KEY);
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  };
  const remember = (id: string) => {
    sentInMemory.add(id);
    try {
      getHost()?.sessionStorage?.setItem(LEADS_SENT_KEY, JSON.stringify([...remembered().filter((x) => x !== id), id].slice(-MAX_REMEMBERED)));
    } catch {
      // blocked storage: memory still prevents a second Lead in this page view
    }
  };

  return {
    configured: pixelId !== null,
    get active() {
      return loaded && granted;
    },
    /** The visitor accepted: load the pixel once (PageView included) or resume it. */
    grant(): boolean {
      const host = getHost();
      if (!pixelId || !host) return false;
      granted = true;
      if (loaded) {
        call("consent", "grant");
        return true;
      }
      installBaseCode(host);
      // Page views are sent explicitly, once per route: Meta's own history tracking is off and,
      // without it, Meta drops every PageView after the first one of the document unless allowed.
      if (host.fbq) {
        host.fbq.disablePushState = true;
        host.fbq.allowDuplicatePageViews = true;
      }
      call("consent", "grant");
      call("set", "autoConfig", false, pixelId);
      call("init", pixelId);
      call("track", "PageView");
      loaded = true;
      return true;
    },
    /** The visitor rejected or withdrew: stop sending and delete Meta's cookies of this site. */
    revoke() {
      granted = false;
      if (loaded) call("consent", "revoke");
      const host = getHost();
      if (!host) return;
      for (const c of metaCookieDeletions(host.location.hostname)) {
        try {
          host.document.cookie = c;
        } catch {
          // a cookie that cannot be written cannot be there either
        }
      }
    },
    /** A client-side navigation (the first page view is sent by grant). */
    pageView(): boolean {
      if (!loaded || !granted) return false;
      call("track", "PageView");
      return true;
    },
    /** The server confirmed a BUILD/SCALE request: one Lead per lead id, only with consent. */
    lead({ eventId, service }: { eventId: string; service: "BUILD" | "SCALE" }): boolean {
      if (!loaded || !granted) return false;
      if (!/^[A-Za-z0-9_-]{8,100}$/.test(eventId) || (service !== "BUILD" && service !== "SCALE")) return false;
      if (sentInMemory.has(eventId) || remembered().includes(eventId)) return false;
      remember(eventId);
      call("track", "Lead", { content_name: service, content_category: "qualification_form" }, { eventID: eventId });
      return true;
    },
  };
}

/** The site's pixel (no-op on the server and when NEXT_PUBLIC_META_PIXEL_ID is not set). */
export const metaPixel = createMetaPixel(pixelIdFrom(process.env.NEXT_PUBLIC_META_PIXEL_ID), () =>
  typeof window === "undefined" ? undefined : (window as unknown as PixelHost),
);
