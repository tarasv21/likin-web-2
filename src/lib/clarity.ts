/**
 * Microsoft Clarity (navegador), SOLO con el consentimiento del visitante (consent.ts) y solo en el
 * dominio real de la web: ni en las previews ni en local. Antes de cargar su script se le pasa la
 * señal de consentimiento (Consent API v2): analítica sí, publicidad no. Retirar el consentimiento
 * se lo comunica, borra sus cookies (`clarity('consent', false)`) y borramos además `_clck` y `_clsk`
 * de esta web. El formulario de cualificación lleva `data-clarity-mask`: sus datos no se graban.
 */
export const CLARITY_SCRIPT = 'https://www.clarity.ms/tag/';

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };
type ScriptElement = { async: boolean; src: string };
export type ClarityHost = {
  location: { hostname: string };
  document: { cookie: string; head?: { appendChild(node: ScriptElement): unknown }; createElement?(tag: 'script'): ScriptElement };
  clarity?: ClarityFn;
};

/** Cookies propias de Clarity en esta web para borrar al retirar el consentimiento. */
export function clarityCookieDeletions(hostname: string): string[] {
  const parts = hostname.split('.').filter(Boolean);
  const domains: (string | null)[] = [null];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`.${parts.slice(i).join('.')}`);
  return ['_clck', '_clsk'].flatMap((name) => domains.map((d) => `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`));
}

export type Clarity = ReturnType<typeof createClarity>;

export function createClarity(projectId: string, hosts: readonly string[]) {
  let loaded = false;
  const allowedOn = (hostname: string) => hosts.includes(hostname.toLowerCase());
  /** La cola de Clarity: lo que se llama antes de que cargue su script lo procesa al cargar. */
  const clarityOf = (host: ClarityHost): ClarityFn => {
    if (!host.clarity) {
      const fn: ClarityFn = (...args: unknown[]) => {
        (fn.q ??= []).push(args);
      };
      host.clarity = fn;
    }
    return host.clarity;
  };

  return {
    projectId,
    allowedOn,
    /** El visitante aceptó: consentimiento de analítica (sin publicidad) y el script, una sola vez. */
    load(host: ClarityHost): boolean {
      if (!allowedOn(host.location.hostname)) return false;
      clarityOf(host)('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
      if (loaded) return true;
      const script = host.document.createElement?.('script');
      if (script) {
        script.async = true;
        script.src = `${CLARITY_SCRIPT}${encodeURIComponent(projectId)}`;
        host.document.head?.appendChild(script);
      }
      loaded = true;
      return true;
    },
    /** Rechaza o retira: sin consentimiento para Clarity y sin sus cookies. */
    revoke(host: ClarityHost): void {
      if (host.clarity) {
        host.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
        host.clarity('consent', false);
      }
      for (const c of clarityCookieDeletions(host.location.hostname)) {
        try {
          host.document.cookie = c;
        } catch {
          // una cookie que no se puede escribir tampoco puede estar
        }
      }
    },
  };
}
