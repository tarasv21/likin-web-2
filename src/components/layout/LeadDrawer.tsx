"use client";

import { Modal } from "@/components/ui/Modal";
import { ArrowRight } from "@/components/ui/Icons";
import { BuildForm } from "@/components/forms/BuildForm";
import { ScaleForm } from "@/components/forms/ScaleForm";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

export type LeadTrack = "build" | "scale";

/**
 * The only contact surface of the site. Opens on intent (any CTA), never sits on the page.
 * Without a track it asks first; with one it goes straight to the qualification steps.
 */
export function LeadDrawer({ open, track, source, onClose, onTrack }: { open: boolean; track: LeadTrack | null; source: string; onClose: () => void; onTrack: (t: LeadTrack) => void }) {
  const title = track === "build" ? "Crear mi eCommerce" : track === "scale" ? "Escalar mi eCommerce" : "¿En qué punto estás?";
  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="sheet"
      title={title}
      header={track ? <p className="text-label mt-1.5 text-teal">{track === "build" ? "LIKIN BUILD" : "LIKIN SCALE"}</p> : <p className="mt-1.5 text-small text-steel">Dos caminos. Elige el tuyo.</p>}
    >
      {!track && <Chooser onTrack={onTrack} />}
      {track === "build" && <BuildForm source={source} />}
      {track === "scale" && <ScaleForm source={source} />}
    </Modal>
  );
}

function Chooser({ onTrack }: { onTrack: (t: LeadTrack) => void }) {
  const items: { t: LeadTrack; k: string; title: string; text: string; note: string }[] = [
    { t: "build", k: "BUILD", title: "Quiero crear mi eCommerce.", text: "Todavía no vendo online o quiero rehacer mi tienda.", note: `Desde ${site.build.priceFrom} € + IVA · 3 pagos al 0 %` },
    { t: "scale", k: "SCALE", title: "Ya vendo. Quiero crecer.", text: "Facturo +10.000 €/mes y quiero un sistema de crecimiento.", note: site.scale.minRevenueLabel },
  ];
  return (
    <div className="grid gap-3">
      {items.map((it) => (
        <button
          key={it.t}
          type="button"
          onClick={() => onTrack(it.t)}
          className={cn("group flex w-full items-center justify-between gap-4 rounded-card border border-hairline p-5 text-left transition-colors hover:border-teal/70 focus-visible:border-teal")}
        >
          <span className="min-w-0">
            <span className="text-label block text-teal">{it.k}</span>
            <span className="mt-2 block text-h3">{it.title}</span>
            <span className="mt-1 block text-body text-steel">{it.text}</span>
            <span className="text-label mt-3 block text-steel">{it.note}</span>
          </span>
          <ArrowRight className="shrink-0 text-steel transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-teal" />
        </button>
      ))}
      <p className="mt-2 text-small text-steel">Sin permanencias. Revisamos cada proyecto antes de aceptarlo.</p>
    </div>
  );
}
