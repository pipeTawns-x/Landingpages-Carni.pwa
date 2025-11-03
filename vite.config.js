import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@js': resolve(__dirname, './js'),
      '@assets': resolve(__dirname, './assets'),
      'bootstrap': resolve(__dirname, 'node_modules/bootstrap'),
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "sass:color";
          @use "sass:map";
          @use "sass:math";
          @use "sass:meta";
          @use "assets/scss/abstracts/variables" as *;
          @use "assets/scss/abstracts/mixins" as mix;
          @use "assets/scss/abstracts/functions" as fn;
        `
      }
    },
    devSourcemap: true
  },
  server: {
    port: 5175,
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        products: resolve(__dirname, 'products.html'),
        offline: resolve(__dirname, 'offline.html'),
        adminLogin: resolve(__dirname, 'admin/login.html'),
        adminDashboard: resolve(__dirname, 'admin/dashboard.html'),
        userLogin: resolve(__dirname, 'user/login.html'),
        userRegister: resolve(__dirname, 'user/register.html')
      }
    }
  }
});