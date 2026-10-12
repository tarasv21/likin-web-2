import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";
import { legal } from "@/data/legal";

export const metadata = legalMetadata("Aviso legal", site.routes.legal);

export default function Page() {
  return (
    <LegalPage
      title="Aviso legal"
      sections={[
        {
          h: "Titular",
          p: [
            `El titular de este sitio web (likinagency.com) es ${legal.holder}, ${legal.legalForm}, con nombre comercial ${legal.tradeName}.`,
            `NIF/NIE: ${legal.taxId}. Domicilio: ${legal.address}. Correo electrónico: ${site.email}.`,
          ],
        },
        { h: "Objeto", p: [`Este aviso regula el acceso y uso del sitio web likinagency.com, dedicado a presentar los servicios de ${legal.tradeName} de creación y crecimiento de tiendas online. La navegación por el sitio atribuye la condición de usuario e implica la aceptación de estas condiciones.`] },
        { h: "Uso del sitio", p: ["El usuario se compromete a usar el sitio de forma lícita y a no dañar su funcionamiento ni el de los servicios que lo hacen posible. La información del sitio sobre servicios, plazos y resultados es orientativa: las condiciones de cada encargo son las de la propuesta que se acepte."] },
        { h: "Propiedad intelectual", p: [`Los contenidos, marca, huella y materiales del sitio pertenecen a ${legal.tradeName} o a sus clientes, que han autorizado su uso. Las marcas de terceros pertenecen a sus respectivos titulares.`] },
        { h: "Enlaces a otras webs", p: ["El sitio enlaza a webs de terceros (por ejemplo, Instagram o LinkedIn). No controlamos sus contenidos ni su tratamiento de datos, que se rigen por sus propias condiciones y políticas."] },
        { h: "Privacidad y cookies", p: ["El tratamiento de datos personales se explica en la política de privacidad y el uso de cookies en la política de cookies."] },
        { h: "Legislación aplicable", p: ["Este aviso se rige por la legislación española. Si eres consumidor, puedes acudir a los tribunales de tu domicilio."] },
      ]}
    />
  );
}
