/**
 * Form 2026-10-qualify-2: no question is asked twice.
 *   · «¿Dónde podemos verla?» (brand_link) only when the flow did not ask the store's URL;
 *   · the brand is asked once (the contact step no longer repeats it): the lead keeps it from the answers;
 *   · the CRM still gets the brand's link (or the store's URL).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { visibleQuestions, pruneAnswers } from "../src/lib/qualify/flow.ts";
import { FORM_VERSION } from "../src/lib/qualify/types.ts";
import { toLeadInput } from "../src/lib/crm/canonical.ts";

const ids = (service, answers) => visibleQuestions(service, answers).map((q) => q.id);

describe("each question once", () => {
  test("the form version says the flow changed", () => {
    assert.equal(FORM_VERSION, "2026-10-qualify-2");
  });

  test("SCALE already selling: store URL asked, «¿Dónde podemos verla?» not", () => {
    const v = ids("SCALE", { monthly_revenue: "10K_25K" });
    assert.ok(v.includes("store_url"));
    assert.ok(!v.includes("brand_link"));
    assert.equal(v.filter((id) => id === "brand_name").length, 1);
  });

  test("SCALE not selling yet (no store URL): «¿Dónde podemos verla?» is asked", () => {
    const v = ids("SCALE", { monthly_revenue: "NONE" });
    assert.ok(!v.includes("store_url"));
    assert.ok(v.includes("brand_link"));
  });

  test("BUILD with a store to redo: store URL only; any other situation: «¿Dónde podemos verla?»", () => {
    const withStore = ids("BUILD", { build_situation: "HAS_STORE" });
    assert.ok(withStore.includes("build_store_url") && !withStore.includes("brand_link"));
    for (const situation of ["SELLS_NO_STORE", "NEW_BRAND", "IDEA"]) {
      const v = ids("BUILD", { build_situation: situation });
      assert.ok(v.includes("brand_link") && !v.includes("build_store_url"), situation);
    }
  });

  test("a stale «¿Dónde podemos verla?» answer is dropped once the store URL is asked", () => {
    const pruned = pruneAnswers("SCALE", { monthly_revenue: "10K_25K", store_url: "tienda.example", brand_link: "@marca" });
    assert.equal(pruned.brand_link, undefined);
    assert.equal(pruned.store_url, "tienda.example");
  });

  test("the CRM gets the brand from the answers and the store URL as the company link", () => {
    const base = {
      lead_id: "lead_test_0001", service: "SCALE", form_version: FORM_VERSION, created_at: "2026-10-14T10:00:00.000Z",
      contact_name: "Ana Prueba", email: "ana@marca.example", phone: "+34600000000", brand_name: "Marca Ficticia",
      answers: { monthly_revenue: "10K_25K", store_url: "tienda.example", brand_name: "Marca Ficticia" },
      consent_contact: true,
    };
    const p = toLeadInput(base, { fallbackEventId: "f", fallbackSubmittedAt: "2026-10-14T10:00:00.000Z" });
    assert.deepEqual(p.company, { name: "Marca Ficticia", link: "tienda.example" });
    assert.equal(p.form.version, "2026-10-qualify-2");
    const ig = toLeadInput({ ...base, answers: { monthly_revenue: "NONE", brand_link: "@marca", brand_name: "Marca Ficticia" } }, { fallbackEventId: "f", fallbackSubmittedAt: "2026-10-14T10:00:00.000Z" });
    assert.equal(ig.company.link, "@marca");
  });
});
