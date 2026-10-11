"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, CONSENT_KEY, CONSENT_OPEN_EVENT, readConsent, saveConsent, stateOf, type ConsentState } from "@/lib/consent";
import { metaPixel } from "@/lib/meta-pixel";
import { initConversionTracking, trackEvent, viewContentFor } from "@/lib/meta";
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
const snapshot = (): ConsentState => stateOf(readConsent());
// El servidor nunca sabe la decisión: no pinta nada (sin parpadeo para quien ya decidió).
const serverSnapshot = (): ConsentState | "unknown" => "unknown";

/** La decisión de cookies de este navegador ("unknown" en el servidor y al hidratar). */
export const useConsentState = () => useSyncExternalStore(subscribe, snapshot, serverSnapshot);

/**
 * Aviso de cookies: Google Analytics (Analytics.tsx) y Meta (píxel y API de Conversiones), las dos
 * con la misma decisión. Sin píxel ni Google Analytics no habría cookies opcionales ni aviso.
 */
export function ConsentManager() {
  if (!metaPixel.configured && !ga.measurementId) return null;
  return <ConsentPanel />;
}

function ConsentPanel() {
  const state = useConsentState();
  const [reopened, setReopened] = useState(false);
  const pathname = usePathname();
  const lastViewed = useRef<string | null>(null);
  const titleId = useId();

  // La decisión manda: el píxel solo se carga tras un «Aceptar»; un «Rechazar» borra sus cookies.
  // Un PageView por página (píxel + API con el mismo event_id), también en la navegación interna;
  // en las páginas de servicio y de casos, además un ViewContent.
  useEffect(() => {
    if (state === "granted") {
      metaPixel.grant(null);
      initConversionTracking();
      if (lastViewed.current !== pathname && trackEvent("PageView") !== null) {
        lastViewed.current = pathname;
        const view = viewContentFor(pathname);
        if (view) trackEvent("ViewContent", view);
      }
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
          Usamos cookies de Google Analytics, Microsoft Clarity y Meta (terceros) para saber cómo se usa la web y qué anuncios nos traen solicitudes. Solo se activan si aceptas; si las rechazas, la web funciona igual.{" "}
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
