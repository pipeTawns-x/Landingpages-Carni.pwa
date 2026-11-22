const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'accessweb.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css/components/_auth-mascot.scss'), 'utf8');

test('existing access page uses both transparent mascots without replacing the forms', () => {
  for (const mode of ['login', 'register']) {
    assert.ok(html.includes(`don-carlos-${mode}-cutout-v1.png`));
    const png = fs.readFileSync(path.join(root, `public/img/recursos_web/don-carlos-${mode}-cutout-v1.png`));
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    assert.equal(png[25], 6, 'RGBA image preserves transparent edges');
  }
  for (const id of ['loginEmail', 'loginPassword', 'registerEmail', 'btnShowRegister', 'btnShowLogin']) {
    assert.ok(html.includes(`id="${id}"`), `${id} remains available to existing handlers`);
  }
});

test('character animation has a reduced-motion path and no perpetual loop', () => {
  assert.match(styles, /@keyframes mascot-welcome/);
  assert.match(styles, /prefers-reduced-motion: reduce[\s\S]*mascot-cutout/);
  assert.doesNotMatch(styles, /animation:\s*mascot-welcome[^;]*infinite/);
});

test('every local access image resolves from the actual HTML file, without preview rewrites', () => {
  const images = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)];
  assert.ok(images.length >= 5);
  for (const [, src] of images) {
    if (/^(?:https?:|data:)/.test(src)) continue;
    assert.ok(fs.existsSync(path.resolve(root, src)), `Missing image from accessweb.html: ${src}`);
  }
});
