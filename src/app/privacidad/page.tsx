import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";

export const metadata = legalMetadata("Política de privacidad", site.routes.privacy);

export default function Page() {
  return (
    <LegalPage
      title="Política de privacidad"
      sections={[
        { h: "Responsable", p: [`${site.name} · ${site.email}.`] },
        { h: "Datos que recogemos", p: ["Los datos que nos facilitas a través de los formularios de contacto y precualificación (nombre, email, teléfono opcional, marca, web y respuestas sobre tu negocio) se utilizan únicamente para valorar el encaje de tu proyecto y responderte."] },
        { h: "Derechos", p: [`Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición y portabilidad escribiendo a ${site.email}.`] },
      ]}
    />
  );
}
