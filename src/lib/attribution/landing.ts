/**
 * Landing attribution (CLIENT). Captured once when the person arrives — before the deep-link
 * handler rewrites the URL — and kept for this tab only (sessionStorage; gone when the tab
 * closes). A later arrival with campaign parameters in the same tab replaces it (a new visit);
 * internal navigation never does. Nothing is sent anywhere: the touch travels only inside the
 * lead the person decides to submit. No cookies, no identifiers of our own, no fingerprinting.
 */
import type { LandingTouch } from "@/lib/qualify/types";

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

/** Builds a touch from a URL + referrer. Pure; exported for tests. */
export function touchFrom(href: string, referrer: string, ownHost: string, at: string): { touch: LandingTouch; campaign: boolean } {
  const url = new URL(href);
  const touch: LandingTouch = { occurred_at: at, landing_path: url.pathname || "/" };
  let campaign = false;
  for (const p of PARAMS) {
    const v = url.searchParams.get(p)?.trim();
    if (v) {
      (touch as Record<string, string>)[p] = v.slice(0, MAX[p] ?? 200);
      campaign = true;
    }
  }
  try {
    const host = referrer ? new URL(referrer).hostname.toLowerCase() : "";
    if (host && host !== ownHost.toLowerCase()) touch.referrer_host = host.replace(/^www\./, "");
  } catch {
    // Unparseable referrer: ignored.
  }
  return { touch, campaign };
}

/** Call once per page load, as early as possible. */
export function captureLanding() {
  if (typeof window === "undefined") return;
  const { touch, campaign } = touchFrom(window.location.href, document.referrer, window.location.hostname, new Date().toISOString());
  const current = read();
  // Keep the visit's first arrival; a new campaign click (or an external referrer) is a new arrival.
  if (!current || campaign || (touch.referrer_host && touch.referrer_host !== current.referrer_host)) write(touch);
}

export function readLanding(): LandingTouch | null {
  if (typeof window === "undefined") return null;
  return read();
}
