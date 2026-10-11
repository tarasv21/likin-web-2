// Google Analytics 4 (ga.ts): solo en el dominio real y con consentimiento; nada publicitario; una carga.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createGa, gaCookieDeletions } from '../src/lib/ga.ts';

const ID = 'G-TEST000001';
function fakeHost(hostname = 'www.likinagency.com', cookie = '') {
  const scripts = [];
  const written = [];
  const host = {
    location: { hostname },
    document: {
      get cookie() { return cookie; },
      set cookie(v) { written.push(v); },
      createElement: () => ({ async: false, src: '' }),
      head: { appendChild: (s) => scripts.push(s) },
    },
  };
  const calls = () => (host.dataLayer ?? []).map((a) => Array.from(a));
  return { host, scripts, written, calls };
}

describe('Google Analytics', () => {
  test('fuera del dominio real (previews, local) no hace nada', () => {
    const ga = createGa(ID, ['likinagency.com', 'www.likinagency.com']);
    for (const h of ['localhost', 'likin-web-2-abc.vercel.app', 'evil.example']) {
      const f = fakeHost(h);
      assert.equal(ga.load(f.host), false);
      assert.equal(f.host.dataLayer, undefined);
      assert.equal(f.scripts.length, 0);
    }
  });
  test('con consentimiento: consentimiento solo de analítica y sin señales publicitarias ANTES de config; gtag.js una vez', () => {
    const ga = createGa(ID, ['likinagency.com', 'www.likinagency.com']);
    const f = fakeHost();
    assert.equal(ga.load(f.host), true);
    assert.equal(ga.load(f.host), true);
    const calls = f.calls();
    assert.deepEqual(calls[0], ['consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }]);
    assert.deepEqual(calls[1], ['set', { allow_google_signals: false, allow_ad_personalization_signals: false }]);
    assert.equal(calls[2][0], 'js');
    assert.deepEqual(calls[3], ['config', ID]);
    assert.equal(calls.filter((c) => c[0] === 'config').length, 1);
    assert.deepEqual(f.scripts.map((s) => [s.src, s.async]), [['https://www.googletagmanager.com/gtag/js?id=' + ID, true]]);
    assert.equal(f.host['ga-disable-' + ID], false);
  });
  test('retirar: GA desactivado, consentimiento denegado y cookies _ga borradas; volver a aceptar lo reactiva sin recargar gtag.js', () => {
    const ga = createGa(ID, ['likinagency.com', 'www.likinagency.com']);
    const f = fakeHost('www.likinagency.com', '_ga=GA1.1.1; _ga_TEST000001=GS1.1; _fbp=fb.1.2.3; other=1');
    ga.load(f.host);
    ga.revoke(f.host);
    assert.equal(f.host['ga-disable-' + ID], true);
    assert.deepEqual(f.calls().at(-1), ['consent', 'update', { analytics_storage: 'denied' }]);
    assert.ok(f.written.includes('_ga=; Max-Age=0; path=/; domain=.likinagency.com'));
    assert.ok(f.written.includes('_ga_TEST000001=; Max-Age=0; path=/; domain=.likinagency.com'));
    assert.ok(f.written.every((c) => c.startsWith('_ga')));
    ga.load(f.host);
    assert.equal(f.host['ga-disable-' + ID], false);
    assert.deepEqual(f.calls().at(-1), ['consent', 'update', { analytics_storage: 'granted' }]);
    assert.equal(f.scripts.length, 1);
  });
  test('cookies a borrar: solo _ga y _ga_<id>, en todos los dominios posibles', () => {
    assert.deepEqual(gaCookieDeletions('www.likinagency.com', '_ga=1; _gat=1; _gid=2; _ga_ABC=3; x_ga=4'), [
      '_ga=; Max-Age=0; path=/', '_ga=; Max-Age=0; path=/; domain=.www.likinagency.com', '_ga=; Max-Age=0; path=/; domain=.likinagency.com',
      '_ga_ABC=; Max-Age=0; path=/', '_ga_ABC=; Max-Age=0; path=/; domain=.www.likinagency.com', '_ga_ABC=; Max-Age=0; path=/; domain=.likinagency.com',
    ]);
  });
});
