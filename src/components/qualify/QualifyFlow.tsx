"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, Spinner } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChoiceList, LabelledField, TextField } from "./Fields";
import { ResultScreen } from "./ResultScreen";
import { collectsContact, isTerminal, qualify } from "@/lib/qualify/engine";
import { progressOf, setAnswer, validateAnswer, visibleQuestions } from "@/lib/qualify/flow";
import { track } from "@/lib/qualify/events";
import { clearSession, loadSession, readAttribution, saveSession } from "@/lib/qualify/session";
import { buildLead, submitLead } from "@/lib/qualify/submit";
import { useReducedMotion } from "@/lib/hooks";
import type { Answers, Contact, Question, Service, Verdict } from "@/lib/qualify/types";

type Stage = { kind: "question"; q: Question } | { kind: "contact" } | { kind: "result" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d][\d\s().-]{6,24}$/;

const emptyContact: Contact = { contact_name: "", email: "", phone: "", brand_name: "", additional_notes: "", consent_contact: false, consent_nurture: false };

/**
 * The qualification experience: one question per screen, conditional, with a verdict at the
 * end. Answers live here; everything derived (visible questions, progress, verdict) is
 * recomputed on each render so a changed answer can never leave a stale branch behind.
 */
export function QualifyFlow({ service, source, onClose, onSwitchToBuild }: { service: Service; source: string; onClose: () => void; onSwitchToBuild: () => void }) {
  const reduced = useReducedMotion();
  const [answers, setAnswers] = useState<Answers>({});
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<"questions" | "contact" | "result">("questions");
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [error, setError] = useState<string | null>(null);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [stored, setStored] = useState(false);
  const [leaving, setLeaving] = useState<"forward" | "back" | null>(null);
  const honeypot = useRef("");
  const attribution = useRef(readAttribution(source));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const titleId = useId();

  const visible = useMemo(() => visibleQuestions(service, answers), [service, answers]);
  const index = Math.min(cursor, Math.max(0, visible.length - 1));
  const question = visible[index];
  const verdict: Verdict = useMemo(() => qualify(service, answers), [service, answers]);

  // Recover the non-personal answers of an accidentally closed sheet, once.
  useEffect(() => {
    const at = attribution.current;
    track("qualification_form_opened", { service, source: at.source, landing_page: at.landing_page, utm_source: at.utm_source, utm_campaign: at.utm_campaign });
    const saved = loadSession(service);
    if (!saved) return;
    const id = window.requestAnimationFrame(() => setAnswers(saved));
    return () => window.cancelAnimationFrame(id);
  }, [service, source]);

  useEffect(() => {
    if (phase === "questions" && Object.keys(answers).length) saveSession(service, answers);
  }, [service, answers, phase]);

  // Focus and announce the new question. Screen readers get the prompt, not a silent swap.
  useEffect(() => {
    headingRef.current?.focus();
  }, [index, phase]);

  const stage: Stage = phase === "result" ? { kind: "result" } : phase === "contact" ? { kind: "contact" } : { kind: "question", q: question };

  const animateTo = useCallback(
    (dir: "forward" | "back", apply: () => void) => {
      if (reduced) {
        apply();
        return;
      }
      setLeaving(dir);
      window.setTimeout(() => {
        apply();
        setLeaving(null);
      }, 160);
    },
    [reduced],
  );

  const goNext = useCallback(() => {
    if (!question) return;
    const err = validateAnswer(question, answers);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (!startedRef.current) {
      startedRef.current = true;
      track("qualification_started", { service });
    }
    const p = progressOf(service, answers, question.id);
    track("qualification_step_completed", { service, step_id: question.id, step_index: p.step, step_total: p.total });

    const isLast = index >= visible.length - 1 || isTerminal(service, answers);
    animateTo("forward", () => {
      if (!isLast) {
        setCursor(index + 1);
        return;
      }
      const v = qualify(service, answers);
      track("qualification_result", { service, qualification: v.qualification, next_action: v.next_action, lead_score: v.lead_score, reasons: v.qualification_reasons, requires_manual_review: v.requires_manual_review });
      if (!collectsContact(v)) {
        track("qualification_disqualified", { service, qualification: v.qualification, reason: v.qualification_reasons[0] });
        clearSession();
        setPhase("result");
        return;
      }
      track("qualification_contact_reached", { service, qualification: v.qualification });
      setContact((c) => ({ ...c, brand_name: c.brand_name || (typeof answers.brand_name === "string" ? answers.brand_name : "") }));
      setPhase("contact");
    });
  }, [question, answers, index, visible.length, service, animateTo]);

  const goBack = useCallback(() => {
    setError(null);
    setSendError(null);
    if (phase === "contact") {
      animateTo("back", () => setPhase("questions"));
      return;
    }
    if (index > 0) animateTo("back", () => setCursor(index - 1));
  }, [phase, index, animateTo]);

  const choose = useCallback(
    (value: string) => {
      if (!question) return;
      const next = setAnswer(service, answers, question, value);
      setAnswers(next);
      setError(null);
      // A single choice with nothing else to fill in advances on its own, after a beat that
      // lets the selection register visually.
      if (question.kind === "single") {
        const opt = question.options?.find((o) => o.value === value);
        if (opt?.opensText) return;
        const isLast = index >= visibleQuestions(service, next).length - 1 || isTerminal(service, next);
        window.setTimeout(() => {
          if (isLast) {
            const v = qualify(service, next);
            track("qualification_result", { service, qualification: v.qualification, next_action: v.next_action, lead_score: v.lead_score, reasons: v.qualification_reasons, requires_manual_review: v.requires_manual_review });
            animateTo("forward", () => {
              if (!collectsContact(v)) {
                track("qualification_disqualified", { service, qualification: v.qualification, reason: v.qualification_reasons[0] });
                clearSession();
                setPhase("result");
              } else {
                track("qualification_contact_reached", { service, qualification: v.qualification });
                setContact((c) => ({ ...c, brand_name: c.brand_name || (typeof next.brand_name === "string" ? next.brand_name : "") }));
                setPhase("contact");
              }
            });
          } else {
            const p = progressOf(service, next, question.id);
            track("qualification_step_completed", { service, step_id: question.id, step_index: p.step, step_total: p.total });
            animateTo("forward", () => setCursor(index + 1));
          }
        }, reduced ? 0 : 190);
      }
    },
    [question, answers, service, index, animateTo, reduced],
  );

  const validateContact = () => {
    const e: Record<string, string> = {};
    if (contact.contact_name.trim().length < 2) e.contact_name = "Dinos cómo te llamas.";
    if (!EMAIL.test(contact.email.trim())) e.email = "Revisa el email.";
    if (!PHONE.test(contact.phone.trim())) e.phone = "Revisa el teléfono. Puedes incluir el prefijo internacional.";
    if (contact.brand_name.trim().length < 2) e.brand_name = "Falta el nombre de la marca.";
    if (!contact.consent_contact) e.consent_contact = "Necesitamos tu permiso para responderte.";
    setContactErrors(e);
    if (Object.keys(e).length) {
      // Never leave someone staring at a button that does nothing: go to the first problem.
      window.requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        first?.focus({ preventScroll: true });
      });
      return false;
    }
    return true;
  };

  const send = async () => {
    if (!validateContact() || sending) return;
    setSending(true);
    setSendError(null);
    const lead = buildLead({ service, answers, verdict, attribution: attribution.current, contact });
    const res = await submitLead(lead, honeypot.current);
    setSending(false);
    if (!res.ok) {
      setSendError(res.error);
      return;
    }
    setStored(res.stored);
    track("qualification_submitted", { service, qualification: verdict.qualification, next_action: verdict.next_action, lead_score: verdict.lead_score, reasons: verdict.qualification_reasons, ok: true });
    if (verdict.requires_manual_review) track("manual_review_submitted", { service, qualification: verdict.qualification });
    clearSession();
    animateTo("forward", () => setPhase("result"));
  };

  const progress = phase === "questions" && question ? progressOf(service, answers, question.id) : null;
  const terminal = isTerminal(service, answers);
  const totalSteps = terminal ? index + 1 : visible.length + 1; // + contact, unless a gate ended it
  const stepNow = phase === "result" ? totalSteps : phase === "contact" ? totalSteps : (progress?.step ?? 1);
  const canGoBack = phase === "contact" || (phase === "questions" && index > 0);

  const motionClass = reduced ? "" : leaving === "forward" ? "qz-out-up" : leaving === "back" ? "qz-out-down" : "qz-in";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Progress: editorial, and honest about the branch actually being walked. */}
      <div className="shrink-0 border-b border-hairline px-(--spacing-gutter) pb-3 pt-1">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-label text-teal">{service === "BUILD" ? "Likin Build" : "Likin Scale"}</p>
          <p className="text-label tabular-nums text-steel" aria-hidden>
            {phase === "result" ? "—" : `${String(stepNow).padStart(2, "0")} — ${String(totalSteps).padStart(2, "0")}`}
          </p>
        </div>
        <div className="mt-2.5 flex gap-1" aria-hidden>
          {phase === "result" ? (
            <span className="h-px flex-1 bg-teal" />
          ) : (
            Array.from({ length: totalSteps }, (_, i) => <span key={i} className={cn("h-px flex-1 transition-colors duration-(--dur)", i < stepNow - 1 ? "bg-teal" : i === stepNow - 1 ? "bg-teal/50" : "bg-hairline")} />)
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {phase === "result" ? "Resultado" : `Paso ${stepNow} de ${totalSteps}`}
        </p>
      </div>

      {/* Stage */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-(--spacing-gutter) py-6 md:justify-center md:py-10">
        <div key={`${phase}-${index}`} className={cn("mx-auto w-full max-w-[42rem]", motionClass)}>
          {stage.kind === "question" && stage.q && (
            <QuestionView q={stage.q} answers={answers} error={error} titleId={titleId} headingRef={headingRef} onChoose={choose} onText={(v) => { setAnswers((a) => ({ ...a, [stage.q.id]: v })); setError(null); }} onEnter={goNext} />
          )}

          {stage.kind === "contact" && (
            <div>
              <h2 ref={headingRef} tabIndex={-1} className="text-h3 outline-none">
                Último paso. <span className="text-steel">¿Con quién hablamos?</span>
              </h2>
              <div ref={formRef} className="mt-7 grid gap-5">
                <LabelledField label="Nombre y apellidos" error={contactErrors.contact_name}>
                  {(id, d) => <input id={id} aria-describedby={d} autoComplete="name" value={contact.contact_name} onChange={(e) => setContact({ ...contact, contact_name: e.target.value })} className={inputCls(contactErrors.contact_name)} />}
                </LabelledField>
                <LabelledField label="Email profesional" error={contactErrors.email}>
                  {(id, d) => <input id={id} aria-describedby={d} type="email" inputMode="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inputCls(contactErrors.email)} />}
                </LabelledField>
                <LabelledField label="Teléfono o WhatsApp" error={contactErrors.phone}>
                  {(id, d) => <input id={id} aria-describedby={d} type="tel" inputMode="tel" autoComplete="tel" placeholder="+34 600 000 000" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputCls(contactErrors.phone)} />}
                </LabelledField>
                <LabelledField label="Empresa o marca" error={contactErrors.brand_name}>
                  {(id, d) => <input id={id} aria-describedby={d} autoComplete="organization" value={contact.brand_name} onChange={(e) => setContact({ ...contact, brand_name: e.target.value })} className={inputCls(contactErrors.brand_name)} />}
                </LabelledField>
                <LabelledField label="¿Algo que deberíamos saber antes de hablar?" hint="Opcional.">
                  {(id, d) => <textarea id={id} aria-describedby={d} rows={3} value={contact.additional_notes} onChange={(e) => setContact({ ...contact, additional_notes: e.target.value })} className={cn(inputCls(), "h-auto py-3 leading-relaxed")} />}
                </LabelledField>

                <div className="grid gap-3 border-t border-hairline pt-5">
                  <Consent checked={contact.consent_contact} onChange={(v) => setContact({ ...contact, consent_contact: v })} error={contactErrors.consent_contact}>
                    Acepto que Likin trate mis datos para responder a esta solicitud, según la <a href="/privacidad" className="text-cloud underline underline-offset-2 hover:text-teal">política de privacidad</a>.
                  </Consent>
                  <Consent checked={contact.consent_nurture} onChange={(v) => setContact({ ...contact, consent_nurture: v })}>
                    Quiero recibir también contenidos y novedades de Likin. <span className="text-steel">Opcional.</span>
                  </Consent>
                </div>

                {/* Honeypot. Off-screen, never announced, never focusable. */}
                <input type="text" tabIndex={-1} aria-hidden autoComplete="off" onChange={(e) => (honeypot.current = e.target.value)} className="absolute left-[-9999px] size-px opacity-0" />
                {sendError && (
                  <p role="alert" className="text-small text-danger">
                    {sendError}
                  </p>
                )}
              </div>
            </div>
          )}

          {stage.kind === "result" && <ResultScreen service={service} verdict={verdict} stored={stored} contactGiven={Boolean(contact.email)} onClose={onClose} onSwitchToBuild={onSwitchToBuild} />}
        </div>
      </div>

      {/* Actions */}
      {stage.kind !== "result" && (
        <div className="shrink-0 border-t border-hairline bg-obsidian px-(--spacing-gutter) py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-[42rem] items-center gap-3">
            <button type="button" onClick={goBack} disabled={!canGoBack} className={cn("inline-flex h-12 items-center gap-2 rounded-button px-3 text-small transition-colors", canGoBack ? "text-steel hover:text-cloud" : "invisible")}>
              <ArrowLeft size={16} /> Atrás
            </button>
            <div className="ml-auto">
              {stage.kind === "contact" ? (
                <Button size="md" onClick={send} disabled={sending} arrow={sending ? "none" : "right"}>
                  {sending ? <><Spinner size={16} /> Enviando…</> : "Enviar solicitud"}
                </Button>
              ) : (
                <Button size="md" onClick={goNext}>
                  Continuar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = (err?: string) => cn("h-13 w-full rounded-card border bg-transparent px-4 py-3 text-body text-cloud outline-none transition-colors placeholder:text-steel/70", err ? "border-danger" : "border-hairline focus:border-teal");

function Consent({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; error?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-small text-steel">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={error ? true : undefined} className="mt-0.5 size-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] border border-outline transition-colors checked:border-teal checked:bg-teal" />
        <span className="leading-relaxed">{children}</span>
      </label>
      {error && (
        <p className="ml-[30px] mt-1.5 text-small text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function QuestionView({
  q,
  answers,
  error,
  titleId,
  headingRef,
  onChoose,
  onText,
  onEnter,
}: {
  q: Question;
  answers: Answers;
  error: string | null;
  titleId: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onChoose: (v: string) => void;
  onText: (v: string) => void;
  onEnter: () => void;
}) {
  const value = answers[q.id];
  const errId = `${titleId}-err`;
  const helpId = `${titleId}-help`;
  return (
    <div>
      <h2 id={titleId} ref={headingRef} tabIndex={-1} className="text-h3 max-w-[22ch] outline-none">
        {q.prompt}
      </h2>
      {q.help && (
        <p id={helpId} className="mt-3 max-w-[48ch] text-body text-steel">
          {q.help}
        </p>
      )}
      {q.note && <p className="text-label mt-4 inline-block rounded-[8px] border border-teal/30 bg-teal/[0.07] px-3 py-2 text-teal">{q.note}</p>}

      <div className="mt-7">
        {(q.kind === "single" || q.kind === "multi") && q.options && (
          <ChoiceList options={q.options} value={value} multi={q.kind === "multi"} onSelect={onChoose} name={titleId} describedBy={error ? errId : q.help ? helpId : undefined} />
        )}
        {(q.kind === "text" || q.kind === "url") && (
          <TextField
            value={typeof value === "string" ? value : ""}
            onChange={onText}
            onEnter={onEnter}
            placeholder={q.placeholder}
            type={q.kind === "url" ? "text" : "text"}
            inputMode={q.kind === "url" ? "url" : "text"}
            labelledBy={titleId}
            describedBy={error ? errId : q.help ? helpId : undefined}
            invalid={Boolean(error)}
            autoFocus
          />
        )}
      </div>

      {q.kind === "multi" && q.max && (
        <p className="text-label mt-3 text-steel" aria-hidden>
          Máximo {q.max}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-3 text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
