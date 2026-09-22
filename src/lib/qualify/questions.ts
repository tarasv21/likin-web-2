/**
 * QUALIFY — question definitions. Content only.
 *
 * Adding or reordering a question means editing this file and nothing else: the flow derives
 * the visible set from `when`, the UI renders by `kind`, and the engine reads answers by id.
 * Option values are stable identifiers — the CRM stores these, never the Spanish labels.
 */
import type { Answers, Question } from "./types";
import { site } from "@/data/site";

const has = (a: Answers, id: string, ...values: string[]) => {
  const v = a[id];
  if (Array.isArray(v)) return values.some((x) => v.includes(x));
  return typeof v === "string" && values.includes(v);
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Accepts a bare domain, a full URL or an @handle. Returns null when usable. */
const looksLikeLink = (raw: string) => {
  const v = raw.trim();
  if (!v) return "Necesitamos este dato para continuar.";
  if (v.startsWith("@")) return v.length >= 3 ? null : "El usuario parece incompleto.";
  const withProtocol = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProtocol);
    // A hostname with at least one dot and a plausible TLD.
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname) ? null : "Revisa la dirección: no parece una web válida.";
  } catch {
    return "Revisa la dirección: no parece una web válida.";
  }
};

const requireUrl = (v: unknown) => {
  const s = str(v);
  if (!s) return "Necesitamos la dirección de tu tienda.";
  if (s.startsWith("@")) return "Aquí necesitamos la web de la tienda, no un perfil de Instagram.";
  return looksLikeLink(s);
};

/* ── Common ──────────────────────────────────────────────────────────────── */

export const PRODUCT_CATEGORIES = [
  { value: "FASHION", label: "Moda y complementos" },
  { value: "BEAUTY", label: "Belleza y cosmética" },
  { value: "FOOD", label: "Alimentación y bebidas" },
  { value: "HOME", label: "Hogar y decoración" },
  { value: "JEWELLERY", label: "Joyería y accesorios" },
  { value: "CUSTOM", label: "Productos personalizados" },
  { value: "DIGITAL", label: "Productos digitales" },
  { value: "OTHER", label: "Otro", opensText: true },
];

const common: Question[] = [
  {
    id: "product_category",
    scope: "COMMON",
    kind: "single",
    prompt: "¿Qué tipo de productos vendes?",
    options: PRODUCT_CATEGORIES,
    textId: "product_category_other",
  },
  {
    id: "product_category_other",
    scope: "COMMON",
    kind: "text",
    prompt: "¿Cuál?",
    placeholder: "Suplementos deportivos, material de papelería…",
    when: (a) => has(a, "product_category", "OTHER"),
    validate: (v) => (str(v).length >= 2 ? null : "Cuéntanos en dos palabras qué vendes."),
  },
  {
    id: "brand_name",
    scope: "COMMON",
    kind: "text",
    prompt: "¿Cómo se llama tu marca?",
    placeholder: "Nombre de la marca",
    validate: (v) => (str(v).length >= 2 ? null : "Escribe el nombre de tu marca."),
  },
  {
    id: "brand_link",
    scope: "COMMON",
    kind: "url",
    prompt: "¿Dónde podemos verla?",
    help: "Tu web o tu Instagram. Lo miramos antes de hablar contigo.",
    placeholder: "tumarca.com o @tumarca",
    validate: (v) => looksLikeLink(str(v)),
  },
  {
    id: "business_role",
    scope: "COMMON",
    kind: "single",
    prompt: "¿Cuál es tu papel en el negocio?",
    options: [
      { value: "FOUNDER", label: "Soy fundador/a o propietario/a" },
      { value: "DECISION_MAKER", label: "Formo parte del equipo y tomo decisiones" },
      { value: "NEEDS_APPROVAL", label: "Trabajo en el equipo, pero necesito aprobación" },
      { value: "AGENCY", label: "Soy una agencia o profesional buscando servicio para un cliente" },
    ],
  },
];

/* ── BUILD ───────────────────────────────────────────────────────────────── */

const HAS_STORE = ["HAS_STORE"];

const build: Question[] = [
  {
    id: "build_situation",
    scope: "BUILD",
    kind: "single",
    prompt: "¿En qué punto estás ahora mismo?",
    options: [
      { value: "SELLS_NO_STORE", label: "Tengo marca y vendo, pero todavía no tengo tienda online" },
      { value: "HAS_STORE", label: "Ya tengo tienda online y quiero rehacerla o migrarla a Shopify" },
      { value: "NEW_BRAND", label: "Estoy preparando una marca nueva y quiero lanzarla" },
      { value: "IDEA", label: "Solo tengo una idea por ahora" },
    ],
  },
  {
    id: "build_product_defined",
    scope: "BUILD",
    kind: "single",
    prompt: "¿Tienes ya el producto o proveedor definido?",
    help: "Es lo primero que necesitamos para poder construir algo que venda.",
    options: [
      { value: "YES", label: "Sí, está definido" },
      { value: "ALMOST", label: "Estoy terminándolo" },
      { value: "NO", label: "No" },
    ],
    when: (a) => has(a, "build_situation", "IDEA"),
  },
  {
    id: "build_platform",
    scope: "BUILD",
    kind: "single",
    prompt: "¿Dónde vendes actualmente?",
    options: [
      { value: "SHOPIFY", label: "Shopify" },
      { value: "WOOCOMMERCE", label: "WooCommerce" },
      { value: "PRESTASHOP", label: "PrestaShop" },
      { value: "WIX", label: "Wix" },
      { value: "ETSY", label: "Etsy" },
      { value: "MARKETPLACE", label: "Marketplace" },
      { value: "OTHER", label: "Otra" },
    ],
    when: (a) => has(a, "build_situation", ...HAS_STORE),
  },
  {
    id: "build_store_url",
    scope: "BUILD",
    kind: "url",
    prompt: "¿Cuál es la URL de tu tienda?",
    placeholder: "tutienda.com",
    when: (a) => has(a, "build_situation", ...HAS_STORE),
    validate: requireUrl,
  },
  {
    id: "product_count",
    scope: "BUILD",
    kind: "single",
    prompt: "¿Cuántos productos necesitas subir al empezar?",
    options: [
      { value: "1_10", label: "Entre 1 y 10" },
      { value: "11_30", label: "Entre 11 y 30" },
      { value: "31_50", label: "Entre 31 y 50" },
      { value: "51_100", label: "Entre 51 y 100" },
      { value: "100_PLUS", label: "Más de 100" },
    ],
  },
  {
    id: "build_complexity",
    scope: "BUILD",
    kind: "multi",
    prompt: "¿Tu tienda necesita algo fuera de lo estándar?",
    help: "Marca todo lo que aplique. Si no lo tienes claro, dínoslo también.",
    options: [
      { value: "STANDARD", label: "No, una tienda eCommerce estándar", exclusive: true },
      { value: "CONFIGURABLE", label: "Productos personalizados o configurables" },
      { value: "SUBSCRIPTIONS", label: "Suscripciones" },
      { value: "CUSTOMER_AREA", label: "Área privada para clientes" },
      { value: "B2B", label: "Venta B2B o mayorista" },
      { value: "ERP", label: "Integración con ERP" },
      { value: "MARKETPLACE", label: "Marketplace con varios vendedores" },
      { value: "ADVANCED_CONFIGURATOR", label: "Configuradores avanzados" },
      { value: "SPECIAL_INTEGRATIONS", label: "Integraciones especiales" },
      { value: "UNSURE", label: "No estoy seguro/a", exclusive: true },
    ],
  },
  {
    id: "build_readiness",
    scope: "BUILD",
    kind: "multi",
    prompt: "¿Qué tienes preparado ya?",
    options: [
      { value: "BRAND", label: "Logo e identidad visual" },
      { value: "PHOTOS", label: "Fotografías de producto" },
      { value: "COPY", label: "Descripciones y textos" },
      { value: "CATALOG", label: "Productos y precios definidos" },
      { value: "DOMAIN", label: "Dominio" },
      { value: "NOTHING", label: "Nada de esto todavía", exclusive: true },
    ],
  },
  {
    id: "build_budget",
    scope: "BUILD",
    kind: "single",
    prompt: "¿Esta inversión encaja con lo que tenías previsto?",
    note: `BUILD parte desde ${site.build.priceFrom} € + IVA.`,
    options: [
      { value: "YES", label: "Sí, puedo empezar si el proyecto encaja" },
      { value: "INSTALLMENTS", label: "Sí, pero prefiero pagarlo en 3 cuotas" },
      { value: "HIGHER", label: "Necesito un presupuesto superior porque mi proyecto es más complejo" },
      { value: "BELOW", label: "No, buscaba una inversión inferior" },
    ],
  },
  {
    id: "timing",
    scope: "BUILD",
    kind: "single",
    prompt: "¿Cuándo te gustaría empezar?",
    options: [
      { value: "NOW", label: "Cuanto antes" },
      { value: "30_DAYS", label: "En las próximas 2 a 4 semanas" },
      { value: "90_DAYS", label: "En 1 a 3 meses" },
      { value: "EXPLORING", label: "Más adelante, estoy valorando opciones" },
    ],
  },
  {
    id: "build_collaboration",
    scope: "BUILD",
    kind: "single",
    prompt: "¿Podrás darnos materiales y feedback con agilidad?",
    help: "Para construir la tienda necesitaremos cosas por tu parte. Saberlo nos ayuda a planificar.",
    options: [
      { value: "YES", label: "Sí" },
      { value: "WITH_HELP", label: "Sí, aunque necesitaré algo de ayuda" },
      { value: "UNSURE", label: "No estoy seguro/a" },
      { value: "FULL_SERVICE", label: "Prefiero que Likin se encargue de todo" },
    ],
  },
];

/* ── SCALE ───────────────────────────────────────────────────────────────── */

const scale: Question[] = [
  {
    id: "monthly_revenue",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Cuánto factura tu eCommerce al mes?",
    options: [
      { value: "NONE", label: "Todavía no vendo" },
      { value: "LT_5K", label: "Menos de 5.000 €" },
      { value: "5K_10K", label: "Entre 5.000 y 10.000 €" },
      { value: "10K_25K", label: "Entre 10.000 y 25.000 €" },
      { value: "25K_50K", label: "Entre 25.000 y 50.000 €" },
      { value: "50K_100K", label: "Entre 50.000 y 100.000 €" },
      { value: "GT_100K", label: "Más de 100.000 €" },
    ],
  },
  {
    id: "platform",
    scope: "SCALE",
    kind: "single",
    prompt: "¿En qué plataforma está tu eCommerce?",
    options: [
      { value: "SHOPIFY", label: "Shopify" },
      { value: "WOOCOMMERCE", label: "WooCommerce" },
      { value: "PRESTASHOP", label: "PrestaShop" },
      { value: "OTHER", label: "Otra" },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "store_url",
    scope: "SCALE",
    kind: "url",
    prompt: "¿Cuál es la URL de tu tienda?",
    help: "La miramos antes de la llamada. Sin esto no podemos prepararla.",
    placeholder: "tutienda.com",
    when: (a) => !has(a, "monthly_revenue", "NONE"),
    validate: requireUrl,
  },
  {
    id: "main_bottlenecks",
    scope: "SCALE",
    kind: "multi",
    max: 2,
    prompt: "¿Cuál es vuestro principal problema ahora mismo?",
    help: "Elige como máximo dos.",
    options: [
      { value: "MORE_CUSTOMERS", label: "Necesitamos conseguir más clientes" },
      { value: "ADS_NOT_SCALING", label: "Invertimos en Ads pero no conseguimos escalar" },
      { value: "LOW_CONVERSION", label: "Tenemos tráfico pero la tienda convierte poco" },
      { value: "DISCOUNT_DEPENDENT", label: "Dependemos demasiado de descuentos y promociones" },
      { value: "NO_REPEAT", label: "Los clientes compran una vez y no vuelven" },
      { value: "LOW_AOV", label: "El ticket medio es demasiado bajo" },
      { value: "UNKNOWN_BLOCKER", label: "No sabemos qué está frenando el crecimiento" },
      { value: "NO_TEAM_CAPACITY", label: "El equipo no tiene capacidad para gestionar todo" },
      { value: "OTHER", label: "Otro", opensText: true },
    ],
    textId: "main_bottlenecks_other",
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "main_bottlenecks_other",
    scope: "SCALE",
    kind: "text",
    prompt: "¿Cuál?",
    placeholder: "Descríbelo en una línea",
    when: (a) => has(a, "main_bottlenecks", "OTHER") && !has(a, "monthly_revenue", "NONE"),
    validate: (v) => (str(v).length >= 3 ? null : "Descríbelo en una línea."),
  },
  {
    id: "paid_media",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Estáis invirtiendo en publicidad?",
    options: [
      { value: "YES", label: "Sí" },
      { value: "PAST", label: "Lo hemos hecho antes" },
      { value: "NO", label: "No" },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "monthly_ad_spend",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Cuánto invertís al mes, aproximadamente?",
    options: [
      { value: "LT_1K", label: "Menos de 1.000 €" },
      { value: "1K_3K", label: "Entre 1.000 y 3.000 €" },
      { value: "3K_10K", label: "Entre 3.000 y 10.000 €" },
      { value: "10K_30K", label: "Entre 10.000 y 30.000 €" },
      { value: "GT_30K", label: "Más de 30.000 €" },
    ],
    when: (a) => has(a, "paid_media", "YES"),
  },
  {
    id: "ads_managed_by",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Quién gestiona las campañas?",
    options: [
      { value: "INTERNAL", label: "Nosotros internamente" },
      { value: "FREELANCER", label: "Un freelancer" },
      { value: "AGENCY", label: "Una agencia" },
      { value: "NOBODY", label: "Nadie, están pausadas" },
    ],
    when: (a) => has(a, "paid_media", "YES"),
  },
  {
    id: "cac_clarity",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Sabéis cuánto podéis pagar por cliente de forma rentable?",
    options: [
      { value: "YES", label: "Sí, tenemos un CAC o CPA objetivo" },
      { value: "ROUGHLY", label: "Aproximadamente" },
      { value: "NO", label: "No" },
      { value: "UNKNOWN_TERM", label: "No sé qué significa" },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "conversion_rate",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Conoces la tasa de conversión de la tienda?",
    options: [
      { value: "LT_1", label: "Menos del 1 %" },
      { value: "1_2", label: "Entre el 1 y el 2 %" },
      { value: "2_3", label: "Entre el 2 y el 3 %" },
      { value: "GT_3", label: "Más del 3 %" },
      { value: "UNKNOWN", label: "No lo sé" },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "retention",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Trabajáis email marketing y retención?",
    options: [
      { value: "ACTIVE", label: "Sí, tenemos estrategia activa" },
      { value: "SOME", label: "Tenemos algunos flows o campañas" },
      { value: "BARELY", label: "Muy poco" },
      { value: "NO", label: "No" },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "email_tool",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Qué herramienta utilizáis?",
    options: [
      { value: "KLAVIYO", label: "Klaviyo" },
      { value: "SHOPIFY_EMAIL", label: "Shopify Email" },
      { value: "MAILCHIMP", label: "Mailchimp" },
      { value: "OTHER", label: "Otra" },
      { value: "UNKNOWN", label: "No lo sé" },
    ],
    when: (a) => has(a, "retention", "ACTIVE", "SOME", "BARELY"),
  },
  {
    id: "growth_team",
    scope: "SCALE",
    kind: "multi",
    prompt: "¿Quién trabaja hoy en el crecimiento del eCommerce?",
    options: [
      { value: "FOUNDER", label: "El fundador o fundadora" },
      { value: "INTERNAL_MARKETING", label: "Equipo interno de marketing" },
      { value: "MEDIA_BUYER", label: "Un media buyer" },
      { value: "AGENCY", label: "Una agencia" },
      { value: "FREELANCERS", label: "Freelancers" },
      { value: "NOBODY", label: "Nadie de forma especializada", exclusive: true },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "services_interested",
    scope: "SCALE",
    kind: "multi",
    max: 2,
    prompt: "¿Qué esperas de Likin?",
    help: "Elige como máximo dos.",
    options: [
      { value: "PAID_MEDIA", label: "Gestionar y escalar Paid Media" },
      { value: "CRO", label: "Mejorar la conversión" },
      { value: "RETENTION", label: "Mejorar la recurrencia y el email marketing" },
      { value: "DIAGNOSIS", label: "Encontrar los cuellos de botella del negocio" },
      { value: "FULL_GROWTH", label: "Delegar el crecimiento completo del eCommerce" },
      { value: "UNDECIDED", label: "Necesito ayuda para decidirlo", exclusive: true },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "investment_capacity",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Cuánto estarías dispuesto/a a invertir al mes para conseguir ese crecimiento?",
    help: "Nos ayuda a saber qué modelo de colaboración tiene sentido. No incluye la inversión publicitaria.",
    options: [
      { value: "LT_1K", label: "Menos de 1.000 €/mes" },
      { value: "1K_1_5K", label: "Entre 1.000 y 1.500 €/mes" },
      { value: "1_5K_2_5K", label: "Entre 1.500 y 2.500 €/mes" },
      { value: "2_5K_4K", label: "Entre 2.500 y 4.000 €/mes" },
      { value: "GT_4K", label: "Más de 4.000 €/mes" },
      { value: "FIXED_VARIABLE", label: "Prefiero un modelo fijo más variable según resultados" },
      { value: "VARIABLE_ONLY", label: "Solo me interesa trabajar a variable según resultados" },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "variable_model_metric",
    scope: "SCALE",
    kind: "single",
    prompt: "¿Sobre qué resultado tendría sentido vincular la parte variable?",
    options: [
      { value: "REVENUE_GROWTH", label: "Incremento de facturación" },
      { value: "PROFIT", label: "Beneficio o rentabilidad" },
      { value: "PAID_MEDIA_SALES", label: "Ventas atribuibles a Paid Media" },
      { value: "NEW_CUSTOMERS", label: "Nuevos clientes adquiridos" },
      { value: "PROPOSE", label: "No lo tengo claro, prefiero que lo propongáis" },
    ],
    when: (a) => has(a, "investment_capacity", "FIXED_VARIABLE", "VARIABLE_ONLY"),
  },
  {
    id: "timing",
    scope: "SCALE",
    kind: "single",
    prompt: "Si vemos que hay encaje, ¿cuándo os gustaría empezar?",
    options: [
      { value: "NOW", label: "Inmediatamente" },
      { value: "30_DAYS", label: "Durante este mes" },
      { value: "90_DAYS", label: "En los próximos 1 a 3 meses" },
      { value: "EXPLORING", label: "Solo estamos explorando opciones" },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
  {
    id: "change_capacity",
    scope: "SCALE",
    kind: "single",
    prompt: "Si detectamos cambios necesarios en tienda, creatividades u oferta, ¿podéis implementarlos?",
    options: [
      { value: "YES", label: "Sí, queremos hacer los cambios necesarios" },
      { value: "WITH_LIKIN", label: "Sí, pero necesitaremos que Likin se encargue de gran parte" },
      { value: "DEPENDS", label: "Dependerá del cambio" },
      { value: "ADS_ONLY", label: "Buscamos únicamente que alguien gestione Ads" },
    ],
    when: (a) => !has(a, "monthly_revenue", "NONE"),
  },
];

/** Order matters: this is the order the user sees, filtered by `when`. */
export const QUESTIONS: Question[] = [...build, ...scale, ...common];

const BUILD_ORDER = [
  "build_situation",
  "build_product_defined",
  "build_platform",
  "build_store_url",
  "product_category",
  "product_category_other",
  "brand_name",
  "brand_link",
  "product_count",
  "build_complexity",
  "build_readiness",
  "build_budget",
  "timing",
  "build_collaboration",
  "business_role",
];

const SCALE_ORDER = [
  "monthly_revenue",
  "platform",
  "store_url",
  "product_category",
  "product_category_other",
  "brand_name",
  "brand_link",
  "main_bottlenecks",
  "main_bottlenecks_other",
  "paid_media",
  "monthly_ad_spend",
  "ads_managed_by",
  "cac_clarity",
  "conversion_rate",
  "retention",
  "email_tool",
  "growth_team",
  "services_interested",
  "investment_capacity",
  "variable_model_metric",
  "timing",
  "change_capacity",
  "business_role",
];

const byId = new Map(QUESTIONS.map((q) => [`${q.scope}:${q.id}`, q]));

/** The full ordered question list for a service, before `when` filtering. */
export function questionsFor(service: "BUILD" | "SCALE"): Question[] {
  const order = service === "BUILD" ? BUILD_ORDER : SCALE_ORDER;
  return order.map((id) => byId.get(`${service}:${id}`) ?? byId.get(`COMMON:${id}`)).filter((q): q is Question => Boolean(q));
}

/** SCALE and BUILD both define `timing`; resolve against the right scope. */
export function findQuestion(service: "BUILD" | "SCALE", id: string) {
  return byId.get(`${service}:${id}`) ?? byId.get(`COMMON:${id}`);
}
