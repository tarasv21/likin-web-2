/**
 * Transcodes the testimonial videos to small, mobile-safe MP4s (+ poster JPGs).
 * Target: ≤ 3 MB per clip. Vertical 720px tall, H.264 high, CRF 30, AAC 80k.
 *
 *   node scripts/encode-videos.mjs [source-folder]
 */
import { spawnSync } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const FF = require("ffmpeg-static");
const SRC = process.argv[2] ?? "/Users/taras/Desktop/CLAUDE/New likin web/Videos testimonio";
const OUT = path.resolve(process.cwd(), "public/video/testimonials");
await mkdir(OUT, { recursive: true });

const CLIPS = [
  ["Bikini Azul (vermut artesanal) (1).mp4", "bikini-azul", 30],
  ["Bordando Hilos (Ropa personalizada bordada) (2).MOV", "bordando-hilos", 31],
  ["Cristina Mua Kit.MOV", "mua-kit", 31],
  ["El regalo mas molón 1.0 (regalos personalizados) .mp4", "el-regalo-mas-molon", 33],
  ["Esther pipiolachic (1).MOV", "pipiola-chic", 34],
  ["Fluxis (ropa personalizada dtf) (3).mp4", "fluxis", 31],
  ["Gisela tartas (2).mp4", "tartas-bastante-majas", 32],
  ["Jardi (tienda online vinos) (2).mp4", "vinoteca-jardi", 30],
];

for (const [file, name, crf] of CLIPS) {
  const input = path.join(SRC, file);
  const out = path.join(OUT, `${name}.mp4`);
  const poster = path.join(OUT, `${name}.jpg`);
  const args = [
    "-y", "-v", "error", "-i", input,
    "-vf", "scale=-2:720:flags=lanczos,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-profile:v", "high", "-level", "4.0",
    "-movflags", "+faststart", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "80k", "-ac", "1", "-ar", "44100",
    out,
  ];
  const r = spawnSync(FF, args, { stdio: "inherit" });
  if (r.status !== 0) { console.error("ffmpeg failed for", file); process.exit(1); }
  spawnSync(FF, ["-y", "-v", "error", "-ss", "1.2", "-i", out, "-frames:v", "1", "-q:v", "4", "-vf", "scale=-2:960", poster], { stdio: "inherit" });
  const s = await stat(out);
  console.log(name, (s.size / 1e6).toFixed(2), "MB");
}
