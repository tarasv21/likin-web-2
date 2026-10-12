# Puntos legales abiertos · likinagency.com

> Textos legales (aviso legal, privacidad y cookies) aprobados por Taras el **2026-10-12** (versión `likinagency-privacidad@2026-10-12`). **No los ha revisado todavía un profesional.** Estos puntos quedan pendientes de esa revisión.

## 1 · Atribución guardada en el navegador sin consentimiento (`likin.touch.v1`)

- **Qué hace:** al llegar a la web se guarda en `sessionStorage` (hasta cerrar la pestaña) cómo llegó la visita: página de llegada, web de origen, parámetros de campaña e identificadores de clic (`fbclid`, `gclid`, `ttclid`). Solo se envía con el formulario, si se envía, y llega al CRM como atribución del lead.
- **Riesgo:** el art. 22.2 de la LSSI exige consentimiento para almacenar o leer datos en el dispositivo salvo que sea estrictamente necesario para el servicio que pide el usuario. La política de cookies lo presenta como almacenamiento técnico que no necesita permiso; una autoridad podría considerar que la atribución de campañas no es estrictamente necesaria.
- **Decisión de Taras (2026-10-12): opción A**, mantener el sistema actual para conservar la procedencia de los leads aunque se recargue la página. Descartada por ahora la opción B (solo en memoria hasta aceptar la analítica).
- **Límite:** esta decisión no afecta al consentimiento de Meta (píxel y API de Conversiones), Google Analytics ni Microsoft Clarity: siguen funcionando solo con la finalidad aceptada.
- **Pendiente:** revisión profesional; si se pide cambiarlo, la opción B está analizada.

## 2 · Otros puntos

- **Base jurídica:** solicitudes por medidas precontractuales (art. 6.1.b) o, para contactos de empresas, interés legítimo (art. 6.1.f y art. 19 LOPDGDD); atribución por interés legítimo. Falta documentar la evaluación del interés legítimo.
- **Registro de actividades de tratamiento (art. 30 RGPD):** por documentar.
- **Conservación (24 meses sin relación comercial):** el CRM no borra solo; hace falta un recordatorio periódico para anonimizar contactos (Ajustes del contacto → «Anonimizar contacto») y borrar los emails de respaldo.
- **GitHub:** guardar la respuesta escrita de soporte que confirma que el DPA cubre GitHub Actions en la organización gratuita `likin-agency`.
