"use client";

import { Button } from "@/components/ui/Button";
import { Check } from "@/components/ui/Icons";
import { bookingUrl, integrations } from "@/lib/qualify/config";
import { track } from "@/lib/qualify/events";
import { site } from "@/data/site";
import type { Service, Verdict } from "@/lib/qualify/types";

/**
 * One screen per outcome. The internal classification (score, band, reasons) is never shown
 * and never implied: every version of this screen is a professional answer, including the
 * ones that end the conversation.
 */
export function ResultScreen({ service, verdict, stored, contactGiven, onClose, onSwitchToBuild }: { service: Service; verdict: Verdict; stored: boolean; contactGiven: boolean; onClose: () => void; onSwitchToBuild: () => void }) {
  const { next_action } = verdict;

  if (next_action === "STRIPE") return <ReadyBuild verdict={verdict} stored={stored} onClose={onClose} />;
  if (next_action === "BOOK_CALL") return <BookCall service={service} verdict={verdict} stored={stored} onClose={onClose} />;
  if (next_action === "MANUAL_REVIEW") return <ManualReview service={service} stored={stored} onClose={onClose} />;
  return <NotReady service={service} verdict={verdict} contactGiven={contactGiven} onClose={onClose} onSwitchToBuild={onSwitchToBuild} />;
}

function Frame({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-label text-teal">{eyebrow}</p>
      <h2 tabIndex={-1} className="text-h3 mt-4 max-w-[20ch] outline-none">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/**
 * Honest status line. When the intake is not connected the lead was NOT filed anywhere, so
 * instead of promising a reply we hand over the email and let the person keep the thread.
 */
function Delivery({ stored }: { stored: boolean }) {
  if (stored) {
    return (
      <p className="text-label mt-8 flex items-start gap-2 border-t border-hairline pt-5 text-steel">
        <Check size={14} className="mt-0.5 shrink-0 text-teal" />
        Hemos recibido tu solicitud. Te respondemos en 24–48 h laborables.
      </p>
    );
  }
  return (
    <div className="mt-8 border-t border-hairline pt-5">
      <p className="text-small text-steel">
        No hemos podido registrar la solicitud automáticamente. Escríbenos a{" "}
        <a href={`mailto:${site.email}`} className="text-cloud underline underline-offset-2 hover:text-teal">
          {site.email}
        </a>{" "}
        y la recuperamos sin que tengas que repetir nada.
      </p>
    </div>
  );
}

function ReadyBuild({ verdict, stored, onClose }: { verdict: Verdict; stored: boolean; onClose: () => void }) {
  const checkout = integrations.stripeBuildCheckoutUrl;
  const call = bookingUrl("BUILD");
  return (
    <Frame eyebrow="Encaje confirmado" title={<>Tu proyecto encaja con <span className="text-steel">BUILD.</span></>}>
      <p className="max-w-[46ch] text-body-xl text-cloud/85">Por lo que nos has contado, podemos empezar directamente.</p>
      <p className="mt-4 max-w-[46ch] text-body text-steel">
        BUILD desde {site.build.priceFrom} € + IVA. Tienda Shopify preparada para vender y formación para que puedas gestionarla tú.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {checkout ? (
          <Button size="lg" href={checkout} external onClick={() => track("build_checkout_clicked", { service: "BUILD", qualification: verdict.qualification, has_checkout_url: true })}>
            Empezar mi eCommerce
          </Button>
        ) : (
          <div className="rounded-card border border-hairline p-5">
            <p className="text-body text-cloud">El pago online estará disponible en breve.</p>
            <p className="mt-2 text-small text-steel">{stored ? "Te escribimos hoy mismo con el enlace para empezar y los siguientes pasos." : "Escríbenos y te pasamos el enlace para empezar."}</p>
          </div>
        )}
        {call ? (
          <a href={call} target="_blank" rel="noopener noreferrer" onClick={() => track("book_call_clicked", { service: "BUILD", qualification: verdict.qualification, has_booking_url: true })} className="group inline-flex items-center gap-2 text-body font-medium text-cloud/85 transition-colors hover:text-cloud">
            Prefiero hablar antes con vosotros
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        ) : (
          <p className="text-small text-steel">Si prefieres hablar antes, respóndenos al email y lo organizamos.</p>
        )}
      </div>
      <Delivery stored={stored} />
      <Close onClose={onClose} />
    </Frame>
  );
}

function BookCall({ service, verdict, stored, onClose }: { service: Service; verdict: Verdict; stored: boolean; onClose: () => void }) {
  const call = bookingUrl(service);
  const build = service === "BUILD";
  return (
    <Frame eyebrow="Encaje confirmado" title={build ? <>Tu proyecto encaja con <span className="text-steel">BUILD.</span></> : <>Encajamos. <span className="text-steel">Hablemos.</span></>}>
      <p className="max-w-[46ch] text-body-xl text-cloud/85">{build ? "Antes de empezar queremos revisar contigo algunos detalles." : "Por lo que nos has contado, tu eCommerce está en un punto donde SCALE tiene sentido."}</p>
      <p className="mt-4 max-w-[48ch] text-body text-steel">En la llamada revisamos tu tienda y tus números y te decimos con qué empezaríamos. Sin presentación comercial.</p>

      <div className="mt-8">
        {call ? (
          <Button size="lg" href={call} external onClick={() => track("book_call_clicked", { service, qualification: verdict.qualification, has_booking_url: true })}>
            Reservar reunión
          </Button>
        ) : (
          <div className="rounded-card border border-hairline p-5">
            <p className="text-body text-cloud">{stored ? "Te escribimos en menos de 24 h laborables con horarios." : "La agenda online todavía no está abierta."}</p>
            <p className="mt-2 text-small text-steel">Mientras tanto organizamos la reunión por email.</p>
          </div>
        )}
      </div>
      <Delivery stored={stored} />
      <Close onClose={onClose} />
    </Frame>
  );
}

function ManualReview({ service, stored, onClose }: { service: Service; stored: boolean; onClose: () => void }) {
  return (
    <Frame eyebrow="Lo estamos revisando" title={<>Tu proyecto necesita una <span className="text-steel">solución más personalizada.</span></>}>
      <p className="max-w-[48ch] text-body-xl text-cloud/85">Queremos revisar lo que nos has contado antes de decirte que sí.</p>
      <p className="mt-4 max-w-[50ch] text-body text-steel">
        {service === "BUILD"
          ? "Lo que necesitas se sale del alcance estándar, así que preferimos estudiarlo y darte una propuesta real en vez de un precio que luego no encaje."
          : "Hay detalles de tu situación que queremos entender bien antes de proponerte un modelo de colaboración."}
      </p>
      <Delivery stored={stored} />
      <Close onClose={onClose} />
    </Frame>
  );
}

function NotReady({ service, verdict, contactGiven, onClose, onSwitchToBuild }: { service: Service; verdict: Verdict; contactGiven: boolean; onClose: () => void; onSwitchToBuild: () => void }) {
  const reason = verdict.qualification_reasons[0];
  const budget = reason === "BUILD_BUDGET_BELOW_MINIMUM";
  const noProduct = reason === "BUILD_PRODUCT_NOT_DEFINED";
  const noSales = reason === "SCALE_NO_SALES";

  return (
    <Frame
      eyebrow="Gracias por contárnoslo"
      title={budget ? <>Ahora mismo <span className="text-steel">no somos tu mejor opción.</span></> : noProduct ? <>Parece que todavía es <span className="text-steel">pronto para BUILD.</span></> : noSales ? <>Antes de escalar, <span className="text-steel">hay que vender.</span></> : <>Todavía no es <span className="text-steel">el momento.</span></>}
    >
      {budget && (
        <p className="max-w-[48ch] text-body-xl text-cloud/85">
          BUILD parte desde {site.build.priceFrom} € + IVA, así que probablemente no seamos la opción adecuada para lo que buscas en este momento.
        </p>
      )}
      {noProduct && (
        <p className="max-w-[50ch] text-body-xl text-cloud/85">
          Antes de construir tu eCommerce necesitas tener definido qué vas a vender y cómo vas a producirlo o suministrarlo. Cuando tengas esa parte preparada, estaremos encantados de hablar.
        </p>
      )}
      {noSales && (
        <p className="max-w-[50ch] text-body-xl text-cloud/85">
          SCALE está pensado para tiendas que ya venden. Si todavía no has empezado, lo primero es tener una tienda preparada para vender.
        </p>
      )}
      {!budget && !noProduct && !noSales && (
        <p className="max-w-[50ch] text-body-xl text-cloud/85">
          Por lo que nos has contado, todavía no tenemos la combinación necesaria para que nuestro trabajo tenga el efecto que buscas.
        </p>
      )}

      {verdict.recommend_service === "BUILD" && service === "SCALE" && (
        <div className="mt-7 rounded-card border border-hairline p-5">
          <p className="text-label text-teal">Likin Build</p>
          <p className="mt-2 text-body text-cloud">Creamos tu tienda Shopify preparada para vender y te enseñamos a gestionarla.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button type="button" onClick={onSwitchToBuild} className="group inline-flex items-center gap-2 text-body font-medium text-cloud transition-colors hover:text-teal">
              Comprobar si encajo con BUILD <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
            <a href={site.routes.build} className="text-small text-steel underline underline-offset-4 transition-colors hover:text-cloud">
              Ver cómo funciona
            </a>
          </div>
        </div>
      )}

      <p className="mt-7 text-body text-steel">
        {contactGiven ? "Guardamos tus datos por si la situación cambia." : "Cuando cambie la situación, escríbenos y lo vemos."}{" "}
        <a href={`mailto:${site.email}`} className="text-cloud underline underline-offset-2 hover:text-teal">
          {site.email}
        </a>
      </p>
      <Close onClose={onClose} label="Cerrar" />
    </Frame>
  );
}

function Close({ onClose, label = "Volver a la web" }: { onClose: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClose} className="mt-6 text-small text-steel underline underline-offset-4 transition-colors hover:text-cloud">
      {label}
    </button>
  );
}
