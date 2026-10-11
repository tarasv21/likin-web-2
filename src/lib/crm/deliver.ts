/**
 * Where a validated lead goes (SERVER ONLY), in this version WITHOUT LIKIN CRM:
 *   1. the e-mail through Resend to the agency's inbox: the record of the lead, readable, with the
 *      exact lead-input@1 payload attached (lead-<id>.json) so it can be imported into the CRM later
 *      with the same id
 *   2. the optional legacy webhook (LEAD_WEBHOOK_URL; empty in Vercel today, i.e. disabled)
 * `stored` is true only when one of them has the lead; `channel` says which. With nothing configured
 * the behaviour is the historical one: `stored: false` (the result screen hands over the e-mail).
 */
import type { Lead } from "@/lib/qualify/types";
import { toLeadInput } from "./canonical";
import { emailConfigFromEnv, fallbackEmail, sendFallbackEmail } from "./fallback-email";

type Fetch = (input: string, init: RequestInit) => Promise<Response>;
export type Channel = "webhook" | "email" | "none";
export type Delivery = { stored: boolean; channel: Channel; emailed: boolean | null; webhook: boolean | null; configured: boolean; eventId: string };

export type DeliverDeps = {
  env: Record<string, string | undefined>;
  fetch?: Fetch;
  /** A fresh id/time, used only when the browser sent none (see toLeadInput). */
  fallbackEventId: string;
  fallbackSubmittedAt: string;
  /** The legacy webhook payload (the cleaned lead, as before). */
  webhookPayload: Record<string, unknown>;
};

async function forwardWebhook(url: string, payload: Record<string, unknown>, doFetch: Fetch): Promise<boolean> {
  try {
    const res = await doFetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(9000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** What the legacy webhook receives: the cleaned lead without the landing touch (no click ids). */
export function legacyWebhookPayload(clean: Record<string, unknown>): Record<string, unknown> {
  const legacy = { ...clean };
  delete legacy.touch;
  return legacy;
}

/** Only an http(s) URL counts as a configured webhook (anything else, e.g. "off", disables it). */
export function webhookUrlFrom(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? v : null;
  } catch {
    return null;
  }
}

export async function deliverLead(lead: Lead, deps: DeliverDeps): Promise<Delivery> {
  const doFetch: Fetch = deps.fetch ?? ((input, init) => fetch(input, init));
  const emailCfg = emailConfigFromEnv(deps.env);
  const webhookUrl = webhookUrlFrom(deps.env.LEAD_WEBHOOK_URL);
  const input = toLeadInput(lead, { fallbackEventId: deps.fallbackEventId, fallbackSubmittedAt: deps.fallbackSubmittedAt });
  const eventId = String(input.sourceEventId);
  const [webhook, emailed] = await Promise.all([
    webhookUrl ? forwardWebhook(webhookUrl, deps.webhookPayload, doFetch) : Promise.resolve(null),
    emailCfg ? sendFallbackEmail(emailCfg, fallbackEmail(lead, null, eventId, input), { fetch: doFetch }).then((r) => r.ok) : Promise.resolve(null),
  ]);
  const channel: Channel = emailed ? "email" : webhook ? "webhook" : "none";
  return { stored: channel !== "none", channel, emailed, webhook, configured: Boolean(emailCfg || webhookUrl), eventId };
}
