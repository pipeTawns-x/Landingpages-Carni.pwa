import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
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
      '@css': resolve(__dirname, './css'),
      '@src': resolve(__dirname, './src')
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
  // `public`, no `img`.
  //
  // Vite copia el CONTENIDO de publicDir a la raiz de `dist/`, no la carpeta en
  // si. Con `publicDir: 'img'`, `img/products/res.webp` acababa en
  // `dist/products/res.webp` y la ruta `/img/products/res.webp` que pide el
  // codigo dejaba de existir: caia en el respaldo SPA y el navegador recibia
  // `index.html` con content-type text/html en vez de una imagen. Las nueve
  // fotos del bento quedaban en 0x0. Era P-06.
  //
  // Con la carpeta en `public/img/`, el contenido copiado es `img/`, asi que
  // `/img/...` sigue siendo `/img/...` despues del build. Las 169 referencias
  // del proyecto son URLs y no hay que tocar ninguna.
  //
  // NO uses `publicDir: false`: desactiva la copia entera y deja el sitio sin
  // imagenes. Ya se intento.
  publicDir: 'public'
});
