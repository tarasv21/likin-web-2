#!/usr/bin/env node
/**
 * Secret scan without dependencies (runs locally and in CI before anything is committed/built).
 *   npm run secret-scan               working tree (what the next commit would contain)
 *   npm run secret-scan -- --history  every commit of every branch (before pushing)
 * Scans every file git would commit (tracked + untracked, honouring .gitignore); outside a git
 * repository, every file except node_modules/.next. Findings are printed REDACTED (file, line,
 * kind) — never the value. Exit code 1 on any finding.
 * Copy of likin-crm/scripts/secret-scan.mjs (keep both in sync). CI runs it on the tree and the history.
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const BINARY = /\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|otf|pdf|zip|gz|wasm|mp4|mov)$/i;

function files() {
  try {
    const out = execSync("git ls-files -z --cached --others --exclude-standard", { stdio: ["ignore", "pipe", "ignore"] }).toString();
    return out.split("\0").filter(Boolean);
  } catch {
    const acc = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        if (["node_modules", ".next", ".git"].includes(name)) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else acc.push(relative(root, p));
      }
    };
    walk(root);
    return acc;
  }
}

// Long enough to be real; the test suite's placeholders ("sb_secret_abc") stay below these lengths.
const PATTERNS = [
  ["Supabase secret key", /sb_secret_[A-Za-z0-9_-]{20,}/],
  ["Supabase publishable key (belongs in .env.local, not in the repo)", /sb_publishable_[A-Za-z0-9_-]{20,}/],
  ["JWT (legacy anon/service_role key or session)", /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/],
  ["Postgres URL with password", /postgres(?:ql)?:\/\/[^:\s/@]+:[^@\s<>]{6,}@/],
  ["Private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{36,}/],
  ["Stripe live key", /(?:sk|rk)_live_[A-Za-z0-9]{20,}/],
  ["Google API key", /AIza[0-9A-Za-z_-]{35}/],
  ["Slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ["Assigned secret in env syntax", /^(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_URL|SEED_DEMO_PASSWORD|SUPABASE_SECRET_KEY|CRM_INGEST_PROOF|CRM_INGEST_WEB_KEYS|CRM_INGEST_SECRET)\s*=\s*\S{8,}/m],
  ["Lead Ingestion website HMAC key", /lkw_[A-Za-z0-9_-]{40,}/],
  ["Lead Ingestion proof token", /lkp_[A-Za-z0-9_-]{40,}/],
];
const FORBIDDEN_FILES = [/(^|\/)\.env(\.(?!example$)[^/]*)?$/, /\.(pem|key|p12|pfx)$/i, /service-account.*\.json$/i];

const findings = [];

if (process.argv.includes("--history")) {
  // Every added line in the whole history, file by file (binary diffs are skipped by git).
  let log = "";
  try {
    log = execSync("git log --all -p --no-color --no-ext-diff --format=commit:%h", { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 512 * 1024 * 1024 }).toString();
  } catch {
    console.error("✗ No es un repositorio git.");
    process.exit(1);
  }
  let commit = "";
  let file = "";
  let commits = 0;
  for (const line of log.split("\n")) {
    if (line.startsWith("commit:")) {
      commit = line.slice(7);
      commits += 1;
    } else if (line.startsWith("+++ b/")) {
      file = line.slice(6);
      if (FORBIDDEN_FILES.some((re) => re.test(file))) findings.push(`${commit} ${file}: file must never be committed`);
    } else if (line.startsWith("+") && !line.startsWith("+++") && file !== "package-lock.json") {
      for (const [kind, re] of PATTERNS) if (re.test(line.slice(1))) findings.push(`${commit} ${file}: ${kind}`);
    }
  }
  if (findings.length) {
    console.error(`✗ Posibles secretos en el historial (${findings.length}) — valores ocultos:`);
    for (const x of findings) console.error(`  ${x}`);
    process.exit(1);
  }
  console.log(`✓ Sin secretos en el historial (${commits} commits).`);
  process.exit(0);
}

for (const f of files()) {
  if (FORBIDDEN_FILES.some((re) => re.test(f))) findings.push(`${f}: file must never be committed`);
  if (BINARY.test(f) || f === "package-lock.json") continue;
  let text;
  try {
    text = readFileSync(join(root, f), "utf8");
  } catch {
    continue;
  }
  const lines = text.split("\n");
  for (const [kind, re] of PATTERNS) {
    lines.forEach((line, i) => {
      if (re.test(line)) findings.push(`${f}:${i + 1}: ${kind}`);
    });
  }
}

if (findings.length) {
  console.error(`✗ Posibles secretos (${findings.length}) — valores ocultos:`);
  for (const x of findings) console.error(`  ${x}`);
  process.exit(1);
}
console.log(`✓ Sin secretos en ${files().length} ficheros.`);
