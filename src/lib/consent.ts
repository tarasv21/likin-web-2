/**
 * The visitor's cookie decision (browser only). One optional purpose today: measuring which Meta
 * ads bring requests (the Meta Pixel, src/lib/meta-pixel.ts). Nothing optional runs until the
 * visitor accepts; rejecting is as easy as accepting and the site works the same.
 *
 * Kept in localStorage as {"v":1,"ads":true|false,"at":"<ISO>"} under `likin.consent.v1` (no
 * cookie of our own). The decision is asked again after 12 months or when the version changes.
 * If storage is blocked, the decision lasts for this page view only.
 */
export const CONSENT_KEY = "likin.consent.v1";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
/** Fired on window after every decision (detail: the Consent). */
export const CONSENT_EVENT = "likin:consent";
/** Fired on window to reopen the cookie panel (footer "Configurar cookies"). */
export const CONSENT_OPEN_EVENT = "likin:consent-open";

export type Consent = { v: number; ads: boolean; at: string };
export type ConsentState = "undecided" | "granted" | "denied";

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** A stored decision, or null when there is none, it is malformed, expired or of another version. */
export function parseConsent(raw: string | null, now: number): Consent | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as Partial<Consent>;
    if (c.v !== CONSENT_VERSION || typeof c.ads !== "boolean" || typeof c.at !== "string") return null;
    const at = Date.parse(c.at);
    if (!Number.isFinite(at) || at > now + 5 * 60 * 1000 || now - at > CONSENT_MAX_AGE_MS) return null;
    return { v: c.v, ads: c.ads, at: c.at };
  } catch {
    return null;
  }
}

export const stateOf = (c: Consent | null): ConsentState => (c === null ? "undecided" : c.ads ? "granted" : "denied");

let memory: Consent | null = null;

function store(): KeyValueStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readConsent(storage: KeyValueStore | null = store(), now = Date.now()): Consent | null {
  try {
    const saved = parseConsent(storage?.getItem(CONSENT_KEY) ?? null, now);
    if (saved) return saved;
  } catch {
    // storage blocked: fall back to this page view's decision
  }
  return memory && parseConsent(JSON.stringify(memory), now);
}

export function saveConsent(ads: boolean, storage: KeyValueStore | null = store(), now = Date.now()): Consent {
  const c: Consent = { v: CONSENT_VERSION, ads, at: new Date(now).toISOString() };
  memory = c;
  try {
    storage?.setItem(CONSENT_KEY, JSON.stringify(c));
  } catch {
    // blocked storage: the decision lives in memory for this page view
  }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: c }));
  return c;
}

export function openConsentPanel() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
