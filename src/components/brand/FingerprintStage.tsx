"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { heroMetal } from "@/data/proof";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/**
 * Scroll window (section progress) over which the CTA print completes its full turn.
 * It lands — and flashes — exactly as the section settles into the viewport, not after
 * the mark has already scrolled past the top edge.
 */
export const TURN_FROM = 0.14;
export const TURN_TO = 0.52;

/**
 * The fingerprint as an object. Always renders the metal render (alpha WebP) first — it is
 * the LCP and the complete experience on mobile / reduced motion / no WebGL: scroll tilts it,
 * lifts it and moves a specular highlight across the metal (masked by the print's own alpha).
 * On desktop with a fine pointer the real 3D scene loads after idle and crossfades in.
 */
export function FingerprintStage({ progress, className, variant = "hero", priority = true }: { progress: React.MutableRefObject<number>; className?: string; variant?: "hero" | "cta"; priority?: boolean }) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const [want3d, setWant3d] = useState(false);
  const [ready, setReady] = useState(false);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);
  const imgEl = useRef<HTMLImageElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const wrap = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);

  // Decide on 3D once: desktop, fine pointer, motion allowed, WebGL available, after idle.
  useEffect(() => {
    if (reduced || !fine || window.innerWidth < 1024) return;
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return;
    const id = window.setTimeout(() => setWant3d(true), 900);
    return () => window.clearTimeout(id);
  }, [reduced, fine]);

  // Pointer tilt (desktop only)
  useEffect(() => {
    if (reduced || !fine) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, fine]);

  // Fallback image: scroll-driven CSS transform + moving specular (rAF, no React state)
  useEffect(() => {
    const el = img.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const p = progress.current;
      if (reduced) {
        el.style.setProperty("--p", "0");
        el.style.setProperty("--turn", "0deg");
        return;
      }
      el.style.setProperty("--p", p.toFixed(4));
      if (variant === "cta") {
        // One full turn while the section crosses the viewport, and a specular flash at the
        // exact moment the mark lands facing front again.
        const q = (p - TURN_FROM) / (TURN_TO - TURN_FROM);
        el.style.setProperty("--turn", `${(Math.min(1, Math.max(0, q)) * 360).toFixed(2)}deg`);
        if (flash.current) flash.current.style.opacity = Math.max(0, 1 - Math.abs(q - 1) / 0.12).toFixed(3);
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
  }, [progress, reduced, variant]);

  // The specular sweep is masked by the print itself. We wait for the <img> and reuse its
  // currentSrc so the mask never triggers a second (larger) download and the LCP stays the image.
  useEffect(() => {
    const el = imgEl.current;
    if (el?.complete && el.currentSrc) setMaskUrl(el.currentSrc);
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const maskStyle: CSSProperties = { WebkitMaskImage: maskUrl ? `url(${maskUrl})` : "none", maskImage: maskUrl ? `url(${maskUrl})` : "none", WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" };

  return (
    <div ref={wrap} className={cn("absolute", className)} aria-hidden={!ready ? undefined : true}>
      {/* Fallback / LCP */}
      <div
        ref={img}
        className={cn("absolute inset-0 transition-opacity duration-[900ms] ease-(--ease-out)", ready ? "opacity-0" : "opacity-100")}
        style={{ "--p": 0, perspective: "1400px" } as CSSProperties}
      >
        <div
          className="relative h-full w-full will-change-transform"
          style={{
            // CTA: a full turn. The flat render spins in plane — a rotateY flip would collapse
            // the mark to a sliver at 90°. The real 3D object (desktop) turns on Y instead.
            transform: variant === "cta" ? "rotateZ(var(--turn, 0deg)) rotateY(calc(var(--p) * 10deg - 5deg)) rotateX(calc(var(--p) * 6deg))" : "translateY(calc(var(--p) * -22%)) rotateY(calc(-8deg + var(--p) * 30deg)) rotateX(calc(4deg - var(--p) * 10deg))",
            transformStyle: "preserve-3d",
            opacity: variant === "cta" ? 1 : "calc(1 - max(0, var(--p) - 0.55) * 2.2)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgEl}
            onLoad={(e) => setMaskUrl(e.currentTarget.currentSrc)}
            src={heroMetal.src}
            srcSet={heroMetal.srcSet}
            sizes="(min-width: 1024px) 40vw, (min-width: 768px) 46vw, 70vw"
            width={heroMetal.width}
            height={heroMetal.height}
            alt="Huella de Likin en titanio verde"
            fetchPriority={priority ? "high" : undefined}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
          {/* Specular sweep masked by the print's alpha */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              ...maskStyle,
              background: "radial-gradient(60% 40% at calc(20% + var(--p) * 70%) calc(15% + var(--p) * 60%), rgba(255,255,255,0.55), rgba(120,245,216,0.18) 35%, transparent 70%)",
              opacity: maskUrl ? 0.9 : 0,
            }}
          />
        </div>
      </div>
      {want3d && (
        <div className={cn("absolute inset-0 transition-opacity duration-[1100ms] ease-(--ease-out)", ready ? "opacity-100" : "opacity-0")}>
          <HeroScene progress={progress} pointer={pointer} onReady={onReady} variant={variant} />
        </div>
      )}
      {/* The turn lands: one flash over the mark. Sits above the 2D fallback and the 3D canvas. */}
      {variant === "cta" && !reduced && (
        <div
          ref={flash}
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{ ...maskStyle, background: "radial-gradient(52% 40% at 50% 42%, rgba(255,255,255,0.92), rgba(120,245,216,0.4) 45%, transparent 72%)", opacity: 0 }}
        />
      )}
    </div>
  );
}
