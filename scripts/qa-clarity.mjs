/**
 * QA local de Microsoft Clarity con consentimiento (nada sale hacia Microsoft: sus peticiones se
 * responden aquí). Chromium resuelve el dominio real hacia el servidor local, porque Clarity solo
 * carga en el dominio real:
 *   npm i --no-save playwright-core@1.63.0
 *   NEXT_PUBLIC_META_PIXEL_ID=1234567890 npx next build && npx next start -p 3300
 *   node scripts/qa-clarity.mjs
 * Comprueba: nada de Clarity antes de decidir ni al rechazar; al aceptar, la señal de consentimiento
 * (analítica sí, publicidad no) y el script una sola vez, también al navegar; el formulario oculto
 * para Clarity; retirar borra sus cookies; en otro dominio (local, previews) no carga.
 */
import { chromium } from "playwright-core";

const SITE = "www.likinagency.com";
const PORT = process.env.QA_PORT ?? "3300";
const BASE = `http://${SITE}:${PORT}`;
const ID = "yw01dhn5vl";
let failures = 0;
const check = (label, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const hits = [];
  await ctx.route(/clarity\.ms/, (route) => {
    hits.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "/* clarity local */" });
  });
  await ctx.route(/googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|facebook\.com/, (route) => route.fulfill({ status: 204, body: "" }));
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  return { ctx, page, hits };
}
const queue = (page) => page.evaluate(() => (window.clarity?.q ?? []).map((a) => Array.from(a)));
const decide = async (page, choice) => {
  await page.getByRole("region", { name: "Cookies" }).getByRole("button", { name: choice }).click();
  await wait(2000);
};

const browser = await chromium.launch({ channel: "chromium", args: [`--host-resolver-rules=MAP ${SITE} 127.0.0.1`] });
try {
  const yes = await open(browser, BASE);
  check("el aviso nombra Microsoft Clarity", /Microsoft Clarity/.test(await yes.page.getByRole("region", { name: "Cookies" }).innerText()));
  check("nada de Clarity antes de decidir", yes.hits.length === 0 && !(await yes.page.evaluate(() => "clarity" in window)), String(yes.hits.length));
  await decide(yes.page, "Aceptar todas");
  const q = await queue(yes.page);
  check("al aceptar: señal de consentimiento (analítica sí, publicidad no) antes de nada", JSON.stringify(q[0]) === JSON.stringify(["consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }]), JSON.stringify(q[0]));
  check(`al aceptar: el script de Clarity una vez, con ${ID}`, yes.hits.filter((u) => u.includes(`/tag/${ID}`)).length === 1, yes.hits.join(" "));
  await yes.page.locator("footer").getByRole("link", { name: "Privacidad" }).click();
  await yes.page.waitForURL("**/privacidad");
  await wait(1500);
  check("navegar no lo duplica (una etiqueta)", (await yes.page.locator('script[src*="clarity.ms/tag/"]').count()) === 1 && yes.hits.filter((u) => u.includes("/tag/")).length === 1);
  await yes.page.goto(`${BASE}/escalar-ecommerce#lead-scale`, { waitUntil: "networkidle" });
  await wait(1200);
  check("el formulario está oculto para Clarity (data-clarity-mask)", (await yes.page.locator('dialog[data-clarity-mask="True"]').count()) === 1);
  await yes.page.evaluate(() => {
    document.cookie = "_clck=qa; path=/; domain=.likinagency.com";
    document.cookie = "_clsk=qa; path=/; domain=.likinagency.com";
    document.querySelector("dialog[open]")?.close();
  });
  await yes.page.getByRole("button", { name: "Configurar cookies" }).first().click();
  await decide(yes.page, "Rechazar todas");
  const tail = (await queue(yes.page)).slice(-2);
  const left = (await yes.ctx.cookies()).filter((c) => c.name.startsWith("_cl")).map((c) => c.name);
  check("retirar: sin consentimiento para Clarity y cookies _clck/_clsk borradas", JSON.stringify(tail) === JSON.stringify([["consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }], ["consent", false]]) && left.length === 0, `${JSON.stringify(tail)} ${left}`);
  await yes.ctx.close();

  const no = await open(browser, BASE);
  await decide(no.page, "Rechazar todas");
  await no.page.goto(`${BASE}/privacidad`, { waitUntil: "networkidle" });
  check("rechaza: nada de Clarity en toda la visita", no.hits.length === 0, String(no.hits.length));
  await no.ctx.close();

  const local = await open(browser, `http://localhost:${PORT}`);
  await decide(local.page, "Aceptar todas");
  check("otro dominio (local o previews): aunque acepten, Clarity no carga", local.hits.length === 0, String(local.hits.length));
  await local.ctx.close();
} catch (e) {
  failures++;
  console.log(`✗ la QA se ha detenido: ${e.message.split("\n")[0]}`);
} finally {
  await browser.close();
  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo correcto");
  process.exitCode = failures ? 1 : 0;
}
