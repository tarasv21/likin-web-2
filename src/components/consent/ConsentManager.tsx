"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, CONSENT_KEY, CONSENT_OPEN_EVENT, readConsent, saveConsent, stateOf, type ConsentState } from "@/lib/consent";
import { metaPixel } from "@/lib/meta-pixel";
import { readLanding } from "@/lib/attribution/landing";
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
// The server never knows the decision: render nothing there (no flash for those who decided).
const serverSnapshot = (): ConsentState | "unknown" => "unknown";

/**
 * Cookie consent + Meta Pixel. Renders nothing at all when the pixel is not configured
 * (NEXT_PUBLIC_META_PIXEL_ID): then the site has no optional cookies and needs no banner.
 */
export function ConsentManager() {
  if (!metaPixel.configured) return null;
  return <ConsentPanel />;
}

function ConsentPanel() {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [reopened, setReopened] = useState(false);
  const pathname = usePathname();
  const firstPath = useRef(true);
  const titleId = useId();

  // Apply the decision to the pixel: load it only after an explicit yes; a no deletes its cookies.
  useEffect(() => {
    if (state === "granted") {
      const touch = readLanding();
      metaPixel.grant(touch ? { fbclid: touch.fbclid, at: touch.occurred_at } : null);
    }
    else if (state === "denied") metaPixel.revoke();
  }, [state]);

  // Page views on client-side navigation (grant() already sent the first one).
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    metaPixel.pageView();
  }, [pathname]);

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
