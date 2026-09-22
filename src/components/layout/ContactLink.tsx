"use client";

import type { ReactNode } from "react";
import { useLead } from "./Providers";
import type { LeadTrack } from "./Providers";

export function ContactLink({ children, className, source, track }: { children: ReactNode; className?: string; source: string; track?: LeadTrack }) {
  const { openLead } = useLead();
  return (
    <button type="button" className={className} onClick={() => openLead(track, source)}>
      {children}
    </button>
  );
}
