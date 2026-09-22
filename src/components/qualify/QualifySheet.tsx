"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Close as CloseIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/brand/Logo";
import { QualifyFlow } from "./QualifyFlow";
import { track } from "@/lib/qualify/events";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/qualify/types";

/**
 * The surface the qualification runs in: full screen on mobile, a wide inset panel from md.
 * Built on the native <dialog> for the focus trap, Esc and inert background we get for free.
 * It is not a popup floating over the page; it is the page handing over to a conversation.
 */
export function QualifySheet({ open, service, source, onClose, onService }: { open: boolean; service: Service | null; source: string; onClose: () => void; onService: (s: Service) => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Comprobar si Likin encaja con tu negocio"
      className={cn(
        "m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-cloud backdrop:bg-obsidian/85 backdrop:backdrop-blur-sm",
        "open:motion-safe:animate-[qz-sheet_.32s_var(--ease-out)]",
      )}
    >
      <div className="flex h-dvh w-full items-stretch justify-center md:p-6 lg:p-8">
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-obsidian md:max-w-[62rem] md:rounded-sheet md:border md:border-hairline md:shadow-float">
          {/* Chrome */}
          <div className="flex shrink-0 items-center justify-between gap-4 px-(--spacing-gutter) pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:pt-5">
            <Logo height={18} href="/" />
            <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-10 place-items-center rounded-full border border-hairline text-steel transition-colors hover:border-steel hover:text-cloud">
              <CloseIcon size={16} />
            </button>
          </div>

          {service ? (
            <QualifyFlow key={service} service={service} source={source} onClose={onClose} onSwitchToBuild={() => onService("BUILD")} />
          ) : (
            <Chooser onService={onService} source={source} />
          )}
        </div>
      </div>
    </dialog>
  );
}

function Chooser({ onService, source }: { onService: (s: Service) => void; source: string }) {
  const pick = (s: Service) => {
    track("service_selected", { service: s, source });
    onService(s);
  };
  const items: { s: Service; k: string; title: string; text: string; note: string }[] = [
    { s: "BUILD", k: "Build", title: "Quiero crear mi eCommerce.", text: "Todavía no vendo online o quiero rehacer mi tienda.", note: `Desde ${site.build.priceFrom} € + IVA` },
    { s: "SCALE", k: "Scale", title: "Ya vendo. Quiero crecer.", text: "Tengo una tienda vendiendo y quiero un sistema de crecimiento.", note: site.scale.minRevenueLabel },
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-(--spacing-gutter) py-8">
      <div className="mx-auto w-full max-w-[42rem]">
        <p className="text-label text-teal">Antes de empezar</p>
        <h2 className="text-h3 mt-4 max-w-[18ch]">¿En qué punto estás?</h2>
        <p className="mt-3 max-w-[46ch] text-body text-steel">Según lo que elijas te preguntamos una cosa u otra. No pedimos datos de contacto hasta el final.</p>
        <div className="mt-8 grid gap-3">
          {items.map((it) => (
            <button
              key={it.s}
              type="button"
              onClick={() => pick(it.s)}
              className="group flex w-full items-center justify-between gap-5 rounded-card border border-hairline p-5 text-left transition-[border-color,background-color] duration-(--dur-fast) hover:border-teal hover:bg-teal/[0.05] md:p-6"
            >
              <span className="min-w-0">
                <span className="text-label block text-teal">{it.k}</span>
                <span className="mt-2 block text-body-xl font-medium text-cloud">{it.title}</span>
                <span className="mt-1.5 block text-body text-steel">{it.text}</span>
                <span className="text-label mt-3 block text-steel">{it.note}</span>
              </span>
              <ArrowRight className="shrink-0 text-steel transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-teal" />
            </button>
          ))}
        </div>
        <p className="text-label mt-6 text-steel">Revisamos cada proyecto antes de aceptarlo.</p>
      </div>
    </div>
  );
}
