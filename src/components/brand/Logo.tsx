import Link from "next/link";
import { cn } from "@/lib/utils";

/** LIKIN wordmark (white) — the real asset, served as-is (small PNG, no optimizer round-trip). */
export function Logo({ height = 22, className, priority = false, href = "/" }: { height?: number; className?: string; priority?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="LIKIN, inicio">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/likin-wordmark-white.png" alt="LIKIN" width={Math.round(height * 1.78)} height={height} fetchPriority={priority ? "high" : undefined} decoding="async" style={{ height, width: "auto" }} />
    </Link>
  );
}
