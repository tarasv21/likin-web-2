/**
 * Backup e-mail (SERVER ONLY): when the CRM did not confirm the lead, the lead goes to the
 * agency's inbox through Resend so it is never lost. The message says plainly whether the CRM has
 * it (kept in the intake tray, pending) or NOT — an e-mail is never presented as a CRM record.
 * Configuration: RESEND_API_KEY, LEAD_EMAIL_FROM (verified sender), LEAD_EMAIL_TO (optional).
 */
import type { Lead } from "@/lib/qualify/types";
import type { RelayResult } from "./relay";

export type EmailConfig = { apiKey: string; from: string; to: string };
export type EmailMessage = { subject: string; text: string; replyTo?: string };
type Fetch = (input: string, init: RequestInit) => Promise<Response>;

const DEFAULT_TO = "taras@likinagency.com";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailConfigFromEnv(env: Record<string, string | undefined>): EmailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.LEAD_EMAIL_FROM?.trim();
  const to = env.LEAD_EMAIL_TO?.trim() || DEFAULT_TO;
  if (!apiKey || !from) return null;
  return { apiKey, from, to };
}

export function crmStatusLine(crm: RelayResult | null): string {
  if (!crm) return "Estado en el CRM: el envío al CRM no está configurado en esta web. Este email es la única copia del lead.";
  if (crm.status === "received")
    return `Estado en el CRM: RECIBIDO en la bandeja de recepciones, PENDIENTE de procesar (${crm.pending ?? "pendiente"}). No es todavía un lead: revisa Ajustes → Datos → Recepciones.`;
  if (crm.status === "processed" || crm.status === "duplicate") return "Estado en el CRM: registrado.";
  return `Estado en el CRM: NO REGISTRADO (${crm.status}${crm.code ? ` · ${crm.code}` : ""}, ${crm.attempts} intento${crm.attempts === 1 ? "" : "s"}). Este email es la única copia: añádelo al CRM a mano.`;
}

const line = (label: string, value: unknown) => (value === undefined || value === null || value === "" ? null : `${label}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);

export function fallbackEmail(lead: Lead, crm: RelayResult | null, eventId: string): EmailMessage {
  const pending = crm?.status === "received";
  const brand = lead.brand_name || lead.contact_name || "sin marca";
  const answers = Object.entries(lead.answers ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
  const t = lead.touch;
  const text = [
    `Lead ${lead.service} desde likinagency.com`,
    "",
    crmStatusLine(crm),
    "",
    line("Nombre", lead.contact_name),
    line("Email", lead.email),
    line("Teléfono", lead.phone),
    line("Marca", lead.brand_name),
    line("Web / Instagram", lead.website ?? lead.instagram),
    line("Notas", lead.additional_notes),
    line("Consentimiento contacto", lead.consent_contact ? "sí" : "no"),
    line("Consentimiento comunicaciones", lead.consent_nurture ? "sí" : "no"),
    line("Cualificación según la web (el CRM la recalcula)", lead.qualification),
    "",
    "Respuestas:",
    ...answers,
    "",
    "Origen de la visita:",
    line("  Aterrizaje", t?.landing_path),
    line("  Referrer", t?.referrer_host),
    line("  utm_source / medium / campaign", [t?.utm_source, t?.utm_medium, t?.utm_campaign].filter(Boolean).join(" / ") || undefined),
    line("  utm_content / term / id", [t?.utm_content, t?.utm_term, t?.utm_id].filter(Boolean).join(" / ") || undefined),
    line("  Click id", [t?.fbclid ? "fbclid" : null, t?.gclid ? "gclid" : null, t?.ttclid ? "ttclid" : null].filter(Boolean).join(", ") || undefined),
    line("  CTA", lead.source),
    "",
    `Id del envío: ${eventId}`,
  ].filter((x): x is string => x !== null);
  return {
    subject: `[Lead ${lead.service}] ${brand} · ${pending ? "pendiente en el CRM" : crm && (crm.status === "processed" || crm.status === "duplicate") ? "registrado" : "NO registrado en el CRM"}`.slice(0, 160),
    text: text.join("\n"),
    replyTo: typeof lead.email === "string" && EMAIL.test(lead.email) ? lead.email : undefined,
  };
}

export async function sendFallbackEmail(cfg: EmailConfig, msg: EmailMessage, opts: { fetch?: Fetch; timeoutMs?: number } = {}): Promise<{ ok: boolean; code?: string }> {
  const doFetch: Fetch = opts.fetch ?? ((input, init) => fetch(input, init));
  try {
    const res = await doFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: cfg.from, to: [cfg.to], ...(msg.replyTo ? { reply_to: msg.replyTo } : {}), subject: msg.subject, text: msg.text }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 4000),
    });
    return res.ok ? { ok: true } : { ok: false, code: `resend_http_${res.status}` };
  } catch (e) {
    return { ok: false, code: e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError") ? "resend_timeout" : "resend_network" };
  }
}
