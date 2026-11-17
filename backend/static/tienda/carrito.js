// The cart page (/carrito/). Loaded by carrito.html as one external module.
//
// Everything on the page works without this file: the cart, the quote and the order are plain
// forms handled by Django. This script only enhances two things and talks to nothing:
//   - the delivery address is hidden for a pickup and shown for a delivery;
//   - changing the quote currency submits its form, so the quote is asked again.
// It never reads or writes a price, never stores the cart, and loads nothing from another site.

export function syncAddress(form) {
  const type = form.querySelector('[data-delivery-type]');
  const field = form.querySelector('[data-address-field]');
  if (!type || !field) return;
  field.hidden = type.value !== 'delivery';
}

export function enhance(root) {
  const order = root.querySelector('form[data-order-form]');
  if (order) {
    syncAddress(order);
    order.querySelector('[data-delivery-type]').addEventListener('change', () => syncAddress(order));
  }
  const currency = root.querySelector('form[data-currency-form]');
  if (currency) {
    currency.querySelector('select[name="currency"]').addEventListener('change', () => currency.requestSubmit());
  }
}

if (typeof document !== 'undefined') enhance(document);
