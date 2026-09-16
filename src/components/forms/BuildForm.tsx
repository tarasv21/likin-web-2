"use client";

import { useMemo } from "react";
import { site } from "@/data/site";
import { formatEUR } from "@/lib/utils";
import { MultiStep, Received, SubmitAction, submitLead, type Answers, type Step } from "./MultiStep";

/**
 * BUILD pre-qualification. Out-of-scope signals (marketplace, headless, ERP, configurator,
 * B2B, integrations, multimarket, large catalogue) route to a manual review instead of forcing
 * the project into BUILD. Checkout and payment come later, as a separate project.
 */
const STEPS: Step[] = [
  {
    id: "project",
    kind: "single",
    label: "Tu proyecto",
    question: "¿Qué quieres construir?",
    options: [
      { value: "new", label: "Una tienda nueva desde cero", hint: "Todavía no vendo online o vendo por Instagram/WhatsApp." },
      { value: "migrate", label: "Migrar mi tienda actual a Shopify", hint: "Estoy en WooCommerce, Wix, Prestashop u otra plataforma." },
      { value: "rebuild", label: "Rehacer mi Shopify", hint: "Ya tengo Shopify, pero sé que podría vender mucho mejor." },
    ],
  },
  {
    id: "platform",
    kind: "single",
    label: "Plataforma actual",
    question: "¿En qué plataforma está tu tienda ahora?",
    when: (a) => a.project === "migrate",
    options: [
      { value: "woocommerce", label: "WooCommerce / WordPress" },
      { value: "wix", label: "Wix / Squarespace" },
      { value: "prestashop", label: "Prestashop / Magento" },
      { value: "other", label: "Otra" },
    ],
  },
  {
    id: "products",
    kind: "single",
    label: "Catálogo",
    question: "¿Cuántos productos tendrá la tienda?",
    hint: `BUILD incluye hasta ${site.build.productsIncluded} productos. Puedes añadir packs de ${site.build.extraPackSize}.`,
    options: [
      { value: "lte30", label: "Hasta 30" },
      { value: "31-60", label: "Entre 31 y 60" },
      { value: "61-150", label: "Entre 61 y 150" },
      { value: "gt150", label: "Más de 150" },
    ],
  },
  {
    id: "needs",
    kind: "multi",
    label: "Necesidades",
    question: "¿Necesitas algo de esto?",
    hint: "Marca todo lo que aplique. Si nada aplica, elige la última opción.",
    options: [
      { value: "marketplace", label: "Marketplace (varios vendedores)" },
      { value: "headless", label: "Headless / frontend a medida" },
      { value: "erp", label: "Integración con ERP" },
      { value: "configurator", label: "Configurador de producto avanzado" },
      { value: "b2b", label: "B2B complejo" },
      { value: "multimarket", label: "Varios mercados / idiomas / monedas" },
      { value: "none", label: "Nada de esto", hint: "Una tienda Shopify estándar, bien hecha." },
    ],
  },
  {
    id: "contact",
    kind: "fields",
    label: "Contacto",
    question: "Cuéntanos quién eres.",
    hint: "Revisaremos tu proyecto y te diremos si BUILD es el camino adecuado.",
    fields: [
      { name: "name", label: "Nombre", required: true, autoComplete: "name", placeholder: "Tu nombre" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", placeholder: "tu@email.com" },
      { name: "brand", label: "Marca o web", placeholder: "Nombre de la marca o URL actual", autoComplete: "organization" },
      { name: "sells", label: "¿Qué vendes?", type: "textarea", placeholder: "Producto, público y en qué punto estás.", required: true },
    ],
  },
];

const OUT_OF_SCOPE: Record<string, string> = {
  marketplace: "marketplace",
  headless: "headless",
  erp: "integración con ERP",
  configurator: "configurador avanzado",
  b2b: "B2B complejo",
  multimarket: "varios mercados",
};

function computeFit(a: Answers) {
  const needs = (a.needs as string[] | undefined) ?? [];
  const reasons = needs.filter((n) => n in OUT_OF_SCOPE).map((n) => OUT_OF_SCOPE[n]);
  if (a.products === "gt150") reasons.push("catálogo de más de 150 productos");
  if (a.project === "migrate" && a.platform === "prestashop") reasons.push("migración desde Prestashop/Magento");
  return { fit: reasons.length === 0, reasons };
}

export function BuildForm({ source }: { source: string }) {
  return <MultiStep id="lead-build" intro="Cuatro preguntas. Si tu proyecto encaja, te escribimos para arrancar. Si necesita algo más, te lo decimos antes de que pagues nada." steps={STEPS} submitLabel="Ver si encaja" renderResult={(answers, hp) => <BuildResult answers={answers} honeypot={hp} source={source} />} />;
}

function BuildResult({ answers, honeypot, source }: { answers: Answers; honeypot: string; source: string }) {
  const { fit, reasons } = useMemo(() => computeFit(answers), [answers]);
  const base = { kind: "build" as const, name: String(answers.name), email: String(answers.email), brand: String(answers.brand ?? ""), answers, source };
  const b = site.build;

  if (!fit) {
    return (
      <div>
        <p className="text-label text-steel">Encaje</p>
        <h3 className="text-h3 mt-2">Tu proyecto necesita algo más que BUILD.</h3>
        <p className="mt-4 max-w-[56ch] text-body text-steel">Por lo que nos cuentas ({reasons.join(", ")}), necesitamos estudiar el proyecto antes de presupuestarlo. No lo meteremos a la fuerza en BUILD.</p>
        <div className="mt-8">
          <SubmitAction label="Hablemos de tu proyecto" onSubmit={() => submitLead({ ...base, fit: "custom" }, honeypot)} success={<Received title="Hemos recibido tu proyecto." text="Lo revisaremos y te escribiremos para proponerte una solución personalizada antes de contratar nada." />} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-label text-teal">Tu proyecto encaja con BUILD.</p>
      <h3 className="text-h3 mt-2">Último paso.</h3>
      <dl className="mt-6 divide-y divide-hairline border-y border-hairline text-small">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-steel">LIKIN BUILD</dt>
          <dd className="tnum text-cloud">
            {formatEUR(b.priceFrom)} <span className="text-steel">+ IVA</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-steel">O en {b.installments} pagos al 0 %</dt>
          <dd className="tnum text-cloud">{b.installmentAmount} € × 3</dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-steel">Incluye</dt>
          <dd className="text-right text-cloud">Shopify · Diseño · CRO · Tracking · Formación</dd>
        </div>
      </dl>
      <p className="mt-4 text-small text-steel">Te escribiremos para confirmar el alcance, resolver dudas y formalizar el pago. Sin sorpresas.</p>
      <div className="mt-6">
        <SubmitAction label="Quiero crear mi tienda" onSubmit={() => submitLead({ ...base, fit: "fit" }, honeypot)} success={<Received title="Solicitud recibida." text="Te escribiremos en breve al email que nos has dejado para arrancar tu BUILD." />} />
      </div>
    </div>
  );
}
