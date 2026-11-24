const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
/** A script without its comments: the guards below are about what it does, not what it says. */
const code = (file) => read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Width and height declared in a WebP header (VP8, VP8L and VP8X). */
function webpSize(file) {
  const b = fs.readFileSync(path.join(root, file));
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  const bits = b.readUInt32LE(21);
  return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
}

test('the entry splits the Django page from the static accessweb.html, like products.tsx', () => {
  const entry = read('src/entry/auth.tsx');
  assert.match(entry, /data-server-store/);
  assert.match(entry, /acceso-page\.css/);
  assert.match(entry, /bootstrap-first\.css\?acceso/);
  assert.match(entry, /import\('@src\/acceso\/server-acceso'\)/);
  assert.match(entry, /import\('@src\/acceso\/legacy-acceso'\)/);
  assert.ok(exists('src/acceso/legacy-acceso.tsx'), 'the old React strip moved, not deleted');
  // Nothing of the legacy page runs at load: it is a dynamic branch.
  assert.doesNotMatch(entry.replace(/import\('[^']+'\)/g, ''), /montarCarrito|montarLupa|ThemeProvider/);
});

test('the page script is UI only: it never reads a password and never talks to a server', () => {
  const script = code('src/acceso/server-acceso.ts');
  assert.doesNotMatch(script, /\.value\b/);
  assert.doesNotMatch(script, /\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|supabase/i);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|eval\(|new Function/);
  assert.match(script, /data-ver-clave/);
});

test('the styles are mobile first and keep motion opt-in', () => {
  const css = read('css/pages/acceso-page.css');
  assert.doesNotMatch(css, /@media \(max-width/);
  assert.match(css, /@media \(min-width: 64rem\)/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  // The README of the mascot sets the slide: 480 ms on this curve.
  assert.match(css, /cubic-bezier\(0\.77, 0, 0\.175, 1\)/);
  assert.match(css, /480ms/);
  // Hover only where there is a pointer that hovers.
  const outside = css.replace(/@media \(hover: hover\)\s*\{[\s\S]*?\n\}\n/g, '');
  assert.doesNotMatch(outside, /:hover/);
  assert.match(css, /:focus-visible/);
});

test('every control is at least 44 px tall on touch', () => {
  const css = read('css/pages/acceso-page.css');
  assert.match(css, /min-block-size:\s*2\.75rem/);
});

test('the mascot files exist and the sizes the template declares are their real sizes', () => {
  assert.deepEqual(webpSize('public/img/mascota/don-carlos-login.webp'), [640, 768]);
  assert.deepEqual(webpSize('public/img/mascota/don-carlos-register.webp'), [640, 640]);
  for (const name of ['don-carlos-login', 'don-carlos-register']) {
    assert.ok(fs.statSync(path.join(root, `public/img/mascota/${name}.webp`)).size < 70 * 1024, `${name} weighs too much`);
  }
});

// The three tests below were added after a review found that the checks above read the source text
// of the CSS and let three real defects through. They pin the rules that fix them; the behaviour
// itself is measured in a real browser (see the T5 correction report).

test('the keyboard ring on the dark red panel is cream, because a red ring there is 1.7:1', () => {
  const css = read('css/pages/acceso-page.css');
  const red = css.match(/([^{}]*)\{[^}]*outline:\s*3px solid var\(--acceso-rojo\)[^}]*\}/);
  assert.ok(red, 'the red ring exists for the light card');
  assert.doesNotMatch(red[1], /acceso__panel/, 'the panel buttons must not share the red ring');
  assert.match(css, /\.acceso__panel button:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--acceso-crema\)/);
});

test('motion: the old pose leaves before the new one enters, and the reduced-motion fade survives the global rule', () => {
  const css = read('css/pages/acceso-page.css');
  assert.match(css, /\.acceso__pose\s*\{\s*transition:\s*opacity 130ms var\(--ease-out-strong\), translate 130ms var\(--ease-out-strong\), visibility 0s linear 130ms;/);
  assert.match(css, /acceso__pose--registro\s*\{\s*transition-delay:\s*130ms;/);
  // css/styles.css forces `* { animation-duration: .01ms !important }`; only an !important of a more specific rule wins.
  const reduce = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduce, /#acceso > form\s*\{[^}]*animation-duration:\s*180ms !important/);
});

test('the entrance stays inside the 480 ms ceiling and nothing animates over the LCP image', () => {
  const css = read('css/pages/acceso-page.css');
  assert.doesNotMatch(css, /acceso-tarjeta/, 'the card wraps the LCP image: it must not fade');
  assert.match(css, /animation:\s*acceso-mascota 480ms var\(--ease-out-strong\) 80ms both/);
  for (const [, ms] of css.matchAll(/animation:\s*[\w-]+ (\d+)ms/g)) assert.ok(Number(ms) <= 480, `${ms} ms is over the ceiling`);
  // --font-sans resolves to the one value on this page; --font-display does not (styles.css redefines it).
  assert.match(css, /--acceso-sans:\s*var\(--font-sans\);/);
  assert.match(css, /--acceso-display:\s*"Fraunces Variable"/);
});

test('the two-column field grid waits for 75rem: with two columns a password input is 61 px at 768 and 69 px at 1024', () => {
  const css = read('css/pages/acceso-page.css');
  const wide = /@media \(min-width: 75rem\)\s*\{\s*\.acceso__dos\s*\{\s*grid-template-columns:\s*1fr 1fr;\s*\}\s*\}/;
  assert.match(css, wide);
  assert.doesNotMatch(css.replace(wide, ''), /\.acceso__dos\s*\{[^}]*grid-template-columns/);
});

test('on the wide card the pose never outgrows its half, so a taller card does not crop Don Carlos', () => {
  const css = read('css/pages/acceso-page.css');
  assert.match(css, /\.acceso__pose,\s*\.acceso__pose--registro\s*\{[^}]*inline-size:\s*100%;[^}]*object-fit:\s*contain;[^}]*object-position:\s*50% 100%/);
});
