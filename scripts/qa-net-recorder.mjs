/**
 * SOLO PRUEBAS · precarga para un servidor LOCAL (NODE_OPTIONS="--import ./scripts/qa-net-recorder.mjs"):
 * responde en local a api.resend.com y graph.facebook.com y apunta en $QA_NET_RECORD lo que se habría
 * enviado (el token de Meta se sustituye por «<token>»). Nada sale de la máquina.
 */
import { appendFileSync } from "node:fs";

const out = process.env.QA_NET_RECORD;
const real = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("https://api.resend.com/") || url.startsWith("https://graph.facebook.com/")) {
    let body = {};
    try {
      body = JSON.parse(init.body);
    } catch {}
    if (body.access_token) body.access_token = "<token>";
    const h = new Headers(init.headers ?? {});
    appendFileSync(out, JSON.stringify({ to: new URL(url).host, path: new URL(url).pathname, idempotencyKey: h.get("idempotency-key") ?? undefined, body }) + "\n");
    const reply = url.includes("graph.facebook.com") ? { events_received: (body.data ?? []).length } : { id: "local-test" };
    return new Response(JSON.stringify(reply), { status: 200, headers: { "content-type": "application/json" } });
  }
  return real(input, init);
};
