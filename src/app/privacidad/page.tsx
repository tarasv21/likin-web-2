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
            "Además, cómo llegaste a la web (página de llegada, web de origen, parámetros de la campaña e identificador del clic si vienes de un anuncio), solo si envías el formulario.",
            "Nombre, email, teléfono y la casilla de consentimiento son obligatorios: sin ellos no podemos responderte. El resto es opcional o depende de tus respuestas.",
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
            "Meta Platforms Ireland: solo si aceptas las cookies de medición, recibe mediante su píxel las páginas que visitas (con la dirección completa, incluidos los parámetros de campaña y el identificador del clic), el aviso de que has enviado una solicitud con el tipo de formulario y un identificador de la solicitud, los identificadores de sus cookies y los datos técnicos de tu conexión y navegador, como la dirección IP. Nunca tu nombre, email, teléfono ni tus respuestas.",
          ],
        },
        { h: "Transferencias internacionales", p: [pending(legal.transfers, "transferencias internacionales de cada proveedor y su garantía; se completa en la revisión jurídica")] },
        { h: "Cuánto tiempo", p: [pending(legal.retention, "plazos de conservación; los fija el responsable")] },
        {
          h: "Tus derechos",
          p: [`Puedes pedir acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a ${site.email}. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).`],
        },
        { h: "Seguridad", p: ["La web funciona con conexión cifrada y las claves de los servicios solo están en el servidor. Los registros de la aplicación guardan un identificador y el resultado de cada envío, sin tus datos de contacto ni tus respuestas. Vercel, como proveedor de alojamiento, registra datos técnicos de las peticiones (como la dirección IP) para el funcionamiento y la seguridad del servicio."] },
      ]}
    />
  );
}
