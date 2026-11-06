import manifest from "./asset-manifest.json";

export type Client = {
  id: string;
  name: string;
  logo: string;
  width: number;
  height: number;
  /** Slug of a published case study, when one exists. */
  caseSlug?: string;
  /** Logo artwork is dark → invert on dark backgrounds, or show on a light card. */
  dark: boolean;
};

const NAMES: Record<string, { name: string; caseSlug?: string }> = {
  "bordando-hilos": { name: "Bordando Hilos", caseSlug: "bordando-hilos" },
  "el-regalo-mas-molon": { name: "El Regalo Más Molón", caseSlug: "el-regalo-mas-molon" },
  fluxis: { name: "Fluxis", caseSlug: "fluxis" },
  luanlove: { name: "Luanlove", caseSlug: "luanlove" },
  "vinoteca-jardi": { name: "Vinoteca Jardí", caseSlug: "vinoteca-jardi" },
  alqya: { name: "Alqya", caseSlug: "alqya" },
  beneno: { name: "Beneno BCN", caseSlug: "beneno-bcn" },
  "bikini-azul": { name: "Bikini Azul", caseSlug: "bikini-azul" },
  coco: { name: "Coco", caseSlug: "coco" },
  kumbia: { name: "Kumbia Ibiza", caseSlug: "kumbia" },
  larry: { name: "Larry Style" },
  "mar-al-vent": { name: "Mar al Vent", caseSlug: "mar-al-vent" },
  "mua-kit": { name: "Müa Kit", caseSlug: "mua-kit" },
  musula: { name: "Musula", caseSlug: "musula" },
  "natural-es": { name: "Naturales", caseSlug: "naturales" },
  "panambi-velas": { name: "Panambi Velas", caseSlug: "panambi-velas" },
  "pide-un-deseo": { name: "Pide un Deseo", caseSlug: "pide-un-deseo" },
  pipiola: { name: "Pipiola Chic", caseSlug: "pipiola-chic" },
  "port-of-dragons": { name: "Port of Dragons" },
  sublijalemo: { name: "Sublijalemo", caseSlug: "sublijalemo" },
  "tartas-bastante-majas": { name: "Tartas Bastante Majas", caseSlug: "tartas-bastante-majas" },
  trazzados: { name: "Trazzados", caseSlug: "trazzados" },
  tudropshipper: { name: "Tudropshipper" },
};

/** Marquee order alternates wide wordmarks with compact marks. */
const ORDER = [
  "mua-kit",
  "tartas-bastante-majas",
  "pipiola",
  "bordando-hilos",
  "fluxis",
  "vinoteca-jardi",
  "panambi-velas",
  "beneno",
  "alqya",
  "sublijalemo",
  "trazzados",
  "musula",
  "coco",
  "bikini-azul",
  "el-regalo-mas-molon",
  "pide-un-deseo",
  "mar-al-vent",
  "luanlove",
  "kumbia",
  "natural-es",
  "larry",
  "port-of-dragons",
  "tudropshipper",
];

const byId = new Map(manifest.clients.map((c) => [c.name, c]));

export const clients: Client[] = ORDER.map((id) => {
  const asset = byId.get(id);
  if (!asset) throw new Error(`Missing client logo asset: ${id}`);
  return { id, name: NAMES[id].name, caseSlug: NAMES[id].caseSlug, logo: `/clients/${id}.png`, width: asset.width, height: asset.height, dark: Boolean((asset as { dark?: boolean }).dark) };
});

export const clientById = (id: string) => clients.find((c) => c.id === id);
