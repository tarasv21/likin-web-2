/**
 * QUALIFY — conditional flow.
 *
 * The visible question list is always derived, never stored. When an answer changes, any
 * branch it opened is re-evaluated and answers to questions that are no longer visible are
 * deleted, so a discarded branch can never reach the qualification engine.
 */
import { questionsFor } from "./questions";
import type { Answers, Question, Service } from "./types";

/** Questions currently visible for these answers, in order. */
export function visibleQuestions(service: Service, answers: Answers): Question[] {
  return questionsFor(service).filter((q) => !q.when || q.when(answers));
}

/**
 * Drops answers whose question is no longer reachable.
 *
 * Runs to a fixed point: hiding one question can hide another that depended on its answer
 * (for example a bottleneck detail that depended on a bottleneck that depended on revenue).
 * Returns the same object when nothing changed, so callers can skip a re-render.
 */
export function pruneAnswers(service: Service, answers: Answers): Answers {
  let current = answers;
  for (let pass = 0; pass < 8; pass++) {
    const shown = visibleQuestions(service, current);
    const visible = new Set(shown.map((q) => q.id));
    // Inline companion fields live as long as the option that opened them.
    for (const q of shown) {
      if (q.textId && needsCompanionText(q, current)) visible.add(q.textId);
    }
    const stale = Object.keys(current).filter((id) => current[id] !== undefined && !visible.has(id));
    if (!stale.length) return current;
    const next = { ...current };
    for (const id of stale) delete next[id];
    current = next;
  }
  return current;
}

/** Validation for one question, including its inline companion field. Null when valid. */
export function validateAnswer(q: Question, answers: Answers): string | null {
  const v = answers[q.id];
  if (q.validate) {
    const err = q.validate(v, answers);
    if (err) return err;
  } else if (!q.optional) {
    if (q.kind === "multi") {
      if (!Array.isArray(v) || v.length === 0) return "Elige al menos una opción.";
    } else if (typeof v !== "string" || !v.trim()) {
      return q.kind === "single" ? "Elige una opción." : "Completa este campo.";
    }
  }
  // "Otro" is answered in the same step, so it is validated in the same step.
  if (q.textId && needsCompanionText(q, answers)) {
    const t = answers[q.textId];
    if (typeof t !== "string" || t.trim().length < 2) return "Cuéntanos cuál, en pocas palabras.";
  }
  return null;
}

/** True when an option that opens a free-text field is currently chosen. */
export function needsCompanionText(q: Question, answers: Answers) {
  if (!q.textId || !q.options) return false;
  const v = answers[q.id];
  const chosen = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
  return q.options.some((o) => o.opensText && chosen.includes(o.value));
}

/**
 * Applies an answer and prunes anything it invalidated.
 * Multi-select rules (exclusive options, max) live here so every caller behaves the same.
 */
export function setAnswer(service: Service, answers: Answers, q: Question, value: string): Answers {
  let next: Answers;
  if (q.kind === "multi") {
    const current = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
    const opt = q.options?.find((o) => o.value === value);
    let list: string[];
    if (current.includes(value)) {
      list = current.filter((v) => v !== value);
    } else if (opt?.exclusive) {
      list = [value];
    } else {
      // Choosing anything else releases an exclusive option ("Nada de esto todavía").
      const withoutExclusive = current.filter((v) => !q.options?.find((o) => o.value === v)?.exclusive);
      if (q.max && withoutExclusive.length >= q.max) {
        // At the ceiling we refuse rather than silently swap, and the UI says why.
        return answers;
      }
      list = [...withoutExclusive, value];
    }
    next = { ...answers, [q.id]: list };
  } else {
    next = { ...answers, [q.id]: value };
  }
  return pruneAnswers(service, next);
}

/** True when the multi-select is full and `value` is not already chosen. */
export function isAtLimit(q: Question, answers: Answers, value: string) {
  if (q.kind !== "multi" || !q.max) return false;
  const current = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
  if (current.includes(value)) return false;
  if (q.options?.find((o) => o.value === value)?.exclusive) return false;
  return current.filter((v) => !q.options?.find((o) => o.value === v)?.exclusive).length >= q.max;
}

/**
 * The instruction the UI must show for a question, derived from its kind. Centralised so a
 * new multi-select can never ship without telling people they can pick more than one.
 */
export function selectionHint(q: Question): string | null {
  if (q.kind !== "multi") return null;
  if (q.max === 1) return "Elige una opción.";
  if (q.max) return `Selecciona hasta ${q.max} opciones.`;
  return "Puedes seleccionar varias opciones.";
}

/** Progress that never lies: counts the branch the user is actually on. */
export function progressOf(service: Service, answers: Answers, currentId: string) {
  const visible = visibleQuestions(service, answers);
  const index = visible.findIndex((q) => q.id === currentId);
  return { index: index < 0 ? 0 : index, total: visible.length, step: (index < 0 ? 0 : index) + 1 };
}
