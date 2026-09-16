import type { CSSProperties } from "react";
import { FINGERPRINT_VIEWBOX, RIDGES, ridgeHref } from "@/data/fingerprint-meta";
import { cn } from "@/lib/utils";

export { FINGERPRINT_VIEWBOX, RIDGE_COUNT, RIDGES, ridgeHref } from "@/data/fingerprint-meta";

/**
 * The real Likin isotype, traced from the brand source. One ridge per <use> (top → bottom),
 * so ridges can be tinted, revealed or used as diagram lines without ever redrawing the mark.
 * Geometry lives in the cached sprite /brand/fingerprint.svg.
 */
export function Fingerprint({
  className,
  fill = "currentColor",
  gradient = false,
  id = "fp",
  title,
  active,
  activeFill = "var(--color-teal)",
  ridgeStyle,
  style,
}: {
  className?: string;
  fill?: string;
  gradient?: boolean;
  id?: string;
  title?: string;
  active?: number[];
  activeFill?: string;
  ridgeStyle?: (i: number) => CSSProperties | undefined;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox={FINGERPRINT_VIEWBOX} className={cn("block", className)} role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true} style={style}>
      {title && <title>{title}</title>}
      {gradient && (
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#00D6B2" />
            <stop offset="0.55" stopColor="#00A98D" />
            <stop offset="1" stopColor="#00483D" />
          </linearGradient>
        </defs>
      )}
      {RIDGES.map((i) => (
        <use key={i} href={ridgeHref(i)} data-ridge={i} fill={active?.includes(i) ? activeFill : gradient ? `url(#${id}-g)` : fill} style={ridgeStyle?.(i)} />
      ))}
    </svg>
  );
}
