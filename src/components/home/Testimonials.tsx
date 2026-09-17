"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLeft, ArrowRight, Pause, Play } from "@/components/ui/Icons";
import { testimonials as all, type Testimonial } from "@/data/testimonials";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import { useDesktop, useReducedMotion } from "@/lib/hooks";

/**
 * TESTIMONIALS — born centred: [peek][card][ACTIVE][card][peek]. The active card dominates
 * by scale; neighbours sit slightly back. Slow autoplay, loop, drag, pause on interaction,
 * explicit pause control; static under reduced motion. Mobile: native swipe with peeks.
 * The face is the content: no quotes are invented.
 */
export function Testimonials({ id = "testimonios", eyebrow = "No lo decimos nosotros", title = "Lo dicen las marcas con las que trabajamos.", items = all }: { id?: string; eyebrow?: string; title?: React.ReactNode; items?: Testimonial[] }) {
  const reduced = useReducedMotion();
  const desktop = useDesktop();
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [active, setActive] = useState<Testimonial | null>(null);
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; dx: number; on: boolean }>({ x: 0, dx: 0, on: false });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const go = useCallback((dir: 1 | -1) => setIndex((i) => (i + dir + n) % n), [n]);

  // autoplay (desktop, rAF-timed)
  useEffect(() => {
    if (!desktop || reduced || hover || userPaused || active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      if (t - last > 7000) {
        last = t;
        go(1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [desktop, reduced, hover, userPaused, active, go]);

  // mobile: open on a middle card, so there is a testimonial on each side and the
  // carousel reads as one at a glance instead of looking like a left-aligned list.
  const startedMobile = useRef(false);
  useEffect(() => {
    if (desktop || startedMobile.current) return;
    const el = track.current;
    if (!el || n < 3) return;
    const start = Math.min(n - 1, Math.max(1, Math.floor((n - 1) / 2)));
    const raf = requestAnimationFrame(() => {
      const li = el.children[start] as HTMLElement | undefined;
      if (!li) return;
      startedMobile.current = true;
      el.scrollTo({ left: li.offsetLeft - (el.clientWidth - li.offsetWidth) / 2, behavior: "auto" });
      setIndex(start);
    });
    return () => cancelAnimationFrame(raf);
  }, [desktop, n]);

  // mobile: sync index with scroll-snap
  useEffect(() => {
    if (desktop) return;
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0, bd = Infinity;
        (Array.from(el.children) as HTMLElement[]).forEach((li, i) => {
          const d = Math.abs(li.offsetLeft + li.offsetWidth / 2 - mid);
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        setIndex(best);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [desktop]);

  const scrollToMobile = (i: number) => {
    const el = track.current;
    const li = el?.children[i] as HTMLElement | undefined;
    if (!el || !li) return;
    el.scrollTo({ left: li.offsetLeft - (el.clientWidth - li.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
  };

  const rel = (i: number) => {
    let d = i - index;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  // drag (desktop stage)
  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, dx: 0, on: true };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.on) return;
    drag.current.dx = e.clientX - drag.current.x;
    setDragX(drag.current.dx);
  };
  const onUp = () => {
    if (!drag.current.on) return;
    const dx = drag.current.dx;
    drag.current.on = false;
    setDragging(false);
    setDragX(0);
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  };

  const CARD = 300, GAP = 22;

  return (
    <section id={id} aria-labelledby={`${id}-title`} aria-roledescription="carrusel" className="section-pad overflow-hidden bg-obsidian" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setHover(true)} onBlurCapture={() => setHover(false)}>
      <div className="container-wide flex items-end justify-between gap-6">
        <Reveal className="max-w-[40rem]">
          <p className="text-label text-steel">{eyebrow}</p>
          <h2 id={`${id}-title`} className="text-h3 mt-4 max-w-[24ch]">
            {title}
          </h2>
        </Reveal>
        <div className="hidden items-center gap-2 md:flex">
          <p className="text-label mr-3 text-steel" aria-live="polite">
            <span className="text-cloud">{String(index + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
          </p>
          <button type="button" onClick={() => setUserPaused((v) => !v)} aria-pressed={userPaused} aria-label={userPaused ? "Reanudar" : "Pausar"} className="grid size-11 place-items-center rounded-full border border-hairline text-steel transition-colors hover:border-steel hover:text-cloud">
            {userPaused || reduced ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="grid size-11 place-items-center rounded-full border border-hairline text-steel transition-colors hover:border-steel hover:text-cloud">
            <ArrowLeft />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="grid size-11 place-items-center rounded-full border border-hairline text-steel transition-colors hover:border-steel hover:text-cloud">
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Desktop stage */}
      <div className="relative mt-10 hidden h-[580px] cursor-grab select-none active:cursor-grabbing md:block" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-live="off">
        <ul className="absolute inset-0" style={{ perspective: "1600px" }}>
          {items.map((t, i) => {
            const d = rel(i);
            const visible = Math.abs(d) <= 2;
            const scale = d === 0 ? 1 : Math.abs(d) === 1 ? 0.9 : 0.82;
            const op = d === 0 ? 1 : Math.abs(d) === 1 ? 0.72 : 0.42;
            return (
              <li
                key={t.id}
                aria-hidden={d !== 0}
                className={cn("absolute left-1/2 top-1/2 w-[300px] ease-(--ease-out)", dragging ? "transition-none" : "transition-[transform,opacity] duration-(--dur-slow)", !visible && "invisible")}
                style={{ transform: `translate(calc(-50% + ${d * (CARD + GAP) + dragX * 0.6}px), -50%) scale(${scale}) rotateY(${d * -5}deg)`, opacity: visible ? op : 0, zIndex: 10 - Math.abs(d) }}
              >
                <Card t={t} onPlay={() => (Math.abs(drag.current.dx) > 8 ? null : d === 0 ? setActive(t) : setIndex(i))} tabbable={d === 0} />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile track */}
      <ul ref={track} className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[12vw] pb-2 md:hidden" aria-label="Vídeos testimonio de clientes">
        {items.map((t, i) => (
          <li key={t.id} className={cn("w-[76vw] shrink-0 snap-center transition-[opacity,transform] duration-(--dur)", i === index ? "opacity-100" : "scale-[0.96] opacity-55")}>
            <Card t={t} onPlay={() => setActive(t)} tabbable />
          </li>
        ))}
      </ul>
      <div className="container-wide mt-5 flex items-center justify-between md:hidden">
        <p className="text-label text-steel">
          <span className="text-cloud">{String(index + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollToMobile((index - 1 + n) % n)} aria-label="Anterior" className="grid size-11 place-items-center rounded-full border border-hairline text-steel">
            <ArrowLeft />
          </button>
          <button type="button" onClick={() => scrollToMobile((index + 1) % n)} aria-label="Siguiente" className="grid size-11 place-items-center rounded-full border border-hairline text-steel">
            <ArrowRight />
          </button>
        </div>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} size="video" labelledBy="video-title">
        {active && <VideoPlayer t={active} />}
      </Modal>
    </section>
  );
}

function Card({ t, onPlay, tabbable }: { t: Testimonial; onPlay: () => void; tabbable?: boolean }) {
  return (
    <article className="group relative overflow-hidden rounded-card border border-hairline bg-graphite">
      <button type="button" onClick={onPlay} tabIndex={tabbable ? 0 : -1} className="relative block w-full text-left">
        <span className="sr-only">Reproducir testimonio de </span>
        <div className="relative aspect-[9/16] w-full overflow-hidden">
          <Image src={t.poster} alt="" fill sizes="(min-width: 768px) 300px, 76vw" loading="lazy" className="object-cover" draggable={false} />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/10 to-transparent" />
          <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cloud/90 text-obsidian transition-transform duration-(--dur-fast) group-hover:scale-105">
            <Play size={22} />
          </span>
          <span className="text-label absolute right-3 top-3 rounded-[6px] bg-obsidian/70 px-2 py-1 text-cloud/90">{t.duration}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          {t.person && <p className="text-body-xl font-medium text-cloud">{t.person}</p>}
          <p className={cn("text-cloud", !t.person && "text-body-xl font-medium")}>{t.brand}</p>
          <p className="text-label mt-1 text-steel">{t.sector}</p>
        </div>
      </button>
    </article>
  );
}

function VideoPlayer({ t }: { t: Testimonial }) {
  return (
    <div>
      <h3 id="video-title" className="sr-only">
        Testimonio de {t.person ? `${t.person}, ` : ""}
        {t.brand}
      </h3>
      <div className={cn("relative mx-auto w-full overflow-hidden rounded-[12px] bg-obsidian", t.aspect === "9/16" ? "aspect-[9/16] max-h-[70dvh]" : "aspect-[3/4] max-h-[70dvh]")}>
        <video src={t.src} poster={t.poster} controls autoPlay playsInline preload="metadata" className="h-full w-full object-contain" />
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-medium text-cloud">
            {t.person ? `${t.person} · ` : ""}
            {t.brand}
          </p>
          <p className="text-label mt-1 text-steel">{t.sector}</p>
        </div>
        <Link href={`${site.routes.work}/${t.caseSlug}`} className="group inline-flex shrink-0 items-center gap-2 text-small font-medium text-teal">
          Ver su caso <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
