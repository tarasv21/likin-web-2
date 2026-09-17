"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { heroMetal } from "@/data/proof";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/**
 * Scroll window (section progress) over which the CTA print is pressed down.
 * Contact — and the flash — land exactly as the section settles into the viewport,
 * not after the mark has already scrolled past the top edge.
 */
export const PRESS_FROM = 0.1;
export const PRESS_TO = 0.52;

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
        el.style.setProperty("--press", "1");
        return;
      }
      el.style.setProperty("--p", p.toFixed(4));
      if (variant === "cta") {
        // The mark is pressed onto the page: it comes down out of focus and slightly larger,
        // settles, and the specular flash fires on contact. No spin — we leave a print.
        const q = (p - PRESS_FROM) / (PRESS_TO - PRESS_FROM);
        const t = Math.min(1, Math.max(0, q));
        // Accelerating fall, hard stop on contact.
        el.style.setProperty("--press", (t * t * (3 - 2 * t)).toFixed(4));
        if (flash.current) flash.current.style.opacity = Math.max(0, 1 - Math.abs(q - 1) / 0.1).toFixed(3);
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
        style={{ "--p": 0, "--press": variant === "cta" ? 0 : 1, perspective: "1400px" } as CSSProperties}
      >
        <div
          className="relative h-full w-full will-change-transform"
          style={{
            // CTA: pressing down onto the page. Above the surface it is bigger, tilted and
            // out of focus; on contact it is flat, sharp and full strength.
            transform:
              variant === "cta"
                ? "translateY(calc((1 - var(--press, 0)) * -6%)) scale(calc(1.14 - var(--press, 0) * 0.14)) rotateX(calc((1 - var(--press, 0)) * 11deg)) rotateZ(calc((1 - var(--press, 0)) * -4deg))"
                : "translateY(calc(var(--p) * -22%)) rotateY(calc(-8deg + var(--p) * 30deg)) rotateX(calc(4deg - var(--p) * 10deg))",
            transformStyle: "preserve-3d",
            filter: variant === "cta" ? "blur(calc((1 - var(--press, 0)) * 4px))" : undefined,
            opacity: variant === "cta" ? "calc(0.26 + var(--press, 0) * 0.74)" : "calc(1 - max(0, var(--p) - 0.55) * 2.2)",
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
      {/* Contact: one flash over the mark. Sits above the 2D fallback and the 3D canvas. */}
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
