/**
 * Lead e-mail (SERVER ONLY) through Resend, to the agency's inbox.
 *   - Without the CRM (launch of the ads before the CRM): EVERY lead, and the e-mail is the
 *     record of the lead; a JSON attachment carries the exact lead-input@1 payload so the lead
 *     can be imported into the CRM later with the same id (no duplicates).
 *   - With the CRM: only when the CRM did not confirm the lead, saying plainly whether the CRM
 *     has it (kept in the intake tray, pending) or NOT — an e-mail is never presented as a CRM record.
 * An Idempotency-Key (event id + content) means a retried submission never sends a second copy.
 * Configuration: RESEND_API_KEY, LEAD_EMAIL_FROM (verified sender), LEAD_EMAIL_TO (optional).
 */
import { createHash } from "node:crypto";
import { findQuestion } from "@/lib/qualify/questions";
import type { Lead } from "@/lib/qualify/types";
import type { RelayResult } from "./relay";

export type EmailConfig = { apiKey: string; from: string; to: string };
export type EmailAttachment = { filename: string; content: string };
export type EmailMessage = { subject: string; text: string; replyTo?: string; attachments?: EmailAttachment[]; idempotencyKey?: string };
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
  if (!crm) return "CRM todavía no conectado: este email ES el registro del lead. Consérvalo. El adjunto JSON permite importarlo al CRM más adelante con el mismo id, sin duplicados.";
  if (crm.status === "received")
    return `Estado en el CRM: RECIBIDO en la bandeja de recepciones, PENDIENTE de procesar (${crm.pending ?? "pendiente"}). No es todavía un lead: revisa Ajustes → Datos → Recepciones.`;
  if (crm.status === "processed" || crm.status === "duplicate") return "Estado en el CRM: registrado.";
  return `Estado en el CRM: NO REGISTRADO (${crm.status}${crm.code ? ` · ${crm.code}` : ""}, ${crm.attempts} intento${crm.attempts === 1 ? "" : "s"}). Este email es la única copia: impórtalo al CRM con el adjunto JSON (mismo id, sin duplicados).`;
}

const line = (label: string, value: unknown) => (value === undefined || value === null || value === "" ? null : `${label}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);

/** «Pregunta: opción elegida» with the labels of the form; unknown ids stay as they are. */
export function readableAnswers(service: string | undefined, answers: Lead["answers"] | undefined): string[] {
  const out: string[] = [];
  for (const [id, v] of Object.entries(answers ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    const q = service === "BUILD" || service === "SCALE" ? findQuestion(service, id) : undefined;
    const label = (x: string) => q?.options?.find((o) => o.value === x)?.label ?? x;
    const value = Array.isArray(v) ? v.map((x) => label(String(x))).join(", ") : label(String(v));
    out.push(`  ${q?.prompt ?? id}: ${value}`);
  }
  return out;
}

export function fallbackEmail(lead: Lead, crm: RelayResult | null, eventId: string, payload?: unknown): EmailMessage {
  const pending = crm?.status === "received";
  const brand = lead.brand_name || lead.contact_name || "sin marca";
  const answers = readableAnswers(lead.service, lead.answers);
  const t = lead.touch;
  const score = typeof lead.lead_score === "number" ? ` · ${lead.lead_score}/100` : "";
  const text = [
    `Lead ${lead.service} desde likinagency.com`,
    "",
    crmStatusLine(crm),
    line("Prioridad estimada por la web (el CRM la recalculará)", lead.qualification ? `${lead.qualification}${score}${lead.next_action ? ` · siguiente paso: ${lead.next_action}` : ""}` : undefined),
    "",
    line("Nombre", lead.contact_name),
    line("Email", lead.email),
    line("Teléfono", lead.phone),
    line("Marca", lead.brand_name),
    line("Web / Instagram", lead.website ?? lead.instagram),
    line("Notas", lead.additional_notes),
    line("Consentimiento contacto", lead.consent_contact ? "sí" : "no"),
    line("Consentimiento comunicaciones", lead.consent_nurture ? "sí" : "no"),
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
  const subject = crm
    ? `[Lead ${lead.service}] ${brand} · ${pending ? "pendiente en el CRM" : crm.status === "processed" || crm.status === "duplicate" ? "registrado" : "NO registrado en el CRM"}`
    : `[Lead ${lead.service}${lead.qualification ? ` · ${lead.qualification}${score.replace(" · ", " ")}` : ""}] ${brand}`;
  const body = text.join("\n");
  const json = payload === undefined ? undefined : JSON.stringify(payload, null, 2);
  return {
    subject: subject.slice(0, 160),
    text: body,
    replyTo: typeof lead.email === "string" && EMAIL.test(lead.email) ? lead.email : undefined,
    attachments: json ? [{ filename: `lead-${eventId}.json`, content: Buffer.from(json, "utf8").toString("base64") }] : undefined,
    // Same submission and same content → same key → Resend never sends it twice (24 h window).
    idempotencyKey: `lead-email:${eventId}:${createHash("sha256").update(`${subject}\n${body}\n${json ?? ""}`).digest("hex").slice(0, 16)}`.slice(0, 256),
  };
}

/**
 * One send, retried once on network errors, timeouts, 429 and 5xx (safe: same Idempotency-Key).
 * Never retried on 4xx (bad key, unverified sender…): that needs a person.
 */
export async function sendFallbackEmail(cfg: EmailConfig, msg: EmailMessage, opts: { fetch?: Fetch; timeoutMs?: number; sleep?: (ms: number) => Promise<void> } = {}): Promise<{ ok: boolean; code?: string; attempts?: number }> {
  const doFetch: Fetch = opts.fetch ?? ((input, init) => fetch(input, init));
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const body = JSON.stringify({
    from: cfg.from,
    to: [cfg.to],
    ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
    subject: msg.subject,
    text: msg.text,
    ...(msg.attachments?.length ? { attachments: msg.attachments } : {}),
  });
  let last: { ok: boolean; code?: string } = { ok: false, code: "resend_network" };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await doFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json", ...(msg.idempotencyKey ? { "Idempotency-Key": msg.idempotencyKey } : {}) },
        body,
        signal: AbortSignal.timeout(opts.timeoutMs ?? 4000),
      });
      if (res.ok) return { ok: true, attempts: attempt };
      last = { ok: false, code: `resend_http_${res.status}` };
      if (res.status !== 429 && res.status < 500) return { ...last, attempts: attempt };
    } catch (e) {
      last = { ok: false, code: e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError") ? "resend_timeout" : "resend_network" };
    }
    if (attempt === 1) await sleep(400);
  }
  return { ...last, attempts: 2 };
}
