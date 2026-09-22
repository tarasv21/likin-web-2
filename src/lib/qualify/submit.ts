/**
 * QUALIFY — lead assembly and delivery.
 *
 * `buildLead` turns answers + verdict + contact into the flat record a CRM will store.
 * `submitLead` is the single seam to the outside world. There is no CRM yet: the route it
 * posts to validates the payload and forwards it to a webhook when one is configured, and
 * says so honestly when it is not. Nothing here pretends a lead was stored.
 */
import { pricingModelOf } from "./engine";
import { FORM_VERSION, type Answers, type Attribution, type Contact, type Lead, type Service, type Verdict } from "./types";

const one = (a: Answers, id: string) => (typeof a[id] === "string" ? (a[id] as string).trim() || undefined : undefined);
const many = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : undefined);

function newId() {
  try {
    return `lead_${crypto.randomUUID()}`;
  } catch {
    return `lead_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** Splits the single "where can we see it" answer into the two CRM columns. */
function splitLink(value: string | undefined) {
  if (!value) return {};
  return value.startsWith("@") ? { instagram: value } : { website: value };
}

export function buildLead({ service, answers, verdict, attribution, contact }: { service: Service; answers: Answers; verdict: Verdict; attribution: Attribution; contact?: Contact }): Lead {
  const category = one(answers, "product_category");
  const link = splitLink(one(answers, "brand_link"));
  return {
    lead_id: newId(),
    created_at: new Date().toISOString(),
    form_version: FORM_VERSION,

    source: attribution.source,
    landing_page: attribution.landing_page,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    referrer: attribution.referrer,

    service,
    qualification: verdict.qualification,
    lead_score: verdict.lead_score,
    qualification_reasons: verdict.qualification_reasons,
    requires_manual_review: verdict.requires_manual_review,
    next_action: verdict.next_action,

    intent: service === "BUILD" ? one(answers, "build_situation") : many(answers, "services_interested")?.join(","),

    brand_name: contact?.brand_name || one(answers, "brand_name"),
    ...link,
    website: one(answers, "store_url") ?? one(answers, "build_store_url") ?? link.website,
    business_role: one(answers, "business_role"),
    product_category: category === "OTHER" ? one(answers, "product_category_other") : category,

    monthly_revenue: one(answers, "monthly_revenue"),
    monthly_ad_spend: one(answers, "monthly_ad_spend"),
    investment_capacity: one(answers, "investment_capacity"),

    platform: one(answers, "platform") ?? one(answers, "build_platform"),
    product_count: one(answers, "product_count"),

    main_bottlenecks: many(answers, "main_bottlenecks"),
    services_interested: many(answers, "services_interested"),

    pricing_model: pricingModelOf(answers),
    variable_model_metric: one(answers, "variable_model_metric"),

    contact_name: contact?.contact_name,
    email: contact?.email,
    phone: contact?.phone,
    additional_notes: contact?.additional_notes,
    consent_contact: contact?.consent_contact,
    consent_nurture: contact?.consent_nurture,

    answers,
  };
}

export type SubmitResult = { ok: true; stored: boolean } | { ok: false; error: string };

/**
 * The one place that talks to the server. Swap the endpoint for the CRM later and nothing
 * else in the form changes. `stored` reports whether the lead was actually persisted
 * downstream, so the UI never claims more than what happened.
 */
export async function submitLead(lead: Lead, honeypot: string): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lead, website_url: honeypot }),
      signal: AbortSignal.timeout(12000),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; stored?: boolean; error?: string };
    if (!res.ok || !data.ok) return { ok: false, error: data.error ?? "No hemos podido enviar tu solicitud." };
    return { ok: true, stored: Boolean(data.stored) };
  } catch {
    return { ok: false, error: "No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo." };
  }
}
