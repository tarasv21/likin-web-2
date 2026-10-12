// meta.ts: trackEvent(name, data) dispara el píxel y la API de Conversiones a la vez con el MISMO
// event_id (Meta cuenta uno). Solo con el consentimiento de publicidad: sin él, no sale nada hacia
// Meta. En likinagency.com solo PageView (aquí) y Lead (el formulario, con el servidor).
// El Lead lo envía a la API el propio servidor (/api/lead) con el id del lead; aquí, solo el píxel.
import { metaPixel, type MetaEventName, type MetaParams } from "@/lib/meta-pixel";

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
