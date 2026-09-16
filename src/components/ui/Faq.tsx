import type { Faq as FaqItem } from "@/data/faqs";
import { Plus } from "./Icons";
import { cn } from "@/lib/utils";

/**
 * Semantic FAQ: <details name="…"> gives a native exclusive accordion with zero JS,
 * keyboard support and crawlable answers.
 */
export function Faq({ items, name, className, light = false }: { items: FaqItem[]; name: string; className?: string; light?: boolean }) {
  return (
    <div className={cn("divide-y border-y", light ? "divide-paper-line border-paper-line" : "divide-hairline border-hairline", className)}>
      {items.map((f, i) => (
        <details key={f.q} name={name} className="group">
          <summary className="flex cursor-pointer items-start justify-between gap-6 py-5 text-left md:py-6">
            <span className="flex items-start gap-4">
              <span className={cn("text-label mt-1.5 hidden w-6 shrink-0 md:inline", light ? "text-ink-2" : "text-steel")}>{String(i + 1).padStart(2, "0")}</span>
              <span className={cn("text-body-xl font-medium tracking-[-0.01em]", light ? "text-ink" : "text-cloud")}>{f.q}</span>
            </span>
            <span
              className={cn(
                "mt-1 grid size-8 shrink-0 place-items-center rounded-full border transition-[transform,color,border-color] duration-(--dur) ease-(--ease-out) group-open:rotate-45",
                light ? "border-paper-line text-ink-2 group-open:border-ink group-open:text-ink" : "border-hairline text-steel group-open:border-teal group-open:text-teal",
              )}
            >
              <Plus size={16} />
            </span>
          </summary>
          <div className="pb-6 md:pb-8 md:pl-10">
            <p className={cn("max-w-[62ch] text-body", light ? "text-ink-2" : "text-steel")}>{f.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
