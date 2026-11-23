const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const css = () => read('css/components/products-page.css');
/** The code of a script, without its comments: the guards below are about what it does, not what it says. */
const code = (file) => read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const sources = () =>
  ['bolsa.ts', 'carril.ts', 'configurador.ts', 'server-products.ts'].map((name) => ({
    name,
    text: code(`src/products/${name}`)
  }));

/** The body of the first `@media (prefers-reduced-motion: no-preference) { ... }` block. */
function motionBlock(text) {
  const start = text.indexOf('@media (prefers-reduced-motion: no-preference)');
  assert.notEqual(start, -1, 'the motion block is missing');
  let depth = 0;
  for (let i = text.indexOf('{', start); i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error('the motion block never closes');
}

test('the products entry gives the stylesheets of the page a module identity of their own, so Bootstrap stays first', () => {
  const entry = read('src/entry/products.tsx');

  for (const sheet of [
    '@src/landing/bootstrap-first.css?products',
    '@src/styles/redesign.css?products',
    '@src/styles/tokens-globales.css?products',
    '../../css/styles.css?products'
  ]) {
    assert.ok(entry.includes(`import '${sheet}';`), `${sheet} must be imported with its own identity`);
  }
  assert.ok(
    entry.indexOf('bootstrap-first.css?products') < entry.indexOf('css/styles.css?products'),
    'Bootstrap is written before the site CSS'
  );
});

test('the products entry paints nothing itself: the Django page runs behaviour only, the static page keeps its React app', () => {
  const entry = read('src/entry/products.tsx');

  assert.match(entry, /document\.body\.hasAttribute\('data-server-store'\)/);
  assert.match(entry, /import\('@src\/products\/server-products'\)/);
  assert.match(entry, /import\('@src\/products\/legacy-products'\)/);
});

test('the cart drawer only moves with transform and opacity, and only for someone who accepts motion', () => {
  const text = css();
  const block = motionBlock(text);

  assert.doesNotMatch(text, /transition:\s*all\b/, 'transition: all animates whatever changes next');
  for (const declaration of block.match(/transition:[^;]+;/g) ?? []) {
    const properties = declaration
      .replace('transition:', '')
      .split(/,(?![^(]*\))/) // the commas inside cubic-bezier(...) are not separators
      .map((part) => part.trim().split(/\s+/)[0]);
    for (const property of properties) {
      assert.ok(['transform', 'opacity', 'overlay', 'display'].includes(property), `${property} is not composite-only`);
    }
  }
  // Outside the block nothing animates: reduced motion gets the drawer, not the movement.
  assert.doesNotMatch(text.replace(block, ''), /transition:|animation:/);
});

test('a modal dialog never lets the page behind it scroll, and never by locking html or body', () => {
  const text = css();

  assert.match(text, /dialog:modal\s*\{[^}]*overscroll-behavior:\s*contain/);
  assert.match(text, /dialog::backdrop\s*\{[^}]*overflow:\s*hidden[^}]*overscroll-behavior:\s*contain/);
  assert.doesNotMatch(text, /(?:html|body)\s*\{[^}]*overflow:\s*hidden/);
});

test('the dialog is never given a display of its own while closed', () => {
  const text = css();

  assert.doesNotMatch(text, /\.bolsa\s*\{[^}]*display:/, 'display on the dialog itself would show it closed');
  assert.match(text, /\.bolsa\[open\]\s*\{[^}]*display:\s*flex/);
});

test('the grid never makes a card narrower than a phone can hold, and the page has no fixed width', () => {
  const text = css();

  assert.match(text, /ul\.product-list\s*\{[^}]*minmax\(min\(100%,\s*17rem\),\s*1fr\)/);
  assert.doesNotMatch(text, /\bwidth:\s*\d{4,}px/);
});

test('touch targets of the drawer, the rail and the pagination are at least 44px', () => {
  const text = css();

  for (const selector of ['.bolsa__cerrar', '.bolsa__quitar', '.productos-paginas a', '.tw-filter-chip']) {
    const rule = text.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{[^}]*\\}`));
    assert.ok(rule, `${selector} has no rule`);
    assert.match(rule[0], /(?:min-)?(?:height|width):\s*44px/, `${selector} is smaller than 44px`);
  }
});

test('the scripts of the page keep no second cart and send nothing that would need a token', () => {
  for (const { name, text } of sources()) {
    assert.doesNotMatch(text, /localStorage|sessionStorage/, `${name} must not keep a copy of the cart`);
    assert.doesNotMatch(text, /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i, `${name} sends a write without a token`);
    assert.doesNotMatch(text, /innerHTML|insertAdjacentHTML|document\.write/, `${name} writes markup from a string`);
    assert.doesNotMatch(text, /supabase/i, `${name} must not talk to Supabase from the browser`);
    assert.doesNotMatch(text, /https?:\/\//, `${name} must not reach for another origin`);
  }
});

test('no price is computed in the browser: the widget only formats what the store answers', () => {
  const widget = code('src/products/configurador.ts');

  assert.doesNotMatch(widget, /price_per/i, 'the widget knows no price list');
  assert.doesNotMatch(widget, /[*/]\s*Number\(|Number\([^)]*\)\s*[*/]/, 'no arithmetic on what the customer typed');
  assert.match(widget, /cotizar/);
});

test('the quantity row of the sheet wraps instead of pushing the page wider than a phone', () => {
  const text = css();

  // Measured in Brave at 375px: the number input (width 100%) next to three unit chips made the
  // row 397px wide, the page scrolled sideways and a fixed dialog stretched with it.
  assert.match(text, /\.ficha__fila\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(text, /\.ficha__fila input\[type="number"\]\s*\{[^}]*min-width:\s*0/);
  assert.match(text, /\.ficha__campo\s*\{[^}]*min-width:\s*0/);
});
