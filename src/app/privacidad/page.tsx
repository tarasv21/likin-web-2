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
            "Los que nos das en el formulario de precualificación: nombre, email, teléfono, nombre y enlace de tu marca (web o Instagram), tus respuestas sobre el negocio (por ejemplo, facturación, inversión en publicidad o plataforma), lo que quieras contarnos y tus consentimientos, con la fecha y la versión de esta política.",
            "Además, cómo llegaste a la web (página de llegada, web de origen, parámetros de la campaña e identificador del clic si vienes de un anuncio), solo si envías el formulario.",
            "Nombre, email y teléfono son obligatorios, y marcar que has leído esta política: sin ellos no podemos responderte. El resto es opcional o depende de tus respuestas.",
            "Si aceptas cookies, los datos de navegación que explicamos en la política de cookies.",
          ],
        },
        {
          h: "Para qué",
          p: [
            "Para valorar si podemos ayudarte, responderte y, si encaja, preparar una propuesta y hacer el seguimiento comercial de tu solicitud. También para saber qué canales y campañas nos traen solicitudes.",
            "Si marcas la casilla de novedades, para enviarte contenidos de LIKIN Agency.",
            "Si aceptas la analítica en el aviso de cookies, para saber cómo se usa la web (Google Analytics y Microsoft Clarity).",
            "Si aceptas la publicidad en el aviso de cookies, para medir con Meta qué anuncios nos traen visitas y solicitudes.",
          ],
        },
        {
          h: "Base jurídica",
          p: [
            "Valorar tu solicitud, responderte, preparar una propuesta y hacer su seguimiento: la aplicación de medidas precontractuales a petición tuya (art. 6.1.b del RGPD). Nos pides una valoración y una propuesta, y para dártelas necesitamos esos datos; no depende de las cookies que aceptes.",
            "Saber qué canal o campaña nos trajo tu solicitud: nuestro interés legítimo en medir nuestra publicidad (art. 6.1.f del RGPD). Solo usamos los datos de llegada que se envían con la solicitud y puedes oponerte escribiéndonos.",
            "Enviarte contenidos y novedades: tu consentimiento, con la casilla opcional del formulario.",
            "Analítica (Google Analytics y Microsoft Clarity) y publicidad (Meta): tu consentimiento en el aviso de cookies, cada una por separado.",
            "Puedes retirar cualquier consentimiento cuando quieras, sin que afecte a lo hecho antes. Si tu solicitud se convierte en un encargo, la base es ese contrato y, para conservar su documentación, el cumplimiento de nuestras obligaciones legales (por ejemplo, fiscales).",
          ],
        },
        {
          h: "Cómo valoramos tu solicitud",
          p: ["Con tus respuestas el formulario calcula una estimación del encaje de tu proyecto con nuestros servicios y te muestra el siguiente paso recomendado. Todas las solicitudes nos llegan y las atiende una persona: la estimación sirve para priorizar la respuesta. Esa valoración se queda en nuestro CRM y en nuestro correo: no la enviamos a Meta, a Google ni a Microsoft."],
        },
        {
          h: "Quién más trata tus datos",
          p: [
            "No vendemos ni cedemos tus datos. Estos proveedores los tratan por nuestra cuenta (como encargados del tratamiento), solo para prestarnos su servicio:",
            "Vercel: alojamiento y funcionamiento de la web y de LIKIN CRM, incluido el envío del formulario.",
            "Supabase: base de datos de LIKIN CRM, nuestra herramienta interna, donde guardamos tu solicitud y su seguimiento. Está alojada en Fráncfort (Alemania).",
            "Resend: envío a nuestro buzón del email con tu solicitud y una copia completa de sus datos en un archivo adjunto. Nos llega siempre, también como respaldo por si el CRM no está disponible.",
            "GitHub: copias de seguridad de la base de datos de LIKIN CRM. Se hacen y se comprueban en sus servidores y se guardan cifradas: solo nosotros tenemos la clave para abrirlas.",
            "Google: correo electrónico de LIKIN Agency (Google Workspace), donde recibimos tu solicitud, y, solo si aceptas la analítica, Google Analytics, que recibe las páginas que visitas, de dónde llegas y cómo navegas, con el identificador de su cookie y datos técnicos de tu navegador y dispositivo. A Google Analytics no le enviamos tu nombre, tu email, tu teléfono ni tus respuestas.",
            "Otros responsables, que deciden por su cuenta sobre los datos que reciben:",
            "Microsoft (Microsoft Clarity), solo si aceptas la analítica: recibe cómo navegas por la web (clics, desplazamiento y páginas, para mapas de calor y grabaciones de la navegación), con el identificador de su cookie y datos técnicos de tu navegador y dispositivo. Lo que escribes o eliges en el formulario queda oculto y no se graba. Microsoft trata estos datos como responsable, según su declaración de privacidad (privacy.microsoft.com); en la Unión Europea, a través de Microsoft Ireland Operations Limited.",
            "Meta Platforms Ireland: solo si aceptas la publicidad. Desde tu navegador (píxel) y desde nuestro servidor (API de Conversiones) recibe dos eventos: cada página que visitas (con la dirección completa, incluidos los parámetros de campaña y el identificador del clic, y la página de la que vienes) y el aviso de que has enviado una solicitud, con el tipo de servicio que pides (BUILD o SCALE). Con ellos van un identificador de cada evento, los identificadores de sus cookies y los datos técnicos de tu conexión y navegador, como la dirección IP. Nunca le enviamos tu nombre, tu email, tu teléfono, tus respuestas ni la valoración de tu solicitud, tampoco cifrados.",
            "Para recoger y enviar esos datos a Meta, Meta Platforms Ireland y nosotros somos corresponsables del tratamiento, según las condiciones de Meta para sus herramientas para empresas. Lo que Meta hace después con ellos lo decide Meta como responsable, según su política de privacidad (facebook.com/privacy/policy), donde también puedes ejercer tus derechos ante Meta. Puedes ejercerlos igualmente ante nosotros.",
          ],
        },
        { h: "Transferencias internacionales", p: legal.transfers },
        { h: "Cuánto tiempo", p: legal.retention },
        {
          h: "Tus derechos",
          p: [
            `Puedes pedir acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, y retirar tus consentimientos, escribiendo a ${site.email}. Las cookies las cambias tú mismo con «Configurar cookies», en el pie de cualquier página.`,
            "Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).",
          ],
        },
        { h: "Seguridad", p: ["La web funciona con conexión cifrada y las claves de los servicios solo están en el servidor. El CRM solo es accesible para nuestro equipo, con verificación en dos pasos para los administradores. Los registros de la aplicación guardan un identificador y el resultado de cada envío, sin tus datos de contacto ni tus respuestas. Vercel, como proveedor de alojamiento, registra datos técnicos de las peticiones (como la dirección IP) para el funcionamiento y la seguridad del servicio."] },
      ]}
    />
  );
}
