// meta.ts: trackEvent(name, data) dispara el píxel y la API de Conversiones a la vez con el MISMO
// event_id (Meta cuenta uno). Solo con consentimiento: sin él, no sale nada hacia Meta.
// El Lead lo envía a la API el propio servidor (/api/lead) con el id del lead; aquí, solo el píxel.
import { CONTACT_LINKS, contactChannel, metaPixel, type MetaEventName, type MetaParams } from "@/lib/meta-pixel";
import { addEventSink } from "@/lib/qualify/events";

export const SITE = "likinagency.com";

export function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export const metaConsented = () => metaPixel.active;

export function trackEvent(name: MetaEventName, data: MetaParams = {}, opts: { eventId?: string; server?: boolean } = {}): string | null {
  if (!metaPixel.active) return null;
  const eventId = opts.eventId ?? newEventId();
  if (!metaPixel.track(name, data, eventId)) return null;
  if (opts.server !== false) {
    void fetch("/api/meta-capi", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event_name: name, event_id: eventId, event_source_url: location.href, custom_data: data, consent: true }),
    }).catch(() => undefined);
  }
  return eventId;
}

let wired = false;

/** Contact: clic en un enlace de email, teléfono o WhatsApp. Schedule: clic en el enlace de reserva (book_call_clicked). */
export function initConversionTracking(): void {
  if (wired || typeof document === "undefined") return;
  wired = true;
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>(CONTACT_LINKS);
      const channel = a ? contactChannel(a.getAttribute("href") ?? "") : null;
      if (channel) trackEvent("Contact", { content_name: channel, content_category: SITE });
    },
    { capture: true },
  );
  addEventSink((event, payload) => {
    if (event === "book_call_clicked") trackEvent("Schedule", { content_name: String(payload.service ?? ""), content_category: SITE });
  });
}
