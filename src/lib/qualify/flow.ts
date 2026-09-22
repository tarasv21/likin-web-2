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
    const visible = new Set(visibleQuestions(service, current).map((q) => q.id));
    const stale = Object.keys(current).filter((id) => current[id] !== undefined && !visible.has(id));
    if (!stale.length) return current;
    const next = { ...current };
    for (const id of stale) delete next[id];
    current = next;
  }
  return current;
}

/** Validation for one question. Returns an error message or null. */
export function validateAnswer(q: Question, answers: Answers): string | null {
  const v = answers[q.id];
  if (q.validate) return q.validate(v, answers);
  if (q.optional) return null;
  if (q.kind === "multi") return Array.isArray(v) && v.length > 0 ? null : "Elige al menos una opción.";
  if (typeof v === "string" && v.trim()) return null;
  return q.kind === "single" ? "Elige una opción." : "Completa este campo.";
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
      const withoutExclusive = current.filter((v) => !q.options?.find((o) => o.value === v)?.exclusive);
      list = [...withoutExclusive, value];
      // At the ceiling, the oldest choice makes way for the newest instead of silently failing.
      if (q.max && list.length > q.max) list = list.slice(list.length - q.max);
    }
    next = { ...answers, [q.id]: list };
  } else {
    next = { ...answers, [q.id]: value };
  }
  return pruneAnswers(service, next);
}

/** Progress that never lies: counts the branch the user is actually on. */
export function progressOf(service: Service, answers: Answers, currentId: string) {
  const visible = visibleQuestions(service, answers);
  const index = visible.findIndex((q) => q.id === currentId);
  return { index: index < 0 ? 0 : index, total: visible.length, step: (index < 0 ? 0 : index) + 1 };
}
