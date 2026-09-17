import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ClientMarquee } from "@/components/home/ClientMarquee";
import { Results } from "@/components/home/Results";
import { PanelsMarquee } from "@/components/home/PanelsMarquee";
import { SalesPhone } from "@/components/home/SalesPhone";
import { Problem } from "@/components/home/Problem";
import { Paths } from "@/components/home/Paths";
import { GrowthSystem } from "@/components/home/GrowthSystem";
import { FeaturedCases } from "@/components/work/FeaturedCases";
import { Testimonials } from "@/components/home/Testimonials";
import { ProcessStack } from "@/components/home/ProcessStack";
import { Founder } from "@/components/home/Founder";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { StickyCta } from "@/components/layout/StickyCta";
import { JsonLd } from "@/components/JsonLd";
import { featuredCases } from "@/data/cases";
import { homeFaqs } from "@/data/faqs";
import { site } from "@/data/site";
import { faqJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "LIKIN — Agencia eCommerce · Creamos y escalamos tiendas Shopify",
  description:
    "Agencia especializada en eCommerce. Creamos tiendas online en Shopify preparadas para vender (BUILD) y escalamos las que ya facturan +10.000 €/mes conectando Paid Media, CRO y Retention (SCALE). Resultados reales de marcas reales.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={[faqJsonLd(homeFaqs), personJsonLd()]} />
      <Hero />
      <ClientMarquee />
      <Results />
      <PanelsMarquee />
      <SalesPhone />
      <Problem />
      <Paths />
      <GrowthSystem cta={{ label: "Cómo funciona SCALE", href: site.routes.scale }} />
      <FeaturedCases items={featuredCases.slice(0, 3)} eyebrow="Casos de éxito" />
      <Testimonials />
      <ProcessStack />
      <Founder />
      <FaqSection items={homeFaqs} intro="Lo que nos preguntan antes de empezar. Si tu duda no está aquí, escríbenos." />
      <FinalCta primary={{ label: site.cta.scaleShort, track: "scale" }} secondary={{ label: site.cta.buildShort, track: "build" }} />
      <StickyCta after="caminos" until="cta-final" label="Dejar huella" />
    </>
  );
}
