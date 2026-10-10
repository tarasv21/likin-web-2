# Revisión jurídica · textos de likinagency.com

> **Para Taras y el profesional que revise los textos. No es asesoramiento jurídico.** Actualizado el 2026-10-11 sobre la rama `feature/crm-ingestion` (preview de la rama). Las páginas siguen con el aviso de texto provisional y con «[pendiente]»; nada se marca como revisado ni se quita sin la aprobación de Taras. `npm run launch:check` no da el visto bueno mientras quede algo pendiente.

## Hechos verificados (2026-10-10/11)

| Hecho | Cómo se verificó |
|---|---|
| Titular: Taras Vasyliv, empresario individual (autónomo), nombre comercial LIKIN Agency, NIF/NIE X7222864J, C/ Víctor Balaguer, 1, 1LL, 25200 Cervera, Lleida, España, taras@likinagency.com | Datos dados por Taras |
| **`LEAD_WEBHOOK_URL` está vacía** (0 caracteres) en Production y Preview: **no hay ningún servicio de webhook** y nunca se ha enviado nada a ninguno; el código actual y el nuevo la tratan como desactivada | Compilación de prueba en Preview que solo informó de la longitud, con una variable sensible de control (sí visible) y sin ninguna petición |
| El tipo de navegador (user agent) solo iba al webhook: con el webhook vacío **no se envía a nadie** | Código |
| Datos del formulario, origen de la visita, consentimientos | Código |
| Email de cada solicitud por **Resend** a **Google Workspace** (taras@likinagency.com), con el adjunto JSON | Código + prueba |
| Resend envía hoy desde **Tokio (ap-northeast-1)**; según Resend, «All account data, including email metadata, logs, and API records, is stored in the United States regardless of the sending region» | DNS de `send.likinagency.com` + documentación de Resend (Regions) |
| Funciones de la web en **Frankfurt (fra1)** tras el despliegue (hoy Washington, iad1) | `vercel.json` + preview de la rama |
| Meta, solo tras «Aceptar»: `PageView` por página y un `Lead` por solicitud (servicio + id); sin coincidencia avanzada; la petición incluye la URL de la página (con sus parámetros de campaña e identificador de clic) y, como toda petición web, la IP y el navegador | Prueba de red con el píxel real |
| Cookies `_fbp` y `_fbc`: **90 días** | Caducidad leída en el navegador tras cargar el píxel |
| `likin.consent.v1` 12 meses (localStorage); `likin.qualify.v1` 2 h o hasta cerrar; `likin.touch.v1` y `likin.pixel.leads.v1` hasta cerrar la pestaña (sessionStorage) | Código |

## A. Información que falta (campos «[pendiente]»)

1. **Servicio del webhook** (`/privacidad` → «Quién más trata tus datos»): **resuelto, no existe**. Cambio propuesto, pendiente de tu aprobación: quitar esa línea y quitar «y el tipo de navegador» de «Qué datos tratamos».
2. **Transferencias internacionales** (`/privacidad`): la redacta el profesional con estos hechos: Vercel (empresa de EE. UU.; funciones en Frankfurt), Resend (EE. UU.; envío desde Tokio o Irlanda; datos de cuenta, metadatos y registros en EE. UU.), Google (Google Workspace), Meta (Meta Platforms Ireland). El mecanismo de cada uno (decisión de adecuación, Marco de Privacidad UE-EE. UU., cláusulas tipo) sale de su contrato de encargo: no se ha comprobado.
3. **Plazos de conservación** (`/privacidad`): los fija Taras con su asesor. Elementos a cubrir: emails de solicitudes en el buzón de Google, registros de Resend (plazo del plan de Resend: sin comprobar), datos de Meta (los conserva Meta según su política).

## B. Afirmaciones que requieren validación jurídica o confirmación

**Aviso legal**
4. «La navegación por el sitio atribuye la condición de usuario e implica la aceptación de estas condiciones» (cláusula genérica).
5. «Los contenidos… pertenecen a LIKIN Agency o a sus clientes, que han autorizado su uso»: **Taras** confirma que tiene autorización de los clientes que aparecen en /work.
6. Sin cláusula de legislación y jurisdicción: decide el profesional.

**Privacidad**
7. **Base jurídica**: consentimiento para responder, para novedades y para Meta. Validar, en especial para el seguimiento comercial y para medir canales y campañas (origen de la visita).
8. **Valoración automática**: «Todas las solicitudes nos llegan y las atiende una persona» (**Taras** confirma la práctica) y el encaje con el art. 22 RGPD, porque el formulario muestra un siguiente paso según las respuestas.
9. «No vendemos ni cedemos tus datos»: **Taras** confirma.
10. Proveedores «que los tratan por nuestra cuenta» (encargados): requiere tener aceptados los contratos de encargo de Vercel, Resend y Google Workspace (**Taras** confirma).
11. **Meta**: el texto dice «las páginas que visitas y el aviso de que has enviado una solicitud, sin tus datos de contacto». Es cierto, pero incompleto: propuesta añadir que también recibe la URL con los parámetros de campaña, la IP, datos del navegador y los identificadores de sus cookies; y validar el papel de Meta (posible corresponsabilidad).
12. «Los registros técnicos de la web no guardan tus datos personales»: cierto para los registros de la aplicación; los registros de la plataforma (Vercel) guardan datos técnicos de las peticiones. Propuesta: «los registros de la aplicación».
13. Falta indicar qué datos son obligatorios y qué pasa si no se dan (sin nombre, email, teléfono y la casilla no se puede responder).
14. Derechos: valorar mencionar el de no ser objeto de decisiones automatizadas y la ausencia de delegado de protección de datos.

**Cookies**
15. «_fbp … 3 meses» y «_fbc … 3 meses»: verificado **90 días**; propuesta escribir «90 días».
16. `likin.touch.v1` (origen de la visita) como almacenamiento técnico **sin consentimiento** (art. 22.2 LSSI): ¿es estrictamente necesario? Si no, va con el consentimiento (cambio pequeño de código).
17. Primera capa del aviso (texto, botones «Rechazar»/«Aceptar» al mismo nivel, enlace) y validez de la decisión (12 meses) frente a la guía de la AEPD.
18. «Meta puede usar además sus propias cookies en sus dominios» (genérico).

**Formulario**
19. Casilla obligatoria: «Acepto que Likin trate mis datos…» → propuesta «LIKIN Agency». Línea de información básica bajo las casillas: validar como primera capa.
20. Técnico, al publicar: la versión de la política que se guarda con cada solicitud es `likinagency-privacidad@2026-09`; pasará a la versión de los textos aprobados.

## Cómo cerrar

Con tu aprobación y el texto del profesional: aplicar 1, 11, 12, 13, 15 y 19 (redacción ya propuesta), rellenar transferencias y plazos, decidir 16 y poner `reviewed: true`. Claude lo hace; las páginas no cambian hasta entonces.
