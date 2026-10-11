import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";
import { legal } from "@/data/legal";

export const metadata = legalMetadata("Política de cookies", site.routes.cookies);

export default function Page() {
  return (
    <LegalPage
      title="Política de cookies"
      sections={[
        { h: "Quién las usa", p: [`Esta web es de ${legal.holder} (${legal.tradeName}). Solo usa cookies de terceros si las aceptas: las de Meta, para medir los anuncios.`] },
        {
          h: "Cookies de medición de Meta (solo si las aceptas)",
          p: [
            "Si aceptas en el aviso de cookies, cargamos el píxel de Meta (Meta Platforms Ireland) y activamos su API de Conversiones desde nuestro servidor para saber qué anuncios nos traen visitas y solicitudes. Meta recibe las páginas que visitas (con su dirección completa, incluidos los parámetros de campaña), los clics en nuestro email y en el enlace de reserva y el aviso de que has enviado una solicitud (en ese caso también tu email, teléfono y nombre de pila cifrados con hash), además de los datos técnicos de tu conexión y navegador, como la dirección IP. Nunca tus respuestas. Está explicado en la política de privacidad.",
            "Instala en likinagency.com las cookies _fbp (identifica tu navegador ante Meta, 90 días) y, si llegaste desde un anuncio de Meta, _fbc (guarda el identificador de ese clic, 90 días). Meta puede usar además sus propias cookies en sus dominios, según su política de privacidad (facebook.com/privacy/policy).",
            "Si no aceptas, no se carga nada de Meta y la web funciona igual.",
          ],
        },
        {
          h: "Almacenamiento técnico en tu navegador (sin cookies)",
          p: [
            "likin.consent.v1 (12 meses): tu decisión sobre las cookies, para no preguntarte en cada página.",
            "likin.qualify.v1 (2 horas o hasta cerrar la pestaña): tus respuestas del cuestionario si recargas la página, nunca tus datos de contacto.",
            "likin.touch.v1 (hasta cerrar la pestaña): cómo llegaste a la web (página de llegada, web de origen y parámetros de la campaña). Solo se envía con tu solicitud, si la envías.",
            "likin.pixel.leads.v1 (hasta cerrar la pestaña, solo si aceptas las cookies de Meta): evita contar dos veces la misma solicitud.",
          ],
        },
        {
          h: "Cómo cambiar o retirar tu decisión",
          p: ["Con «Configurar cookies», en el pie de cualquier página. Si las retiras, el píxel y la API de Conversiones dejan de enviar datos y borramos sus cookies de esta web. También puedes borrar las cookies y el almacenamiento del sitio desde tu navegador."],
        },
      ]}
    />
  );
}
