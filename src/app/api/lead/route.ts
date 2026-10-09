import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { deliverLead, legacyWebhookPayload } from "@/lib/crm/deliver";
import { createLimiter } from "@/lib/crm/rate-limit";
import type { Lead } from "@/lib/qualify/types";

/**
 * Lead intake for the qualification form.
 *
 * Validates the payload, then delivers it (src/lib/crm/deliver.ts): to LIKIN CRM through a
 * signed server-to-server relay when CRM_INGEST_URL / CRM_INGEST_KEY_ID / CRM_INGEST_SECRET are
 * set, to the optional legacy webhook (LEAD_WEBHOOK_URL) as before, and to a backup e-mail
 * (Resend) whenever the CRM did not confirm the lead. The response reports `stored` honestly:
 * false means nothing durable has the lead, and the UI says so instead of claiming success.
 * Secrets stay here: this module never runs in the browser.
 */
export const maxDuration = 30;

const MAX_BODY = 24_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Deliberately permissive: international numbers must not be rejected by a clever regex. */
const PHONE = /^[+()\d][\d\s().-]{6,24}$/;

const QUALIFICATIONS = new Set(["READY", "HIGH_FIT", "FIT", "REVIEW", "NOT_READY"]);
const ACTIONS = new Set(["STRIPE", "BOOK_CALL", "MANUAL_REVIEW", "NURTURE", "CLOSED"]);

/** 10 submissions per 10 minutes per IP and instance (best effort; a firewall rule adds a global one). */
const limited = createLimiter(10, 10 * 60 * 1000);

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : undefined);

export async function POST(req: Request) {
  // Same origin only: the form posts from this site (a missing Origin, e.g. a server, is allowed).
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return bad("Origen no permitido", 403);
    } catch {
      return bad("Origen no permitido", 403);
    }
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (limited(ip)) return bad("Has enviado varias solicitudes seguidas. Espera unos minutos y vuelve a intentarlo.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("JSON inválido");
  }
  if (!body || typeof body !== "object") return bad("Cuerpo inválido");
  const b = body as Record<string, unknown>;

  // Honeypot: a bot fills every field, a person never sees this one.
  if (typeof b.website_url === "string" && b.website_url.length > 0) return NextResponse.json({ ok: true, stored: false });

  const lead = b.lead as Record<string, unknown> | undefined;
  if (!lead || typeof lead !== "object") return bad("Falta el lead");
  const raw = JSON.stringify(lead);
  if (raw.length > MAX_BODY) return bad("Solicitud demasiado larga");

  if (lead.service !== "BUILD" && lead.service !== "SCALE") return bad("Servicio desconocido");
  // The browser's verdict is only a hint (the CRM recomputes it): checked when present, never required.
  if (lead.qualification !== undefined && (typeof lead.qualification !== "string" || !QUALIFICATIONS.has(lead.qualification))) return bad("Cualificación inválida");
  if (lead.next_action !== undefined && (typeof lead.next_action !== "string" || !ACTIONS.has(lead.next_action))) return bad("Acción inválida");

  const name = text(lead.contact_name, 120);
  const email = text(lead.email, 160);
  const phone = text(lead.phone, 40);
  if (!name || name.length < 2) return bad("Nombre inválido");
  if (!email || !EMAIL.test(email)) return bad("Email inválido");
  if (!phone || !PHONE.test(phone)) return bad("Teléfono inválido");
  // Personal data is only accepted with an explicit, affirmative consent.
  if (lead.consent_contact !== true) return bad("Falta el consentimiento para contactarte");

  const clean: Record<string, unknown> = {
    ...lead,
    contact_name: name,
    email,
    phone,
    brand_name: text(lead.brand_name, 200),
    additional_notes: text(lead.additional_notes, 2000),
    received_at: new Date().toISOString(),
    user_agent: req.headers.get("user-agent")?.slice(0, 200) ?? undefined,
  };

  const delivery = await deliverLead(clean as unknown as Lead, {
    env: process.env,
    fallbackEventId: `lead_${randomUUID()}`,
    fallbackSubmittedAt: new Date().toISOString(),
    // The legacy webhook keeps receiving exactly what it received before (no landing touch).
    webhookPayload: legacyWebhookPayload(clean),
  });

  // Log the shape and the outcome, never the personal data, the secret or the signature.
  console.info("[lead]", {
    event_id: delivery.eventId,
    service: clean.service,
    channel: delivery.channel,
    crm: delivery.crm?.status ?? "not_configured",
    crm_code: delivery.crm?.code,
    crm_attempts: delivery.crm?.attempts,
    emailed: delivery.emailed,
    webhook: delivery.webhook,
  });

  if (delivery.stored) return NextResponse.json({ ok: true, stored: true, channel: delivery.channel }, { headers: { "Cache-Control": "no-store" } });
  // Nothing configured: the historical behaviour (the result screen hands over the e-mail address).
  if (!delivery.configured) return NextResponse.json({ ok: true, stored: false, channel: "none" }, { headers: { "Cache-Control": "no-store" } });
  // Configured but nothing durable took it: the person can retry (same submission, same id).
  return bad("No hemos podido registrar tu solicitud. Inténtalo de nuevo y, si vuelve a fallar, escríbenos a taras@likinagency.com.", 502);
}
