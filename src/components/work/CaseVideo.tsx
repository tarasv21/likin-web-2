"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "@/components/ui/Icons";
import type { Testimonial } from "@/data/testimonials";
import { cn } from "@/lib/utils";

/** Inline testimonial: poster first, <video> only after tap (nothing loads until then). */
export function CaseVideo({ t, className }: { t: Testimonial; className?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className={cn("overflow-hidden rounded-card border border-hairline bg-graphite", className)}>
      <div className={cn("relative w-full bg-graphite", t.aspect === "9/16" ? "aspect-[9/16]" : "aspect-[3/4]")}>
        {playing ? (
          <video src={t.src} poster={t.poster} controls autoPlay playsInline preload="metadata" className="h-full w-full object-contain" />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 block w-full text-left">
            <span className="sr-only">Reproducir testimonio de {t.person ? `${t.person}, ` : ""}{t.brand}</span>
            <Image src={t.poster} alt="" fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-obsidian/80 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cloud/90 text-obsidian transition-transform group-hover:scale-105">
              <Play size={22} />
            </span>
            <span className="text-label absolute right-3 top-3 rounded-[6px] bg-obsidian/60 px-2 py-1 text-cloud/90">{t.duration}</span>
          </button>
        )}
      </div>
      <figcaption className="p-5">
        <p className="font-medium text-cloud">
          {t.person ? `${t.person} · ` : ""}
          {t.brand}
        </p>
        <p className="text-label mt-1 text-steel">Vídeo testimonio · {t.sector}</p>
      </figcaption>
    </figure>
  );
}
