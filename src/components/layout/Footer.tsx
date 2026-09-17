import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Fingerprint } from "@/components/brand/Fingerprint";
import { ArrowUpRight, Instagram, LinkedIn, Mail } from "@/components/ui/Icons";
import { site } from "@/data/site";
import { ContactLink } from "./ContactLink";

export function Footer() {
  return (
    <footer className="relative border-t border-hairline bg-obsidian">
      <div className="container-wide grid gap-10 py-12 md:grid-cols-12 md:gap-8 md:py-14">
        <div className="md:col-span-5">
          <Logo height={20} />
          <p className="mt-5 max-w-[38ch] text-body text-steel">Agencia especializada en eCommerce. Creamos tiendas en Shopify y escalamos las que ya venden con Paid Media, CRO y Retention.</p>
          <ul className="mt-6 flex gap-2">
            {(
              [
                [site.social.instagram, "Instagram de Likin Agency", Instagram],
                [site.social.linkedinCompany, "LinkedIn de Likin Agency", LinkedIn],
                [`mailto:${site.email}`, `Escribir a ${site.email}`, Mail],
              ] as const
            ).map(([href, label, Icon]) => (
              <li key={href}>
                <a href={href} target={href.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full border border-hairline text-steel transition-colors hover:border-steel hover:text-cloud">
                  <Icon size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <nav aria-label="Pie de página" className="grid grid-cols-2 gap-8 md:col-span-6 md:col-start-7 md:grid-cols-3">
          <div>
            <p className="text-label text-steel">Servicios</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href={site.routes.build} className="text-cloud/85 transition-colors hover:text-teal">
                  BUILD · Crear eCommerce
                </Link>
              </li>
              <li>
                <Link href={site.routes.scale} className="text-cloud/85 transition-colors hover:text-teal">
                  SCALE · Escalar eCommerce
                </Link>
              </li>
              <li>
                <Link href={site.routes.work} className="text-cloud/85 transition-colors hover:text-teal">
                  Work
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-label text-steel">Likin</p>
            <ul className="mt-4 space-y-3">
              <li>
                <a href={site.founder.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cloud/85 transition-colors hover:text-teal">
                  ¿Quién hay detrás? <ArrowUpRight size={12} />
                </a>
              </li>
              <li>
                <ContactLink source="footer" className="text-cloud/85 transition-colors hover:text-teal">
                  Contacto
                </ContactLink>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="text-small text-cloud/85 transition-colors hover:text-teal [overflow-wrap:anywhere]">
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-label text-steel">Legal</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href={site.routes.legal} className="text-cloud/85 transition-colors hover:text-teal">
                  Aviso legal
                </Link>
              </li>
              <li>
                <Link href={site.routes.privacy} className="text-cloud/85 transition-colors hover:text-teal">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href={site.routes.cookies} className="text-cloud/85 transition-colors hover:text-teal">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="md:col-span-1 md:col-start-12 md:justify-self-end">
          <Fingerprint className="w-9 text-hairline" />
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="container-wide flex flex-col gap-2 py-5 text-xs text-steel md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Likin Agency. Todos los derechos reservados.</p>
          <p className="text-label">Make your mark.</p>
        </div>
      </div>
    </footer>
  );
}
