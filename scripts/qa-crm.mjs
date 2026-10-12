/**
 * QA local de punta a punta web → LIKIN CRM con datos ficticios. Nada sale hacia Resend ni Meta
 * (qa-net-recorder.mjs lo responde en local). El CRM corre en local en modo simulado (sin Supabase:
 * ni DEV ni PROD) con una clave de prueba de esta web, solo en el entorno de los dos procesos:
 *   CRM (repo likin-crm): CRM_DATA_MODE=mock SUPABASE_URL= SUPABASE_PUBLISHABLE_KEY= SUPABASE_SECRET_KEY= \
 *        SUPABASE_DB_URL= CRM_INGEST_PROOF= CRM_INGEST_WEB_KEYS= CRM_INGEST_WEB_KEYS_LIKINAGENCY=<site:keyId:secret> \
 *        npx next dev -p 3010
 *   Web: npx next build && NODE_OPTIONS="--import ./scripts/qa-net-recorder.mjs" QA_NET_RECORD=/tmp/lk-crm/net.jsonl \
 *        RESEND_API_KEY=local LEAD_EMAIL_FROM="LIKIN Web <web@likinagency.com>" LEAD_EMAIL_ALWAYS=1 \
 *        CRM_INGEST_URL=http://localhost:3010/api/ingest/web CRM_INGEST_KEY_ID=<keyId> CRM_INGEST_SECRET=<secret> npx next start -p 3300
 *        (las variables del proceso mandan sobre .env.local)
 *   node scripts/qa-crm.mjs /tmp/lk-crm
 * Comprueba: el servidor responde channel "crm"; doble clic = un envío; un solo email
 * (LEAD_EMAIL_ALWAYS=1), que dice «registrado» y lleva el JSON del lead; reenviar el mismo lead no
 * duplica; con el CRM caído, el lead llega igual por email (QA_CRM_DOWN=1, tras parar el CRM).
 */
import { chromium } from "playwright-core";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.QA_BASE ?? "http://localhost:3300";
const NET = join(process.argv[2] ?? "/tmp/lk-crm", "net.jsonl");
const net = () => (existsSync(NET) ? readFileSync(NET, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const STAMP = Date.now().toString(36);
const NAME = `E2E CRM ${STAMP}`;
const EMAIL = `e2e-crm-${STAMP}@lk-e2e.example`;
let failures = 0;
const check = (label, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Answers of a HIGH_FIT SCALE journey (src/lib/qualify/journeys.ts): the result offers the booking link. */
const PREFER = new Set(["25K_50K", "SHOPIFY", "FASHION", "ADS_NOT_SCALING", "YES", "3K_10K", "AGENCY", "1_2", "SOME", "KLAVIYO", "FOUNDER", "FULL_GROWTH", "2_5K_4K", "NOW"]);

/** The SCALE flow on a phone, to the contact step and the submit (double click). */
async function completeScale(page) {
  await page.evaluate(() => {
    location.hash = "lead-scale";
  });
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
      if ((await input.inputValue()) === "" || urlish) await input.fill(urlish ? "https://marca-meta-qa.example" : "Marca Meta QA");
    }
    const next = page.getByRole("button", { name: "Continuar" });
    if (await next.isVisible().catch(() => false)) await next.click();
    await wait(600);
  }
  await page.getByLabel("Nombre y apellidos").fill(NAME);
  await page.getByLabel("Email profesional").fill(EMAIL);
  await page.getByLabel("Teléfono o WhatsApp").fill("600 000 444");
  await page.getByLabel("Empresa o marca").fill("Marca E2E CRM");
  // Mobile fix: the consent box must be reachable inside the sheet (its own scroll region).
  const consent = page.locator("dialog[open] input[type=checkbox]").first();
  await consent.scrollIntoViewIfNeeded();
  const box = await consent.boundingBox();
  const reachable = Boolean(box && box.y >= 0 && box.y + box.height <= 844);
  await consent.click();
  const response = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/lead");
  await page.getByRole("button", { name: "Enviar solicitud" }).dblclick();
  const res = await response;
  const body = await res.json().catch(() => ({}));
  await wait(2500);
  return { status: res.status(), body, reachable };
}

const browser = await chromium.launch({ channel: "chromium" });
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/connect\.facebook\.net|facebook\.com|googletagmanager\.com|google-analytics\.com|calendly\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const leadRequests = [];
  page.on("request", (r) => { if (new URL(r.url()).pathname === "/api/lead") leadRequests.push(r.postData() ?? ""); });
  await page.goto(`${BASE}/escalar-ecommerce?utm_source=meta&utm_medium=paid_social&utm_campaign=e2e_crm&utm_id=120200&fbclid=IwAR0e2ecrmtest01`, { waitUntil: "networkidle" });
  await page.getByRole("region", { name: "Cookies" }).getByRole("button", { name: "Rechazar todas" }).click();
  await page.goto(`${BASE}/escalar-ecommerce`, { waitUntil: "networkidle" });
  const before = net().length;
  const sent = await completeScale(page);
  if (process.env.QA_CRM_DOWN === "1") {
    // The CRM is stopped: the visitor still sees the request as sent and the e-mail is the only copy.
    check("CRM caído: el servidor confirma el lead por email", sent.status === 200 && sent.body.stored === true && sent.body.channel === "email", JSON.stringify(sent.body));
    const down = net().slice(before).filter((r) => r.to === "api.resend.com");
    check("CRM caído: un email «NO REGISTRADO … única copia» con el JSON del lead para importarlo", down.length === 1 && /NO REGISTRADO/.test(down[0].body.text) && /única copia/.test(down[0].body.text) && /^lead-lead_.+\.json$/.test(down[0].body.attachments?.[0]?.filename ?? ""), down[0]?.body.subject);
    await ctx.close();
    throw Object.assign(new Error("done"), { done: true });
  }
  check("el servidor confirma el lead EN EL CRM", sent.status === 200 && sent.body.stored === true && sent.body.channel === "crm", JSON.stringify(sent.body));
  check("doble clic = un solo envío", leadRequests.length === 1, String(leadRequests.length));
  const mails = net().slice(before).filter((r) => r.to === "api.resend.com");
  check("un solo email (LEAD_EMAIL_ALWAYS=1), que dice que el CRM lo tiene, con el JSON del lead", mails.length === 1 && /Estado en el CRM: registrado/.test(mails[0].body.text) && /^lead-lead_.+\.json$/.test(mails[0].body.attachments?.[0]?.filename ?? ""), mails[0]?.body.subject);
  // Reenviar exactamente la misma solicitud (como un reintento tras perder la respuesta): el CRM no duplica.
  const again = await page.evaluate(async (body) => { const r = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body }); return r.json(); }, leadRequests[0]);
  check("reenviar el mismo lead: sigue en el CRM, sin duplicar", again.stored === true && again.channel === "crm", JSON.stringify(again));
  const keys = new Set(net().slice(before).filter((r) => r.to === "api.resend.com").map((r) => r.idempotencyKey));
  check("reenviar el mismo lead: la misma clave de idempotencia en Resend (un solo email)", keys.size === 1 && Boolean([...keys][0]), [...keys].join(" | "));
  await ctx.close();
} catch (e) {
  if (!e.done) {
    failures++;
    console.log(`✗ la QA se ha detenido: ${e.message.split("\n")[0]}`);
  }
} finally {
  await browser.close();
  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo correcto");
  process.exitCode = failures ? 1 : 0;
}
