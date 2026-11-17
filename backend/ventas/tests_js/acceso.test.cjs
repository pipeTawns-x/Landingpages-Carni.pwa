const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the shipped module, replacing only its vendor import; no authentication logic is copied.
const source = fs.readFileSync(path.join(__dirname, '../../static/tienda/acceso.js'), 'utf8')
  .replace('import(raiz.dataset.supabaseJs)', 'Promise.resolve(vendor)');
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function form(registration = false) {
  const button = { disabled: false, textContent: 'Submit' };
  const error = { textContent: '' };
  const values = { email: 'user@example.test', password: 'Password123', full_name: 'Customer',
    phone: '4441234567', password_confirm: 'Password123', terms: '', newsletter: '' };
  const elements = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, { value, checked: true }]));
  return { elements, button, error, handler: null,
    addEventListener(event, handler) { this.handler = handler; },
    querySelector(selector) { return selector === '[data-error]' ? error : selector === 'input' ? { focus() {} } : button; },
    submit() { return this.handler({ preventDefault() {} }); }, registration };
}
async function setup({ search = '?salir=1&admin=false', signOut, storageFails = false, removalFails = false, admin = false,
  storageKey = 'auth-key', loginError = null, signupError = null, signupSession = false, handoff = true } = {}) {
  const login = form();
  const register = form(true);
  const notice = { textContent: '', removeAttribute() {} };
  const root = { hidden: true, dataset: { modo: 'ingresar', tiendaUrl: '/productos/', panelUrl: '/panel/', sesionUrl: '/panel/sesion/' },
    querySelectorAll(selector) { return selector === '[data-error]' ? [login.error, register.error] : []; } };
  const calls = [];
  const replacements = [];
  const history = [];
  const storage = new Map([['auth-key', 'old-session']]);
  const client = { auth: { storageKey,
    async signOut() { calls.push('logout'); if (signOut) return signOut(); storage.delete('auth-key'); return { error: null }; },
    async signInWithPassword() { calls.push('login'); return { data: { user: { id: 'customer' } }, error: loginError }; },
    async signUp() { calls.push('signup'); return { data: { user: { identities: [{}] }, session: signupSession ? {} : null }, error: signupError }; },
    async refreshSession() { calls.push('refresh'); return { data: { session: { access_token: 'test-only' } }, error: null }; } },
    from() { return { select() { return this; }, eq() { return this; }, async single() { return { data: { role: admin ? 'admin' : 'customer' }, error: null }; } }; } };
  vm.runInNewContext(source, { vendor: { createClient: () => client }, URLSearchParams,
    document: { getElementById: id => ({ acceso: root, 'acceso-aviso': notice, 'form-ingresar': login, 'form-registro': register })[id] },
    window: { location: { search, pathname: '/acceso/', hash: '', replace: url => replacements.push(url) },
      history: { replaceState: (...args) => history.push(args[2]) }, localStorage: {
        removeItem(key) { if (storageFails) throw Error('denied'); if (!removalFails) storage.delete(key); },
        getItem(key) { if (storageFails) throw Error('denied'); return storage.get(key) ?? null; } } },
    setTimeout(callback) { callback(); }, FormData: class { set() {} },
    fetch: async () => { calls.push('handoff'); return { ok: handoff }; },
  });
  await tick();
  return { login, register, notice, root, calls, replacements, history, storage };
}
for (const action of ['login', 'register']) {
  test(`${action} waits for delayed logout without timeout and keeps retry signal`, async () => {
    const logout = deferred();
    const app = await setup({ signOut: () => logout.promise });
    const pending = app[action].submit();
    await tick();
    assert.deepEqual(app.calls, ['logout']);
    assert.deepEqual(app.history, []);
    assert.equal(app[action].button.disabled, true);
    logout.resolve({ error: null });
    await pending;
    assert.deepEqual(app.calls, ['logout', action === 'login' ? 'login' : 'signup']);
    assert.deepEqual(app.history, ['/acceso/?admin=false']);
  });
  test(`${action} is blocked when thrown logout and fallback cannot clear storage`, async () => {
    const app = await setup({ signOut: async () => { throw Error('offline'); }, storageFails: true });
    await app[action].submit();
    assert.deepEqual(app.calls, ['logout']);
    assert.deepEqual(app.history, []);
    assert.match(app[action].error.textContent, /cerrar.*sesión/);
    assert.equal(app[action].button.disabled, false);
  });
}
test('returned signout error uses verified fallback deletion', async () => {
  const app = await setup({ signOut: async () => ({ error: { message: 'offline' } }) });
  await app.login.submit();
  assert.equal(app.storage.has('auth-key'), false);
  assert.deepEqual(app.calls, ['logout', 'login']);
});
test('thrown signout uses verified fallback deletion', async () => {
  const app = await setup({ signOut: async () => { throw Error('offline'); } });
  await app.register.submit();
  assert.equal(app.storage.has('auth-key'), false);
  assert.deepEqual(app.calls, ['logout', 'signup']);
});
test('silent failed storage deletion never reports logout success', async () => {
  const app = await setup({ signOut: async () => ({ error: {} }), removalFails: true });
  await app.login.submit();
  await app.register.submit();
  assert.deepEqual(app.calls, ['logout']);
  assert.deepEqual(app.history, []);
  assert.match(app.notice.textContent, /cerrar.*sesión/);
});
test('ordinary customer login and registration confirmation still work', async () => {
  const login = await setup({ search: '' });
  await login.login.submit();
  assert.deepEqual(login.calls, ['login']);
  assert.deepEqual(login.replacements, ['/productos/']);
  const registration = await setup({ search: '' });
  await registration.register.submit();
  assert.deepEqual(registration.calls, ['signup']);
  assert.match(registration.notice.textContent, /Cuenta creada/);
  assert.equal(registration.register.elements.password.value, '');
});
test('ordinary signup session still redirects to products', async () => {
  const app = await setup({ search: '', signupSession: true });
  await app.register.submit();
  assert.deepEqual(app.replacements, ['/productos/']);
});
test('admin login preserves server token handoff', async () => {
  const app = await setup({ search: '?admin=true', admin: true });
  await app.login.submit();
  assert.deepEqual(app.calls, ['login', 'refresh', 'handoff']);
  assert.deepEqual(app.replacements, ['/panel/']);
});
test('validation and vendor errors remain visible', async () => {
  const app = await setup({ search: '', loginError: { code: 'invalid_credentials' }, signupError: { code: 'weak_password' } });
  app.login.elements.email.value = 'invalid';
  await app.login.submit();
  assert.deepEqual(app.calls, []);
  assert.match(app.login.error.textContent, /correo válido/);
  app.login.elements.email.value = 'user@example.test';
  await app.login.submit();
  assert.match(app.login.error.textContent, /incorrectos/);
  await app.register.submit();
  assert.match(app.register.error.textContent, /débil/);
});
test('duplicate and cross-form submissions cannot create competing sessions', async () => {
  const logout = deferred();
  const app = await setup({ signOut: () => logout.promise });
  const first = app.login.submit();
  const duplicate = app.login.submit();
  const other = app.register.submit();
  logout.resolve({ error: null });
  await Promise.all([first, duplicate, other]);
  assert.deepEqual(app.calls, ['logout', 'login']);
});

test('missing storage key cannot falsely confirm fallback cleanup', async () => {
  const app = await setup({ storageKey: '', signOut: async () => ({ error: {} }) });
  await app.login.submit();
  assert.deepEqual(app.calls, ['logout']);
  assert.deepEqual(app.history, []);
});
test('non-admin is denied and signed out on admin-only entry', async () => {
  const app = await setup({ search: '?admin=true' });
  await app.login.submit();
  assert.deepEqual(app.calls, ['login', 'logout']);
  assert.deepEqual(app.replacements, []);
  assert.match(app.login.error.textContent, /Acceso denegado/);
});
test('failed panel handoff does not navigate', async () => {
  const app = await setup({ search: '?admin=true', admin: true, handoff: false });
  await app.login.submit();
  assert.deepEqual(app.calls, ['login', 'refresh', 'handoff']);
  assert.deepEqual(app.replacements, []);
  assert.match(app.login.error.textContent, /abrir el panel/);
});
