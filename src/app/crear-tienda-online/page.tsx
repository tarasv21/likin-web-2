import type { Metadata } from "next";
import { BuildHero } from "@/components/build/BuildHero";
import { StoresRail } from "@/components/build/StoresRail";
import { BuildSignature } from "@/components/build/BuildSignature";
import { BuildAutonomy, BuildDiagnosis, BuildIncludes, BuildPricing, BuildProcess, BuildToScale, WhyShopify } from "@/components/build/BuildSections";
import { FeaturedCases } from "@/components/work/FeaturedCases";
import { Testimonials } from "@/components/home/Testimonials";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { StickyCta } from "@/components/layout/StickyCta";
import { JsonLd } from "@/components/JsonLd";
import { buildCases } from "@/data/cases";
import { buildFaqs } from "@/data/faqs";
import { buildTestimonials } from "@/data/testimonials";
import { site } from "@/data/site";
import { breadcrumbJsonLd, buildServiceJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Crear tienda online en Shopify — LIKIN BUILD, desde 997 €",
  description:
    "Creamos tu tienda online en Shopify preparada para vender y te enseñamos a gestionarla. Diseño, estructura, pagos, envíos, tracking, Klaviyo y formación. Desde 997 € + IVA, 3 pagos al 0 %. Migraciones desde WooCommerce, Wix o Prestashop.",
  path: site.routes.build,
});

export default function BuildPage() {
  return (
    <>
      <JsonLd data={[buildServiceJsonLd(), faqJsonLd(buildFaqs), breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "BUILD · Crear tienda online", path: site.routes.build }])]} />
      <BuildHero />
      <StoresRail />
      <BuildDiagnosis />
      <BuildSignature />
      <BuildIncludes />
      <BuildAutonomy />
      <WhyShopify />
      <FeaturedCases items={buildCases.slice(0, 2)} eyebrow="Casos BUILD" title={<>Antes y después. <span className="text-steel">Transformaciones reales.</span></>} />
      <Testimonials items={buildTestimonials} eyebrow="Clientes BUILD" title="Marcas que ya gestionan su propia tienda." />
      <BuildToScale />
      <BuildProcess />
      <BuildPricing />
      <FaqSection items={buildFaqs} name="faq-build" title="Preguntas sobre BUILD" intro="Qué incluye, cuánto cuesta, cuánto tarda y qué pasa si tu proyecto es más complejo." />
      <FinalCta eyebrow="Likin BUILD" title="¿Construimos la tuya?" text="Cuéntanos qué quieres vender. Revisaremos tu proyecto y veremos si BUILD encaja contigo." primary={{ label: site.cta.buildShort, track: "build" }} note={`Desde ${site.build.priceFrom} € + IVA · ${site.build.installments} pagos al 0 %`} />
      <StickyCta after="tiendas" until="cta-final" label="Crear mi tienda" track="build" />
    </>
  );
}
