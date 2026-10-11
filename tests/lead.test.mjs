/**
 * Lead reception of likinagency.com WITHOUT the CRM: the deterministic lead-input@1 payload, the
 * e-mail through Resend (the record of the lead), the delivery decision, the landing touch and the
 * rate limiter. Fictional data only; no network (fetch is faked).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { boundedAnswers, crossSiteTouches, toLeadInput } from "../src/lib/crm/canonical.ts";
import { crmStatusLine, emailConfigFromEnv, fallbackEmail, sendFallbackEmail } from "../src/lib/crm/fallback-email.ts";
import { deliverLead, legacyWebhookPayload } from "../src/lib/crm/deliver.ts";
import { nextLanding, touchFrom } from "../src/lib/attribution/landing.ts";
import { createLimiter } from "../src/lib/crm/rate-limit.ts";

const EMAIL_ENV = { RESEND_API_KEY: "re_test_not_real", LEAD_EMAIL_FROM: "Web <web@likin.example>" };

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
    assert.deepEqual(p.consent, { contact: true, marketing: false, policyVersion: "likinagency-privacidad@2026-10-11.4" });
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

describe("lead e-mail", () => {
  test("without the CRM the e-mail says it IS the record of the lead", () => {
    assert.match(crmStatusLine(null), /CRM todavía no conectado: este email ES el registro del lead/);
    assert.match(fallbackEmail(lead(), null, "lead_1").text, /utm_source \/ medium \/ campaign: facebook \/ paid_social \/ SCALE_COLD/);
  });
  test("without the CRM (ads before the CRM): the e-mail is the record, readable, with the exact payload attached", () => {
    const input = toLeadInput(lead({ touch: { occurred_at: "2026-10-09T09:00:00.000Z", landing_path: "/escalar-ecommerce", utm_source: "facebook", utm_campaign: "SCALE_COLD", fbclid: "fb.secret.value" } }), { fallbackEventId: "lead_fb", fallbackSubmittedAt: "2026-10-09T10:00:00.000Z" });
    const m = fallbackEmail(lead(), null, "lead_1", input);
    assert.equal(m.subject, "[Lead SCALE · HIGH_FIT 82/100] Marca Ejemplo");
    assert.match(m.text, /este email ES el registro del lead/);
    assert.match(m.text, /Prioridad estimada por la web \(el CRM la recalculará\): HIGH_FIT · 82\/100 · siguiente paso: BOOK_CALL/);
    assert.match(m.text, /¿Cuánto factura tu eCommerce al mes\?: Entre 25\.000 y 50\.000/);
    assert.ok(!m.text.includes("fb.secret.value"));
    assert.equal(m.attachments.length, 1);
    assert.equal(m.attachments[0].filename, "lead-lead_1.json");
    const attached = JSON.parse(Buffer.from(m.attachments[0].content, "base64").toString("utf8"));
    assert.deepEqual(attached, JSON.parse(JSON.stringify(input)));
    assert.equal(attached.attribution.session.fbclid, "fb.secret.value");
    // Same submission → same key; anything different → another key.
    assert.equal(fallbackEmail(lead(), null, "lead_1", input).idempotencyKey, m.idempotencyKey);
    assert.notEqual(fallbackEmail(lead({ phone: "+34 600 000 999" }), null, "lead_1", input).idempotencyKey, m.idempotencyKey);
    assert.ok(m.idempotencyKey.startsWith("lead-email:lead_1:") && m.idempotencyKey.length <= 256);
  });
  test("sent through Resend with the configured sender; one safe retry; failures are reported, not hidden", async () => {
    const cfg = emailConfigFromEnv(EMAIL_ENV);
    assert.deepEqual(cfg, { apiKey: "re_test_not_real", from: "Web <web@likin.example>", to: "taras@likinagency.com" });
    const noWait = { sleep: async () => {} };
    const f = fakeFetch({ "https://api.resend.com/emails": [json(200, { id: "e1" })] });
    assert.deepEqual(await sendFallbackEmail(cfg, { subject: "s", text: "t", replyTo: "a@b.example", idempotencyKey: "k1", attachments: [{ filename: "a.json", content: "e30=" }] }, { fetch: f, ...noWait }), { ok: true, attempts: 1 });
    assert.deepEqual(JSON.parse(f.calls[0].body), { from: "Web <web@likin.example>", to: ["taras@likinagency.com"], reply_to: "a@b.example", subject: "s", text: "t", attachments: [{ filename: "a.json", content: "e30=" }] });
    assert.equal(f.calls[0].headers.Authorization, "Bearer re_test_not_real");
    assert.equal(f.calls[0].headers["Idempotency-Key"], "k1");
    const retry = fakeFetch({ "https://api.resend.com/emails": [json(500, {}), json(200, { id: "e2" })] });
    assert.deepEqual(await sendFallbackEmail(cfg, { subject: "s", text: "t", idempotencyKey: "k2" }, { fetch: retry, ...noWait }), { ok: true, attempts: 2 });
    assert.equal(retry.calls[0].headers["Idempotency-Key"], retry.calls[1].headers["Idempotency-Key"]);
    const down = fakeFetch({ "https://api.resend.com/emails": [json(503, {}), json(503, {})] });
    assert.deepEqual(await sendFallbackEmail(cfg, { subject: "s", text: "t" }, { fetch: down, ...noWait }), { ok: false, code: "resend_http_503", attempts: 2 });
    const net = fakeFetch({ "https://api.resend.com/emails": [new TypeError("fetch failed"), new TypeError("fetch failed")] });
    assert.deepEqual(await sendFallbackEmail(cfg, { subject: "s", text: "t" }, { fetch: net, ...noWait }), { ok: false, code: "resend_network", attempts: 2 });
    const bad = fakeFetch({ "https://api.resend.com/emails": [json(422, {})] });
    assert.deepEqual(await sendFallbackEmail(cfg, { subject: "s", text: "t" }, { fetch: bad, ...noWait }), { ok: false, code: "resend_http_422", attempts: 1 });
    assert.equal(bad.calls.length, 1);
    assert.equal(emailConfigFromEnv({ RESEND_API_KEY: "x" }), null);
  });
});

describe("delivery decision (what the visitor is told)", () => {
  const deps = (env, fetch) => ({ env, fetch, fallbackEventId: "lead_fb", fallbackSubmittedAt: "2026-10-09T10:00:05.000Z", webhookPayload: { lead_id: "x" } });
  const RESEND = "https://api.resend.com/emails";
  const HOOK = "https://hooks.example/lead";

  test("e-mail configured: EVERY lead is e-mailed with its payload (the record until the CRM)", async () => {
    const f = fakeFetch({ [RESEND]: [json(200, { id: "e1" })] });
    const d = await deliverLead(lead(), deps({ ...EMAIL_ENV }, f));
    assert.deepEqual({ stored: d.stored, channel: d.channel, emailed: d.emailed, webhook: d.webhook, configured: d.configured }, { stored: true, channel: "email", emailed: true, webhook: null, configured: true });
    const sent = JSON.parse(f.calls[0].body);
    assert.match(sent.subject, /^\[Lead SCALE · HIGH_FIT 82\/100\] Marca Ejemplo$/);
    assert.match(sent.text, /este email ES el registro del lead/);
    const attached = JSON.parse(Buffer.from(sent.attachments[0].content, "base64").toString("utf8"));
    assert.equal(attached.sourceEventId, d.eventId);
    assert.equal(attached.schema, "lead-input@1");
    assert.ok(f.calls[0].headers["Idempotency-Key"].startsWith(`lead-email:${d.eventId}:`));
  });
  test("e-mail down and no webhook → nothing stored: the route answers 502 and the person can retry", async () => {
    const f = fakeFetch({ [RESEND]: [json(503, {}), json(503, {})] });
    const d = await deliverLead(lead(), deps({ ...EMAIL_ENV }, f));
    assert.deepEqual({ stored: d.stored, channel: d.channel, emailed: d.emailed, configured: d.configured }, { stored: false, channel: "none", emailed: false, configured: true });
  });
  test("nothing configured → the historical stored:false, and no request leaves the server", async () => {
    const f = fakeFetch({});
    const none = await deliverLead(lead(), deps({}, f));
    assert.deepEqual({ stored: none.stored, channel: none.channel, configured: none.configured }, { stored: false, channel: "none", configured: false });
    assert.equal(f.calls.length, 0);
  });
  test("the legacy webhook receives every lead, exactly as before", async () => {
    const f = fakeFetch({ [HOOK]: [json(200, {})] });
    const d = await deliverLead(lead(), deps({ LEAD_WEBHOOK_URL: HOOK }, f));
    assert.deepEqual({ stored: d.stored, channel: d.channel, webhook: d.webhook }, { stored: true, channel: "webhook", webhook: true });
    assert.deepEqual(JSON.parse(f.calls[0].body), { lead_id: "x" });
  });
  test("webhook and e-mail together: both get the lead; either one is enough to store it", async () => {
    const both = fakeFetch({ [HOOK]: [json(200, {})], [RESEND]: [json(200, {})] });
    const d = await deliverLead(lead(), deps({ ...EMAIL_ENV, LEAD_WEBHOOK_URL: HOOK }, both));
    assert.deepEqual({ stored: d.stored, channel: d.channel, emailed: d.emailed, webhook: d.webhook }, { stored: true, channel: "email", emailed: true, webhook: true });
    const hookDown = fakeFetch({ [HOOK]: [json(500, {})], [RESEND]: [json(200, {})] });
    assert.equal((await deliverLead(lead(), deps({ ...EMAIL_ENV, LEAD_WEBHOOK_URL: HOOK }, hookDown))).stored, true);
    const mailDown = fakeFetch({ [HOOK]: [json(200, {})], [RESEND]: [json(503, {}), json(503, {})] });
    const m = await deliverLead(lead(), deps({ ...EMAIL_ENV, LEAD_WEBHOOK_URL: HOOK }, mailDown));
    assert.deepEqual({ stored: m.stored, channel: m.channel }, { stored: true, channel: "webhook" });
  });
  test("the legacy webhook payload keeps the pre-CRM fields: the landing touch and its click ids never reach it", () => {
    const clean = { ...lead(), received_at: "2026-10-09T10:00:06.000Z", user_agent: "test" };
    const sent = legacyWebhookPayload(clean);
    assert.equal("touch" in sent, false);
    assert.equal(JSON.stringify(sent).includes("fb.1.test"), false);
    const { touch, ...rest } = clean;
    assert.ok(touch);
    assert.deepEqual(sent, rest);
    assert.ok(clean.touch, "the original lead is not modified");
  });
  test("a webhook value that is not an http(s) URL (e.g. \"off\") disables it", async () => {
    for (const v of ["off", "", "  ", "ftp://x.example/hook", "javascript:alert(1)"]) {
      const f = fakeFetch({});
      const d = await deliverLead(lead(), deps({ LEAD_WEBHOOK_URL: v }, f));
      assert.deepEqual({ webhook: d.webhook, configured: d.configured, calls: f.calls.length }, { webhook: null, configured: false, calls: 0 });
    }
  });
  test("the same lead delivered twice sends the same e-mail key (Resend keeps one)", async () => {
    const f = fakeFetch({ [RESEND]: () => json(200, {}) });
    for (let i = 0; i < 2; i++) await deliverLead(lead(), deps({ ...EMAIL_ENV }, f));
    assert.equal(new Set(f.calls.map((c) => c.headers["Idempotency-Key"])).size, 1);
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

describe("cross-site attribution from tarasvasyliv.com (OD-16)", () => {
  const AT = "2026-10-09T09:58:00.000Z";
  const decorated = "https://likinagency.com/?utm_source=tarasvasyliv.com&utm_medium=referral&utm_campaign=personal_site&utm_content=hero_scale&o_src=instagram&o_med=social&o_cmp=TV_STORY&o_ref=l.instagram.com&o_fbclid=fb.should.not.travel";
  test("a decorated link is a hop with its CTA and the reported origin (campaign values and referrer host only)", () => {
    const a = touchFrom(decorated, "https://tarasvasyliv.com/", "likinagency.com", AT);
    assert.deepEqual(a.cross, { site: "tarasvasyliv.com", at: AT, landing_path: "/", cta: "hero_scale", origin: { utm_source: "instagram", utm_medium: "social", utm_campaign: "TV_STORY", referrer_host: "l.instagram.com" } });
    assert.ok(!JSON.stringify(a).includes("fb.should.not.travel"));
    const junk = touchFrom("https://likinagency.com/?utm_source=tarasvasyliv.com&utm_content=%3Cscript%3E&o_src=a%22b&o_ref=evil%20host", "", "likinagency.com", AT);
    assert.deepEqual(junk.cross, { site: "tarasvasyliv.com", at: AT, landing_path: "/" });
    const plain = touchFrom("https://likinagency.com/escalar-ecommerce", "https://www.tarasvasyliv.com/", "likinagency.com", AT);
    assert.deepEqual(plain.cross, { site: "tarasvasyliv.com", at: AT, landing_path: "/escalar-ecommerce" });
    assert.equal(touchFrom("https://likinagency.com/?utm_source=facebook", "https://l.facebook.com/", "likinagency.com", AT).cross, undefined);
  });
  test("a hop never replaces the touch that brought the person here first in this visit; a new campaign does", () => {
    const meta = touchFrom("https://likinagency.com/escalar-ecommerce?utm_source=facebook&utm_medium=paid_social&fbclid=fb.1", "", "likinagency.com", "2026-10-09T09:00:00.000Z").touch;
    const hop = touchFrom(decorated, "https://tarasvasyliv.com/", "likinagency.com", AT);
    const kept = nextLanding(meta, hop);
    assert.equal(kept.utm_source, "facebook");
    assert.equal(kept.fbclid, "fb.1");
    assert.equal(kept.cross.cta, "hero_scale");
    const first = nextLanding(null, hop);
    assert.equal(first.utm_source, "tarasvasyliv.com");
    assert.equal(first.cross.origin.utm_source, "instagram");
    const google = nextLanding(kept, touchFrom("https://likinagency.com/?utm_source=google&gclid=g.1", "", "likinagency.com", AT));
    assert.equal(google.utm_source, "google");
    assert.equal(google.cross, undefined);
    assert.equal(nextLanding(kept, touchFrom("https://likinagency.com/work", "https://likinagency.com/", "likinagency.com", AT)), null);
  });
  test("payload: session (with the CTA), the hop and the reported origin one second earlier; bounded and deterministic", () => {
    const touch = nextLanding(null, touchFrom(decorated, "https://tarasvasyliv.com/", "likinagency.com", AT));
    const input = toLeadInput(lead({ touch }), { fallbackEventId: "lead_fallback-0001", fallbackSubmittedAt: "2026-10-09T10:00:00.000Z" });
    assert.equal(input.attribution.session.utmSource, "tarasvasyliv.com");
    assert.equal(input.attribution.session.sourceCta, "hero_scale");
    assert.equal(input.attribution.session.sourceSite, undefined);
    assert.deepEqual(input.attribution.crossSite, { occurredAt: AT, landingUrl: "https://likinagency.com/", landingPath: "/", sourceSite: "tarasvasyliv.com", sourceCta: "hero_scale", referrerHost: "tarasvasyliv.com" });
    assert.deepEqual(input.attribution.reportedFirst, { occurredAt: "2026-10-09T09:57:59.000Z", utmSource: "instagram", utmMedium: "social", utmCampaign: "TV_STORY", referrerHost: "l.instagram.com" });
    assert.equal(JSON.stringify(toLeadInput(lead({ touch }), { fallbackEventId: "x-000001", fallbackSubmittedAt: "y" })), JSON.stringify(toLeadInput(lead({ touch }), { fallbackEventId: "x-000001", fallbackSubmittedAt: "y" })));
    assert.deepEqual(crossSiteTouches({ ...touch, cross: { ...touch.cross, site: "evil.example" } }), {});
    assert.deepEqual(crossSiteTouches({ ...touch, cross: { ...touch.cross, at: "not a date" } }), {});
    const noOrigin = crossSiteTouches({ ...touch, cross: { site: "tarasvasyliv.com", at: AT, landing_path: "/?x=1#y" } });
    assert.deepEqual(Object.keys(noOrigin), ["crossSite"]);
    assert.equal(noOrigin.crossSite.landingPath, "/");
    assert.equal(toLeadInput(lead(), { fallbackEventId: "lead_fallback-0001", fallbackSubmittedAt: "2026-10-09T10:00:00.000Z" }).attribution.crossSite, undefined);
  });
});

