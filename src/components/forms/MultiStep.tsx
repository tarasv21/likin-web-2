"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Check, Spinner } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

/**
 * Multistep pre-qualification engine — one decision per screen, progress, explicit states,
 * native inputs, no libraries. The architecture the CRM / checkout will plug into later.
 */

export type Option = { value: string; label: string; hint?: string };
export type Field = { name: string; label: string; type?: "text" | "email" | "tel" | "url" | "textarea"; placeholder?: string; required?: boolean; autoComplete?: string; hint?: string };
export type Answers = Record<string, string | string[]>;

export type Step =
  | { id: string; kind: "single"; label: string; question: string; hint?: string; options: Option[]; required?: boolean; when?: (a: Answers) => boolean }
  | { id: string; kind: "multi"; label: string; question: string; hint?: string; options: Option[]; required?: boolean; min?: number; when?: (a: Answers) => boolean }
  | { id: string; kind: "fields"; label: string; question: string; hint?: string; fields: Field[]; when?: (a: Answers) => boolean };

export type LeadPayload = { kind: "build" | "scale"; name: string; email: string; brand?: string; phone?: string; fit?: string; answers: Answers; source?: string };

export async function submitLead(payload: LeadPayload, honeypot = ""): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, website_url: honeypot }) });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) return { ok: false, error: data.error ?? "No hemos podido enviar tu solicitud. Inténtalo de nuevo." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Sin conexión. Comprueba tu red e inténtalo de nuevo." };
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function MultiStep({ steps, intro, submitLabel = "Continuar", renderResult, id }: { steps: Step[]; intro?: ReactNode; submitLabel?: string; renderResult: (answers: Answers, honeypot: string) => ReactNode; id: string }) {
  const uid = useId();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => steps.filter((s) => !s.when || s.when(answers)), [steps, answers]);
  const step = visible[Math.min(index, visible.length - 1)];
  const total = visible.length;

  const set = useCallback((k: string, v: string | string[]) => {
    setAnswers((a) => ({ ...a, [k]: v }));
    setError(null);
  }, []);

  useEffect(() => {
    if (index === 0) return;
    topRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [index]);

  const validate = (): string | null => {
    if (!step) return null;
    if (step.kind === "single" && (step.required ?? true) && !answers[step.id]) return "Elige una opción para continuar.";
    if (step.kind === "multi") {
      const v = (answers[step.id] as string[] | undefined) ?? [];
      if ((step.required ?? true) && v.length < (step.min ?? 1)) return "Selecciona al menos una opción.";
    }
    if (step.kind === "fields") {
      for (const f of step.fields) {
        const v = String(answers[f.name] ?? "").trim();
        if (f.required && !v) return `Necesitamos ${f.label.toLowerCase()}.`;
        if (f.type === "email" && v && !EMAIL.test(v)) return "Ese email no parece válido.";
        if (f.type === "url" && v && !/^([a-z]+:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)) return "Esa dirección web no parece válida.";
      }
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) return setError(err);
    if (index >= total - 1) return setDone(true);
    setIndex((i) => i + 1);
  };
  const back = () => {
    setError(null);
    setIndex((i) => Math.max(0, i - 1));
  };
  const errId = `${uid}-err`;

  return (
    <div ref={topRef} id={id} className="scroll-mt-4">
      {intro && !done && <p className="mb-6 max-w-[56ch] text-body text-steel">{intro}</p>}

      {/* Honeypot */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label>
          No rellenes este campo
          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      {done ? (
        renderResult(answers, honeypot)
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-label text-steel">
              <span className="text-cloud">{String(index + 1).padStart(2, "0")}</span> / {String(total).padStart(2, "0")} · {step.label}
            </p>
            <ol className="flex gap-1.5" aria-hidden>
              {visible.map((s, i) => (
                <li key={s.id} className={cn("h-1 w-5 rounded-full transition-colors duration-(--dur)", i <= index ? "bg-teal" : "bg-hairline")} />
              ))}
            </ol>
          </div>

          <fieldset key={step.id} className="mt-7 border-0 p-0" aria-describedby={error ? errId : undefined}>
            <legend className="max-w-[26ch] text-body-xl font-medium text-cloud">{step.question}</legend>
            {step.hint && <p className="mt-2.5 max-w-[56ch] text-small text-steel">{step.hint}</p>}

            {step.kind === "single" && (
              <div className="mt-5 grid gap-2.5">
                {step.options.map((o) => {
                  const checked = answers[step.id] === o.value;
                  return (
                    <label key={o.value} className={cn("flex cursor-pointer items-center gap-4 rounded-card border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal", checked ? "border-teal bg-graphite" : "border-card-border hover:border-outline")}>
                      <input type="radio" name={step.id} value={o.value} checked={checked} onChange={() => set(step.id, o.value)} className="sr-only" />
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", checked ? "border-teal bg-teal text-obsidian" : "border-outline")}>{checked && <Check size={12} />}</span>
                      <span>
                        <span className="block font-medium text-cloud">{o.label}</span>
                        {o.hint && <span className="mt-0.5 block text-small text-steel">{o.hint}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {step.kind === "multi" && (
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {step.options.map((o) => {
                  const arr = (answers[step.id] as string[] | undefined) ?? [];
                  const checked = arr.includes(o.value);
                  const toggle = () => {
                    if (o.value === "none") return set(step.id, checked ? [] : ["none"]);
                    const base = arr.filter((v) => v !== "none");
                    set(step.id, checked ? base.filter((v) => v !== o.value) : [...base, o.value]);
                  };
                  return (
                    <label key={o.value} className={cn("flex cursor-pointer items-center gap-3 rounded-card border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal", checked ? "border-teal bg-graphite" : "border-card-border hover:border-outline")}>
                      <input type="checkbox" name={step.id} value={o.value} checked={checked} onChange={toggle} className="sr-only" />
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors", checked ? "border-teal bg-teal text-obsidian" : "border-outline")}>{checked && <Check size={12} />}</span>
                      <span>
                        <span className="block font-medium text-cloud">{o.label}</span>
                        {o.hint && <span className="mt-0.5 block text-small text-steel">{o.hint}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {step.kind === "fields" && (
              <div className="mt-5 grid gap-5">
                {step.fields.map((f) => (
                  <TextField key={f.name} field={f} value={String(answers[f.name] ?? "")} onChange={(v) => set(f.name, v)} invalid={!!error && !!f.required && !String(answers[f.name] ?? "").trim()} />
                ))}
              </div>
            )}
          </fieldset>

          <div className="mt-5 min-h-6" aria-live="polite">
            {error && (
              <p id={errId} className="text-small text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={back} disabled={index === 0} className="text-label h-11 text-steel transition-colors hover:text-cloud disabled:invisible">
              ← Atrás
            </button>
            <Button type="submit" size="lg">
              {index >= total - 1 ? submitLabel : "Continuar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function TextField({ field, value, onChange, invalid }: { field: Field; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const id = useId();
  const base = "w-full rounded-button border bg-obsidian px-4 text-cloud placeholder:text-steel/60 transition-colors focus:border-teal focus:outline-none aria-[invalid=true]:border-danger";
  const valid = value.trim().length > 0 && !invalid && (field.type !== "email" || EMAIL.test(value.trim()));
  return (
    <div>
      <label htmlFor={id} className="text-label text-steel">
        {field.label}
        {field.required && <span aria-hidden> *</span>}
      </label>
      <div className="relative mt-2">
        {field.type === "textarea" ? (
          <textarea id={id} name={field.name} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={4} aria-invalid={invalid || undefined} className={cn(base, "border-card-border py-3")} />
        ) : (
          <input
            id={id}
            name={field.name}
            type={field.type ?? "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            inputMode={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "url" ? "url" : undefined}
            aria-invalid={invalid || undefined}
            className={cn(base, "h-12 border-card-border", valid && "border-teal/50")}
          />
        )}
        {valid && field.type !== "textarea" && <Check size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-teal" />}
      </div>
      {field.hint && <p className="mt-1.5 text-xs text-steel">{field.hint}</p>}
    </div>
  );
}

/** Async submit with loading, error and success states. */
export function SubmitAction({ label, onSubmit, variant = "primary", success }: { label: string; onSubmit: () => Promise<{ ok: true } | { ok: false; error: string }>; variant?: "primary" | "secondary"; success: ReactNode }) {
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [err, setErr] = useState("");
  if (state === "success") return <>{success}</>;
  return (
    <div>
      <Button
        variant={variant}
        size="lg"
        arrow="none"
        disabled={state === "loading"}
        onClick={async () => {
          setState("loading");
          const r = await onSubmit();
          if (r.ok) setState("success");
          else {
            setErr(r.error);
            setState("error");
          }
        }}
      >
        {state === "loading" ? <Spinner size={18} /> : null}
        {label}
        {state !== "loading" && <ArrowRight size={18} />}
      </Button>
      <div aria-live="polite" className="mt-3 min-h-5 text-small text-danger">
        {state === "error" && err}
      </div>
    </div>
  );
}

export function Received({ title, text, cta }: { title: string; text: string; cta?: { label: string; href: string } }) {
  return (
    <div role="status" className="rounded-card border border-teal/40 p-5">
      <p className="text-label inline-flex items-center gap-2 text-teal">
        <Check size={14} /> {title}
      </p>
      <p className="mt-2 text-body text-cloud/90">{text}</p>
      {cta && (
        <div className="mt-4">
          <Button href={cta.href} variant="secondary">
            {cta.label}
          </Button>
        </div>
      )}
    </div>
  );
}
