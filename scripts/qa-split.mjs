// Splits a tall screenshot into N viewable parts: node scripts/qa-split.mjs file.png N
import sharp from "sharp";
const [f, nStr] = process.argv.slice(2); const n = Number(nStr ?? 4);
const m = await sharp(f).metadata(); const H = m.height, W = m.width; const step = Math.ceil(H / n);
for (let i = 0; i < n; i++) { const top = i * step; const h = Math.min(step, H - top); if (h <= 0) break; await sharp(f).extract({ left: 0, top, width: W, height: h }).resize(Math.min(W, 1000)).png().toFile(f.replace(/\.png$/, `-part${i + 1}.png`)); }
console.log(f, W, H, "->", n, "parts");
