import { Faq } from "@/components/ui/Faq";
import { Reveal } from "@/components/ui/Reveal";
import type { Faq as FaqItem } from "@/data/faqs";

export function FaqSection({ items, id = "faq", title = "Preguntas frecuentes", intro, name = "faq" }: { items: FaqItem[]; id?: string; title?: React.ReactNode; intro?: string; name?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="section-pad border-t border-hairline bg-obsidian">
      <div className="container-wide grid gap-8 md:grid-cols-12 md:gap-8">
        <Reveal className="md:col-span-4">
          <div className="md:sticky md:top-[calc(var(--header-h)+24px)]">
            <p className="text-label text-steel">FAQ</p>
            <h2 id={`${id}-title`} className="text-h2 mt-4 max-w-[10ch]">
              {title}
            </h2>
            {intro && <p className="mt-5 max-w-[34ch] text-body text-steel">{intro}</p>}
          </div>
        </Reveal>
        <Reveal className="md:col-span-8">
          <Faq items={items} name={name} />
        </Reveal>
      </div>
    </section>
  );
}
