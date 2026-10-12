/**
 * QA local del aviso de cookies por finalidades (nada sale hacia Google, Microsoft ni Meta: sus
 * peticiones se responden aquí). Chromium resuelve el dominio real hacia el servidor local, porque
 * Google Analytics y Clarity solo cargan en el dominio real:
 *   npm i --no-save playwright-core@1.63.0
 *   NEXT_PUBLIC_META_PIXEL_ID=1234567890 npx next build && CRM_INGEST_URL= npx next start -p 3300
 *   node scripts/qa-consent.mjs
 * Comprueba: «Rechazar todas», «Configurar» y «Aceptar todas»; con «Configurar», Analítica y
 * Publicidad desmarcadas; nada antes de decidir; solo analítica → GA y Clarity, nada de Meta; solo
 * publicidad → Meta, nada de GA ni Clarity; aceptar todas → las tres; rechazar todas → ninguna, también
 * al navegar; «Configurar cookies» del pie reabre con la decisión actual y retirar la publicidad para
 * Meta y borra sus cookies sin tocar la analítica; la decisión se recuerda; una decisión del aviso
 * anterior (sin finalidades) se vuelve a pedir.
 */
import { chromium } from "playwright-core";

const SITE = "www.likinagency.com";
const PORT = process.env.QA_PORT ?? "3300";
const BASE = `http://${SITE}:${PORT}`;
const KEY = "likin.consent.v1";
const STUB = `(() => { const f = window.fbq; window.__fbq = window.__fbq ?? []; f.callMethod = function () { window.__fbq.push(Array.from(arguments)); };
  for (const a of f.queue) f.callMethod.apply(f, a); f.queue = []; })();`;
let failures = 0;
const check = (label, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(browser, stored) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const hits = { ga: [], clarity: [], meta: [], capi: [] };
  await ctx.route(/googletagmanager\.com|google-analytics\.com/, (route) => {
    hits.ga.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "/* gtag.js local */" });
  });
  await ctx.route(/clarity\.ms/, (route) => {
    hits.clarity.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "/* clarity local */" });
  });
  await ctx.route(/connect\.facebook\.net|facebook\.com/, (route) => {
    const url = route.request().url();
    hits.meta.push(url);
    return url.includes("fbevents.js") ? route.fulfill({ status: 200, contentType: "application/javascript", body: STUB }) : route.fulfill({ status: 204, body: "" });
  });
  // The server half of Meta (Conversions API) is called from the page: count it, answer locally.
  await ctx.route("**/api/meta-capi", (route) => {
    hits.capi.push(route.request().postData() ?? "");
    return route.fulfill({ status: 204, body: "" });
  });
  if (stored) await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(stored)]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  return { ctx, page, hits };
}
const banner = (page) => page.getByRole("region", { name: "Cookies" });
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), KEY);
const loaded = (h) => ({ ga: h.ga.some((u) => u.includes("gtag/js")), clarity: h.clarity.some((u) => u.includes("/tag/")), meta: h.meta.some((u) => u.includes("fbevents.js")) || h.capi.length > 0 });
const vendors = (h) => JSON.stringify(loaded(h));
async function choose(page, { analytics, ads }) {
  const b = banner(page);
  if (await b.getByRole("button", { name: "Configurar", exact: true }).isVisible().catch(() => false)) await b.getByRole("button", { name: "Configurar", exact: true }).click();
  await b.getByRole("switch", { name: /Analítica/ }).setChecked(analytics);
  await b.getByRole("switch", { name: /Publicidad/ }).setChecked(ads);
  await b.getByRole("button", { name: "Guardar selección" }).click();
  await wait(2000);
}
const next = async (page) => {
  await page.locator("footer").getByRole("link", { name: "Privacidad" }).click();
  await page.waitForURL("**/privacidad");
  await wait(1500);
};

const browser = await chromium.launch({ channel: "chromium", args: [`--host-resolver-rules=MAP ${SITE} 127.0.0.1`] });
try {
  // 1 · The notice and its three options, nothing before deciding.
  const a = await open(browser);
  const b = banner(a.page);
  const text = await b.innerText();
  check("el aviso nombra Google Analytics, Microsoft Clarity y Meta, y enlaza la política de cookies", /Google Analytics/.test(text) && /Microsoft Clarity/.test(text) && /Meta/.test(text) && (await b.getByRole("link", { name: "Política de cookies" }).count()) === 1);
  const labels = await b.getByRole("button").allInnerTexts();
  check("tres opciones con el mismo peso: Rechazar todas, Configurar, Aceptar todas", ["Rechazar todas", "Configurar", "Aceptar todas"].every((l) => labels.includes(l)), labels.join(" | "));
  check("nada de GA, Clarity ni Meta antes de decidir", vendors(a.hits) === JSON.stringify({ ga: false, clarity: false, meta: false }), vendors(a.hits));
  await b.getByRole("button", { name: "Configurar", exact: true }).click();
  const sw = { analytics: b.getByRole("switch", { name: /Analítica/ }), ads: b.getByRole("switch", { name: /Publicidad/ }) };
  check("Configurar: Analítica y Publicidad por separado, desmarcadas", (await sw.analytics.count()) === 1 && (await sw.ads.count()) === 1 && !(await sw.analytics.isChecked()) && !(await sw.ads.isChecked()));
  check("Configurar: nada se activa solo por abrirlo", vendors(a.hits) === JSON.stringify({ ga: false, clarity: false, meta: false }));

  // 2 · Analytics only.
  await choose(a.page, { analytics: true, ads: false });
  check("solo analítica: GA y Clarity sí, Meta no", vendors(a.hits) === JSON.stringify({ ga: true, clarity: true, meta: false }), vendors(a.hits));
  const s = await stored(a.page);
  check("se guarda la decisión por finalidad (v4)", s?.v === 4 && s.analytics === true && s.ads === false && typeof s.at === "string", JSON.stringify(s));
  await next(a.page);
  check("solo analítica, al navegar: sigue sin Meta y sin aviso", !loaded(a.hits).meta && (await banner(a.page).count()) === 0);
  await a.page.reload({ waitUntil: "networkidle" });
  await wait(1500);
  check("al volver (recarga): no se vuelve a preguntar", (await banner(a.page).count()) === 0);
  await a.ctx.close();

  // 3 · Ads only.
  const p = await open(browser);
  await choose(p.page, { analytics: false, ads: true });
  check("solo publicidad: Meta sí (píxel y API), GA y Clarity no", vendors(p.hits) === JSON.stringify({ ga: false, clarity: false, meta: true }) && p.hits.capi.some((d) => d.includes('"PageView"')), vendors(p.hits));
  await p.ctx.close();

  // 4 · Accept all, then withdraw advertising from the footer.
  const y = await open(browser);
  await banner(y.page).getByRole("button", { name: "Aceptar todas" }).click();
  await wait(2000);
  check("aceptar todas: GA, Clarity y Meta", vendors(y.hits) === JSON.stringify({ ga: true, clarity: true, meta: true }), vendors(y.hits));
  await y.page.evaluate(() => {
    document.cookie = "_fbp=fb.1.1.qa; path=/; domain=.likinagency.com";
    document.cookie = "_fbc=fb.1.1.qa; path=/; domain=.likinagency.com";
  });
  await y.page.getByRole("button", { name: "Configurar cookies" }).first().click();
  const reopened = banner(y.page);
  const now = await reopened.innerText();
  check("el pie reabre el aviso con la decisión actual", /analítica sí · publicidad sí/.test(now) && (await reopened.getByRole("switch", { name: /Analítica/ }).isChecked()) && (await reopened.getByRole("switch", { name: /Publicidad/ }).isChecked()), now.split("\n").find((l) => l.startsWith("Ahora")) ?? "");
  await choose(y.page, { analytics: true, ads: false });
  const capiBefore = y.hits.capi.length;
  const metaBefore = y.hits.meta.length;
  const fbCookies = (await y.ctx.cookies()).filter((c) => c.name === "_fbp" || c.name === "_fbc").map((c) => c.name);
  check("retirar la publicidad: cookies _fbp y _fbc borradas", fbCookies.length === 0, fbCookies.join(","));
  await next(y.page);
  check("retirar la publicidad: al navegar, nada más hacia Meta", y.hits.capi.length === capiBefore && y.hits.meta.length === metaBefore, `${y.hits.capi.length - capiBefore} / ${y.hits.meta.length - metaBefore}`);
  const gaOff = await y.page.evaluate(() => window["ga-disable-G-8261QVV57Y"] === true);
  check("retirar la publicidad no toca la analítica (GA sigue activo)", !gaOff);
  await y.page.getByRole("button", { name: "Configurar cookies" }).first().click();
  check("al reabrir: analítica sí · publicidad no", /analítica sí · publicidad no/.test(await banner(y.page).innerText()));
  await banner(y.page).getByRole("button", { name: "Rechazar todas" }).click();
  await wait(1500);
  check("rechazar todas desde el pie: GA desactivado", await y.page.evaluate(() => window["ga-disable-G-8261QVV57Y"] === true));
  await y.ctx.close();

  // 5 · Reject all.
  const n = await open(browser);
  await banner(n.page).getByRole("button", { name: "Rechazar todas" }).click();
  await wait(1500);
  await next(n.page);
  check("rechazar todas: nada de GA, Clarity ni Meta en toda la visita", vendors(n.hits) === JSON.stringify({ ga: false, clarity: false, meta: false }) && (await banner(n.page).count()) === 0, vendors(n.hits));
  await n.ctx.close();

  // 6 · A decision taken with the previous notice (all or nothing, no purposes) is asked again.
  const old = await open(browser, { v: 3, ads: true, at: new Date().toISOString() });
  check("decisión del aviso anterior: se vuelve a preguntar y no se activa nada", (await banner(old.page).count()) === 1 && vendors(old.hits) === JSON.stringify({ ga: false, clarity: false, meta: false }), vendors(old.hits));
  await old.ctx.close();
} catch (e) {
  failures++;
  console.log(`✗ la QA se ha detenido: ${e.message.split("\n")[0]}`);
} finally {
  await browser.close();
  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo correcto");
  process.exitCode = failures ? 1 : 0;
}
