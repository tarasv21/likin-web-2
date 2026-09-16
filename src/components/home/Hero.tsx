"use client";

import { useEffect, useRef } from "react";
import { FingerprintStage } from "@/components/brand/FingerprintStage";
import { Button } from "@/components/ui/Button";
import { ArrowDown } from "@/components/ui/Icons";
import { useLead } from "@/components/layout/Providers";
import { useReducedMotion } from "@/lib/hooks";

/**
 * HERO — visual protagonist: the fingerprint. Semantic protagonist: the H1.
 * Copy and both CTAs are visible in the first frame. Scroll: the print rotates (≤ 35°),
 * light incidence changes, it lifts and leaves the scene; the copy stays, then fades.
 * Mobile: the print sits cropped top-right, the copy leads the first viewport.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();
  const { openLead } = useLead();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const h = el.offsetHeight || window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.85)));
      progress.current = p;
      if (copy.current && !reduced) {
        copy.current.style.opacity = String(1 - Math.min(1, Math.max(0, (p - 0.35) / 0.4)));
        copy.current.style.transform = `translateY(${p * -24}px)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <section id="hero" ref={ref} className="relative isolate overflow-hidden bg-obsidian" aria-labelledby="hero-title">
      {/* Stage: absolute so the print can bleed beyond the grid */}
      <FingerprintStage
        progress={progress}
        className="pointer-events-none absolute right-[-16%] top-[calc(var(--header-h)-4px)] h-[46svh] w-[86vw] md:right-[-4%] md:top-[6%] md:h-[88%] md:w-[52vw] lg:right-[0%] lg:w-[48vw]"
      />

      <div className="container-wide relative flex min-h-[100svh] flex-col justify-end pb-10 pt-[calc(var(--header-h)+44svh)] md:grid md:grid-cols-12 md:items-center md:justify-normal md:pb-20 md:pt-(--header-h)">
        <div ref={copy} className="relative z-10 md:col-span-7 lg:col-span-6">
          <p className="text-label text-steel">Agencia eCommerce · Shopify · Growth</p>
          <h1 id="hero-title" className="text-display mt-5 max-w-[9ch]">
            Creamos y escalamos eCommerce.
          </h1>
          <p className="mt-6 max-w-[36ch] text-body-xl text-cloud/85">Creamos tiendas Shopify preparadas para vender y hacemos crecer las que ya venden con Paid Media, CRO y Retention.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" onClick={() => openLead("scale", "hero")}>
              Ya vendo. Quiero crecer
            </Button>
            <Button size="lg" variant="secondary" onClick={() => openLead("build", "hero")}>
              Quiero crear mi eCommerce
            </Button>
          </div>
        </div>
        <a href="#marcas" className="text-label absolute bottom-6 left-(--spacing-gutter) hidden items-center gap-3 text-steel transition-colors hover:text-cloud md:inline-flex">
          <ArrowDown size={14} className="motion-safe:animate-[nudge-down_2.4s_ease-in-out_infinite]" />
          Scroll
        </a>
      </div>
    </section>
  );
}
