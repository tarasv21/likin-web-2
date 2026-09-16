/**
 * Video testimonials from "Videos testimonio/". No quotes: the videos are not transcribed,
 * so cards show the person (when documented), the brand and the sector only.
 */
export type Testimonial = {
  id: string;
  brand: string;
  person?: string;
  sector: string;
  caseSlug: string;
  src: string;
  poster: string;
  duration: string;
  aspect: "9/16" | "3/4";
  tracks: ("build" | "scale")[];
};

const v = (id: string) => ({ src: `/video/testimonials/${id}.mp4`, poster: `/video/testimonials/${id}.jpg` });

export const testimonials: Testimonial[] = [
  { id: "mua-kit", brand: "Müa Kit", person: "Cristina", sector: "Kits DIY de joyería", caseSlug: "mua-kit", ...v("mua-kit"), duration: "0:45", aspect: "9/16", tracks: ["build", "scale"] },
  { id: "tartas-bastante-majas", brand: "Tartas Bastante Majas", person: "Gisela", sector: "Tartas artesanales", caseSlug: "tartas-bastante-majas", ...v("tartas-bastante-majas"), duration: "1:07", aspect: "9/16", tracks: ["scale"] },
  { id: "pipiola-chic", brand: "Pipiola Chic", person: "Esther", sector: "Moda femenina", caseSlug: "pipiola-chic", ...v("pipiola-chic"), duration: "3:21", aspect: "3/4", tracks: ["build"] },
  { id: "bordando-hilos", brand: "Bordando Hilos", sector: "Ropa personalizada bordada", caseSlug: "bordando-hilos", ...v("bordando-hilos"), duration: "0:59", aspect: "9/16", tracks: ["build", "scale"] },
  { id: "fluxis", brand: "Fluxis", sector: "Ropa personalizada DTF", caseSlug: "fluxis", ...v("fluxis"), duration: "0:41", aspect: "9/16", tracks: ["build", "scale"] },
  { id: "vinoteca-jardi", brand: "Vinoteca Jardí", sector: "Tienda online de vinos", caseSlug: "vinoteca-jardi", ...v("vinoteca-jardi"), duration: "0:21", aspect: "9/16", tracks: ["build"] },
  { id: "bikini-azul", brand: "Bikini Azul", sector: "Vermut artesanal", caseSlug: "bikini-azul", ...v("bikini-azul"), duration: "0:29", aspect: "9/16", tracks: ["build"] },
  { id: "el-regalo-mas-molon", brand: "El Regalo Más Molón", sector: "Regalos personalizados", caseSlug: "el-regalo-mas-molon", ...v("el-regalo-mas-molon"), duration: "2:30", aspect: "9/16", tracks: ["build", "scale"] },
];

export const testimonialById = (id: string) => testimonials.find((t) => t.id === id);
export const buildTestimonials = testimonials.filter((t) => t.tracks.includes("build"));
export const scaleTestimonials = testimonials.filter((t) => t.tracks.includes("scale"));
