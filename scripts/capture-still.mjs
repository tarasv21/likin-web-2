/**
 * Captures the hero object from the live scene (dev server) as a transparent PNG and writes
 * public/brand/print-titanium.webp (+ a 720px variant). usage: node scripts/capture-still.mjs [base]
 */
import { spawn } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import sharp from "sharp";

const base = process.argv[2] ?? "http://localhost:3010";
const W = 1200, H = 1600, PORT = 9600 + Math.floor(Math.random() * 300);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", "--no-first-run", "--use-angle=metal", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/likin-still-${PORT}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const kill = () => { try { chrome.kill("SIGKILL"); } catch {} };
process.on("exit", kill);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
await send("Page.navigate", { url: `${base}/still-capture` });
await sleep(6000);
// make the document itself transparent
await send("Runtime.evaluate", { expression: `document.documentElement.style.background='transparent';document.body.style.background='transparent';document.querySelectorAll('header,footer,nextjs-portal,main>*:not(#still)').forEach(e=>e.style.display='none');` });
await sleep(400);
const shot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
const raw = Buffer.from(shot.result.data, "base64");
await writeFile("/tmp/likin-still-raw.png", raw);
const img = sharp(raw).trim({ threshold: 8 });
const meta = await img.clone().toBuffer({ resolveWithObject: true });
console.log("trimmed", meta.info.width, meta.info.height);
await img.clone().resize({ height: 1400, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile("public/brand/print-titanium.webp");
await img.clone().resize({ height: 800, withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile("public/brand/print-titanium-800.webp");
await unlink("/tmp/likin-still-raw.png").catch(() => {});
ws.close(); kill(); process.exit(0);
