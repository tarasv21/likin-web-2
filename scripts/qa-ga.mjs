/**
 * QA local de Google Analytics 4 con consentimiento (nada sale hacia Google: sus peticiones se responden aquí).
 * Chromium resuelve el dominio real hacia el servidor local, porque GA solo carga en el dominio real:
 *   npm i --no-save playwright-core@1.63.0
 *   NEXT_PUBLIC_META_PIXEL_ID=1234567890 npx next build && npx next start -p 3300
 *   QA_GA_SITE=www.likinagency.com QA_GA_PORT=3300 QA_GA_ID=G-8261QVV57Y QA_GA_NEXT=/privacidad node scripts/qa-ga.mjs
 * Comprueba: nada de Google antes de decidir ni al rechazar; al aceptar, gtag.js una sola vez, con el
 * consentimiento (solo analítica, sin señales publicitarias) ANTES de config; navegar no lo duplica;
 * retirar desactiva GA y borra _ga; en otro dominio (local, previews) no carga.
 */
import { chromium } from "playwright-core";

const SITE = process.env.QA_GA_SITE ?? "www.likinagency.com";
const PORT = process.env.QA_GA_PORT ?? "3300";
const ID = process.env.QA_GA_ID ?? "G-8261QVV57Y";
const NEXT = process.env.QA_GA_NEXT ?? "/privacidad";
const BASE = `http://${SITE}:${PORT}`;
const ROOT = SITE.replace(/^www\./, "");
let failures = 0;
const check = (label, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const google = [];
  await ctx.route(/googletagmanager\.com|google-analytics\.com/, (route) => {
    google.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "/* gtag.js local */" });
  });
  await ctx.route(/connect\.facebook\.net|facebook\.com/, (route) => route.fulfill({ status: 204, body: "" }));
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  return { ctx, page, google };
}
const layer = (page) => page.evaluate(() => (window.dataLayer ?? []).map((a) => (a && typeof a === "object" && "length" in a ? Array.from(a) : a)));
const decide = async (page, choice) => {
  await page.getByRole("region", { name: "Cookies" }).getByRole("button", { name: choice }).click();
  await wait(2500);
};

const browser = await chromium.launch({ channel: "chromium", args: [`--host-resolver-rules=MAP ${SITE} 127.0.0.1`] });
try {
  const yes = await open(browser, BASE);
  const banner = await yes.page.getByRole("region", { name: "Cookies" }).innerText();
  check("el aviso nombra Google Analytics y Meta", /Google Analytics/.test(banner) && /Meta/.test(banner));
  check("nada de Google antes de decidir", yes.google.length === 0 && !(await layer(yes.page)).some((c) => Array.isArray(c) && c[0] === "config"), String(yes.google.length));
  await decide(yes.page, "Aceptar todas");
  const loads = yes.google.filter((u) => u.includes(`gtag/js?id=${ID}`));
  check(`al aceptar, gtag.js una vez con ${ID}`, loads.length === 1, yes.google.join(" "));
  const dl = (await layer(yes.page)).filter(Array.isArray);
  const iConsent = dl.findIndex((c) => c[0] === "consent" && c[1] === "default");
  const iConfig = dl.findIndex((c) => c[0] === "config" && c[1] === ID);
  check("consentimiento solo de analítica antes de config", iConsent >= 0 && iConfig > iConsent && JSON.stringify(dl[iConsent][2]) === JSON.stringify({ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }), `${iConsent} < ${iConfig}`);
  check("sin Google Signals ni personalización de anuncios", dl.some((c) => c[0] === "set" && c[1]?.allow_google_signals === false && c[1]?.allow_ad_personalization_signals === false));
  await yes.page.goto(`${BASE}${NEXT}`, { waitUntil: "networkidle" }).catch(() => undefined);
  await wait(2000);
  const tags = await yes.page.locator('script[src*="googletagmanager.com/gtag/js"]').count();
  const configs = (await layer(yes.page)).filter((c) => Array.isArray(c) && c[0] === "config").length;
  check("en la página siguiente, una sola etiqueta y un solo config", tags === 1 && configs === 1, `${tags} etiqueta(s), ${configs} config`);
  const suffix = ID.replace(/^G-/, "");
  await yes.page.evaluate(([root, sfx]) => {
    document.cookie = `_ga=GA1.1.123.456; path=/; domain=.${root}`;
    document.cookie = `_ga_${sfx}=GS1.1.789; path=/; domain=.${root}`;
  }, [ROOT, suffix]);
  await yes.page.getByRole("button", { name: "Configurar cookies" }).first().click();
  await decide(yes.page, "Rechazar todas");
  const disabled = await yes.page.evaluate((id) => window[`ga-disable-${id}`] === true, ID);
  const last = (await layer(yes.page)).filter(Array.isArray).at(-1);
  const cookies = (await yes.ctx.cookies()).map((c) => c.name).filter((n) => n.startsWith("_ga"));
  check("retirar: GA desactivado, consentimiento denegado y cookies _ga borradas", disabled && last?.[0] === "consent" && last?.[2]?.analytics_storage === "denied" && cookies.length === 0, `${disabled} ${JSON.stringify(last)} ${cookies}`);
  await yes.ctx.close();

  const no = await open(browser, BASE);
  await decide(no.page, "Rechazar todas");
  await no.page.goto(`${BASE}${NEXT}`, { waitUntil: "networkidle" }).catch(() => undefined);
  await wait(1500);
  check("rechaza: nada de Google en toda la visita", no.google.length === 0, String(no.google.length));
  await no.ctx.close();

  const local = await open(browser, `http://localhost:${PORT}`);
  await decide(local.page, "Aceptar todas");
  check("otro dominio (local o previews): aunque acepten, GA no carga", local.google.length === 0, String(local.google.length));
  await local.ctx.close();
} catch (e) {
  failures++;
  console.log(`✗ la QA se ha detenido: ${e.message.split("\n")[0]}`);
} finally {
  await browser.close();
  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo correcto");
  process.exitCode = failures ? 1 : 0;
}
