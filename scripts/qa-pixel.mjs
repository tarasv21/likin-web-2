/**
 * The REAL Meta Pixel seen from the network (no stub): which requests leave for Meta, with which
 * event, pixel id, event id and parameters. Prints decoded events; never sends personal data.
 *   node scripts/qa-pixel.mjs https://www.likinagency.com            consent + page views only
 *   node scripts/qa-pixel.mjs http://localhost:3200 --lead           also one fictional SCALE lead
 *       (local build only: the lead goes to the local fake webhook/recorder of scripts/qa-launch.mjs)
 * Needs `npm i --no-save playwright-core@1.63.0`; opens a visible Chromium window (Meta ignores headless
 * browsers). Keep that window in front until it closes: macOS pauses hidden windows and Meta sends
 * nothing from a hidden page. Checks: nothing before consent, PageView with the
 * pixel id, one PageView per navigation, one Lead with the lead id (with --lead), only PageView and
 * Lead events, no user data (ud[…]) parameters, and nothing at all when cookies are rejected.
 */
import { chromium } from "playwright-core";

const base = (process.argv[2] ?? "").replace(/\/+$/, "");
const withLead = process.argv.includes("--lead");
if (!/^https?:\/\//.test(base)) {
  console.error("Uso: node scripts/qa-pixel.mjs <url> [--lead]");
  process.exit(1);
}
let failures = 0;
const check = (label, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`);
};
const decode = (url) => {
  const u = new URL(url);
  const p = Object.fromEntries(u.searchParams);
  return { ev: p.ev, id: p.id, eid: p.eid, content: p["cd[content_name]"], ud: Object.keys(p).filter((k) => k.startsWith("ud[")), status: null, dl: p.dl ? new URL(p.dl).pathname : undefined };
};

async function session(browser, accept) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const meta = [];
  const events = [];
  page.on("request", (r) => {
    const u = r.url();
    if (/facebook\.(com|net)/.test(u)) meta.push(u);
    if (/facebook\.com\/tr\/?\?/.test(u) || (/facebook\.com\/tr/.test(u) && r.method() === "POST")) events.push(decode(u));
  });
  await page.goto(`${base}/escalar-ecommerce?utm_source=meta&utm_medium=paid_social&utm_campaign=qa_pixel_real&fbclid=fb.qa.real`, { waitUntil: "networkidle" });
  check(`${accept ? "acepta" : "rechaza"}: nada de Meta antes de decidir`, meta.length === 0, String(meta.length));
  await page.getByRole("region", { name: "Cookies" }).getByRole("button", { name: accept ? "Aceptar" : "Rechazar" }).click();
  await page.waitForTimeout(4000);
  await page.locator("footer").getByRole("link", { name: "Privacidad" }).click();
  await page.waitForURL("**/privacidad");
  await page.waitForTimeout(4000);
  return { ctx, page, meta, events };
}

async function completeScale(page) {
  await page.goto(`${base}/escalar-ecommerce#lead-scale`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  let last = "";
  for (let i = 0; i < 45; i++) {
    if (await page.getByRole("button", { name: "Enviar solicitud" }).isVisible().catch(() => false)) break;
    const dlg = page.locator("dialog[open]");
    const title = (await dlg.locator("h2, h3, legend").filter({ hasText: /\?|¿/ }).first().textContent().catch(() => "")) ?? "";
    if (title === last) throw new Error(`atascado en «${title}»`);
    last = title;
    const radios = dlg.getByRole("radio");
    const checks = dlg.getByRole("checkbox");
    if ((await radios.count()) > 0) await radios.nth(Math.min(3, (await radios.count()) - 1)).click();
    else if ((await checks.count()) > 0) await checks.first().click();
    for (const input of await page.locator("input[type=text]:visible, input[type=url]:visible, input:not([type]):visible, textarea:visible").all()) {
      const urlish = (await input.getAttribute("type")) === "url" || (await input.getAttribute("inputmode")) === "url" || /URL|web|enlace|link|Instagram/i.test(title);
      if ((await input.inputValue()) === "" || urlish) await input.fill(urlish ? "https://marca-pixel-real.example" : "Marca Pixel Real QA");
    }
    const next = page.getByRole("button", { name: "Continuar" });
    if (await next.isVisible().catch(() => false)) await next.click();
    await page.waitForTimeout(600);
  }
  await page.getByLabel("Nombre y apellidos").fill("QA Pixel Real");
  await page.getByLabel("Email profesional").fill("pixel-real@qa.example");
  await page.getByLabel("Teléfono o WhatsApp").fill("+34 600 000 444");
  await page.getByLabel("Empresa o marca").fill("Marca Pixel Real QA");
  await page.locator("input[type=checkbox]").first().click();
  const response = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/lead");
  await page.getByRole("button", { name: "Enviar solicitud" }).dblclick();
  const body = await (await response).json().catch(() => ({}));
  await page.waitForTimeout(5000);
  return body;
}

// Meta's script sends nothing from headless or self-declared automated browsers: a real window.
const browser = await chromium.launch({ channel: "chromium", headless: false, args: ["--disable-blink-features=AutomationControlled"] });
try {
  const yes = await session(browser, true);
  const views = yes.events.filter((e) => e.ev === "PageView");
  const pixel = views[0]?.id;
  check("PageView enviado a Meta tras aceptar", views.length >= 1, pixel ? `píxel ${pixel}` : "");
  check("un PageView por página (llegada + navegación interna)", views.length === 2, `${views.map((v) => v.dl).join(" → ")}`);
  if (withLead) {
    const res = await completeScale(yes.page);
    const leads = yes.events.filter((e) => e.ev === "Lead");
    check("el servidor confirmó el lead", res.stored === true, JSON.stringify(res));
    check("un solo Lead (doble clic incluido)", leads.length === 1, String(leads.length));
    check("Lead con content_name SCALE y eventID", leads[0]?.content === "SCALE" && /^lead_/.test(leads[0]?.eid ?? ""), `${leads[0]?.content} ${leads[0]?.eid}`);
  }
  const types = [...new Set(yes.events.map((e) => e.ev))];
  check("solo eventos PageView y Lead (ni automáticos ni de botones)", types.every((t) => t === "PageView" || t === "Lead"), types.join(", "));
  check("sin datos de usuario (coincidencia avanzada) en ningún evento", yes.events.every((e) => e.ud.length === 0));
  check("todos los eventos al mismo píxel", yes.events.every((e) => e.id === pixel), pixel ?? "");
  await yes.ctx.close();
  const no = await session(browser, false);
  check("rechaza: ninguna petición a Meta en toda la visita", no.meta.length === 0, String(no.meta.length));
  await no.ctx.close();
} finally {
  await browser.close();
  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo correcto");
  process.exitCode = failures ? 1 : 0;
}
