"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FINGERPRINT_VIEWBOX, RIDGES, ridgeHref } from "@/data/fingerprint-meta";
import { ArrowRight } from "@/components/ui/Icons";
import { useReducedMotion, useScrollProgress } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * THE LIKIN GROWTH SYSTEM — signature scroll experience (second and last pin on the home).
 *
 *  01 ACQUISITION  signals enter from the left.
 *  02 CONVERSION   they reach the store: some leave, more get through.
 *  03 RETENTION    buyers stop disappearing — some come back around.
 *  04 CONNECTION   the lanes fade and the real Likin fingerprint appears, the three lit ridges
 *                  carrying the signals: the system draws the mark.
 *  05 GROWTH.
 *
 * Canvas 2D for the particle lanes (phases 1–3), SVG (real geometry) for the print.
 * Reduced motion: the final state, static.
 */

const LAYERS = [
  { key: "Paid Media", role: "Adquisición", line: "Entra tráfico.", ridge: 1 },
  { key: "CRO", role: "Conversión", line: "Más tráfico convierte.", ridge: 4 },
  { key: "Retention", role: "Repetición", line: "Los clientes vuelven.", ridge: 7 },
] as const;
const LIT: number[] = LAYERS.map((l) => l.ridge);
const CORE = 8;

type Phase = 0 | 1 | 2 | 3 | 4 | 5;
const phaseOf = (p: number): Phase => (p < 0.08 ? 0 : p < 0.3 ? 1 : p < 0.52 ? 2 : p < 0.7 ? 3 : p < 0.86 ? 4 : 5);

export function GrowthSystem({ id = "sistema", cta, title }: { id?: string; cta?: { label: string; href: string }; title?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const { ref, subscribe } = useScrollProgress<HTMLDivElement>("pin");
  const [phase, setPhase] = useState<Phase>(0);
  const phaseRef = useRef<Phase>(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribe((p) => {
        const ph = phaseOf(p);
        phaseRef.current = ph;
        setPhase((prev) => (prev === ph ? prev : ph));
      }),
    [subscribe],
  );

  // Particle lanes
  useEffect(() => {
    const c = canvas.current, st = stage.current;
    if (!c || !st || reduced) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    const resize = () => {
      w = st.clientWidth;
      h = st.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(st);

    type P = { x: number; y: number; lane: number; s: number; state: "in" | "lost" | "buy" | "back"; t: number; life: number; back: boolean };
    const N = w < 600 ? 90 : 170;
    const ps: P[] = [];
    const spawn = (returning = false): P => {
      const lane = Math.floor(Math.random() * 3);
      return { x: returning ? 0.02 : -0.06 - Math.random() * 0.5, y: 0.34 + lane * 0.14 + (Math.random() - 0.5) * 0.06, lane, s: 0.15 + Math.random() * 0.1, state: "in", t: 0, life: 1, back: returning };
    };
    for (let i = 0; i < N; i++) {
      const p = spawn();
      p.x = -0.06 - Math.random() * 0.9;
      ps.push(p);
    }
    const GATE = 0.5, EXIT = 0.86;
    const teal = "0,214,178", mint = "120,245,216", steel = "124,137,133", cloud = "245,247,246";

    let raf = 0, last = performance.now(), inView = false;
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }, { threshold: 0.05 });
    io.observe(st);

    const frame = (now: number) => {
      if (!inView) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ph = phaseRef.current;
      const active = ph >= 1 && ph <= 4;
      const laneAlpha = ph === 4 ? 0.35 : ph === 5 ? 0 : 1;
      ctx.clearRect(0, 0, w, h);
      if (!active && ph !== 5) return;
      const cvr = ph === 1 ? 0.18 : ph === 2 ? 0.55 : 0.7; // conversion share rises with CRO
      const retention = ph >= 3 ? 0.55 : 0;

      for (const p of ps) {
        if (p.state === "in") {
          p.x += p.s * dt * (ph === 1 ? 0.85 : 1);
          if (p.x >= GATE && p.t === 0) {
            p.t = 1;
            if (Math.random() > cvr) {
              p.state = "lost";
              p.life = 1;
            }
          }
          if (p.x >= EXIT) {
            p.state = "buy";
            p.t = 0;
          }
        } else if (p.state === "lost") {
          p.y += 0.22 * dt;
          p.x += 0.03 * dt;
          p.life -= dt * 0.9;
          if (p.life <= 0) Object.assign(p, spawn());
        } else if (p.state === "buy") {
          p.t += dt * 2.2;
          if (p.t >= 1) {
            if (Math.random() < retention) {
              p.state = "back";
              p.t = 0;
            } else Object.assign(p, spawn());
          }
        } else if (p.state === "back") {
          // arc over the top from (EXIT, y) to (0.06, 0.5)
          p.t += dt * 0.42;
          const a = Math.PI * p.t;
          const cx = (EXIT + 0.06) / 2, r = (EXIT - 0.06) / 2;
          p.x = cx + Math.cos(a) * r;
          p.y = 0.5 - Math.sin(a) * 0.36;
          if (p.t >= 1) Object.assign(p, spawn(true));
        }
        if (p.x < -0.1 || p.x > 1.1) continue;
        const col = p.state === "lost" ? steel : p.back ? mint : p.state === "buy" ? mint : p.x > GATE ? teal : cloud;
        const alpha = (p.state === "lost" ? Math.max(0, p.life) * 0.6 : p.state === "buy" ? 1 : p.state === "back" ? 0.9 : 0.85) * laneAlpha;
        const rad = p.state === "buy" ? 3.2 + Math.sin(p.t * Math.PI) * 2.2 : p.back ? 2.6 : 2.4;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${alpha})`;
        ctx.fill();
      }
    };
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const ph: Phase = reduced ? 5 : phase;
  const printOn = ph >= 4;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-obsidian">
      <div ref={ref} className={cn("relative", !reduced && "h-[320svh] md:h-[300vh]")}>
        <div className={cn(reduced ? "section-pad" : "sticky top-0 flex min-h-[100svh] flex-col justify-center overflow-hidden pt-(--header-h) pb-6")}>
          <div className="container-wide grid gap-6 md:grid-cols-12 md:items-center md:gap-8">
            {/* Copy + legend */}
            <div className="order-2 md:order-1 md:col-span-5">
              <p className="text-label text-steel">El sistema Likin</p>
              <h2 id={`${id}-title`} className="text-statement mt-3 max-w-[18ch] md:text-h2">
                {title ?? (
                  <>
                    Un eCommerce no crece <span className="text-steel">por una sola palanca.</span>
                  </>
                )}
              </h2>
              <ol className="mt-5 border-t border-hairline md:mt-8">
                {LAYERS.map((l, i) => {
                  const on = ph >= i + 1;
                  const current = ph === i + 1;
                  return (
                    <li key={l.key} className={cn("grid grid-cols-[2.5rem_1fr] items-baseline gap-3 border-b border-hairline py-2.5 transition-colors duration-(--dur-slow) md:py-3.5", on ? "text-cloud" : "text-steel")}>
                      <span className={cn("text-label", current || (ph >= 4 && on) ? "text-teal" : "text-steel")}>{String(i + 1).padStart(2, "0")}</span>
                      <span>
                        <span className="text-label block">
                          {l.key} <span className="text-steel">· {l.role}</span>
                        </span>
                        <span className={cn("mt-0.5 block text-body-xl transition-opacity duration-(--dur-slow)", on ? "opacity-100" : "opacity-0")}>{l.line}</span>
                      </span>
                    </li>
                  );
                })}
                <li className={cn("grid grid-cols-[2.5rem_1fr] items-baseline gap-3 py-2.5 transition-opacity duration-(--dur-slow) md:py-3.5", ph >= 5 ? "opacity-100" : "opacity-70")}>
                  <span className="text-label text-teal">=</span>
                  <span>
                    <span className="text-label block text-teal">Growth</span>
                    <span className="mt-0.5 block text-body-xl text-cloud">No optimizamos canales. Optimizamos el negocio.</span>
                  </span>
                </li>
              </ol>
              {cta && (
                <div className={cn("mt-5 transition-opacity duration-(--dur-slow) md:mt-7", ph >= 5 ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={ph < 5}>
                  <Link href={cta.href} className="group inline-flex items-center gap-2 font-medium text-cloud hover:text-teal" tabIndex={ph >= 5 ? 0 : -1}>
                    {cta.label} <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Stage */}
            <div className="order-1 md:order-2 md:col-span-7">
              <div ref={stage} className="relative mx-auto aspect-square w-full max-w-[min(100%,46svh)] md:max-w-[min(100%,72vh)]">
                {/* lanes (guides) */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cn("absolute inset-0 h-full w-full transition-opacity duration-(--dur-slow)", ph >= 1 && ph <= 4 && !reduced ? (ph === 4 ? "opacity-30" : "opacity-100") : "opacity-0")} aria-hidden>
                  {[34, 48, 62].map((y) => (
                    <line key={y} x1="0" y1={y} x2="50" y2={y} stroke="var(--color-hairline)" strokeWidth="0.25" />
                  ))}
                  <line x1="50" y1="26" x2="50" y2="72" stroke={ph >= 2 ? "var(--color-teal)" : "var(--color-hairline)"} strokeWidth="0.4" style={{ transition: "stroke 600ms" }} />
                  {[34, 48, 62].map((y) => (
                    <line key={`r${y}`} x1="50" y1={y} x2="86" y2={y} stroke="var(--color-hairline)" strokeWidth="0.25" />
                  ))}
                  <path d="M 86 50 A 40 36 0 0 0 6 50" fill="none" stroke={ph >= 3 ? "var(--color-teal-mid)" : "transparent"} strokeWidth="0.3" strokeDasharray="1.2 1.6" style={{ transition: "stroke 600ms" }} />
                  <text x="1" y="24" fontSize="2.6" fontFamily="var(--font-mono)" fill="var(--color-steel)" letterSpacing="0.4">ACQUISITION</text>
                  <text x="51.5" y="24" fontSize="2.6" fontFamily="var(--font-mono)" fill={ph >= 2 ? "var(--color-teal)" : "var(--color-steel)"} letterSpacing="0.4">CONVERSION</text>
                  <text x="36" y="10" fontSize="2.6" fontFamily="var(--font-mono)" fill={ph >= 3 ? "var(--color-mint)" : "transparent"} letterSpacing="0.4">RETENTION</text>
                </svg>
                <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />

                {/* The real print, drawn by the system */}
                <svg
                  viewBox={FINGERPRINT_VIEWBOX}
                  className={cn("absolute inset-[6%] h-[88%] w-[88%] transition-opacity duration-[1100ms] ease-(--ease-out)", printOn ? "opacity-100" : "opacity-0")}
                  role="img"
                  aria-label="La huella de Likin como diagrama: Paid Media, CRO y Retention se conectan y convergen en el crecimiento."
                >
                  {RIDGES.map((i) => {
                    const lit = LIT.includes(i);
                    const core = i === CORE;
                    const fill = lit || (core && ph >= 5) ? "var(--color-teal)" : "var(--color-hairline)";
                    return <use key={i} href={ridgeHref(i)} fill={fill} style={{ opacity: lit ? 0.9 : core ? 0.9 : 0.6, transition: "fill 700ms var(--ease-out), opacity 700ms var(--ease-out)" }} />;
                  })}
                  {!reduced &&
                    printOn &&
                    LIT.map((r) => <use key={`s-${r}`} href={ridgeHref(r)} fill="none" stroke="var(--color-mint)" strokeWidth={8} strokeLinecap="round" className="signal" style={{ opacity: 0.8, animationDuration: `${6 + (r % 3)}s` }} />)}
                </svg>

                {/* GROWTH */}
                <p className={cn("text-label absolute inset-x-0 bottom-0 text-center text-teal transition-opacity duration-(--dur-slow)", ph >= 5 ? "opacity-100" : "opacity-0")} aria-hidden={ph < 5}>
                  Acquisition × Conversion × Retention = Growth
                </p>
                <p className={cn("absolute inset-x-0 top-[2%] text-center text-statement text-cloud transition-opacity duration-(--dur-slow)", ph === 0 && !reduced ? "opacity-100" : "opacity-0")} aria-hidden>
                  Tres palancas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
