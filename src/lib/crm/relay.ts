/**
 * CRM relay (SERVER ONLY): signs a lead and sends it to LIKIN CRM, POST /api/ingest/web.
 *
 * Authentication: HMAC-SHA256 with this website's own key (never the CRM's ingestion proof).
 *   x-likin-key-id     key id (public, identifies the key)
 *   x-likin-timestamp  seconds since the epoch; the CRM accepts ±5 minutes
 *   x-likin-signature  "v1=" + hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`))
 * The body bytes are identical on every attempt (same event id, same content), so a retry is
 * idempotent in the CRM; only the timestamp and the signature change.
 *
 * Statuses (the CRM's contract): processed · duplicate (already in the CRM) · received (durably
 * kept in the CRM's intake tray, not yet a lead) · rejected (4xx: never retried) ·
 * retryable_failure (429/5xx after the retries) · unreachable (network/timeout after the retries).
 *
 * No Next.js imports: plain Node, testable with `node --test`. Never logs the secret, the
 * signature or the body.
 */
import { createHmac } from "node:crypto";

export const SIGNATURE_VERSION = "v1";

/**
 * `bypass`: Vercel's "Protection Bypass for Automation" secret of the CRM project, only while the
 * CRM is a protected preview (L2 validation). Server side only, sent as a header, never logged.
 */
export type CrmConfig = { url: string; keyId: string; secret: string; bypass?: string };
export type CrmStatus = "processed" | "duplicate" | "received" | "rejected" | "retryable_failure" | "unreachable";
export type RelayResult = { status: CrmStatus; attempts: number; code?: string; httpStatus?: number; receipt?: string; pending?: string };

type Fetch = (input: string, init: RequestInit) => Promise<Response>;
export type RelayOptions = {
  fetch?: Fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  /** Total time for every attempt together (the visitor is waiting). */
  budgetMs?: number;
  attemptTimeoutMs?: number;
  maxAttempts?: number;
};

const KEY_ID = /^[a-z0-9][a-z0-9-]{2,39}$/;
const BYPASS = /^[A-Za-z0-9_-]{16,128}$/;

/** Null unless the three variables are set and well formed (a misconfigured relay stays off). */
export function crmConfigFromEnv(env: Record<string, string | undefined>): CrmConfig | null {
  const url = env.CRM_INGEST_URL?.trim();
  const keyId = env.CRM_INGEST_KEY_ID?.trim();
  const secret = env.CRM_INGEST_SECRET?.trim();
  if (!url || !keyId || !secret) return null;
  if (!KEY_ID.test(keyId) || secret.length < 32) return null;
  try {
    const u = new URL(url);
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (u.protocol !== "https:" && !local) return null;
  } catch {
    return null;
  }
  const bypass = env.CRM_INGEST_BYPASS_SECRET?.trim();
  // A malformed bypass secret would only turn every call into a 401 from Vercel: ignore it.
  return bypass && BYPASS.test(bypass) ? { url, keyId, secret, bypass } : { url, keyId, secret };
}

export function signBody(secret: string, timestamp: string, rawBody: string): string {
  return `${SIGNATURE_VERSION}=${createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex")}`;
}

/** processed, duplicate and received are durable in the CRM; only the first two are leads already. */
export const isInCrm = (s: CrmStatus | undefined) => s === "processed" || s === "duplicate" || s === "received";
export const isConfirmedLead = (s: CrmStatus | undefined) => s === "processed" || s === "duplicate";

const BACKOFF_MS = [300, 900];

export async function relayToCrm(payload: unknown, cfg: CrmConfig, opts: RelayOptions = {}): Promise<RelayResult> {
  const doFetch: Fetch = opts.fetch ?? ((input, init) => fetch(input, init));
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const budget = opts.budgetMs ?? 7000;
  const perAttempt = opts.attemptTimeoutMs ?? 4000;
  const maxAttempts = opts.maxAttempts ?? 3;
  const body = JSON.stringify(payload);
  const deadline = now() + budget;
  let last: RelayResult = { status: "unreachable", attempts: 0, code: "not_attempted" };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const remaining = deadline - now();
    if (remaining < 250) break;
    const timestamp = String(Math.floor(now() / 1000));
    let res: Response;
    try {
      res = await doFetch(cfg.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-likin-key-id": cfg.keyId,
          "x-likin-timestamp": timestamp,
          "x-likin-signature": signBody(cfg.secret, timestamp, body),
          ...(cfg.bypass ? { "x-vercel-protection-bypass": cfg.bypass } : {}),
        },
        body,
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(Math.max(250, Math.min(perAttempt, remaining))),
      });
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      last = { status: "unreachable", attempts: attempt, code: name === "TimeoutError" || name === "AbortError" ? "timeout" : "network" };
      if (attempt < maxAttempts) await sleep(Math.min(BACKOFF_MS[attempt - 1] ?? 900, Math.max(0, deadline - now() - 250)));
      continue;
    }
    const data = (await res.json().catch(() => ({}))) as { status?: string; code?: string; receipt?: string; pending?: string };
    if (res.status === 200 && (data.status === "processed" || data.status === "duplicate")) {
      return { status: data.status, attempts: attempt, httpStatus: 200, receipt: data.receipt };
    }
    if (res.status === 202 && data.status === "received") {
      return { status: "received", attempts: attempt, httpStatus: 202, receipt: data.receipt, pending: data.pending };
    }
    if (res.status === 429 || res.status >= 500) {
      last = { status: "retryable_failure", attempts: attempt, httpStatus: res.status, code: data.code ?? `http_${res.status}` };
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : (BACKOFF_MS[attempt - 1] ?? 900);
      if (wait > deadline - now() - 250) break;
      if (attempt < maxAttempts) await sleep(wait);
      continue;
    }
    // 2xx with an unexpected body, 3xx (misconfigured URL), 4xx: retrying would not help.
    return { status: "rejected", attempts: attempt, httpStatus: res.status, code: data.code ?? (res.status >= 300 && res.status < 400 ? "redirect" : `http_${res.status}`) };
  }
  return last;
}
