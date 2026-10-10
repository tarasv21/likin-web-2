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
            "Si aceptas en el aviso de cookies, cargamos el píxel de Meta (Meta Platforms Ireland) para saber qué anuncios nos traen visitas y solicitudes. Recibe las páginas que visitas en esta web (con su dirección completa, incluidos los parámetros de campaña), y, cuando envías el formulario, un aviso con el tipo de formulario y un identificador de la solicitud, además de los datos técnicos de tu conexión y navegador, como la dirección IP. Nunca tu nombre, email, teléfono ni tus respuestas.",
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
          p: ["Con «Configurar cookies», en el pie de cualquier página. Si las retiras, el píxel deja de enviar datos y borramos sus cookies de esta web. También puedes borrar las cookies y el almacenamiento del sitio desde tu navegador."],
        },
      ]}
    />
  );
}
