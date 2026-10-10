# Lanzamiento de Meta Ads · Vía 1 (web sin CRM)

> Procedimiento para ejecutar **paso a paso** cuando Taras confirme Resend, Meta y Vercel. Nada de esto se ha ejecutado en producción. Rama: `feature/crm-ingestion`. Plan general: `likin-crm/docs/PRODUCTION_LAUNCH_PLAN.md` §0.1.

## Qué hace la web al publicarla

- Cada lead BUILD/SCALE va **a la vez** al webhook de siempre (`LEAD_WEBHOOK_URL`, sin tocar, mismos campos que hoy) y por **email de Resend** a taras@likinagency.com. El email es el registro del lead y lleva el adjunto `lead-<id>.json`, importable al CRM más adelante con el mismo id.
- Se pierde solo si fallan a la vez el webhook y Resend (con un reintento); el visitante ve el error con taras@likinagency.com.
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

## Paso 0 · Lo que configura Taras

| # | Qué | Se comprueba con `npm run launch:check` |
|---|---|---|
| T1 | `RESEND_API_KEY` de producción, solo Production, sensible | ✓ hecho (2026-10-10 01:26 UTC) |
| T2 | Píxel de Meta: pasar el ID; desactivar «coincidencia avanzada automática» y la configuración automática de eventos | el ID lo añade Claude (paso 2) |
| T3 | Titular, NIF, domicilio (registro si es sociedad), remitente de los emails del webhook; revisión jurídica de /privacidad, /cookies, /aviso-legal | «Textos legales» |
| T4 | SPF `v=spf1 include:_spf.google.com ~all` (TXT `@`), DKIM de Google (TXT `google._domainkey`), DMARC `v=DMARC1; p=none` (TXT `_dmarc`); verificación en dos pasos en taras@likinagency.com | «Correo» (la verificación en dos pasos la confirma Taras) |
| T5 | Vercel Pro | «plan Pro» |
| T6 | Autorización: variables de Production, fusión en `main` y despliegue | — |

## Paso 1 · Textos legales (Claude, en la rama)

1. Rellenar `src/data/legal.ts` con T3 (`holder`, `taxId`, `address`, `registry` si aplica, `webhookService`). Commit y push: Vercel crea el preview de la rama.
2. Taras revisa /privacidad, /cookies y /aviso-legal en el preview. Con su OK: `reviewed: true`, commit y push.
3. `npm test && npm run lint && npm run typecheck` y CI en verde.

## Paso 2 · Variables de Production (Claude, con T6)

```bash
cd likinagency.com
printf 'LIKIN Web <web@likinagency.com>' | npx vercel env add LEAD_EMAIL_FROM production --project likin-web-2 --scope likin-agency --no-sensitive --yes
printf '<ID del píxel>' | npx vercel env add NEXT_PUBLIC_META_PIXEL_ID production --project likin-web-2 --scope likin-agency --no-sensitive --yes
npm run launch:check        # todo ✓ antes de seguir
```

No se añade ninguna variable `CRM_INGEST_*` ni se toca `LEAD_WEBHOOK_URL`. `NEXT_PUBLIC_META_PIXEL_ID` se fija en el build: debe existir antes del despliegue.

## Paso 3 · Fusión y despliegue (Claude, con T6)

```bash
git checkout main && git pull --ff-only
git merge --no-ff feature/crm-ingestion -m "Merge feature/crm-ingestion: lead e-mail + legacy webhook, Meta Pixel with consent, mobile fix"
npm test && npm run build
git push origin main        # Vercel despliega producción desde main
```

Esperar `READY` y comprobar sin enviar ningún lead:

```bash
npm run launch:check -- --after
```

## Paso 4 · Prueba real (Taras, en el móvil, ~10 min)

1. Abrir https://www.likinagency.com/escalar-ecommerce?utm_source=meta&utm_medium=paid_social&utm_campaign=prueba_lanzamiento en el móvil (navegación privada).
2. «Aceptar» cookies → completar SCALE con datos propios y doble clic en «Enviar solicitud».
3. Repetir con BUILD en /crear-tienda-online.
4. Comprobar: **dos emails por lead** (el del servicio del webhook, como siempre, y «LIKIN Web» con el adjunto `lead-….json`); en Meta → Administrador de eventos, `PageView` y `Lead` (con `content_name` BUILD/SCALE).
5. Claude revisa en los logs de Vercel una línea `[lead]` por envío con `channel`, `crm: not_configured`, `emailed: true`, `webhook: true`.

## Paso 5 · Meta Ads (Taras)

- Objetivo **Clientes potenciales**, conversión en **Sitio web**, evento **Lead** (opcional: conversiones personalizadas BUILD/SCALE por `content_name`).
- Parámetros de URL: `utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}&utm_id={{campaign.id}}`.
- Meta solo ve a quien acepta cookies: el número real de leads son los emails.

## Vuelta atrás

```bash
npx vercel rollback dpl_3WWkmGvqbngf9si9v1qN4eM9Us3M --scope likin-agency   # producción anterior (f981e35)
```

Restaura el comportamiento de hoy (solo webhook). Los leads del intervalo están en los emails de Resend y en el webhook (mismo `lead_id`). Para dejar `main` como estaba: `git revert -m 1 <commit de la fusión>` y push.

**Interruptores sin despliegue de código:** quitar `NEXT_PUBLIC_META_PIXEL_ID` y redesplegar apaga el píxel y el aviso de cookies; quitar `RESEND_API_KEY` deja solo el webhook.

## Vigilancia (primeras 48 h)

- Cada lead: dos emails. Si llega uno solo, avisar: el otro canal ha fallado (el lead no se pierde).
- Logs de Vercel (Pro: 1 día): ninguna línea `[lead]` con `channel: 'none'` ni 5xx en `/api/lead`.
- Resend → Emails: entregados. Meta → Administrador de eventos: `Lead` ≤ emails (solo cuenta a quien acepta cookies).
