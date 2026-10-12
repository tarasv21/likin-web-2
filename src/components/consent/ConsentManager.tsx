"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, CONSENT_KEY, CONSENT_OPEN_EVENT, choiceOf, keyOf, readConsent, saveConsent, type ConsentChoice, type ConsentKey } from "@/lib/consent";
import { metaPixel } from "@/lib/meta-pixel";
import { trackEvent } from "@/lib/meta";
import { site } from "@/data/site";
import { ga } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === CONSENT_KEY) onChange();
  };
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
const snapshot = (): ConsentKey => keyOf(readConsent());
// El servidor nunca sabe la decisión: no pinta nada (sin parpadeo para quien ya decidió).
const serverSnapshot = (): ConsentKey | "unknown" => "unknown";

/** La decisión de cookies de este navegador: "unknown" (servidor e hidratación), "undecided" o "a1-p0"… */
export const useConsentKey = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot);

/**
 * Aviso de cookies por finalidades: Analítica (Google Analytics y Microsoft Clarity, Analytics.tsx) y
 * Publicidad (Meta: píxel y API de Conversiones, aquí). «Rechazar todas», «Configurar» y «Aceptar
 * todas» con el mismo peso; «Configurar cookies» del pie lo reabre para cambiar la decisión.
 */
export function ConsentManager() {
  if (!metaPixel.configured && !ga.measurementId) return null;
  return <ConsentPanel />;
}

function ConsentPanel() {
  const key = useConsentKey();
  const choice = choiceOf(key);
  const [reopened, setReopened] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [draft, setDraft] = useState<ConsentChoice>({ analytics: false, ads: false });
  const pathname = usePathname();
  const lastViewed = useRef<string | null>(null);
  const titleId = useId();

  // Publicidad: el píxel solo se carga con ella; retirarla lo detiene y borra sus cookies. Un
  // PageView por página (píxel + API con el mismo event_id), también en la navegación interna.
  useEffect(() => {
    if (choice?.ads) {
      metaPixel.grant(null);
      if (lastViewed.current !== pathname && trackEvent("PageView") !== null) lastViewed.current = pathname;
    } else if (choice) {
      metaPixel.revoke();
      lastViewed.current = null;
    }
  }, [choice?.ads, choice, pathname]);

  useEffect(() => {
    const open = () => {
      const current = choiceOf(keyOf(readConsent()));
      setDraft(current ?? { analytics: false, ads: false });
      setConfiguring(true);
      setReopened(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  if (key === "unknown" || (key !== "undecided" && !reopened)) return null;

  const decide = (c: ConsentChoice) => {
    saveConsent(c);
    setReopened(false);
    setConfiguring(false);
  };
  const button =
    "inline-flex h-11 items-center justify-center rounded-button border border-outline bg-transparent px-4 text-[0.9375rem] font-medium text-cloud transition-colors duration-(--dur-fast) hover:border-steel hover:bg-graphite";
  const yesNo = (v: boolean) => (v ? "sí" : "no");

  return (
    <section role="region" aria-labelledby={titleId} className="fixed inset-x-0 bottom-0 z-(--z-consent) p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-5 md:left-5 md:max-w-[460px] md:p-0">
      <div className="max-h-[80dvh] overflow-y-auto rounded-card border border-hairline bg-graphite p-5 shadow-capsule">
        <h2 id={titleId} className="text-label text-steel">
          Cookies
        </h2>
        <p className="mt-3 text-small text-cloud/90">
          Usamos cookies de analítica (Google Analytics y Microsoft Clarity), para saber cómo se usa la web, y de publicidad (Meta), para medir qué anuncios nos traen solicitudes. Solo se activan las que aceptes; si las rechazas, la web funciona igual.{" "}
          <Link href={site.routes.cookies} className="text-cloud underline underline-offset-2 hover:text-teal">
            Política de cookies
          </Link>
        </p>
        {choice && (
          <p className="mt-2 text-small text-steel">
            Ahora mismo: analítica {yesNo(choice.analytics)} · publicidad {yesNo(choice.ads)}.
          </p>
        )}

        {configuring && (
          <fieldset className="mt-4 grid gap-3 border-t border-hairline pt-4">
            <legend className="sr-only">Elige qué cookies aceptas</legend>
            <Purpose
              label="Analítica"
              text="Google Analytics y Microsoft Clarity: cuántas personas visitan la web, de dónde llegan y cómo la usan (mapas de calor y grabaciones de la navegación, con el formulario oculto)."
              checked={draft.analytics}
              onChange={(v) => setDraft({ ...draft, analytics: v })}
            />
            <Purpose
              label="Publicidad"
              text="Meta (píxel y API de Conversiones): qué anuncios nos traen visitas y solicitudes."
              checked={draft.ads}
              onChange={(v) => setDraft({ ...draft, ads: v })}
            />
          </fieldset>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => decide({ analytics: false, ads: false })} className={button}>
            Rechazar todas
          </button>
          {configuring ? (
            <button type="button" onClick={() => decide(draft)} className={cn(button, "col-span-2 sm:col-span-1 sm:order-none order-last")}>
              Guardar selección
            </button>
          ) : (
            <button type="button" onClick={() => { setDraft(choice ?? { analytics: false, ads: false }); setConfiguring(true); }} className={cn(button, "col-span-2 sm:col-span-1 sm:order-none order-last")}>
              Configurar
            </button>
          )}
          <button type="button" onClick={() => decide({ analytics: true, ads: true })} className={button}>
            Aceptar todas
          </button>
        </div>
      </div>
    </section>
  );
}

function Purpose({ label, text, checked, onChange }: { label: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] border border-outline transition-colors checked:border-teal checked:bg-teal"
      />
      <label htmlFor={id} className="text-small text-cloud/90">
        <span className="font-medium text-cloud">{label}</span>
        <span className="mt-0.5 block text-steel">{text}</span>
      </label>
    </div>
  );
}
