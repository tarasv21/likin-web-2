/**
 * QA local de punta a punta de likinagency.com con LIKIN CRM, antes de lanzar Meta Ads (escenarios
 * 1–4 del brief del 2026-10-12). Nada sale de la máquina: Google, Microsoft y Meta se responden en el
 * navegador, Resend y la API de Conversiones en el servidor (qa-net-recorder.mjs), y el CRM corre en
 * local en modo simulado (sin Supabase: ni DEV ni PROD) con claves de prueba solo en el entorno:
 *   CRM (likin-crm): CRM_DATA_MODE=mock SUPABASE_URL= SUPABASE_PUBLISHABLE_KEY= SUPABASE_SECRET_KEY= SUPABASE_DB_URL= \
 *        CRM_INGEST_PROOF= CRM_INGEST_WEB_KEYS= CRM_INGEST_WEB_KEYS_LIKINAGENCY=<site:keyId:secret> npx next dev -p 3010
 *   Web: NEXT_PUBLIC_META_PIXEL_ID=1234567890 NEXT_PUBLIC_CALENDLY_SCALE_URL=https://calendly.com/qa-local/scale npx next build
 *        NODE_OPTIONS="--import ./scripts/qa-net-recorder.mjs" QA_NET_RECORD=/tmp/lk-e2e/net.jsonl LEAD_EMAIL_ALWAYS=1 \
 *        RESEND_API_KEY=local LEAD_EMAIL_FROM="LIKIN Web <web@likinagency.com>" META_CAPI_ACCESS_TOKEN=token-local-de-prueba-0123456789 \
 *        CRM_INGEST_URL=http://localhost:3010/api/ingest/web CRM_INGEST_KEY_ID=<keyId> CRM_INGEST_SECRET=<secret> npx next start -p 3300
 *   node scripts/qa-e2e.mjs /tmp/lk-e2e
 * Escenarios: 1 acepta todas + BUILD; 2 rechaza todas + SCALE; 3 solo analítica + SCALE; 4 el mismo
 * envío dos veces (doble clic y reenvío). En cada uno: el lead en el CRM, un email «registrado» con su
 * JSON, Meta solo con publicidad (un Lead en píxel y API con el mismo event_id), GA y Clarity solo
 * con analítica; al final, cada lead aparece en el CRM con su contacto y su oportunidad.
 */
import { chromium } from "playwright-core";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "www.likinagency.com";
const BASE = `http://${SITE}:${process.env.QA_PORT ?? "3300"}`;
const CRM = process.env.QA_CRM ?? "http://localhost:3010";
const NET = join(process.argv[2] ?? "/tmp/lk-e2e", "net.jsonl");
const net = () => (existsSync(NET) ? readFileSync(NET, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const graph = (from) => net().slice(from).filter((r) => r.to === "graph.facebook.com").flatMap((r) => r.body.data ?? []);
const mails = (from) => net().slice(from).filter((r) => r.to === "api.resend.com");
const STUB = `(() => { const f = window.fbq; window.__fbq = window.__fbq ?? []; f.callMethod = function () { window.__fbq.push(Array.from(arguments)); };
  for (const a of f.queue) f.callMethod.apply(f, a); f.queue = []; })();`;
const STAMP = Date.now().toString(36);
let failures = 0;
const check = (label, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PREFER = new Set(["25K_50K", "SHOPIFY", "FASHION", "ADS_NOT_SCALING", "YES", "3K_10K", "AGENCY", "1_2", "SOME", "KLAVIYO", "FOUNDER", "FULL_GROWTH", "2_5K_4K", "NOW"]);

async function open(browser, choice, service) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const hits = { ga: 0, clarity: 0, meta: 0 };
  await ctx.route(/googletagmanager\.com|google-analytics\.com/, (r) => { hits.ga++; return r.fulfill({ status: 200, contentType: "application/javascript", body: "" }); });
  await ctx.route(/clarity\.ms/, (r) => { hits.clarity++; return r.fulfill({ status: 200, contentType: "application/javascript", body: "" }); });
  await ctx.route(/connect\.facebook\.net|facebook\.com/, (r) => { hits.meta++; return r.request().url().includes("fbevents.js") ? r.fulfill({ status: 200, contentType: "application/javascript", body: STUB }) : r.fulfill({ status: 204, body: "" }); });
  await ctx.route(/calendly\.com/, (r) => r.fulfill({ status: 204, body: "" }));
  const page = await ctx.newPage();
  const posts = [];
  page.on("request", (r) => { if (new URL(r.url()).pathname === "/api/lead") posts.push(r.postData() ?? ""); });
  const start = net().length;
  const path = service === "BUILD" ? "/crear-tienda-online" : "/escalar-ecommerce";
  await page.goto(`${BASE}${path}?utm_source=meta&utm_medium=paid_social&utm_campaign=e2e_${service.toLowerCase()}&utm_id=120200&fbclid=IwAR0e2e${choice}test01`, { waitUntil: "networkidle" });
  const banner = page.getByRole("region", { name: "Cookies" });
  if (choice === "analytics") {
    await banner.getByRole("button", { name: "Configurar", exact: true }).click();
    await banner.getByRole("switch", { name: /Analítica/ }).check();
    await banner.getByRole("button", { name: "Guardar selección" }).click();
  } else await banner.getByRole("button", { name: choice === "all" ? "Aceptar todas" : "Rechazar todas" }).click();
  await wait(1500);
  return { ctx, page, posts, hits, start };
}

async function submit(page, service, name, email, brand) {
  await page.evaluate((h) => { location.hash = h; }, `lead-${service.toLowerCase()}`);
  await wait(1000);
  let last = "";
  for (let i = 0; i < 45; i++) {
    if (await page.getByRole("button", { name: "Enviar solicitud" }).isVisible().catch(() => false)) break;
    const dlg = page.locator("dialog[open]");
    const title = (await dlg.locator("h2, h3, legend").filter({ hasText: /\?|¿/ }).first().textContent().catch(() => "")) ?? "";
    if (title === last) throw new Error(`atascado en «${title}»`);
    last = title;
    const options = await dlg.locator("[data-value]").all();
    let picked = false;
    for (const o of options) {
      if (PREFER.has((await o.getAttribute("data-value")) ?? "")) {
        await o.click();
        picked = true;
        break;
      }
    }
    if (!picked && options.length) await options[0].click();
    for (const input of await page.locator("input[type=text]:visible, input[type=url]:visible, input:not([type]):visible, textarea:visible").all()) {
      const urlish = (await input.getAttribute("type")) === "url" || (await input.getAttribute("inputmode")) === "url" || /URL|web|enlace|link|Instagram/i.test(title);
      if ((await input.inputValue()) === "" || urlish) await input.fill(urlish ? `https://${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.example` : brand);
    }
    const next = page.getByRole("button", { name: "Continuar" });
    if (await next.isVisible().catch(() => false)) await next.click();
    await wait(600);
  }
  await page.getByLabel("Nombre y apellidos").fill(name);
  await page.getByLabel("Email profesional").fill(email);
  await page.getByLabel("Teléfono o WhatsApp").fill("+44 7700 900123");
  const box = page.locator("dialog[open] input[type=checkbox]").first();
  await box.scrollIntoViewIfNeeded();
  await box.click();
  const response = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/lead");
  await page.getByRole("button", { name: "Enviar solicitud" }).dblclick();
  const res = await response;
  const body = await res.json().catch(() => ({}));
  await wait(2500);
  return { status: res.status(), body };
}

const SCENARIOS = [
  { n: 1, choice: "all", service: "BUILD", label: "acepta todas + BUILD" },
  { n: 2, choice: "none", service: "SCALE", label: "rechaza todas + SCALE" },
  { n: 3, choice: "analytics", service: "SCALE", label: "solo analítica + SCALE" },
];
const people = [];

const browser = await chromium.launch({ channel: "chromium", args: [`--host-resolver-rules=MAP ${SITE} 127.0.0.1`] });
try {
  for (const sc of SCENARIOS) {
    console.log(`\nEscenario ${sc.n} · ${sc.label}`);
    const name = `E2E Escenario${sc.n} ${STAMP}`;
    const email = `e2e-${sc.n}-${STAMP}@lk-e2e.example`;
    const v = await open(browser, sc.choice, sc.service);
    // Each scenario its own brand: the CRM groups leads of the same brand (link) into one company.
    const brand = `Marca E2E${sc.n} ${STAMP}`;
    const sent = await submit(v.page, sc.service, name, email, brand);
    people.push({ ...sc, name, brand });
    check("el lead entra en el CRM (stored, channel crm)", sent.status === 200 && sent.body.stored === true && sent.body.channel === "crm", JSON.stringify(sent.body));
    check("doble clic = un solo envío", v.posts.length === 1, String(v.posts.length));
    const m = mails(v.start);
    check("un email «registrado» con el JSON del lead", m.length === 1 && /Estado en el CRM: registrado/.test(m[0].body.text) && /^lead-lead_.+\.json$/.test(m[0].body.attachments?.[0]?.filename ?? ""), m[0]?.body.subject);
    const fbq = await v.page.evaluate(() => window.__fbq ?? []);
    const pixelLeads = fbq.filter((c) => c[1] === "Lead");
    const capiLeads = graph(v.start).filter((e) => e.event_name === "Lead");
    if (sc.choice === "all") {
      check(`Meta: un Lead en píxel y API con el mismo event_id, ${sc.service}`, pixelLeads.length === 1 && capiLeads.length === 1 && pixelLeads[0][3]?.eventID === capiLeads[0].event_id && capiLeads[0].custom_data?.content_name === sc.service, `${pixelLeads.length}/${capiLeads.length} ${capiLeads[0]?.custom_data?.content_name}`);
      check("Meta: sin datos personales (ni em, ph, fn) ni valoración", !capiLeads.some((e) => ["em", "ph", "fn"].some((k) => k in e.user_data) || "qualification" in (e.custom_data ?? {})));
    } else check("Meta: nada (ni píxel ni API)", v.hits.meta === 0 && graph(v.start).length === 0, `${v.hits.meta} / ${graph(v.start).length}`);
    const analytics = sc.choice !== "none";
    check(`GA y Clarity ${analytics ? "cargan" : "no cargan"}`, analytics ? v.hits.ga > 0 && v.hits.clarity > 0 : v.hits.ga === 0 && v.hits.clarity === 0, `${v.hits.ga} / ${v.hits.clarity}`);

    if (sc.n === 2) {
      console.log("\nEscenario 4 · el mismo envío otra vez (reintento tras perder la respuesta)");
      const before = net().length;
      const again = await v.page.evaluate(async (body) => { const r = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body }); return r.json(); }, v.posts[0]);
      await wait(1500);
      check("reenviar: sigue en el CRM (duplicado, sin segundo lead)", again.stored === true && again.channel === "crm", JSON.stringify(again));
      const keys = new Set([...mails(v.start)].map((r) => r.idempotencyKey));
      check("reenviar: la misma clave de idempotencia en Resend (un solo email)", keys.size === 1 && mails(before).every((r) => keys.has(r.idempotencyKey)), [...keys].join(" | "));
    }
    await v.ctx.close();
  }

  console.log("\nEn el CRM (modo simulado)");
  const html = async (path) => (await fetch(`${CRM}${path}`)).text();
  const [leads, pipeline, contacts] = await Promise.all([html("/leads"), html("/pipeline"), html("/contacts")]);
  for (const p of people) {
    check(`escenario ${p.n}: contacto, lead y oportunidad ${p.service} en el CRM`, contacts.includes(p.name) && leads.includes(p.name) && pipeline.includes(p.brand), `${contacts.includes(p.name)} ${leads.includes(p.name)} ${pipeline.includes(p.brand)}`);
  }
} catch (e) {
  failures++;
  console.log(`✗ la QA se ha detenido: ${e.message.split("\n")[0]}`);
} finally {
  await browser.close();
  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo correcto");
  process.exitCode = failures ? 1 : 0;
}
