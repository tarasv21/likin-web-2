# Revisión jurídica · textos de likinagency.com

> **Para el profesional que revise los textos. No es asesoramiento jurídico.** Preparado el 2026-10-10 sobre la rama `feature/crm-ingestion`. Los textos se ven en el preview de la rama: `/aviso-legal`, `/privacidad`, `/cookies`, y la línea de información básica bajo las casillas del formulario. Mientras falte algo, las páginas muestran «[pendiente: …]» y el aviso de texto provisional; `npm run launch:check` no da el visto bueno.

## Datos del titular (dados por Taras)

Taras Vasyliv, empresario individual (autónomo), nombre comercial LIKIN Agency, NIF/NIE X7222864J, domicilio fiscal C/ Víctor Balaguer, 1, 1LL, 25200 Cervera, Lleida, España, taras@likinagency.com, dominio likinagency.com. Se identifica como titular del sitio y responsable del tratamiento. Sin inscripción registral (no aplica a un empresario individual).

## Hechos comprobados (código y configuración, 2026-10-10)

| Tratamiento | Qué datos | Dónde / quién | Fuente |
|---|---|---|---|
| Formulario BUILD/SCALE | Nombre, email, teléfono (obligatorio), marca y su enlace (web o Instagram), respuestas del cuestionario (facturación, inversión publicitaria, plataforma…), notas, casilla de contacto (obligatoria), casilla de novedades (opcional) | Servidor de la web en Vercel | Código |
| Origen de la visita | Página de llegada, web de origen, parámetros de campaña (`utm_*`, `utm_id`), identificador de clic (`fbclid`, `gclid`, `ttclid`); guardado en `sessionStorage` (`likin.touch.v1`) hasta cerrar la pestaña; solo sale con la solicitud | Navegador → servidor | Código |
| Tipo de navegador | User agent, enviado al webhook con la solicitud (como hasta ahora) | Servicio del webhook | Código |
| Email de la solicitud | Todo lo anterior + adjunto JSON con la solicitud completa | **Resend** (dominio verificado en la región **ap-northeast-1, Tokio**: registros DNS de `send.likinagency.com`) → buzón **Google Workspace** de taras@likinagency.com | DNS + código |
| Webhook | La solicitud completa (los mismos campos que hoy) | **Servicio sin identificar** (`LEAD_WEBHOOK_URL`, variable sensible creada el 2026-09-16) | Vercel |
| Alojamiento y funciones | Peticiones a la web, incluido el envío del formulario | **Vercel**; funciones en **fra1 (Frankfurt)** desde este despliegue (hoy `iad1`, Washington) | Vercel API + `vercel.json` |
| Medición de Meta | Solo tras «Aceptar»: páginas vistas y un evento `Lead` (servicio + id de la solicitud), cookies `_fbp` y, si llega desde un anuncio de Meta, `_fbc`; sin datos de contacto ni coincidencia avanzada | **Meta** (píxel 2270277029972714) | Código + configuración pública del píxel + prueba de red |
| Decisión de cookies | `likin.consent.v1` en `localStorage`, 12 meses | Navegador | Código |
| Registros técnicos de la web | Ids, canal y estado de cada envío; sin datos personales | Vercel (logs) | Código |

## Lo que tiene que decidir o validar el profesional

1. **Plazos de conservación** (campo `retention`): no se han inventado. Propuesta técnica de partida, solo como referencia: `likin-crm/docs/LEGAL_TEXTS_PROPOSAL.md` §9.
2. **Transferencias internacionales** (campo `transfers`): Vercel, Resend (envío desde Tokio, empresa de EE. UU.), Google y Meta, más el servicio del webhook. Hay que confirmar con el contrato de encargo de cada proveedor qué garantía aplica; la web no afirma ninguna.
3. **Servicio del webhook** (campo `webhookService`): identificarlo y decidir si sigue (Taras lo quiere mantener por ahora) y con qué contrato de encargo.
4. **Base jurídica**: el texto dice consentimiento (casillas y aviso de cookies). Validar, en especial para el seguimiento comercial y la valoración de la solicitud.
5. **Valoración automática**: el formulario calcula una estimación y muestra un siguiente paso; el texto dice que todas las solicitudes llegan a una persona y que la estimación solo prioriza (art. 22 RGPD).
6. **Meta**: papel de Meta (posible corresponsabilidad por el píxel), texto de la capa del aviso de cookies y duración de `_fbp`/`_fbc` (3 meses según la documentación de Meta).
7. **`sessionStorage` del origen de la visita** sin consentimiento (art. 22.2 LSSI): ¿técnico o requiere consentimiento? Si lo requiere, es un cambio pequeño en el código.
8. **Aviso legal**: cláusulas de objeto y propiedad intelectual (genéricas).

## Cómo cerrar la revisión

Rellenar `retention`, `transfers` y `webhookService` en `src/data/legal.ts` con el texto aprobado, aplicar los cambios de redacción que pida el profesional y poner `reviewed: true` (quita el aviso de texto provisional). Claude lo hace con el texto que le pase Taras.
