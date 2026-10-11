// Microsoft Clarity (clarity.ts): solo en el dominio real y con consentimiento; nada publicitario; una carga.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { clarityCookieDeletions, createClarity } from '../src/lib/clarity.ts';

const ID = 'yw01dhn5vl';
function fakeHost(hostname = 'www.likinagency.com') {
  const scripts = [];
  const written = [];
  const host = {
    location: { hostname },
    document: { get cookie() { return ''; }, set cookie(v) { written.push(v); }, createElement: () => ({ async: false, src: '' }), head: { appendChild: (s) => scripts.push(s) } },
  };
  return { host, scripts, written, calls: () => host.clarity?.q ?? [] };
}

describe('Microsoft Clarity', () => {
  test('fuera del dominio real (previews, local) no hace nada', () => {
    const c = createClarity(ID, ['likinagency.com', 'www.likinagency.com']);
    for (const h of ['localhost', 'likin-web-2-abc.vercel.app']) {
      const f = fakeHost(h);
      assert.equal(c.load(f.host), false);
      assert.equal(f.host.clarity, undefined);
      assert.equal(f.scripts.length, 0);
    }
  });
  test('con consentimiento: la señal (analítica sí, publicidad no) antes del script; el script una vez', () => {
    const c = createClarity(ID, ['likinagency.com', 'www.likinagency.com']);
    const f = fakeHost();
    assert.equal(c.load(f.host), true);
    assert.equal(c.load(f.host), true);
    assert.deepEqual(f.calls()[0], ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }]);
    assert.deepEqual(f.scripts.map((s) => [s.src, s.async]), [['https://www.clarity.ms/tag/' + ID, true]]);
  });
  test('retirar: sin consentimiento, cookies de Clarity borradas (por Clarity y por nosotros)', () => {
    const c = createClarity(ID, ['likinagency.com', 'www.likinagency.com']);
    const f = fakeHost();
    c.load(f.host);
    c.revoke(f.host);
    assert.deepEqual(f.calls().slice(-2), [['consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }], ['consent', false]]);
    assert.ok(f.written.includes('_clck=; Max-Age=0; path=/; domain=.likinagency.com'));
    assert.ok(f.written.includes('_clsk=; Max-Age=0; path=/; domain=.likinagency.com'));
    assert.deepEqual(clarityCookieDeletions('likinagency.com'), ['_clck=; Max-Age=0; path=/', '_clck=; Max-Age=0; path=/; domain=.likinagency.com', '_clsk=; Max-Age=0; path=/', '_clsk=; Max-Age=0; path=/; domain=.likinagency.com']);
  });
});
