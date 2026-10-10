# Lanzamiento de Meta Ads · Vía 1 (web sin CRM)

> Procedimiento para ejecutar **paso a paso** cuando Taras confirme Resend, Meta y Vercel. Nada de esto se ha ejecutado en producción. Rama: `feature/crm-ingestion`. Plan general: `likin-crm/docs/PRODUCTION_LAUNCH_PLAN.md` §0.1.

## Qué hace la web al publicarla

- Cada lead BUILD/SCALE va por **email de Resend** a taras@likinagency.com. El email es el registro del lead y lleva el adjunto `lead-<id>.json`, importable al CRM más adelante con el mismo id.
- `LEAD_WEBHOOK_URL` existe pero está **vacía** (comprobado el 2026-10-11): no hay webhook y no se envía nada a ningún otro servicio. Resend es el **único** canal hasta conectar el CRM.
- Si Resend falla (con un reintento), el visitante ve el error con taras@likinagency.com y el log de Vercel registra `channel: 'none'`.
- Sin variables del CRM en Production: la web funciona sin CRM.
- Píxel de Meta solo con consentimiento: `PageView` y un `Lead` por lead confirmado, con `eventID` = id del lead.

## Ya validado (no hay que repetirlo)

| Qué | Cómo | Resultado |
|---|---|---|
| Webhook con los campos de antes (sin `touch` ni identificadores de clic) | `npm test` (`tests/crm.test.mjs`) | ✓ |
| Paso de contacto desplazable en móvil (390×844: la casilla de consentimiento quedaba tapada; fallo también en producción) | QA local | ✓ corregido (3a10e4d) |
| BUILD y SCALE, móvil y escritorio, aceptando y rechazando cookies: aviso antes de Meta, casilla alcanzable, una petición por doble clic, webhook con UTMs de la llegada, un email (remitente, destinatario, «registro del lead», adjunto con id, atribución, respuestas y consentimiento, Idempotency-Key), un `Lead` por id, nada de Meta sin consentimiento, ningún dato personal a Meta | `node scripts/qa-launch.mjs` (cabecera del script) | ✓ 62/62 (2026-10-10, 0b2b67d) |
| Consentimiento y píxel (10 pruebas) | `npm test` (`tests/pixel.test.mjs`) | ✓ |
| Email real recibido sin CRM | preview de la rama, 2026-10-09 | ✓ confirmado por Taras |
| El adjunto se importa al CRM con todo (contacto, empresa, 20/11 respuestas, cualificación, UTMs, `utm_id`, `fbclid`, id original) y no se duplica | CRM `feature/crm-production`, Supabase DEV | ✓ |

## Estado (2026-10-10, `npm run launch:check`)

| # | Qué | Estado |
|---|---|---|
| T1 | `RESEND_API_KEY` de producción, solo Production, sensible (y otra clave solo para el preview de la rama) | ✓ |
| T2 | Píxel 2270277029972714 (el de LIKIN Agency); coincidencia avanzada automática, eventos automáticos y seguimiento sin código desactivados | ✓ (comprobado en su configuración pública; el código además apaga los eventos automáticos) |
| T3 | Datos del titular en `/aviso-legal`, `/privacidad`, `/cookies` y bajo el formulario | ✓ |
| T3b | Textos legales: quitar el webhook (no existe: variable vacía), plazos de conservación, transferencias internacionales, correcciones propuestas y revisión jurídica (`docs/LEGAL_REVIEW.md`) | **pendiente** |
| T4 | SPF, DKIM y DMARC de Google; verificación en dos pasos | ✓ |
| T5 | Vercel Pro (equipo `likin-agency`, activo; `likin-web-2`, `tarasvasyliv.com` y el preview del CRM en ese equipo, ninguno pausado) | ✓ |
| V | Production: `LEAD_EMAIL_FROM` = `LIKIN Web <web@likinagency.com>`, `NEXT_PUBLIC_META_PIXEL_ID` = `2270277029972714` (añadidas el 2026-10-10; la producción actual, f981e35, no las usa) | ✓ |
| T6 | Autorización definitiva de Taras para fusionar y desplegar | **pendiente** |

## Paso 1 · Cerrar los textos legales (Claude, en la rama)

Con el texto aprobado: rellenar `webhookService`, `retention` y `transfers` en `src/data/legal.ts`, aplicar los cambios de redacción y poner `reviewed: true`. Commit, push, CI en verde y `npm run launch:check` sin ✗.

## Paso 2 · Variables de Production

Ya están (ver V). Comprobación: `npm run launch:check`. No se añade ninguna variable `CRM_INGEST_*` ni se toca `LEAD_WEBHOOK_URL`.

## Paso 3 · Fusión y despliegue (Claude, con T6)

```bash
git checkout main && git pull --ff-only
git merge --no-ff feature/crm-ingestion -m "Merge feature/crm-ingestion: lead e-mail + legacy webhook, Meta Pixel with consent, mobile fix"
npm test && npm run build
git push origin main        # Vercel despliega producción desde main
```

Esperar `READY` y comprobar sin enviar ningún lead:

```bash
npm run launch:check -- --after                         # páginas, textos sin [pendiente], /api/lead sin crear nada, despliegue listo
npm i --no-save playwright-core@1.63.0
node scripts/qa-pixel.mjs https://www.likinagency.com    # píxel real: nada antes de aceptar, PageView ×2, solo PageView, sin datos de usuario, nada al rechazar
```

`qa-pixel` abre una ventana de Chromium: dejarla delante hasta que se cierre (Meta no envía nada desde una página oculta ni desde navegadores sin ventana).

## Paso 4 · Prueba real (Taras, en el móvil, ~10 min)

1. Abrir https://www.likinagency.com/escalar-ecommerce?utm_source=meta&utm_medium=paid_social&utm_campaign=prueba_lanzamiento en el móvil (navegación privada).
2. «Aceptar» cookies → completar SCALE con datos propios y doble clic en «Enviar solicitud».
3. Repetir con BUILD en /crear-tienda-online.
4. Comprobar: **un email por lead** («LIKIN Web» con el adjunto `lead-….json`); en Meta → Administrador de eventos, `PageView` y `Lead` (con `content_name` BUILD/SCALE).
5. Claude revisa en los logs de Vercel una línea `[lead]` por envío con `channel: 'email'`, `crm: not_configured`, `emailed: true`, `webhook: null`.

## Paso 5 · Meta Ads (Taras)

- Objetivo **Clientes potenciales**, conversión en **Sitio web**, evento **Lead** (opcional: conversiones personalizadas BUILD/SCALE por `content_name`).
- Parámetros de URL: `utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}&utm_id={{campaign.id}}`.
- Meta solo ve a quien acepta cookies: el número real de leads son los emails.

## Qué NO cambia este despliegue

- **tarasvasyliv.com**: otro proyecto de Vercel; no se despliega ni cambia (su formulario sigue como hoy). Sus enlaces a likinagency.com siguen funcionando.
- **CRM**: ninguna variable del CRM en `likin-web-2`; la web no llama al CRM. El preview del CRM y Supabase no se tocan.
- **DNS**: no se toca. **`LEAD_WEBHOOK_URL`**: sin cambios (sigue vacía, es decir, sin webhook).

## Vuelta atrás

```bash
npx vercel rollback dpl_3WWkmGvqbngf9si9v1qN4eM9Us3M --scope likin-agency   # producción anterior (f981e35)
```

Restaura la web de hoy (que no guarda solicitudes: webhook vacío). Los leads del intervalo están en los emails de Resend. Para dejar `main` como estaba: `git revert -m 1 <commit de la fusión>` y push.

**Interruptores sin despliegue de código:** quitar `NEXT_PUBLIC_META_PIXEL_ID` y redesplegar apaga el píxel y el aviso de cookies; quitar `RESEND_API_KEY` deja la web sin canal de recepción (no hacerlo).

## Vigilancia (primeras 48 h)

- Cada lead: un email. Si un visitante dice que envió y no hay email, revisar el log (`channel: 'none'`).
- Logs de Vercel (Pro: 1 día): ninguna línea `[lead]` con `channel: 'none'` ni 5xx en `/api/lead`.
- Resend → Emails: entregados. Meta → Administrador de eventos: `Lead` ≤ emails (solo cuenta a quien acepta cookies).
