"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { TextLink } from "@/components/ui/Button";
import { BrowserFrame } from "@/components/ui/Frames";
import { ArrowRight, Check, Minus } from "@/components/ui/Icons";
import { Fingerprint } from "@/components/brand/Fingerprint";
import { caseBySlug, serviceLabel, type CaseStudy } from "@/data/cases";
import { clientById } from "@/data/clients";
import { panels } from "@/data/proof";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

/* ---------- Un equipo. Tres palancas. ---------- */
const LEVERS = [
  ["Acquisition", "Paid Media", ["Meta Ads", "Google Ads", "TikTok Ads", "Creatividad y testing", "Estrategia de adquisición"]],
  ["Conversion", "CRO", ["UX/UI", "Landing pages", "Product pages", "AOV", "Testing", "Customer journey"]],
  ["Retention", "Retention", ["Klaviyo", "Email marketing", "Automatizaciones", "Segmentación", "Repeat purchase", "LTV"]],
] as const;

export function Levers() {
  return (
    <section id="palancas" aria-labelledby="palancas-title" className="border-t border-hairline bg-obsidian">
      <div className="container-wide py-(--spacing-section)">
        <Reveal className="grid gap-4 md:grid-cols-12">
          <p className="text-label text-steel md:col-span-3">Qué hacemos</p>
          <h2 id="palancas-title" className="text-h2 max-w-[14ch] md:col-span-9">
            Un equipo. <span className="text-steel">Tres palancas.</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-10 border-t border-hairline pt-8 md:mt-14 md:grid-cols-3 md:gap-8 md:pt-10">
          {LEVERS.map(([k, t, items], i) => (
            <Reveal key={k} delay={i * 90}>
              <p className="text-label text-teal">
                {String(i + 1).padStart(2, "0")} {k}
              </p>
              <h3 className="text-h3 mt-3">{t}</h3>
              <ul className="mt-5 space-y-2 text-body text-steel">
                {items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Reveal delay={240} className="mt-10 border-t border-hairline pt-6 md:mt-12">
          <p className="text-label text-cloud/80">Strategy · Data · Creative · Tracking</p>
          <p className="mt-3 max-w-[54ch] text-body text-steel">No son tres freelancers haciendo cosas distintas. Es un sistema coordinado atravesado por la estrategia, los datos y la creatividad.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Diferencia: no vendemos canales ---------- */
export function Difference() {
  return (
    <section aria-labelledby="dif-title" className="border-t border-hairline bg-graphite">
      <div className="container-wide py-(--spacing-section)">
        <h2 id="dif-title" className="sr-only">
          No vendemos canales
        </h2>
        <div className="grid gap-8 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <p className="text-h2 max-w-[18ch]">
              Si solo necesitas a alguien que gestione Meta Ads, <span className="text-steel">hay cientos de agencias.</span>
            </p>
          </Reveal>
          <Reveal delay={160} className="md:col-span-7 md:col-start-6">
            <p className="text-h2 max-w-[18ch]">
              Si necesitas entender por qué tu eCommerce no crece al ritmo que debería, <span className="text-teal">ahí entramos nosotros.</span>
            </p>
            <p className="mt-8">
              <a href="#ciclo" className="group inline-flex items-center gap-2 font-medium text-cloud hover:text-teal">
                Así trabajamos <ArrowRight size={16} className="rotate-90 transition-transform group-hover:translate-y-0.5" />
              </a>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Signature case: Bordando Hilos ---------- */
export function SignatureCase({ slug = "bordando-hilos" }: { slug?: string }) {
  const c = caseBySlug(slug)!;
  const client = clientById(c.clientId);
  const acts = [
    ["Problema", c.situation],
    ["Diagnóstico", c.problem],
    ["Intervención", c.intervention],
    ["Resultado", c.result],
  ].filter(([, t]) => t) as [string, string][];
  return (
    <section aria-labelledby="sig-title" className="border-t border-hairline bg-obsidian">
      <div className="container-content py-(--spacing-section)">
        <Reveal className="flex flex-wrap items-center gap-4">
          <p className="text-label text-steel">Case 01</p>
          {client && <Image src={client.logo} alt={client.name} width={client.width} height={client.height} sizes="140px" className={`h-5 w-auto opacity-90 ${client.dark ? "invert" : ""}`} />}
        </Reveal>
        <Reveal delay={60}>
          <h2 id="sig-title" className="tnum text-metric mt-6 text-cloud md:mt-8">
            <span className="text-steel">16.000 €</span> <span aria-hidden>→</span> 54.000 €
          </h2>
          <p className="text-label mt-3 text-teal">Mejor mes antes de Likin → mejor mes trabajando juntos</p>
        </Reveal>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <Reveal kind="clip">
              <BrowserFrame c={c} sizes="(min-width: 768px) 46vw, 100vw" />
            </Reveal>
            <p className="text-label mt-3 text-steel">{c.sector} · {c.services.map((s) => serviceLabel[s]).join(" · ")}</p>
          </div>
          <ol className="md:col-span-5 md:col-start-8">
            {acts.map(([k, t], i) => (
              <Reveal as="li" key={k} delay={i * 80} className={cn("border-t border-hairline py-6 first:border-t-0 first:pt-0", i === acts.length - 1 && "text-cloud")}>
                <p className={cn("text-label", i === acts.length - 1 ? "text-teal" : "text-steel")}>{k}</p>
                <p className={cn("mt-2", i === acts.length - 1 ? "text-body-xl text-cloud" : "text-body text-cloud/80")}>{t}</p>
              </Reveal>
            ))}
            <li className="pt-6">
              <TextLink href={`${site.routes.work}/${c.slug}`}>Ver caso completo</TextLink>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- Otros resultados: compact, repeatable ---------- */
export function OtherResults({ slugs = ["tartas-bastante-majas", "mua-kit", "fluxis"] }: { slugs?: string[] }) {
  const items = slugs.map((s) => caseBySlug(s)!).filter(Boolean) as CaseStudy[];
  return (
    <section aria-labelledby="otros-title" className="border-t border-hairline bg-obsidian">
      <div className="container-wide py-(--spacing-section)">
        <Reveal>
          <h2 id="otros-title" className="text-h2">
            No fue uno.
          </h2>
        </Reveal>
        <ol className="mt-8 grid border-t border-hairline md:mt-10 md:grid-cols-3">
          {items.map((c, i) => {
            const client = clientById(c.clientId);
            return (
              <Reveal as="li" key={c.slug} delay={i * 80} className="border-b border-hairline md:border-b-0 md:border-r md:last:border-r-0">
                <Link href={`${site.routes.work}/${c.slug}`} className="group block py-6 md:px-6 md:py-8 md:first:pl-0" aria-label={`${c.name}: ${c.change}. Ver caso.`}>
                  {client ? <Image src={client.logo} alt={client.name} width={client.width} height={client.height} sizes="120px" className={`h-[18px] w-auto opacity-80 ${client.dark ? "invert" : ""}`} /> : <span className="text-label text-cloud">{c.name}</span>}
                  <p className="mt-4 text-small text-steel">{c.sector}</p>
                  <p className="tnum mt-3 text-figure text-cloud">{c.change}</p>
                  <p className="text-label mt-4 text-steel">{c.services.map((s) => serviceLabel[s]).join(" · ")}</p>
                  <p className="mt-5 inline-flex items-center gap-2 text-small font-medium text-cloud">
                    Ver caso <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Ciclo de trabajo ---------- */
const CYCLE = ["Observamos", "Encontramos el cuello de botella", "Actuamos", "Medimos", "Aprendemos", "Repetimos"];

export function Cycle() {
  return (
    <section id="ciclo" aria-labelledby="ciclo-title" className="border-t border-hairline bg-graphite">
      <div className="container-wide py-(--spacing-section)">
        <Reveal className="grid gap-4 md:grid-cols-12">
          <p className="text-label text-steel md:col-span-3">Cómo trabajamos</p>
          <h2 id="ciclo-title" className="text-h2 max-w-[16ch] md:col-span-9">
            Un ciclo. <span className="text-steel">No una lista fija de tareas.</span>
          </h2>
        </Reveal>
        <div className="relative mt-10 md:mt-14">
          <Reveal kind="wipe" className="absolute inset-x-0 top-[5px] hidden h-px bg-teal/70 md:block" />
          <ol className="grid gap-5 sm:grid-cols-2 md:grid-cols-6 md:gap-4">
            {CYCLE.map((s, i) => (
              <Reveal as="li" key={s} delay={i * 70} className="relative md:pt-6">
                <span className={cn("absolute left-0 top-0 hidden size-[11px] rounded-full border-2 border-teal md:block", i === 5 ? "bg-teal" : "bg-graphite")} aria-hidden />
                <p className="text-label text-teal">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-2 font-medium text-cloud">{s}</p>
              </Reveal>
            ))}
          </ol>
          {/* loop back */}
          <svg className="mt-4 hidden h-8 w-full md:block" viewBox="0 0 1000 32" preserveAspectRatio="none" aria-hidden>
            <path d="M 995 0 V 20 H 5 V 4" fill="none" stroke="var(--color-hairline)" strokeWidth="1" />
            <path d="M 1 8 L 5 2 L 9 8" fill="none" stroke="var(--color-teal)" strokeWidth="1.2" />
          </svg>
        </div>
        <Reveal delay={200} className="mt-8 max-w-[54ch] text-body-xl text-cloud/85 md:mt-10">
          Priorizamos continuamente aquello que más está limitando el crecimiento. Cuando un cuello de botella se resuelve, aparece el siguiente. Volvemos a empezar.
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Datos: metrics ↔ levers, real anonymised panels ---------- */
const METRICS = [
  ["Revenue", "Sistema completo"],
  ["MER", "Acquisition"],
  ["CAC", "Acquisition + CRO"],
  ["CVR", "CRO"],
  ["AOV", "CRO"],
  ["Repeat rate", "Retention"],
  ["LTV", "Retention"],
] as const;

export function DataSignals() {
  const [i, setI] = useState(0);
  const shown = [panels[0], panels[3], panels[4]];
  const p = shown[i];
  return (
    <section aria-labelledby="datos-title" className="border-t border-hairline bg-obsidian">
      <div className="container-wide grid gap-10 py-(--spacing-section) md:grid-cols-12 md:items-center md:gap-8">
        <Reveal className="md:col-span-5">
          <p className="text-label text-steel">Datos</p>
          <h2 id="datos-title" className="text-h2 mt-4 max-w-[12ch]">
            Si no lo podemos medir, <span className="text-steel">no podemos mejorarlo.</span>
          </h2>
          <dl className="mt-8 divide-y divide-hairline border-y border-hairline">
            {METRICS.map(([m, lever]) => (
              <div key={m} className="grid grid-cols-[6rem_1fr] items-baseline gap-4 py-3">
                <dt className="font-medium text-cloud">{m}</dt>
                <dd className="text-label text-steel">
                  <span aria-hidden>← </span>
                  {lever}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={120} className="md:col-span-7">
          <figure className="overflow-hidden rounded-frame border border-white/8 bg-graphite shadow-depth">
            <div className="flex items-center justify-between gap-2 border-b border-card-border px-3.5 py-2.5">
              <span className="flex items-center gap-2">
                <span className="flex gap-1.5" aria-hidden>
                  <i className="size-2 rounded-full bg-hairline" />
                  <i className="size-2 rounded-full bg-hairline" />
                  <i className="size-2 rounded-full bg-hairline" />
                </span>
                <span className="text-label ml-1 text-[10px] text-steel">Shopify admin · {p.sector}</span>
              </span>
              <span className="flex gap-1" role="group" aria-label="Cambiar panel">
                {shown.map((s, k) => (
                  <button key={s.id} type="button" onClick={() => setI(k)} aria-pressed={k === i} aria-label={s.sector} className={cn("h-6 rounded-[4px] px-2 text-[10px] uppercase tracking-wider transition-colors", k === i ? "bg-teal text-obsidian" : "text-steel hover:text-cloud")}>
                    {String(k + 1).padStart(2, "0")}
                  </button>
                ))}
              </span>
            </div>
            <div className="relative bg-cloud" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
              <Image key={p.id} src={p.src} alt={`Panel de Shopify de un cliente de Likin del sector ${p.sector.toLowerCase()}, anonimizado`} width={p.width} height={p.height} sizes="(min-width: 768px) 56vw, 100vw" className="absolute inset-0 h-full w-full object-contain" />
            </div>
          </figure>
          <p className="text-label mt-3 text-steel">Paneles reales de clientes, anonimizados por sector. Cifras sin retocar.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Fit / No fit ---------- */
const YES = ["Ya vendes online", "Facturas +10.000 €/mes", "Tienes margen para crecer", "Buscas delegar crecimiento", "Puedes invertir en adquisición", "Quieres trabajar datos, conversión y recurrencia"];
const NO = ["Todavía no has lanzado", "Buscas únicamente «poner anuncios»", "No tienes producto validado", "Necesitas construir primero tu tienda", "Buscas resultados inmediatos sin margen de aprendizaje"];

export function Fit() {
  return (
    <section aria-labelledby="fit-title" className="border-t border-hairline bg-graphite">
      <div className="container-wide py-(--spacing-section)">
        <Reveal>
          <p className="text-label text-steel">Encaje</p>
          <h2 id="fit-title" className="text-h2 mt-4 max-w-[14ch]">
            SCALE no es para todo el mundo.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-10 border-t border-hairline pt-8 md:grid-cols-2 md:gap-8 md:pt-10">
          <Reveal>
            <p className="text-label text-teal">Probablemente sí</p>
            <ul className="mt-5 space-y-3">
              {YES.map((t) => (
                <li key={t} className="flex items-start gap-3 text-body-xl text-cloud">
                  <Check size={18} className="mt-1.5 shrink-0 text-teal" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-label text-steel">Probablemente no</p>
            <ul className="mt-5 space-y-3">
              {NO.map((t) => (
                <li key={t} className="flex items-start gap-3 text-body-xl text-steel">
                  <Minus size={18} className="mt-1.5 shrink-0 text-steel/60" /> {t}
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-hairline pt-5 text-body text-steel">
              Si todavía estás empezando, probablemente buscas BUILD.{" "}
              <Link href={site.routes.build} className="font-medium text-cloud hover:text-teal">
                Descubre BUILD →
              </Link>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Modelo de trabajo ---------- */
const TEAM = ["Paid Media", "CRO", "Retention", "Creative", "Data", "Strategy"];

export function Model() {
  return (
    <section aria-labelledby="modelo-title" className="border-t border-hairline bg-obsidian">
      <div className="container-wide grid gap-10 py-(--spacing-section) md:grid-cols-12 md:items-center md:gap-8">
        <Reveal className="md:col-span-6">
          <p className="text-label text-steel">Modelo de trabajo</p>
          <h2 id="modelo-title" className="text-h2 mt-4 max-w-[12ch]">
            Nos convertimos en tu equipo de crecimiento.
          </h2>
          <p className="mt-6 max-w-[44ch] text-body-xl text-cloud/85">Una estrategia. Un equipo. Un objetivo. Empezamos con una fase inicial de {site.scale.initialPhaseDays} días y trabajamos con un máximo de {site.scale.maxBrandsPerQuarter} marcas por trimestre para poder entrar de verdad en cada negocio.</p>
          <p className="mt-5 max-w-[44ch] text-body text-steel">SCALE no tiene un precio publicado: el alcance depende del punto de partida y la estructura de cada eCommerce. Primero revisamos tu aplicación y, si hay encaje, analizamos el proyecto contigo antes de presentar condiciones.</p>
        </Reveal>
        <Reveal delay={120} className="md:col-span-5 md:col-start-8">
          <div className="relative mx-auto aspect-square w-full max-w-[420px]">
            <Fingerprint className="absolute inset-[18%] text-graphite" />
            <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
              {TEAM.map((_, i) => {
                const a = (i / TEAM.length) * Math.PI * 2 - Math.PI / 2;
                const x = 200 + Math.cos(a) * 150, y = 200 + Math.sin(a) * 150;
                return <line key={i} x1="200" y1="200" x2={x} y2={y} stroke="var(--color-hairline)" strokeWidth="1" />;
              })}
              <circle cx="200" cy="200" r="46" fill="var(--color-obsidian)" stroke="var(--color-teal)" strokeWidth="1.5" />
            </svg>
            <p className="text-label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-cloud">
              Tu
              <br />
              marca
            </p>
            {TEAM.map((t, i) => {
              const a = (i / TEAM.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(a) * 37.5, y = 50 + Math.sin(a) * 37.5;
              return (
                <span key={t} className="text-label absolute -translate-x-1/2 -translate-y-1/2 rounded-[6px] border border-teal/50 bg-obsidian px-2 py-1 text-teal" style={{ left: `${x}%`, top: `${y}%` }}>
                  {t}
                </span>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
