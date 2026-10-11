/**
 * Google Analytics 4 (navegador), SOLO con el consentimiento del visitante (consent.ts) y solo en el
 * dominio real de la web: ni en las previews ni en local. Mismo código en las dos webs.
 *
 * Sin funciones publicitarias de Google: ad_storage, ad_user_data y ad_personalization denegados y sin
 * Google Signals. Retirar el consentimiento desactiva GA (`ga-disable-<id>`, la marca oficial de
 * Google) y borra sus cookies _ga de esta web.
 */
export const GA_SCRIPT = 'https://www.googletagmanager.com/gtag/js';

type Gtag = (...args: unknown[]) => void;
type ScriptElement = { async: boolean; src: string };
export type GaHost = {
  location: { hostname: string };
  document: { cookie: string; head?: { appendChild(node: ScriptElement): unknown }; createElement?(tag: 'script'): ScriptElement };
  dataLayer?: unknown[];
  gtag?: Gtag;
  [key: string]: unknown;
};

/** Cookies _ga de esta web para borrar al retirar el consentimiento (GA las pone en el dominio raíz). */
export function gaCookieDeletions(hostname: string, cookies: string): string[] {
  const names = [...new Set(cookies.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^_ga(_[A-Za-z0-9]+)?$/.test(n)))];
  const parts = hostname.split('.').filter(Boolean);
  const domains: (string | null)[] = [null];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`.${parts.slice(i).join('.')}`);
  return names.flatMap((name) => domains.map((d) => `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`));
}

export type Ga = ReturnType<typeof createGa>;

export function createGa(measurementId: string, hosts: readonly string[]) {
  const disableKey = `ga-disable-${measurementId}`;
  let prepared = false;
  let loaded = false;
  const allowedOn = (hostname: string) => hosts.includes(hostname.toLowerCase());
  const gtagOf = (host: GaHost): Gtag => {
    if (!host.gtag) {
      const dataLayer = (host.dataLayer ??= []);
      host.gtag = function gtag() {
        // gtag.js solo entiende objetos `arguments` en la dataLayer.
        // eslint-disable-next-line prefer-rest-params
        dataLayer.push(arguments);
      };
    }
    return host.gtag;
  };
  /** Antes de cargar gtag.js: el consentimiento (solo analítica) y sin señales publicitarias. */
  const prepare = (host: GaHost): boolean => {
    if (!allowedOn(host.location.hostname)) return false;
    host[disableKey] = false;
    const gtag = gtagOf(host);
    if (!prepared) {
      gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      gtag('set', { allow_google_signals: false, allow_ad_personalization_signals: false });
      prepared = true;
    } else gtag('consent', 'update', { analytics_storage: 'granted' });
    return true;
  };

  return {
    measurementId,
    allowedOn,
    prepare,
    /** Prepara y carga gtag.js una sola vez (para webs sin componente propio, como Astro). */
    load(host: GaHost): boolean {
      if (!prepare(host)) return false;
      if (loaded) return true;
      const gtag = gtagOf(host);
      gtag('js', new Date());
      gtag('config', measurementId);
      const script = host.document.createElement?.('script');
      if (script) {
        script.async = true;
        script.src = `${GA_SCRIPT}?id=${encodeURIComponent(measurementId)}`;
        host.document.head?.appendChild(script);
      }
      loaded = true;
      return true;
    },
    /** El visitante rechaza o retira el consentimiento: GA deja de medir y sus cookies se borran. */
    revoke(host: GaHost): void {
      host[disableKey] = true;
      if (prepared) host.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      for (const c of gaCookieDeletions(host.location.hostname, host.document.cookie)) {
        try {
          host.document.cookie = c;
        } catch {
          // una cookie que no se puede escribir tampoco puede estar
        }
      }
    },
  };
}
