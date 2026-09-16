"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Close } from "./Icons";

/**
 * Accessible overlay on the native <dialog>: focus trap, Esc, inert background.
 * variant "sheet": bottom sheet on mobile, side panel from md. "center": dialog.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  variant = "center",
  size = "md",
  labelledBy,
  className,
  header,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  variant?: "center" | "sheet";
  size?: "sm" | "md" | "lg" | "video";
  labelledBy?: string;
  className?: string;
  header?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === d) onClose();
    };
    d.addEventListener("cancel", onCancel);
    d.addEventListener("click", onClick);
    return () => {
      d.removeEventListener("cancel", onCancel);
      d.removeEventListener("click", onClick);
    };
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const closeBtn = (
    <button
      type="button"
      onClick={onClose}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-hairline text-steel transition-colors hover:border-steel hover:text-cloud"
      aria-label="Cerrar"
    >
      <Close size={18} />
    </button>
  );

  if (variant === "sheet") {
    return (
      <dialog
        ref={ref}
        aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
        data-sheet="bottom"
        className={cn(
          "fixed m-0 max-h-none max-w-none border-0 bg-card p-0 text-cloud",
          "inset-x-0 bottom-0 top-auto h-[calc(100dvh-32px)] w-full rounded-t-sheet",
          "md:inset-y-0 md:left-auto md:right-0 md:h-dvh md:w-[min(540px,100vw)] md:rounded-none md:border-l md:border-hairline",
          className,
        )}
      >
        {open && (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5 md:px-8">
              <div className="min-w-0">
                {title && (
                  <h2 id={titleId} className="text-h3">
                    {title}
                  </h2>
                )}
                {header}
              </div>
              {closeBtn}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8 md:py-8">{children}</div>
          </div>
        )}
      </dialog>
    );
  }

  const sizes = { sm: "md:max-w-md", md: "md:max-w-xl", lg: "md:max-w-3xl", video: "md:max-w-[min(92vw,460px)]" }[size];

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
      data-sheet="center"
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-cloud open:grid place-items-center"
    >
      {open && (
        <div className={cn("relative mx-4 w-full overflow-hidden rounded-sheet border border-hairline bg-card shadow-float", sizes, className)}>
          <div className="flex items-start justify-between gap-4 px-5 pt-5 md:px-7 md:pt-6">
            {title ? (
              <h2 id={titleId} className="text-h3">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {closeBtn}
          </div>
          <div className="px-5 pb-5 pt-3 md:px-7 md:pb-7">{children}</div>
        </div>
      )}
    </dialog>
  );
}
