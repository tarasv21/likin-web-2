/**
 * QUALIFY — analytics layer, provider-agnostic.
 *
 * Components emit conceptual events; nothing here knows about GA4, Meta or a CRM. Sinks are
 * registered at runtime, so adding a provider later touches this file only.
 *
 * Rule enforced here, not by convention: personal data never leaves this layer. Payloads are
 * filtered against an allow-list of non-PII keys before any sink sees them.
 */
export type QualifyEvent =
  | "qualification_form_opened"
  | "service_selected"
  | "qualification_started"
  | "qualification_step_completed"
  | "qualification_disqualified"
  | "qualification_contact_reached"
  | "qualification_submitted"
  | "qualification_result"
  | "build_checkout_clicked"
  | "book_call_clicked"
  | "manual_review_submitted";

export type EventPayload = Record<string, string | number | boolean | string[] | undefined>;

/** Keys allowed to leave the site. Anything else is dropped, including by mistake. */
const ALLOWED = new Set([
  "service",
  "source",
  "landing_page",
  "step_id",
  "step_index",
  "step_total",
  "qualification",
  "next_action",
  "lead_score",
  "requires_manual_review",
  "reason",
  "reasons",
  "form_version",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "has_checkout_url",
  "has_booking_url",
  "recommend_service",
  "ok",
]);

/** Never emitted, even if a caller passes them. */
const PII = /email|phone|name|brand|url|notes|instagram|website|link/i;

function sanitize(payload: EventPayload = {}): EventPayload {
  const out: EventPayload = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue;
    if (!ALLOWED.has(k) || PII.test(k)) continue;
    out[k] = v;
  }
  return out;
}

type Sink = (event: QualifyEvent, payload: EventPayload) => void;
const sinks: Sink[] = [];

/** Register a provider. Returns an unsubscribe function. */
export function addEventSink(sink: Sink) {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function track(event: QualifyEvent, payload: EventPayload = {}) {
  const safe = sanitize(payload);
  for (const sink of sinks) {
    try {
      sink(event, safe);
    } catch {
      // A broken analytics provider must never break the form.
    }
  }
  if (process.env.NODE_ENV !== "production") console.debug("[qualify]", event, safe);
}
