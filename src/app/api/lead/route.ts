import { NextResponse } from "next/server";

/**
 * Lead intake for BUILD (pre-qualification) and SCALE (application).
 * No CRM yet: the payload is validated and, when LEAD_WEBHOOK_URL is set
 * (Make, Zapier, Slack, Notion, n8n…), forwarded as JSON. Without it, logged server-side.
 */
type LeadKind = "build" | "scale";
const MAX = 8000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const bad = (msg: string, status = 400) => NextResponse.json({ ok: false, error: msg }, { status });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("JSON inválido");
  }
  if (!body || typeof body !== "object") return bad("Cuerpo inválido");
  const b = body as Record<string, unknown>;

  const kind = b.kind as LeadKind;
  if (kind !== "build" && kind !== "scale") return bad("Tipo de lead desconocido");
  const name = String(b.name ?? "").trim();
  const email = String(b.email ?? "").trim();
  if (name.length < 2 || name.length > 120) return bad("Nombre inválido");
  if (!EMAIL.test(email)) return bad("Email inválido");
  if (typeof b.website_url === "string" && b.website_url.length > 0) return NextResponse.json({ ok: true }); // honeypot

  const answers = b.answers && typeof b.answers === "object" ? (b.answers as Record<string, unknown>) : {};
  if (JSON.stringify(answers).length > MAX) return bad("Respuestas demasiado largas");

  const lead = {
    kind,
    name,
    email,
    brand: typeof b.brand === "string" ? b.brand.slice(0, 200) : undefined,
    phone: typeof b.phone === "string" ? b.phone.slice(0, 40) : undefined,
    fit: typeof b.fit === "string" ? b.fit.slice(0, 40) : undefined,
    answers,
    source: typeof b.source === "string" ? b.source.slice(0, 200) : undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
    receivedAt: new Date().toISOString(),
  };

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(lead), signal: AbortSignal.timeout(8000) });
      if (!res.ok) return bad("No hemos podido registrar tu solicitud. Inténtalo de nuevo.", 502);
    } catch {
      return bad("No hemos podido registrar tu solicitud. Inténtalo de nuevo.", 502);
    }
  } else {
    console.info("[lead] LEAD_WEBHOOK_URL not set — lead logged only:", JSON.stringify(lead));
  }
  return NextResponse.json({ ok: true });
}
