import manifest from "./asset-manifest.json";

/**
 * Case studies. Every sentence and every number comes from "Descripcion casos exito.pdf".
 * Where the document gives no result, `metrics` is empty and the UI must not show one.
 */

export type Service = "SHOPIFY" | "MIGRATION" | "CRO" | "PAID MEDIA" | "RETENTION" | "TRAINING" | "SEO" | "SUBSCRIPTION" | "AUTOMATION";
export type Track = "build" | "scale";
export type Metric = { value: string; label: string; note?: string };

export type CaseStudy = {
  slug: string;
  name: string;
  clientId: string;
  url: string;
  sector: string;
  tracks: Track[];
  services: Service[];
  /** One line for cards and OG descriptions. */
  headline: string;
  /** Short summary for lists and AI readability. */
  summary: string;
  /** Transformation line for cards (before → after) or the change when there is no figure. */
  change: string;
  situation?: string;
  problem?: string;
  intervention?: string;
  result?: string;
  next?: string;
  metrics: Metric[];
  person?: string;
  store?: { fold: string; fold800: string; tall: string; long: string; foldW: number; foldH: number; tallW: number; tallH: number; longW: number; longH: number };
  video?: string;
  featured?: number;
  buildFeatured?: number;
  scaleFeatured?: number;
};

const storeAsset = (id: string) => {
  const s = manifest.stores.find((x) => x.name === id);
  if (!s) return undefined;
  return {
    fold: `/stores/${id}-fold.webp`,
    fold800: `/stores/${id}-fold-800.webp`,
    tall: `/stores/${id}-tall.webp`,
    long: `/stores/${id}-long.webp`,
    foldW: s.fold.width,
    foldH: s.fold.height,
    tallW: s.tall.width,
    tallH: s.tall.height,
    longW: s.long.width,
    longH: s.long.height,
  };
};

export const cases: CaseStudy[] = [
  {
    slug: "bordando-hilos",
    name: "Bordando Hilos",
    clientId: "bordando-hilos",
    url: "https://www.bordandohilos.com/",
    sector: "Ropa personalizada con bordados",
    tracks: ["build", "scale"],
    services: ["SHOPIFY", "PAID MEDIA", "RETENTION"],
    headline: "De 16.000 € a 54.000 € en un mes.",
    change: "16.000 € → 54.000 €",
    summary:
      "Tienda creada por Likin, cerca de dos años trabajando juntos. Estaban de media en 5.000–7.000 € al mes y su mejor mes antes de Likin fue noviembre de 2023 con 16.000 €. En noviembre de 2024 facturaron más de 30.000 € en cinco días de Black Friday y Cyber Monday y cerraron el mes en 54.000 €.",
    situation: "Bordando Hilos vendía ropa personalizada con bordados con una media de 5.000–7.000 € al mes. Su mejor mes fue noviembre de 2023, antes de trabajar con nosotros: 16.000 € en todo el mes.",
    problem: "Un producto con demanda real y una marca con carisma, pero sin una tienda pensada para vender ni una estrategia de adquisición capaz de escalar la demanda en los momentos clave del año.",
    intervention:
      "Creamos la tienda en Shopify y asumimos la estrategia publicitaria. En octubre de 2024 hicieron un nuevo récord de unos 19.000 €. Para noviembre preparamos un Black Friday con gran inversión publicitaria acompañada de estrategia, y mantuvimos la intensidad en diciembre.",
    result:
      "Más de 30.000 € en cinco días de Black Friday y Cyber Monday. Noviembre cerró en 54.000 € y diciembre en unos 50.000 €. A finales de enero bajamos la intensidad de la publicidad porque no daban abasto, y en febrero cerraron por sobredemanda hasta finales de marzo: con artículos personalizados es muy complicado gestionar esa sobredemanda sin preparación.",
    metrics: [
      { value: "16.000 €", label: "mejor mes antes de Likin", note: "Noviembre 2023" },
      { value: "54.000 €", label: "noviembre 2024" },
      { value: "+30.000 €", label: "en 5 días de Black Friday y Cyber Monday" },
    ],
    store: storeAsset("bordando-hilos"),
    video: "bordando-hilos",
    featured: 2,
    scaleFeatured: 1,
  },
  {
    slug: "tartas-bastante-majas",
    name: "Tartas Bastante Majas",
    clientId: "tartas-bastante-majas",
    url: "https://tartasbastantemajas.com/",
    sector: "Tartas artesanales",
    tracks: ["scale"],
    services: ["CRO", "RETENTION", "PAID MEDIA"],
    headline: "De una comunidad enorme a un eCommerce que la convierte.",
    change: "~10.000 € → +50.000 €/mes",
    summary:
      "Marca de tartas artesanales con más de 200.000 seguidores en Instagram que no aprovechaba su demanda orgánica en la tienda online. Optimizamos la conversión de la web, implementamos email marketing completo y abrimos Meta Ads. En pocos meses pasó de unos 10.000 € mensuales a superar de forma recurrente los 50.000 € al mes.",
    situation: "Tartas Bastante Majas tiene una comunidad muy potente: más de 200.000 seguidores en Instagram y una demanda orgánica muy fiel.",
    problem: "Toda esa demanda no se estaba convirtiendo en ventas a través de la tienda online. Había comunidad, pero no un sistema que la aprovechara.",
    intervention:
      "Empezamos optimizando distintas partes de la web para mejorar la experiencia de compra y la conversión. Implementamos una estrategia completa de email marketing, enfocada en recuperar ventas y aumentar la recurrencia, y empezamos a trabajar Meta Ads para llegar a nuevos públicos de forma rentable.",
    result:
      "Los resultados llegaron rápido. En pocos meses pasamos de una facturación aproximada de 10.000 € mensuales a superar de forma recurrente los 50.000 € al mes, incluso en meses más complicados a nivel de ventas.",
    next: "Seguimos escalando la marca combinando CRO, Paid Media y Email Marketing. De cara a Black Friday, el siguiente objetivo es superar los 100.000 € de facturación mensual.",
    metrics: [
      { value: "~10.000 €", label: "facturación mensual, antes" },
      { value: "+50.000 €", label: "facturación mensual recurrente" },
      { value: "+200K", label: "seguidores en Instagram" },
    ],
    person: "Gisela",
    store: storeAsset("tartas"),
    video: "tartas-bastante-majas",
    featured: 1,
    scaleFeatured: 2,
  },
  {
    slug: "mua-kit",
    name: "Müa Kit",
    clientId: "mua-kit",
    url: "https://muakit.com/",
    sector: "Kits DIY de joyería personalizada",
    tracks: ["build", "scale"],
    services: ["SHOPIFY", "CRO", "PAID MEDIA", "RETENTION"],
    headline: "De Etsy a un eCommerce propio preparado para crecer.",
    change: "~500 € → +10.000 €/mes",
    summary:
      "Müa Kit vende kits DIY de resina epoxi para encapsular recuerdos en joyas propias. Vendía casi todo por Etsy, alrededor de 500 € al mes, con una gestión manual del negocio. Migramos todo a Shopify, automatizamos la personalización y combinamos CRO, Meta Ads y Email Marketing hasta superar los 10.000 € al mes.",
    situation:
      "Cristina vendía prácticamente todo a través de Etsy, facturando alrededor de 500 € mensuales. Gran parte del negocio se gestionaba manualmente: control de stock, preguntas de clientes por Instagram, personalizaciones y gestión de pedidos.",
    problem: "Dependencia de un marketplace, gestión manual y un producto con mil usos distintos (mascotas, maternidad, parejas, viajes, duelo) vendido desde una sola página genérica.",
    intervention:
      "Migramos el negocio a Shopify con una tienda propia donde Cristina controla el stock y automatiza el proceso de compra: los clientes escogen y personalizan sus kits desde la web sin contactar antes. Creamos landing pages específicas por tipo de cliente y campañas de Meta Ads muy segmentadas que envían cada público a la página construida alrededor de lo que le interesa.",
    result: "Combinando una tienda Shopify optimizada, CRO, Meta Ads y Email Marketing, pasamos de aproximadamente 500 € mensuales a superar los 10.000 € al mes.",
    next: "Seguimos trabajando en el crecimiento de la marca y preparando su primer Black Friday desde Shopify, con el objetivo de superar los 50.000 € de facturación mensual.",
    metrics: [
      { value: "~500 €", label: "facturación mensual en Etsy, antes" },
      { value: "+10.000 €", label: "facturación mensual, ahora" },
    ],
    person: "Cristina",
    store: storeAsset("mua"),
    video: "mua-kit",
    featured: 3,
    buildFeatured: 3,
    scaleFeatured: 3,
  },
  {
    slug: "pipiola-chic",
    name: "Pipiola Chic",
    clientId: "pipiola",
    url: "https://pipiolachic.es/",
    sector: "Moda femenina",
    tracks: ["build"],
    services: ["MIGRATION", "SHOPIFY", "CRO", "TRAINING"],
    headline: "De WooCommerce a Shopify. Y de depender de una agencia a gestionarla ella misma.",
    change: "~2.000 € → +10.000 €/mes",
    summary:
      "Pipiola Chic llegó con una tienda antigua en WooCommerce, lenta y difícil de gestionar, dependiendo de una agencia externa para cualquier cambio. Migramos y reconstruimos la tienda en Shopify enfocada a conversión y enseñamos a Esther a gestionarla. Pasó de unos 2.000 € mensuales a superar de forma recurrente los 10.000 € al mes, prácticamente sin inversión en publicidad.",
    situation: "Una tienda online antigua creada en WooCommerce: lenta, poco optimizada y complicada de gestionar.",
    problem: "Esther dependía de una agencia externa prácticamente cada vez que quería realizar algún cambio. Mantener la tienda era más caro, más lento y, sobre todo, no tenía autonomía para gestionar su propio negocio.",
    intervention:
      "Migramos toda la tienda de WooCommerce a Shopify y la reconstruimos desde cero con una plantilla premium: una web más moderna, rápida y enfocada a la conversión. Además, enseñamos a Esther a gestionarla por sí misma: productos, contenidos y las tareas habituales del eCommerce sin depender de desarrolladores ni agencias.",
    result:
      "La marca pasó de facturar aproximadamente 2.000 € mensuales a superar de forma recurrente los 10.000 € al mes, prácticamente sin inversión en publicidad. Sus clientas habituales recibieron muy bien la nueva tienda, llegaron muchas compradoras nuevas y aumentó considerablemente la recurrencia.",
    metrics: [
      { value: "~2.000 €", label: "facturación mensual, antes" },
      { value: "+10.000 €", label: "facturación mensual recurrente", note: "casi sin inversión en publicidad" },
    ],
    person: "Esther",
    store: storeAsset("pipiola"),
    video: "pipiola-chic",
    featured: 4,
    buildFeatured: 1,
  },
  {
    slug: "fluxis",
    name: "Fluxis",
    clientId: "fluxis",
    url: "https://fluxis.es/",
    sector: "Ropa personalizada con DTF",
    tracks: ["build", "scale"],
    services: ["SHOPIFY", "PAID MEDIA"],
    headline: "150.000 € el primer año de la tienda.",
    change: "150.000 € el primer año",
    summary:
      "Tienda creada y gestionada por Likin, casi dos años trabajando juntos. Productos personalizados escalados gracias a su tienda online y a anuncios con una buena estrategia. El primer año, al crearla, pudimos escalarla a 150.000 €.",
    situation: "Productos personalizados con DTF y una marca con mucho carisma, sin tienda online propia.",
    intervention: "Creamos la tienda online y llevamos la estrategia publicitaria desde el principio. Casi dos años trabajando juntos.",
    result: "El primer año, al crearla, pudimos escalarla a 150.000 €, gracias a su carisma y a una muy buena estrategia publicitaria por nuestra parte.",
    metrics: [{ value: "150.000 €", label: "facturación el primer año" }],
    store: storeAsset("fluxis"),
    video: "fluxis",
    featured: 5,
  },
  {
    slug: "panambi-velas",
    name: "Panambi Velas",
    clientId: "panambi-velas",
    url: "https://panambivelas.com/",
    sector: "Velas artesanales",
    tracks: ["build"],
    services: ["SHOPIFY", "AUTOMATION", "TRAINING", "SUBSCRIPTION"],
    headline: "De pedidos por Instagram a un eCommerce propio.",
    change: "De Instagram a tienda propia",
    summary:
      "Panambi vendía prácticamente todo por Instagram, con conversaciones manuales en cada pedido. Creamos desde cero una tienda personalizada en Shopify que mantiene su esencia premium y automatiza el proceso de compra. Nicolás la gestiona él mismo y ahora desarrollamos un sistema de suscripción.",
    situation: "Antes de trabajar con nosotros vendía prácticamente todo a través de Instagram.",
    problem: "Cada pedido requería conversaciones manuales: responder dudas, explicar productos y gestionar después la compra. Funcionaba con pocas ventas, pero hacía muy complicado escalar y consumía muchas horas cada día.",
    intervention:
      "Creamos desde cero una tienda online completamente personalizada en Shopify, manteniendo la esencia y el estilo premium de Panambi, pero automatizando todo el proceso de compra. La tienda está diseñada para que Nicolás pueda gestionarla él mismo sin depender de desarrolladores o agencias.",
    result:
      "Los clientes descubren los productos y realizan sus pedidos directamente desde la tienda. Ha aumentado la recurrencia y Nicolás dedica mucho más tiempo a hacer crecer la marca y desarrollar productos en lugar de gestionar pedidos manualmente.",
    next: "Estamos desarrollando un sistema de suscripción para que los clientes reciban automáticamente sus velas favoritas cada mes: más recurrencia y una nueva fuente de ingresos predecibles.",
    metrics: [],
    person: "Nicolás",
    store: storeAsset("panambi"),
    buildFeatured: 2,
  },
  {
    slug: "vinoteca-jardi",
    name: "Vinoteca Jardí",
    clientId: "vinoteca-jardi",
    url: "https://vinotecajardi.com/",
    sector: "Tienda de vinos",
    tracks: ["build"],
    services: ["SHOPIFY", "SUBSCRIPTION"],
    headline: "De negocio local a tienda que vende a toda España.",
    change: "De su pueblo a toda España",
    summary:
      "Un restaurante que abrió su propia vinoteca con más de 300 referencias, sin control de stock y con mucha desorganización. Gracias a la tienda online venden a toda España y gestionan el stock de forma ordenada. Les creamos además un programa de suscripción para generar recurrencia.",
    situation: "Un restaurante que abrió su propia vinoteca: más de 300 referencias de vinos, sin control de stock y una gran desorganización.",
    intervention: "Creamos la tienda online con el catálogo completo y gestión ordenada de stock, y un programa de suscripción para tener recurrencia de compradores.",
    result: "Gracias a la tienda online venden a toda España y no solo en su pueblo, además de poder gestionar de manera ordenada su stock.",
    metrics: [{ value: "+300", label: "referencias de vino organizadas en la tienda" }],
    store: storeAsset("vinoteca"),
    video: "vinoteca-jardi",
    buildFeatured: 4,
  },
  {
    slug: "el-regalo-mas-molon",
    name: "El Regalo Más Molón",
    clientId: "el-regalo-mas-molon",
    url: "https://elregalomasmolon.com/",
    sector: "Regalos personalizados",
    tracks: ["build", "scale"],
    services: ["SHOPIFY", "PAID MEDIA"],
    headline: "Testeo de producto hasta encontrar el que revienta.",
    change: "<1.000 € → ~7.000 €/mes",
    summary:
      "Creamos la tienda online desde cero para una marca con una facturación muy baja, por debajo de 1.000 € mensuales. Hicimos testeo de productos para ver qué se vende más y lo reventamos con palas de tarta personalizadas para comuniones, llegando a casi 7.000 € mensuales.",
    situation: "Tenía una facturación muy baja, ya que no llegaba a 1.000 € mensuales.",
    intervention: "Creamos la tienda online desde cero e hicimos testeo de productos para ver qué es lo que se vende más.",
    result: "Lo reventamos con palas de tarta personalizadas para comuniones, llegando a casi 7.000 € mensuales.",
    metrics: [
      { value: "<1.000 €", label: "facturación mensual, antes" },
      { value: "~7.000 €", label: "facturación mensual" },
    ],
    store: storeAsset("el-regalo"),
    video: "el-regalo-mas-molon",
  },
  {
    slug: "pide-un-deseo",
    name: "Pide un Deseo",
    clientId: "pide-un-deseo",
    url: "https://pideundeseo.es/",
    sector: "Regalos personalizados para bebés",
    tracks: ["build"],
    services: ["SHOPIFY", "AUTOMATION"],
    headline: "Personalización en la web, no por Instagram.",
    change: "Personalización automatizada",
    summary:
      "Creamos una tienda en la que las personas personalizan los productos directamente en la web, lo que les ahorró mucho tiempo respondiendo mensajes por Instagram. Es la manera de poder escalar bien: todo manual es imposible de escalar.",
    intervention: "Creamos una tienda en la que las personas personalizan los productos directamente en la web.",
    result: "Les ahorró mucho tiempo en responder mensajes por Instagram. Todo manual es imposible de escalar.",
    metrics: [],
    store: storeAsset("pide-un-deseo"),
  },
  {
    slug: "coco",
    name: "Coco",
    clientId: "coco",
    url: "https://cocotiendas.com/",
    sector: "Moda mujer, vestidos para festividades",
    tracks: ["build", "scale"],
    services: ["MIGRATION", "SHOPIFY", "PAID MEDIA"],
    headline: "De pagar 150 € al mes por gestionar WooCommerce a vender más en Shopify.",
    change: "De WooCommerce a Shopify",
    summary:
      "Migramos su tienda poco profesional hecha en WooCommerce, que le hacía perder mucho tiempo y por la que pagaba 150 € al mes solo para que le ayudaran a gestionarla, a Shopify con un diseño mucho más profesional y optimizado a la venta. Le conectamos la publicidad y consiguió aumentar su facturación en un nicho muy complicado.",
    situation: "Tienda poco profesional en WooCommerce: perdía mucho tiempo gestionándola y pagaba 150 € al mes solo para que le ayudaran a gestionarla.",
    intervention: "Migración completa a Shopify con un diseño mucho más profesional y optimizado a la venta, y conexión de toda la publicidad.",
    result: "Consiguió aumentar su facturación en un nicho que es muy complicado de vender.",
    metrics: [],
    store: storeAsset("coco"),
  },
  {
    slug: "musula",
    name: "Musula",
    clientId: "musula",
    url: "https://musula.com/",
    sector: "Alta joyería artesanal",
    tracks: ["scale"],
    services: ["RETENTION", "PAID MEDIA"],
    headline: "Vender sin descuentos constantes.",
    change: "Vender sin descuentos",
    summary:
      "Joyería artesanal de alta costura: un gran caso para quien no cree que se pueda vender sin hacer ofertas constantemente. No hacíamos descuentos, únicamente en Black Friday, y con una estrategia que combinaba email marketing con anuncios conseguimos vender sin problema.",
    situation: "Joyería de alta costura donde los descuentos continuos dañarían la marca.",
    intervention: "Estrategia que combina email marketing con anuncios, sin descuentos salvo en Black Friday.",
    result: "Conseguimos vender sin problema y sin depender de ofertas.",
    metrics: [],
    store: storeAsset("musula"),
  },
  {
    slug: "mar-al-vent",
    name: "Mar al Vent",
    clientId: "mar-al-vent",
    url: "http://maralvent.com/",
    sector: "Joyería artesanal de plata",
    tracks: ["scale"],
    services: ["SEO", "CRO", "PAID MEDIA"],
    headline: "Primeras posiciones en Google y un ticket medio mucho mayor.",
    change: "Ticket medio y nuevos clientes",
    summary: "Conseguimos posicionar su web como una de las primeras en Google, aumentamos mucho su ticket medio y le conseguimos nuevos clientes.",
    result: "Web posicionada entre las primeras en Google, ticket medio mucho mayor y nuevos clientes.",
    metrics: [],
  },
  {
    slug: "printcopy",
    name: "Printcopy",
    clientId: "",
    url: "https://printcopy.es/",
    sector: "Distribuidor de material personalizable (B2B)",
    tracks: ["scale"],
    services: ["PAID MEDIA", "SEO"],
    headline: "ROAS de 20 en un negocio que vende a otros negocios.",
    change: "ROAS 20 en algunos meses",
    summary:
      "No es una tienda online normal: no vende a cliente final, sino a otros negocios de personalización. Hemos conseguido algunos meses ROAS de 20 además de una gran recurrencia, llegar a muchos nuevos clientes y posicionar su tienda online entre las primeras en Google.",
    result: "Algunos meses con ROAS de 20, gran recurrencia, muchos clientes nuevos y tienda posicionada entre las primeras en Google.",
    metrics: [{ value: "ROAS 20", label: "en algunos meses" }],
  },
  {
    slug: "luanlove",
    name: "Luanlove",
    clientId: "luanlove",
    url: "https://luanlove.es/",
    sector: "Regalos personalizados para niños",
    tracks: ["build"],
    services: ["SHOPIFY"],
    headline: "Tienda online para regalos personalizados infantiles.",
    change: "Tienda Shopify",
    summary: "Tienda online de regalos personalizados para niños construida por Likin en Shopify.",
    metrics: [],
    store: storeAsset("luanlove"),
  },
  {
    slug: "bikini-azul",
    name: "Bikini Azul",
    clientId: "bikini-azul",
    url: "https://bikiniazul.com/",
    sector: "Vermut artesanal",
    tracks: ["build"],
    services: ["SHOPIFY"],
    headline: "Una marca de vermut artesanal con tienda propia.",
    change: "Tienda Shopify",
    summary: "Tienda online de Bikini Azul, marca de vermut artesanal mediterráneo, construida por Likin en Shopify.",
    metrics: [],
    store: storeAsset("bikini"),
    video: "bikini-azul",
    buildFeatured: 5,
  },
  {
    slug: "kumbia",
    name: "Kumbia Ibiza",
    clientId: "kumbia",
    url: "https://kumbia.es/",
    sector: "Tienda de ropa en Ibiza",
    tracks: ["build"],
    services: ["SHOPIFY"],
    headline: "Tienda de ropa en Ibiza con eCommerce propio.",
    change: "Tienda Shopify",
    summary: "Tienda online de Kumbia, tienda de ropa en Ibiza, construida por Likin en Shopify.",
    metrics: [],
  },
];

export const caseBySlug = (slug: string) => cases.find((c) => c.slug === slug);
export const featuredCases = cases.filter((c) => c.featured).sort((a, b) => a.featured! - b.featured!);
export const buildCases = cases.filter((c) => c.buildFeatured).sort((a, b) => a.buildFeatured! - b.buildFeatured!);
export const scaleCases = cases.filter((c) => c.scaleFeatured).sort((a, b) => a.scaleFeatured! - b.scaleFeatured!);
export const casesWithStore = cases.filter((c) => c.store);

export const serviceLabel: Record<Service, string> = {
  SHOPIFY: "Shopify",
  MIGRATION: "Migración",
  CRO: "CRO",
  "PAID MEDIA": "Paid Media",
  RETENTION: "Retention",
  TRAINING: "Formación",
  SEO: "SEO",
  SUBSCRIPTION: "Suscripción",
  AUTOMATION: "Automatización",
};

export const trackLabel = (c: CaseStudy) => c.tracks.map((t) => t.toUpperCase()).join(" + ");
