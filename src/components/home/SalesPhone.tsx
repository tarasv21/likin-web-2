"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/ui/Frames";
import { Fingerprint } from "@/components/brand/Fingerprint";
import { notifications } from "@/data/proof";
import { useReducedMotion, useScrollProgress } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * SHOPIFY SALES — one of two pinned moments on the home.
 * A phone turns from perspective to face the camera while real Shopify notification
 * assets (demo values, labelled as such) stack up like a lock screen. The concept:
 * your eCommerce keeps selling while you are not looking.
 */
const ORDER = [0, 1, 2, 3, 4, 5];
const STARTS = [0.26, 0.38, 0.5, 0.6, 0.7, 0.8];

export function SalesPhone() {
  const reduced = useReducedMotion();
  const { ref, subscribe } = useScrollProgress<HTMLDivElement>("pin");
  const phone = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(
    () =>
      subscribe((p) => {
        if (reduced) return;
        // rotation: perspective → facing camera between 0 and 0.32
        const t = Math.min(1, p / 0.32);
        const e = 1 - Math.pow(1 - t, 3);
        if (phone.current) phone.current.style.transform = `rotateY(${-32 + 32 * e}deg) rotateX(${8 - 8 * e}deg) translateZ(0)`;
        const n = STARTS.filter((s) => p >= s).length;
        setCount((c) => (c === n ? c : n));
        setDone((d) => (d === p > 0.86 ? d : p > 0.86));
      }),
    [subscribe, reduced],
  );

  const shown = reduced ? notifications.length : count;
  const finished = reduced || done;

  return (
    <section id="ventas" aria-labelledby="ventas-title" className="bg-obsidian">
      <div ref={ref} className={cn("relative", !reduced && "h-[240svh] md:h-[230vh]")}>
        <div className={cn(reduced ? "section-pad" : "sticky top-0 flex min-h-[100svh] flex-col justify-center overflow-hidden pt-(--header-h) pb-8")}>
          <div className="container-wide grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-5">
              <p className="text-label text-steel">Cuando el sistema funciona</p>
              <h2 id="ventas-title" className="text-h2 mt-4 max-w-[14ch]">
                Tu eCommerce sigue vendiendo <span className="text-steel">aunque tú no estés mirando.</span>
              </h2>
              <p className={cn("mt-6 max-w-[34ch] text-body-xl text-cloud/85 transition-opacity duration-(--dur-slow)", finished ? "opacity-100" : "opacity-0 md:opacity-0")} aria-hidden={!finished}>
                Eso es lo que queremos construir.
              </p>
              <p className="mt-6 text-xs text-steel">Simulación con notificaciones de ejemplo. No son resultados de clientes.</p>
            </div>

            <div className="md:col-span-7 md:justify-self-end" style={{ perspective: "1600px" }}>
              <div ref={phone} className="w-[min(62vw,250px)] will-change-transform md:w-[300px]" style={{ transformStyle: "preserve-3d", transform: reduced ? undefined : "rotateY(-32deg) rotateX(8deg)" }}>
                <PhoneFrame>
                  {/* Lock screen: cropped print as wallpaper */}
                  <Fingerprint className="absolute -right-[30%] top-[20%] w-[120%] text-graphite" />
                  <div className="absolute inset-x-0 top-[9%] text-center">
                    <p className="text-[10px] font-medium text-steel">Likin</p>
                    <p className="mt-0.5 text-[clamp(28px,9vw,44px)] font-medium tracking-tight text-cloud/90 [font-variant-numeric:tabular-nums]">09:41</p>
                  </div>
                  <ul className="absolute inset-x-[4%] top-[27%] flex flex-col gap-[6px]" aria-live="off">
                    {ORDER.map((idx, i) => {
                      const visible = i < shown;
                      const n = notifications[idx];
                      // newest on top: item i sits at position (shown - 1 - i)
                      const pos = shown - 1 - i;
                      return (
                        <li
                          key={idx}
                          className="absolute inset-x-0 transition-[transform,opacity] duration-(--dur-slow) ease-(--ease-out)"
                          style={{
                            transform: visible ? `translateY(${pos * 104}%) scale(${1 - pos * 0.02})` : "translateY(-24%) scale(0.96)",
                            opacity: visible ? Math.max(0, 1 - pos * 0.16) : 0,
                            zIndex: 10 - pos,
                          }}
                          aria-hidden={!visible}
                        >
                          <Image src={n.src} alt="" width={n.width} height={n.height} sizes="300px" className="w-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]" />
                        </li>
                      );
                    })}
                  </ul>
                  <div className={cn("absolute inset-x-[8%] bottom-[5%] text-center transition-opacity duration-(--dur-slow)", finished ? "opacity-100" : "opacity-0")} aria-hidden={!finished}>
                    <p className="text-label text-teal">{notifications.length} pedidos nuevos</p>
                  </div>
                </PhoneFrame>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
