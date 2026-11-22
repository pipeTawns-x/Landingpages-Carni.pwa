const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('vite.django.config.js builds each page entry into backend/static/vite with a manifest', async () => {
  const { default: config } = await import(path.join(root, 'vite.django.config.js'));

  assert.equal(config.base, '/static/vite/');
  assert.equal(config.build.manifest, true);
  assert.equal(path.resolve(root, config.build.outDir), path.join(root, 'backend/static/vite'));
  const inputs = Object.values(config.build.rollupOptions.input).map((file) => path.relative(root, file));
  assert.deepEqual(
    inputs.sort(),
    ['src/entry/auth.tsx', 'src/entry/dashboard.tsx', 'src/entry/home.tsx', 'src/entry/products.tsx']
  );
});

test('package.json exposes the build:django script', () => {
  const { scripts } = JSON.parse(read('package.json'));

  assert.match(scripts['build:django'], /vite build .*vite\.django\.config\.js/);
});

test('pages and the Supabase client load nothing from a CDN: Django CSP only allows self', () => {
  for (const file of ['index.html', 'products.html', 'accessweb.html', 'js/modules/supabase.js']) {
    assert.doesNotMatch(read(file), /cdn\.jsdelivr\.net/, `${file} still loads from jsdelivr`);
  }
});
