import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";
import { legal } from "@/data/legal";

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
            "Si aceptas las cookies de medición, para saber cómo se usa la web (Google Analytics y Microsoft Clarity) y medir con Meta qué anuncios nos traen visitas y solicitudes (lo explicamos en la política de cookies).",
          ],
        },
        {
          h: "Base jurídica",
          p: ["Tu consentimiento: al marcar la casilla del formulario, para tratar tus datos y responder a tu solicitud; con la casilla de novedades, que es opcional, para enviarte contenidos; y en el aviso de cookies, para la medición con Google Analytics, Microsoft Clarity y Meta. Puedes retirar cualquiera de ellos cuando quieras, sin que afecte a lo hecho antes."],
        },
        {
          h: "Cómo valoramos tu solicitud",
          p: ["Con tus respuestas el formulario calcula una estimación del encaje de tu proyecto con nuestros servicios y te muestra el siguiente paso recomendado. Todas las solicitudes nos llegan y las atiende una persona: la estimación sirve para priorizar la respuesta. Si aceptas las cookies de medición, esa valoración llega también a Meta con el aviso de tu solicitud, para medir qué anuncios traen solicitudes que encajan."],
        },
        {
          h: "Quién más trata tus datos",
          p: [
            "No vendemos ni cedemos tus datos. Para funcionar usamos estos proveedores, que los tratan por nuestra cuenta:",
            "Vercel: alojamiento y funcionamiento de la web, incluido el envío del formulario.",
            "Supabase: base de datos de LIKIN CRM, nuestra herramienta interna, donde guardamos tu solicitud y su seguimiento. Está alojada en Fráncfort (Alemania).",
            "Resend: envío del email con tu solicitud y con el aviso de que ha llegado a nuestro buzón.",
            "Google: correo electrónico de LIKIN Agency (Google Workspace), donde recibimos tu solicitud, y, solo si aceptas las cookies de medición, Google Analytics, que recibe las páginas que visitas, de dónde llegas y cómo navegas, con el identificador de su cookie y datos técnicos de tu navegador y dispositivo. A Google Analytics no le enviamos tu nombre, tu email, tu teléfono ni tus respuestas.",
            "Microsoft (Microsoft Clarity): solo si aceptas las cookies de medición. Recibe cómo navegas por la web (clics, desplazamiento y páginas, para mapas de calor y grabaciones de la navegación), con el identificador de su cookie y datos técnicos de tu navegador y dispositivo. Lo que escribes o eliges en el formulario queda oculto y no se graba.",
            "Meta Platforms Ireland: solo si aceptas las cookies de medición. Desde tu navegador (píxel) y desde nuestro servidor (API de Conversiones) recibe las páginas que visitas (con la dirección completa, incluidos los parámetros de campaña y el identificador del clic), los clics en nuestro email, en el enlace de reserva y en el botón de pago, cuándo abres el formulario (y desde qué botón) y cuándo llegas a su último paso, y el aviso de que has enviado una solicitud con el tipo de formulario y la valoración de encaje que calcula el formulario (por ejemplo, «encaje alto» o «revisión manual»), con un identificador de cada evento, los identificadores de sus cookies y los datos técnicos de tu conexión y navegador, como la dirección IP. Cuando envías el formulario, también tu email, tu teléfono y tu nombre de pila, cifrados con un hash irreversible (SHA-256) antes de salir de nuestro servidor, para que Meta pueda relacionar la solicitud con tu cuenta. Nunca tus respuestas.",
          ],
        },
        { h: "Transferencias internacionales", p: legal.transfers },
        { h: "Cuánto tiempo", p: legal.retention },
        {
          h: "Tus derechos",
          p: [`Puedes pedir acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a ${site.email}. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).`],
        },
        { h: "Seguridad", p: ["La web funciona con conexión cifrada y las claves de los servicios solo están en el servidor. El CRM solo es accesible para nuestro equipo, con verificación en dos pasos para los administradores. Los registros de la aplicación guardan un identificador y el resultado de cada envío, sin tus datos de contacto ni tus respuestas. Vercel, como proveedor de alojamiento, registra datos técnicos de las peticiones (como la dirección IP) para el funcionamiento y la seguridad del servicio."] },
      ]}
    />
  );
}
