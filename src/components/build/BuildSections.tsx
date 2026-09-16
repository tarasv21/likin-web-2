"use client";

import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Button, TextLink } from "@/components/ui/Button";
import { Check } from "@/components/ui/Icons";
import { useLead } from "@/components/layout/Providers";
import { stack } from "@/data/proof";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

/* ---------- Diagnóstico: three situations, one line each, cinematic typography ---------- */
const SITUATIONS = [
  ["Puede que tengas producto.", "Pero todavía vendes por Instagram o WhatsApp."],
  ["Puede que ya tengas web.", "Pero no representa el nivel de tu marca."],
  ["Puede que tengas Shopify.", "Pero sabes que podría vender mucho mejor."],
] as const;

export function BuildDiagnosis() {
  return (
    <section aria-labelledby="diag-title" className="border-t border-hairline bg-graphite">
      <div className="container-wide py-(--spacing-section)">
        <h2 id="diag-title" className="sr-only">
          ¿En qué punto estás?
        </h2>
        <ol className="grid gap-8 md:grid-cols-3 md:gap-8">
          {SITUATIONS.map(([a, b], i) => (
            <Reveal as="li" key={a} delay={i * 110} className="border-t border-hairline pt-5">
              <p className="text-statement">
                <span className="block text-cloud">{a}</span>
                <span className="block text-steel">{b}</span>
              </p>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={360} className="mt-12 md:mt-16">
          <p className="text-h2 max-w-[16ch]">
            No necesitas simplemente <span className="text-steel">otra web.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Qué incluye: four editorial columns, no cards ---------- */
const PILLARS = [
  ["01", "Store", "Shopify desde cero o migración. Estructura, colecciones, navegación, dominio, pagos, envíos y hasta 30 productos."],
  ["02", "Conversion", "Diseño responsive, UX/CRO, arquitectura comercial y fichas de producto pensadas para vender."],
  ["03", "Data", "Meta Pixel, eventos de conversión, Ads Manager y conexión técnica con Klaviyo."],
  ["04", "Autonomy", "Formación para gestionar productos, pedidos, descuentos, contenido y métricas sin depender de nadie."],
] as const;

export function BuildIncludes() {
  return (
    <section id="incluye" aria-labelledby="incluye-title" className="border-t border-hairline bg-obsidian">
      <div className="container-wide py-(--spacing-section)">
        <Reveal className="grid gap-4 md:grid-cols-12">
          <p className="text-label text-steel md:col-span-3">Qué incluye BUILD</p>
          <h2 id="incluye-title" className="text-h2 max-w-[16ch] md:col-span-9">
            Cuatro pilares. <span className="text-steel">Una tienda preparada para operar.</span>
          </h2>
        </Reveal>
        <ol className="mt-10 grid gap-8 border-t border-hairline pt-8 md:mt-14 md:grid-cols-4 md:gap-6 md:pt-10">
          {PILLARS.map(([n, k, t], i) => (
            <Reveal as="li" key={k} delay={i * 80}>
              <p className="text-label text-teal">{n}</p>
              <h3 className="text-h3 mt-3">{k}</h3>
              <p className="mt-3 max-w-[30ch] text-body text-steel">{t}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Autonomía: the USP. Shopify admin, conceptual, with a cursor doing the daily tasks ---------- */
const TASKS = ["Añadir producto", "Cambiar precio", "Gestionar pedido", "Crear descuento", "Editar contenido"];

export function BuildAutonomy() {
  return (
    <section id="autonomia" aria-labelledby="auto-title" className="border-t border-hairline bg-graphite">
      <div className="container-wide grid gap-10 py-(--spacing-section) md:grid-cols-12 md:items-center md:gap-8">
        <Reveal className="md:col-span-6">
          <p className="text-label text-steel">Tu negocio. Tu tienda. Tu control.</p>
          <h2 id="auto-title" className="text-h2 mt-4 max-w-[12ch]">
            Te hacemos la tienda. <span className="text-steel">No te hacemos dependiente.</span>
          </h2>
          <p className="mt-6 max-w-[42ch] text-body-xl text-cloud/85">Cuando terminamos, sabes utilizar lo que hemos construido. Productos, pedidos, precios, descuentos y contenido: el día a día de tu eCommerce, en tus manos.</p>
        </Reveal>
        <Reveal delay={100} className="md:col-span-6">
          <div className="overflow-hidden rounded-frame border border-white/8 bg-[#f6f6f7] text-ink shadow-depth">
            <div className="flex items-center justify-between border-b border-[#e3e5e4] bg-white px-4 py-2.5">
              <div className="flex items-center gap-3">
                <Image src={stack.find((s) => s.id === "shopify")!.src} alt="Shopify" width={100} height={40} sizes="70px" className="h-3.5 w-auto invert" />
                <span className="text-label text-ink-2">Admin</span>
              </div>
              <span className="text-label text-ink-2">tu-tienda.myshopify.com</span>
            </div>
            <div className="grid grid-cols-[112px_1fr] md:grid-cols-[150px_1fr]">
              <nav className="border-r border-[#e3e5e4] bg-white py-3 text-small text-ink-2" aria-hidden>
                {["Inicio", "Pedidos", "Productos", "Clientes", "Descuentos", "Contenido", "Analíticas"].map((n, i) => (
                  <p key={n} className={cn("px-4 py-1.5", i === 2 && "bg-[#eef1f0] text-ink")}>
                    {n}
                  </p>
                ))}
              </nav>
              <div className="p-4 md:p-5">
                <p className="text-small font-medium">Productos</p>
                <ul className="mt-3 divide-y divide-[#e3e5e4] border-y border-[#e3e5e4] text-small">
                  {["Vela Ámbar · 24,90 €", "Vela Higuera · 24,90 €", "Pack Descubrimiento · 59,00 €"].map((p) => (
                    <li key={p} className="flex items-center justify-between py-2">
                      <span>{p}</span>
                      <span className="rounded-[4px] bg-[#e5f5ee] px-1.5 py-0.5 text-[10px] text-[#0b6b4a]">Activo</span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tareas que aprendes a hacer">
                  {TASKS.map((t, i) => (
                    <li key={t} className="text-label inline-flex items-center gap-1.5 rounded-[6px] border border-[#d6d9d8] px-2 py-1 text-ink" style={{ animation: `build-block 10s var(--ease-out) ${i * 1.6}s infinite` }}>
                      <Check size={11} /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <p className="text-label mt-3 text-steel">Representación del panel de Shopify. Aprendes a hacer esto en la formación.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Por qué Shopify: small ---------- */
export function WhyShopify() {
  const shopify = stack.find((s) => s.id === "shopify")!;
  return (
    <section aria-labelledby="shopify-title" className="border-t border-hairline bg-obsidian">
      <div className="container-wide grid gap-8 py-(--spacing-section-s) md:grid-cols-12 md:items-start md:gap-8 md:py-(--spacing-section)">
        <Reveal className="md:col-span-6">
          <Image src={shopify.src} alt="Shopify" width={shopify.width} height={shopify.height} sizes="120px" className="h-6 w-auto opacity-80" />
          <h2 id="shopify-title" className="text-h2 mt-6 max-w-[14ch]">
            Shopify no es una de nuestras plataformas. <span className="text-steel">Es nuestra plataforma.</span>
          </h2>
        </Reveal>
        <ul className="grid gap-6 md:col-span-5 md:col-start-8 md:mt-2">
          {[
            ["Fácil de gestionar", "El panel lo entiende cualquiera. Por eso podemos enseñarte a llevarlo."],
            ["Construida para eCommerce", "Checkout, pagos, envíos, apps: todo pensado para vender, no adaptado."],
            ["Preparada para crecer", "La misma tienda sirve para tus primeros pedidos y para escalar con SCALE."],
          ].map(([k, t], i) => (
            <Reveal as="li" key={k} delay={i * 80} className="border-t border-hairline pt-4">
              <p className="font-medium text-cloud">{k}</p>
              <p className="mt-1 text-body text-steel">{t}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- BUILD → SCALE ---------- */
const PATH = [
  ["BUILD", "Construimos."],
  ["LAUNCH", "Empiezas."],
  ["GROW", "Aprendes y validas."],
  ["SCALE", "Delegas."],
] as const;

export function BuildToScale() {
  return (
    <section aria-labelledby="bts-title" className="border-t border-hairline bg-graphite">
      <div className="container-wide py-(--spacing-section)">
        <Reveal className="grid gap-4 md:grid-cols-12">
          <p className="text-label text-steel md:col-span-3">Después de BUILD</p>
          <h2 id="bts-title" className="text-h2 max-w-[14ch] md:col-span-9">
            BUILD no es el final. <span className="text-steel">Es donde empieza todo.</span>
          </h2>
        </Reveal>
        <div className="relative mt-10 md:mt-14">
          <Reveal kind="wipe" className="absolute inset-x-0 top-[5px] hidden h-px bg-teal/70 md:block" />
          <ol className="grid gap-6 md:grid-cols-4 md:gap-6">
            {PATH.map(([k, t], i) => (
              <Reveal as="li" key={k} delay={i * 110} className="relative md:pt-6">
                <span className={cn("absolute left-0 top-0 hidden size-[11px] rounded-full border-2 bg-graphite md:block", i === 3 ? "border-teal bg-teal" : "border-teal")} aria-hidden />
                <p className={cn("text-label", i === 3 ? "text-teal" : "text-steel")}>{k}</p>
                <p className="mt-2 text-h3">{t}</p>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal delay={200} className="mt-10 grid gap-4 border-t border-hairline pt-6 md:mt-12 md:grid-cols-12">
          <p className="max-w-[54ch] text-body text-steel md:col-span-8">Cuando tu eCommerce supera los {site.scale.minRevenue} y delegar empieza a tener sentido, podemos convertirnos en tu equipo de crecimiento.</p>
          <div className="md:col-span-4 md:justify-self-end">
            <TextLink href={site.routes.scale}>Descubre SCALE</TextLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Proceso (6 steps) + Sin sorpresas (fused) ---------- */
const STEPS = ["Cuéntanos tu proyecto", "Validamos encaje", "Construimos", "Revisamos", "Te enseñamos", "Lanzamos"];

export function BuildProcess() {
  return (
    <section aria-labelledby="bp-title" className="border-t border-hairline bg-obsidian">
      <div className="container-wide py-(--spacing-section)">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-label text-steel">Proceso</p>
            <h2 id="bp-title" className="text-h2 mt-4 max-w-[12ch]">
              Seis pasos. <span className="text-steel">Sin sorpresas.</span>
            </h2>
          </div>
          <p className="max-w-[40ch] text-small text-steel">
            <span className="text-label text-teal">Ready in ≤ {site.build.deliveryDays} days*</span>
            <br />* Desde que disponemos de toda la información y materiales necesarios. Proyectos fuera del alcance estándar se valoran por separado.
          </p>
        </Reveal>
        <div className="relative mt-10 md:mt-12">
          <Reveal kind="wipe" className="absolute inset-x-0 top-[5px] hidden h-px bg-teal/70 md:block" />
          <ol className="grid gap-5 sm:grid-cols-2 md:grid-cols-6 md:gap-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s} delay={i * 70} className="relative md:pt-6">
                <span className="absolute left-0 top-0 hidden size-[11px] rounded-full border-2 border-teal bg-obsidian md:block" aria-hidden />
                <p className="text-label text-teal">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-2 font-medium text-cloud">{s}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        <div className="mt-14 grid gap-8 border-t border-hairline pt-8 md:mt-16 md:grid-cols-12 md:pt-10">
          <Reveal className="md:col-span-4">
            <p className="text-label text-steel">Nosotros</p>
            <p className="mt-3 text-body-xl text-cloud">Construimos y configuramos BUILD: tienda, conversión, datos y formación.</p>
          </Reveal>
          <Reveal delay={80} className="md:col-span-4">
            <p className="text-label text-steel">Tú</p>
            <p className="mt-3 text-body-xl text-cloud">Marca, productos, fotografías, precios, información y accesos.</p>
          </Reveal>
          <Reveal delay={160} className="md:col-span-4">
            <p className="text-label text-steel">Costes externos</p>
            <p className="mt-3 text-body-xl text-cloud">Shopify · Dominio · Apps adicionales si fueran necesarias.</p>
            <p className="mt-3 text-small text-steel">Nunca añadiremos una herramienta de pago sin explicarte antes para qué sirve y cuánto cuesta.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Precio: protagonist, clean ---------- */
export function BuildPricing() {
  const { openLead } = useLead();
  const b = site.build;
  return (
    <section id="precio" aria-labelledby="precio-title" className="border-t border-hairline bg-graphite">
      <div className="container-wide grid gap-10 py-(--spacing-section-l) md:grid-cols-12 md:items-end md:gap-8">
        <Reveal className="md:col-span-8">
          <p className="text-label text-teal">Start building</p>
          <h2 id="precio-title" className="text-h2 mt-4">
            Tu eCommerce empieza en
          </h2>
          <p className="tnum text-metric mt-3 text-cloud">
            {b.priceFrom} € <span className="text-h3 align-middle text-steel">+ IVA</span>
          </p>
          <p className="tnum mt-4 text-body-xl text-steel">
            o {b.installments} pagos de {b.installmentAmount} € + IVA · 0 % interés*
          </p>
          <p className="text-label mt-6 text-steel">Shopify · Diseño · CRO · Tracking · Formación</p>
        </Reveal>
        <Reveal delay={120} className="md:col-span-4 md:justify-self-end">
          <Button size="lg" onClick={() => openLead("build", "precio")}>
            {site.cta.buildStore}
          </Button>
          <p className="mt-4 max-w-[30ch] text-small text-steel">Primero comprobaremos que tu proyecto encaja dentro del alcance de BUILD.</p>
          <p className="mt-2 text-xs text-steel">* Sujeto a las condiciones del sistema de pago utilizado.</p>
        </Reveal>
      </div>
    </section>
  );
}

