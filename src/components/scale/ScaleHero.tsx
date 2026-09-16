"use client";

import { useEffect, useRef, useState } from "react";
import { Button, TextLink } from "@/components/ui/Button";
import { useLead } from "@/components/layout/Providers";
import { FINGERPRINT_VIEWBOX, RIDGES, ridgeHref } from "@/data/fingerprint-meta";
import { site } from "@/data/site";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * SCALE HERO — signal, not dashboard. A system derived from the real fingerprint geometry:
 * three ridges carry signals, respond subtly to the pointer, and during the first scroll
 * light up in sequence (Acquisition → Conversion → Retention) and start connecting.
 * GROWTH is reserved for the signature section.
 */
const LANES = [
  { ridge: 1, label: "Acquisition" },
  { ridge: 4, label: "Conversion" },
  { ridge: 7, label: "Retention" },
] as const;

export function ScaleHero() {
  const { openLead } = useLead();
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const h = el.offsetHeight || window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.6)));
      const s = reduced ? 3 : p < 0.08 ? 0 : p < 0.3 ? 1 : p < 0.55 ? 2 : 3;
      setStep((prev) => (prev === s ? prev : s));
      if (svg.current && !reduced) svg.current.style.transform = `translateY(${p * -40}px)`;
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

  // pointer: subtle parallax of the whole system
  useEffect(() => {
    if (reduced || !fine) return;
    const g = svg.current?.querySelector<SVGGElement>("[data-system]");
    if (!g) return;
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = ((e.clientX / window.innerWidth) * 2 - 1) * 14;
      ty = ((e.clientY / window.innerHeight) * 2 - 1) * 10;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      g.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced, fine]);

  const s = reduced ? 3 : step;

  return (
    <section id="hero" ref={ref} aria-labelledby="scale-title" className="relative isolate overflow-hidden bg-obsidian">
      {/* The signal system, cropped top-right */}
      <svg ref={svg} viewBox={FINGERPRINT_VIEWBOX} className="pointer-events-none absolute -right-[18%] top-[8%] h-[52svh] w-auto opacity-90 md:right-[-6%] md:top-[4%] md:h-[104%]" aria-hidden>
        <g data-system style={{ transition: "transform 80ms linear" }}>
          {RIDGES.map((i) => {
            const lane = LANES.findIndex((l) => l.ridge === i);
            const lit = lane >= 0 && s >= lane + 1;
            return <use key={i} href={ridgeHref(i)} fill={lit ? "var(--color-teal)" : "var(--color-hairline)"} style={{ opacity: lit ? 0.95 : lane >= 0 ? 0.6 : 0.35, transition: "fill 700ms var(--ease-out), opacity 700ms var(--ease-out)" }} />;
          })}
          {!reduced && LANES.map((l, i) => (s >= i + 1 ? <use key={`sig-${l.ridge}`} href={ridgeHref(l.ridge)} fill="none" stroke="var(--color-mint)" strokeWidth={8} strokeLinecap="round" className="signal" style={{ opacity: 0.8, animationDuration: `${6 + i}s` }} /> : null))}
        </g>
      </svg>

      <div className="container-wide relative flex min-h-[100svh] flex-col justify-end pb-10 pt-[calc(var(--header-h)+48svh)] md:grid md:grid-cols-12 md:items-center md:justify-normal md:pb-20 md:pt-(--header-h)">
        <div className="md:col-span-7 lg:col-span-6">
          <p className="text-label text-steel">Likin SCALE · eCommerce growth</p>
          <h1 id="scale-title" className="text-display mt-5 max-w-[13ch] md:text-[clamp(2.75rem,1rem+5vw,5.5rem)]">
            Agencia de crecimiento para eCommerce que ya están vendiendo.
          </h1>
          <p className="text-statement mt-6 max-w-[16ch] text-cloud">
            No escalamos Ads. <span className="text-steel">Escalamos eCommerce.</span>
          </p>
          <p className="mt-6 max-w-[42ch] text-body-xl text-cloud/85">Paid Media, CRO, Retention y estrategia trabajando como un único sistema para hacer crecer marcas que ya facturan más de 10.000 €/mes.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button size="lg" onClick={() => openLead("scale", "hero")}>
              Quiero escalar mi eCommerce
            </Button>
            <TextLink href="#resultados" className="sm:ml-3" muted>
              Ver resultados
            </TextLink>
          </div>
          <p className="text-label mt-6 text-steel">{site.scale.minRevenueLabel}</p>
        </div>
        {/* Lane legend (desktop) */}
        <ol className="hidden md:col-span-5 md:col-start-8 md:flex md:flex-col md:items-end md:gap-3" aria-hidden>
          {LANES.map((l, i) => (
            <li key={l.label} className={cn("text-label transition-colors duration-(--dur-slow)", s >= i + 1 ? "text-teal" : "text-steel")}>
              {String(i + 1).padStart(2, "0")} {l.label}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
