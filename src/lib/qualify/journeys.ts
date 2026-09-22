/**
 * QUALIFY — regression suite for the qualification engine.
 *
 * These are the journeys the business cares about, expressed as data. They run against the
 * real engine and the real pruning, so a change to a weight or a rule that breaks an expected
 * outcome shows up here. Executed by the dev-only route /api/qualify-check.
 */
import { pricingModelOf, qualify } from "./engine";
import { isAtLimit, needsCompanionText, pruneAnswers, selectionHint, setAnswer, visibleQuestions } from "./flow";
import { QUESTIONS, questionsFor } from "./questions";
import type { Answers, NextAction, Qualification, Service, Verdict } from "./types";

type Journey = {
  name: string;
  service: Service;
  answers: Answers;
  expect: { qualification: Qualification; next_action?: NextAction };
  also?: (v: Verdict, a: Answers) => string | null;
};

const JOURNEYS: Journey[] = [
  {
    name: "BUILD · marca nueva, producto definido, 10 productos, estándar, puede empezar ya",
    service: "BUILD",
    answers: { build_situation: "NEW_BRAND", product_category: "FASHION", brand_name: "Marca", brand_link: "marca.com", product_count: "1_10", build_complexity: ["STANDARD"], build_readiness: ["BRAND", "PHOTOS", "CATALOG", "DOMAIN"], build_budget: "YES", timing: "NOW", build_collaboration: "YES", business_role: "FOUNDER" },
    expect: { qualification: "READY", next_action: "STRIPE" },
  },
  {
    name: "BUILD · ERP y más de 100 productos",
    service: "BUILD",
    answers: { build_situation: "HAS_STORE", build_platform: "WOOCOMMERCE", build_store_url: "tienda.com", product_category: "HOME", brand_name: "Marca", brand_link: "marca.com", product_count: "100_PLUS", build_complexity: ["ERP", "B2B"], build_readiness: ["BRAND", "PHOTOS"], build_budget: "HIGHER", timing: "NOW", build_collaboration: "YES", business_role: "FOUNDER" },
    expect: { qualification: "REVIEW", next_action: "MANUAL_REVIEW" },
    also: (v) => (v.requires_manual_review ? null : "requires_manual_review debería ser true"),
  },
  {
    name: "BUILD · solo una idea, producto sin definir",
    service: "BUILD",
    answers: { build_situation: "IDEA", build_product_defined: "NO" },
    expect: { qualification: "NOT_READY", next_action: "CLOSED" },
    also: (v) => (v.qualification_reasons[0] === "BUILD_PRODUCT_NOT_DEFINED" ? null : "falta el motivo BUILD_PRODUCT_NOT_DEFINED"),
  },
  {
    name: "BUILD · presupuesto por debajo del mínimo",
    service: "BUILD",
    answers: { build_situation: "NEW_BRAND", product_category: "BEAUTY", brand_name: "Marca", brand_link: "marca.com", product_count: "11_30", build_complexity: ["STANDARD"], build_readiness: ["BRAND"], build_budget: "BELOW", timing: "NOW", build_collaboration: "YES", business_role: "FOUNDER" },
    expect: { qualification: "NOT_READY", next_action: "CLOSED" },
    also: (v) => (v.qualification_reasons[0] === "BUILD_BUDGET_BELOW_MINIMUM" ? null : "falta el motivo BUILD_BUDGET_BELOW_MINIMUM"),
  },
  {
    name: "SCALE · 25-50K, ads 3-10K, crecimiento completo, 2,5-4K, fundador, ya",
    service: "SCALE",
    answers: { monthly_revenue: "25K_50K", platform: "SHOPIFY", store_url: "tienda.com", product_category: "FASHION", brand_name: "Marca", brand_link: "marca.com", main_bottlenecks: ["ADS_NOT_SCALING", "LOW_CONVERSION"], paid_media: "YES", monthly_ad_spend: "3K_10K", ads_managed_by: "AGENCY", cac_clarity: "YES", conversion_rate: "1_2", retention: "SOME", email_tool: "KLAVIYO", growth_team: ["FOUNDER", "AGENCY"], services_interested: ["FULL_GROWTH"], investment_capacity: "2_5K_4K", timing: "NOW", change_capacity: "YES", business_role: "FOUNDER" },
    expect: { qualification: "HIGH_FIT", next_action: "BOOK_CALL" },
  },
  {
    name: "SCALE · 5-10K, ads menos de 1K, inversión 1-1,5K",
    service: "SCALE",
    answers: { monthly_revenue: "5K_10K", platform: "SHOPIFY", store_url: "tienda.com", product_category: "HOME", brand_name: "Marca", brand_link: "marca.com", main_bottlenecks: ["MORE_CUSTOMERS"], paid_media: "YES", monthly_ad_spend: "LT_1K", ads_managed_by: "INTERNAL", cac_clarity: "ROUGHLY", conversion_rate: "1_2", retention: "BARELY", email_tool: "MAILCHIMP", growth_team: ["FOUNDER"], services_interested: ["PAID_MEDIA"], investment_capacity: "1K_1_5K", timing: "30_DAYS", change_capacity: "DEPENDS", business_role: "FOUNDER" },
    expect: { qualification: "REVIEW", next_action: "MANUAL_REVIEW" },
  },
  {
    name: "SCALE · todavía no vende",
    service: "SCALE",
    answers: { monthly_revenue: "NONE" },
    expect: { qualification: "NOT_READY", next_action: "NURTURE" },
    also: (v) => (v.recommend_service === "BUILD" ? null : "debería recomendar BUILD"),
  },
  {
    name: "SCALE · 50-100K, fijo más variable, ads 10-30K",
    service: "SCALE",
    answers: { monthly_revenue: "50K_100K", platform: "SHOPIFY", store_url: "tienda.com", product_category: "BEAUTY", brand_name: "Marca", brand_link: "marca.com", main_bottlenecks: ["ADS_NOT_SCALING"], paid_media: "YES", monthly_ad_spend: "10K_30K", ads_managed_by: "AGENCY", cac_clarity: "YES", conversion_rate: "2_3", retention: "ACTIVE", email_tool: "KLAVIYO", growth_team: ["INTERNAL_MARKETING", "MEDIA_BUYER"], services_interested: ["FULL_GROWTH"], investment_capacity: "FIXED_VARIABLE", variable_model_metric: "REVENUE_GROWTH", timing: "NOW", change_capacity: "YES", business_role: "FOUNDER" },
    expect: { qualification: "HIGH_FIT", next_action: "BOOK_CALL" },
    also: (v, a) => (a.variable_model_metric === "REVENUE_GROWTH" && pricingModelOf(a) === "FIXED_VARIABLE" ? null : "no se ha capturado la métrica variable"),
  },
  {
    name: "SCALE · alta facturación pero solo a variable",
    service: "SCALE",
    answers: { monthly_revenue: "GT_100K", platform: "SHOPIFY", store_url: "tienda.com", product_category: "FASHION", brand_name: "Marca", brand_link: "marca.com", main_bottlenecks: ["ADS_NOT_SCALING"], paid_media: "YES", monthly_ad_spend: "GT_30K", ads_managed_by: "AGENCY", cac_clarity: "YES", conversion_rate: "2_3", retention: "ACTIVE", email_tool: "KLAVIYO", growth_team: ["MEDIA_BUYER"], services_interested: ["PAID_MEDIA"], investment_capacity: "VARIABLE_ONLY", variable_model_metric: "PROFIT", timing: "NOW", change_capacity: "YES", business_role: "FOUNDER" },
    expect: { qualification: "REVIEW", next_action: "MANUAL_REVIEW" },
    also: (v, a) => (v.requires_manual_review && pricingModelOf(a) === "VARIABLE" ? null : "debería ir a revisión manual, no rechazo automático"),
  },
  {
    name: "SCALE · solo Ads reduce el encaje aunque el resto sea bueno",
    service: "SCALE",
    answers: { monthly_revenue: "50K_100K", platform: "SHOPIFY", store_url: "tienda.com", product_category: "FASHION", brand_name: "Marca", brand_link: "marca.com", main_bottlenecks: ["ADS_NOT_SCALING"], paid_media: "YES", monthly_ad_spend: "10K_30K", ads_managed_by: "AGENCY", cac_clarity: "YES", conversion_rate: "2_3", retention: "ACTIVE", email_tool: "KLAVIYO", growth_team: ["MEDIA_BUYER"], services_interested: ["PAID_MEDIA"], investment_capacity: "GT_4K", timing: "NOW", change_capacity: "ADS_ONLY", business_role: "FOUNDER" },
    expect: { qualification: "REVIEW" },
  },
];

export type CheckResult = { name: string; ok: boolean; got: string; expected: string; score: number; reasons: string[]; pruned: string[]; note?: string };
export type Audit = { name: string; ok: boolean; detail: string };

/**
 * Structural audit of the question set. These are the invariants the UI relies on, so a
 * question that ships without a prompt, or a multi-select without its instruction, fails
 * here rather than in front of someone filling the form.
 */
export function auditQuestions(): Audit[] {
  const out: Audit[] = [];
  const add = (name: string, bad: string[], detail = "") => out.push({ name, ok: bad.length === 0, detail: bad.length ? bad.join(", ") : detail || "correcto" });

  add("Toda pregunta tiene enunciado", QUESTIONS.filter((q) => !q.prompt || q.prompt.trim().length < 6).map((q) => q.id));
  add("Toda pregunta de opciones tiene opciones", QUESTIONS.filter((q) => (q.kind === "single" || q.kind === "multi") && !q.options?.length).map((q) => q.id));
  add("Las opciones tienen valor y etiqueta", QUESTIONS.flatMap((q) => (q.options ?? []).filter((o) => !o.value || !o.label).map((o) => `${q.id}:${o.value || "?"}`)));
  add("No hay valores de opción repetidos", QUESTIONS.flatMap((q) => {
    const seen = new Set<string>();
    return (q.options ?? []).filter((o) => (seen.has(o.value) ? true : (seen.add(o.value), false))).map((o) => `${q.id}:${o.value}`);
  }));

  // Every multi-select must announce how many can be chosen.
  const multis = QUESTIONS.filter((q) => q.kind === "multi");
  add("Todo multi-select expone su instrucción", multis.filter((q) => !selectionHint(q)).map((q) => q.id));
  add(
    "Con límite, la instrucción dice cuántas",
    multis.filter((q) => q.max && selectionHint(q) !== `Selecciona hasta ${q.max} opciones.`).map((q) => q.id),
    multis.filter((q) => q.max).map((q) => `${q.id}: "${selectionHint(q)}"`).join(" · "),
  );
  add("Sin límite, la instrucción dice que se pueden varias", multis.filter((q) => !q.max && selectionHint(q) !== "Puedes seleccionar varias opciones.").map((q) => q.id));
  add("Ningún single-select muestra instrucción innecesaria", QUESTIONS.filter((q) => q.kind !== "multi" && selectionHint(q) !== null).map((q) => q.id));

  // "Otro" is answered in the same step, so the parent must declare where it goes.
  add("Toda opción 'Otro' tiene campo acompañante", QUESTIONS.filter((q) => (q.options ?? []).some((o) => o.opensText) && !q.textId).map((q) => q.id));
  add("Ningún campo acompañante es una pregunta suelta", QUESTIONS.filter((q) => QUESTIONS.some((p) => p.textId === q.id)).map((q) => q.id));

  // Exclusive options, both directions.
  const exclusiveQs = multis.filter((q) => (q.options ?? []).some((o) => o.exclusive));
  const exclusiveBad: string[] = [];
  for (const q of exclusiveQs) {
    const ex = q.options!.find((o) => o.exclusive)!.value;
    const others = q.options!.filter((o) => !o.exclusive).slice(0, 2).map((o) => o.value);
    const service = q.scope === "SCALE" ? "SCALE" : "BUILD";
    // pick others, then the exclusive one: only the exclusive survives
    let a: Answers = {};
    for (const o of others) a = setAnswer(service, a, q, o);
    a = setAnswer(service, a, q, ex);
    if (JSON.stringify(a[q.id]) !== JSON.stringify([ex])) exclusiveBad.push(`${q.id}: elegir exclusiva no limpió el resto`);
    // then pick another: the exclusive must go
    a = setAnswer(service, a, q, others[0]);
    if ((a[q.id] as string[]).includes(ex)) exclusiveBad.push(`${q.id}: elegir otra no soltó la exclusiva`);
  }
  add("Las opciones exclusivas funcionan en ambos sentidos", exclusiveBad, `${exclusiveQs.length} preguntas con opción exclusiva`);

  // The ceiling must refuse, not silently swap.
  const limitBad: string[] = [];
  for (const q of multis.filter((x) => x.max)) {
    const service = q.scope === "SCALE" ? "SCALE" : "BUILD";
    const picks = q.options!.filter((o) => !o.exclusive && !o.opensText).slice(0, q.max! + 1).map((o) => o.value);
    let a: Answers = {};
    for (const v of picks.slice(0, q.max!)) a = setAnswer(service, a, q, v);
    const extra = picks[q.max!];
    if (!isAtLimit(q, a, extra)) limitBad.push(`${q.id}: no detecta el tope`);
    const after = setAnswer(service, a, q, extra);
    if ((after[q.id] as string[]).length !== q.max) limitBad.push(`${q.id}: aceptó una de más`);
  }
  add("El tope de selección se respeta", limitBad);

  // Companion text is required only while its option is chosen.
  const compBad: string[] = [];
  for (const q of QUESTIONS.filter((x) => x.textId)) {
    const service = q.scope === "SCALE" ? "SCALE" : "BUILD";
    const other = q.options!.find((o) => o.opensText)!.value;
    let a = setAnswer(service, {}, q, other);
    if (!needsCompanionText(q, a)) compBad.push(`${q.id}: no pide el campo al elegir Otro`);
    a = setAnswer(service, a, q, other); // deselect (multi) or keep (single)
    if (q.kind === "multi" && needsCompanionText(q, a)) compBad.push(`${q.id}: sigue pidiéndolo tras deseleccionar`);
  }
  add("El campo de 'Otro' aparece y desaparece con su opción", compBad);

  // Every id in the order must exist, and every question must be reachable.
  for (const service of ["BUILD", "SCALE"] as const) {
    const list = questionsFor(service);
    const ids = new Set(list.map((q) => q.id));
    const unreachable = QUESTIONS.filter((q) => q.scope === service && !ids.has(q.id)).map((q) => q.id);
    add(`Todas las preguntas de ${service} están en el orden`, unreachable, `${list.length} preguntas`);
  }
  return out;
}

export function runJourneys(): { results: CheckResult[]; failures: number; branches: Record<string, number>; audit: Audit[]; auditFailures: number } {
  const results: CheckResult[] = [];
  for (const j of JOURNEYS) {
    const pruned = pruneAnswers(j.service, j.answers);
    const v = qualify(j.service, pruned);
    const note = j.also?.(v, pruned) ?? undefined;
    const ok = v.qualification === j.expect.qualification && (!j.expect.next_action || v.next_action === j.expect.next_action) && !note;
    results.push({
      name: j.name,
      ok,
      got: `${v.qualification} / ${v.next_action}`,
      expected: `${j.expect.qualification}${j.expect.next_action ? ` / ${j.expect.next_action}` : ""}`,
      score: v.lead_score,
      reasons: v.qualification_reasons,
      pruned: Object.keys(j.answers).filter((k) => !(k in pruned)),
      note,
    });
  }

  // Stale answers: changing a parent must delete everything its branch opened.
  const before: Answers = { monthly_revenue: "25K_50K", platform: "SHOPIFY", store_url: "t.com", paid_media: "YES", monthly_ad_spend: "GT_30K", ads_managed_by: "AGENCY", investment_capacity: "VARIABLE_ONLY", variable_model_metric: "PROFIT", main_bottlenecks: ["OTHER"], main_bottlenecks_other: "Logística", retention: "ACTIVE", email_tool: "KLAVIYO" };
  const after = pruneAnswers("SCALE", { ...before, paid_media: "NO", investment_capacity: "2_5K_4K", main_bottlenecks: ["LOW_AOV"], retention: "NO" });
  const leaked = ["monthly_ad_spend", "ads_managed_by", "variable_model_metric", "main_bottlenecks_other", "email_tool"].filter((k) => k in after);
  results.push({
    name: "Volver atrás y cambiar la respuesta padre elimina las ramas hijas",
    ok: leaked.length === 0,
    got: leaked.length ? `fugas: ${leaked.join(", ")}` : "sin fugas",
    expected: "sin fugas",
    score: qualify("SCALE", after).lead_score,
    reasons: qualify("SCALE", after).qualification_reasons,
    pruned: Object.keys(before).filter((k) => !(k in after)),
  });

  const branches: Record<string, number> = {
    "BUILD estándar": visibleQuestions("BUILD", { build_situation: "NEW_BRAND", build_complexity: ["STANDARD"], product_category: "FASHION" }).length,
    "BUILD con tienda existente": visibleQuestions("BUILD", { build_situation: "HAS_STORE", product_category: "OTHER" }).length,
    "BUILD solo idea": visibleQuestions("BUILD", { build_situation: "IDEA" }).length,
    "SCALE sin ventas": visibleQuestions("SCALE", { monthly_revenue: "NONE" }).length,
    "SCALE completo": visibleQuestions("SCALE", { monthly_revenue: "25K_50K", paid_media: "YES", retention: "ACTIVE", investment_capacity: "FIXED_VARIABLE", main_bottlenecks: ["OTHER"], product_category: "OTHER" }).length,
  };

  const audit = auditQuestions();
  return { results, failures: results.filter((r) => !r.ok).length, branches, audit, auditFailures: audit.filter((a) => !a.ok).length };
}
