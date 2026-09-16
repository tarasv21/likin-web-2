import type { Metadata } from "next";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

/**
 * Legal pages. The final texts must come from Likin's legal advisor: these are clearly
 * marked placeholders, noindex, with the data we do know filled in.
 */
export const legalMetadata = (title: string, path: string): Metadata => pageMetadata({ title, description: `${title} de ${site.name}.`, path, noindex: true });

export function LegalPage({ title, sections }: { title: string; sections: { h: string; p: string[] }[] }) {
  return (
    <article className="container-narrow pb-(--spacing-section-l) pt-[calc(var(--header-h)+48px)] md:pt-[calc(var(--header-h)+80px)]">
      <p className="text-label text-steel">Legal</p>
      <h1 className="text-h2 mt-4">{title}</h1>
      <p className="mt-6 rounded-card border border-hairline p-4 text-small text-steel">Texto provisional. Debe ser revisado y sustituido por el texto legal definitivo antes de la publicación.</p>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-h3">{s.h}</h2>
            {s.p.map((t, i) => (
              <p key={i} className="mt-3 text-body text-cloud/85">
                {t}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
