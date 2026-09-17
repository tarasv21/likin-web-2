import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/Icons";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * TARAS — the human moment. The page changes envelope: light (Cloud) background, real
 * photograph, editorial composition, almost no UI. After data, systems and Shopify: a person.
 */
export function Founder({ compact = false, id = "taras" }: { compact?: boolean; id?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="on-paper">
      {/* The envelope changes, but it is a dissolve, not a cut. */}
      <div aria-hidden className="paper-fade-in h-20 w-full md:h-28" />
      <div className={cn("container-wide grid gap-10 md:grid-cols-12 md:items-center md:gap-8", compact ? "pb-(--spacing-section) pt-6 md:pt-10" : "pb-(--spacing-section-l) pt-8 md:pt-12")}>
        <Reveal as="figure" kind="clip" className={cn("md:col-span-5", compact ? "md:col-span-4" : "md:col-span-5")}>
          <div className={cn("relative overflow-hidden bg-paper-line", compact ? "aspect-square" : "aspect-[4/5]")}>
            <Image src={compact ? "/founder/taras-square.webp" : "/founder/taras-portrait.webp"} alt="Taras Vasyliv, fundador de Likin, trabajando con su portátil en una terraza" width={compact ? 900 : 1200} height={compact ? 900 : 1500} sizes="(min-width: 768px) 40vw, 100vw" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <figcaption className="text-label mt-3 text-ink-2">
            {site.founder.name} · {site.founder.role}
          </figcaption>
        </Reveal>
        <Reveal className={cn("md:col-start-7", compact ? "md:col-span-6" : "md:col-span-6")}>
          <p className="text-label text-ink-2">{compact ? "Quién está detrás del sistema" : "Quién hay detrás"}</p>
          {compact ? (
            <h2 id={`${id}-title`} className="text-h2 mt-5 max-w-[14ch]">
              Estrategia senior. <span className="text-ink-2">Sin capas de intermediarios.</span>
            </h2>
          ) : (
            <h2 id={`${id}-title`} className="text-h2 mt-5 max-w-[14ch]">
              Likin no nació en una sala de reuniones.
            </h2>
          )}
          <div className="mt-8 max-w-[52ch] space-y-5 text-body-xl text-ink">
            {compact ? (
              <p>Likin está dirigida por Taras Vasyliv. La estrategia no desaparece detrás de un equipo comercial una vez firmas: la persona que analiza tu negocio es la que lo dirige.</p>
            ) : (
              <>
                <p>Detrás de la huella hay una persona. Taras empezó construyendo sus propios proyectos y aprendió haciendo, hasta especializarse en una sola cosa: crear y hacer crecer eCommerce.</p>
                <p className="text-ink-2">Likin es la forma de poner esa experiencia al servicio de marcas reales. Tiendas preparadas para vender, sistemas que escalan y negocios que entendemos desde dentro.</p>
              </>
            )}
          </div>
          <p className="mt-10 border-t border-paper-line pt-6">
            <a href={site.founder.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 font-medium text-ink transition-colors hover:text-ink-2">
              Conoce quién hay detrás de Likin
              <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </p>
        </Reveal>
      </div>
      <div aria-hidden className="paper-fade-out h-20 w-full md:h-28" />
    </section>
  );
}
