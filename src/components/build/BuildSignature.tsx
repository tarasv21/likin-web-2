"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { caseBySlug } from "@/data/cases";
import { stack } from "@/data/proof";
import { useReducedMotion, useScrollProgress } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * BUILD SIGNATURE — "From idea to eCommerce". The only pin on this page.
 * Starts empty ("No hacemos webs bonitas."), then a real store built by Likin assembles inside
 * a browser window as you scroll: structure → design → product → conversion → data → READY.
 * Ends with a Shopify order notification, framed as the goal of BUILD, not a promise.
 */
const PHASES = [
  { n: "01", k: "Structure", t: "Wireframe, header, grid, navegación." },
  { n: "02", k: "Design", t: "Colores, tipografía, branding." },
  { n: "03", k: "Product", t: "Producto, galería, precio, variantes, CTA." },
  { n: "04", k: "Conversion", t: "Reviews, trust, upsells, UX." },
  { n: "05", k: "Data", t: "Pixel, analytics, tracking, Klaviyo." },
  { n: "06", k: "Ready", t: "La tienda completa. Preparada para vender." },
] as const;

const CONVERSION = ["Reviews", "Trust badges", "Upsell", "Envío gratis"];
const DATA = ["Meta Pixel", "Eventos de compra", "Klaviyo"];

export function BuildSignature() {
  const reduced = useReducedMotion();
  const { ref, subscribe } = useScrollProgress<HTMLDivElement>("pin");
  const [phase, setPhase] = useState(-1); // -1 intro, 0..6
  useEffect(
    () =>
      subscribe((p) => {
        const k = p < 0.08 ? -1 : p < 0.16 ? 0 : Math.min(6, Math.floor((p - 0.16) / 0.13) + 1);
        setPhase((prev) => (prev === k ? prev : k));
      }),
    [subscribe],
  );
  const ph = reduced ? 6 : phase;
  const store = caseBySlug("panambi-velas")!;
  const shopify = stack.find((s) => s.id === "shopify")!;
  const current = PHASES[Math.max(0, Math.min(5, ph - 1))];

  return (
    <section id="construccion" aria-labelledby="bs-title" className="bg-obsidian">
      <div ref={ref} className={cn("relative", !reduced && "h-[340svh] md:h-[320vh]")}>
        <div className={cn(reduced ? "section-pad" : "sticky top-0 flex min-h-[100svh] flex-col justify-center overflow-hidden pt-(--header-h) pb-6")}>
          {/* Intro statements (phases -1 / 0) */}
          <div className={cn("container-wide absolute inset-x-0 top-1/2 -translate-y-1/2 text-center transition-opacity duration-(--dur-slow)", ph <= 0 && !reduced ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={ph > 0}>
            <p className={cn("text-h2 transition-opacity duration-(--dur-slow)", ph === -1 ? "opacity-100" : "opacity-0")}>No hacemos webs bonitas.</p>
            <p className={cn("text-h2 -mt-[1em] transition-opacity duration-(--dur-slow)", ph === 0 ? "opacity-100" : "opacity-0")}>
              Construimos eCommerce <span className="text-teal">preparados para vender.</span>
            </p>
          </div>

          <div className={cn("container-wide grid gap-6 transition-opacity duration-(--dur-slow) md:grid-cols-12 md:items-center md:gap-8", ph >= 1 ? "opacity-100" : "opacity-0")}>
            {/* Phases */}
            <div className="order-2 md:order-1 md:col-span-5">
              <p className="text-label text-steel">From idea to eCommerce</p>
              <h2 id="bs-title" className="text-statement mt-3 md:text-h2">
                De la idea <span className="text-steel">a la tienda.</span>
              </h2>
              <ol className="mt-5 hidden border-t border-hairline md:block">
                {PHASES.map((p, i) => {
                  const on = ph >= i + 1;
                  const cur = ph === i + 1;
                  return (
                    <li key={p.k} className={cn("grid grid-cols-[2.5rem_1fr] gap-3 border-b border-hairline py-2.5 transition-colors duration-(--dur-slow)", on ? "text-cloud" : "text-steel")}>
                      <span className={cn("text-label", cur ? "text-teal" : "text-steel")}>{p.n}</span>
                      <span>
                        <span className="text-label block">{p.k}</span>
                        <span className={cn("mt-0.5 block text-small transition-opacity duration-(--dur-slow)", on ? "text-steel opacity-100" : "opacity-0")}>{p.t}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 border-t border-hairline pt-4 md:hidden" aria-live="polite">
                <span className="text-label text-teal">
                  {current.n} — {current.k}
                </span>
                <span className="mt-1 block text-small text-steel">{current.t}</span>
              </p>
              <p className="mt-5 text-xs text-steel">Tienda real construida por Likin: {store.name}. Representación del proceso, no una promesa de ventas.</p>
            </div>

            {/* Stage */}
            <div className="order-1 md:order-2 md:col-span-7">
              <div className="relative mx-auto w-full max-w-[420px] md:max-w-[560px]" style={{ perspective: "1800px" }}>
                <ul className={cn("absolute right-[calc(100%+16px)] top-[30%] hidden w-[150px] flex-col items-end gap-2 transition-opacity duration-(--dur-slow) lg:flex", ph >= 4 ? "opacity-100" : "opacity-0")} aria-hidden={ph < 4}>
                  {CONVERSION.map((c) => (
                    <li key={c} className="text-label rounded-[6px] border border-hairline px-2.5 py-1.5 text-cloud/85">
                      {c}
                    </li>
                  ))}
                </ul>
                <ul className={cn("absolute left-[calc(100%+16px)] top-[46%] hidden w-[160px] flex-col gap-2 transition-opacity duration-(--dur-slow) lg:flex", ph >= 5 ? "opacity-100" : "opacity-0")} aria-hidden={ph < 5}>
                  {DATA.map((c) => (
                    <li key={c} className="text-label rounded-[6px] border border-teal/50 px-2.5 py-1.5 text-teal">
                      {c}
                    </li>
                  ))}
                </ul>

                <figure className="relative overflow-hidden rounded-frame border border-white/10 bg-graphite shadow-float transition-transform duration-[900ms] ease-(--ease-out)" style={{ transform: reduced || ph >= 6 ? "rotateY(0deg) rotateX(0deg)" : "rotateY(-10deg) rotateX(3deg)", transformStyle: "preserve-3d" }}>
                  <div className="flex items-center gap-2 border-b border-card-border px-3.5 py-2.5">
                    <span className="flex gap-1.5" aria-hidden>
                      <i className="size-2 rounded-full bg-hairline" />
                      <i className="size-2 rounded-full bg-hairline" />
                      <i className="size-2 rounded-full bg-hairline" />
                    </span>
                    <span className={cn("text-label ml-1 truncate text-[10px] transition-colors duration-(--dur-slow)", ph >= 2 ? "text-steel" : "text-outline")}>{ph >= 2 ? "panambivelas.com" : "tu-tienda.com"}</span>
                  </div>
                  <div className={cn("relative aspect-[5/6] overflow-hidden transition-colors duration-(--dur-slow) md:aspect-[5/6]", ph >= 2 ? "bg-[#f3f1ec]" : "bg-obsidian")}>
                    {/* 01 structure */}
                    <svg viewBox="0 0 900 1080" className={cn("absolute inset-0 h-full w-full transition-opacity duration-(--dur-slow)", ph === 1 ? "opacity-100" : "opacity-0")} fill="none" stroke="var(--color-outline)" strokeWidth="2" aria-hidden>
                      <rect x="0" y="0" width="900" height="30" />
                      <rect x="0" y="30" width="900" height="66" />
                      <circle cx="450" cy="63" r="22" stroke="var(--color-teal)" />
                      <rect x="0" y="96" width="900" height="366" strokeDasharray="8 8" />
                      <line x1="150" y1="240" x2="750" y2="240" strokeWidth="14" />
                      <line x1="250" y1="275" x2="650" y2="275" strokeWidth="6" />
                      {[84, 272, 460, 648].map((x) => (
                        <g key={x}>
                          <rect x={x} y="520" width="168" height="220" strokeDasharray="8 8" />
                          <line x1={x} y1="765" x2={x + 120} y2="765" strokeWidth="6" />
                          <rect x={x} y="805" width="168" height="220" strokeDasharray="8 8" />
                        </g>
                      ))}
                    </svg>
                    {/* 02+ the real store, revealed top → bottom, then scrolled to the products */}
                    {store.store && (
                      <div
                        className="absolute inset-x-0 top-0 will-change-transform"
                        style={{
                          opacity: ph >= 2 ? 1 : 0,
                          clipPath: ph >= 2 ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
                          transform: ph >= 3 && ph < 6 ? "translateY(-34%)" : "translateY(0%)",
                          transition: "opacity 700ms var(--ease-out), clip-path 900ms var(--ease-out), transform 1000ms var(--ease-out)",
                        }}
                      >
                        <Image src={store.store.tall} alt={`Tienda de ${store.name}`} width={store.store.tallW} height={store.store.tallH} sizes="(min-width: 768px) 560px, 90vw" className="w-full" />
                      </div>
                    )}
                    {/* 03 product highlight */}
                    <div className={cn("pointer-events-none absolute inset-x-[6%] top-[42%] h-[36%] rounded-[6px] border-2 border-teal/70 transition-opacity duration-(--dur-slow)", ph === 3 ? "opacity-100" : "opacity-0")} aria-hidden />
                    {/* 06 ready */}
                    <div className={cn("absolute inset-x-3 bottom-3 flex items-center justify-between rounded-[10px] border border-hairline bg-obsidian/92 px-3 py-2.5 transition-[opacity,transform] duration-(--dur-slow)", ph >= 6 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")} aria-hidden={ph < 6}>
                      <span className="text-label text-teal">Ready to sell</span>
                      <Image src={shopify.src} alt="Shopify" width={shopify.width} height={shopify.height} sizes="60px" className="h-3.5 w-auto opacity-80" />
                    </div>
                  </div>
                </figure>
                {/* TING — order notification (demo) */}
                <div className={cn("absolute -right-3 top-[18%] w-[68%] max-w-[300px] rounded-[14px] border border-white/10 bg-[#1a2320]/95 p-3 shadow-float transition-[opacity,transform] duration-(--dur-slow) ease-(--ease-out) md:-right-8", ph >= 6 ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0")} aria-hidden={ph < 6}>
                  <div className="flex items-start gap-3">
                    <Image src={shopify.src} alt="" width={shopify.width} height={shopify.height} sizes="40px" className="mt-0.5 h-3 w-auto opacity-90" />
                    <div className="min-w-0">
                      <p className="text-small font-medium text-cloud">Nuevo pedido</p>
                      <p className="tnum text-small text-cloud/80">+49,90 € · 1 artículo · Online Store</p>
                    </div>
                  </div>
                  <p className="text-label mt-2 text-steel/70">Ejemplo</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5 lg:hidden" aria-hidden={ph < 4}>
                {ph >= 4 && CONVERSION.slice(0, 3).map((c) => <span key={c} className="text-label rounded-[6px] border border-hairline px-2 py-1 text-cloud/85">{c}</span>)}
                {ph >= 5 && DATA.map((c) => <span key={c} className="text-label rounded-[6px] border border-teal/50 px-2 py-1 text-teal">{c}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
