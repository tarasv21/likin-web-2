import manifest from "./asset-manifest.json";

/**
 * Results. Only attributable, documented figures from "Descripcion casos exito.pdf".
 * Nothing here is estimated or invented.
 */
export type Result = {
  brand: string;
  clientId: string;
  caseSlug: string;
  before: string;
  after: string;
  unit: string;
  context: string;
  /** Machine-readable value for count-up animations */
  afterNumber: number;
  afterPrefix?: string;
  afterSuffix?: string;
};

export const results: Result[] = [
  {
    brand: "Bordando Hilos",
    clientId: "bordando-hilos",
    caseSlug: "bordando-hilos",
    before: "16.000 €",
    after: "54.000 €",
    unit: "en un mes",
    context: "Mejor mes antes de Likin → mejor mes trabajando juntos. Noviembre 2024.",
    afterNumber: 54000,
    afterSuffix: " €",
  },
  {
    brand: "Tartas Bastante Majas",
    clientId: "tartas-bastante-majas",
    caseSlug: "tartas-bastante-majas",
    before: "~10.000 €",
    after: "+50.000 €",
    unit: "al mes",
    context: "Facturación mensual recurrente. CRO, email y Meta Ads.",
    afterNumber: 50000,
    afterPrefix: "+",
    afterSuffix: " €",
  },
  {
    brand: "Müa Kit",
    clientId: "mua-kit",
    caseSlug: "mua-kit",
    before: "~500 €",
    after: "+10.000 €",
    unit: "al mes",
    context: "De Etsy a una tienda propia en Shopify.",
    afterNumber: 10000,
    afterPrefix: "+",
    afterSuffix: " €",
  },
  {
    brand: "Fluxis",
    clientId: "fluxis",
    caseSlug: "fluxis",
    before: "Desde cero",
    after: "150.000 €",
    unit: "el primer año",
    context: "Tienda creada y escalada desde el lanzamiento.",
    afterNumber: 150000,
    afterSuffix: " €",
  },
];

/** Shopify admin screenshots, anonymised by sector. Figures inside the images are untouched. */
export type Panel = { id: string; sector: string; src: string; src640: string; width: number; height: number };

const SECTOR: Record<string, string> = {
  cosmetica: "Cosmética",
  "decoracion-hogar": "Decoración hogar",
  joyeria: "Joyería",
  lenceria: "Lencería",
  "moda-femenina": "Moda femenina",
  "muebles-y-decoracion-premium": "Muebles y decoración premium",
  "ropa-personalizada": "Ropa personalizada",
  streetwear: "Streetwear",
  "accesorios-para-mascotas": "Accesorios para mascotas",
  "productos-para-bebes": "Productos para bebés",
  "suplementos-deportivos": "Suplementos deportivos",
  "velas-artesanales": "Velas artesanales",
};

const PANEL_ORDER = ["ropa-personalizada", "moda-femenina", "velas-artesanales", "joyeria", "cosmetica", "streetwear", "productos-para-bebes", "suplementos-deportivos", "decoracion-hogar", "accesorios-para-mascotas", "lenceria", "muebles-y-decoracion-premium"];

export const panels: Panel[] = PANEL_ORDER.map((id) => {
  const a = manifest.panels.find((p) => p.name === id);
  if (!a) throw new Error(`Missing panel asset ${id}`);
  return { id, sector: SECTOR[id], src: `/panels/${id}.webp`, src640: `/panels/${id}-640.webp`, width: a.width, height: a.height };
});

/** Shopify order notifications supplied by Likin for the animation (demo values, not client results). */
export const notifications = manifest.notifications.map((n) => ({ src: `/notifications/${n.name}.webp`, width: n.width, height: n.height }));

export const stack = [
  { id: "shopify", name: "Shopify", role: "Plataforma" },
  { id: "meta", name: "Meta", role: "Paid Media" },
  { id: "google-ads", name: "Google Ads", role: "Paid Media" },
  { id: "tiktok-ads", name: "TikTok Ads", role: "Paid Media" },
  { id: "klaviyo", name: "Klaviyo", role: "Email & Retention" },
].map((s) => {
  const a = manifest.stack.find((x) => x.name === s.id);
  if (!a) throw new Error(`Missing stack asset ${s.id}`);
  return { ...s, src: `/stack/${s.id}.png`, width: a.width, height: a.height };
});

export const heroMetal = {
  src: "/brand/fingerprint-metal-1200.webp",
  srcSet: "/brand/fingerprint-metal-520.webp 520w, /brand/fingerprint-metal-720.webp 720w, /brand/fingerprint-metal-960.webp 960w, /brand/fingerprint-metal-1200.webp 1200w",
  width: manifest.brand.heroMetal.width,
  height: manifest.brand.heroMetal.height,
};
