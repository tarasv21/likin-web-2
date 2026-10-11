// meta.ts: trackEvent(name, data) dispara el píxel y la API de Conversiones a la vez con el MISMO
// event_id (Meta cuenta uno). Solo con consentimiento: sin él, no sale nada hacia Meta.
// El Lead lo envía a la API el propio servidor (/api/lead) con el id del lead; aquí, solo el píxel.
import { CONTACT_LINKS, contactChannel, metaPixel, type MetaEventName, type MetaParams } from "@/lib/meta-pixel";
import { addEventSink, type EventPayload, type QualifyEvent } from "@/lib/qualify/events";

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

/** ViewContent de una página: los dos servicios y cada caso de /work. Null en el resto. */
export function viewContentFor(pathname: string): MetaParams | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/escalar-ecommerce") return { content_name: "SCALE", content_category: SITE };
  if (path === "/crear-tienda-online") return { content_name: "BUILD", content_category: SITE };
  const work = /^\/work\/([a-z0-9-]{1,60})$/.exec(path);
  return work ? { content_name: `caso/${work[1]}`, content_category: SITE } : null;
}

/** El evento de Meta de un evento del formulario (src/lib/qualify/events.ts), o null. */
export function metaEventFor(event: QualifyEvent, payload: EventPayload): { name: MetaEventName; data: MetaParams } | null {
  const service = typeof payload.service === "string" ? payload.service : "";
  if (event === "qualification_form_opened") return { name: "AbrirFormulario", data: { content_name: service, content_category: SITE, cta: String(payload.source ?? "").slice(0, 60) } };
  if (event === "qualification_contact_reached") return { name: "PasoContacto", data: { content_name: service, content_category: SITE } };
  if (event === "book_call_clicked") return { name: "Schedule", data: { content_name: service, content_category: SITE } };
  if (event === "build_checkout_clicked") return { name: "InitiateCheckout", data: { content_name: "BUILD", content_category: SITE } };
  return null;
}

/**
 * El mapeo con memoria por formulario: un solo PasoContacto por formulario abierto (la última
 * pregunta avanza sola y un clic en «Continuar» a la vez la marcaría dos veces).
 */
export function createFormEventMapper() {
  let reachedContact = false;
  return (event: QualifyEvent, payload: EventPayload) => {
    if (event === "qualification_form_opened") reachedContact = false;
    if (event === "qualification_contact_reached") {
      if (reachedContact) return null;
      reachedContact = true;
    }
    return metaEventFor(event, payload);
  };
}

let wired = false;

/** Contact: clic en un enlace de email, teléfono o WhatsApp. Del formulario: ver metaEventFor. */
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
  const mapEvent = createFormEventMapper();
  addEventSink((event, payload) => {
    const meta = mapEvent(event, payload);
    if (meta) trackEvent(meta.name, meta.data);
  });
}
