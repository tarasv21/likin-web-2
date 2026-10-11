"use client";

import { useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { clarity, ga } from "@/lib/analytics";
import type { ClarityHost } from "@/lib/clarity";
import type { GaHost } from "@/lib/ga";
import { useConsentState } from "@/components/consent/ConsentManager";

const host = () => window as unknown as GaHost;

/** Fija el consentimiento (solo analítica) antes que el script de <GoogleAnalytics />: su efecto va primero. */
function GaConsent() {
  useEffect(() => {
    ga.prepare(host());
  }, []);
  return null;
}

/**
 * Google Analytics 4 con <GoogleAnalytics /> de @next/third-parties, una sola vez para toda la web, y
 * Microsoft Clarity (src/lib/clarity.ts),
 * SOLO tras «Aceptar» y solo en el dominio real (src/lib/ga.ts). Al rechazar o retirar el
 * consentimiento, GA se desactiva y sus cookies se borran. Las páginas nuevas de la navegación
 * interna las mide GA con el historial del navegador (medición mejorada).
 */
export function Analytics() {
  const state = useConsentState();
  useEffect(() => {
    if (state === "granted") clarity.load(window as unknown as ClarityHost);
    else if (state === "denied") {
      ga.revoke(host());
      clarity.revoke(window as unknown as ClarityHost);
    }
  }, [state]);
  const on = state === "granted" && typeof window !== "undefined" && ga.allowedOn(window.location.hostname);
  if (!on) return null;
  return (
    <>
      <GaConsent />
      <GoogleAnalytics gaId={ga.measurementId} />
    </>
  );
}
