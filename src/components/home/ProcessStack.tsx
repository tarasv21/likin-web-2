import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { stack } from "@/data/proof";

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
      <div className="container-wide py-(--spacing-section-s)">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-label text-steel">Cómo trabajamos</p>
            <h2 id="proceso-title" className="text-h3 mt-3 max-w-[22ch]">
              Un ciclo. <span className="text-steel">No una lista de tareas.</span>
            </h2>
          </div>
        </Reveal>
        <div className="relative mt-8 md:mt-10">
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
        <Reveal className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 border-t border-hairline pt-6 md:mt-12">
          <p className="text-label text-steel">Partners</p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {stack.map((s) => (
              <li key={s.id}>
                <Image src={s.src} alt={`${s.name} · ${s.role}`} width={s.width} height={s.height} sizes="120px" className="h-[18px] w-auto opacity-60 md:h-5" />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
