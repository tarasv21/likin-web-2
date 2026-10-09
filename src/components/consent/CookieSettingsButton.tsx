"use client";

import { openConsentPanel } from "@/lib/consent";
import { metaPixel } from "@/lib/meta-pixel";

/** Footer control to change or withdraw the cookie decision (only when there is something to decide). */
export function CookieSettingsButton({ className }: { className?: string }) {
  if (!metaPixel.configured) return null;
  return (
    <button type="button" onClick={openConsentPanel} className={className}>
      Configurar cookies
    </button>
  );
}
