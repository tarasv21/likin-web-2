/**
 * QUALIFY — data model.
 *
 * One shape for every lead, BUILD or SCALE, designed to be handed to a CRM later without
 * reshaping. Answers are stored flat by question id; everything derived (qualification,
 * score, reasons, next action) is recomputed from the answers, never stored by the UI.
 */

export const FORM_VERSION = "2026-09-qualify-1";

export type Service = "BUILD" | "SCALE";

export type Qualification = "READY" | "HIGH_FIT" | "FIT" | "REVIEW" | "NOT_READY";

export type NextAction = "STRIPE" | "BOOK_CALL" | "MANUAL_REVIEW" | "NURTURE" | "CLOSED";

/** Commercial preference the lead expressed. Never a contractual promise. */
export type PricingModel = "FIXED" | "FIXED_VARIABLE" | "VARIABLE";

export type Timing = "NOW" | "30_DAYS" | "90_DAYS" | "EXPLORING";

/** An answer is a single value, a list (multi-select) or free text. */
export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue | undefined>;

/** Contact details. Collected last, and only when the flow reaches a contactable outcome. */
export type Contact = {
  contact_name: string;
  email: string;
  phone: string;
  brand_name: string;
  additional_notes?: string;
  /** Explicit, unticked-by-default consent to be contacted about this enquiry. */
  consent_contact: boolean;
  /** Separate, optional consent to keep the data for future communications. */
  consent_nurture: boolean;
};

export type Attribution = {
  source: string;
  landing_page: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
};

export type Verdict = {
  qualification: Qualification;
  next_action: NextAction;
  /** Stable, machine-readable reasons. The CRM reads these, never the copy. */
  qualification_reasons: string[];
  /** 0–100, internal only. Never rendered. */
  lead_score: number;
  requires_manual_review: boolean;
  /** When SCALE does not fit but BUILD might. */
  recommend_service?: Service;
};

/** The payload a CRM/API would receive. Flat, stable, no UI concepts. */
export type Lead = {
  lead_id: string;
  created_at: string;
  form_version: string;

  source: string;
  landing_page: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;

  service: Service;

  qualification: Qualification;
  lead_score: number;
  qualification_reasons: string[];
  requires_manual_review: boolean;
  next_action: NextAction;

  intent?: string;

  brand_name?: string;
  website?: string;
  instagram?: string;
  business_role?: string;
  product_category?: string;

  monthly_revenue?: string;
  monthly_ad_spend?: string;
  investment_capacity?: string;

  platform?: string;
  product_count?: string;

  main_bottlenecks?: string[];
  services_interested?: string[];

  pricing_model?: PricingModel;
  variable_model_metric?: string;

  contact_name?: string;
  email?: string;
  phone?: string;
  additional_notes?: string;

  consent_contact?: boolean;
  consent_nurture?: boolean;

  /** Everything else, verbatim, so no answer is ever lost. */
  answers: Answers;
};

/* ── Questions ───────────────────────────────────────────────────────────── */

export type QuestionKind = "single" | "multi" | "text" | "url" | "contact";

export type Option = {
  value: string;
  label: string;
  /** One line under the label when it earns its place. */
  hint?: string;
  /** Reveals a short free-text field when chosen ("Otro"). */
  opensText?: boolean;
  /** In a multi-select, choosing this clears every other option. */
  exclusive?: boolean;
};

export type Question = {
  id: string;
  /** Which flow it belongs to. "COMMON" appears in both. */
  scope: Service | "COMMON";
  kind: QuestionKind;
  prompt: string;
  /** Only when it adds information the prompt cannot carry. */
  help?: string;
  /** A short framed note shown above the options (e.g. the BUILD price). */
  note?: string;
  options?: Option[];
  /** Multi-select ceiling. */
  max?: number;
  placeholder?: string;
  optional?: boolean;
  /** Id of the companion text answer when an option has `opensText`. */
  textId?: string;
  /** Shown only when this returns true. Drives both branching and stale-answer pruning. */
  when?: (a: Answers) => boolean;
  /** Returns an error message, or null when valid. */
  validate?: (v: AnswerValue | undefined, a: Answers) => string | null;
};
