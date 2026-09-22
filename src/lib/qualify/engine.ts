/**
 * QUALIFY — qualification engine.
 *
 * Deterministic and auditable: the same answers always produce the same verdict, and every
 * verdict carries the reasons that produced it. No model, no heuristics scattered through
 * components — all weights live in the tables at the top of this file.
 *
 * Two layers:
 *   1. Hard gates. Facts that settle the outcome on their own (no product, budget below the
 *      floor, no sales yet). They short-circuit.
 *   2. Signals. Everything else contributes points and a reason code; the band is read off
 *      the total, then corrected by rules that must override a score (manual review).
 *
 * `lead_score` is internal. It is never rendered and never sent to an ad platform.
 */
import type { Answers, PricingModel, Qualification, Service, Verdict } from "./types";

/* ── Weights. One place. ─────────────────────────────────────────────────── */

const REVENUE_POINTS: Record<string, number> = { NONE: 0, LT_5K: 4, "5K_10K": 12, "10K_25K": 24, "25K_50K": 30, "50K_100K": 34, GT_100K: 36 };
const AD_SPEND_POINTS: Record<string, number> = { LT_1K: 3, "1K_3K": 8, "3K_10K": 14, "10K_30K": 17, GT_30K: 18 };
const INVESTMENT_POINTS: Record<string, number> = { LT_1K: 0, "1K_1_5K": 8, "1_5K_2_5K": 16, "2_5K_4K": 21, GT_4K: 24, FIXED_VARIABLE: 14, VARIABLE_ONLY: 6 };
const TIMING_POINTS: Record<string, number> = { NOW: 12, "30_DAYS": 9, "90_DAYS": 4, EXPLORING: 0 };
const ROLE_POINTS: Record<string, number> = { FOUNDER: 10, DECISION_MAKER: 8, NEEDS_APPROVAL: 3, AGENCY: 2 };
const MATURITY_POINTS: Record<string, number> = { YES: 8, ROUGHLY: 5, NO: 1, UNKNOWN_TERM: 0 };
const CHANGE_POINTS: Record<string, number> = { YES: 10, WITH_LIKIN: 8, DEPENDS: 4, ADS_ONLY: 0 };
const PRODUCT_COUNT_POINTS: Record<string, number> = { "1_10": 12, "11_30": 12, "31_50": 8, "51_100": 5, "100_PLUS": 4 };
const BUILD_BUDGET_POINTS: Record<string, number> = { YES: 24, INSTALLMENTS: 20, HIGHER: 22, BELOW: 0 };
const BUILD_SITUATION_POINTS: Record<string, number> = { SELLS_NO_STORE: 18, HAS_STORE: 16, NEW_BRAND: 12, IDEA: 4 };
const BUILD_COLLAB_POINTS: Record<string, number> = { YES: 10, WITH_HELP: 8, UNSURE: 4, FULL_SERVICE: 7 };

/** Features that put a BUILD outside the standard scope. */
const OUT_OF_SCOPE = ["ERP", "MARKETPLACE", "B2B", "ADVANCED_CONFIGURATOR", "SPECIAL_INTEGRATIONS"] as const;
/** Catalogue sizes that need a look before quoting. */
const LARGE_CATALOG = ["51_100", "100_PLUS"] as const;

/**
 * Bands read against a normalised 0–100 score, so a change to any weight cannot silently
 * move every lead a band up or down.
 */
const SCALE_BANDS = { HIGH_FIT: 72, FIT: 52, REVIEW: 30 } as const;
const BUILD_BANDS = { READY: 78, FIT: 48 } as const;

/** Maximum reachable raw score per service, used to normalise. Keep in step with the tables. */
const MAX_RAW = {
  // situation 18 · count 12 · budget 24 · timing 12 · role 10 · collaboration 10 · standard 10 · materials 10
  BUILD: 106,
  // revenue 36 · ad spend 18 · paid active 4 · investment 24 · timing 12 · role 10 · CAC 8 · change 10 · services 12 · retention 3
  SCALE: 137,
} as const;

/** SCALE is sold to stores already past ~10K/month. Below that a human always looks first. */
const REVENUE_BELOW_FLOOR = ["LT_5K", "5K_10K"] as const;
/** Below this the standard retainer does not exist, whatever the rest of the profile says. */
const INVESTMENT_BELOW_MODEL = ["LT_1K", "1K_1_5K"] as const;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const one = (a: Answers, id: string) => (typeof a[id] === "string" ? (a[id] as string) : undefined);
const many = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);
const normalise = (raw: number, max: number) => Math.max(0, Math.min(100, Math.round((raw / max) * 100)));

class Tally {
  score = 0;
  reasons: string[] = [];
  add(points: number, reason?: string) {
    this.score += points;
    if (reason) this.reasons.push(reason);
  }
  flag(reason: string) {
    this.reasons.push(reason);
  }
}

/* ── BUILD ───────────────────────────────────────────────────────────────── */

function qualifyBuild(a: Answers): Verdict {
  const t = new Tally();
  const situation = one(a, "build_situation");
  const productDefined = one(a, "build_product_defined");
  const budget = one(a, "build_budget");
  const count = one(a, "product_count");
  const complexity = many(a, "build_complexity");
  const readiness = many(a, "build_readiness");
  const timing = one(a, "timing");
  const role = one(a, "business_role");
  const collab = one(a, "build_collaboration");

  // ── Hard gates
  if (situation === "IDEA" && productDefined === "NO") {
    return {
      qualification: "NOT_READY",
      next_action: "CLOSED",
      qualification_reasons: ["BUILD_PRODUCT_NOT_DEFINED"],
      lead_score: 5,
      requires_manual_review: false,
    };
  }
  if (budget === "BELOW") {
    return {
      qualification: "NOT_READY",
      next_action: "CLOSED",
      qualification_reasons: ["BUILD_BUDGET_BELOW_MINIMUM"],
      lead_score: 10,
      requires_manual_review: false,
    };
  }

  // ── Signals
  if (situation) t.add(BUILD_SITUATION_POINTS[situation] ?? 0, `BUILD_SITUATION_${situation}`);
  if (productDefined) t.flag(`BUILD_PRODUCT_${productDefined}`);
  if (count) t.add(PRODUCT_COUNT_POINTS[count] ?? 0, `PRODUCT_COUNT_${count}`);
  if (budget) t.add(BUILD_BUDGET_POINTS[budget] ?? 0, `BUILD_BUDGET_${budget}`);
  if (timing) t.add(TIMING_POINTS[timing] ?? 0, `TIMING_${timing}`);
  if (role) t.add(ROLE_POINTS[role] ?? 0, `ROLE_${role}`);
  if (collab) t.add(BUILD_COLLAB_POINTS[collab] ?? 0, `BUILD_COLLABORATION_${collab}`);

  const outOfScope = OUT_OF_SCOPE.filter((f) => complexity.includes(f));
  for (const f of outOfScope) t.flag(`BUILD_SCOPE_${f}`);
  const standard = complexity.includes("STANDARD");
  if (standard) t.add(10, "BUILD_STANDARD_SCOPE");
  if (complexity.includes("UNSURE")) t.flag("BUILD_SCOPE_UNSURE");
  // Subscriptions, a customer area or configurable products are still BUILD, but not one-click.
  const midScope = ["SUBSCRIPTIONS", "CUSTOMER_AREA", "CONFIGURABLE"].filter((f) => complexity.includes(f));
  for (const f of midScope) t.flag(`BUILD_SCOPE_${f}`);

  const prepared = readiness.filter((r) => r !== "NOTHING").length;
  t.add(Math.min(prepared, 4) * 2.5, prepared ? `BUILD_MATERIALS_${prepared}` : "BUILD_MATERIALS_NONE");
  if (readiness.includes("NOTHING")) t.flag("BUILD_MATERIALS_NONE");

  const score = normalise(t.score, MAX_RAW.BUILD);

  // ── Corrections that must win over the score
  const largeCatalog = count ? (LARGE_CATALOG as readonly string[]).includes(count) : false;
  const requiresReview = outOfScope.length > 0 || largeCatalog || budget === "HIGHER";
  if (largeCatalog) t.flag("BUILD_LARGE_CATALOG");
  if (budget === "HIGHER") t.flag("BUILD_BUDGET_ABOVE_STANDARD");

  if (requiresReview) {
    return { qualification: "REVIEW", next_action: "MANUAL_REVIEW", qualification_reasons: t.reasons, lead_score: score, requires_manual_review: true };
  }

  // A project with nothing prepared and no defined product is not ready to build yet.
  const nothingReady = readiness.includes("NOTHING") && (situation === "IDEA" || situation === "NEW_BRAND") && productDefined !== "YES";
  if (nothingReady) {
    t.flag("BUILD_PROJECT_NOT_PREPARED");
    return { qualification: "NOT_READY", next_action: "NURTURE", qualification_reasons: t.reasons, lead_score: score, requires_manual_review: false };
  }

  // Checkout is only offered when the scope is genuinely standard and nothing needs deciding.
  const cleanScope = standard && midScope.length === 0 && !complexity.includes("UNSURE");
  const smallCatalog = count === "1_10" || count === "11_30";
  const budgetOk = budget === "YES" || budget === "INSTALLMENTS";
  const soon = timing === "NOW" || timing === "30_DAYS";
  const productOk = situation !== "IDEA" || productDefined === "YES";

  if (cleanScope && smallCatalog && budgetOk && soon && productOk && prepared >= 2 && score >= BUILD_BANDS.READY) {
    t.flag("BUILD_STANDARD_READY");
    return { qualification: "READY", next_action: "STRIPE", qualification_reasons: t.reasons, lead_score: score, requires_manual_review: false };
  }
  if (score >= BUILD_BANDS.FIT) {
    return { qualification: "FIT", next_action: "BOOK_CALL", qualification_reasons: t.reasons, lead_score: score, requires_manual_review: false };
  }
  return { qualification: "REVIEW", next_action: "MANUAL_REVIEW", qualification_reasons: t.reasons, lead_score: score, requires_manual_review: true };
}

/* ── SCALE ───────────────────────────────────────────────────────────────── */

function qualifyScale(a: Answers): Verdict {
  const t = new Tally();
  const revenue = one(a, "monthly_revenue");
  const adSpend = one(a, "monthly_ad_spend");
  const paidMedia = one(a, "paid_media");
  const investment = one(a, "investment_capacity");
  const timing = one(a, "timing");
  const role = one(a, "business_role");
  const cac = one(a, "cac_clarity");
  const change = one(a, "change_capacity");
  const services = many(a, "services_interested");
  const team = many(a, "growth_team");
  const retention = one(a, "retention");

  // ── Hard gate: SCALE is for stores that already sell.
  if (revenue === "NONE") {
    return {
      qualification: "NOT_READY",
      next_action: "NURTURE",
      qualification_reasons: ["SCALE_NO_SALES"],
      lead_score: 5,
      requires_manual_review: false,
      recommend_service: "BUILD",
    };
  }

  // ── Signals
  if (revenue) t.add(REVENUE_POINTS[revenue] ?? 0, `REVENUE_${revenue}`);
  if (adSpend) t.add(AD_SPEND_POINTS[adSpend] ?? 0, `AD_SPEND_${adSpend}`);
  if (paidMedia === "YES") t.add(4, "PAID_MEDIA_ACTIVE");
  else if (paidMedia === "PAST") t.flag("PAID_MEDIA_PAST");
  else if (paidMedia === "NO") t.flag("PAID_MEDIA_NONE");
  if (investment) t.add(INVESTMENT_POINTS[investment] ?? 0, `INVESTMENT_${investment}`);
  if (timing) t.add(TIMING_POINTS[timing] ?? 0, `TIMING_${timing}`);
  if (role) t.add(ROLE_POINTS[role] ?? 0, `ROLE_${role}`);
  if (cac) t.add(MATURITY_POINTS[cac] ?? 0, `CAC_${cac}`);
  if (change) t.add(CHANGE_POINTS[change] ?? 0, `CHANGE_CAPACITY_${change}`);
  if (services.includes("FULL_GROWTH")) t.add(8, "FULL_GROWTH_INTEREST");
  if (services.includes("DIAGNOSIS")) t.add(4, "DIAGNOSIS_INTEREST");
  if (services.includes("UNDECIDED")) t.flag("SERVICES_UNDECIDED");
  if (team.includes("NOBODY")) t.flag("NO_GROWTH_TEAM");
  if (retention === "ACTIVE") t.add(3, "RETENTION_ACTIVE");
  else if (retention === "NO") t.flag("RETENTION_NONE");

  const score = normalise(t.score, MAX_RAW.SCALE);

  // ── Corrections that must win over the score
  const variableOnly = investment === "VARIABLE_ONLY";
  const belowFloor = investment ? (INVESTMENT_BELOW_MODEL as readonly string[]).includes(investment) : false;
  const lowBudget = investment === "LT_1K";
  const adsOnly = change === "ADS_ONLY";
  const lowRevenue = revenue === "LT_5K";
  const underRevenueFloor = revenue ? (REVENUE_BELOW_FLOOR as readonly string[]).includes(revenue) : false;
  if (variableOnly) t.flag("PRICING_VARIABLE_ONLY");
  if (belowFloor) t.flag("INVESTMENT_BELOW_MODEL");
  if (adsOnly) t.flag("ADS_ONLY");
  if (underRevenueFloor) t.flag("REVENUE_BELOW_SCALE_FLOOR");

  // A variable-only request is never auto-rejected and never auto-accepted: a human decides.
  if (variableOnly) {
    return { qualification: "REVIEW", next_action: "MANUAL_REVIEW", qualification_reasons: t.reasons, lead_score: score, requires_manual_review: true };
  }

  // Selling very little and unable to fund a retainer: SCALE is not the honest answer yet.
  if (lowRevenue && lowBudget) {
    t.flag("SCALE_TOO_EARLY");
    return { qualification: "NOT_READY", next_action: "NURTURE", qualification_reasons: t.reasons, lead_score: score, requires_manual_review: false, recommend_service: "BUILD" };
  }

  let band: Qualification = score >= SCALE_BANDS.HIGH_FIT ? "HIGH_FIT" : score >= SCALE_BANDS.FIT ? "FIT" : score >= SCALE_BANDS.REVIEW ? "REVIEW" : "NOT_READY";

  // Ads-only shrinks the fit, because SCALE is a growth system and not campaign babysitting.
  if (adsOnly && (band === "HIGH_FIT" || band === "FIT")) band = "REVIEW";
  // Under the revenue floor or under the retainer floor, a person decides. Never an auto-yes,
  // never an auto-no: these cap the band at REVIEW instead of rejecting.
  if ((underRevenueFloor || belowFloor) && (band === "HIGH_FIT" || band === "FIT")) band = "REVIEW";

  const next_action = band === "HIGH_FIT" || band === "FIT" ? "BOOK_CALL" : band === "REVIEW" ? "MANUAL_REVIEW" : "NURTURE";
  return {
    qualification: band,
    next_action,
    qualification_reasons: t.reasons,
    lead_score: score,
    requires_manual_review: band === "REVIEW",
    recommend_service: band === "NOT_READY" ? "BUILD" : undefined,
  };
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export function qualify(service: Service, answers: Answers): Verdict {
  return service === "BUILD" ? qualifyBuild(answers) : qualifyScale(answers);
}

/** The commercial model the lead expressed a preference for. Not a commitment by Likin. */
export function pricingModelOf(answers: Answers): PricingModel | undefined {
  const v = typeof answers.investment_capacity === "string" ? answers.investment_capacity : undefined;
  if (!v) return undefined;
  if (v === "VARIABLE_ONLY") return "VARIABLE";
  if (v === "FIXED_VARIABLE") return "FIXED_VARIABLE";
  return "FIXED";
}

/**
 * Whether to ask for contact details at all.
 *
 * NOT_READY never does. We are not going to work with them now, so collecting a phone number
 * would be taking personal data for a conversation that is not happening. Nurture, if it ever
 * exists, starts from someone choosing to write to us.
 */
export const collectsContact = (v: Verdict) => v.qualification !== "NOT_READY";

/**
 * A hard gate has fired and nothing later can change the answer. The flow jumps straight to
 * the result instead of walking someone through questions whose answers we will not use.
 */
export function isTerminal(service: Service, a: Answers): boolean {
  if (service === "BUILD") {
    return (one(a, "build_situation") === "IDEA" && one(a, "build_product_defined") === "NO") || one(a, "build_budget") === "BELOW";
  }
  return one(a, "monthly_revenue") === "NONE";
}
