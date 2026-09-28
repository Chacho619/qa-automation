import test from 'node:test';
import assert from 'node:assert/strict';
import { readCredentials, assertLoginOrigin } from '../../src/support/credentials.js';
import { LoginPage } from '../../src/pages/LoginPage.js';
import { readConfig } from '../../src/support/config.js';

test('Login sin variables permite sesión existente', () => assert.equal(readCredentials({}), null));
test('Login rechaza configuración parcial sin revelar valores', () => {
  assert.throws(() => readCredentials({ LIVERPOOL_USERNAME:'qa@example.org' }), /juntos/);
  assert.throws(() => readCredentials({ LIVERPOOL_PASSWORD:'dummy-secret' }), /juntos/);
});
test('Credenciales conservan caracteres especiales y no se serializan', () => {
  const credentials = readCredentials({ LIVERPOOL_USERNAME:' qa@example.org ', LIVERPOOL_PASSWORD:' !+#_% example ' });
  assert.equal(credentials.username, 'qa@example.org');
  assert.equal(credentials.password, ' !+#_% example ');
  assert.equal(JSON.stringify(credentials), '{}');
});
test('Solo admite el origen HTTPS exacto de login', () => {
  assert.doesNotThrow(() => assertLoginOrigin('https://login.liverpool.com.mx/u/login'));
  for (const url of ['http://login.liverpool.com.mx/u/login','https://login.liverpool.com.mx.example.org','https://other.example.org','https://user:password@login.liverpool.com.mx']) {
    assert.throws(() => assertLoginOrigin(url));
  }
});
test('El timeout de login está acotado', () => assert.throws(() => readConfig({ LOGIN_WAIT_MS:'0' })));

function fixture({ session = false, origin = 'https://login.liverpool.com.mx/u/login' } = {}) {
  let url = 'https://www.liverpool.com.mx/tienda/cart';
  let sent = 0;
  const written = [];
  const driver = {
    get: async value => { url = value; },
    getCurrentUrl: async () => url,
    wait: async predicate => {
      for (let i = 0; i < 3; i++) { const result = await predicate(); if (result) return result; }
      throw new Error('timeout');
    },
  };
  const page = new LoginPage(driver, { baseUrl:'https://www.liverpool.com.mx', waitMs:1000, loginWaitMs:1000 }, {});
  page.by = name => name;
  page.visible = async name => name === 'authenticated' ? (session ? [{}] : []) : name === 'loginEntry' ? [{}] : [];
  page.ready = async key => ({ clear:async()=>{}, sendKeys:async value=>written.push({ key, value }) });
  page.click = async name => {
    if (name === 'loginEntry') url = origin;
    if (name === 'loginSubmit') { sent++; session = true; url = 'https://www.liverpool.com.mx/tienda/cart'; }
  };
  return { page, written, submissions:()=>sent };
}
test('Reutiliza sesión sin ingresar ni enviar credenciales', async () => {
  const f = fixture({ session:true });
  await f.page.ensureAuthenticated(null);
  assert.equal(f.submissions(),0);
  assert.equal(f.written.length,0);
});
test('Sin sesión ni credenciales no envía el formulario', async () => {
  const f = fixture();
  await assert.rejects(()=>f.page.ensureAuthenticated(null), /No hay sesión/);
  assert.equal(f.submissions(),0);
});
test('Login completa campos y envía una sola vez', async () => {
  const f = fixture();
  await f.page.ensureAuthenticated(readCredentials({ LIVERPOOL_USERNAME:'qa@example.org', LIVERPOOL_PASSWORD:'dummy-password' }));
  assert.equal(f.submissions(),1);
  assert.deepEqual(f.written.map(item=>item.key),['loginUsername','loginPassword']);
});
test('No escribe secretos si la navegación termina en otro origen', async () => {
  const f = fixture({ origin:'https://other.example.org' });
  await assert.rejects(()=>f.page.ensureAuthenticated(readCredentials({ LIVERPOOL_USERNAME:'qa@example.org', LIVERPOOL_PASSWORD:'dummy-password' })), /origen/);
  assert.equal(f.written.length,0);
  assert.equal(f.submissions(),0);
});
