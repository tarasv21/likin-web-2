"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Kind = "up" | "clip" | "wipe";
type Tag = "div" | "section" | "li" | "article" | "span" | "p" | "h2" | "h3" | "figure" | "header" | "aside" | "ul" | "ol";

/**
 * Scroll reveal, CSS-first. Server renders VISIBLE (crawlers, no-JS, reduced motion).
 * After hydration the <html>.js flag arms elements still below the fold; an
 * IntersectionObserver sets data-in when they enter, and a single shared scroll check
 * guarantees nothing stays hidden if the viewport jumps past an element in one frame.
 * Three languages of motion:
 *  - up:   opacity + 18px rise (default text)
 *  - clip: image revealed from the top edge
 *  - wipe: line/element wiped left → right
 */

const armed = new Set<HTMLElement>();
let listening = false;
const show = (el: HTMLElement) => {
  el.setAttribute("data-in", "");
  armed.delete(el);
};
function ensureSafetyNet() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  let raf = 0;
  const check = () => {
    raf = 0;
    const vh = window.innerHeight;
    armed.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.95) show(el);
    });
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(check);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

export function Reveal({
  children,
  className,
  kind = "up",
  delay = 0,
  y,
  as = "div",
  amount = 0.15,
  style,
  id,
  ...rest
}: {
  children?: ReactNode;
  className?: string;
  kind?: Kind;
  delay?: number;
  y?: number;
  as?: Tag;
  amount?: number;
  style?: CSSProperties;
  id?: string;
  [key: `aria-${string}`]: string | undefined;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
      el.setAttribute("data-in", "");
      return;
    }
    ensureSafetyNet();
    armed.add(el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting || e.boundingClientRect.top < window.innerHeight) {
            show(el);
            io.disconnect();
          }
        }
      },
      { threshold: Math.min(amount, 0.5), rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      armed.delete(el);
    };
  }, [amount]);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref as never}
      id={id}
      className={className}
      data-reveal={kind === "up" ? "" : kind}
      style={{ ...style, ...(delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : {}), ...(y ? ({ "--reveal-y": `${y}px` } as CSSProperties) : {}) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
