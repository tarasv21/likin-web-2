"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function useMedia(query: string, serverDefault = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverDefault,
  );
}

/** Hydration-safe prefers-reduced-motion (server assumes motion allowed). */
export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const useDesktop = () => useMedia("(min-width: 48rem)");
export const useFinePointer = () => useMedia("(hover: hover) and (pointer: fine)");

/**
 * Scroll progress (0..1) of an element across the viewport, sampled with rAF and
 * written to a ref (no re-render). `offset` = ["start end","end start"] semantics:
 * 0 when the element's top hits the viewport bottom, 1 when its bottom leaves the top.
 */
export function useScrollProgress<T extends HTMLElement>(mode: "enter-leave" | "pin" = "enter-leave") {
  const ref = useRef<T>(null);
  const progress = useRef(0);
  const subs = useRef(new Set<(p: number) => void>());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = -1;
    const compute = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p: number;
      if (mode === "pin") {
        // the element is taller than the viewport with a sticky child: progress = how far the sticky has travelled
        const total = r.height - vh;
        p = total <= 0 ? 1 : -r.top / total;
      } else {
        p = (vh - r.top) / (vh + r.height);
      }
      p = Math.min(1, Math.max(0, p));
      if (Math.abs(p - last) > 0.0005) {
        last = p;
        progress.current = p;
        subs.current.forEach((fn) => fn(p));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode]);

  const subscribe = (fn: (p: number) => void) => {
    subs.current.add(fn);
    fn(progress.current);
    return () => {
      subs.current.delete(fn);
    };
  };
  return { ref, progress, subscribe };
}

/** Quantised scroll phase for narrative sections: returns an integer 0..steps. */
export function useScrollPhase<T extends HTMLElement>(steps: number, mode: "enter-leave" | "pin" = "pin") {
  const sp = useScrollProgress<T>(mode);
  const [phase, setPhase] = useState(0);
  const subscribe = sp.subscribe;
  useEffect(() => subscribe((p) => setPhase((prev) => {
    const next = Math.min(steps, Math.floor(p * (steps + 1)));
    return next === prev ? prev : next;
  })), [subscribe, steps]);
  return { ref: sp.ref, phase, progress: sp.progress, subscribe };
}

/** Marks <html> with .js once hydrated so CSS reveals can arm safely (no-JS = visible). */
export function useJsFlag() {
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);
}
