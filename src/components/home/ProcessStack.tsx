import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Marquee } from "@/components/ui/Marquee";
import { stack } from "@/data/proof";

/** Five partners do not fill a track: repeat them so the loop never shows a gap. */
const PARTNER_LOOP = [0, 1, 2, 3].flatMap(() => stack);

const STEPS = [
  ["01", "Entender", "El negocio, no solo el canal."],
  ["02", "Priorizar", "El cuello de botella primero."],
  ["03", "Ejecutar", "Dentro del negocio, no desde fuera."],
  ["04", "Medir", "Datos reales, no capturas bonitas."],
  ["05", "Iterar", "Lo que funciona, se repite."],
] as const;

/** Process + stack in one compact band (≤ 60vh). A thin line draws itself across the steps. */
export function ProcessStack() {
  return (
    <section aria-labelledby="proceso-title" className="border-t border-hairline bg-graphite">
      <div className="py-(--spacing-section-s)">
        <Reveal className="container-wide flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-label text-steel">Cómo trabajamos</p>
            <h2 id="proceso-title" className="text-h3 mt-3 max-w-[22ch]">
              Un ciclo. <span className="text-steel">No una lista de tareas.</span>
            </h2>
          </div>
        </Reveal>
        <div className="container-wide relative mt-8 md:mt-10">
          <Reveal kind="wipe" className="absolute inset-x-0 top-[5px] hidden h-px bg-teal/70 md:block" />
          <ol className="grid gap-6 md:grid-cols-5 md:gap-6">
            {STEPS.map(([n, k, t], i) => (
              <Reveal as="li" key={n} delay={i * 90} className="relative md:pt-6">
                <span className="absolute left-0 top-0 hidden size-[11px] rounded-full border-2 border-teal bg-graphite md:block" aria-hidden />
                <p className="text-label text-teal">{n}</p>
                <p className="mt-2 font-medium text-cloud">{k}</p>
                <p className="mt-1 text-small text-steel">{t}</p>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal className="container-wide mt-10 border-t border-hairline pt-6 md:mt-12">
          <p className="text-label text-steel">Partners</p>
        </Reveal>
        {/* Same treatment as the client logos: one calm band instead of a static row. */}
        <Marquee className="mt-5" label="Plataformas y canales con los que trabaja Likin" duration={55} gap="gap-10 md:gap-14">
          {PARTNER_LOOP.map((s, i) => (
            <Image key={`${s.id}-${i}`} src={s.src} alt={i < stack.length ? `${s.name} · ${s.role}` : ""} aria-hidden={i >= stack.length} width={s.width} height={s.height} sizes="140px" className="h-[22px] w-auto opacity-60 md:h-6" />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
