import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export type ProblemLine = { n: string; a: string; b: string };

const HOME_LINES: ProblemLine[] = [
  { n: "01", a: "Subes presupuesto.", b: "El ROAS cae." },
  { n: "02", a: "Consigues tráfico.", b: "La web no convierte." },
  { n: "03", a: "Consigues clientes.", b: "No vuelven." },
  { n: "04", a: "Tienes varios proveedores.", b: "Nadie mira el negocio completo." },
];

/**
 * THE PROBLEM — typography, timing, no graphics. Not pinned: a sticky headline on the left
 * and four statements that arrive one by one on the right. The closing lands on the second
 * background level so the page changes envelope here.
 */
export function Problem({ title = "Vender no es lo mismo que escalar.", lines = HOME_LINES, closingA = "Quizá no necesitas otra agencia de Ads.", closingB, id = "problema" }: { title?: string; lines?: ProblemLine[]; closingA?: string; closingB?: React.ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-hairline bg-graphite">
      <div className="container-wide grid gap-10 py-(--spacing-section) md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-[calc(var(--header-h)+24px)]">
            <p className="text-label text-steel">El problema</p>
            <h2 id={`${id}-title`} className="text-h2 mt-4 max-w-[12ch]">
              {title}
            </h2>
          </div>
        </div>
        <ol className="md:col-span-6 md:col-start-7">
          {lines.map((l, i) => (
            <Reveal as="li" key={l.n} delay={i * 60} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-hairline py-6 md:py-8">
              <span className="text-label pt-2 text-steel">{l.n}</span>
              <p className="text-statement">
                <span className="block text-cloud">{l.a}</span>
                <span className="block text-steel">{l.b}</span>
              </p>
            </Reveal>
          ))}
          <Reveal as="li" delay={120} className="border-t border-hairline pt-10 md:pt-14">
            <p className="text-statement">
              <span className="block text-steel">{closingA}</span>
              <span className={cn("mt-2 block text-cloud")}>
                {closingB ?? (
                  <>
                    Necesitas un sistema de <span className="text-teal">crecimiento</span>.
                  </>
                )}
              </span>
            </p>
          </Reveal>
        </ol>
      </div>
    </section>
  );
}
