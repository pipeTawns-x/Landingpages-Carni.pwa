import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    port: 3002,
    open: '/index.html',
    host: true,
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
    sourcemap: true,
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        products: resolve(__dirname, 'products.html'),
        accessweb: resolve(__dirname, 'accessweb.html'),
        dashboar: resolve(__dirname, 'dashboar.html'),
        adminProducts: resolve(__dirname, 'admin-products.html'),
        adminCustomers: resolve(__dirname, 'admin-customers.html'),
        adminOrders: resolve(__dirname, 'admin-orders.html'),
        offline: resolve(__dirname, 'offline.html')
      }
    }
  },
  publicDir: 'img'
});
