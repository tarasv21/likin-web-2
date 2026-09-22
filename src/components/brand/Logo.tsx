import Link from "next/link";
import { cn } from "@/lib/utils";

/** Aspect ratio of public/brand/likin-wordmark-white.png (322×96). Keep in step with the asset. */
const WORDMARK_RATIO = 322 / 96;

/** LIKIN wordmark (white) — the real asset, served as-is (small PNG, no optimizer round-trip). */
export function Logo({ height = 22, className, priority = false, href = "/" }: { height?: number; className?: string; priority?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="LIKIN, inicio">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/likin-wordmark-white.png" alt="LIKIN" width={Math.round(height * WORDMARK_RATIO)} height={height} fetchPriority={priority ? "high" : undefined} decoding="async" style={{ height, width: "auto" }} />
    </Link>
  );
}
