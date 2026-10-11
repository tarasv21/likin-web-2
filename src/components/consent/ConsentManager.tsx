"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, CONSENT_KEY, CONSENT_OPEN_EVENT, readConsent, saveConsent, stateOf, type ConsentState } from "@/lib/consent";
import { metaPixel } from "@/lib/meta-pixel";
import { initConversionTracking, trackEvent } from "@/lib/meta";
import { site } from "@/data/site";
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
const snapshot = (): ConsentState => stateOf(readConsent());
// El servidor nunca sabe la decisión: no pinta nada (sin parpadeo para quien ya decidió).
const serverSnapshot = (): ConsentState | "unknown" => "unknown";

/**
 * Aviso de cookies + Meta (píxel y API de Conversiones). No pinta nada si no hay
 * NEXT_PUBLIC_META_PIXEL_ID: entonces la web no tiene cookies opcionales ni necesita aviso.
 */
export function ConsentManager() {
  if (!metaPixel.configured) return null;
  return <ConsentPanel />;
}

function ConsentPanel() {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [reopened, setReopened] = useState(false);
  const pathname = usePathname();
  const lastViewed = useRef<string | null>(null);
  const titleId = useId();

  // La decisión manda: el píxel solo se carga tras un «Aceptar»; un «Rechazar» borra sus cookies.
  // Un PageView por página (píxel + API con el mismo event_id), también en la navegación interna.
  useEffect(() => {
    if (state === "granted") {
      metaPixel.grant(null);
      initConversionTracking();
      if (lastViewed.current !== pathname && trackEvent("PageView") !== null) lastViewed.current = pathname;
    } else if (state === "denied") metaPixel.revoke();
  }, [state, pathname]);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  if (state === "unknown" || (state !== "undecided" && !reopened)) return null;

  const decide = (ads: boolean) => {
    saveConsent(ads);
    setReopened(false);
  };
  const button = "inline-flex h-11 flex-1 items-center justify-center rounded-button border border-outline bg-transparent px-5 text-[0.9375rem] font-medium text-cloud transition-colors duration-(--dur-fast) hover:border-steel hover:bg-graphite md:flex-none";

  return (
    <section role="region" aria-labelledby={titleId} className="fixed inset-x-0 bottom-0 z-(--z-consent) p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-5 md:left-5 md:max-w-[440px] md:p-0">
      <div className="rounded-card border border-hairline bg-graphite p-5 shadow-capsule">
        <h2 id={titleId} className="text-label text-steel">
          Cookies
        </h2>
        <p className="mt-3 text-small text-cloud/90">
          Usamos cookies de Meta (terceros) para medir qué anuncios nos traen solicitudes. Solo se activan si aceptas; si las rechazas, la web funciona igual.{" "}
          <Link href={site.routes.cookies} className="text-cloud underline underline-offset-2 hover:text-teal">
            Política de cookies
          </Link>
        </p>
        {state !== "undecided" && <p className="mt-2 text-small text-steel">Ahora mismo están {state === "granted" ? "aceptadas" : "rechazadas"}.</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => decide(false)} className={cn(button)}>
            Rechazar
          </button>
          <button type="button" onClick={() => decide(true)} className={cn(button)}>
            Aceptar
          </button>
        </div>
      </div>
    </section>
  );
}
