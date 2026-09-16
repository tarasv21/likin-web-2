# LIKIN AGENCY — web

Sitio de Likin Agency: agencia especializada en eCommerce con dos productos, **BUILD** (crear tiendas Shopify) y **SCALE** (escalar tiendas que ya venden con Paid Media, CRO y Retention).

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript · Three.js (solo en el hero de escritorio).

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start
npm run typecheck  # tsc
npm run lint       # eslint
```

Variables de entorno opcionales en `.env.example`. `LEAD_WEBHOOK_URL` reenvía cada lead a un webhook (Make, Zapier, n8n, Slack…). Sin ella, los leads solo se registran en el log del servidor.

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Home |
| `/crear-tienda-online` | BUILD |
| `/escalar-ecommerce` | SCALE |
| `/work` | Casos de éxito (con filtros Crear / Escalar) |
| `/work/[slug]` | Caso individual (16 casos, estáticos) |
| `/aviso-legal`, `/privacidad`, `/cookies` | Legales (placeholders, `noindex`) |
| `/api/lead` | POST del formulario de contacto |

`sitemap.xml`, `robots.txt` y la imagen Open Graph se generan en `src/app/`.

## Dónde está cada cosa

```
src/
  app/            páginas, layout, sitemap, robots, opengraph-image, api/lead
  components/
    brand/        Logo, Fingerprint (SVG real), FingerprintStage + HeroScene (3D)
    layout/       Header, Footer, LeadDrawer, StickyCta, Providers
    forms/        MultiStep, BuildForm, ScaleForm
    home/ build/ scale/ work/   secciones de cada página
    ui/           Button, Reveal, Modal, Faq, Marquee, Frames, Icons…
  data/           site.ts (rutas, CTAs, precios, contacto), cases.ts, clients.ts,
                  testimonials.ts, proof.ts (resultados), faqs.ts, fingerprint.ts
  lib/            hooks (scroll, reduced motion), seo.ts (JSON-LD), utils
scripts/          pipeline de assets, vídeos y QA visual
public/           assets generados (no editar a mano)
```

### Editar contenido

- **Textos de precio, CTAs, rutas, redes y email** → `src/data/site.ts`.
- **Casos** → `src/data/cases.ts`. Cada caso genera su URL en `/work/[slug]`. Solo cifras documentadas.
- **Resultados de la home** → `src/data/proof.ts`.
- **Testimonios en vídeo** → `src/data/testimonials.ts`.
- **FAQs** → `src/data/faqs.ts`.
- **Logos de clientes** → `src/data/clients.ts` (el flag `dark` pone tarjeta clara a los logos oscuros).

## Assets

Los assets de `public/` se generan desde la carpeta de material de marca con `sharp` y `ffmpeg`:

```bash
npm run assets -- "/ruta/a/New likin web"        # logos, capturas, paneles, hero, sprite de la huella
npm run videos -- "/ruta/a/Videos testimonio"    # testimonios a 720p H.264 + pósters
```

Sin argumento usan la ruta local original. `npm run assets` también escribe `src/data/asset-manifest.json` (dimensiones) y `public/brand/fingerprint.svg`, el sprite con las 11 crestas de la huella que todos los componentes dibujan con `<use>`.

## Huella (sistema visual)

- Geometría real trazada del isotipo en `src/data/fingerprint.ts` (no editar a mano).
- `Fingerprint` la dibuja como SVG (crestas individuales, se pueden iluminar).
- `FingerprintStage` muestra el render metálico (WebP con alpha) como LCP y experiencia completa en móvil / reduced motion / sin WebGL; en escritorio con puntero fino carga la escena Three.js (`HeroScene`) tras 900 ms y hace crossfade.

## Leads

`useLead().openLead(track?, source?)` abre el drawer desde cualquier componente. Deep links: `#lead`, `#lead-build`, `#lead-scale`. El formulario valida en cliente y servidor, tiene honeypot y no depende de ningún CRM.

## QA

```bash
node scripts/qa-shot.mjs http://localhost:3000/ qa/home.png --w=390 --h=844 --scroll=full --full
node scripts/qa-shot.mjs http://localhost:3000/ qa/home.png --w=1440 --h=900 --reduced
node scripts/qa-split.mjs qa/home.png 8
node scripts/qa-interact.mjs http://localhost:3000/
npx lighthouse http://localhost:3000/ --output=json --output-path=qa/lh/home.json
```

`qa-shot` hace capturas por Chrome DevTools Protocol, detecta scroll horizontal y errores de consola. La carpeta `qa/` está ignorada por git.

## Pendiente de material real

- Textos legales definitivos (aviso legal, privacidad, cookies).
- Transcripciones / subtítulos de los testimonios en vídeo.
- Destino de los leads (webhook o CRM) cuando se decida.
