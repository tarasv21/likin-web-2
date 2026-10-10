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

Variables de entorno opcionales en `.env.example`. `CRM_INGEST_URL`, `CRM_INGEST_KEY_ID` y `CRM_INGEST_SECRET` envían cada lead a LIKIN CRM (firmado, solo servidor); `RESEND_API_KEY` y `LEAD_EMAIL_FROM` (las dos) activan el email del lead: sin CRM, de cada lead; con CRM, solo de respaldo, salvo con `LEAD_EMAIL_ALWAYS=1` (un email por lead como aviso fuera del CRM); `LEAD_WEBHOOK_URL` reenvía cada lead a un webhook (Make, Zapier, n8n, Slack…); `NEXT_PUBLIC_META_PIXEL_ID` activa el aviso de cookies y el píxel de Meta. Sin ninguna no se guarda nada y el formulario se lo dice al usuario en vez de prometer una respuesta.

Datos legales (titular, NIF, domicilio, servicio del webhook): `src/data/legal.ts`. Lo que falte se ve como «[pendiente]» en las páginas legales, y el aviso de texto provisional sigue hasta marcar `reviewed` tras la revisión jurídica.

```bash
npm test         # relay al CRM, payload, email del lead, origen de la visita, consentimiento y píxel (sin red)
```

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Home |
| `/crear-tienda-online` | BUILD |
| `/escalar-ecommerce` | SCALE |
| `/work` | Casos de éxito (con filtros Crear / Escalar) |
| `/work/[slug]` | Caso individual (16 casos, estáticos) |
| `/aviso-legal`, `/privacidad`, `/cookies` | Legales (placeholders, `noindex`) |
| `/api/lead` | POST del formulario de cualificación |
| `/api/qualify-check` | Suite de regresión del motor (solo en desarrollo) |

`sitemap.xml`, `robots.txt` y la imagen Open Graph se generan en `src/app/`.

## Dónde está cada cosa

```
src/
  app/            páginas, layout, sitemap, robots, opengraph-image, api/lead
  components/
    brand/        Logo, Fingerprint (SVG real), FingerprintStage + HeroScene (3D)
    layout/       Header, Footer, LeadDrawer, StickyCta, Providers
    qualify/      hoja, flujo, campos y pantallas de resultado
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

## Cualificación de leads

`useLead().openLead(track?, source?)` abre el formulario desde cualquier CTA. Con `"build"` o `"scale"` salta la pregunta de servicio. Deep links: `#lead`, `#lead-build`, `#lead-scale`.

No es un formulario de contacto: es un sistema de precualificación con lógica condicional, veredicto y pantallas de resultado distintas. Los datos de contacto se piden al final y solo cuando el veredicto lo justifica.

```
src/lib/qualify/
  types.ts      modelo de datos del lead (el que recibirá el CRM)
  questions.ts  preguntas y opciones. CONTENIDO: editar aquí para añadir o quitar
  flow.ts       qué preguntas se ven, validación y poda de ramas obsoletas
  engine.ts     veredicto y puntuación. Todos los pesos y reglas, en un sitio
  events.ts     capa de analítica agnóstica, con lista blanca anti-PII
  session.ts    recuperación en la pestaña (solo respuestas no personales) y UTMs
  submit.ts     ensamblado del lead y única salida a servidor
  config.ts     URLs de Stripe y Calendly
  journeys.ts   suite de regresión del motor
src/components/qualify/   UI (hoja, flujo, campos, resultados)
```

### Añadir o cambiar una pregunta

Edita `questions.ts` y añade el id al orden de `BUILD_ORDER` o `SCALE_ORDER`. Una pregunta condicional se declara con `when: (a) => ...`. No hay que tocar la UI: el flujo la muestra, el progreso se recalcula y, si su rama deja de ser válida, la respuesta se borra sola.

### Veredictos y acciones

| Veredicto | Acción | Pantalla |
| --- | --- | --- |
| `READY` (BUILD) | `STRIPE` | Checkout directo, o aviso honesto si aún no hay URL |
| `HIGH_FIT` / `FIT` | `BOOK_CALL` | Reserva de reunión, o aviso si aún no hay Calendly |
| `REVIEW` | `MANUAL_REVIEW` | Lo revisamos antes de responder |
| `NOT_READY` | `NURTURE` / `CLOSED` | Cierre profesional, sin pedir datos personales |

La clasificación interna (`lead_score`, `qualification_reasons`) nunca se muestra.

Ejecuta la suite de regresión con el servidor de desarrollo en marcha:

```bash
curl -s localhost:3000/api/qualify-check | python3 -m json.tool
```

### Conectar Stripe, Calendly y el CRM

Stripe y Calendly son variables públicas en `.env.example`. Mientras estén vacías, las pantallas muestran una alternativa por email y nunca un enlace inventado.

**LIKIN CRM** (`src/lib/crm/`, llamado desde `src/app/api/lead/route.ts`):

- `canonical.ts` convierte el lead en el contrato `lead-input@1` del CRM, de forma determinista: el mismo envío produce siempre los mismos bytes. El `lead_id` del navegador es el `event_id` y se conserva mientras el contenido no cambie, así que un reintento o un doble clic es el mismo envío y el CRM guarda uno.
- `relay.ts` firma el cuerpo con HMAC-SHA256 (`v1=hex(HMAC(secreto, "<timestamp>.<cuerpo>"))`, cabeceras `x-likin-key-id`, `x-likin-timestamp`, `x-likin-signature`) y lo envía con 3 intentos (4 s cada uno, 7 s en total) solo ante red, timeout, 429 o 5xx. Estados: `processed`, `duplicate`, `received` (guardado en la bandeja del CRM, todavía no es un lead), `rejected`, `retryable_failure`, `unreachable`.
- `fallback-email.ts` manda el email de respaldo cuando el CRM no confirmó, diciendo si el lead está o no en el CRM.
- El webhook heredado (`LEAD_WEBHOOK_URL`) recibe todos los leads cuando el CRM no está configurado, como siempre y con los mismos campos que antes (el toque de llegada, con los identificadores de clic, no se le envía). Con el CRM configurado es un respaldo: solo recibe los leads que el CRM no tiene, para que el mismo lead no acabe en dos sitios. Un valor que no sea una URL http(s), por ejemplo `off`, lo desactiva.
- `deliver.ts` decide qué se le dice al visitante: `stored: true` solo si algo durable tiene el lead (CRM, webhook o email). Si no, 502 y el formulario conserva los datos para reintentar.
- `src/lib/attribution/landing.ts` guarda el origen de la visita al aterrizar (UTMs, `utm_id`, click ids, ruta sin query, referrer externo) en `sessionStorage`, solo durante la visita. Si la persona llega desde tarasvasyliv.com, el salto, su CTA y el origen que esa web declara (`o_src`, `o_med`, `o_cmp`, `o_cnt`, `o_ref`; nunca click ids) se guardan junto al toque, sin sustituirlo.
- Mientras el CRM sea un preview protegido de Vercel, `CRM_INGEST_BYPASS_SECRET` (solo servidor, solo Preview) viaja como cabecera `x-vercel-protection-bypass`.

La clave HMAC es de esta web y solo vive en su servidor; nunca va al navegador ni a una variable `NEXT_PUBLIC_*`. Rotación, revocación y qué hacer si se filtra: `likin-crm/docs/LEAD_INGESTION_DESIGN.md` §11.2.

### Medición de Meta (píxel con consentimiento)

- `NEXT_PUBLIC_META_PIXEL_ID` vacío: ni píxel ni aviso de cookies (la web no instala cookies).
- Con el id: aviso de cookies con «Rechazar» y «Aceptar» al mismo nivel (`src/components/consent/ConsentManager.tsx`), decisión en `localStorage` (`likin.consent.v1`, 12 meses) y «Configurar cookies» en el pie para cambiarla o retirarla.
- Nada de Meta se carga antes de «Aceptar». Después: `PageView` en cada página, sin configuración automática de eventos ni coincidencia avanzada (`src/lib/meta-pixel.ts`).
- `Lead` solo cuando el servidor confirma la solicitud (`stored: true`), con `content_name` = BUILD o SCALE y el `lead_id` como `eventID` (el mismo id que el webhook, el email y el CRM; sirve para deduplicar con la Conversions API más adelante). Una vez por `lead_id`: doble clic, reintentos o navegación no lo repiten.
- Retirar el consentimiento detiene el píxel y borra `_fbp` y `_fbc` de esta web.
- En el Administrador de eventos de Meta, deja **desactivada** la «coincidencia avanzada automática».

`npm test` incluye `tests/pixel.test.mjs` (consentimiento, un solo Lead, sin datos personales, retirada).

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
- Conectar la web de producción al CRM (variables de arriba en Vercel) cuando el CRM esté en producción, con el respaldo por email configurado y las políticas de privacidad y cookies actualizadas.
