const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '../../static/tienda/carrito.js');
const source = fs.readFileSync(file, 'utf8');
const load = () => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function element(extra = {}) {
  const listeners = {};
  return { hidden: false, value: '', listeners, addEventListener: (name, fn) => { listeners[name] = fn; }, ...extra };
}
function orderForm(value) {
  const type = element({ value });
  const field = element();
  const form = { querySelector: (selector) => ({ '[data-delivery-type]': type, '[data-address-field]': field }[selector] ?? null) };
  return { form, type, field };
}

test('the address is hidden for a pickup and shown for a delivery', async () => {
  const { syncAddress } = await load();
  const pickup = orderForm('pickup');
  syncAddress(pickup.form);
  assert.equal(pickup.field.hidden, true);
  const delivery = orderForm('delivery');
  syncAddress(delivery.form);
  assert.equal(delivery.field.hidden, false);
});

test('changing the delivery type updates the address field', async () => {
  const { enhance } = await load();
  const { form, type, field } = orderForm('pickup');
  enhance({ querySelector: (selector) => (selector.includes('data-order-form') ? form : null) });
  assert.equal(field.hidden, true);
  type.value = 'delivery';
  type.listeners.change();
  assert.equal(field.hidden, false);
});

test('changing the currency submits the quote form again', async () => {
  const { enhance } = await load();
  const select = element({ value: 'USD' });
  let submitted = 0;
  const form = { requestSubmit: () => { submitted += 1; }, querySelector: () => select };
  enhance({ querySelector: (selector) => (selector.includes('data-currency-form') ? form : null) });
  select.listeners.change();
  assert.equal(submitted, 1);
});

test('the script never stores a cart, reads a price or reaches another site', () => {
  for (const forbidden of ['localStorage', 'sessionStorage', 'fetch(', 'XMLHttpRequest', 'http://', 'https://', 'supabase']) {
    assert.ok(!source.includes(forbidden), `${forbidden} must not appear`);
  }
});

test('a page without the cart forms is left alone', async () => {
  const { enhance } = await load();
  assert.doesNotThrow(() => enhance({ querySelector: () => null }));
});
