"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLeft, ArrowRight } from "@/components/ui/Icons";
import { casesWithStore, type CaseStudy } from "@/data/cases";
import { site } from "@/data/site";
import { cn, host } from "@/lib/utils";

/**
 * BUILT BY LIKIN — immediate evidence. A horizontal rail of real stores; the web dominates,
 * not text. Desktop: mockups peek in from both sides. Mobile: swipe. Every card is a link.
 */
export function StoresRail({ items = casesWithStore.filter((c) => c.tracks.includes("build")) }: { items?: CaseStudy[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    // start centred on the second card so both sides peek
    const li = el.children[1] as HTMLElement | undefined;
    if (li) el.scrollLeft = li.offsetLeft - (el.clientWidth - li.offsetWidth) / 2;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0, bd = Infinity;
        (Array.from(el.children) as HTMLElement[]).forEach((c, i) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        setIndex(best);
      });
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const go = (i: number) => {
    const el = track.current;
    const li = el?.children[Math.max(0, Math.min(items.length - 1, i))] as HTMLElement | undefined;
    if (!el || !li) return;
    el.scrollTo({ left: li.offsetLeft - (el.clientWidth - li.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <section id="tiendas" aria-labelledby="tiendas-title" className="overflow-hidden border-t border-hairline bg-obsidian py-(--spacing-section-s) md:py-(--spacing-section)">
      <div className="container-wide flex items-end justify-between gap-6">
        <Reveal>
          <p className="text-label text-steel">Built by Likin</p>
          <h2 id="tiendas-title" className="text-h2 mt-4 max-w-[14ch]">
            No tienes que imaginártelo. <span className="text-steel">Puedes verlo.</span>
          </h2>
        </Reveal>
        <div className="hidden items-center gap-2 md:flex">
          <p className="text-label mr-3 text-steel">
            <span className="text-cloud">{String(index + 1).padStart(2, "0")}</span> / {String(items.length).padStart(2, "0")}
          </p>
          <button type="button" onClick={() => go(index - 1)} aria-label="Anterior" className="grid size-11 place-items-center rounded-full border border-hairline text-steel transition-colors hover:border-steel hover:text-cloud">
            <ArrowLeft />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Siguiente" className="grid size-11 place-items-center rounded-full border border-hairline text-steel transition-colors hover:border-steel hover:text-cloud">
            <ArrowRight />
          </button>
        </div>
      </div>
      <ul ref={track} className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[8vw] pb-2 md:mt-12 md:gap-6 md:px-[14vw]" aria-label="Tiendas construidas por Likin">
        {items.map((c, i) => (
          <li key={c.slug} className="w-[80vw] shrink-0 snap-center md:w-[min(56vw,760px)]">
            <Link href={`${site.routes.work}/${c.slug}`} className="group block">
              <figure className={cn("overflow-hidden rounded-frame border border-white/8 bg-graphite shadow-depth transition-[transform,opacity] duration-(--dur-slow) ease-(--ease-out) group-hover:-translate-y-1", i === index ? "opacity-100" : "opacity-60")}>
                <div className="flex items-center gap-2 border-b border-card-border px-3.5 py-2.5">
                  <span className="flex gap-1.5" aria-hidden>
                    <i className="size-2 rounded-full bg-hairline" />
                    <i className="size-2 rounded-full bg-hairline" />
                    <i className="size-2 rounded-full bg-hairline" />
                  </span>
                  <span className="text-label ml-1 truncate text-[10px] text-steel">{host(c.url)}</span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden bg-cloud">
                  <Image src={c.store!.fold} alt="" width={c.store!.foldW} height={c.store!.foldH} sizes="(min-width: 768px) 56vw, 80vw" loading={i < 2 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover object-top" draggable={false} />
                </div>
              </figure>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <p className="font-medium text-cloud">
                  {c.name} <span className="text-steel">· {c.sector}</span>
                </p>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-small text-steel transition-colors group-hover:text-teal">
                  Ver proyecto <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
