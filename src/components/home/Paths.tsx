import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";
import { site } from "@/data/site";

/**
 * TWO PATHS — the home only has to achieve "this one is me".
 * Two large panels with two different motion worlds: BUILD assembles, SCALE flows.
 * Each panel is one link (interaction justifies the surface).
 */
export function Paths() {
  return (
    <section id="caminos" aria-labelledby="caminos-title" className="section-pad bg-obsidian">
      <div className="container-wide">
        <Reveal className="grid gap-4 md:grid-cols-12">
          <p className="text-label text-steel md:col-span-3">Dos caminos</p>
          <h2 id="caminos-title" className="text-h2 max-w-[16ch] md:col-span-9">
            Dos productos. <span className="text-steel">Elige el tuyo.</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-5">
          {/* BUILD */}
          <Reveal>
            <Link href={site.routes.build} className="group relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-card border border-hairline bg-graphite p-6 transition-colors hover:border-outline md:min-h-[600px] md:p-8">
              <div className="relative z-10">
                <p className="text-label text-teal">BUILD</p>
                <h3 className="text-h2 mt-3">Quiero empezar bien.</h3>
                <p className="mt-4 max-w-[30ch] text-body-xl text-cloud/85">Creamos tu tienda Shopify y te enseñamos a gestionarla.</p>
              </div>
              <div className="relative my-6 min-h-[200px] flex-1 md:min-h-[240px]">
                <BuildVisual />
              </div>
              <p className="relative z-10 inline-flex items-center gap-2 font-medium text-cloud">
                Crear mi eCommerce <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          </Reveal>

          {/* SCALE */}
          <Reveal delay={90}>
            <Link href={site.routes.scale} className="group relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-card border border-hairline bg-graphite p-6 transition-colors hover:border-outline md:min-h-[600px] md:p-8">
              <div className="relative z-10">
                <p className="text-label text-teal">SCALE · +10K €/mes</p>
                <h3 className="text-h2 mt-3">
                  Ya vendo. <span className="block">Quiero crecer.</span>
                </h3>
                <p className="mt-4 max-w-[30ch] text-body-xl text-cloud/85">Nos convertimos en el equipo que hace crecer tu eCommerce.</p>
              </div>
              <div className="relative my-6 min-h-[200px] flex-1 md:min-h-[240px]">
                <ScaleVisual />
              </div>
              <p className="relative z-10 inline-flex items-center gap-2 font-medium text-cloud">
                Escalar mi eCommerce <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** A store assembling: header → hero → products → CTA. CSS-only loop, 9 s, staggered. */
function BuildVisual() {
  const blocks = [
    { c: "left-[8%] top-[10%] h-[6%] w-[84%]", d: 0 },
    { c: "left-[8%] top-[20%] h-[30%] w-[84%]", d: 0.5 },
    { c: "left-[8%] top-[55%] h-[24%] w-[26%]", d: 1.1 },
    { c: "left-[37%] top-[55%] h-[24%] w-[26%]", d: 1.35 },
    { c: "left-[66%] top-[55%] h-[24%] w-[26%]", d: 1.6 },
    { c: "left-[8%] top-[84%] h-[7%] w-[36%]", d: 2.1 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="relative h-full w-full overflow-hidden rounded-t-[10px] border border-hairline border-b-0 bg-obsidian/70">
        {blocks.map((b, i) => (
          <span
            key={i}
            className={`absolute rounded-[3px] border border-teal/60 bg-teal/10 motion-safe:animate-[build-block_9s_var(--ease-out)_infinite] motion-safe:opacity-0 ${b.c}`}
            style={{ animationDelay: `${b.d}s` }}
          />
        ))}
        <span className="absolute inset-x-[8%] top-[93%] h-px bg-hairline" />
      </div>
    </div>
  );
}

/** Three signals converge into one rising line. */
function ScaleVisual() {
  const paths = ["M 10 60 C 120 60, 180 42, 300 40", "M 10 100 C 120 100, 180 52, 300 40", "M 10 140 C 120 140, 180 62, 300 40"];
  const rise = "M 300 40 C 340 40, 360 30, 390 8";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 400 160" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--color-hairline)" strokeWidth="1.5" />
        ))}
        <path d={rise} fill="none" stroke="var(--color-teal)" strokeWidth="2" />
        {[0, 1, 2].map((lane) =>
          [0, 1, 2].map((k) => (
            <circle key={`${lane}-${k}`} r="3" fill="var(--color-teal)" style={{ offsetPath: `path("${paths[lane]}")`, animation: `flow ${5 + lane * 0.8}s linear ${k * 1.9 + lane * 0.4}s infinite`, opacity: 0 }} />
          )),
        )}
        {[0, 1].map((k) => (
          <circle key={`r-${k}`} r="3.5" fill="var(--color-mint)" style={{ offsetPath: `path("${rise}")`, animation: `flow 2.6s ease-out ${k * 1.3}s infinite`, opacity: 0 }} />
        ))}
        <text x="10" y="52" className="fill-steel" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1">PAID</text>
        <text x="10" y="92" className="fill-steel" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1">CRO</text>
        <text x="10" y="132" className="fill-steel" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1">RETENTION</text>
        <text x="330" y="26" className="fill-teal" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1">GROWTH</text>
      </svg>
    </div>
  );
}
