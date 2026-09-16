/**
 * QA screenshots through the Chrome DevTools Protocol (no extra dependencies).
 * usage: node scripts/qa-shot.mjs <url> <out.png> [--w=390] [--h=844] [--scroll=px|full] [--full] [--reduced] [--wait=ms] [--dpr=1]
 */
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const [url, out, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? "true"]));
const W = Number(opt.w ?? 390), H = Number(opt.h ?? 844), WAIT = Number(opt.wait ?? 1800), DPR = Number(opt.dpr ?? 1);
const PORT = 9333 + Math.floor(Math.random() * 500);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "--use-angle=metal", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/likin-qa-${PORT}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const kill = () => { try { chrome.kill("SIGKILL"); } catch {} };
process.on("exit", kill);
setTimeout(() => { console.error("timeout"); kill(); process.exit(2); }, 60000).unref();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await sleep(200); }
}
if (!targets) { console.error("chrome did not start"); kill(); process.exit(1); }
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(); const events = [];
const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method) {
    events.push(m);
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails?.exception?.description ?? JSON.stringify(m.params).slice(0, 300));
    if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) errors.push(`[console.${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300));
  }
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const waitEvent = (name, timeout = 25000) => new Promise((r) => { const t0 = Date.now(); const tick = () => { const i = events.findIndex((e) => e.method === name); if (i >= 0) return r(events.splice(i, 1)[0]); if (Date.now() - t0 > timeout) return r(null); setTimeout(tick, 50); }; tick(); });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: W < 800 });
if (W < 800) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
if (opt.reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.navigate", { url });
await waitEvent("Page.loadEventFired");
await sleep(WAIT);
if (opt.scroll && opt.scroll !== "0") {
  const y = opt.scroll === "full" ? "document.documentElement.scrollHeight" : String(Number(opt.scroll));
  await send("Runtime.evaluate", { expression: `(async()=>{const target=${y};const steps=Math.max(16,Math.ceil(target/520));for(let i=1;i<=steps;i++){window.scrollTo(0,target*i/steps);await new Promise(r=>setTimeout(r,90));}})()`, awaitPromise: true });
  await sleep(1100);
}
const metrics = await send("Runtime.evaluate", { expression: `JSON.stringify({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.documentElement.scrollHeight,y:window.scrollY})`, returnByValue: true });
const info = JSON.parse(metrics.result.result.value);
const shot = await send("Page.captureScreenshot", opt.full ? { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(info.sh, 20000), scale: 1 } } : { format: "png" });
await writeFile(out, Buffer.from(shot.result.data, "base64"));
console.log(JSON.stringify({ out, ...info, overflowX: info.sw > info.cw, errors: errors.slice(0, 8) }));
ws.close(); kill(); process.exit(0);
