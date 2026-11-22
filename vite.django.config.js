import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));

// Build for the Django pages: `npm run build:django`.
// Output goes to backend/static/vite and is committed, like static/panel/panel.css,
// so Django never needs Node at runtime. `{% vite_asset %}` reads .vite/manifest.json.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root,
  base: '/static/vite/',
  // No publicDir: copying public/ here would duplicate every image into the committed output.
  publicDir: false,
  resolve: {
    alias: {
      '@': resolve(root, 'js'),
      '@css': resolve(root, 'css'),
      '@src': resolve(root, 'src')
    }
  },
  build: {
    outDir: 'backend/static/vite',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        home: resolve(root, 'src/entry/home.tsx'),
        products: resolve(root, 'src/entry/products.tsx'),
        auth: resolve(root, 'src/entry/auth.tsx'),
        dashboard: resolve(root, 'src/entry/dashboard.tsx')
      }
    }
  }
});
