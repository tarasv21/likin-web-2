import Image from "next/image";
import { Marquee } from "@/components/ui/Marquee";
import { clients } from "@/data/clients";

/** Not a section: a thin monochrome transition between hero and proof. */
export function ClientMarquee({ id = "marcas", label = "Marcas que ya han dejado huella" }: { id?: string; label?: string }) {
  return (
    <div id={id} className="relative border-y border-hairline bg-obsidian py-6 md:py-8">
      <div className="container-wide mb-5 md:mb-6">
        <p className="text-label text-steel">{label}</p>
      </div>
      <Marquee label="Clientes de Likin" duration={90}>
        {clients.map((c) => (
          <Image key={c.id} src={c.logo} alt={c.name} width={c.width} height={c.height} sizes="180px" className={`h-7 w-auto opacity-60 md:h-8 ${c.dark ? "invert" : ""}`} />
        ))}
      </Marquee>
    </div>
  );
}
