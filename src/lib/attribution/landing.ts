/**
 * Landing attribution (CLIENT). Captured once when the person arrives — before the deep-link
 * handler rewrites the URL — and kept for this tab only (sessionStorage; gone when the tab
 * closes). A later arrival with campaign parameters in the same tab replaces it (a new visit);
 * internal navigation never does. Nothing is sent anywhere: the touch travels only inside the
 * lead the person decides to submit. No cookies, no identifiers of our own, no fingerprinting.
 */
import type { CrossSiteHop, LandingTouch } from "@/lib/qualify/types";

const KEY = "likin.touch.v1";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"] as const;
const MAX = { fbclid: 500, gclid: 500, ttclid: 500 } as Record<string, number>;

let memory: LandingTouch | null = null;

function read(): LandingTouch | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LandingTouch;
  } catch {
    // Private mode or blocked storage: memory only.
  }
  return memory;
}

function write(t: LandingTouch) {
  memory = t;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    // Same as above.
  }
}

/** Sites of the same owner whose links are decorated (OD-16): an arrival from them is a hop, not a new visit. */
const CROSS_SITE = "tarasvasyliv.com";
/** Origin parameters set by tarasvasyliv.com on click → the touch field they describe. */
const ORIGIN = { o_src: "utm_source", o_med: "utm_medium", o_cmp: "utm_campaign", o_cnt: "utm_content", o_ref: "referrer_host" } as const;
const VALUE = /^[\p{L}\p{N} ._~+-]{1,100}$/u;
const HOST = /^[a-z0-9.-]{1,253}$/;

type Arrival = { touch: LandingTouch; campaign: boolean; cross?: CrossSiteHop };

/** The hop when the person came from tarasvasyliv.com (decorated link or plain referrer). Pure. */
export function crossFrom(url: URL, referrerHost: string | undefined, at: string): CrossSiteHop | undefined {
  const fromTaras = url.searchParams.get("utm_source")?.trim().toLowerCase() === CROSS_SITE;
  if (!fromTaras && referrerHost !== CROSS_SITE) return undefined;
  const hop: CrossSiteHop = { site: CROSS_SITE, at, landing_path: url.pathname || "/" };
  const cta = fromTaras ? url.searchParams.get("utm_content")?.trim() : undefined;
  if (cta && VALUE.test(cta)) hop.cta = cta.slice(0, 100);
  if (fromTaras) {
    const origin: NonNullable<CrossSiteHop["origin"]> = {};
    for (const [param, field] of Object.entries(ORIGIN)) {
      const v = url.searchParams.get(param)?.trim();
      if (!v) continue;
      if (field === "referrer_host" ? HOST.test(v.toLowerCase()) : VALUE.test(v)) origin[field] = field === "referrer_host" ? v.toLowerCase() : v;
    }
    if (Object.keys(origin).length) hop.origin = origin;
  }
  return hop;
}

/**
 * What to keep after an arrival (null = keep the current touch untouched). A hop from
 * tarasvasyliv.com never replaces the touch that brought the person here first in this visit
 * (it is the same owner's site, not a new campaign): the hop is recorded next to it. Pure.
 */
export function nextLanding(current: LandingTouch | null, arrival: Arrival): LandingTouch | null {
  if (arrival.cross) return current ? { ...current, cross: arrival.cross } : { ...arrival.touch, cross: arrival.cross };
  const { touch, campaign } = arrival;
  if (!current || campaign || (touch.referrer_host && touch.referrer_host !== current.referrer_host)) return touch;
  return null;
}

/** Builds a touch from a URL + referrer. Pure; exported for tests. */
export function touchFrom(href: string, referrer: string, ownHost: string, at: string): Arrival {
  const url = new URL(href);
  const touch: LandingTouch = { occurred_at: at, landing_path: url.pathname || "/" };
  let campaign = false;
  for (const p of PARAMS) {
    const v = url.searchParams.get(p)?.trim();
    if (v) {
      (touch as unknown as Record<string, string>)[p] = v.slice(0, MAX[p] ?? 200);
      campaign = true;
    }
  }
  try {
    const host = referrer ? new URL(referrer).hostname.toLowerCase() : "";
    if (host && host !== ownHost.toLowerCase()) touch.referrer_host = host.replace(/^www\./, "");
  } catch {
    // Unparseable referrer: ignored.
  }
  const cross = crossFrom(url, touch.referrer_host, at);
  return cross ? { touch, campaign, cross } : { touch, campaign };
}

/** Call once per page load, as early as possible. */
export function captureLanding() {
  if (typeof window === "undefined") return;
  const arrival = touchFrom(window.location.href, document.referrer, window.location.hostname, new Date().toISOString());
  // Keep the visit's first arrival; a new campaign click (or an external referrer) is a new arrival;
  // a hop from tarasvasyliv.com is recorded next to the current touch.
  const next = nextLanding(read(), arrival);
  if (next) write(next);
}

export function readLanding(): LandingTouch | null {
  if (typeof window === "undefined") return null;
  return read();
}
