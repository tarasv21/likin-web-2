import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";
import { legal, pending } from "@/data/legal";

export const metadata = legalMetadata("Política de privacidad", site.routes.privacy);

export default function Page() {
  const holder = pending(legal.holder, "titular");
  return (
    <LegalPage
      title="Política de privacidad"
      sections={[
        { h: "Responsable", p: [`${holder} (${site.name}), NIF ${pending(legal.taxId, "NIF")}, ${pending(legal.address, "domicilio")}. Contacto: ${site.email}.`] },
        {
          h: "Qué datos tratamos",
          p: [
            "Los que nos das en el formulario de precualificación: nombre, email, teléfono, nombre y enlace de tu marca, tus respuestas sobre el negocio, lo que quieras contarnos y tus consentimientos.",
            "Además, cómo llegaste a la web (página de llegada, web de origen, parámetros de la campaña e identificador del clic si vienes de un anuncio), solo si envías el formulario.",
          ],
        },
        {
          h: "Para qué",
          p: [
            "Para valorar si podemos ayudarte, responderte y, si encaja, preparar una propuesta y hacer el seguimiento comercial de tu solicitud. También para saber qué canales y campañas nos traen solicitudes.",
            "Si marcas la casilla de novedades, para enviarte contenidos de Likin.",
          ],
        },
        {
          h: "Base jurídica",
          p: [
            "Tu consentimiento al marcar la casilla del formulario, para tratar tus datos y responder a tu solicitud. Para las novedades, el consentimiento de esa segunda casilla, que es opcional. Para la medición con Meta, tu consentimiento en el aviso de cookies. Puedes retirar cualquiera de ellos cuando quieras.",
          ],
        },
        {
          h: "Cómo valoramos tu solicitud",
          p: ["Con tus respuestas calculamos una estimación del encaje de tu proyecto con nuestros servicios para priorizar la respuesta. Una persona revisa siempre cada solicitud: no tomamos decisiones con efectos jurídicos ni similares de forma solo automatizada."],
        },
        {
          h: "Quién más trata tus datos",
          p: [
            `No cedemos tus datos. Los tratan por cuenta nuestra, como encargados del tratamiento: Vercel (alojamiento de la web), Resend (envío del email con tu solicitud a nuestro buzón), Google (correo electrónico) y ${pending(legal.webhookService, "servicio que recibe las solicitudes")} (recepción de solicitudes y aviso por email).`,
            "Solo si aceptas las cookies de medición, Meta Platforms Ireland recibe, mediante su píxel, las visitas y el aviso de que has enviado una solicitud (sin tus datos de contacto), para medir nuestros anuncios. Lo explicamos en la política de cookies.",
            "Algunos de estos proveedores son empresas de Estados Unidos: las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en cláusulas contractuales tipo de la Comisión Europea.",
          ],
        },
        {
          h: "Cuánto tiempo",
          p: ["Mientras gestionamos tu solicitud. Si no llegamos a trabajar juntos, durante 24 meses desde el último contacto; después los borramos o anonimizamos. Si pasas a ser cliente, mientras dure la relación y los plazos que exija la ley."],
        },
        {
          h: "Tus derechos",
          p: [`Acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, escribiendo a ${site.email}. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).`],
        },
        { h: "Seguridad", p: ["La web funciona con conexión cifrada, las claves de los servicios solo están en el servidor y los registros técnicos no guardan datos personales."] },
      ]}
    />
  );
}
