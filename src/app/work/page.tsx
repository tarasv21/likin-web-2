import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowDown, ArrowRight } from "@/components/ui/Icons";
import { CaseFeature } from "@/components/work/FeaturedCases";
import { WorkGrid } from "@/components/work/WorkGrid";
import { CaseVideo } from "@/components/work/CaseVideo";
import { FinalCta } from "@/components/home/FinalCta";
import { StickyCta } from "@/components/layout/StickyCta";
import { JsonLd } from "@/components/JsonLd";
import { caseBySlug, cases } from "@/data/cases";
import { testimonialById } from "@/data/testimonials";
import { site } from "@/data/site";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Work — Proyectos y casos de éxito eCommerce",
  description:
    "Tiendas Shopify que hemos construido, marcas que hemos ayudado a crecer y resultados que podemos enseñar. Müa Kit, Tartas Bastante Majas, Bordando Hilos, Pipiola Chic, Panambi Velas, Fluxis y más.",
  path: site.routes.work,
});

const FEATURED = ["tartas-bastante-majas", "mua-kit", "pipiola-chic"];

export default function WorkPage() {
  const featured = FEATURED.map((s) => caseBySlug(s)!);
  const human = testimonialById("bordando-hilos")!;
  const humanCase = caseBySlug(human.caseSlug)!;
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Work", path: site.routes.work },
          ]),
          { "@context": "https://schema.org", "@type": "ItemList", name: "Proyectos de Likin", itemListElement: cases.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `${site.url}${site.routes.work}/${c.slug}` })) },
        ]}
      />
      {/* Hero — editorial, calm */}
      <section className="container-wide pb-10 pt-[calc(var(--header-h)+48px)] md:pb-14 md:pt-[calc(var(--header-h)+96px)]">
        <Reveal className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="text-label text-steel">Work · Proyectos Likin</p>
            <h1 className="text-display mt-5 max-w-[14ch] md:text-[clamp(2.75rem,1rem+5.2vw,5.75rem)]">Proyectos y casos de éxito eCommerce.</h1>
          </div>
          <div className="md:col-span-4 md:pb-2">
            <p className="text-statement">
              Menos promesas. <span className="text-steel">Más trabajo real.</span>
            </p>
            <p className="mt-4 max-w-[36ch] text-body text-steel">Tiendas Shopify que hemos construido, marcas que hemos ayudado a crecer y resultados que podemos enseñar.</p>
            <a href="#featured" className="text-label mt-6 inline-flex items-center gap-2 text-steel transition-colors hover:text-cloud">
              <ArrowDown size={14} /> Explorar proyectos
            </a>
          </div>
        </Reveal>
      </section>

      {/* Featured — 3, editorial, contained */}
      <section id="featured" aria-labelledby="featured-title" className="border-t border-hairline">
        <div className="container-content py-(--spacing-section)">
          <h2 id="featured-title" className="sr-only">
            Proyectos destacados
          </h2>
          <div className="flex flex-col gap-14 md:gap-20">
            {featured.map((c, i) => (
              <CaseFeature key={c.slug} c={c} flip={i % 2 === 1} variant={i === 2 ? "tall" : "wide"} />
            ))}
          </div>
        </div>
      </section>

      {/* All work */}
      <section id="all" aria-labelledby="all-title" className="border-t border-hairline">
        <div className="container-wide py-(--spacing-section)">
          <Reveal className="mb-8 md:mb-10">
            <p className="text-label text-steel">All work</p>
            <h2 id="all-title" className="text-h2 mt-4 max-w-[12ch]">
              Más proyectos. <span className="text-steel">Más huellas.</span>
            </h2>
          </Reveal>
          <WorkGrid cases={cases} exclude={FEATURED} />
        </div>
      </section>

      {/* Human break — one testimonial, editorial */}
      <section aria-labelledby="human-title" className="border-t border-hairline bg-graphite">
        <div className="container-wide grid gap-8 py-(--spacing-section) md:grid-cols-12 md:items-center md:gap-8">
          <Reveal className="md:col-span-4 md:col-start-2">
            <CaseVideo t={human} />
          </Reveal>
          <Reveal delay={100} className="md:col-span-5 md:col-start-7">
            <p className="text-label text-steel">En sus palabras</p>
            <h2 id="human-title" className="text-h2 mt-4 max-w-[12ch]">
              {humanCase.name}
            </h2>
            <p className="tnum mt-4 text-figure text-cloud">{humanCase.change}</p>
            <p className="mt-4 max-w-[44ch] text-body-xl text-cloud/85">{humanCase.headline}</p>
            <Link href={`${site.routes.work}/${humanCase.slug}`} className="group mt-6 inline-flex items-center gap-2 font-medium text-cloud hover:text-teal">
              Ver su proyecto <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      <FinalCta eyebrow="Ya has visto nuestro trabajo" title="Ahora hablemos del tuyo." primary={{ label: site.cta.scaleShort, track: "scale" }} secondary={{ label: site.cta.buildShort, track: "build" }} note="La próxima huella puede ser la tuya." />
      <StickyCta after="featured" until="cta-final" label="Dejar huella" />
    </>
  );
}

