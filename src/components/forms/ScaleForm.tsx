"use client";

import { site } from "@/data/site";
import { MultiStep, Received, SubmitAction, submitLead, type Answers, type Step } from "./MultiStep";

/** SCALE application. Below +10k €/mes routes to BUILD. */
const STEPS: Step[] = [
  {
    id: "business",
    kind: "fields",
    label: "Tu negocio",
    question: "Tu negocio.",
    fields: [
      { name: "brand", label: "Marca", required: true, placeholder: "Nombre de la marca", autoComplete: "organization" },
      { name: "website", label: "Web", type: "url", required: true, placeholder: "tumarca.com" },
      { name: "sector", label: "¿Qué vendes?", required: true, placeholder: "Producto y público" },
    ],
  },
  {
    id: "revenue",
    kind: "single",
    label: "Tus números",
    question: "¿Cuánto factura tu eCommerce al mes?",
    hint: "SCALE está diseñado para eCommerce que ya facturan más de 10.000 € al mes.",
    options: [
      { value: "lt10k", label: "Menos de 10.000 €" },
      { value: "10-30k", label: "Entre 10.000 € y 30.000 €" },
      { value: "30-100k", label: "Entre 30.000 € y 100.000 €" },
      { value: "gt100k", label: "Más de 100.000 €" },
    ],
  },
  {
    id: "adspend",
    kind: "single",
    label: "Tus números",
    question: "¿Cuánto inviertes en publicidad al mes?",
    options: [
      { value: "0", label: "Nada todavía" },
      { value: "lt2k", label: "Menos de 2.000 €" },
      { value: "2-10k", label: "Entre 2.000 € y 10.000 €" },
      { value: "gt10k", label: "Más de 10.000 €" },
    ],
  },
  {
    id: "bottleneck",
    kind: "multi",
    label: "Tu freno",
    question: "¿Qué crees que está frenando el crecimiento?",
    options: [
      { value: "roas", label: "Subo inversión y la rentabilidad cae" },
      { value: "cvr", label: "Tengo tráfico pero no convierte" },
      { value: "retention", label: "Los clientes compran una sola vez" },
      { value: "silos", label: "Varios proveedores y nadie mira el negocio completo" },
      { value: "founder", label: "Yo sigo en medio de todo" },
      { value: "unknown", label: "No lo tengo claro" },
    ],
  },
  {
    id: "team",
    kind: "single",
    label: "Tu equipo",
    question: "¿Quién gestiona hoy el crecimiento?",
    options: [
      { value: "me", label: "Yo mismo/a" },
      { value: "freelancers", label: "Freelancers" },
      { value: "agency", label: "Una o varias agencias" },
      { value: "internal", label: "Equipo interno" },
    ],
  },
  {
    id: "contact",
    kind: "fields",
    label: "Encaje",
    question: "¿Con quién hablamos?",
    fields: [
      { name: "name", label: "Nombre", required: true, autoComplete: "name", placeholder: "Tu nombre y cargo" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", placeholder: "tu@email.com" },
      { name: "phone", label: "Teléfono (opcional)", type: "tel", autoComplete: "tel", placeholder: "+34 …" },
    ],
  },
];

export function ScaleForm({ source }: { source: string }) {
  return <MultiStep id="lead-scale" intro="Seis preguntas cortas. Necesitamos conocer algunos datos de tu negocio antes de decidir si SCALE encaja." steps={STEPS} submitLabel="Enviar aplicación" renderResult={(answers, hp) => <ScaleResult answers={answers} honeypot={hp} source={source} />} />;
}

function ScaleResult({ answers, honeypot, source }: { answers: Answers; honeypot: string; source: string }) {
  const below = answers.revenue === "lt10k";
  const payload = { kind: "scale" as const, name: String(answers.name), email: String(answers.email), brand: String(answers.brand ?? ""), phone: String(answers.phone ?? ""), answers, source };

  if (below) {
    return (
      <div>
        <p className="text-label text-steel">Encaje</p>
        <h3 className="text-h3 mt-2">Todavía no estás en el punto de SCALE.</h3>
        <p className="mt-4 max-w-[56ch] text-body text-steel">Por debajo de 10.000 €/mes normalmente tiene más sentido construir una buena base y aprender a gestionar el negocio antes de delegar el crecimiento. BUILD está pensado exactamente para eso.</p>
        <div className="mt-8">
          <SubmitAction label="Guardar mis datos y ver BUILD" onSubmit={() => submitLead({ ...payload, fit: "below-threshold" }, honeypot)} success={<Received title="Datos guardados." text="Cuando superes los 10.000 €/mes, SCALE estará aquí. Mientras tanto, mira lo que hace BUILD." cta={{ label: "Descubre BUILD", href: site.routes.build }} />} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-label text-teal">Encaje</p>
      <h3 className="text-h3 mt-2">Último paso.</h3>
      <p className="mt-4 max-w-[56ch] text-body text-steel">Revisaremos tu negocio y, si creemos que podemos aportar valor, el siguiente paso será conocernos.</p>
      <div className="mt-8">
        <SubmitAction label="Aplicar a SCALE" onSubmit={() => submitLead({ ...payload, fit: "fit" }, honeypot)} success={<Received title="Aplicación recibida." text="Revisaremos tu negocio y te escribiremos al email que nos has dejado." />} />
      </div>
    </div>
  );
}
