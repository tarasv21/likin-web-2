import { capiConfigFrom, createLimiter, handleBrowserEvent } from "@/lib/meta-capi";

/**
 * POST /api/meta-capi: eventos del navegador (PageView, Contact, Schedule) hacia la API de
 * Conversiones de Meta, con el mismo event_id que el píxel. Solo con consentimiento y desde esta web
 * (src/lib/meta-capi.ts). El Lead lo envía /api/lead cuando la solicitud se ha recibido.
 */
const limited = createLimiter(60, 60_000);

export async function POST(req: Request) {
  return handleBrowserEvent(req, {
    config: capiConfigFrom({ pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID, token: process.env.META_CAPI_ACCESS_TOKEN, testCode: process.env.META_TEST_EVENT_CODE }),
    limited,
    log: (fields) => console.info("[meta-capi]", fields),
  });
}
