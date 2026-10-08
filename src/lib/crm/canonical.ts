/**
 * Lead → CRM contract `lead-input@1` (SERVER ONLY, deterministic).
 *
 * The same lead object always produces the same JSON (no clock, no randomness), so a retry from
 * the browser with the same pending lead is idempotent in the CRM. Everything the browser sent is
 * re-validated and bounded here; the CRM validates it again (strict) and recomputes the verdict —
 * the browser's qualification travels only as `clientVerdict` (diagnostics).
 * No IP, no user agent, no cookies: only what the person typed, their answers and the attribution
 * of the visit (UTMs and click ids from the landing URL, the landing path and the referrer host).
 */
import type { Lead, LandingTouch } from "@/lib/qualify/types";

export const LEAD_INPUT_SCHEMA = "lead-input@1";
export const SITE = "likinagency.com";
export const SITE_ORIGIN = "https://likinagency.com";
/** Version of the privacy text the consent checkbox refers to (bump when /privacidad changes). */
export const PRIVACY_POLICY_VERSION = "likinagency-privacidad@2026-09";

const EVENT_ID = /^[A-Za-z0-9_-]{6,160}$/;
const ANSWER_KEY = /^[a-z0-9_]{1,80}$/;
const ROLES = new Set(["FOUNDER", "DECISION_MAKER", "NEEDS_APPROVAL", "AGENCY"]);
const QUALIFICATIONS = new Set(["READY", "HIGH_FIT", "FIT", "REVIEW", "NOT_READY"]);

const clean = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return s || undefined;
};
const iso = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
};
const path = (v: unknown): string | undefined => {
  const s = clean(v, 300);
  if (!s || !s.startsWith("/")) return undefined;
  return s.split(/[?#]/)[0] || "/";
};

/** Answers by stable question id; only strings and lists of strings survive, bounded like the CRM. */
export function boundedAnswers(answers: unknown): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (!answers || typeof answers !== "object") return out;
  for (const [k, v] of Object.entries(answers as Record<string, unknown>)) {
    if (!ANSWER_KEY.test(k)) continue;
    if (typeof v === "string") {
      const s = clean(v, 2000);
      if (s) out[k] = s;
    } else if (Array.isArray(v)) {
      const list = v.filter((x): x is string => typeof x === "string").map((x) => clean(x, 200)).filter((x): x is string => Boolean(x)).slice(0, 50);
      if (list.length) out[k] = list;
    }
  }
  return out;
}

/** The landing touch of the visit, bounded; the landing URL never carries its query string. */
export function boundedTouch(t: LandingTouch | undefined): Record<string, string> | undefined {
  if (!t || typeof t !== "object") return undefined;
  const landingPath = path(t.landing_path);
  const touch: Record<string, string | undefined> = {
    occurredAt: iso(t.occurred_at),
    landingUrl: landingPath ? `${SITE_ORIGIN}${landingPath}` : undefined,
    landingPath,
    referrerHost: clean(t.referrer_host, 253)?.toLowerCase(),
    utmSource: clean(t.utm_source, 200),
    utmMedium: clean(t.utm_medium, 200),
    utmCampaign: clean(t.utm_campaign, 200),
    utmId: clean(t.utm_id, 200),
    utmContent: clean(t.utm_content, 200),
    utmTerm: clean(t.utm_term, 200),
    fbclid: clean(t.fbclid, 500),
    gclid: clean(t.gclid, 500),
    ttclid: clean(t.ttclid, 500),
    // Arrived through a tarasvasyliv.com link: its CTA (utm_content) names the button.
    sourceCta: t.utm_source?.trim().toLowerCase() === CROSS_SITE ? clean(t.utm_content, 120) : undefined,
  };
  return compact(touch);
}

const CROSS_SITE = "tarasvasyliv.com";
const VALUE = /^[\p{L}\p{N} ._~+-]{1,100}$/u;
const HOST = /^[a-z0-9.-]{1,253}$/;
const compact = (o: Record<string, string | undefined>): Record<string, string> | undefined => {
  const out = Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Record<string, string>;
  return Object.keys(out).length ? out : undefined;
};
const value = (v: unknown) => (typeof v === "string" && VALUE.test(v.trim()) ? v.trim() : undefined);

/**
 * The hop from tarasvasyliv.com (OD-16) and the origin that site reported, bounded. The CRM stores
 * the hop as a `cross_site` touch and the origin as `reported_first` on tarasvasyliv.com, one
 * second before the hop (never a time taken from the URL). Never click ids, never queries.
 */
export function crossSiteTouches(t: LandingTouch | undefined): { crossSite?: Record<string, string>; reportedFirst?: Record<string, string> } {
  const c = t?.cross;
  if (!c || typeof c !== "object" || c.site !== CROSS_SITE) return {};
  const at = iso(c.at);
  if (!at) return {};
  const landingPath = path(c.landing_path) ?? "/";
  const crossSite = compact({ occurredAt: at, landingUrl: `${SITE_ORIGIN}${landingPath}`, landingPath, sourceSite: CROSS_SITE, sourceCta: value(c.cta), referrerHost: CROSS_SITE });
  const o = c.origin && typeof c.origin === "object" ? c.origin : undefined;
  const host = typeof o?.referrer_host === "string" && HOST.test(o.referrer_host) ? o.referrer_host : undefined;
  const reportedFirst = o
    ? compact({ utmSource: value(o.utm_source), utmMedium: value(o.utm_medium), utmCampaign: value(o.utm_campaign), utmContent: value(o.utm_content), referrerHost: host })
    : undefined;
  return {
    ...(crossSite ? { crossSite } : {}),
    ...(reportedFirst ? { reportedFirst: { occurredAt: new Date(Date.parse(at) - 1000).toISOString(), ...reportedFirst } } : {}),
  };
}

/**
 * The CRM payload for a validated lead. `fallbackEventId` is used only when the browser sent no
 * usable id (then a browser retry cannot be deduplicated; the CRM still never duplicates within
 * the server's own retries).
 */
export function toLeadInput(lead: Lead, opts: { fallbackEventId: string; fallbackSubmittedAt: string }): Record<string, unknown> {
  const service = lead.service === "BUILD" ? "BUILD" : "SCALE";
  const answers = boundedAnswers(lead.answers);
  const sourceCta = clean(lead.source, 120);
  const pagePath = path(lead.source?.split("#")[0]) ?? path(lead.landing_page);
  const touch = boundedTouch(lead.touch);
  const role = typeof lead.business_role === "string" && ROLES.has(lead.business_role) ? lead.business_role : undefined;
  const clientVerdict =
    typeof lead.qualification === "string" && QUALIFICATIONS.has(lead.qualification) && typeof lead.lead_score === "number" && lead.lead_score >= 0 && lead.lead_score <= 100
      ? { qualification: lead.qualification, leadScore: lead.lead_score }
      : undefined;
  const brandLink = typeof answers.brand_link === "string" ? answers.brand_link.slice(0, 300) : undefined;
  return {
    schema: LEAD_INPUT_SCHEMA,
    source: "web",
    sourceEventId: typeof lead.lead_id === "string" && EVENT_ID.test(lead.lead_id) ? lead.lead_id : opts.fallbackEventId,
    site: SITE,
    form: { key: service === "BUILD" ? "LK-BUILD" : "LK-SCALE", version: clean(lead.form_version, 60) ?? "unknown" },
    service,
    submittedAt: iso(lead.created_at) ?? opts.fallbackSubmittedAt,
    identity: {
      name: clean(lead.contact_name, 160) ?? "",
      ...(clean(lead.email, 320) ? { email: clean(lead.email, 320) } : {}),
      ...(clean(lead.phone, 40) ? { phone: clean(lead.phone, 40) } : {}),
      ...(role ? { businessRole: role } : {}),
    },
    company: {
      ...(clean(lead.brand_name, 200) ? { name: clean(lead.brand_name, 200) } : {}),
      ...(brandLink ? { link: brandLink } : {}),
    },
    answers,
    ...(clean(lead.additional_notes, 2000) ? { notes: clean(lead.additional_notes, 2000) } : {}),
    consent: { contact: lead.consent_contact === true, marketing: lead.consent_nurture === true, policyVersion: PRIVACY_POLICY_VERSION },
    attribution: { ...(touch ? { session: touch } : {}), ...crossSiteTouches(lead.touch) },
    ...(clientVerdict ? { clientVerdict } : {}),
    metadata: {
      ...(pagePath ? { pagePath } : {}),
      ...(sourceCta ? { sourceCta } : {}),
    },
  };
}
