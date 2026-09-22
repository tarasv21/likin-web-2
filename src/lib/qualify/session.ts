/**
 * QUALIFY — attribution and in-session recovery.
 *
 * If someone closes the sheet by accident, their answers survive for the tab. Two rules:
 * only sessionStorage (gone when the tab closes, never shared), and only the non-personal
 * qualification answers. Contact details are never written anywhere.
 */
import type { Answers, Attribution, Service } from "./types";
import { QUESTIONS } from "./questions";

const KEY = "likin.qualify.v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 2; // two hours inside the same tab

/** Free-text answers can contain anything the user typed, so they are not persisted. */
const PERSISTABLE = new Set(QUESTIONS.filter((q) => q.kind === "single" || q.kind === "multi").map((q) => q.id));

type Saved = { service: Service; answers: Answers; at: number };

export function saveSession(service: Service, answers: Answers) {
  try {
    const safe: Answers = {};
    for (const [k, v] of Object.entries(answers)) {
      if (PERSISTABLE.has(k) && v !== undefined) safe[k] = v;
    }
    sessionStorage.setItem(KEY, JSON.stringify({ service, answers: safe, at: Date.now() } satisfies Saved));
  } catch {
    // Private mode, blocked storage: recovery is a convenience, never a requirement.
  }
}

export function loadSession(service: Service): Answers | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (saved.service !== service || Date.now() - saved.at > MAX_AGE_MS) return null;
    const answers: Answers = {};
    for (const [k, v] of Object.entries(saved.answers ?? {})) {
      if (PERSISTABLE.has(k) && (typeof v === "string" || Array.isArray(v))) answers[k] = v;
    }
    return Object.keys(answers).length ? answers : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** UTM parameters and referrer, read at open time. */
export function readAttribution(source: string): Attribution {
  if (typeof window === "undefined") return { source, landing_page: "" };
  const p = new URLSearchParams(window.location.search);
  const get = (k: string) => p.get(k)?.slice(0, 120) || undefined;
  return {
    source,
    landing_page: window.location.pathname,
    utm_source: get("utm_source"),
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
    utm_content: get("utm_content"),
    utm_term: get("utm_term"),
    referrer: document.referrer ? document.referrer.slice(0, 200) : undefined,
  };
}
