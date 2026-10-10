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
        { h: "Propiedad intelectual", p: [`Los contenidos, marca, huella y materiales del sitio pertenecen a ${legal.tradeName} o a sus clientes, que han autorizado su uso. Las marcas de terceros pertenecen a sus respectivos titulares.`] },
        { h: "Privacidad y cookies", p: ["El tratamiento de datos personales se explica en la política de privacidad y el uso de cookies en la política de cookies."] },
      ]}
    />
  );
}
