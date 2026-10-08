/**
 * Where a validated lead goes (SERVER ONLY), in order of trust:
 *   1. LIKIN CRM (signed relay)            → `crm`
 *   2. the optional legacy webhook          → `webhook` (unchanged behaviour, independent)
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

export async function deliverLead(lead: Lead, deps: DeliverDeps): Promise<Delivery> {
  const doFetch: Fetch = deps.fetch ?? ((input, init) => fetch(input, init));
  const crmCfg = crmConfigFromEnv(deps.env);
  const emailCfg = emailConfigFromEnv(deps.env);
  const webhookUrl = deps.env.LEAD_WEBHOOK_URL?.trim() || null;
  const input = toLeadInput(lead, { fallbackEventId: deps.fallbackEventId, fallbackSubmittedAt: deps.fallbackSubmittedAt });
  const eventId = String(input.sourceEventId);

  const [crm, webhook] = await Promise.all([
    crmCfg ? relayToCrm(input, crmCfg, { fetch: doFetch, ...deps.relay }) : Promise.resolve(null),
    webhookUrl ? forwardWebhook(webhookUrl, deps.webhookPayload, doFetch) : Promise.resolve(null),
  ]);

  let emailed: boolean | null = null;
  if (emailCfg && !isConfirmedLead(crm?.status)) {
    emailed = (await sendFallbackEmail(emailCfg, fallbackEmail(lead, crm, eventId), { fetch: doFetch })).ok;
  }

  const channel: Channel = isConfirmedLead(crm?.status) ? "crm" : isInCrm(crm?.status) ? "crm_pending" : webhook ? "webhook" : emailed ? "email" : "none";
  return { stored: channel !== "none", channel, crm, emailed, webhook, configured: Boolean(crmCfg || emailCfg || webhookUrl), eventId };
}
