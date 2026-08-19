# Pendientes post-entrega EBAC

Hallazgos de GGA ya triageados: ninguno bloquea la entrega. Quedan documentados para atenderse después, con archivo y razón.

- `vite.config.js` termina en `publicDir: 'img'`: por eso `dist/img` no existe y en build las imágenes se sirven mal. El fix es mover `img/` a `public/img/` y usar `publicDir: 'public'`. OJO: `publicDir: false` NO es el fix — desactiva la copia entera y empeora. No se hace ahora porque mueve 18 archivos la noche de la entrega.
- `formatPrice` duplicado en `src/components/CartPanel/CartPanel.tsx:14`, `src/components/OrderList/OrderList.tsx:22` y `src/components/ProductCard/ProductCard.tsx:11` — consolidar en un helper compartido.
- Dos fallbacks de categoría para el mismo caso: `src/entry/shared.tsx:89` devuelve `'Selección Carni'` vs `src/components/ProductCard/ProductCard.tsx:87` devuelve `'Corte especial'` — dejar uno solo.
- Decisión contradictoria de `size`: `src/components/ProductList/ProductList.tsx:32-35` fija todas las tarjetas en `"medium"` mientras `src/entry/home.tsx:74` varía el tamaño por índice — definir quién asigna el tamaño de la tarjeta.
