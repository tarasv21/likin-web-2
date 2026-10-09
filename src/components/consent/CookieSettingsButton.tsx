"use client";

import { openConsentPanel } from "@/lib/consent";
import { metaPixel } from "@/lib/meta-pixel";

/** Footer list item to change or withdraw the cookie decision (only when there is something to decide). */
export function CookieSettingsItem({ className }: { className?: string }) {
  if (!metaPixel.configured) return null;
  return (
    <li>
      <button type="button" onClick={openConsentPanel} className={className}>
        Configurar cookies
      </button>
    </li>
  );
}
