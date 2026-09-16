"use client";

import { useState, type ReactNode } from "react";
import { Pause, Play } from "./Icons";
import { cn } from "@/lib/utils";

/**
 * CSS-only infinite marquee with an explicit pause control (auto-moving content needs one).
 * Children are duplicated once (aria-hidden) to loop. Pauses on hover/focus; static under reduced motion.
 */
export function Marquee({ children, duration = 70, className, gap = "gap-12 md:gap-16", label }: { children: ReactNode; duration?: number; className?: string; gap?: string; label?: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <div className={cn("group/mq relative", className)}>
      <div className="marquee relative overflow-hidden mask-fade-x motion-reduce:overflow-x-auto motion-reduce:no-scrollbar" aria-label={label} role={label ? "group" : undefined} style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}>
        <div className={cn("marquee-track items-center", gap)} style={paused ? { animationPlayState: "paused" } : undefined}>
          <div className={cn("flex shrink-0 items-center", gap)}>{children}</div>
          <div className={cn("flex shrink-0 items-center", gap)} aria-hidden="true">
            {children}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        aria-pressed={paused}
        aria-label={paused ? "Reanudar" : "Pausar"}
        className="absolute right-(--spacing-gutter) top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-hairline bg-obsidian text-steel opacity-0 transition-opacity hover:text-cloud focus-visible:opacity-100 group-hover/mq:opacity-100 motion-reduce:hidden"
      >
        {paused ? <Play size={10} /> : <Pause size={10} />}
      </button>
    </div>
  );
}
