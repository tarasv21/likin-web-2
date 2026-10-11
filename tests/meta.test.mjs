// Píxel (eventID en cada evento, consentimiento, un Lead por id) y API de Conversiones (normalización,
// hash, fbc, token fuera de la URL y de los logs, endpoint restringido). Sin red: fetch simulado.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { CONTACT_LINKS, contactChannel, createMetaPixel, pixelIdFrom } from '../src/lib/meta-pixel.ts';
import { buildEvent, capiConfigFrom, fbcFrom, handleBrowserEvent, normalizeEmail, normalizeFirstName, normalizePhone, readCookie, sendCapi, sha256 } from '../src/lib/meta-capi.ts';

const hex = (v) => createHash('sha256').update(v).digest('hex');
const TOKEN = 'EAAB-token-de-prueba-no-real-0123456789';
const CFG = { pixelId: '2270277029972714', token: TOKEN };

function fakeHost() {
  const scripts = [];
  const host = { location: { hostname: 'www.likinagency.com' }, sessionStorage: new Map(), document: { createElement: () => ({}), head: { appendChild: (el) => scripts.push(el) }, cookie: '' } };
  host.sessionStorage.getItem = (k) => host.sessionStorage.get(k) ?? null;
  host.sessionStorage.setItem = (k, v) => host.sessionStorage.set(k, v);
  return { host, scripts, calls: () => (host.fbq ? host.fbq.queue.map((a) => Array.from(a)) : []) };
}

describe('píxel', () => {
  test('nada antes del consentimiento; al aceptar, init sin datos y sin configuración automática; ningún evento solo', () => {
    const f = fakeHost();
    const px = createMetaPixel('2270277029972714', () => f.host);
    assert.equal(px.track('PageView', {}, 'evt-00000001'), false);
    assert.equal(f.scripts.length, 0);
    px.grant(null);
    assert.deepEqual(f.calls(), [['consent', 'grant'], ['set', 'autoConfig', false, '2270277029972714'], ['init', '2270277029972714']]);
    assert.equal(f.host.fbq.allowDuplicatePageViews, true);
    assert.equal(f.host.fbq.disablePushState, true);
  });
  test('cada evento lleva su eventID; Lead uno por id; nombres fuera de la lista no salen', () => {
    const f = fakeHost();
    const px = createMetaPixel('2270277029972714', () => f.host);
    px.grant(null);
    assert.equal(px.track('PageView', {}, 'evt-page-0001'), true);
    assert.equal(px.track('Contact', { content_name: 'email' }, 'evt-contact-01'), true);
    assert.equal(px.track('Lead', { content_name: 'SCALE' }, 'evt-lead-0001'), true);
    assert.equal(px.track('Lead', { content_name: 'SCALE' }, 'evt-lead-0001'), false);
    assert.equal(px.track('Purchase', {}, 'evt-buy-00001'), false);
    assert.deepEqual(f.calls().slice(3), [
      ['track', 'PageView', {}, { eventID: 'evt-page-0001' }],
      ['track', 'Contact', { content_name: 'email' }, { eventID: 'evt-contact-01' }],
      ['track', 'Lead', { content_name: 'SCALE' }, { eventID: 'evt-lead-0001' }],
    ]);
  });
  test('retirar: revoke y nada más', () => {
    const f = fakeHost();
    const px = createMetaPixel('2270277029972714', () => f.host);
    px.grant(null);
    px.revoke();
    assert.equal(px.track('PageView', {}, 'evt-page-0002'), false);
    assert.equal(pixelIdFrom('abc'), null);
  });
});

describe('API de Conversiones', () => {
  test('normalización de Meta y SHA-256', async () => {
    assert.equal(normalizeEmail('  Ana.Pérez@Example.COM '), 'ana.pérez@example.com');
    assert.equal(normalizeEmail('no-es-email'), undefined);
    assert.equal(normalizePhone('+34 600 12 34 56'), '34600123456');
    assert.equal(normalizePhone('600 123 456'), '34600123456');
    assert.equal(normalizePhone('0044 7700 900123'), '447700900123');
    assert.equal(normalizePhone('123'), undefined);
    assert.equal(normalizeFirstName('  María José Pérez '), 'maría');
    assert.equal(normalizeFirstName("O'Brien"), 'obrien');
    assert.equal(await sha256('ana@example.com'), hex('ana@example.com'));
  });
  test('fbc de la cookie o construido desde el fbclid de la URL', () => {
    assert.equal(fbcFrom('fb.1.1700000000000.AbCdEf123', undefined, 1), 'fb.1.1700000000000.AbCdEf123');
    assert.equal(fbcFrom(undefined, 'https://www.likinagency.com/?fbclid=IwAR0abcdefghij', 1790000000000), 'fb.1.1790000000000.IwAR0abcdefghij');
    assert.equal(fbcFrom(undefined, 'https://www.likinagency.com/', 1), undefined);
    assert.equal(readCookie('a=1; _fbp=fb.1.2.3; _fbc=fb.1.4.x', '_fbp'), 'fb.1.2.3');
  });
  test('el evento lleva lo pedido y los datos personales solo con hash', async () => {
    const e = await buildEvent({ name: 'Lead', id: 'evt-lead-0009', url: 'https://www.likinagency.com/?fbclid=IwAR0abcdefghij', timeMs: 1790000000123, ip: '203.0.113.7', userAgent: 'UA', fbp: 'fb.1.2.3', custom: { content_name: 'SCALE', content_category: 'likinagency.com' }, person: { email: 'Ana@Example.com', name: 'Ana López', phone: '600123456' } });
    assert.deepEqual(e, {
      event_name: 'Lead', event_time: 1790000000, event_id: 'evt-lead-0009', action_source: 'website', event_source_url: 'https://www.likinagency.com/?fbclid=IwAR0abcdefghij',
      user_data: { client_ip_address: '203.0.113.7', client_user_agent: 'UA', fbp: 'fb.1.2.3', fbc: 'fb.1.1790000000123.IwAR0abcdefghij', em: [hex('ana@example.com')], ph: [hex('34600123456')], fn: [hex('ana')] },
      custom_data: { content_name: 'SCALE', content_category: 'likinagency.com' },
    });
    assert.doesNotMatch(JSON.stringify(e), /Ana@|López|600123456/);
  });
  test('Graph API v26: token en el cuerpo (nunca en la URL), código de prueba si existe; errores sin token', async () => {
    const calls = [];
    const fetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return new Response(JSON.stringify({ events_received: 1 }), { status: 200 }); };
    const r = await sendCapi({ ...CFG, testCode: 'TEST123' }, [await buildEvent({ name: 'PageView', id: 'evt-page-0003', url: 'https://www.likinagency.com/' })], { fetch });
    assert.deepEqual(r, { ok: true, status: 200, received: 1 });
    assert.equal(calls[0].url, 'https://graph.facebook.com/v26.0/2270277029972714/events');
    assert.doesNotMatch(calls[0].url, /EAAB|access_token/);
    assert.equal(calls[0].body.access_token, TOKEN);
    assert.equal(calls[0].body.test_event_code, 'TEST123');
    const bad = await sendCapi(CFG, [], { fetch: async () => new Response(JSON.stringify({ error: { type: 'OAuthException', message: `token ${TOKEN} invalid` } }), { status: 400 }) });
    assert.deepEqual(bad, { ok: false, status: 400, code: 'OAuthException' });
    const down = await sendCapi(CFG, [], { fetch: async () => { throw new TypeError('fetch failed'); } });
    assert.deepEqual(down, { ok: false, code: 'network' });
    assert.equal(capiConfigFrom({ pixelId: '2270277029972714', token: 'corto' }), null);
  });
});

describe('/api/meta-capi', () => {
  const req = (body, headers = {}) => new Request('https://www.likinagency.com/api/meta-capi', { method: 'POST', headers: { host: 'www.likinagency.com', origin: 'https://www.likinagency.com', 'content-type': 'application/json', cookie: '_fbp=fb.1.2.3', 'x-forwarded-for': '203.0.113.9, 10.0.0.1', 'user-agent': 'UA', ...headers }, body: JSON.stringify(body) });
  const ok = { event_name: 'Contact', event_id: 'evt-contact-02', event_source_url: 'https://www.likinagency.com/#contacto', custom_data: { content_name: 'email', content_category: 'likinagency.com', email: 'x@y.example' }, consent: true };
  test('reenvía un evento válido con IP, navegador, fbp y solo los datos permitidos', async () => {
    const sent = [];
    const logs = [];
    const res = await handleBrowserEvent(req(ok), { config: CFG, fetch: async (u, i) => { sent.push(JSON.parse(i.body)); return new Response('{"events_received":1}', { status: 200 }); }, log: (f) => logs.push(f) });
    assert.equal(res.status, 204);
    assert.equal(sent.length, 1);
    const e = sent[0].data[0];
    assert.equal(e.event_name, 'Contact');
    assert.equal(e.event_id, 'evt-contact-02');
    assert.equal(e.user_data.client_ip_address, '203.0.113.9');
    assert.equal(e.user_data.fbp, 'fb.1.2.3');
    assert.deepEqual(e.custom_data, { content_name: 'email', content_category: 'likinagency.com' });
    assert.doesNotMatch(JSON.stringify(logs), /EAAB/);
  });
  test('rechaza sin consentimiento, de otro origen, eventos no permitidos (Lead incluido), URL ajena e ids malos', async () => {
    let sent = 0;
    const deps = { config: CFG, fetch: async () => { sent++; return new Response('{}'); } };
    assert.equal((await handleBrowserEvent(req({ ...ok, consent: false }), deps)).status, 400);
    assert.equal((await handleBrowserEvent(req(ok, { origin: 'https://evil.example' }), deps)).status, 403);
    assert.equal((await handleBrowserEvent(req({ ...ok, event_name: 'Lead' }), deps)).status, 400);
    assert.equal((await handleBrowserEvent(req({ ...ok, event_name: 'Purchase' }), deps)).status, 400);
    assert.equal((await handleBrowserEvent(req({ ...ok, event_source_url: 'https://evil.example/' }), deps)).status, 400);
    assert.equal((await handleBrowserEvent(req({ ...ok, event_id: 'x' }), deps)).status, 400);
    assert.equal(sent, 0);
  });
  test('límite por IP y sin configuración no envía nada', async () => {
    let n = 0;
    assert.equal((await handleBrowserEvent(req(ok), { config: CFG, limited: () => true, fetch: async () => { n++; return new Response('{}'); } })).status, 429);
    assert.equal((await handleBrowserEvent(req(ok), { config: null, fetch: async () => { n++; return new Response('{}'); } })).status, 204);
    assert.equal(n, 0);
  });
});

import { CONSENT_MAX_AGE_MS, parseConsent, readConsent, saveConsent, stateOf } from '../src/lib/consent.ts';

describe('consentimiento', () => {
  test('solo cuenta una decisión válida, reciente y de esta versión', () => {
    const now = Date.parse('2026-10-11T10:00:00.000Z');
    assert.deepEqual(parseConsent(JSON.stringify({ v: 1, ads: true, at: '2026-10-01T00:00:00.000Z' }), now), { v: 1, ads: true, at: '2026-10-01T00:00:00.000Z' });
    for (const raw of [null, '{', JSON.stringify({ v: 2, ads: true, at: '2026-10-01T00:00:00.000Z' }), JSON.stringify({ v: 1, ads: 'sí', at: '2026-10-01T00:00:00.000Z' })]) assert.equal(parseConsent(raw, now), null);
    assert.equal(parseConsent(JSON.stringify({ v: 1, ads: true, at: new Date(now - CONSENT_MAX_AGE_MS - 1).toISOString() }), now), null);
  });
  test('guardar y leer: sin decidir, aceptadas, rechazadas', () => {
    const data = new Map();
    const s = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
    assert.equal(stateOf(readConsent(s)), 'undecided');
    saveConsent(true, s);
    assert.equal(stateOf(readConsent(s)), 'granted');
    saveConsent(false, s);
    assert.equal(stateOf(readConsent(s)), 'denied');
  });
});

describe('Contact links', () => {
  test('email, phone and WhatsApp count; anything else does not', () => {
    assert.equal(contactChannel('mailto:hola@marca.example'), 'email');
    assert.equal(contactChannel('tel:+34600000000'), 'phone');
    assert.equal(contactChannel('https://wa.me/34600000000?text=hola'), 'whatsapp');
    assert.equal(contactChannel('https://api.whatsapp.com/send?phone=34600000000'), 'whatsapp');
    for (const href of ['/privacidad', '#contacto', 'https://evilwhatsapp.com/x', 'https://wa.me.example/x', 'javascript:alert(1)', '']) assert.equal(contactChannel(href), null, href);
    assert.match(CONTACT_LINKS, /mailto:.*tel:.*wa\.me\/.*whatsapp\.com\//);
  });
});
