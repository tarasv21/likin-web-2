"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ArrowRight, ArrowUpRight, Close, Menu } from "@/components/ui/Icons";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import { useLead } from "./Providers";

type Ctx = "home" | "build" | "scale" | "work";

function useCtx(): Ctx {
  const p = usePathname();
  if (p.startsWith(site.routes.build)) return "build";
  if (p.startsWith(site.routes.scale)) return "scale";
  if (p.startsWith(site.routes.work)) return "work";
  return "home";
}

/**
 * HEADER — integrated in the hero at the top (transparent, hairline-free), then a
 * floating dark-glass capsule narrower than the viewport once you scroll.
 * Desktop: LIKIN · Servicios ▾ · Work · ¿Quién hay detrás? ↗ · CTA. Mobile: LIKIN · CTA · menu.
 */
export function Header() {
  const ctx = useCtx();
  const pathname = usePathname();
  const { openLead } = useLead();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    // The capsule appears when we leave the hero (its pinned track ends), not on the first
    // scroll: during the film the header stays part of the scene.
    const threshold = () => {
      const hero = document.getElementById("hero");
      if (!hero || hero.offsetHeight <= window.innerHeight * 1.2) return 56;
      return hero.offsetHeight - window.innerHeight * 0.92;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > threshold());
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setServicesOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!servicesOpen) return;
    const onDoc = (e: PointerEvent) => {
      if (!servicesRef.current?.contains(e.target as Node)) setServicesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setServicesOpen(false);
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen]);

  const ctaLabel = ctx === "build" ? site.cta.buildStore : ctx === "scale" ? site.cta.scaleShort : site.cta.mark;
  const ctaTrack = ctx === "build" ? "build" : ctx === "scale" ? "scale" : undefined;
  const capsule = scrolled && !menuOpen;

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-button focus:bg-teal focus:px-4 focus:py-2 focus:text-obsidian">
        Saltar al contenido
      </a>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-(--z-header)">
        <div
          className={cn(
            "pointer-events-auto mx-auto flex items-center justify-between transition-[max-width,margin,padding,background-color,border-radius,box-shadow,height] duration-(--dur-slow) ease-(--ease-out)",
            capsule
              ? "mt-3 h-14 max-w-[calc(100%_-_24px)] rounded-pill px-3 pl-5 glass shadow-capsule md:mt-4 md:max-w-[920px] md:px-2.5 md:pl-6"
              : "mt-0 h-(--header-h) max-w-(--container-wide) rounded-none bg-transparent px-(--spacing-gutter)",
            menuOpen && "bg-obsidian",
          )}
        >
          <Logo priority height={capsule ? 18 : 22} />

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            <div ref={servicesRef} className="relative">
              <button
                type="button"
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                onClick={() => setServicesOpen((v) => !v)}
                className={cn("inline-flex h-10 items-center gap-1.5 rounded-button px-3 text-[0.95rem] transition-colors", ctx === "build" || ctx === "scale" ? "text-cloud" : "text-cloud/75 hover:text-cloud")}
              >
                Servicios
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={cn("transition-transform duration-(--dur-fast)", servicesOpen && "rotate-180")}>
                  <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                hidden={!servicesOpen}
                className="absolute left-0 top-[calc(100%+10px)] w-[340px] rounded-card border border-hairline bg-card p-2 shadow-float"
                role="menu"
              >
                {(
                  [
                    ["build", "BUILD", "Crear mi eCommerce", "Tienda Shopify preparada para vender.", site.routes.build],
                    ["scale", "SCALE", "Escalar mi eCommerce", "Paid Media, CRO y Retention como un sistema.", site.routes.scale],
                  ] as const
                ).map(([k, tag, t, d, href]) => (
                  <Link key={k} href={href} role="menuitem" aria-current={ctx === k ? "page" : undefined} className={cn("group flex items-center justify-between gap-3 rounded-[10px] p-3.5 transition-colors hover:bg-graphite", ctx === k && "bg-graphite")}>
                    <span>
                      <span className="text-label block text-teal">{tag}</span>
                      <span className="mt-1 block font-medium text-cloud">{t}</span>
                      <span className="mt-0.5 block text-small text-steel">{d}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-steel transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>
            <Link href={site.routes.work} aria-current={ctx === "work" ? "page" : undefined} className={cn("inline-flex h-10 items-center rounded-button px-3 text-[0.95rem] transition-colors", ctx === "work" ? "text-cloud" : "text-cloud/75 hover:text-cloud")}>
              Work
            </Link>
            <a href={site.founder.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1 rounded-button px-3 text-[0.95rem] text-cloud/75 transition-colors hover:text-cloud">
              ¿Quién hay detrás? <ArrowUpRight size={13} className="opacity-70" />
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openLead(ctaTrack, "header")}
              className={cn(
                "group/cta inline-flex h-10 items-center gap-2 rounded-button px-3.5 text-[0.95rem] font-medium transition-[background-color,color,border-color] duration-(--dur-fast)",
                capsule ? "bg-teal text-obsidian hover:bg-mint" : "text-cloud/85 hover:text-cloud",
                "max-md:hidden",
              )}
            >
              {ctaLabel}
              <ArrowRight size={16} className="transition-transform group-hover/cta:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => openLead(ctaTrack, "header")}
              className={cn("inline-flex h-10 items-center rounded-button px-3.5 text-[0.9rem] font-medium md:hidden", capsule ? "bg-teal text-obsidian" : "text-cloud/90")}
            >
              {ctx === "build" ? "Crear tienda" : ctx === "scale" ? "Escalar" : "Dejar huella"}
            </button>
            <button
              type="button"
              className={cn("grid size-10 place-items-center rounded-button text-cloud md:hidden", capsule || menuOpen ? "border border-outline" : "border border-white/10")}
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div id="menu-movil" hidden={!menuOpen} className="fixed inset-0 z-[39] bg-obsidian pt-(--header-h) md:hidden">
        <nav aria-label="Principal móvil" className="container-wide flex h-full flex-col overflow-y-auto pb-8 pt-4">
          <p className="text-label text-steel">Dos caminos</p>
          <Link href={site.routes.build} className="mt-3 flex items-center justify-between border-t border-hairline py-5">
            <span>
              <span className="text-label block text-teal">BUILD</span>
              <span className="mt-1 block text-h3">Crear mi eCommerce</span>
            </span>
            <ArrowRight className="text-steel" />
          </Link>
          <Link href={site.routes.scale} className="flex items-center justify-between border-y border-hairline py-5">
            <span>
              <span className="text-label block text-teal">SCALE</span>
              <span className="mt-1 block text-h3">Escalar mi eCommerce</span>
            </span>
            <ArrowRight className="text-steel" />
          </Link>
          <Link href={site.routes.work} className="mt-6 flex items-center justify-between border-b border-hairline py-4 text-h3">
            Work <ArrowRight className="text-steel" />
          </Link>
          <a href={site.founder.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border-b border-hairline py-4 text-h3">
            ¿Quién hay detrás? <ArrowUpRight className="text-steel" />
          </a>
          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openLead(ctaTrack, "menu");
              }}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-button bg-teal text-[1.0625rem] font-medium text-obsidian"
            >
              {ctaLabel} <ArrowRight size={18} />
            </button>
            <p className="mt-5 text-small text-steel">
              <a href={`mailto:${site.email}`} className="hover:text-cloud">
                {site.email}
              </a>
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
