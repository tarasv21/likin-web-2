"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "@/components/ui/Icons";
import type { LeadTrack } from "./Providers";
import { useLead } from "./Providers";
import { cn } from "@/lib/utils";

/**
 * Mobile-only sticky CTA. Appears once the element `after` has scrolled past
 * and hides while `until` (the final CTA) is in view.
 */
export function StickyCta({ after, until, label, track }: { after: string; until?: string; label: string; track?: LeadTrack }) {
  const [show, setShow] = useState(false);
  const { openLead } = useLead();

  useEffect(() => {
    const a = document.getElementById(after);
    if (!a) return;
    let passed = false;
    let untilVisible = false;
    const update = () => setShow(passed && !untilVisible);
    const io1 = new IntersectionObserver(
      ([e]) => {
        passed = e.boundingClientRect.bottom < 0;
        update();
      },
      { threshold: [0, 0.01] },
    );
    io1.observe(a);
    let io2: IntersectionObserver | undefined;
    const u = until ? document.getElementById(until) : null;
    if (u) {
      io2 = new IntersectionObserver(
        ([e]) => {
          untilVisible = e.isIntersecting;
          update();
        },
        { threshold: 0.05 },
      );
      io2.observe(u);
    }
    return () => {
      io1.disconnect();
      io2?.disconnect();
    };
  }, [after, until]);

  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-(--z-sticky) flex justify-center p-3 pb-[max(12px,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-(--dur) ease-(--ease-out) md:hidden", show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0")} aria-hidden={!show}>
      <button type="button" onClick={() => openLead(track, "sticky")} tabIndex={show ? 0 : -1} className="inline-flex h-13 items-center gap-2 rounded-pill bg-teal px-6 text-[1rem] font-medium text-obsidian shadow-capsule">
        {label} <ArrowRight size={18} />
      </button>
    </div>
  );
}
