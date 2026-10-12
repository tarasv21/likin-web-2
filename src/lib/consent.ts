/**
 * The visitor's cookie decision (browser only), per purpose:
 *   · analytics — Google Analytics (src/lib/ga.ts) and Microsoft Clarity (src/lib/clarity.ts);
 *   · ads       — Meta: pixel and Conversions API (src/lib/meta-pixel.ts, src/lib/meta.ts).
 * Nothing optional runs until the visitor allows its purpose; «Rechazar todas» is as easy as
 * «Aceptar todas», «Configurar» chooses each purpose, and the site works the same without them.
 * Version 4 (one choice per purpose): an older, all-or-nothing decision is asked again.
 *
 * Kept in localStorage as {"v":4,"analytics":bool,"ads":bool,"at":"<ISO>"} under `likin.consent.v1`
 * (no cookie of our own). Asked again after 12 months or when the version changes. If storage is
 * blocked, the decision lasts for this page view only.
 */
export const CONSENT_KEY = "likin.consent.v1";
export const CONSENT_VERSION = 4;
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
/** Fired on window after every decision (detail: the Consent). */
export const CONSENT_EVENT = "likin:consent";
/** Fired on window to reopen the cookie panel (footer "Configurar cookies"). */
export const CONSENT_OPEN_EVENT = "likin:consent-open";

export type ConsentChoice = { analytics: boolean; ads: boolean };
export type Consent = ConsentChoice & { v: number; at: string };
/** A stable, comparable summary for React: "undecided" or "a1-p0" (analytics yes, ads no)… */
export type ConsentKey = "undecided" | `a${0 | 1}-p${0 | 1}`;

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** A stored decision, or null when there is none, it is malformed, expired or of another version. */
export function parseConsent(raw: string | null, now: number): Consent | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as Partial<Consent>;
    if (c.v !== CONSENT_VERSION || typeof c.analytics !== "boolean" || typeof c.ads !== "boolean" || typeof c.at !== "string") return null;
    const at = Date.parse(c.at);
    if (!Number.isFinite(at) || at > now + 5 * 60 * 1000 || now - at > CONSENT_MAX_AGE_MS) return null;
    return { v: c.v, analytics: c.analytics, ads: c.ads, at: c.at };
  } catch {
    return null;
  }
}

export const keyOf = (c: Consent | null): ConsentKey => (c === null ? "undecided" : `a${c.analytics ? 1 : 0}-p${c.ads ? 1 : 0}`);

/** The choice behind a key (null while undecided). */
export function choiceOf(key: string): ConsentChoice | null {
  const m = /^a([01])-p([01])$/.exec(key);
  return m ? { analytics: m[1] === "1", ads: m[2] === "1" } : null;
}

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

export function saveConsent(choice: ConsentChoice, storage: KeyValueStore | null = store(), now = Date.now()): Consent {
  const c: Consent = { v: CONSENT_VERSION, analytics: choice.analytics, ads: choice.ads, at: new Date(now).toISOString() };
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
