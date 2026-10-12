"use client";

import { useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { clarity, ga } from "@/lib/analytics";
import type { ClarityHost } from "@/lib/clarity";
import type { GaHost } from "@/lib/ga";
import { useConsentKey } from "@/components/consent/ConsentManager";
import { choiceOf } from "@/lib/consent";

const host = () => window as unknown as GaHost;

/** Fija el consentimiento (solo analítica) antes que el script de <GoogleAnalytics />: su efecto va primero. */
function GaConsent() {
  useEffect(() => {
    ga.prepare(host());
  }, []);
  return null;
}

/**
 * Analítica: Google Analytics 4 con <GoogleAnalytics /> de @next/third-parties, una sola vez para toda
 * la web, y Microsoft Clarity (src/lib/clarity.ts), SOLO con la finalidad «Analítica» aceptada y solo en
 * el dominio real (src/lib/ga.ts). Al rechazarla o retirarla, GA y Clarity se desactivan y sus cookies
 * se borran. Las páginas nuevas de la navegación
 * interna las mide GA con el historial del navegador (medición mejorada).
 */
export function Analytics() {
  const choice = choiceOf(useConsentKey());
  const decided = choice !== null;
  const analytics = choice?.analytics === true;
  useEffect(() => {
    if (analytics) clarity.load(window as unknown as ClarityHost);
    else if (decided) {
      ga.revoke(host());
      clarity.revoke(window as unknown as ClarityHost);
    }
  }, [analytics, decided]);
  const on = analytics && typeof window !== "undefined" && ga.allowedOn(window.location.hostname);
  if (!on) return null;
  return (
    <>
      <GaConsent />
      <GoogleAnalytics gaId={ga.measurementId} />
    </>
  );
}
