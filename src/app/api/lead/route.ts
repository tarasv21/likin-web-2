import { NextResponse } from "next/server";

/**
 * Lead intake for the qualification form.
 *
 * There is no CRM yet. This validates the payload and, when LEAD_WEBHOOK_URL is set
 * (Make, Zapier, n8n, Slack…), forwards it. The response reports `stored` honestly: false
 * means nothing was persisted anywhere, and the UI says so rather than claiming success.
 *
 * To connect the CRM later, replace `deliver()` with a server-side API call. Keep the
 * secret here: this module never runs in the browser.
 */
const MAX_BODY = 24_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Deliberately permissive: international numbers must not be rejected by a clever regex. */
const PHONE = /^[+()\d][\d\s().-]{6,24}$/;

const QUALIFICATIONS = new Set(["READY", "HIGH_FIT", "FIT", "REVIEW", "NOT_READY"]);
const ACTIONS = new Set(["STRIPE", "BOOK_CALL", "MANUAL_REVIEW", "NURTURE", "CLOSED"]);

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : undefined);

export async function POST(req: Request) {
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
  if (typeof lead.qualification !== "string" || !QUALIFICATIONS.has(lead.qualification)) return bad("Cualificación inválida");
  if (typeof lead.next_action !== "string" || !ACTIONS.has(lead.next_action)) return bad("Acción inválida");

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

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    // Log the shape, never the personal data.
    console.info("[lead] LEAD_WEBHOOK_URL not set — nothing persisted.", {
      lead_id: clean.lead_id,
      service: clean.service,
      qualification: clean.qualification,
      next_action: clean.next_action,
      lead_score: clean.lead_score,
      reasons: clean.qualification_reasons,
    });
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const res = await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(clean), signal: AbortSignal.timeout(9000) });
    if (!res.ok) return bad("No hemos podido registrar tu solicitud. Inténtalo de nuevo.", 502);
  } catch {
    return bad("No hemos podido registrar tu solicitud. Inténtalo de nuevo.", 502);
  }
  return NextResponse.json({ ok: true, stored: true });
}
