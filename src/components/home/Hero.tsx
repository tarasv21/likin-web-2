"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowDown, ArrowUpRight } from "@/components/ui/Icons";
import { useLead } from "@/components/layout/Providers";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const HeroObject = dynamic(() => import("@/components/brand/HeroObject"), { ssr: false });

/**
 * THE LIKIN REVEAL — the opening of a product film.
 *
 * One object (the real fingerprint, dark titanium) in a dark studio. The scroll is the camera:
 *   0–0.16  MACRO   we are very close; ~40% of the piece, off-frame. The claim leads.
 *   0.16–.68 PULL   the camera backs off; one Likin light travels the metal, ridge by ridge.
 *   0.42–.62        the copy leaves the set (a clip wipe, not a fade).
 *   0.66–.8  HERO   full object, centred, best light. Nothing else on screen. The Likin frame.
 *   0.8–1    LINE   one ridge continues as a line that runs into the next section.
 *
 * Mobile is its own choreography: the fragment enters from the right edge behind the copy,
 * the copy leaves, the piece comes to the centre at ~80vw, then the line runs down.
 * Reduced motion / no WebGL: a still of the hero moment, copy in place, no scroll track.
 */
type Quality = "high" | "lite" | "still" | "none";

function pickQuality(reduced: boolean): Quality {
  if (typeof window === "undefined") return "none";
  if (reduced) return "still";
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return "still";
  } catch {
    return "still";
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (nav.deviceMemory ?? 8) < 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
  const fine = window.matchMedia("(pointer: fine)").matches;
  return window.innerWidth >= 1024 && fine && !weak ? "high" : "lite";
}

const STILL = "/brand/print-titanium.webp";
const STILL_800 = "/brand/print-titanium-800.webp";

export function Hero() {
  const track = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const phrase = useRef<HTMLParagraphElement>(null);
  const cue = useRef<HTMLAnchorElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const reduced = useReducedMotion();
  const { openLead } = useLead();
  const [quality, setQuality] = useState<Quality>("none");
  const [ready, setReady] = useState(false);
  const isStill = quality === "still";

  // Decide the tier once we are on the client (WebGL, pointer, device class, motion preference).
  useEffect(() => {
    let raf = 0, timer = 0;
    raf = window.requestAnimationFrame(() => {
      const q = pickQuality(reduced);
      // The still is needed at once; the WebGL object can wait one beat after first paint so it
      // never competes with hydration or the LCP text.
      if (q === "still") setQuality(q);
      else timer = window.setTimeout(() => setQuality(q), q === "lite" ? 500 : 250);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [reduced]);

  // Pointer (desktop only, tiny parallax on the piece)
  useEffect(() => {
    if (quality !== "high") return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [quality]);

  // Scroll → progress → DOM choreography (no React state on scroll)
  useEffect(() => {
    const el = track.current;
    if (!el || isStill) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      const total = el.offsetHeight - vh;
      const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      progress.current = p;
      const portrait = window.innerWidth < 768;
      // Copy leaves the set: a wipe from the bottom, with a slight lift. Not an opacity fade.
      const [a, b] = portrait ? [0.26, 0.5] : [0.42, 0.64];
      const out = Math.min(1, Math.max(0, (p - a) / (b - a)));
      const e = out * out * (3 - 2 * out);
      if (copy.current) {
        copy.current.style.clipPath = `inset(0 0 ${(e * 100).toFixed(2)}% 0)`;
        copy.current.style.transform = `translateY(${(-e * 28).toFixed(1)}px)`;
        copy.current.style.pointerEvents = e > 0.6 ? "none" : "";
      }
      // The legibility scrim leaves with the copy: at the hero moment only the piece is lit.
      if (scrim.current) scrim.current.style.opacity = (1 - e).toFixed(3);
      // The film line: one sentence inside the film, at the hero moment only.
      if (phrase.current) {
        const i = Math.min(1, Math.max(0, (p - 0.68) / 0.08)), o = Math.min(1, Math.max(0, (p - 0.82) / 0.06));
        const v = Math.min(i, 1 - o);
        phrase.current.style.opacity = v.toFixed(3);
        phrase.current.style.transform = `translateY(${((1 - v) * 10).toFixed(1)}px)`;
      }
      // The line grows out of the print and runs to the edge of the frame.
      if (line.current) {
        const g = Math.min(1, Math.max(0, (p - 0.86) / 0.14));
        line.current.style.transform = `scaleY(${(g * g * (3 - 2 * g)).toFixed(4)})`;
        line.current.style.opacity = g > 0 ? "1" : "0";
      }
      if (cue.current) cue.current.style.opacity = p > 0.04 ? "0" : "1";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isStill]);

  const onReady = useCallback(() => setReady(true), []);
  const onAnchor = useCallback((x: number, y: number, visible: boolean) => {
    const st = stage.current;
    if (!st) return;
    st.style.setProperty("--ax", `${x.toFixed(1)}px`);
    st.style.setProperty("--ay", `${y.toFixed(1)}px`);
    st.style.setProperty("--av", visible ? "1" : "0");
  }, []);

  return (
    <section id="hero" ref={track} aria-labelledby="hero-title" className={cn("relative bg-obsidian", isStill ? "min-h-[100svh]" : "h-[190svh] md:h-[178svh]")}>
      <div ref={stage} className={cn("isolate overflow-hidden bg-obsidian", isStill ? "relative min-h-[100svh]" : "sticky top-0 h-[100svh]")} style={{ "--ax": "50%", "--ay": "70%", "--av": 0 } as CSSProperties}>
        {/* ── Studio: a dark room, not #000. Light contamination from the piece, then a vignette. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_68%_42%,rgba(0,214,178,0.045),transparent_70%)] md:bg-[radial-gradient(ellipse_52%_60%_at_64%_48%,rgba(0,214,178,0.05),transparent_70%)]" />

        {/* ── The object */}
        <div className={cn("absolute inset-0 transition-opacity duration-[1400ms] ease-out", ready || isStill ? "opacity-100" : "opacity-0")}>
          {(quality === "high" || quality === "lite") && <HeroObject progress={progress} pointer={pointer} quality={quality} onReady={onReady} onAnchor={onAnchor} />}
          {isStill && (
            <div className="absolute inset-x-0 top-[calc(var(--header-h)+2svh)] mx-auto h-[46svh] w-[78vw] md:inset-auto md:right-[6%] md:top-1/2 md:h-[76vh] md:w-auto md:-translate-y-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={STILL} srcSet={`${STILL_800} 800w, ${STILL} 1294w`} sizes="(min-width: 768px) 60vh, 78vw" alt="La huella de Likin en titanio oscuro bajo luz de estudio" width={974} height={1294} className="h-full w-full object-contain" loading="eager" fetchPriority="high" />
            </div>
          )}
        </div>

        {/* ── Legibility on portrait: the copy sits over the fragment. */}
        <div ref={scrim} aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,8,7,0.2)_0%,rgba(5,8,7,0.06)_28%,rgba(5,8,7,0.62)_52%,rgba(5,8,7,0.9)_78%,rgba(5,8,7,0.96)_100%)] md:bg-[linear-gradient(to_right,rgba(5,8,7,0.55)_0%,rgba(5,8,7,0.25)_36%,transparent_58%)]" />
        <div aria-hidden className="hero-vignette pointer-events-none absolute inset-0" />
        <div aria-hidden className="hero-grain pointer-events-none absolute inset-0" />

        {/* ── The line: born at the bottom of the print, it runs to the next section. */}
        <div ref={line} aria-hidden className="pointer-events-none absolute left-(--ax) top-(--ay) w-px origin-top bg-teal opacity-0" style={{ height: "calc(100% - var(--ay))", transform: "scaleY(0)", opacity: 0 }} />

        {/* ── Copy */}
        <div className={cn("container-wide relative flex flex-col justify-end pb-[9svh] pt-(--header-h) md:justify-center md:pb-0", isStill ? "min-h-[100svh]" : "h-full")}>
          <div ref={copy} className="relative z-10 max-w-[44rem] will-change-[clip-path,transform] md:max-w-[46rem]">
            <p className="hero-in text-label flex items-center gap-4 text-steel [animation-delay:200ms]">
              <span className="whitespace-nowrap">Agencia eCommerce · Shopify · Growth</span>
              <span aria-hidden className="eyebrow-line h-px min-w-6 flex-1 md:max-w-24" />
            </p>
            <h1 id="hero-title" className="hero-rise text-display text-luminous mt-5 max-w-[8.6ch] [animation-delay:120ms]">
              Creamos y escalamos eCommerce.
            </h1>
            <p className="hero-rise mt-6 max-w-[34ch] text-body-xl text-cloud/85 [animation-delay:260ms] md:mt-7">Creamos tiendas Shopify preparadas para vender y hacemos crecer las que ya venden con Paid Media, CRO y Retention.</p>
            <div className="hero-in mt-8 flex flex-col items-start gap-5 [animation-delay:620ms] sm:flex-row sm:items-center sm:gap-8 md:mt-9">
              <Button size="lg" onClick={() => openLead("scale", "hero")}>
                Ya vendo. Quiero crecer
              </Button>
              <button type="button" onClick={() => openLead("build", "hero")} className="group/link inline-flex h-12 items-center gap-1.5 text-[1rem] font-medium text-cloud/85 transition-colors hover:text-cloud">
                <span className="relative">
                  Quiero crear mi eCommerce
                  <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-teal transition-transform duration-(--dur) ease-(--ease-out) group-hover/link:scale-x-100" />
                </span>
                <ArrowUpRight size={15} className="text-steel transition-[transform,color] duration-(--dur) ease-(--ease-out) group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-hover/link:text-teal" />
              </button>
            </div>
          </div>
        </div>

        {/* ── One sentence inside the film. */}
        {!isStill && (
          <p ref={phrase} aria-hidden className="pointer-events-none absolute inset-x-(--spacing-gutter) bottom-[6svh] text-center opacity-0 md:bottom-[5vh]">
            <span className="text-label block text-steel">Dejar huella no es parecer diferente.</span>
            <span className="mt-2 block text-statement text-cloud">Es crecer diferente.</span>
          </p>
        )}

        {/* ── Scroll cue */}
        {!isStill && (
          <a ref={cue} href="#marcas" className="hero-in text-label absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-3 text-steel transition-opacity duration-(--dur-slow) [animation-delay:1200ms] hover:text-cloud md:left-(--spacing-gutter) md:translate-x-0">
            <ArrowDown size={14} className="motion-safe:animate-[nudge-down_2.4s_ease-in-out_infinite]" />
            Scroll
          </a>
        )}
      </div>
    </section>
  );
}
