"use client";

import { useEffect, useRef, useState } from "react";
import { FingerprintStage } from "@/components/brand/FingerprintStage";
import { Button } from "@/components/ui/Button";
import { ArrowDown } from "@/components/ui/Icons";
import { useLead } from "@/components/layout/Providers";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * HERO — visual protagonist: the fingerprint. Semantic protagonist: the H1.
 * Desktop: print to the right, copy and both CTAs in the first frame.
 * Mobile: the print is the background, centred and whole; the first frame carries only the
 * claim ("Creamos y escalamos eCommerce.") over it, and the supporting line and both CTAs
 * arrive with the first flick of scroll. Reduced motion / keyboard focus: everything visible.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();
  const { openLead } = useLead();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const h = el.offsetHeight || window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.85)));
      progress.current = p;
      if (p > 0.012) setRevealed(true);
      if (copy.current && !reduced) {
        copy.current.style.opacity = String(1 - Math.min(1, Math.max(0, (p - 0.5) / 0.35)));
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

  // The staged copy is never a trap: reduced motion and any keyboard focus bring it in at once.
  const shown = revealed || reduced;

  return (
    <section id="hero" ref={ref} className="relative isolate overflow-hidden bg-obsidian" aria-labelledby="hero-title" onFocusCapture={() => setRevealed(true)}>
      {/* Stage: mobile — centred, whole, behind the claim. Desktop — bleeds off the right edge. */}
      <FingerprintStage
        progress={progress}
        className="pointer-events-none absolute left-1/2 top-[calc(var(--header-h)+1svh)] h-[53svh] w-[88vw] -translate-x-1/2 opacity-[0.55] md:left-auto md:right-[-4%] md:top-[6%] md:h-[88%] md:w-[52vw] md:translate-x-0 md:opacity-100 lg:right-[0%] lg:w-[48vw]"
      />
      {/* Scrim: the claim has to win over the metal. Mobile only. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,8,7,0.42)_0%,rgba(5,8,7,0.1)_20%,rgba(5,8,7,0.58)_44%,rgba(5,8,7,0.9)_70%,rgba(5,8,7,0.99)_92%)] md:hidden" />

      <div className="container-wide relative flex min-h-[100svh] flex-col justify-center pb-20 pt-[calc(var(--header-h)+6svh)] md:grid md:grid-cols-12 md:items-center md:justify-normal md:pb-20 md:pt-(--header-h)">
        <div ref={copy} className="relative z-10 md:col-span-7 lg:col-span-6">
          <p className="text-label text-steel">Agencia eCommerce · Shopify · Growth</p>
          <h1 id="hero-title" className="text-display mt-5 max-w-[9ch]">
            Creamos y escalamos eCommerce.
          </h1>
          <div className={cn("transition-[opacity,transform] duration-(--dur-slow) ease-(--ease-out) max-md:motion-safe:will-change-[opacity,transform]", shown ? "opacity-100 md:translate-y-0" : "max-md:pointer-events-none max-md:translate-y-4 max-md:opacity-0")}>
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
        </div>
        {/* Scroll cue: on mobile it is what promises the rest of the copy. */}
        <a
          href="#marcas"
          className={cn(
            "text-label absolute bottom-6 left-(--spacing-gutter) inline-flex items-center gap-3 text-steel transition-opacity duration-(--dur-slow) hover:text-cloud",
            shown && "max-md:pointer-events-none max-md:opacity-0",
          )}
        >
          <ArrowDown size={14} className="motion-safe:animate-[nudge-down_2.4s_ease-in-out_infinite]" />
          Scroll
        </a>
      </div>
    </section>
  );
}
