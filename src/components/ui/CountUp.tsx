"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/hooks";

/** Counts a number up when it enters the viewport. Server renders the final value (SEO). */
export function CountUp({ value, prefix = "", suffix = "", className, duration = 1400 }: { value: number; prefix?: string; suffix?: string; className?: string; duration?: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(value);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return; // already visible: no animation
    setArmed(true);
    setN(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, reduced]);

  const shown = armed ? n : value;
  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString("es-ES")}
      {suffix}
    </span>
  );
}
