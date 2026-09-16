/**
 * Interaction QA via CDP: opens the mobile menu, the lead drawer (chooser + first step),
 * the services dropdown and a testimonial lightbox, and screenshots each state.
 * usage: node scripts/qa-interact.mjs <baseUrl> <outDir>
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const [base, outDir] = process.argv.slice(2);
await mkdir(outDir, { recursive: true });
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function session(W, H) {
  const PORT = 9800 + Math.floor(Math.random() * 500);
  const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", "--use-angle=metal", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/likin-qi-${PORT}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await sleep(200); }
  }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails?.exception?.description?.slice(0, 200)); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: W < 800 });
  const go = async (url) => { await send("Page.navigate", { url }); await sleep(2500); };
  const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const click = async (sel) => { await evalJs(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return 'missing'; el.scrollIntoView({block:'center'}); el.click(); return 'ok'})()`); await sleep(900); };
  const shot = async (name) => { const s = await send("Page.captureScreenshot", { format: "png" }); await writeFile(`${outDir}/${name}.png`, Buffer.from(s.result.data, "base64")); console.log("shot", name); };
  const close = () => { ws.close(); chrome.kill("SIGKILL"); };
  return { go, click, shot, evalJs, close, errors };
}

// Desktop
{
  const s = await session(1440, 900);
  await s.go(`${base}/`);
  await s.click('button[aria-haspopup="true"]'); await s.shot("d-services-open");
  await s.click('button[aria-haspopup="true"]');
  await s.click("#hero button"); await s.shot("d-lead-scale-step1");
  await s.evalJs(`(()=>{const l=document.querySelector('dialog[open] label'); if(l) l.click(); return 'ok'})()`); await sleep(300);
  await s.evalJs(`(()=>{const b=[...document.querySelectorAll('dialog[open] button[type=submit]')].pop(); if(b) b.click(); return 'ok'})()`); await sleep(900); await s.shot("d-lead-scale-step2");
  await s.evalJs(`document.querySelector('dialog[open] button[aria-label="Cerrar"]')?.click()`); await sleep(600);
  await s.evalJs(`document.querySelector('header button.max-md\\\\:hidden')?.click()`); await sleep(900); await s.shot("d-lead-chooser");
  await s.evalJs(`document.querySelector('dialog[open] button[aria-label="Cerrar"]')?.click()`); await sleep(600);
  await s.click("#testimonios article button"); await s.shot("d-video-lightbox");
  console.log("desktop errors:", s.errors.slice(0, 5));
  s.close();
}
// Mobile
{
  const s = await session(390, 844);
  await s.go(`${base}/`);
  await s.click('button[aria-controls="menu-movil"]'); await s.shot("m-menu-open");
  await s.click('button[aria-controls="menu-movil"]');
  await s.click("#hero button"); await s.shot("m-lead-scale");
  await s.evalJs(`document.querySelector('dialog[open] button[aria-label="Cerrar"]')?.click()`); await sleep(600);
  await s.evalJs(`window.scrollTo(0, 9000)`); await sleep(1500); await s.shot("m-sticky-cta");
  console.log("mobile errors:", s.errors.slice(0, 5));
  s.close();
}
process.exit(0);
