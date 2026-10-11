/**
 * Meta Pixel (navegador), SOLO con PIXEL_ID y con el consentimiento del visitante (consent.ts):
 * antes, nada de Meta (ni script, ni cookie, ni petición). Mismo código en likinagency.com.
 *
 * Cada evento lleva un `eventID` que también viaja a la API de Conversiones (meta.ts → servidor),
 * para que Meta cuente uno solo. Los estándar van con `track`; los propios (AbrirFormulario,
 * PasoContacto, IrALikinAgency), con `trackCustom`. Sin configuración automática de eventos ni coincidencia avanzada
 * en el navegador. Un Lead por id (sessionStorage + memoria): doble clic o reintento no cuentan dos
 * veces. Retirar el consentimiento detiene el píxel y borra `_fbp` y `_fbc` de esta web.
 */
export const META_PIXEL_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
export const LEADS_SENT_KEY = 'likin.pixel.leads.v1';
export const META_EVENTS = ['PageView', 'Lead', 'Contact', 'Schedule', 'ViewContent', 'InitiateCheckout', 'AbrirFormulario', 'PasoContacto', 'IrALikinAgency'] as const;
/** Eventos estándar de Meta; el resto son eventos personalizados. */
export const STANDARD_EVENTS: readonly string[] = ['PageView', 'Lead', 'Contact', 'Schedule', 'ViewContent', 'InitiateCheckout'];
export type MetaEventName = (typeof META_EVENTS)[number];
export type MetaParams = Record<string, string>;
const MAX_REMEMBERED = 20;
export const EVENT_ID = /^[A-Za-z0-9_-]{8,100}$/;

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FbqFn;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
  allowDuplicatePageViews?: boolean;
};

/** Enlaces que cuentan como Contact: email, teléfono y WhatsApp. */
export const CONTACT_LINKS = 'a[href^="mailto:"], a[href^="tel:"], a[href*="wa.me/"], a[href*="whatsapp.com/"]';

/** El canal de un enlace de contacto (content_name del evento Contact), o null si no lo es. */
export function contactChannel(href: string): 'email' | 'phone' | 'whatsapp' | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith('mailto:')) return 'email';
  if (h.startsWith('tel:')) return 'phone';
  try {
    const host = new URL(h).hostname;
    if (host === 'wa.me' || host === 'whatsapp.com' || host.endsWith('.whatsapp.com')) return 'whatsapp';
  } catch {
    // Relative or malformed: not a contact link.
  }
  return null;
}

export type PixelHost = {
  fbq?: FbqFn;
  _fbq?: FbqFn;
  document: Pick<Document, 'createElement' | 'head'> & { cookie: string };
  location: { hostname: string };
  sessionStorage?: Pick<Storage, 'getItem' | 'setItem'>;
};

export function pixelIdFrom(raw: string | undefined): string | null {
  const v = raw?.trim();
  return v && /^\d{6,20}$/.test(v) ? v : null;
}

export function metaCookieDeletions(hostname: string): string[] {
  const parts = hostname.split('.').filter(Boolean);
  const domains: (string | null)[] = [null];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`.${parts.slice(i).join('.')}`);
  return ['_fbp', '_fbc'].flatMap((name) => domains.map((d) => `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`));
}

/** `_fbc` (formato de Meta) desde un fbclid guardado, si Meta no lo ha puesto; solo tras el consentimiento. */
export function fbcCookie(click: { fbclid?: string; at?: string } | null | undefined, cookies: string, nowMs: number): string | null {
  const fbclid = click?.fbclid?.trim();
  if (!fbclid || !/^[A-Za-z0-9_.-]{10,500}$/.test(fbclid) || /(?:^|;\s*)_fbc=/.test(cookies)) return null;
  const at = Date.parse(click?.at ?? '');
  const created = Number.isFinite(at) && at <= nowMs ? at : nowMs;
  return `_fbc=fb.1.${created}.${fbclid}; Max-Age=7776000; path=/; SameSite=Lax`;
}

function installBaseCode(host: PixelHost) {
  if (host.fbq) return;
  const n = function () {
    // El stub de Meta: guarda las llamadas hasta que fbevents.js toma el control (espera `arguments`).
    // eslint-disable-next-line prefer-rest-params
    const args = arguments as unknown as unknown[];
    if (n.callMethod) Reflect.apply(n.callMethod, n, args);
    else n.queue.push(args);
  } as FbqFn;
  host.fbq = n;
  if (!host._fbq) host._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  const script = host.document.createElement('script');
  script.async = true;
  script.src = META_PIXEL_SRC;
  host.document.head.appendChild(script);
}

export type MetaPixel = ReturnType<typeof createMetaPixel>;

export function createMetaPixel(pixelId: string | null, getHost: () => PixelHost | undefined) {
  let loaded = false;
  let granted = false;
  const sentLeads = new Set<string>();
  const call = (...args: unknown[]) => getHost()?.fbq?.(...args);
  const remembered = (): string[] => {
    try {
      const raw = getHost()?.sessionStorage?.getItem(LEADS_SENT_KEY);
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  };
  const remember = (id: string) => {
    sentLeads.add(id);
    try {
      getHost()?.sessionStorage?.setItem(LEADS_SENT_KEY, JSON.stringify([...remembered().filter((x) => x !== id), id].slice(-MAX_REMEMBERED)));
    } catch {
      // sin almacenamiento, la memoria evita el segundo Lead en esta página
    }
  };

  return {
    configured: pixelId !== null,
    get active() {
      return loaded && granted;
    },
    /** El visitante aceptó: carga el píxel una vez (sin eventos; el primer PageView lo envía trackEvent). */
    grant(click?: { fbclid?: string; at?: string } | null): boolean {
      const host = getHost();
      if (!pixelId || !host) return false;
      granted = true;
      if (loaded) {
        call('consent', 'grant');
        return true;
      }
      const fbc = fbcCookie(click, host.document.cookie, Date.now());
      if (fbc) {
        try {
          host.document.cookie = fbc;
        } catch {
          // sin cookie: Meta no recibe el clic anterior
        }
      }
      installBaseCode(host);
      // Un PageView por página, enviado por nosotros con su eventID: el seguimiento de historial de
      // Meta, apagado; sin allowDuplicatePageViews Meta descartaría los siguientes del documento.
      if (host.fbq) {
        host.fbq.disablePushState = true;
        host.fbq.allowDuplicatePageViews = true;
      }
      call('consent', 'grant');
      call('set', 'autoConfig', false, pixelId);
      call('init', pixelId);
      loaded = true;
      return true;
    },
    revoke() {
      granted = false;
      if (loaded) call('consent', 'revoke');
      const host = getHost();
      if (!host) return;
      for (const c of metaCookieDeletions(host.location.hostname)) {
        try {
          host.document.cookie = c;
        } catch {
          // una cookie que no se puede escribir tampoco puede estar
        }
      }
    },
    /** Un evento con su eventID (el mismo que recibe la API de Conversiones). Lead: uno por id. */
    track(name: MetaEventName, params: MetaParams, eventId: string): boolean {
      if (!loaded || !granted || !META_EVENTS.includes(name) || !EVENT_ID.test(eventId)) return false;
      if (name === 'Lead') {
        if (sentLeads.has(eventId) || remembered().includes(eventId)) return false;
        remember(eventId);
      }
      call(STANDARD_EVENTS.includes(name) ? 'track' : 'trackCustom', name, params, { eventID: eventId });
      return true;
    },
  };
}

/** El píxel de esta web (no hace nada en el servidor ni sin NEXT_PUBLIC_META_PIXEL_ID). */
export const metaPixel = createMetaPixel(pixelIdFrom(process.env.NEXT_PUBLIC_META_PIXEL_ID), () =>
  typeof window === 'undefined' ? undefined : (window as unknown as PixelHost),
);
