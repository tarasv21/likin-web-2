"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BrowserFrame, BrandFrame } from "@/components/ui/Frames";
import { Reveal } from "@/components/ui/Reveal";
import { clientById } from "@/data/clients";
import { trackLabel, type CaseStudy, type Track } from "@/data/cases";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

type Filter = "all" | Track;
const FILTERS: { v: Filter; label: string }[] = [
  { v: "all", label: "Todos" },
  { v: "build", label: "Crear eCommerce" },
  { v: "scale", label: "Escalar eCommerce" },
];

/** Editorial rhythm, not a masonry: 7/5 · 5/7 · 6/6, repeating. */
const SPANS = ["md:col-span-7", "md:col-span-5", "md:col-span-5", "md:col-span-7", "md:col-span-6", "md:col-span-6"];

export function WorkFilters({ value, onChange, count }: { value: Filter; onChange: (v: Filter) => void; count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-y border-hairline py-2" role="group" aria-label="Filtrar proyectos">
      {FILTERS.map((f) => {
        const on = value === f.v;
        return (
          <button key={f.v} type="button" aria-pressed={on} onClick={() => onChange(f.v)} className={cn("h-10 rounded-button px-3 text-small transition-colors", on ? "text-cloud" : "text-steel hover:text-cloud")}>
            {f.label}
          </button>
        );
      })}
      <p className="text-label ml-auto whitespace-nowrap text-steel" aria-live="polite">
        {String(count).padStart(2, "0")} proyectos
      </p>
    </div>
  );
}

export function WorkGrid({ cases, exclude = [] }: { cases: CaseStudy[]; exclude?: string[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const base = cases.filter((c) => !exclude.includes(c.slug));
  const list = filter === "all" ? base : base.filter((c) => c.tracks.includes(filter));
  return (
    <div>
      <WorkFilters value={filter} onChange={setFilter} count={list.length} />
      <ul className="mt-8 grid gap-x-6 gap-y-10 md:mt-10 md:grid-cols-12 md:gap-y-14">
        {list.map((c, i) => (
          <li key={c.slug} className={cn("min-w-0", SPANS[i % SPANS.length])}>
            <CaseCard c={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Visual + name + tracks + change. The whole card is the link. */
export function CaseCard({ c }: { c: CaseStudy }) {
  const client = c.clientId ? clientById(c.clientId) : undefined;
  return (
    <Reveal as="article">
      <Link href={`${site.routes.work}/${c.slug}`} className="group block" aria-label={`${c.name}: ${c.change}. Ver caso.`}>
        {c.store ? <BrowserFrame c={c} sizes="(min-width: 768px) 50vw, 100vw" className="transition-transform duration-(--dur-slow) ease-(--ease-out) group-hover:-translate-y-1" /> : <BrandFrame c={c} logo={client ? { src: client.logo, width: client.width, height: client.height, dark: client.dark } : undefined} className="transition-transform duration-(--dur-slow) ease-(--ease-out) group-hover:-translate-y-1" />}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-cloud">{c.name}</p>
            <p className="text-label mt-1 text-teal">{trackLabel(c)}</p>
          </div>
          <p className="tnum shrink-0 text-right text-small text-steel transition-colors group-hover:text-cloud">{c.change}</p>
        </div>
      </Link>
    </Reveal>
  );
}

export function ClientLogo({ id, className }: { id: string; className?: string }) {
  const c = clientById(id);
  if (!c) return null;
  return <Image src={c.logo} alt={c.name} width={c.width} height={c.height} sizes="160px" className={className} />;
}
