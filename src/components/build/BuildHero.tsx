"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useLead } from "@/components/layout/Providers";
import { caseBySlug } from "@/data/cases";
import { site } from "@/data/site";
import { useReducedMotion } from "@/lib/hooks";
import { cn, host } from "@/lib/utils";

/**
 * BUILD HERO — construction, not the fingerprint. A real store (built by Likin) assembles in
 * layers as the page loads: structure → navigation → product → UI → finished store.
 * In 3–4 seconds you understand: Likin builds Shopify stores.
 */
const LAYERS = ["Estructura", "Navegación", "Producto", "UI", "Tienda"];

export function BuildHero() {
  const { openLead } = useLead();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const store = caseBySlug("panambi-velas")!;
  const back = caseBySlug("pipiola-chic")!;
  const back2 = caseBySlug("bikini-azul")!;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.setAttribute("data-step", "5");
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      el.setAttribute("data-step", String(i));
      if (i >= 5) window.clearInterval(id);
    }, 520);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section id="hero" aria-labelledby="build-title" className="relative isolate overflow-hidden bg-obsidian">
      <div className="container-wide grid min-h-[100svh] gap-10 pb-12 pt-[calc(var(--header-h)+40px)] md:grid-cols-12 md:items-center md:gap-8 md:pb-16 md:pt-(--header-h)">
        <div className="md:col-span-6 lg:col-span-5">
          <p className="text-label text-steel">Likin BUILD · Shopify</p>
          <h1 id="build-title" className="text-display mt-5 max-w-[12ch] md:text-[clamp(2.75rem,1rem+5.2vw,5.75rem)]">
            Creamos tu tienda online en Shopify preparada para vender.
          </h1>
          <p className="mt-6 max-w-[36ch] text-body-xl text-cloud/85">
            <span className="text-cloud">No solo te hacemos la tienda. Te enseñamos a gestionarla.</span> Diseño, estructura, configuración y formación para empezar a vender sin depender de una agencia.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button size="lg" onClick={() => openLead("build", "hero")}>
              {site.cta.buildStore}
            </Button>
            <p className="text-label text-steel sm:ml-2">
              Desde {site.build.priceFrom} € + IVA · {site.build.installments} pagos al 0 %
            </p>
          </div>
        </div>

        {/* Stage: layered stores */}
        <div className="relative md:col-span-6 lg:col-span-7" style={{ perspective: "1800px" }}>
          <div ref={ref} data-step="0" className="group/stage relative mx-auto aspect-[16/11] w-full max-w-[720px] [transform:rotateY(-10deg)_rotateX(4deg)] md:mr-0" style={{ transformStyle: "preserve-3d" }}>
            {/* back stores */}
            {[back2, back].map((c, i) =>
              c.store ? (
                <figure key={c.slug} aria-hidden className={cn("absolute overflow-hidden rounded-frame border border-white/6 bg-graphite opacity-0 shadow-depth transition-[opacity,transform] duration-[900ms] ease-(--ease-out) group-data-[step=5]/stage:opacity-100 group-data-[step=4]/stage:opacity-100", i === 0 ? "left-[8%] top-[-6%] w-[62%] -translate-y-3 group-data-[step=4]/stage:translate-y-0 [transform:translateZ(-160px)]" : "right-[-3%] top-[6%] w-[58%] group-data-[step=5]/stage:translate-y-0 [transform:translateZ(-80px)]")}>
                  <div className="aspect-[16/10] bg-cloud">
                    <Image src={c.store.fold800} alt="" width={800} height={500} sizes="400px" className="h-full w-full object-cover object-top opacity-80" />
                  </div>
                </figure>
              ) : null,
            )}
            {/* main store */}
            <figure className="absolute inset-x-0 bottom-0 overflow-hidden rounded-frame border border-white/10 bg-graphite shadow-float">
              <div className="flex items-center gap-2 border-b border-card-border px-3.5 py-2.5">
                <span className="flex gap-1.5" aria-hidden>
                  <i className="size-2 rounded-full bg-hairline" />
                  <i className="size-2 rounded-full bg-hairline" />
                  <i className="size-2 rounded-full bg-hairline" />
                </span>
                <span className="text-label ml-1 truncate text-[10px] text-steel transition-opacity duration-(--dur-slow) group-data-[step=0]/stage:opacity-0">{host(store.url)}</span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-obsidian">
                {/* 1 structure */}
                <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-(--dur-slow) group-data-[step=1]/stage:opacity-100 group-data-[step=2]/stage:opacity-100" fill="none" stroke="var(--color-outline)" strokeWidth="1.5" aria-hidden>
                  <rect x="0" y="0" width="800" height="52" />
                  <rect x="0" y="52" width="800" height="230" strokeDasharray="6 6" />
                  {[40, 232, 424, 616].map((x) => (
                    <rect key={x} x={x} y="310" width="144" height="150" strokeDasharray="6 6" />
                  ))}
                </svg>
                {/* 2 navigation */}
                <div className="absolute inset-x-0 top-0 flex h-[10.4%] items-center justify-between px-[4%] opacity-0 transition-opacity duration-(--dur-slow) group-data-[step=2]/stage:opacity-100" aria-hidden>
                  <span className="h-2.5 w-[12%] rounded-sm bg-outline" />
                  <span className="flex gap-3">
                    {[0, 1, 2, 3].map((k) => (
                      <span key={k} className="h-2 w-10 rounded-sm bg-hairline" />
                    ))}
                  </span>
                </div>
                {/* 3 product */}
                <div className="absolute inset-x-[5%] top-[62%] grid grid-cols-4 gap-[3%] opacity-0 transition-opacity duration-(--dur-slow) group-data-[step=3]/stage:opacity-100" aria-hidden>
                  {[0, 1, 2, 3].map((k) => (
                    <span key={k} className="aspect-[3/4] rounded-[4px] border border-teal/60 bg-teal/10" />
                  ))}
                </div>
                {/* 4–5 the real store */}
                {store.store && (
                  <div className="absolute inset-0 opacity-0 transition-[opacity,clip-path] duration-[1100ms] ease-(--ease-out) [clip-path:inset(0_0_100%_0)] group-data-[step=4]/stage:opacity-100 group-data-[step=4]/stage:[clip-path:inset(0_0_0_0)] group-data-[step=5]/stage:opacity-100 group-data-[step=5]/stage:[clip-path:inset(0_0_0_0)]">
                    <Image src={store.store.fold} alt={`Tienda online de ${store.name}, construida por Likin`} width={store.store.foldW} height={store.store.foldH} sizes="(min-width: 768px) 56vw, 100vw" priority className="h-full w-full object-cover object-top" />
                  </div>
                )}
              </div>
              {/* ready badge */}
              <div className="absolute bottom-3 left-3 rounded-[8px] border border-hairline bg-obsidian/90 px-3 py-2 opacity-0 transition-[opacity,transform] duration-(--dur-slow) group-data-[step=5]/stage:opacity-100" aria-hidden>
                <span className="text-label text-teal">Ready to sell</span>
              </div>
            </figure>
          </div>
          <ol className="mt-5 flex flex-wrap gap-x-5 gap-y-2 md:justify-end" aria-hidden>
            {LAYERS.map((l, i) => (
              <li key={l} className="text-label text-steel" data-i={i + 1}>
                {String(i + 1).padStart(2, "0")} {l}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
