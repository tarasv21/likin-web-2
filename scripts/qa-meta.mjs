/**
 * QA local del píxel + API de Conversiones con consentimiento (nada sale de la máquina):
 *   npm i --no-save playwright-core@1.63.0
 *   NEXT_PUBLIC_META_PIXEL_ID=1234567890 NEXT_PUBLIC_CALENDLY_SCALE_URL=https://calendly.com/qa-local/scale npx next build
 *   NODE_OPTIONS="--import ./scripts/qa-net-recorder.mjs" QA_NET_RECORD=/tmp/lk-meta/net.jsonl CRM_INGEST_URL= \
 *     RESEND_API_KEY=local LEAD_EMAIL_FROM="LIKIN Web <web@likinagency.com>" \
 *     META_CAPI_ACCESS_TOKEN=token-local-de-prueba-0123456789 npx next start -p 3300
 *   node scripts/qa-meta.mjs /tmp/lk-meta
 * Comprueba (decisión del 2026-10-12: solo PageView y Lead, sin datos personales): nada antes de
 * decidir; con publicidad, PageView (llegada y navegación interna) y un Lead en el píxel y en la API
 * con el MISMO event_id; el Lead lleva solo el servicio; ningún otro evento (email, reserva,
 * formulario); ni email, ni teléfono, ni nombre (tampoco con hash), ni respuestas, ni valoración; un
 * email por envío (doble clic); el paso de contacto se puede completar en móvil; «Rechazar todas» o
 * solo analítica: el lead llega igual y no sale nada hacia Meta.
 */
import { chromium } from "playwright-core";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.QA_BASE ?? "http://localhost:3300";
const NET = join(process.argv[2] ?? "/tmp/lk-meta", "net.jsonl");
const net = () => (existsSync(NET) ? readFileSync(NET, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const graph = (from) => net().slice(from).filter((r) => r.to === "graph.facebook.com").flatMap((r) => r.body.data ?? []);
const STUB = `(() => { const f = window.fbq; window.__fbq = window.__fbq ?? []; f.callMethod = function () { window.__fbq.push(Array.from(arguments)); };
  for (const a of f.queue) f.callMethod.apply(f, a); f.queue = []; })();`;
let failures = 0;
const check = (label, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** "all" (Aceptar todas), "none" (Rechazar todas) or "analytics" (Configurar → solo Analítica). */
async function open(browser, choice) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const meta = [];
  await ctx.route(/connect\.facebook\.net|facebook\.com|calendly\.com/, (route) => {
    const url = route.request().url();
    if (!url.includes("calendly.com")) meta.push(url);
    return url.includes("fbevents.js") ? route.fulfill({ status: 200, contentType: "application/javascript", body: STUB }) : route.fulfill({ status: 204, body: "" });
  });
  const page = await ctx.newPage();
  const start = net().length;
  await page.goto(`${BASE}/escalar-ecommerce?utm_source=meta&utm_medium=paid_social&utm_campaign=qa_capi&fbclid=IwAR0qacapitest01`, { waitUntil: "networkidle" });
  check(`${choice}: nada de Meta antes de decidir (navegador y servidor)`, meta.length === 0 && graph(start).length === 0);
  const banner = page.getByRole("region", { name: "Cookies" });
  if (choice === "analytics") {
    await banner.getByRole("button", { name: "Configurar", exact: true }).click();
    await banner.getByRole("switch", { name: /Analítica/ }).check();
    await banner.getByRole("button", { name: "Guardar selección" }).click();
  } else await banner.getByRole("button", { name: choice === "all" ? "Aceptar todas" : "Rechazar todas" }).click();
  await wait(1500);
  return { ctx, page, meta, start };
}

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
  await page.getByLabel("Nombre y apellidos").fill("Lucía Prueba Meta");
  await page.getByLabel("Email profesional").fill("Lucia.QA@lk-meta.example");
  await page.getByLabel("Teléfono o WhatsApp").fill("600 000 444");
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
  const yes = await open(browser, "all");
  const fbq = () => yes.page.evaluate(() => window.__fbq ?? []);
  const tracked = async () => (await fbq()).filter((c) => c[0] === "track" || c[0] === "trackCustom" || c[0] === "trackSingle" || c[0] === "trackSingleCustom");
  const pv = (await fbq()).find((c) => c[1] === "PageView");
  const pvServer = graph(yes.start).find((e) => e.event_name === "PageView");
  check("PageView en píxel y API con el mismo event_id", Boolean(pv?.[3]?.eventID) && pvServer?.event_id === pv[3].eventID, `${pv?.[3]?.eventID} / ${pvServer?.event_id}`);
  check("API: IP, navegador, URL, website y fbc desde el fbclid", Boolean(pvServer?.user_data.client_ip_address && pvServer?.user_data.client_user_agent && pvServer?.user_data.fbc?.endsWith(".IwAR0qacapitest01") && pvServer?.action_source === "website" && pvServer?.event_source_url?.includes("/escalar-ecommerce")), JSON.stringify(pvServer?.user_data ?? {}).slice(0, 160));
  check("sin configuración automática del píxel (no lee botones ni formularios)", (await fbq()).some((c) => c[0] === "set" && c[1] === "autoConfig" && c[2] === false));

  await yes.page.locator("footer").getByRole("link", { name: "Privacidad" }).click();
  await yes.page.waitForURL("**/privacidad");
  await wait(1500);
  const views = (await fbq()).filter((c) => c[1] === "PageView");
  const viewsServer = graph(yes.start).filter((e) => e.event_name === "PageView");
  check("navegación interna: segundo PageView, también en la API", views.length === 2 && viewsServer.length === 2 && viewsServer[1].event_id === views[1][3].eventID && viewsServer[1].event_source_url.endsWith("/privacidad"), `${views.length} / ${viewsServer.length}`);

  await yes.page.evaluate(() => document.addEventListener("click", (e) => { if (e.target.closest?.('a[href^="mailto:"]')) e.preventDefault(); }));
  await yes.page.locator('footer a[href^="mailto:"]').first().click();
  await wait(1200);
  check("clic en el email: ningún evento (ya no se envía Contact)", (await tracked()).every((c) => c[1] === "PageView") && graph(yes.start).every((e) => e.event_name === "PageView"), JSON.stringify((await tracked()).map((c) => c[1])));

  await yes.page.goto(`${BASE}/escalar-ecommerce`, { waitUntil: "networkidle" });
  const before = net().length;
  const sent = await completeScale(yes.page);
  check("móvil: la casilla de consentimiento queda a la vista en el paso de contacto", sent.reachable);
  check("el servidor confirma el lead (stored, por email)", sent.status === 200 && sent.body.stored === true && sent.body.channel === "email", JSON.stringify(sent.body));
  const leads = (await fbq()).filter((c) => c[1] === "Lead");
  const leadServer = graph(before).filter((e) => e.event_name === "Lead");
  const mails = net().slice(before).filter((r) => r.to === "api.resend.com");
  check("un email por el doble clic, con el JSON del lead adjunto", mails.length === 1 && mails[0].body.attachments?.[0]?.filename?.startsWith("lead-lead_"), String(mails.length));
  check("un Lead en el píxel, con el id del lead", leads.length === 1 && leads[0][0] === "track" && /^lead_/.test(leads[0][3]?.eventID ?? ""), JSON.stringify(leads));
  check("un Lead en la API, del servidor, con el mismo event_id", leadServer.length === 1 && leadServer[0].event_id === leads[0]?.[3]?.eventID, leadServer[0]?.event_id);
  const onlyService = { content_name: "SCALE", content_category: "likinagency.com" };
  check("Lead: solo el servicio, en píxel y API (sin valoración ni respuestas)", JSON.stringify(leads[0]?.[2]) === JSON.stringify(onlyService) && JSON.stringify(leadServer[0]?.custom_data) === JSON.stringify(onlyService), `${JSON.stringify(leads[0]?.[2])} / ${JSON.stringify(leadServer[0]?.custom_data)}`);
  const ud = leadServer[0]?.user_data ?? {};
  check("Lead: sin coincidencia avanzada (ni em, ph, fn, ln, external_id), solo IP, navegador y fbc", Object.keys(ud).sort().join(",") === "client_ip_address,client_user_agent,fbc" && Boolean(ud.fbc?.endsWith(".IwAR0qacapitest01")), Object.keys(ud).join(","));

  const popup = yes.page.context().waitForEvent("page").catch(() => null);
  await yes.page.getByRole("link", { name: "Reservar reunión" }).click();
  await popup;
  await wait(1500);
  const names = [...new Set([...(await tracked()).map((c) => c[1]), ...graph(yes.start).map((e) => e.event_name)])].sort();
  check("en toda la visita, solo PageView y Lead (sin formulario, último paso ni reserva)", names.join(",") === "Lead,PageView", names.join(","));
  check("ningún dato personal hacia Meta, ni en claro ni con hash", !/Lucia|Lucía|lk-meta\.example|600 ?000 ?444|Marca Meta QA|HIGH_FIT|qualification|"em"|"ph"|"fn"/i.test(JSON.stringify(graph(yes.start)) + JSON.stringify(await fbq())));
  check("el token nunca aparece fuera del servidor (el registro local lo sustituye)", !net().some((r) => JSON.stringify(r).includes("token-local-de-prueba")));
  await yes.ctx.close();

  for (const choice of ["none", "analytics"]) {
    const no = await open(browser, choice);
    await no.page.evaluate(() => document.addEventListener("click", (e) => { if (e.target.closest?.('a[href^="mailto:"]')) e.preventDefault(); }));
    await no.page.locator('footer a[href^="mailto:"]').first().click();
    const beforeNo = net().length;
    const sentNo = await completeScale(no.page);
    check(`${choice}: el lead se recibe igual (email)`, sentNo.status === 200 && sentNo.body.stored === true && net().slice(beforeNo).filter((r) => r.to === "api.resend.com").length === 1, JSON.stringify(sentNo.body));
    const popupNo = no.page.context().waitForEvent("page").catch(() => null);
    await no.page.getByRole("link", { name: "Reservar reunión" }).click();
    await popupNo;
    await wait(1500);
    check(`${choice}: ni píxel ni API en toda la visita`, no.meta.length === 0 && graph(no.start).length === 0, `${no.meta.length} / ${graph(no.start).length}`);
    if (choice === "none") {
      for (const path of ["/aviso-legal", "/privacidad", "/cookies"]) {
        await no.page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
        check(`${path} carga`, (await no.page.locator("h1").innerText()).length > 3);
      }
    }
    await no.ctx.close();
  }
} catch (e) {
  failures++;
  console.log(`✗ la QA se ha detenido: ${e.message.split("\n")[0]}`);
} finally {
  await browser.close();
  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo correcto");
  process.exitCode = failures ? 1 : 0;
}
