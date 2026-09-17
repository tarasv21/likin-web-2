import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { panels } from "@/data/proof";

/**
 * REAL STORES. REAL NUMBERS. — a slow band of real Shopify admin panels from the stores we run,
 * anonymised by sector. No claim is made in copy: the screenshots are the claim.
 * Automatic marquee (pause control lives in <Marquee>), static and scrollable under reduced motion.
 */
export function PanelsMarquee({ id = "paneles" }: { id?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-hairline bg-obsidian py-(--spacing-section-s)">
      <Reveal className="container-wide">
        <p className="text-label flex items-center gap-2 text-steel">
          <span aria-hidden className="size-1.5 rounded-full bg-teal" />
          Real stores. Real numbers.
        </p>
        <h2 id={`${id}-title`} className="text-h2 mt-4 max-w-[22ch] text-balance">
          Capturas reales de <span className="text-steel">tiendas que gestionamos.</span>
        </h2>
      </Reveal>

      <Marquee className="mt-10 md:mt-12" label="Paneles de Shopify de tiendas que gestiona Likin" duration={80} gap="gap-4 md:gap-6">
        {panels.map((p) => (
          <figure key={p.id} className="w-[86vw] shrink-0 overflow-hidden rounded-frame border border-white/8 bg-graphite shadow-depth sm:w-[420px] md:w-[520px]">
            <div className="flex items-center justify-between gap-3 border-b border-card-border px-3.5 py-2.5">
              <figcaption className="text-label truncate text-[10px] text-cloud">
                {p.sector} <span className="text-steel">· Shopify</span>
              </figcaption>
              <span aria-hidden className="flex shrink-0 gap-1.5">
                <i className="size-2 rounded-full bg-hairline" />
                <i className="size-2 rounded-full bg-hairline" />
                <i className="size-2 rounded-full bg-teal/70" />
              </span>
            </div>
            <div className="bg-cloud" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src640} alt={`Panel de Shopify de una tienda del sector ${p.sector.toLowerCase()} que gestiona Likin, con la identidad anonimizada`} width={p.width} height={p.height} loading="lazy" decoding="async" className="h-full w-full object-contain" />
            </div>
          </figure>
        ))}
      </Marquee>

      <div className="container-wide mt-5 md:mt-6">
        <p className="text-label max-w-[70ch] text-steel">Capturas reales del admin de Shopify de negocios con los que trabajamos. Identidad anonimizada por sector. Cifras sin retocar.</p>
      </div>
    </section>
  );
}
