/**
 * The CRM relay of likinagency.com: HMAC (golden vector shared with LIKIN CRM), retries and honest
 * statuses, the deterministic lead-input@1 payload, the backup e-mail, the delivery decision,
 * the landing touch and the rate limiter. Fictional data only; no network (fetch is faked).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { crmConfigFromEnv, isInCrm, relayToCrm, signBody } from "../src/lib/crm/relay.ts";
import { boundedAnswers, toLeadInput } from "../src/lib/crm/canonical.ts";
import { crmStatusLine, emailConfigFromEnv, fallbackEmail, sendFallbackEmail } from "../src/lib/crm/fallback-email.ts";
import { deliverLead } from "../src/lib/crm/deliver.ts";
import { touchFrom } from "../src/lib/attribution/landing.ts";
import { createLimiter } from "../src/lib/crm/rate-limit.ts";

const SECRET = "test-secret-not-a-real-key-0123456789abcdef";
const CFG = { url: "https://crm.example/api/ingest/web", keyId: "lk-test-0001", secret: SECRET };
const ENV = { CRM_INGEST_URL: CFG.url, CRM_INGEST_KEY_ID: CFG.keyId, CRM_INGEST_SECRET: SECRET };
const EMAIL_ENV = { RESEND_API_KEY: "re_test_not_real", LEAD_EMAIL_FROM: "Web <web@likin.example>" };
const fast = { sleep: async () => {}, budgetMs: 2000, attemptTimeoutMs: 500 };

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

/** A fake fetch: answers by URL with a queue of responses (or a function), records every call. */
function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: init.body, headers: init.headers });
    const route = routes[url] ?? routes["*"];
    const next = Array.isArray(route) ? route.shift() : route;
    if (typeof next === "function") return next(init);
    if (next instanceof Error) throw next;
    if (!next) throw new TypeError("fetch failed");
    return next;
  };
  fn.calls = calls;
  return fn;
}

const lead = (over = {}) => ({
  lead_id: "lead_6f1c2a3b-0000-4000-8000-000000000001",
  created_at: "2026-10-09T10:00:00.000Z",
  form_version: "2026-09-qualify-1",
  source: "/escalar-ecommerce#hero",
  landing_page: "/escalar-ecommerce",
  service: "SCALE",
  qualification: "HIGH_FIT",
  lead_score: 82,
  qualification_reasons: [],
  requires_manual_review: false,
  next_action: "BOOK_CALL",
  brand_name: "Marca Ejemplo",
  business_role: "FOUNDER",
  contact_name: "Ana Ejemplo",
  email: "ana@marca.example",
  phone: "+34 600 000 000",
  additional_notes: "Hola",
  consent_contact: true,
  consent_nurture: false,
  answers: { monthly_revenue: "25K_50K", brand_link: "marca.example", main_bottlenecks: ["MORE_CUSTOMERS"] },
  touch: { occurred_at: "2026-10-09T09:55:00.000Z", landing_path: "/escalar-ecommerce", referrer_host: "l.facebook.com", utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "SCALE_COLD", utm_id: "120210", fbclid: "fb.1.test" },
  ...over,
});

describe("HMAC signature", () => {
  test("golden vector shared with LIKIN CRM (src/server/ingest/hmac.ts)", () => {
    assert.equal(signBody("golden-vector-secret", "1790000000", JSON.stringify({ hello: "likin" })), "v1=5066748e9a0848bd342b7c584174ca66a460c2e03e04bfc6613538e8fd6aef21");
  });
  test("config: all three variables, https (or localhost), a key id and a long secret", () => {
    assert.deepEqual(crmConfigFromEnv(ENV), CFG);
    assert.equal(crmConfigFromEnv({ ...ENV, CRM_INGEST_SECRET: undefined }), null);
    assert.equal(crmConfigFromEnv({ ...ENV, CRM_INGEST_URL: "http://crm.example/api/ingest/web" }), null);
    assert.ok(crmConfigFromEnv({ ...ENV, CRM_INGEST_URL: "http://localhost:3000/api/ingest/web" }));
    assert.equal(crmConfigFromEnv({ ...ENV, CRM_INGEST_KEY_ID: "Bad Id" }), null);
    assert.equal(crmConfigFromEnv({ ...ENV, CRM_INGEST_SECRET: "short" }), null);
  });
});

describe("relay to the CRM", () => {
  test("processed: signed headers over the exact body; nothing secret in the request but the signature", async () => {
    const f = fakeFetch({ [CFG.url]: [json(200, { status: "processed", eventId: "x", receipt: "r1" })] });
    const r = await relayToCrm({ a: 1 }, CFG, { fetch: f, ...fast });
    assert.deepEqual(r, { status: "processed", attempts: 1, httpStatus: 200, receipt: "r1" });
    const { headers, body } = f.calls[0];
    assert.equal(headers["x-likin-key-id"], CFG.keyId);
    const expected = "v1=" + createHmac("sha256", SECRET).update(`${headers["x-likin-timestamp"]}.${body}`).digest("hex");
    assert.equal(headers["x-likin-signature"], expected);
    assert.equal(body, JSON.stringify({ a: 1 }));
    assert.ok(!JSON.stringify(f.calls[0].init).includes(SECRET));
  });
  test("503 then processed: retried with the SAME body (idempotent in the CRM)", async () => {
    const f = fakeFetch({ [CFG.url]: [json(503, { status: "retryable_failure", code: "store_unavailable" }), json(200, { status: "duplicate", receipt: "r1" })] });
    const r = await relayToCrm({ a: 1 }, CFG, { fetch: f, ...fast });
    assert.equal(r.status, "duplicate");
    assert.equal(r.attempts, 2);
    assert.equal(f.calls[0].body, f.calls[1].body);
  });
  test("response lost after the CRM processed the lead: the retry gets duplicate (stored once, confirmed)", async () => {
    const seen = new Set();
    let processed = 0;
    const crm = (init) => {
      if (seen.has(init.body)) return json(200, { status: "duplicate", receipt: "r-lost" });
      seen.add(init.body);
      processed += 1;
      throw new TypeError("socket hang up"); // processed in the CRM, answer lost on the way back
    };
    const f = fakeFetch({ [CFG.url]: [crm, crm] });
    const r = await relayToCrm({ a: 1 }, CFG, { fetch: f, ...fast });
    assert.equal(r.status, "duplicate");
    assert.equal(r.attempts, 2);
    assert.equal(processed, 1);
    assert.ok(isInCrm(r.status));
  });
  test("4xx is never retried", async () => {
    const f = fakeFetch({ [CFG.url]: [json(422, { status: "rejected", code: "invalid_input" })] });
    const r = await relayToCrm({ a: 1 }, CFG, { fetch: f, ...fast });
    assert.deepEqual(r, { status: "rejected", attempts: 1, httpStatus: 422, code: "invalid_input" });
    assert.equal(f.calls.length, 1);
  });
  test("network errors three times → unreachable", async () => {
    const f = fakeFetch({ [CFG.url]: [new TypeError("fetch failed"), new TypeError("fetch failed"), new TypeError("fetch failed")] });
    const r = await relayToCrm({ a: 1 }, CFG, { fetch: f, ...fast });
    assert.deepEqual(r, { status: "unreachable", attempts: 3, code: "network" });
  });
  test("202 received is durable in the CRM but not a lead yet", async () => {
    const f = fakeFetch({ [CFG.url]: [json(202, { status: "received", pending: "retry", receipt: "r2" })] });
    const r = await relayToCrm({ a: 1 }, CFG, { fetch: f, ...fast });
    assert.equal(r.status, "received");
    assert.equal(r.pending, "retry");
    assert.ok(isInCrm(r.status));
  });
  test("429 with a Retry-After beyond the budget stops at once; a redirect is a misconfiguration", async () => {
    const r1 = await relayToCrm({ a: 1 }, CFG, { fetch: fakeFetch({ [CFG.url]: [json(429, { status: "retryable_failure", code: "rate_limited" }, { "retry-after": "60" })] }), ...fast });
    assert.deepEqual(r1, { status: "retryable_failure", attempts: 1, httpStatus: 429, code: "rate_limited" });
    const r2 = await relayToCrm({ a: 1 }, CFG, { fetch: fakeFetch({ [CFG.url]: [new Response(null, { status: 302, headers: { location: "/login" } })] }), ...fast });
    assert.equal(r2.status, "rejected");
    assert.equal(r2.code, "redirect");
  });
  test("a slow CRM times out per attempt and the whole relay stays inside its budget", async () => {
    const hang = (init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason)));
    const started = Date.now();
    const r = await relayToCrm({ a: 1 }, CFG, { fetch: fakeFetch({ [CFG.url]: hang }), sleep: async () => {}, budgetMs: 900, attemptTimeoutMs: 300 });
    assert.equal(r.status, "unreachable");
    assert.equal(r.code, "timeout");
    assert.ok(Date.now() - started < 1500);
  });
});

describe("lead-input@1 payload", () => {
  test("deterministic: the same pending lead always gives the same bytes (no clock, no randomness)", () => {
    const opts = { fallbackEventId: "lead_fallback_1", fallbackSubmittedAt: "2026-10-09T10:00:05.000Z" };
    assert.equal(JSON.stringify(toLeadInput(lead(), opts)), JSON.stringify(toLeadInput(lead(), { fallbackEventId: "other", fallbackSubmittedAt: "2030-01-01T00:00:00.000Z" })));
  });
  test("shape: event id, form, identity, company, answers, consent, session touch without query string, client verdict as a hint", () => {
    const p = toLeadInput({ ...lead(), user_agent: "Mozilla", received_at: "x", ip: "1.2.3.4" }, { fallbackEventId: "f", fallbackSubmittedAt: "2026-10-09T10:00:05.000Z" });
    assert.equal(p.schema, "lead-input@1");
    assert.equal(p.source, "web");
    assert.equal(p.site, "likinagency.com");
    assert.equal(p.sourceEventId, "lead_6f1c2a3b-0000-4000-8000-000000000001");
    assert.deepEqual(p.form, { key: "LK-SCALE", version: "2026-09-qualify-1" });
    assert.deepEqual(p.identity, { name: "Ana Ejemplo", email: "ana@marca.example", phone: "+34 600 000 000", businessRole: "FOUNDER" });
    assert.deepEqual(p.company, { name: "Marca Ejemplo", link: "marca.example" });
    assert.deepEqual(p.consent, { contact: true, marketing: false, policyVersion: "likinagency-privacidad@2026-09" });
    assert.deepEqual(p.clientVerdict, { qualification: "HIGH_FIT", leadScore: 82 });
    assert.deepEqual(p.metadata, { pagePath: "/escalar-ecommerce", sourceCta: "/escalar-ecommerce#hero" });
    assert.deepEqual(p.attribution.session, {
      occurredAt: "2026-10-09T09:55:00.000Z", landingUrl: "https://likinagency.com/escalar-ecommerce", landingPath: "/escalar-ecommerce", referrerHost: "l.facebook.com",
      utmSource: "facebook", utmMedium: "paid_social", utmCampaign: "SCALE_COLD", utmId: "120210", fbclid: "fb.1.test",
    });
    const text = JSON.stringify(p);
    for (const leaked of ["Mozilla", "1.2.3.4", "received_at", "user_agent", "qualification_reasons", "next_action"]) assert.ok(!text.includes(leaked), leaked);
  });
  test("bounded: junk answers dropped, long text cut, an unusable browser id replaced, no verdict when it is not valid", () => {
    assert.deepEqual(boundedAnswers({ ok: "a", "Bad-Key": "x", n: 5, list: ["x", 3, "y"], big: "z".repeat(5000) }), { ok: "a", list: ["x", "y"], big: "z".repeat(2000) });
    const p = toLeadInput(lead({ lead_id: "<script>", qualification: "SUPER", lead_score: 999, created_at: "ayer" }), { fallbackEventId: "lead_server_1", fallbackSubmittedAt: "2026-10-09T10:00:05.000Z" });
    assert.equal(p.sourceEventId, "lead_server_1");
    assert.equal(p.submittedAt, "2026-10-09T10:00:05.000Z");
    assert.equal(p.clientVerdict, undefined);
    assert.deepEqual(toLeadInput(lead({ service: "BUILD" }), { fallbackEventId: "f", fallbackSubmittedAt: "x" }).form, { key: "LK-BUILD", version: "2026-09-qualify-1" });
  });
});

describe("backup e-mail", () => {
  test("never claims the CRM has the lead when it does not", () => {
    const down = fallbackEmail(lead(), { status: "unreachable", attempts: 3, code: "timeout" }, "lead_1");
    assert.match(down.subject, /NO registrado en el CRM/);
    assert.match(down.text, /NO REGISTRADO \(unreachable · timeout, 3 intentos\)/);
    assert.equal(down.replyTo, "ana@marca.example");
    const pending = fallbackEmail(lead(), { status: "received", attempts: 1, pending: "retry" }, "lead_1");
    assert.match(pending.subject, /pendiente en el CRM/);
    assert.match(pending.text, /PENDIENTE de procesar/);
    assert.match(crmStatusLine(null), /no está configurado/);
    assert.match(down.text, /utm_source \/ medium \/ campaign: facebook \/ paid_social \/ SCALE_COLD/);
  });
  test("sent through Resend with the configured sender; failures are reported, not hidden", async () => {
    const cfg = emailConfigFromEnv(EMAIL_ENV);
    assert.deepEqual(cfg, { apiKey: "re_test_not_real", from: "Web <web@likin.example>", to: "taras@likinagency.com" });
    const f = fakeFetch({ "https://api.resend.com/emails": [json(200, { id: "e1" }), json(500, {}), new TypeError("fetch failed")] });
    assert.deepEqual(await sendFallbackEmail(cfg, { subject: "s", text: "t", replyTo: "a@b.example" }, { fetch: f }), { ok: true });
    const sent = JSON.parse(f.calls[0].body);
    assert.deepEqual(sent, { from: "Web <web@likin.example>", to: ["taras@likinagency.com"], reply_to: "a@b.example", subject: "s", text: "t" });
    assert.equal(f.calls[0].headers.Authorization, "Bearer re_test_not_real");
    assert.deepEqual(await sendFallbackEmail(cfg, { subject: "s", text: "t" }, { fetch: f }), { ok: false, code: "resend_http_500" });
    assert.deepEqual(await sendFallbackEmail(cfg, { subject: "s", text: "t" }, { fetch: f }), { ok: false, code: "resend_network" });
    assert.equal(emailConfigFromEnv({ RESEND_API_KEY: "x" }), null);
  });
});

describe("delivery decision (what the visitor is told)", () => {
  const deps = (env, fetch) => ({ env, fetch, relay: fast, fallbackEventId: "lead_fb", fallbackSubmittedAt: "2026-10-09T10:00:05.000Z", webhookPayload: { lead_id: "x" } });
  const RESEND = "https://api.resend.com/emails";

  test("CRM processed → stored in the CRM, no e-mail", async () => {
    const f = fakeFetch({ [CFG.url]: [json(200, { status: "processed", receipt: "r" })], [RESEND]: [json(200, {})] });
    const d = await deliverLead(lead(), deps({ ...ENV, ...EMAIL_ENV }, f));
    assert.deepEqual({ stored: d.stored, channel: d.channel, emailed: d.emailed }, { stored: true, channel: "crm", emailed: null });
    assert.equal(f.calls.filter((c) => c.url === RESEND).length, 0);
  });
  test("CRM down → the backup e-mail keeps the lead, and says it is NOT in the CRM", async () => {
    const f = fakeFetch({ [CFG.url]: [new TypeError("x"), new TypeError("x"), new TypeError("x")], [RESEND]: [json(200, {})] });
    const d = await deliverLead(lead(), deps({ ...ENV, ...EMAIL_ENV }, f));
    assert.deepEqual({ stored: d.stored, channel: d.channel, emailed: d.emailed, crm: d.crm.status }, { stored: true, channel: "email", emailed: true, crm: "unreachable" });
    const mail = JSON.parse(f.calls.find((c) => c.url === RESEND).body);
    assert.match(mail.subject, /NO registrado en el CRM/);
    assert.ok(!mail.text.includes(SECRET));
  });
  test("CRM down and no backup → nothing stored: the route answers 502 and the person can retry", async () => {
    const f = fakeFetch({ [CFG.url]: [json(500, {}), json(500, {}), json(500, {})] });
    const d = await deliverLead(lead(), deps({ ...ENV }, f));
    assert.deepEqual({ stored: d.stored, channel: d.channel, configured: d.configured }, { stored: false, channel: "none", configured: true });
  });
  test("CRM received (pending in the tray) → durable, plus an e-mail so nothing waits silently", async () => {
    const f = fakeFetch({ [CFG.url]: [json(202, { status: "received", pending: "review" })], [RESEND]: [json(200, {})] });
    const d = await deliverLead(lead(), deps({ ...ENV, ...EMAIL_ENV }, f));
    assert.deepEqual({ stored: d.stored, channel: d.channel, emailed: d.emailed }, { stored: true, channel: "crm_pending", emailed: true });
  });
  test("CRM rejects (bad key) → backup e-mail; nothing configured → the historical stored:false", async () => {
    const f = fakeFetch({ [CFG.url]: [json(401, { status: "rejected", code: "unauthorized" })], [RESEND]: [json(200, {})] });
    const d = await deliverLead(lead(), deps({ ...ENV, ...EMAIL_ENV }, f));
    assert.equal(d.channel, "email");
    assert.equal(d.crm.code, "unauthorized");
    const none = await deliverLead(lead(), deps({}, fakeFetch({})));
    assert.deepEqual({ stored: none.stored, configured: none.configured }, { stored: false, configured: false });
  });
  test("legacy webhook unchanged and independent", async () => {
    const f = fakeFetch({ "https://hooks.example/lead": [json(200, {})] });
    const d = await deliverLead(lead(), deps({ LEAD_WEBHOOK_URL: "https://hooks.example/lead" }, f));
    assert.deepEqual({ stored: d.stored, channel: d.channel, webhook: d.webhook }, { stored: true, channel: "webhook", webhook: true });
    assert.deepEqual(JSON.parse(f.calls[0].body), { lead_id: "x" });
  });
  test("five deliveries of the same pending lead send five IDENTICAL bodies (the CRM keeps one)", async () => {
    const f = fakeFetch({ "*": () => json(200, { status: "duplicate" }) });
    for (let i = 0; i < 5; i++) await deliverLead(lead(), deps({ ...ENV }, f));
    const bodies = new Set(f.calls.map((c) => c.body));
    assert.equal(f.calls.length, 5);
    assert.equal(bodies.size, 1);
  });
});

describe("landing touch and rate limit", () => {
  test("captured from the landing URL: campaign parameters, landing path without query, external referrer host only", () => {
    const { touch, campaign } = touchFrom("https://likinagency.com/escalar-ecommerce?utm_source=facebook&utm_medium=paid_social&utm_campaign=X&utm_id=9&fbclid=fb.1&gclid=g.1&ttclid=t.1&email=leak@x.example", "https://l.facebook.com/", "likinagency.com", "2026-10-09T09:00:00.000Z");
    assert.equal(campaign, true);
    assert.deepEqual(touch, { occurred_at: "2026-10-09T09:00:00.000Z", landing_path: "/escalar-ecommerce", utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "X", utm_id: "9", fbclid: "fb.1", gclid: "g.1", ttclid: "t.1", referrer_host: "l.facebook.com" });
    assert.ok(!JSON.stringify(touch).includes("leak"));
    const internal = touchFrom("https://likinagency.com/work", "https://likinagency.com/", "likinagency.com", "t");
    assert.deepEqual(internal, { touch: { occurred_at: "t", landing_path: "/work" }, campaign: false });
  });
  test("10 per window, then limited", () => {
    const limited = createLimiter(10, 1000);
    for (let i = 0; i < 10; i++) assert.equal(limited("ip", 0), false);
    assert.equal(limited("ip", 10), true);
    assert.equal(limited("other", 10), false);
    assert.equal(limited("ip", 5000), false);
  });
});
