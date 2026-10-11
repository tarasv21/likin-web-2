"use client";

import { useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ga } from "@/lib/analytics";
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
 * Google Analytics 4 con <GoogleAnalytics /> de @next/third-parties, una sola vez para toda la web,
 * SOLO tras «Aceptar» y solo en el dominio real (src/lib/ga.ts). Al rechazar o retirar el
 * consentimiento, GA se desactiva y sus cookies se borran. Las páginas nuevas de la navegación
 * interna las mide GA con el historial del navegador (medición mejorada).
 */
export function Analytics() {
  const state = useConsentState();
  useEffect(() => {
    if (state === "denied") ga.revoke(host());
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
