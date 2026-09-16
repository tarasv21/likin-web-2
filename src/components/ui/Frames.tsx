import Image from "next/image";
import type { ReactNode } from "react";
import type { CaseStudy } from "@/data/cases";
import { cn, host } from "@/lib/utils";

/** Minimal browser chrome. Contained, never full-bleed unless asked. */
export function BrowserFrame({ c, className, priority = false, sizes = "(min-width: 768px) 56vw, 100vw", tall = false }: { c: CaseStudy; className?: string; priority?: boolean; sizes?: string; tall?: boolean }) {
  if (!c.store) return <BrandFrame c={c} className={className} />;
  const img = tall ? { src: c.store.tall, w: c.store.tallW, h: c.store.tallH } : { src: c.store.fold, w: c.store.foldW, h: c.store.foldH };
  return (
    <figure className={cn("overflow-hidden rounded-frame border border-white/8 bg-graphite shadow-depth", className)}>
      <div className="flex items-center gap-2 border-b border-card-border px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2 rounded-full bg-hairline" />
          <i className="size-2 rounded-full bg-hairline" />
          <i className="size-2 rounded-full bg-hairline" />
        </span>
        <span className="text-label ml-1 truncate text-[10px] text-steel">{host(c.url)}</span>
      </div>
      <div className={cn("relative overflow-hidden bg-cloud", tall ? "aspect-[5/7]" : "aspect-[16/10]")}>
        <Image src={img.src} alt={`Tienda online de ${c.name}, construida por Likin`} width={img.w} height={img.h} sizes={sizes} priority={priority} className="absolute inset-0 h-full w-full object-cover object-top" />
      </div>
    </figure>
  );
}

/** When a case has no screenshot: the real client logo as a deliberate brand card. */
export function BrandFrame({ c, className, logo }: { c: CaseStudy; className?: string; logo?: { src: string; width: number; height: number; dark?: boolean } }) {
  const light = !!logo?.dark;
  return (
    <figure className={cn("relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-frame border", light ? "border-paper-line bg-cloud" : "border-white/8 bg-graphite", className)}>
      {logo ? (
        <Image src={logo.src} alt={c.name} width={logo.width} height={logo.height} sizes="240px" className="h-auto w-[46%] max-w-[240px] opacity-90" />
      ) : (
        <span className="text-h3 text-cloud">{c.name}</span>
      )}
      <span className={cn("text-label absolute bottom-4 left-4", light ? "text-ink-2" : "text-steel")}>{c.tracks.map((t) => t.toUpperCase()).join(" + ")}</span>
    </figure>
  );
}

/** Phone chassis built with CSS. Children are the screen. */
export function PhoneFrame({ children, className, screenClassName }: { children: ReactNode; className?: string; screenClassName?: string }) {
  return (
    <div className={cn("relative aspect-[9/19.2] w-full rounded-[13%/6.2%] bg-[#0a0d0c] p-[2.6%] shadow-float ring-1 ring-white/10", className)} aria-hidden>
      <div className="pointer-events-none absolute inset-0 rounded-[13%/6.2%] bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      <div className={cn("relative h-full w-full overflow-hidden rounded-[10.5%/5%] bg-obsidian", screenClassName)}>
        <div className="absolute left-1/2 top-[2.2%] z-10 h-[3.2%] w-[28%] -translate-x-1/2 rounded-full bg-[#0a0d0c]" />
        {children}
      </div>
    </div>
  );
}
