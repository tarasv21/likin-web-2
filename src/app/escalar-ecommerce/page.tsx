import type { Metadata } from "next";
import { ScaleHero } from "@/components/scale/ScaleHero";
import { Cycle, DataSignals, Difference, Fit, Levers, Model, OtherResults, SignatureCase } from "@/components/scale/ScaleSections";
import { Results } from "@/components/home/Results";
import { Problem } from "@/components/home/Problem";
import { GrowthSystem } from "@/components/home/GrowthSystem";
import { Testimonials } from "@/components/home/Testimonials";
import { Founder } from "@/components/home/Founder";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { StickyCta } from "@/components/layout/StickyCta";
import { JsonLd } from "@/components/JsonLd";
import { scaleFaqs } from "@/data/faqs";
import { results } from "@/data/proof";
import { scaleTestimonials } from "@/data/testimonials";
import { site } from "@/data/site";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, scaleServiceJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Escalar eCommerce — LIKIN SCALE, agencia de crecimiento para tiendas que ya venden",
  description:
    "Agencia de crecimiento para eCommerce que ya facturan +10.000 €/mes. Paid Media (Meta, Google, TikTok), CRO y Retention con Klaviyo trabajando como un único sistema. Casos reales: de 16.000 € a 54.000 € en un mes, de 10.000 € a +50.000 €/mes.",
  path: site.routes.scale,
});

const LINES = [
  { n: "01", a: "Subes presupuesto.", b: "El ROAS cae." },
  { n: "02", a: "Consigues tráfico.", b: "Pero no convierte suficiente." },
  { n: "03", a: "Consigues clientes.", b: "Pero no vuelven." },
  { n: "04", a: "Tienes varios proveedores.", b: "Nadie controla el sistema completo." },
];

export default function ScalePage() {
  return (
    <>
      <JsonLd data={[scaleServiceJsonLd(), faqJsonLd(scaleFaqs), breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "SCALE · Escalar eCommerce", path: site.routes.scale }])]} />
      <ScaleHero />
      <Results lead={results[0]} others={results.slice(1)} eyebrow="Resultados reales" title={<>Antes de explicarte cómo trabajamos, <span className="text-steel">mira lo que ha pasado cuando lo hemos hecho.</span></>} />
      <Problem id="diagnostico" title="Vender no es lo mismo que escalar." lines={LINES} />
      <GrowthSystem id="sistema" cta={{ label: "Quiero escalar mi eCommerce", href: "#cta-final" }} />
      <Levers />
      <Difference />
      <SignatureCase />
      <OtherResults />
      <Cycle />
      <DataSignals />
      <Testimonials items={scaleTestimonials} eyebrow="Clientes SCALE" title="Marcas que crecen con un sistema, no con un canal." />
      <Founder compact id="taras" />
      <Fit />
      <Model />
      <FaqSection items={scaleFaqs} name="faq-scale" title="Preguntas sobre SCALE" intro="Facturación mínima, canales, inversión, permanencia y cómo medimos." />
      <FinalCta eyebrow="Likin SCALE" title={<>Ya vendes. <span className="text-steel">Ahora toca crecer mejor.</span></>} primary={{ label: "Quiero escalar mi eCommerce", track: "scale" }} note={site.scale.minRevenueLabel} />
      <StickyCta after="resultados" until="cta-final" label="Escalar mi eCommerce" track="scale" />
    </>
  );
}
