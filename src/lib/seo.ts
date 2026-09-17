import type { Metadata } from "next";
import { site } from "@/data/site";
import type { Faq } from "@/data/faqs";
import type { CaseStudy } from "@/data/cases";

export function pageMetadata(opts: { title: string; description: string; path: string; ogImage?: string; noindex?: boolean }): Metadata {
  const url = `${site.url}${opts.path === "/" ? "" : opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      locale: site.locale,
      url,
      siteName: site.name,
      title: opts.title,
      description: opts.description,
      ...(opts.ogImage ? { images: [{ url: opts.ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      ...(opts.ogImage ? { images: [opts.ogImage] } : {}),
    },
  };
}

export const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${site.url}/#organization`,
  name: site.name,
  alternateName: site.shortName,
  url: site.url,
  logo: `${site.url}/brand/favicon-512.png`,
  email: site.email,
  description: site.description,
  sameAs: [site.social.instagram, site.social.linkedinCompany],
  founder: { "@type": "Person", name: site.founder.name, url: site.founder.url, jobTitle: "Founder" },
  knowsAbout: ["eCommerce", "Shopify", "Paid Media", "CRO", "Email Marketing", "Retention", "Meta Ads", "Google Ads", "TikTok Ads", "Klaviyo"],
  areaServed: "ES",
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@id": `${site.url}${site.routes.build}#service` } },
    { "@type": "Offer", itemOffered: { "@id": `${site.url}${site.routes.scale}#service` } },
  ],
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  url: site.url,
  name: site.name,
  inLanguage: "es",
  publisher: { "@id": `${site.url}/#organization` },
});

export const buildServiceJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${site.url}${site.routes.build}#service`,
  name: "LIKIN BUILD — Creación de tienda online en Shopify",
  serviceType: "Diseño y desarrollo de tienda online Shopify",
  provider: { "@id": `${site.url}/#organization` },
  areaServed: "ES",
  url: `${site.url}${site.routes.build}`,
  description:
    "Creación desde cero o migración de una tienda online en Shopify: diseño responsive, estructura, pagos, envíos, dominio, hasta 30 productos, preparación de tracking, conexión con Klaviyo y formación para gestionarla con autonomía.",
  offers: {
    "@type": "Offer",
    price: String(site.build.priceFrom),
    priceCurrency: "EUR",
    priceSpecification: { "@type": "UnitPriceSpecification", price: String(site.build.priceFrom), priceCurrency: "EUR", valueAddedTaxIncluded: false },
    availability: "https://schema.org/InStock",
    url: `${site.url}${site.routes.build}`,
  },
});

export const scaleServiceJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${site.url}${site.routes.scale}#service`,
  name: "LIKIN SCALE — Equipo de crecimiento para eCommerce",
  serviceType: "eCommerce growth: Paid Media, CRO, Email Marketing y dirección estratégica",
  provider: { "@id": `${site.url}/#organization` },
  areaServed: "ES",
  url: `${site.url}${site.routes.scale}`,
  audience: { "@type": "BusinessAudience", name: "eCommerce que facturan más de 10.000 € al mes" },
  description:
    "Servicio para eCommerce que ya facturan más de 10.000 € al mes. Likin se convierte en el equipo de crecimiento: adquisición, conversión, retention y dirección estratégica trabajando como un único sistema. Fase inicial de 90 días.",
});

export const faqJsonLd = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${site.url}${it.path}` })),
});

export const caseJsonLd = (c: CaseStudy) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${site.url}${site.routes.work}/${c.slug}#case`,
  headline: `${c.name}: ${c.headline}`,
  description: c.summary,
  inLanguage: "es",
  author: { "@id": `${site.url}/#organization` },
  publisher: { "@id": `${site.url}/#organization` },
  about: { "@type": "Organization", name: c.name, url: c.url },
  ...(c.store ? { image: `${site.url}${c.store.fold}` } : {}),
  mainEntityOfPage: `${site.url}${site.routes.work}/${c.slug}`,
});

export const personJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.founder.name,
  url: site.founder.url,
  jobTitle: "Founder",
  worksFor: { "@id": `${site.url}/#organization` },
  sameAs: [site.social.instagramTaras, site.social.linkedin],
  image: `${site.url}/founder/taras-portrait.webp`,
});
