/**
 * Cookie consent and the Meta Pixel: nothing from Meta before an explicit yes, one Lead per lead
 * id (with the id as eventID), no personal data in any call, and a withdrawal that stops the pixel
 * and deletes its cookies. Pure: a fake window/document/storage, no network.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { CONSENT_MAX_AGE_MS, parseConsent, readConsent, saveConsent, stateOf } from "../src/lib/consent.ts";
import { LEADS_SENT_KEY, META_PIXEL_SRC, createMetaPixel, fbcCookie, metaCookieDeletions, pixelIdFrom } from "../src/lib/meta-pixel.ts";

const NOW = Date.parse("2026-10-10T10:00:00.000Z");

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => void data.set(k, String(v)), data };
}

/** A fake browser: records scripts added, cookies written and every fbq call (as fbevents.js would receive them). */
function fakeHost(hostname = "www.likinagency.com") {
  const scripts = [];
  const cookies = [];
  const host = {
    location: { hostname },
    sessionStorage: memoryStorage(),
    document: {
      createElement: () => ({}),
      head: { appendChild: (el) => scripts.push(el) },
      set cookie(v) {
        cookies.push(v);
      },
      get cookie() {
        return "";
      },
    },
  };
  return { host, scripts, cookies, calls: () => (host.fbq ? host.fbq.queue.map((args) => Array.from(args)) : []) };
}

describe("consent", () => {
  test("only a well-formed, recent decision of this version counts", () => {
    const ok = JSON.stringify({ v: 1, ads: true, at: "2026-10-01T00:00:00.000Z" });
    assert.deepEqual(parseConsent(ok, NOW), { v: 1, ads: true, at: "2026-10-01T00:00:00.000Z" });
    for (const raw of [null, "", "{", "[]", JSON.stringify({ v: 2, ads: true, at: "2026-10-01T00:00:00.000Z" }), JSON.stringify({ v: 1, ads: "yes", at: "2026-10-01T00:00:00.000Z" }), JSON.stringify({ v: 1, ads: true, at: "nope" })])
      assert.equal(parseConsent(raw, NOW), null, String(raw));
    const old = new Date(NOW - CONSENT_MAX_AGE_MS - 1000).toISOString();
    assert.equal(parseConsent(JSON.stringify({ v: 1, ads: true, at: old }), NOW), null, "asked again after 12 months");
    const future = new Date(NOW + 60 * 60 * 1000).toISOString();
    assert.equal(parseConsent(JSON.stringify({ v: 1, ads: true, at: future }), NOW), null);
  });
  test("saving and reading back; undecided, granted and denied", () => {
    const s = memoryStorage();
    assert.equal(stateOf(readConsent(s, NOW)), "undecided");
    saveConsent(true, s, NOW);
    assert.equal(stateOf(readConsent(s, NOW)), "granted");
    saveConsent(false, s, NOW);
    assert.equal(stateOf(readConsent(s, NOW)), "denied");
  });
  test("blocked storage: the decision still holds for this page view", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    saveConsent(true, blocked, NOW);
    assert.equal(stateOf(readConsent(blocked, NOW)), "granted");
  });
});

describe("Meta Pixel", () => {
  test("off without a numeric pixel id", () => {
    for (const raw of [undefined, "", "  ", "abc", "123", "1234567890123456789012", "12345678<script>"]) assert.equal(pixelIdFrom(raw), null, String(raw));
    assert.equal(pixelIdFrom(" 1234567890 "), "1234567890");
    const f = fakeHost();
    const px = createMetaPixel(null, () => f.host);
    assert.equal(px.configured, false);
    assert.equal(px.grant(), false);
    assert.equal(px.lead({ eventId: "lead_0001-abcd", service: "SCALE" }), false);
    assert.deepEqual({ scripts: f.scripts.length, fbq: f.host.fbq }, { scripts: 0, fbq: undefined });
  });
  test("nothing from Meta before an explicit yes: no script, no fbq, no Lead", () => {
    const f = fakeHost();
    const px = createMetaPixel("1234567890", () => f.host);
    assert.equal(px.pageView(), false);
    assert.equal(px.lead({ eventId: "lead_0001-abcd", service: "SCALE" }), false);
    px.revoke();
    assert.equal(f.scripts.length, 0);
    assert.equal(f.host.fbq, undefined);
  });
  test("after a yes: Meta's script once, consent granted, no automatic configuration, no advanced matching, one PageView", () => {
    const f = fakeHost();
    const px = createMetaPixel("1234567890", () => f.host);
    assert.equal(px.grant(), true);
    assert.equal(px.grant(), true);
    assert.equal(f.scripts.length, 1);
    assert.equal(f.scripts[0].src, META_PIXEL_SRC);
    assert.equal(f.scripts[0].async, true);
    assert.equal(f.host.fbq.disablePushState, true);
    assert.equal(f.host.fbq.allowDuplicatePageViews, true, "client-side navigations must reach Meta (one PageView per route)");
    assert.deepEqual(f.calls(), [
      ["consent", "grant"],
      ["set", "autoConfig", false, "1234567890"],
      ["init", "1234567890"],
      ["track", "PageView"],
      ["consent", "grant"],
    ]);
    const init = f.calls().find((c) => c[0] === "init");
    assert.equal(init.length, 2, "init without advanced-matching data");
  });
  test("Lead: once per lead id, with the id as eventID and only the service; never personal data", () => {
    const f = fakeHost();
    const px = createMetaPixel("1234567890", () => f.host);
    px.grant();
    const id = "lead_6f1c2a3b-0000-4000-8000-000000000001";
    assert.equal(px.lead({ eventId: id, service: "SCALE" }), true);
    assert.equal(px.lead({ eventId: id, service: "SCALE" }), false, "double click / retry");
    const leads = f.calls().filter((c) => c[1] === "Lead");
    assert.deepEqual(leads, [["track", "Lead", { content_name: "SCALE", content_category: "likinagency.com" }, { eventID: id }]]);
    assert.doesNotMatch(JSON.stringify(f.calls()), /@|\+34|Ana|Marca/);
    assert.deepEqual(JSON.parse(f.host.sessionStorage.getItem(LEADS_SENT_KEY)), [id]);
    // A new pixel instance in the same tab (re-render, remount) still remembers it.
    const again = createMetaPixel("1234567890", () => f.host);
    again.grant();
    assert.equal(again.lead({ eventId: id, service: "SCALE" }), false);
    assert.equal(again.lead({ eventId: "lead_6f1c2a3b-0000-4000-8000-000000000002", service: "BUILD" }), true);
  });
  test("an invalid id or service sends nothing", () => {
    const f = fakeHost();
    const px = createMetaPixel("1234567890", () => f.host);
    px.grant();
    for (const [eventId, service] of [["", "SCALE"], ["short", "SCALE"], ["lead id with spaces", "BUILD"], ["lead_0001-abcd", "OTRO"]]) assert.equal(px.lead({ eventId, service }), false);
    assert.equal(f.calls().filter((c) => c[1] === "Lead").length, 0);
  });
  test("withdrawal: consent revoked, no more events, Meta cookies of this site deleted", () => {
    const f = fakeHost();
    const px = createMetaPixel("1234567890", () => f.host);
    px.grant();
    px.revoke();
    assert.deepEqual(f.calls().at(-1), ["consent", "revoke"]);
    assert.equal(px.pageView(), false);
    assert.equal(px.lead({ eventId: "lead_0001-abcd", service: "BUILD" }), false);
    assert.ok(f.cookies.includes("_fbp=; Max-Age=0; path=/; domain=.likinagency.com"));
    assert.ok(f.cookies.includes("_fbc=; Max-Age=0; path=/"));
    // Granting again resumes without loading the script twice.
    px.grant();
    assert.equal(f.scripts.length, 1);
    assert.deepEqual(f.calls().at(-1), ["consent", "grant"]);
  });
  test("cookie deletion covers the host and its parent domains, never a bare TLD", () => {
    assert.deepEqual(metaCookieDeletions("www.likinagency.com").filter((c) => c.startsWith("_fbp")), [
      "_fbp=; Max-Age=0; path=/",
      "_fbp=; Max-Age=0; path=/; domain=.www.likinagency.com",
      "_fbp=; Max-Age=0; path=/; domain=.likinagency.com",
    ]);
    assert.deepEqual(metaCookieDeletions("localhost"), ["_fbp=; Max-Age=0; path=/", "_fbc=; Max-Age=0; path=/"]);
  });
});

describe("ad click id after a late consent", () => {
  test("_fbc rebuilt from the landing fbclid in Meta's format, only if Meta has not set it", () => {
    const at = "2026-10-10T09:55:00.000Z";
    assert.equal(fbcCookie({ fbclid: "IwAR0abcdefghij", at }, "", NOW), `_fbc=fb.1.${Date.parse(at)}.IwAR0abcdefghij; Max-Age=7776000; path=/; SameSite=Lax`);
    assert.equal(fbcCookie({ fbclid: "IwAR0abcdefghij", at }, "_fbp=fb.1.1.2; _fbc=fb.1.1.x", NOW), null, "Meta already has it");
    for (const bad of [undefined, "", "short", "bad id with spaces", "x".repeat(501)]) assert.equal(fbcCookie({ fbclid: bad, at }, "", NOW), null, String(bad));
    assert.match(fbcCookie({ fbclid: "IwAR0abcdefghij", at: "not a date" }, "", NOW), new RegExp(`fb\\.1\\.${NOW}\\.`));
  });
  test("set before Meta's script loads, only on grant", () => {
    const f = fakeHost();
    const px = createMetaPixel("1234567890", () => f.host);
    px.grant({ fbclid: "IwAR0abcdefghij", at: "2026-10-10T09:55:00.000Z" });
    assert.ok(f.cookies[0]?.startsWith("_fbc=fb.1."));
    assert.equal(f.scripts.length, 1);
  });
});
