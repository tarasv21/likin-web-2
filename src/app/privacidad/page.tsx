import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";
import { legal, pending } from "@/data/legal";

export const metadata = legalMetadata("Política de privacidad", site.routes.privacy);

export default function Page() {
  return (
    <LegalPage
      title="Política de privacidad"
      sections={[
        {
          h: "Responsable",
          p: [`${legal.holder}, ${legal.legalForm}, con nombre comercial ${legal.tradeName}. NIF/NIE: ${legal.taxId}. Domicilio: ${legal.address}. Contacto: ${site.email}.`],
        },
        {
          h: "Qué datos tratamos",
          p: [
            "Los que nos das en el formulario de precualificación: nombre, email, teléfono, nombre y enlace de tu marca (web o Instagram), tus respuestas sobre el negocio (por ejemplo, facturación, inversión en publicidad o plataforma), lo que quieras contarnos y tus consentimientos.",
            "Además, cómo llegaste a la web (página de llegada, web de origen, parámetros de la campaña e identificador del clic si vienes de un anuncio) y el tipo de navegador, solo si envías el formulario.",
          ],
        },
        {
          h: "Para qué",
          p: [
            "Para valorar si podemos ayudarte, responderte y, si encaja, preparar una propuesta y hacer el seguimiento comercial de tu solicitud. También para saber qué canales y campañas nos traen solicitudes.",
            "Si marcas la casilla de novedades, para enviarte contenidos de LIKIN Agency.",
            "Si aceptas las cookies de medición, para medir con Meta qué anuncios nos traen visitas y solicitudes (lo explicamos en la política de cookies).",
          ],
        },
        {
          h: "Base jurídica",
          p: ["Tu consentimiento: al marcar la casilla del formulario, para tratar tus datos y responder a tu solicitud; con la casilla de novedades, que es opcional, para enviarte contenidos; y en el aviso de cookies, para la medición con Meta. Puedes retirar cualquiera de ellos cuando quieras, sin que afecte a lo hecho antes."],
        },
        {
          h: "Cómo valoramos tu solicitud",
          p: ["Con tus respuestas el formulario calcula una estimación del encaje de tu proyecto con nuestros servicios y te muestra el siguiente paso recomendado. Todas las solicitudes nos llegan y las atiende una persona: la estimación sirve para priorizar la respuesta."],
        },
        {
          h: "Quién más trata tus datos",
          p: [
            "No vendemos ni cedemos tus datos. Para funcionar usamos estos proveedores, que los tratan por nuestra cuenta:",
            "Vercel: alojamiento y funcionamiento de la web, incluido el envío del formulario.",
            "Resend: envío del email con tu solicitud a nuestro buzón.",
            "Google (Google Workspace): correo electrónico de LIKIN Agency, donde recibimos tu solicitud.",
            `${pending(legal.webhookService, "servicio que recibe cada solicitud por webhook")}: recepción de las solicitudes y aviso por email.`,
            "Meta Platforms Ireland: solo si aceptas las cookies de medición, recibe mediante su píxel las páginas que visitas y el aviso de que has enviado una solicitud, sin tus datos de contacto.",
          ],
        },
        { h: "Transferencias internacionales", p: [pending(legal.transfers, "transferencias internacionales de cada proveedor y su garantía; se completa en la revisión jurídica")] },
        { h: "Cuánto tiempo", p: [pending(legal.retention, "plazos de conservación; los fija el responsable")] },
        {
          h: "Tus derechos",
          p: [`Puedes pedir acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a ${site.email}. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).`],
        },
        { h: "Seguridad", p: ["La web funciona con conexión cifrada, las claves de los servicios solo están en el servidor y los registros técnicos de la web no guardan tus datos personales."] },
      ]}
    />
  );
}
