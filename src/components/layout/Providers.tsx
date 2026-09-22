"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useJsFlag } from "@/lib/hooks";
import dynamic from "next/dynamic";

/** The qualification system is only needed once someone acts on a CTA: keep it out of the
 *  first load of every page and fetch it when the sheet is first opened. */
const QualifySheet = dynamic(() => import("@/components/qualify/QualifySheet").then((m) => m.QualifySheet), { ssr: false });
import type { Service } from "@/lib/qualify/types";

/** Kept for the existing CTAs across the site. */
export type LeadTrack = "build" | "scale";

type LeadCtx = { openLead: (track?: LeadTrack, source?: string) => void };
const Ctx = createContext<LeadCtx>({ openLead: () => {} });
export const useLead = () => useContext(Ctx);

const HASH: Record<string, LeadTrack | null> = { "#lead": null, "#lead-build": "build", "#lead-scale": "scale" };

export function Providers({ children }: { children: ReactNode }) {
  useJsFlag();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Stays true after the first open so closing does not unload the chunk.
  const [mounted, setMounted] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [source, setSource] = useState("");

  const openLead = useCallback(
    (t?: LeadTrack, s?: string) => {
      // A BUILD or SCALE CTA already answers the first question: never ask it again.
      setService(t === "build" ? "BUILD" : t === "scale" ? "SCALE" : null);
      setSource(s ? `${pathname}#${s}` : pathname);
      setMounted(true);
      setOpen(true);
    },
    [pathname],
  );
  const close = useCallback(() => setOpen(false), []);

  // Deep links: /crear-tienda-online#lead-build opens the flow directly
  useEffect(() => {
    const check = () => {
      const h = window.location.hash;
      if (h in HASH) {
        openLead(HASH[h] ?? undefined, h.slice(1));
        history.replaceState(null, "", pathname);
      }
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [pathname, openLead]);

  const value = useMemo(() => ({ openLead }), [openLead]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {mounted && <QualifySheet open={open} service={service} source={source} onClose={close} onService={setService} />}
    </Ctx.Provider>
  );
}
