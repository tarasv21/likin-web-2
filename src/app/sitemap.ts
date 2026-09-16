import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { cases } from "@/data/cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}${site.routes.build}`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}${site.routes.scale}`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}${site.routes.work}`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...cases.map((c) => ({ url: `${site.url}${site.routes.work}/${c.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
