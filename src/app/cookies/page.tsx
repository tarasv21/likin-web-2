import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";
import { legal } from "@/data/legal";

export const metadata = legalMetadata("Política de cookies", site.routes.cookies);

export default function Page() {
  return (
    <LegalPage
      title="Política de cookies"
      sections={[
        {
          h: "Quién las usa y para qué",
          p: [
            `Esta web es de ${legal.holder} (${legal.tradeName}). Sin tu permiso solo guarda en tu navegador lo imprescindible para funcionar (lo explicamos al final). Las cookies de terceros se agrupan en dos finalidades y cada una se activa solo si la aceptas:`,
            "Analítica: Google Analytics y Microsoft Clarity, para saber cómo se usa la web.",
            "Publicidad: Meta (píxel y API de Conversiones), para medir qué anuncios nos traen visitas y solicitudes.",
            "En el aviso de cookies puedes «Aceptar todas», «Rechazar todas» o, con «Configurar», elegir cada finalidad por separado. Rechazar no cambia nada de la web: funciona igual.",
          ],
        },
        {
          h: "Analítica: Google Analytics (solo si aceptas la analítica)",
          p: [
            "Usamos Google Analytics 4, de Google, para saber cuántas personas visitan la web, de dónde llegan y cómo la usan. Google recibe las páginas que visitas (con su dirección completa, incluidos los parámetros de campaña), de dónde llegas, cómo navegas (por ejemplo, cuánto te desplazas, los clics en enlaces a otras webs y el uso de los formularios, nunca lo que escribes), datos técnicos de tu navegador y dispositivo y una ubicación aproximada. Sin las funciones publicitarias de Google: no se usa para anuncios ni para personalizar nada.",
            "Instala en likinagency.com las cookies _ga (distingue tu navegador, 2 años) y _ga_8261QVV57Y (guarda el estado de la visita, 2 años).",
          ],
        },
        {
          h: "Analítica: Microsoft Clarity (solo si aceptas la analítica)",
          p: [
            "Usamos Microsoft Clarity, de Microsoft, para ver de forma agregada cómo se usa la web: dónde se hace clic, hasta dónde se baja y dónde se atasca la gente (mapas de calor y grabaciones de la navegación). Lo que escribes o eliges en el formulario no se graba: está oculto para Clarity. Sin las funciones publicitarias de Microsoft.",
            "Instala en likinagency.com las cookies _clck (distingue tu navegador, 1 año) y _clsk (une las páginas de una misma visita, 1 día). Microsoft puede usar además sus propias cookies en sus dominios, según su declaración de privacidad (privacy.microsoft.com). Las grabaciones se conservan 30 días y los mapas de calor, 13 meses.",
          ],
        },
        {
          h: "Publicidad: Meta (solo si aceptas la publicidad)",
          p: [
            "Cargamos el píxel de Meta (Meta Platforms Ireland) en tu navegador y enviamos los mismos eventos desde nuestro servidor con su API de Conversiones, para saber qué anuncios nos traen visitas y solicitudes. Solo dos eventos:",
            "Visita de página: la dirección de cada página que visitas (completa, con los parámetros de campaña y el identificador del clic si vienes de un anuncio) y la página de la que vienes.",
            "Solicitud enviada: el aviso de que has enviado el formulario, con el tipo de servicio que pides (BUILD o SCALE), solo cuando la solicitud se ha recibido.",
            "Con cada evento van un identificador del evento (para que no se cuente dos veces), los identificadores de las cookies de Meta y datos técnicos de tu conexión y navegador, como la dirección IP. Nunca tu nombre, tu email, tu teléfono, tus respuestas ni la valoración que calcula el formulario.",
            "Instala en likinagency.com las cookies _fbp (identifica tu navegador ante Meta, 90 días) y, si llegaste desde un anuncio de Meta, _fbc (guarda el identificador de ese clic, 90 días). Meta puede usar además sus propias cookies en sus dominios, según su política de privacidad (facebook.com/privacy/policy).",
          ],
        },
        {
          h: "Almacenamiento técnico en tu navegador (sin cookies, no necesita tu permiso)",
          p: [
            "likin.consent.v1 (12 meses): tu decisión sobre cada finalidad, para no preguntarte en cada página.",
            "likin.qualify.v1 (2 horas o hasta cerrar la pestaña): tus respuestas del cuestionario si recargas la página, nunca tus datos de contacto.",
            "likin.touch.v1 (hasta cerrar la pestaña): cómo llegaste a la web (página de llegada, web de origen y parámetros de la campaña). Solo se envía con tu solicitud, si la envías.",
            "likin.pixel.leads.v1 (hasta cerrar la pestaña, solo si aceptas la publicidad): evita contar dos veces la misma solicitud.",
          ],
        },
        {
          h: "Cómo cambiar o retirar tu decisión",
          p: [
            "Cuando quieras, con «Configurar cookies», en el pie de cualquier página: vuelve a abrir el aviso con tu decisión actual y puedes activar o desactivar cada finalidad.",
            "Si retiras la analítica, Google Analytics y Microsoft Clarity dejan de enviar datos y borramos sus cookies de esta web. Si retiras la publicidad, el píxel y la API de Conversiones dejan de enviar datos y borramos las cookies de Meta de esta web. Retirar una finalidad no afecta a lo que ya se envió antes.",
            "También puedes borrar las cookies y el almacenamiento del sitio desde tu navegador; en ese caso te volveremos a preguntar.",
          ],
        },
      ]}
    />
  );
}
