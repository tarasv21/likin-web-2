import { buildEvent, capiConfigFrom, clientIp, readCookie, sendCapi } from "@/lib/meta-capi";

/** La valoración del formulario (READY, HIGH_FIT, FIT, REVIEW o NOT_READY) si es válida. */
export function qualificationOf(lead: Record<string, unknown>): { qualification?: string } {
  const q = lead.qualification;
  return typeof q === "string" && /^(READY|HIGH_FIT|FIT|REVIEW|NOT_READY)$/.test(q) ? { qualification: q } : {};
}

/**
 * `_fbc` desde la llegada a la web (lead.touch) cuando no hay cookie: el fbclid del anuncio con la
 * hora del clic, en el formato de Meta. Sin fbclid válido, nada.
 */
export function fbcFromTouch(touch: unknown, nowMs: number): string | undefined {
  const t = (touch && typeof touch === "object" ? touch : {}) as { fbclid?: unknown; occurred_at?: unknown };
  const fbclid = typeof t.fbclid === "string" ? t.fbclid.trim() : "";
  if (!/^[A-Za-z0-9_.-]{10,500}$/.test(fbclid)) return undefined;
  const at = typeof t.occurred_at === "string" ? Date.parse(t.occurred_at) : NaN;
  return `fb.1.${Number.isFinite(at) && at <= nowMs ? at : nowMs}.${fbclid}`;
}

/**
 * El Lead de la API de Conversiones, desde el servidor, cuando la solicitud se ha recibido: solo si
 * el visitante aceptó las cookies de medición (`meta.consent`), con el id del lead como event_id (el
 * mismo que el píxel), la valoración de encaje que calculó el formulario (qualification) y su email,
 * teléfono y nombre normalizados y con hash SHA-256 aquí. Nunca
 * rompe la respuesta: la solicitud ya está recibida.
 */
export async function metaLeadFromRequest(req: Request, body: Record<string, unknown>, lead: Record<string, unknown>): Promise<void> {
  const meta = body.meta as { consent?: unknown; event_id?: unknown } | undefined;
  const eventId = typeof meta?.event_id === "string" ? meta.event_id : "";
  const config = capiConfigFrom({ pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID, token: process.env.META_CAPI_ACCESS_TOKEN, testCode: process.env.META_TEST_EVENT_CODE });
  if (!config || meta?.consent !== true || !/^[A-Za-z0-9_-]{8,100}$/.test(eventId) || eventId !== lead.lead_id) return;
  const cookies = req.headers.get("cookie");
  const text = (v: unknown) => (typeof v === "string" ? v : undefined);
  const result = await sendCapi(
    config,
    [
      await buildEvent({
        name: "Lead",
        id: eventId,
        url: req.headers.get("referer") ?? "https://www.likinagency.com/",
        ip: clientIp(req.headers),
        userAgent: req.headers.get("user-agent") ?? undefined,
        fbp: readCookie(cookies, "_fbp"),
        fbc: readCookie(cookies, "_fbc") ?? fbcFromTouch(lead.touch, Date.now()),
        custom: { content_name: String(lead.service ?? ""), content_category: "likinagency.com", ...qualificationOf(lead) },
        person: { email: text(lead.email), phone: text(lead.phone), name: text(lead.contact_name) },
      }),
    ],
    { timeoutMs: 2500 },
  );
  console.info("[meta-capi]", { event: "Lead", ok: result.ok, status: result.status, received: result.received, code: result.code });
}
