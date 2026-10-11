// meta-capi.ts: API de Conversiones de Meta (SERVIDOR). Los mismos eventos que el píxel, con el
// mismo event_id (Meta deduplica), solo con el consentimiento del visitante. El token solo vive en
// el servidor: viaja en el cuerpo de la petición a Meta (nunca en la URL) y no se escribe en logs.
// Mismo código en likinagency.com (src/lib/meta-capi.ts allí): mantenerlos en sincronía.
export const GRAPH_API_VERSION = 'v26.0';
export const CAPI_EVENTS = ['PageView', 'Lead', 'Contact', 'Schedule'] as const;
export type CapiEventName = (typeof CAPI_EVENTS)[number];
/** Los que el navegador puede pedir por /api/meta-capi. El Lead lo envía el servidor del formulario. */
export const BROWSER_EVENTS: readonly CapiEventName[] = ['PageView', 'Contact', 'Schedule'];
const EVENT_ID = /^[A-Za-z0-9_-]{8,100}$/;

export type CapiConfig = { pixelId: string; token: string; testCode?: string };
type Fetch = (input: string, init: RequestInit) => Promise<Response>;

export function capiConfigFrom(env: { pixelId?: string; token?: string; testCode?: string }): CapiConfig | null {
  const pixelId = env.pixelId?.trim();
  const token = env.token?.trim();
  if (!pixelId || !/^\d{6,20}$/.test(pixelId) || !token || token.length < 20) return null;
  const testCode = env.testCode?.trim();
  return { pixelId, token, ...(testCode ? { testCode } : {}) };
}

/** SHA-256 en hexadecimal (Web Crypto: sin dependencias, igual en Node y en el edge). */
export async function sha256(v: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Normalización de Meta antes del hash: email en minúsculas y sin espacios. */
export function normalizeEmail(v: string | undefined): string | undefined {
  const e = v?.trim().toLowerCase().replace(/\s+/g, '');
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : undefined;
}

/** Teléfono: solo dígitos y con prefijo de país sin «+» (un móvil o fijo español de 9 cifras recibe 34). */
export function normalizePhone(v: string | undefined, defaultCountry = '34'): string | undefined {
  let d = (v ?? '').replace(/\D+/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9 && /^[6789]/.test(d)) d = defaultCountry + d;
  return d.length >= 10 && d.length <= 15 ? d : undefined;
}

/** Nombre de pila: la primera palabra, en minúsculas, sin signos ni números. */
export function normalizeFirstName(v: string | undefined): string | undefined {
  const first = (v ?? '').trim().split(/\s+/)[0]?.toLowerCase().replace(/[^\p{L}]/gu, '');
  return first ? first : undefined;
}

export function readCookie(header: string | null | undefined, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim()) || undefined;
  }
  return undefined;
}

export function clientIp(headers: Headers): string | undefined {
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim();
  return ip && ip.length <= 64 ? ip : undefined;
}

/** `_fbc` de la cookie; si no existe pero la URL trae fbclid, se construye con el formato de Meta. */
export function fbcFrom(cookieFbc: string | undefined, url: string | undefined, nowMs: number): string | undefined {
  if (cookieFbc && /^fb\.\d\.\d+\./.test(cookieFbc)) return cookieFbc;
  try {
    const fbclid = url ? new URL(url).searchParams.get('fbclid')?.trim() : undefined;
    return fbclid && /^[A-Za-z0-9_.-]{10,500}$/.test(fbclid) ? `fb.1.${nowMs}.${fbclid}` : undefined;
  } catch {
    return undefined;
  }
}

export type CapiEventInput = {
  name: CapiEventName;
  id: string;
  url: string;
  timeMs?: number;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  custom?: Record<string, string>;
  /** Solo para el Lead: datos del formulario, que se normalizan y se cifran con hash aquí. */
  person?: { email?: string; phone?: string; name?: string };
};

export async function buildEvent(e: CapiEventInput) {
  const timeMs = e.timeMs ?? Date.now();
  const em = normalizeEmail(e.person?.email);
  const ph = normalizePhone(e.person?.phone);
  const fn = normalizeFirstName(e.person?.name);
  const user_data: Record<string, unknown> = {};
  if (e.ip) user_data.client_ip_address = e.ip;
  if (e.userAgent) user_data.client_user_agent = e.userAgent.slice(0, 512);
  if (e.fbp) user_data.fbp = e.fbp;
  const fbc = fbcFrom(e.fbc, e.url, timeMs);
  if (fbc) user_data.fbc = fbc;
  if (em) user_data.em = [await sha256(em)];
  if (ph) user_data.ph = [await sha256(ph)];
  if (fn) user_data.fn = [await sha256(fn)];
  return {
    event_name: e.name,
    event_time: Math.floor(timeMs / 1000),
    event_id: e.id,
    action_source: 'website',
    event_source_url: e.url,
    user_data,
    ...(e.custom && Object.keys(e.custom).length ? { custom_data: e.custom } : {}),
  };
}

export type CapiResult = { ok: boolean; status?: number; received?: number; code?: string };

/** Envía eventos a Meta. Nunca lanza ni devuelve el token; un fallo no rompe la web. */
export type CapiEvent = Awaited<ReturnType<typeof buildEvent>>;

export async function sendCapi(cfg: CapiConfig, events: CapiEvent[], opts: { fetch?: Fetch; timeoutMs?: number } = {}): Promise<CapiResult> {
  const doFetch: Fetch = opts.fetch ?? ((i, init) => fetch(i, init));
  try {
    const res = await doFetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${cfg.pixelId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: events, access_token: cfg.token, ...(cfg.testCode ? { test_event_code: cfg.testCode } : {}) }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 3000),
    });
    const body = (await res.json().catch(() => ({}))) as { events_received?: number; error?: { code?: number; type?: string } };
    return res.ok ? { ok: true, status: res.status, received: body.events_received } : { ok: false, status: res.status, code: body.error?.type ?? `http_${res.status}` };
  } catch (e) {
    return { ok: false, code: e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError') ? 'timeout' : 'network' };
  }
}

/** Límite en memoria por IP (mejor esfuerzo por instancia). */
export function createLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > max;
  };
}

export type BrowserEventDeps = { config: CapiConfig | null; fetch?: Fetch; /** IP del cliente si no hay x-forwarded-for (servidor local). */ fallbackIp?: string; limited?: (ip: string) => boolean; now?: () => number; log?: (fields: Record<string, unknown>) => void };

/**
 * POST /api/meta-capi desde el navegador: PageView, Contact o Schedule, con el event_id del píxel.
 * Solo del mismo origen, con consentimiento, eventos de la lista, URL de esta web y datos cortos.
 * Responde 204 sin contar nada (ni a quien intenta abusar ni si Meta falla).
 */
export async function handleBrowserEvent(request: Request, deps: BrowserEventDeps): Promise<Response> {
  const done = (status: number) => new Response(null, { status, headers: { 'cache-control': 'no-store' } });
  const now = deps.now ?? Date.now;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  const origin = request.headers.get('origin');
  try {
    if (!origin || new URL(origin).host !== host) return done(403);
  } catch {
    return done(403);
  }
  const ip = clientIp(request.headers) ?? deps.fallbackIp;
  if (deps.limited?.(ip ?? 'desconocida')) return done(429);
  const raw = await request.text().catch(() => '');
  if (raw.length > 4096) return done(413);
  let body: { event_name?: unknown; event_id?: unknown; event_source_url?: unknown; custom_data?: unknown; consent?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return done(400);
  }
  const name = body.event_name as CapiEventName;
  if (body.consent !== true || !BROWSER_EVENTS.includes(name) || typeof body.event_id !== 'string' || !EVENT_ID.test(body.event_id)) return done(400);
  let url: URL;
  try {
    url = new URL(String(body.event_source_url));
    if (url.host !== host || String(body.event_source_url).length > 1000) return done(400);
  } catch {
    return done(400);
  }
  const custom: Record<string, string> = {};
  if (body.custom_data && typeof body.custom_data === 'object') {
    for (const k of ['content_name', 'content_category'] as const) {
      const v = (body.custom_data as Record<string, unknown>)[k];
      if (typeof v === 'string' && v.length <= 60) custom[k] = v;
    }
  }
  if (!deps.config) return done(204);
  const cookies = request.headers.get('cookie');
  const event = await buildEvent({ name, id: body.event_id, url: url.href, timeMs: now(), ip, userAgent: request.headers.get('user-agent') ?? undefined, fbp: readCookie(cookies, '_fbp'), fbc: readCookie(cookies, '_fbc'), custom });
  const result = await sendCapi(deps.config, [event], { fetch: deps.fetch });
  deps.log?.({ event: name, ok: result.ok, status: result.status, received: result.received, code: result.code });
  return done(204);
}
