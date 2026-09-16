import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { site } from "@/data/site";

export const metadata = legalMetadata("Política de cookies", site.routes.cookies);

export default function Page() {
  return (
    <LegalPage
      title="Política de cookies"
      sections={[
        { h: "Cookies utilizadas", p: ["Actualmente este sitio no instala cookies de seguimiento ni de terceros. Si en el futuro se incorporan herramientas de analítica o publicidad, se solicitará el consentimiento previo y se detallarán aquí."] },
        { h: "Almacenamiento local", p: ["El sitio puede guardar preferencias de navegación en tu dispositivo. No se utilizan para identificarte."] },
      ]}
    />
  );
}
