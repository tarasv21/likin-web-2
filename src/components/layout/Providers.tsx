"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useJsFlag } from "@/lib/hooks";
import { LeadDrawer, type LeadTrack } from "./LeadDrawer";

type LeadCtx = { openLead: (track?: LeadTrack, source?: string) => void };
const Ctx = createContext<LeadCtx>({ openLead: () => {} });
export const useLead = () => useContext(Ctx);

const HASH: Record<string, LeadTrack | null> = { "#lead": null, "#lead-build": "build", "#lead-scale": "scale" };

export function Providers({ children }: { children: ReactNode }) {
  useJsFlag();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState<LeadTrack | null>(null);
  const [source, setSource] = useState("");

  const openLead = useCallback(
    (t?: LeadTrack, s?: string) => {
      setTrack(t ?? null);
      setSource(s ? `${pathname}#${s}` : pathname);
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
      <LeadDrawer open={open} track={track} source={source} onClose={close} onTrack={setTrack} />
    </Ctx.Provider>
  );
}
