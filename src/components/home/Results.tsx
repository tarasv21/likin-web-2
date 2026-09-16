import Image from "next/image";
import Link from "next/link";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";
import { clientById } from "@/data/clients";
import { results } from "@/data/proof";
import { site } from "@/data/site";

/**
 * RESULTS — editorial. One number leads (a full-scale before → after); three follow at a
 * lower rank. Every figure is documented; every row is a link to its case.
 */
export function Results({ lead = results[0], others = results.slice(1), eyebrow = "Resultados reales", title }: { lead?: (typeof results)[number]; others?: typeof results; eyebrow?: string; title?: React.ReactNode }) {
  const leadClient = clientById(lead.clientId);
  return (
    <section id="resultados" aria-labelledby="resultados-title" className="section-pad bg-obsidian">
      <div className="container-wide">
        <Reveal className="grid gap-4 md:grid-cols-12">
          <p className="text-label text-steel md:col-span-3">{eyebrow}</p>
          <h2 id="resultados-title" className="text-h2 max-w-[14ch] md:col-span-9">
            {title ?? (
              <>
                No vendemos promesas. <span className="text-steel">Enseñamos resultados.</span>
              </>
            )}
          </h2>
        </Reveal>

        {/* Lead figure */}
        <Reveal className="mt-12 md:mt-16">
          <Link href={`${site.routes.work}/${lead.caseSlug}`} className="group grid gap-6 border-t border-hairline pt-8 md:grid-cols-12 md:gap-8 md:pt-10" aria-label={`${lead.brand}: de ${lead.before} a ${lead.after} ${lead.unit}. Ver el caso.`}>
            <div className="md:col-span-3">
              {leadClient ? <Image src={leadClient.logo} alt={leadClient.name} width={leadClient.width} height={leadClient.height} sizes="160px" className={`h-6 w-auto opacity-90 ${leadClient.dark ? "invert" : ""}`} /> : <span className="text-label text-cloud">{lead.brand}</span>}
              <p className="mt-5 max-w-[26ch] text-small text-steel">{lead.context}</p>
            </div>
            <div className="md:col-span-9">
              <p className="tnum text-figure text-steel">
                {lead.before} <span aria-hidden className="mx-1">→</span>
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-4">
                <CountUp value={lead.afterNumber} prefix={lead.afterPrefix} suffix={lead.afterSuffix} className="text-metric text-cloud" />
                <span className="text-label text-teal">{lead.unit}</span>
              </p>
              <p className="mt-5 inline-flex items-center gap-2 text-small font-medium text-cloud">
                Ver el caso <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </Link>
        </Reveal>

        {/* Secondary row */}
        <ol className="mt-10 grid border-t border-hairline md:mt-12 md:grid-cols-3">
          {others.map((r, i) => {
            const client = clientById(r.clientId);
            return (
              <Reveal as="li" key={r.caseSlug} delay={i * 70} className="border-b border-hairline md:border-b-0 md:border-r md:last:border-r-0">
                <Link href={`${site.routes.work}/${r.caseSlug}`} className="group block py-6 md:px-6 md:py-8 md:first:pl-0" aria-label={`${r.brand}: ${r.before} a ${r.after} ${r.unit}. Ver el caso.`}>
                  {client ? <Image src={client.logo} alt={client.name} width={client.width} height={client.height} sizes="120px" className={`h-[18px] w-auto opacity-80 ${client.dark ? "invert" : ""}`} /> : <span className="text-label text-cloud">{r.brand}</span>}
                  <p className="tnum mt-5 text-small text-steel">
                    {r.before} <span aria-hidden>→</span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="tnum text-figure text-cloud">{r.after}</span>
                    <span className="text-label text-steel">{r.unit}</span>
                  </p>
                  <p className="mt-3 flex items-center justify-between gap-4 text-small text-steel">
                    <span className="max-w-[28ch]">{r.context}</span>
                    <ArrowRight size={16} className="shrink-0 transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-teal" />
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
