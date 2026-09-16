import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Button, TextLink } from "@/components/ui/Button";
import { BrowserFrame, PhoneFrame } from "@/components/ui/Frames";
import { ArrowRight } from "@/components/ui/Icons";
import { CaseVideo } from "@/components/work/CaseVideo";
import { FinalCta } from "@/components/home/FinalCta";
import { JsonLd } from "@/components/JsonLd";
import { caseBySlug, cases, serviceLabel, trackLabel } from "@/data/cases";
import { clientById } from "@/data/clients";
import { testimonialById } from "@/data/testimonials";
import { site } from "@/data/site";
import { breadcrumbJsonLd, caseJsonLd, pageMetadata } from "@/lib/seo";
import { cn, host } from "@/lib/utils";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) return {};
  return pageMetadata({ title: `${c.name} — ${c.headline}`, description: c.summary, path: `${site.routes.work}/${c.slug}`, ogImage: c.store ? c.store.fold : undefined });
}

/**
 * CASE STUDY — flexible template. BUILD cases read as ANTES → CONSTRUCCIÓN → DESPUÉS;
 * SCALE cases as SITUACIÓN → CUELLO DE BOTELLA → SISTEMA → RESULTADO. Only real material.
 */
export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) notFound();
  const client = c.clientId ? clientById(c.clientId) : undefined;
  const video = c.video ? testimonialById(c.video) : undefined;
  const idx = cases.findIndex((x) => x.slug === c.slug);
  const next = cases[(idx + 1) % cases.length];
  const isScale = c.tracks.includes("scale") && !c.tracks.includes("build");
  const labels = isScale ? ["Situación", "Cuello de botella", "El sistema", "Resultado"] : ["Antes", "El problema", "Construcción", "Después"];
  const acts = [
    [labels[0], c.situation],
    [labels[1], c.problem],
    [labels[2], c.intervention],
    [labels[3], c.result],
  ].filter(([, t]) => t) as [string, string][];
  const hasStory = acts.length > 0;

  return (
    <article>
      <JsonLd
        data={[
          caseJsonLd(c),
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Work", path: site.routes.work },
            { name: c.name, path: `${site.routes.work}/${c.slug}` },
          ]),
        ]}
      />
      {/* Case hero */}
      <header className="container-wide pt-[calc(var(--header-h)+40px)] md:pt-[calc(var(--header-h)+72px)]">
        <nav aria-label="Migas de pan" className="text-label text-steel">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-cloud">
                Inicio
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={site.routes.work} className="hover:text-cloud">
                Work
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-cloud/80">
              {c.name}
            </li>
          </ol>
        </nav>
        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <Reveal className="md:col-span-8">
            <div className="flex flex-wrap items-center gap-4">
              {client && <Image src={client.logo} alt={client.name} width={client.width} height={client.height} sizes="160px" className={`h-7 w-auto md:h-8 ${client.dark ? "invert" : ""}`} priority />}
              <span className="text-label text-teal">{trackLabel(c)}</span>
              <span className="text-label text-steel">{c.sector}</span>
            </div>
            <h1 className="text-h2 mt-6 max-w-[22ch] md:text-[clamp(2.5rem,1.4rem+3.6vw,5rem)]">
              <span className="sr-only">{c.name}: </span>
              {c.headline}
            </h1>
          </Reveal>
          <Reveal delay={80} className="md:col-span-4 md:text-right">
            <p className="tnum text-figure text-cloud">{c.change}</p>
            <p className="text-label mt-3 text-steel">{c.services.map((s) => serviceLabel[s]).join(" · ")}</p>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-small text-steel transition-colors hover:text-teal">
              {host(c.url)} <ArrowRight size={13} className="-rotate-45" />
            </a>
          </Reveal>
        </div>
      </header>

      {/* Visual */}
      {c.store && (
        <Reveal kind="clip" className="container-content mt-12 md:mt-16">
          <div className="relative">
            <BrowserFrame c={c} priority sizes="(min-width: 1320px) 1320px, 100vw" />
            <div className="absolute -bottom-6 right-4 w-[24%] max-w-[190px] md:-bottom-10 md:right-10">
              <PhoneFrame>
                <Image src={c.store.long} alt="" width={c.store.longW} height={c.store.longH} sizes="190px" className="w-full" />
              </PhoneFrame>
            </div>
          </div>
        </Reveal>
      )}

      {/* Story */}
      <section className={cn("container-wide grid gap-12 md:grid-cols-12 md:gap-8", c.store ? "pt-20 md:pt-28" : "pt-12 md:pt-16", "pb-(--spacing-section)")}>
        <div className="md:col-span-7">
          {hasStory ? (
            <ol>
              {acts.map(([k, t], i) => {
                const last = i === acts.length - 1;
                return (
                  <Reveal as="li" key={k} className={cn("border-t border-hairline py-8 first:border-t-0 first:pt-0 md:py-10")}>
                    <p className={cn("text-label", last ? "text-teal" : "text-steel")}>
                      {String(i + 1).padStart(2, "0")} — {k}
                    </p>
                    <p className={cn("mt-4 max-w-[60ch]", last ? "text-statement text-cloud" : "text-body-xl text-cloud/85")}>{t}</p>
                  </Reveal>
                );
              })}
              {c.next && (
                <Reveal as="li" className="border-t border-hairline py-8 md:py-10">
                  <p className="text-label text-steel">Siguiente paso</p>
                  <p className="mt-4 max-w-[60ch] text-body-xl text-steel">{c.next}</p>
                </Reveal>
              )}
            </ol>
          ) : (
            <Reveal>
              <p className="text-label text-steel">Sobre el proyecto</p>
              <p className="mt-4 max-w-[60ch] text-body-xl text-cloud/85">{c.summary}</p>
              <p className="mt-4 max-w-[60ch] text-body text-steel">Este proyecto no tiene todavía un caso desarrollado por escrito. Lo que ves es real: la tienda, el sector y los servicios.</p>
            </Reveal>
          )}

          {c.metrics.length > 0 && (
            <Reveal className="mt-4 border-t border-hairline pt-8 md:pt-10">
              <h2 className="text-label text-steel">Resultados</h2>
              <dl className="mt-6 grid gap-8 sm:grid-cols-2">
                {c.metrics.map((m) => (
                  <div key={m.label} className="flex flex-col-reverse">
                    <dt className="mt-2 text-small text-steel">
                      {m.label}
                      {m.note && <span className="text-label mt-1 block">{m.note}</span>}
                    </dt>
                    <dd className="tnum whitespace-nowrap text-figure text-cloud">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>

        <aside className="md:col-span-4 md:col-start-9">
          <div className="md:sticky md:top-[calc(var(--header-h)+24px)]">
            {video ? (
              <CaseVideo t={video} />
            ) : (
              <div className="border-t border-hairline pt-5">
                <p className="text-label text-steel">Ficha</p>
                <dl className="mt-4 space-y-4 text-small">
                  <div>
                    <dt className="text-steel">Sector</dt>
                    <dd className="mt-1 text-cloud">{c.sector}</dd>
                  </div>
                  <div>
                    <dt className="text-steel">Servicio Likin</dt>
                    <dd className="mt-1 text-cloud">{trackLabel(c)}</dd>
                  </div>
                  {c.person && (
                    <div>
                      <dt className="text-steel">Founder</dt>
                      <dd className="mt-1 text-cloud">{c.person}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3">
              {c.tracks.includes("scale") && (
                <Button href={site.routes.scale} variant="secondary">
                  Descubre SCALE
                </Button>
              )}
              {c.tracks.includes("build") && (
                <Button href={site.routes.build} variant="secondary">
                  Descubre BUILD
                </Button>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* Next project */}
      <nav aria-label="Siguiente proyecto" className="border-t border-hairline">
        <Link href={`${site.routes.work}/${next.slug}`} className="group container-wide flex items-center justify-between gap-6 py-10 md:py-14">
          <span>
            <span className="text-label text-steel">Siguiente proyecto</span>
            <span className="mt-2 block text-h2 transition-colors group-hover:text-teal">{next.name}</span>
            <span className="mt-2 block text-small text-steel">{next.change}</span>
          </span>
          <ArrowRight className="shrink-0 text-steel transition-transform group-hover:translate-x-1" />
        </Link>
      </nav>

      <FinalCta eyebrow="Ahora hablemos del tuyo" title="¿Dejamos huella?" primary={{ label: isScale ? site.cta.scaleShort : site.cta.buildShort, track: isScale ? "scale" : "build" }} secondary={{ label: isScale ? site.cta.buildShort : site.cta.scaleShort, track: isScale ? "build" : "scale" }} />
      <p className="sr-only">
        <TextLink href={site.routes.work}>Volver a Work</TextLink>
      </p>
    </article>
  );
}
