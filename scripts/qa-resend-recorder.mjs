/**
 * TEST ONLY · preload for a LOCAL `next start` (NODE_OPTIONS="--import ./scripts/qa-resend-recorder.mjs"):
 * answers the server's calls to api.resend.com locally and appends to $RESEND_RECORD exactly what
 * would have been sent (headers summarised). Nothing reaches Resend. Used by scripts/qa-launch.mjs.
 */
import { appendFileSync } from "node:fs";
const out = process.env.RESEND_RECORD;
const real = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.startsWith("https://api.resend.com/")) {
    const headers = Object.fromEntries(new Headers(init.headers).entries());
    appendFileSync(out, JSON.stringify({ idempotencyKey: headers["idempotency-key"] ?? null, auth: headers.authorization ? "present" : "missing", body: JSON.parse(init.body) }) + "\n");
    return new Response(JSON.stringify({ id: "local-test" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return real(input, init);
};
