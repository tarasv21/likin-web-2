/**
 * Best-effort per-IP limit for the public lead endpoint (memory of one server instance).
 * For a global limit, add a Vercel Firewall rate-limit rule on /api/lead.
 */
export function createLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > limit;
  };
}
