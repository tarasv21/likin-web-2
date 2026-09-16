import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";

export const metadata = legalMetadata("Aviso legal", site.routes.legal);

export default function Page() {
  return (
    <LegalPage
      title="Aviso legal"
      sections={[
        { h: "Titular", p: [`Este sitio web es propiedad de ${site.name}. Contacto: ${site.email}. Los datos identificativos completos (razón social, NIF y domicilio) se incluirán en la versión definitiva.`] },
        { h: "Objeto", p: ["Este aviso regula el acceso y uso del sitio web likinagency.com. La navegación por el sitio atribuye la condición de usuario e implica la aceptación de estas condiciones."] },
        { h: "Propiedad intelectual", p: ["Los contenidos, marca, huella y materiales del sitio pertenecen a Likin Agency o a sus clientes, que han autorizado su uso. Las marcas de terceros pertenecen a sus respectivos titulares."] },
      ]}
    />
  );
}
