/**
 * Where a validated lead goes (SERVER ONLY), in order of trust:
 *   1. LIKIN CRM (signed relay)            → `crm`
 *   2. the optional legacy webhook          → `webhook` (every lead without the CRM; with it, only when the CRM does not have the lead)
 *   3. the backup e-mail when the CRM did not confirm a lead (down, slow, rejected, pending)
 * `stored` is true only when some durable channel has the lead; `channel` says which, so nothing
 * claims "in the CRM" when only the e-mail has it. With nothing configured the behaviour is the
 * historical one: `stored: false` (the result screen hands over the e-mail address).
 */
import type { Lead } from "@/lib/qualify/types";
import { toLeadInput } from "./canonical";
import { emailConfigFromEnv, fallbackEmail, sendFallbackEmail } from "./fallback-email";
import { crmConfigFromEnv, isConfirmedLead, isInCrm, relayToCrm, type RelayOptions, type RelayResult } from "./relay";

type Fetch = (input: string, init: RequestInit) => Promise<Response>;
export type Channel = "crm" | "crm_pending" | "webhook" | "email" | "none";
export type Delivery = { stored: boolean; channel: Channel; crm: RelayResult | null; emailed: boolean | null; webhook: boolean | null; configured: boolean; eventId: string };

export type DeliverDeps = {
  env: Record<string, string | undefined>;
  fetch?: Fetch;
  relay?: RelayOptions;
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
  const crmCfg = crmConfigFromEnv(deps.env);
  const emailCfg = emailConfigFromEnv(deps.env);
  const webhookUrl = webhookUrlFrom(deps.env.LEAD_WEBHOOK_URL);
  const input = toLeadInput(lead, { fallbackEventId: deps.fallbackEventId, fallbackSubmittedAt: deps.fallbackSubmittedAt });
  const eventId = String(input.sourceEventId);

  // Without the CRM the legacy webhook keeps receiving every lead, exactly as before. With the CRM,
  // the webhook is a BACKUP like the e-mail: only when the CRM does not have the lead, so the same
  // lead never lands in both systems (no duplicates).
  const crm = crmCfg ? await relayToCrm(input, crmCfg, { fetch: doFetch, ...deps.relay }) : null;
  const useWebhook = webhookUrl !== null && (!crmCfg || !isInCrm(crm?.status));
  const [webhook, emailed] = await Promise.all([
    useWebhook ? forwardWebhook(webhookUrl, deps.webhookPayload, doFetch) : Promise.resolve(null),
    emailCfg && !isConfirmedLead(crm?.status) ? sendFallbackEmail(emailCfg, fallbackEmail(lead, crm, eventId, input), { fetch: doFetch }).then((r) => r.ok) : Promise.resolve(null),
  ]);

  const channel: Channel = isConfirmedLead(crm?.status) ? "crm" : isInCrm(crm?.status) ? "crm_pending" : webhook ? "webhook" : emailed ? "email" : "none";
  return { stored: channel !== "none", channel, crm, emailed, webhook, configured: Boolean(crmCfg || emailCfg || webhookUrl), eventId };
}
