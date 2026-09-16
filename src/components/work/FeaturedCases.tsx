import Image from "next/image";
import Link from "next/link";
import { BrowserFrame, PhoneFrame } from "@/components/ui/Frames";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";
import { TextLink } from "@/components/ui/Button";
import { serviceLabel, trackLabel, type CaseStudy } from "@/data/cases";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * FEATURED CASES — portfolio moments, never 100vw. Alternating composition,
 * visuals inside a ≤1320px container, one figure per case, the whole block is a link.
 */
export function FeaturedCases({ items, eyebrow = "Casos", title, all = true, id = "casos" }: { items: CaseStudy[]; eyebrow?: string; title?: React.ReactNode; all?: boolean; id?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="section-pad border-t border-hairline bg-obsidian">
      <div className="container-content">
        <Reveal className="grid gap-4 md:grid-cols-12">
          <p className="text-label text-steel md:col-span-3">{eyebrow}</p>
          <h2 id={`${id}-title`} className="text-h2 max-w-[16ch] md:col-span-9">
            {title ?? (
              <>
                Marcas reales. <span className="text-steel">Historias reales.</span>
              </>
            )}
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-col gap-14 md:mt-16 md:gap-20">
          {items.map((c, i) => (
            <CaseFeature key={c.slug} c={c} flip={i % 2 === 1} variant={i === 2 ? "tall" : "wide"} />
          ))}
        </div>

        {all && (
          <Reveal className="mt-12 border-t border-hairline pt-6 md:mt-16">
            <TextLink href={site.routes.work}>Ver todos los trabajos</TextLink>
          </Reveal>
        )}
      </div>
    </section>
  );
}

export function CaseFeature({ c, flip = false, variant = "wide" }: { c: CaseStudy; flip?: boolean; variant?: "wide" | "tall" }) {
  return (
    <Reveal as="article">
      <Link href={`${site.routes.work}/${c.slug}`} className="group grid gap-6 md:grid-cols-12 md:items-center md:gap-8">
        <div className={cn("relative md:col-span-7", flip && "md:order-2")}>
          {variant === "wide" ? (
            <div className="relative">
              <BrowserFrame c={c} sizes="(min-width: 768px) 56vw, 100vw" className="transition-transform duration-(--dur-slow) ease-(--ease-out) group-hover:-translate-y-1" />
              {c.store && (
                <div className="absolute -bottom-6 right-4 w-[26%] max-w-[150px] md:-bottom-8 md:right-8">
                  <PhoneFrame>
                    <Image src={c.store.long} alt="" width={c.store.longW} height={c.store.longH} sizes="150px" className="w-full" />
                  </PhoneFrame>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto] items-end gap-4 md:gap-6">
              <BrowserFrame c={c} tall sizes="(min-width: 768px) 36vw, 70vw" className="transition-transform duration-(--dur-slow) ease-(--ease-out) group-hover:-translate-y-1" />
              {c.store && (
                <div className="w-[28vw] max-w-[170px] md:w-[13vw]">
                  <PhoneFrame>
                    <Image src={c.store.long} alt="" width={c.store.longW} height={c.store.longH} sizes="170px" className="w-full" />
                  </PhoneFrame>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={cn("md:col-span-5", flip && "md:order-1", variant === "wide" && "pt-4 md:pt-0")}>
          <p className="text-label text-teal">{trackLabel(c)}</p>
          <p className="tnum mt-3 text-figure text-cloud">{c.change}</p>
          <h3 className="mt-4 max-w-[30ch] text-body-xl text-cloud/85">
            <span className="text-cloud">{c.name}.</span> {c.headline}
          </h3>
          <p className="text-label mt-5 text-steel">{c.services.map((s) => serviceLabel[s]).join(" · ")}</p>
          <p className="mt-6 inline-flex items-center gap-2 font-medium text-cloud">
            Ver caso <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </Link>
    </Reveal>
  );
}
