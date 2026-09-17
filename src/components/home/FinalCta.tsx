"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { FingerprintStage } from "@/components/brand/FingerprintStage";
import { Button } from "@/components/ui/Button";
import { useLead } from "@/components/layout/Providers";
import { useReducedMotion } from "@/lib/hooks";
import type { LeadTrack } from "@/components/layout/LeadDrawer";

/**
 * FINAL CTA — the circle closes: absolute black, the metal print returns with different light.
 * No form here: choose a path → the flow opens.
 */
export function FinalCta({ eyebrow = "Ahora te toca a ti", title = "¿Dejamos huella?", text, primary, secondary, note, id = "cta-final" }: { eyebrow?: string; title?: ReactNode; text?: string; primary: { label: string; track?: LeadTrack }; secondary?: { label: string; track?: LeadTrack }; note?: string; id?: string }) {
  const { openLead } = useLead();
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      progress.current = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
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
    <section id={id} ref={ref} aria-labelledby={`${id}-title`} className="relative isolate overflow-hidden border-t border-hairline bg-obsidian">
      <FingerprintStage progress={progress} variant="cta" priority={false} className="pointer-events-none absolute left-1/2 top-[7%] h-[38%] w-[76vw] -translate-x-1/2 opacity-85 md:left-auto md:right-[-2%] md:top-[4%] md:h-[92%] md:w-[46vw] md:translate-x-0 md:opacity-100" />
      <div className="container-wide relative flex min-h-[86svh] flex-col justify-end pb-(--spacing-section) pt-[48svh] md:min-h-[86vh] md:justify-center md:py-(--spacing-section)">
        <div className="max-w-[40rem]">
          <p className="text-label text-teal">{eyebrow}</p>
          <h2 id={`${id}-title`} className="text-display mt-5">
            {title}
          </h2>
          {text && <p className="mt-6 max-w-[38ch] text-body-xl text-cloud/85">{text}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" onClick={() => openLead(primary.track, id)}>
              {primary.label}
            </Button>
            {secondary && (
              <Button size="lg" variant="secondary" onClick={() => openLead(secondary.track, id)}>
                {secondary.label}
              </Button>
            )}
          </div>
          {note && <p className="text-label mt-6 text-steel">{note}</p>}
        </div>
      </div>
    </section>
  );
}
