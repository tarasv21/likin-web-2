/**
 * Launch QA of the qualification forms WITHOUT the CRM (Vía 1), against a LOCAL production build:
 * BUILD and SCALE, phone and desktop, cookies accepted and rejected. Checks: cookie panel before
 * anything from Meta, the phone consent box, one request per double click, the legacy webhook with
 * its usual fields and the landing UTMs, one Resend e-mail (sender, recipient, "this e-mail is the
 * record", the lead-<id>.json attachment with id, attribution, answers and consent, Idempotency-Key),
 * one Lead per lead id with consent and nothing from Meta without it, no personal data to Meta.
 * Nothing leaves the machine: fake webhook (started here), Resend recorded, Meta's script stubbed.
 *
 *   npm i --no-save playwright-core@1.63.0
 *   rm -rf .next && NEXT_PUBLIC_META_PIXEL_ID=1234567890 npm run build
 *   NODE_OPTIONS="--import ./scripts/qa-resend-recorder.mjs" RESEND_RECORD=/tmp/likin-qa/resend.jsonl \
 *     RESEND_API_KEY=local LEAD_EMAIL_FROM="LIKIN Web <web@likinagency.com>" \
 *     LEAD_WEBHOOK_URL=http://127.0.0.1:4599/hook CRM_INGEST_URL=off npx next start -p 3200
 *   node scripts/qa-launch.mjs /tmp/likin-qa        (restart the server between runs: 10 leads/10 min per IP)
 */
import { chromium } from "playwright-core";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
const BASE = process.env.QA_BASE ?? "http://localhost:3200";
const DIR = process.argv[2] ?? "/tmp/likin-qa";
mkdirSync(DIR, { recursive: true });
const HOOK = join(DIR, "hook.jsonl");
const MAIL = join(DIR, "resend.jsonl");
for (const f of [HOOK, MAIL]) writeFileSync(f, "", { flag: "a" });
const hook = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    appendFileSync(HOOK, body + "\n");
    res.writeHead(200, { "content-type": "application/json" }).end("{}");
  });
}).listen(4599, "127.0.0.1");
const STUB = `(() => { const f = window.fbq; window.__fbq = []; f.callMethod = function () { window.__fbq.push(Array.from(arguments)); };
  for (const a of f.queue) f.callMethod.apply(f, a); f.queue = []; })();`;
const lines = (f) => readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const report = [];
let failures = 0;
const check = (label, pass, detail = "") => { if (!pass) failures++; report.push(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`); };

async function run(browser, { service, width, consent }) {
  const mobile = width < 500;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const meta = [];
  await page.route(/connect\.facebook\.net|facebook\.com/, (route) => {
    meta.push(route.request().url());
    return route.request().url().includes("fbevents.js") ? route.fulfill({ status: 200, contentType: "application/javascript", body: STUB }) : route.fulfill({ status: 204, body: "" });
  });
  let posts = 0;
  page.on("request", (r) => { if (r.method() === "POST" && new URL(r.url()).pathname === "/api/lead") posts++; });
  const tag = `${service} ${mobile ? "móvil" : "escritorio"} ${consent ? "acepta" : "rechaza"}`;
  const campaign = `QA_${service}_${width}_${consent ? "ok" : "no"}`;
  const landing = service === "BUILD" ? "/crear-tienda-online" : "/escalar-ecommerce";
  const hookBefore = lines(HOOK).length;
  const mailBefore = lines(MAIL).length;

  await page.goto(`${BASE}${landing}?utm_source=meta&utm_medium=paid_social&utm_campaign=${campaign}&utm_content=ad_a&utm_term=set_1&utm_id=120200&fbclid=fb.qa.${campaign}`, { waitUntil: "networkidle" });
  const panel = page.getByRole("region", { name: "Cookies" });
  check(`${tag}: aviso de cookies visible`, await panel.isVisible());
  check(`${tag}: nada de Meta antes de decidir`, meta.length === 0);
  await panel.getByRole("button", { name: consent ? "Aceptar" : "Rechazar" }).click();
  // A new page load without the query string: the attribution must survive it.
  await page.goto(`${BASE}${landing}#lead-${service.toLowerCase()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  let last = "";
  for (let i = 0; i < 45; i++) {
    if (await page.getByRole("button", { name: "Enviar solicitud" }).isVisible().catch(() => false)) break;
    // Only the qualification sheet (the landing page behind it has its own questions as headings).
    const title = (await page.locator("dialog[open]").locator("h2, h3, legend").filter({ hasText: /\?|¿/ }).first().textContent().catch(() => "")) ?? "";
    if (title === last) throw new Error(`${tag}: atascado en «${title}» ${(await page.locator('[role="alert"]').allInnerTexts()).join(" ")}`);
    last = title;
    const radios = page.locator("dialog[open]").getByRole("radio");
    const checks = page.locator("dialog[open]").getByRole("checkbox");
    if ((await radios.count()) > 0) await radios.nth(service === "BUILD" ? 0 : Math.min(3, (await radios.count()) - 1)).click();
    else if ((await checks.count()) > 0) await checks.first().click();
    for (const input of await page.locator("input[type=text]:visible, input[type=url]:visible, input:not([type]):visible, textarea:visible").all()) {
      const urlish = (await input.getAttribute("type")) === "url" || (await input.getAttribute("inputmode")) === "url" || /URL|web|enlace|link|Instagram/i.test(title);
      if ((await input.inputValue()) === "" || urlish) await input.fill(urlish ? `https://marca-${service.toLowerCase()}-qa.example` : `Marca QA ${service}`);
    }
    const next = page.getByRole("button", { name: "Continuar" });
    if (await next.isVisible().catch(() => false)) await next.click();
    await page.waitForTimeout(600);
  }
  await page.getByLabel("Nombre y apellidos").fill(`QA Lanzamiento ${tag}`);
  await page.getByLabel("Email profesional").fill(`${campaign.toLowerCase()}@lanzamiento-qa.example`);
  await page.getByLabel("Teléfono o WhatsApp").fill("+34 600 000 333");
  await page.getByLabel("Empresa o marca").fill(`Marca QA ${service}`);
  const box = page.locator("input[type=checkbox]").first();
  await box.click(); // a person's tap: no programmatic scrolling (the phone bug)
  check(`${tag}: casilla de consentimiento alcanzable y marcada`, await box.isChecked());
  await page.getByRole("button", { name: "Enviar solicitud" }).dblclick();
  await page.waitForTimeout(5000);

  const hooks = lines(HOOK).slice(hookBefore);
  const mails = lines(MAIL).slice(mailBefore);
  const fbq = await page.evaluate(() => window.__fbq ?? []);
  check(`${tag}: una sola petición al servidor (doble clic)`, posts === 1, String(posts));
  check(`${tag}: el webhook recibe un envío`, hooks.length === 1, String(hooks.length));
  const h = hooks[0] ?? {};
  check(`${tag}: webhook con los campos de siempre (sin touch)`, !("touch" in h) && h.service === service && Boolean(h.answers) && Boolean(h.email));
  check(`${tag}: webhook con UTMs de la llegada`, h.utm_source === "meta" && h.utm_campaign === campaign && h.utm_term === "set_1", `${h.utm_source}/${h.utm_campaign}`);
  check(`${tag}: un email por Resend`, mails.length === 1, String(mails.length));
  const m = mails[0] ?? { body: {} };
  const att = m.body.attachments?.[0];
  const json = att ? JSON.parse(Buffer.from(att.content, "base64").toString("utf8")) : {};
  check(`${tag}: email a taras@likinagency.com desde LIKIN Web`, JSON.stringify(m.body.to) === JSON.stringify(["taras@likinagency.com"]) && /web@likinagency\.com/.test(m.body.from ?? ""), `${m.body.from} → ${m.body.to}`);
  check(`${tag}: el email dice que es el registro (sin CRM)`, /CRM todavía no conectado/.test(m.body.text ?? ""));
  check(`${tag}: adjunto lead-<id>.json con el mismo id que el webhook`, att?.filename === `lead-${h.lead_id}.json` && json.sourceEventId === h.lead_id);
  const s = json.attribution?.session ?? {};
  check(`${tag}: atribución en el adjunto (UTMs, utm_id, fbclid, llegada)`, s.utmCampaign === campaign && s.utmId === "120200" && /^fb\.qa\./.test(s.fbclid ?? "") && s.landingPath === landing);
  check(`${tag}: respuestas y consentimiento en el adjunto`, Object.keys(json.answers ?? {}).length > 5 && json.consent?.contact === true);
  check(`${tag}: Idempotency-Key ligada al id`, (m.idempotencyKey ?? "").startsWith(`lead-email:${h.lead_id}:`));
  const leads = fbq.filter((c) => c[1] === "Lead");
  if (consent) {
    check(`${tag}: un Lead en Meta con el id del lead`, leads.length === 1 && leads[0][3]?.eventID === h.lead_id && leads[0][2]?.content_name === service, JSON.stringify(leads));
    check(`${tag}: ningún dato personal hacia Meta`, !/lanzamiento-qa|600 000 333|QA Lanzamiento/.test(JSON.stringify(fbq) + meta.join(" ")));
  } else {
    check(`${tag}: con rechazo, ninguna petición a Meta`, meta.length === 0 && fbq.length === 0, String(meta.length));
  }
  await ctx.close();
}

const browser = await chromium.launch({ channel: "chromium" });
try {
  await run(browser, { service: "SCALE", width: 390, consent: true });
  await run(browser, { service: "BUILD", width: 390, consent: true });
  await run(browser, { service: "BUILD", width: 1440, consent: false });
  await run(browser, { service: "SCALE", width: 1440, consent: false });
} finally {
  await browser.close();
  hook.close();
  console.log(report.join("\n"));
  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo correcto");
  process.exitCode = failures ? 1 : 0;
}
