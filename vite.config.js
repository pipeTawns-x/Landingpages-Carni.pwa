import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.', // Raíz del proyecto
  server: {
    port: 3002,
    open: '/tagsCore/index.html', // Abre index.html automáticamente
    host: true, // Accesible desde red local
    cors: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './js'),
      '@css': resolve(__dirname, './css')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  publicDir: 'img'
});
