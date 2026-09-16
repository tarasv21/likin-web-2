import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "LIKIN — Creamos y escalamos eCommerce.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [sans, mono, print] = await Promise.all([
    readFile(path.join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf")),
    readFile(path.join(process.cwd(), "node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.ttf")),
    readFile(path.join(process.cwd(), "public/brand/fingerprint-metal-og.png")),
  ]);
  const printSrc = `data:image/png;base64,${print.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#050807", color: "#F5F7F6", padding: 72, fontFamily: "Geist", position: "relative" }}>
        { }
        <img src={printSrc} alt="" width={520} height={530} style={{ position: "absolute", right: 40, top: 50, opacity: 0.95 }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 22, letterSpacing: 3, color: "#7C8985" }}>AGENCIA ECOMMERCE · SHOPIFY · GROWTH</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 118, lineHeight: 0.92, letterSpacing: -6 }}>
            <span>Creamos y</span>
            <span>escalamos</span>
            <span>eCommerce.</span>
          </div>
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 22, letterSpacing: 3, color: "#00D6B2" }}>LIKIN</div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Geist", data: sans, weight: 500, style: "normal" }, { name: "GeistMono", data: mono, weight: 500, style: "normal" }] },
  );
}
