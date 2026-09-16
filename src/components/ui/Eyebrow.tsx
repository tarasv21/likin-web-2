import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mono label. `tone` follows the "teal is earned" rule: steel by default. */
export function Eyebrow({ children, tone = "steel", className, as: Tag = "p" }: { children: ReactNode; tone?: "steel" | "teal" | "ink"; className?: string; as?: "p" | "span" | "div" }) {
  return <Tag className={cn("text-label", tone === "teal" ? "text-teal" : tone === "ink" ? "text-ink-2" : "text-steel", className)}>{children}</Tag>;
}
