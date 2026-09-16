import { Button } from "@/components/ui/Button";
import { Fingerprint } from "@/components/brand/Fingerprint";
import { site } from "@/data/site";

export default function NotFound() {
  return (
    <section className="container-wide flex min-h-[80svh] flex-col justify-center pt-(--header-h)">
      <Fingerprint className="w-14 text-hairline" />
      <p className="text-label mt-8 text-steel">404</p>
      <h1 className="text-h2 mt-4 max-w-[14ch]">Esta página no ha dejado huella.</h1>
      <p className="mt-5 max-w-[40ch] text-body-xl text-steel">La URL no existe o se ha movido. Vuelve al inicio o mira los casos.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/">Volver al inicio</Button>
        <Button href={site.routes.work} variant="secondary">
          Ver casos de éxito
        </Button>
      </div>
    </section>
  );
}
