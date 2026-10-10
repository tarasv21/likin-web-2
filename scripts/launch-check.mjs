/**
 * Launch preflight for Meta Ads (Vía 1: website without CRM, Resend + legacy webhook, Meta Pixel).
 * READ-ONLY: Git, CI, legal data, Vercel (plan and Production variable NAMES, never values), mail
 * DNS. With --after it also probes the live site without sending any lead.
 *   npm run launch:check                 before merging (what is still missing)
 *   npm run launch:check -- --after      after the production deploy (https://www.likinagency.com)
 * Needs the Vercel CLI logged in (team likin-agency) and gh for the CI status.
 */
import { spawnSync } from "node:child_process";
import { resolveTxt, resolveMx } from "node:dns/promises";
import { legal } from "../src/data/legal.ts";

const BRANCH = "feature/crm-ingestion";
const PROJECT = "likin-web-2";
const TEAM = "likin-agency";
const SITE = "https://www.likinagency.com";
const after = process.argv.includes("--after");
let failed = 0;
const ok = (label, pass, detail = "") => {
  if (!pass) failed++;
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? ` · ${detail}` : ""}`);
};
const sh = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const vercel = (path) => {
  const r = sh("npx", ["vercel", "api", path, "--scope", TEAM]);
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
};
const txt = async (name) => {
  try {
    return (await resolveTxt(name)).map((parts) => parts.join(""));
  } catch {
    return [];
  }
};

console.log("— Código");
if (!after) {
  const branch = sh("git", ["branch", "--show-current"]).stdout.trim();
  ok(`rama ${BRANCH}`, branch === BRANCH, branch);
  ok("sin cambios sin guardar", sh("git", ["status", "--porcelain"]).stdout.trim() === "");
  sh("git", ["fetch", "-q", "origin", BRANCH]);
  const head = sh("git", ["rev-parse", "HEAD"]).stdout.trim();
  ok("subida a GitHub", head === sh("git", ["rev-parse", `origin/${BRANCH}`]).stdout.trim(), head.slice(0, 7));
  const ci = sh("gh", ["run", "list", "--commit", head, "--json", "conclusion,status", "-q", ".[0].status + \" \" + (.[0].conclusion // \"\")"]).stdout.trim();
  ok("CI en verde para ese commit", ci === "completed success", ci || "sin ejecución");
}

console.log("— Textos legales (src/data/legal.ts)");
for (const [key, label] of [["holder", "titular"], ["tradeName", "nombre comercial"], ["taxId", "NIF/NIE"], ["address", "domicilio"], ["retention", "plazos de conservación"], ["transfers", "transferencias internacionales"]]) ok(`${label} rellenado`, Boolean(legal[key]?.trim()));
ok("revisión jurídica confirmada (reviewed: true)", legal.reviewed === true);

console.log("— Vercel");
const teams = vercel("/v2/teams?limit=20");
const plan = teams?.teams?.find((t) => t.slug === TEAM)?.billing?.plan;
ok("plan Pro (uso comercial)", plan === "pro", plan ?? "desconocido");
const envs = vercel(`/v10/projects/${PROJECT}/env?decrypt=false`)?.envs ?? [];
const prod = envs.filter((e) => (e.target ?? []).includes("production") && !e.gitBranch);
const has = (k) => prod.find((e) => e.key === k);
ok("Production: LEAD_WEBHOOK_URL sigue (no se toca)", Boolean(has("LEAD_WEBHOOK_URL")));
ok("Production: RESEND_API_KEY sensible", has("RESEND_API_KEY")?.type === "sensitive", has("RESEND_API_KEY") ? has("RESEND_API_KEY").type : "falta");
ok("Production: LEAD_EMAIL_FROM", Boolean(has("LEAD_EMAIL_FROM")), has("LEAD_EMAIL_FROM") ? "" : "falta");
ok("Production: NEXT_PUBLIC_META_PIXEL_ID", Boolean(has("NEXT_PUBLIC_META_PIXEL_ID")), has("NEXT_PUBLIC_META_PIXEL_ID") ? "" : "falta");
const crm = prod.filter((e) => e.key.startsWith("CRM_INGEST_")).map((e) => e.key);
ok("Production: ninguna variable del CRM (Vía 1)", crm.length === 0, crm.join(", "));
const resendPreview = envs.find((e) => e.key === "RESEND_API_KEY" && (e.target ?? []).includes("preview") && !e.gitBranch);
ok("la clave de Resend no está abierta a todos los previews", !resendPreview);

console.log("— Correo de likinagency.com");
const mx = await resolveMx("likinagency.com").catch(() => []);
ok("MX de Google", mx.some((m) => /google\.com\.?$/i.test(m.exchange)));
const spf = (await txt("likinagency.com")).filter((t) => t.startsWith("v=spf1"));
ok("SPF con Google", spf.length === 1 && spf[0].includes("include:_spf.google.com"), spf.length > 1 ? "hay más de un SPF" : spf[0] ?? "falta");
ok("DKIM de Google (google._domainkey)", (await txt("google._domainkey.likinagency.com")).some((t) => t.includes("v=DKIM1") || t.includes("p=")));
ok("DMARC", (await txt("_dmarc.likinagency.com")).some((t) => t.startsWith("v=DMARC1")));
ok("DKIM de Resend (resend._domainkey)", (await txt("resend._domainkey.likinagency.com")).some((t) => t.includes("p=")));
const sendMx = await resolveMx("send.likinagency.com").catch(() => []);
const region = /feedback-smtp\.([a-z0-9-]+)\.amazonses\.com/.exec(sendMx[0]?.exchange ?? "")?.[1];
console.log(`· región de envío de Resend: ${region ?? "desconocida"}${region === "ap-northeast-1" ? " (Tokio)" : region === "eu-west-1" ? " (Irlanda)" : ""}`);

if (after) {
  console.log(`— Web en producción (${SITE}), sin enviar ningún lead`);
  const get = (p, init) => fetch(`${SITE}${p}`, { redirect: "manual", ...init });
  for (const p of ["/", "/crear-tienda-online", "/escalar-ecommerce"]) ok(`${p} responde 200`, (await get(p)).status === 200);
  const privacy = await (await get("/privacidad")).text();
  ok("privacidad sin datos pendientes", !privacy.includes("[pendiente") && privacy.includes(legal.holder || "\u0000"));
  ok("privacidad sin aviso de texto provisional", !privacy.includes("Texto provisional"));
  ok("cookies menciona el píxel de Meta", (await (await get("/cookies")).text()).includes("píxel de Meta"));
  ok("/api/lead no acepta GET", [404, 405].includes((await get("/api/lead")).status));
  const bad = await get("/api/lead", { method: "POST", headers: { "content-type": "application/json", origin: SITE }, body: "{}" });
  ok("/api/lead rechaza un envío vacío (400, sin crear nada)", bad.status === 400, String(bad.status));
  const deps = vercel(`/v6/deployments?projectId=${PROJECT}&target=production&limit=1`)?.deployments?.[0];
  ok("último despliegue de producción listo", deps?.state === "READY" || deps?.readyState === "READY", `${deps?.meta?.githubCommitSha?.slice(0, 7) ?? "?"} ${deps?.url ?? ""}`);
}

console.log(failed ? `\nFalta(n) ${failed} punto(s).` : "\nTodo listo.");
process.exitCode = failed ? 1 : 0;
