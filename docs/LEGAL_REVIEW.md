# Revisión jurídica · likinagency.com y tarasvasyliv.com

> **Para Taras y el profesional que revise los textos. No es asesoramiento jurídico ni una aprobación.** Actualizado el 2026-10-11. Ramas `feature/crm-ingestion` de las dos webs (previews protegidos). Las páginas mantienen el aviso de texto provisional y «[pendiente]» en **transferencias internacionales** y **plazos de conservación**: nada se marca como revisado sin la aprobación de Taras.

## 1. Correcciones factuales ya aplicadas (autorizadas por Taras el 2026-10-11)

| Corrección | likinagency.com | tarasvasyliv.com |
|---|---|---|
| Webhook inexistente (`LEAD_WEBHOOK_URL` vacía) fuera de privacidad y documentación; fuera «tipo de navegador» (solo iba al webhook) | ✓ | no aplica |
| Lo que recibe Meta: páginas con su dirección completa (parámetros de campaña e identificador de clic), aviso de solicitud o mensaje con el tipo de formulario y un identificador, identificadores de sus cookies, datos técnicos de conexión y navegador (IP); nunca nombre, email, teléfono, respuestas ni mensaje | ✓ | ✓ |
| Registros de la aplicación (identificador y resultado, sin datos de contacto) distintos de los de Vercel (datos técnicos de las peticiones, como la IP) | ✓ | ✓ |
| Cookies `_fbp` y `_fbc`: 90 días (comprobado en el navegador) | ✓ | ✓ |
| «LIKIN Agency» como nombre comercial (casillas del formulario) | ✓ | — (web personal; titular Taras Vasyliv) |
| Datos obligatorios del formulario y consecuencia de no darlos | ✓ | ✓ |
| Versión de la política guardada con cada envío | `likinagency-privacidad@2026-10-11` | `tarasvasyliv-privacidad@2026-10-11` |
| tarasvasyliv.com: páginas `/aviso-legal`, `/privacidad`, `/cookies` (no existían) y enlaces en el pie | — | ✓ |

## 2. Propuesta para la revisión: proveedores, finalidades, países y garantías

Hechos comprobados en la configuración o en la documentación del proveedor; **las garantías no se han comprobado** y no se afirman en las páginas.

| Proveedor | Webs | Finalidad | Datos | Dónde (comprobado) | Garantía a comprobar |
|---|---|---|---|---|---|
| **Vercel Inc.** (EE. UU.) | las dos | Alojamiento y ejecución de la web, incluido el envío de los formularios | Todo lo que pasa por las peticiones; registros técnicos | Funciones en **Frankfurt (fra1)** en las dos webs (previews de las ramas). Sin comprobar: dónde guarda Vercel sus registros y la red de distribución | Contrato de encargo de Vercel y mecanismo de transferencia (¿Marco de Privacidad UE-EE. UU.? ¿cláusulas tipo?) |
| **Resend Inc.** (EE. UU.) | likinagency.com (y tarasvasyliv.com si su formulario usa Resend) | Envío por email de cada solicitud o mensaje al buzón | Contenido del email y adjunto JSON | Envío desde **Tokio (ap-northeast-1)** hoy; **Irlanda (eu-west-1)** tras la migración que hará Taras. Resend: «All account data, including email metadata, logs, and API records, is stored in the United States regardless of the sending region» | Contrato de encargo de Resend; transferencia a EE. UU. (y a Japón mientras siga en Tokio: decisión de adecuación UE-Japón, a confirmar) |
| **Google** (Google Workspace) | las dos | Buzón taras@likinagency.com donde se reciben las solicitudes | Emails recibidos | Sin comprobar (depende del contrato y la edición de Workspace) | Condiciones de tratamiento de datos de Google Workspace; entidad contratante y transferencias |
| **Meta Platforms Ireland** | las dos, solo con consentimiento | Medición de anuncios (PageView y Lead) | Ver §1 | Entidad de la UE; sin comprobar el tratamiento posterior fuera de la UE | Condiciones de las herramientas para empresas de Meta (posible corresponsabilidad), transferencias a Meta Platforms Inc. |
| Supabase (LIKIN CRM) | más adelante | Base de datos del CRM | Solicitudes y contactos | Proyecto de producción previsto en Frankfurt | Cuando se conecte el CRM |

**Texto que puede salir de esto** (a redactar por el profesional): un párrafo por proveedor con país y garantía, o una remisión a los contratos de encargo; mencionar expresamente que Resend guarda metadatos y registros en EE. UU.

## 3. Propuesta para la revisión: plazos de conservación

Ningún plazo está decidido. Propuesta de partida, para validar o cambiar:

| Datos | Dónde | Propuesta | Por qué / qué falta comprobar |
|---|---|---|---|
| Solicitudes (likinagency.com) y mensajes (tarasvasyliv.com) | Buzón de Google | Mientras se gestiona la solicitud; si no hay relación comercial, **24 meses** desde el último contacto y después borrado. Al conectar el CRM, los emails se importan y se borran del buzón | Plazo comercial razonable; si hay contrato, los plazos legales que indique el asesor |
| Copia en Resend (metadatos, registros y, según el plan, el contenido) | Resend (EE. UU.) | El mínimo que permita Resend | **Comprobar** en el panel de Resend cuánto conserva y si se puede reducir |
| Registros de Vercel | Vercel | Lo que fije el plan Pro (1 día en los registros de ejecución) | Comprobar el resto de registros de la plataforma |
| Decisión de cookies | Navegador | 12 meses (`likin.consent.v1`) | Hecho; validar frente a la guía de la AEPD |
| Origen de la visita | Navegador | Hasta cerrar la pestaña | Hecho |
| Datos en Meta | Meta | Según la política de Meta | Fuera del control del responsable |
| CRM | Supabase | Política del CRM (OD-18) al conectarlo | Fuera de esta fase |

## 4. Puntos que siguen requiriendo validación jurídica

1. Base jurídica (consentimiento) para responder, para novedades, para medir canales y campañas y para Meta.
2. Valoración automática del formulario de likinagency.com (estimación y siguiente paso) frente al art. 22 RGPD; «todas las solicitudes las atiende una persona» (Taras confirma).
3. «No vendemos ni cedemos tus datos» y contratos de encargo aceptados (Vercel, Resend, Google): **Taras confirma**.
4. Papel de Meta (posible corresponsabilidad) y texto de la primera capa del aviso de cookies; validez de la decisión (12 meses).
5. `likin.touch.v1` (origen de la visita) sin consentimiento (art. 22.2 LSSI): ¿técnico o con consentimiento?
6. Aviso legal: cláusula de aceptación por navegar; autorización de los clientes de /work (likinagency.com) y de los testimonios y marcas de terceros (tarasvasyliv.com); legislación y jurisdicción.
7. Mención del delegado de protección de datos (no hay) y del derecho a no ser objeto de decisiones automatizadas.

## Cómo cerrar

Con el texto aprobado: rellenar `transfers` y `retention` (`src/data/legal.ts` en likinagency.com, `src/lib/legal.ts` en tarasvasyliv.com), aplicar la redacción que pida el profesional y, con la aprobación de Taras, `reviewed: true`. Si cambia el texto, sube `policyVersion`.
