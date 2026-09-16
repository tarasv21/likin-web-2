/**
 * Asset pipeline. Reads the original material from "New likin web" and writes
 * optimised, cleanly-named files into /public plus a manifest with dimensions.
 * Numbers inside screenshots are never altered: images are only resized, cropped and re-encoded.
 *
 *   node scripts/prepare-assets.mjs [source-folder]
 */
import sharp from "sharp";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2] ?? "/Users/taras/Desktop/CLAUDE/New likin web";
const OUT = path.resolve(process.cwd(), "public");
const ensure = (p) => mkdir(p, { recursive: true });

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\.(png|webp|jpg|jpeg)$/i, "")
    .replace(/^(logo|web)\s+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function brand() {
  await ensure(`${OUT}/brand`);
  // Wordmark is displayed at 18–22px high: ship a 4× raster (≈ 6 kB) instead of the 1717px master.
  await sharp(`${SRC}/Logo entero letras blanca.png`).trim().resize({ height: 96 }).png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/brand/likin-wordmark-white.png`);

  // Fingerprint sprite: one <path> per ridge, referenced with <use href="/brand/fingerprint.svg#rN">.
  const fp = await readFile(new URL("../src/data/fingerprint.ts", import.meta.url), "utf8");
  const vb = fp.match(/FINGERPRINT_VIEWBOX = "([^"]+)"/)[1];
  const ridges = [...fp.matchAll(/^\s+"(M [^"]+)",?$/gm)].map((m) => m[1]);
  if (ridges.length !== 11) throw new Error(`Expected 11 ridges, found ${ridges.length}`);
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${ridges.map((d, i) => `<path id="r${i}" d="${d}" pathLength="1000"/>`).join("")}</svg>`;
  await writeFile(`${OUT}/brand/fingerprint.svg`, sprite);
  await sharp(`${SRC}/Icono del logo.png`).trim().png({ compressionLevel: 9 }).toFile(`${OUT}/brand/fingerprint-icon.png`);

  // Hero render (metal fingerprint, alpha). Fallback for mobile / reduced motion / no WebGL,
  // and the LCP image before the 3D scene is ready.
  const hero = sharp(`${SRC}/Logo para HERO scroll.png`).trim();
  const buf = await hero.png().toBuffer();
  for (const w of [1200, 960, 720, 520]) {
    await sharp(buf).resize(w, w, { fit: "inside", withoutEnlargement: true }).webp({ quality: 74, alphaQuality: 80, effort: 6 }).toFile(`${OUT}/brand/fingerprint-metal-${w}.webp`);
  }
  const hm = await sharp(`${OUT}/brand/fingerprint-metal-1200.webp`).metadata();

  await sharp(`${SRC}/Favicon.png`).resize(512).png().toFile(`${OUT}/brand/favicon-512.png`);
  await sharp(`${SRC}/Favicon.png`).resize(192).png().toFile(`${OUT}/brand/favicon-192.png`);
  await sharp(`${SRC}/Favicon.png`).resize(180).png().toFile(`${OUT}/brand/apple-touch-icon.png`);
  await sharp(`${SRC}/Favicon.png`).resize(32).png().toFile(`${OUT}/brand/favicon-32.png`);
  return { heroMetal: { width: hm.width, height: hm.height } };
}

async function founder() {
  await ensure(`${OUT}/founder`);
  const src = sharp(`${SRC}/Foto Taras.JPG`).rotate();
  const { width, height } = await src.clone().metadata();
  // Editorial crops: portrait 4/5 centred on the subject (subject sits ~ 55% down the frame),
  // and a wide 3/2 crop for the light section on desktop.
  const top = Math.round(height * 0.16);
  const portraitH = Math.round(width * 1.25);
  await src.clone().extract({ left: 0, top, width, height: Math.min(portraitH, height - top) }).resize(1200).webp({ quality: 82 }).toFile(`${OUT}/founder/taras-portrait.webp`);
  await src.clone().extract({ left: 0, top, width, height: Math.min(portraitH, height - top) }).resize(720).webp({ quality: 80 }).toFile(`${OUT}/founder/taras-portrait-720.webp`);
  // Square crop for compact placements
  const sqTop = Math.round(height * 0.2);
  await src.clone().extract({ left: 0, top: sqTop, width, height: Math.min(width, height - sqTop) }).resize(900, 900).webp({ quality: 80 }).toFile(`${OUT}/founder/taras-square.webp`);
}

async function clients() {
  await ensure(`${OUT}/clients`);
  const dir = `${SRC}/Logos clientes`;
  const out = [];
  for (const f of (await readdir(dir)).filter((f) => /\.png$/i.test(f))) {
    const name = slug(f);
    const img = sharp(`${dir}/${f}`).trim();
    const meta = await img.clone().toBuffer({ resolveWithObject: true });
    const w = meta.info.width, h = meta.info.height;
    await img.resize({ width: Math.min(w, 720), height: Math.min(h, 720), fit: "inside" }).png({ compressionLevel: 9 }).toFile(`${OUT}/clients/${name}.png`);
    const m2 = await sharp(`${OUT}/clients/${name}.png`).metadata();
    // Mean luminance of opaque pixels → dark logos need inversion / a light card on Obsidian
    const { data, info } = await sharp(`${OUT}/clients/${name}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let sum = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 128) { sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; n += 1; }
    }
    const dark = n > 0 && sum / n < 110;
    void info;
    out.push({ name, width: m2.width, height: m2.height, dark });
  }
  return out;
}

async function stack() {
  await ensure(`${OUT}/stack`);
  const dir = `${SRC}/Parthers`;
  const out = [];
  for (const f of (await readdir(dir)).filter((f) => /\.png$/i.test(f))) {
    const name = slug(f).replace(/-?parth?e?ners?$/i, "").replace(/-$/, "");
    await sharp(`${dir}/${f}`).trim().resize({ width: 480, height: 200, fit: "inside" }).png({ compressionLevel: 9 }).toFile(`${OUT}/stack/${name}.png`);
    const m = await sharp(`${OUT}/stack/${name}.png`).metadata();
    out.push({ name, width: m.width, height: m.height });
  }
  return out;
}

async function panels() {
  await ensure(`${OUT}/panels`);
  const dir = `${SRC}/Capturas de paneles de shopify de negocios`;
  const out = [];
  for (const f of (await readdir(dir)).filter((f) => /\.png$/i.test(f))) {
    const name = slug(f);
    const img = sharp(`${dir}/${f}`);
    const { width, height } = await img.metadata();
    // Crop to the analytics card (skip browser chrome and the assistant bar)
    const top = Math.round(height * 0.052);
    const cropH = Math.round(height * 0.655);
    await img.clone().extract({ left: 0, top, width, height: cropH }).resize(1200).webp({ quality: 80 }).toFile(`${OUT}/panels/${name}.webp`);
    await img.clone().extract({ left: 0, top, width, height: cropH }).resize(640).webp({ quality: 76 }).toFile(`${OUT}/panels/${name}-640.webp`);
    const m = await sharp(`${OUT}/panels/${name}.webp`).metadata();
    out.push({ name, width: m.width, height: m.height });
  }
  return out;
}

async function stores() {
  await ensure(`${OUT}/stores`);
  const dir = `${SRC}/Capturas paginas web hechas por likin`;
  const out = [];
  for (const f of (await readdir(dir)).filter((f) => /\.webp$/i.test(f))) {
    const name = slug(f);
    const img = sharp(`${dir}/${f}`);
    const { width, height } = await img.metadata();
    // fold 16:10 (cards), tall 5:7 (browser mockups), long 1:2.6 (scroll-through previews)
    const foldH = Math.min(height, Math.round(width * 0.625));
    await img.clone().extract({ left: 0, top: 0, width, height: foldH }).resize(1440).webp({ quality: 80 }).toFile(`${OUT}/stores/${name}-fold.webp`);
    await img.clone().extract({ left: 0, top: 0, width, height: foldH }).resize(800).webp({ quality: 76 }).toFile(`${OUT}/stores/${name}-fold-800.webp`);
    const tallH = Math.min(height, Math.round(width * 1.4));
    await img.clone().extract({ left: 0, top: 0, width, height: tallH }).resize(900).webp({ quality: 78 }).toFile(`${OUT}/stores/${name}-tall.webp`);
    const longH = Math.min(height, Math.round(width * 2.6));
    await img.clone().extract({ left: 0, top: 0, width, height: longH }).resize(720).webp({ quality: 74 }).toFile(`${OUT}/stores/${name}-long.webp`);
    const m = await sharp(`${OUT}/stores/${name}-fold.webp`).metadata();
    const t = await sharp(`${OUT}/stores/${name}-tall.webp`).metadata();
    const l = await sharp(`${OUT}/stores/${name}-long.webp`).metadata();
    out.push({ name, fold: { width: m.width, height: m.height }, tall: { width: t.width, height: t.height }, long: { width: l.width, height: l.height } });
  }
  return out;
}

async function notifications() {
  await ensure(`${OUT}/notifications`);
  const dir = `${SRC}/notificaciones shopify para animacion`;
  const files = (await readdir(dir)).filter((f) => /\.png$/i.test(f)).sort();
  const out = [];
  let i = 0;
  for (const f of files) {
    i += 1;
    const name = `order-${i}`;
    await sharp(`${dir}/${f}`).trim().resize(760).webp({ quality: 82, alphaQuality: 90 }).toFile(`${OUT}/notifications/${name}.webp`);
    const m = await sharp(`${OUT}/notifications/${name}.webp`).metadata();
    out.push({ name, source: f, width: m.width, height: m.height });
  }
  return out;
}

const exists = async (p) => !!(await stat(p).catch(() => null));
if (!(await exists(SRC))) {
  console.error("Source folder not found:", SRC);
  process.exit(1);
}

const brandOut = await brand();
await founder();
const manifest = {
  brand: brandOut,
  clients: await clients(),
  stack: await stack(),
  panels: await panels(),
  stores: await stores(),
  notifications: await notifications(),
};
await ensure(`${process.cwd()}/src/data`);
await writeFile(`${process.cwd()}/src/data/asset-manifest.json`, JSON.stringify(manifest, null, 2));
console.log("Assets prepared:", Object.fromEntries(Object.entries(manifest).map(([k, v]) => [k, Array.isArray(v) ? v.length : "ok"])));
