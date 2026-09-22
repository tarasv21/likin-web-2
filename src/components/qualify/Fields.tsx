"use client";

import { useEffect, useId, useRef } from "react";
import { Check } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import type { Option } from "@/lib/qualify/types";

/**
 * Selectable surfaces, not radio buttons. A hairline, an index, the label and one state mark.
 * Teal is earned: it appears on selection and on focus, nowhere else.
 */
export function ChoiceList({
  options,
  value,
  multi,
  onSelect,
  name,
  describedBy,
}: {
  options: Option[];
  value: string | string[] | undefined;
  multi?: boolean;
  onSelect: (v: string) => void;
  name: string;
  describedBy?: string;
}) {
  const selected = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v);
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * Arrow keys move between options without selecting (manual activation), because selecting
   * auto-advances and arrowing past a choice should never commit it. Enter and Space activate;
   * a button only answers to Space by default, so Enter is wired explicitly.
   */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const el = document.activeElement as HTMLElement | null;
      const v = el?.getAttribute("data-value");
      if (v) {
        e.preventDefault();
        onSelect(v);
      }
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-option]") ?? []);
    if (!items.length) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : e.key === "ArrowDown" ? (i + 1 + items.length) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={listRef} role={multi ? "group" : "radiogroup"} aria-labelledby={name} aria-describedby={describedBy} onKeyDown={onKeyDown} className="grid gap-2">
      {options.map((o, i) => {
        const on = selected(o.value);
        return (
          <button
            key={o.value}
            type="button"
            data-option
            data-value={o.value}
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onSelect(o.value)}
            className={cn(
              "group/opt flex w-full items-start gap-4 rounded-card border px-4 py-3.5 text-left transition-[border-color,background-color] duration-(--dur-fast) md:px-5 md:py-4",
              on ? "border-teal bg-teal/[0.07]" : "border-hairline hover:border-outline hover:bg-graphite/40",
            )}
          >
            <span className={cn("text-label mt-1 w-5 shrink-0 tabular-nums transition-colors", on ? "text-teal" : "text-steel")}>{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-body-xl leading-snug transition-colors", on ? "text-cloud" : "text-cloud/90")}>{o.label}</span>
              {o.hint && <span className="mt-1 block text-small text-steel">{o.hint}</span>}
            </span>
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center border transition-[border-color,background-color]",
                multi ? "rounded-[5px]" : "rounded-full",
                on ? "border-teal bg-teal text-obsidian" : "border-outline text-transparent",
              )}
            >
              <Check size={12} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** One line of text. The label is the question itself, so it is referenced, not repeated. */
export function TextField({
  value,
  onChange,
  onEnter,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  labelledBy,
  invalid,
  describedBy,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
  labelledBy?: string;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <input
      ref={ref}
      type={type}
      inputMode={inputMode}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      placeholder={placeholder}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-14 w-full rounded-card border bg-transparent px-4 text-body-xl text-cloud outline-none transition-colors placeholder:text-steel/70 md:px-5",
        invalid ? "border-danger" : "border-hairline focus:border-teal",
      )}
    />
  );
}

export function LabelledField({ label, children, hint, error }: { label: string; children: (id: string, describedBy?: string) => React.ReactNode; hint?: string; error?: string }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id} className="text-label block text-steel">
        {label}
      </label>
      <div className="mt-2">{children(id, error ? errId : hint ? hintId : undefined)}</div>
      {hint && !error && (
        <p id={hintId} className="mt-2 text-small text-steel">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="mt-2 text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
