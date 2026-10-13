# Contexto previo (Engram) que el abogado del diablo y el arquitecto deben leer primero

Fuente: notas de Engram del proyecto `carni-mvp`, escritas antes de la etapa de código. Este resumen evita releerlas y evita rehacer lo que ya se decidió. Las notas completas: #714, #715 y #718 (`mem_get_observation`).

## #718 · Auditoría del abogado del diablo (2026-09-23)

Veredicto: el techo del diseño lo ponen las imágenes y el movimiento.

- **Imágenes:**
  - la misma foto de wagyu en 6 productos de Carnes rojas;
  - marca de agua de banco de imágenes en la foto de pollo (también en el sitio vivo);
  - destello de Gemini en la imagen de "Otros";
  - la regla G0.7 ("tres vecinos, una sola foto") institucionaliza repetir;
  - hueco "Foto del mostrador · por tomar".
- **Movimiento:**
  - `loop-mejoras.md` §0 fijó "movimiento casi nulo", contra lo que pidió Eduardo (un rediseño con animaciones);
  - el diseño tiene menos movimiento que el sitio vivo (video a sangre, carrusel destacado de 6 diapositivas, carrusel de opiniones);
  - el Encabezado anima la altura;
  - el hover de la Tarjeta no está limitado a `(hover: hover)`;
  - el panel de acceso dura 700 ms;
  - la mascota era un fundido de 400 ms entre dos dibujos distintos ("se ven dos imágenes");
  - `prefers-reduced-motion` solo existía en el marquee de la Landing.
- **Contraste:** los títulos de "Fundamentos" eran #F5F3EF sobre crema: 1.05:1, mientras la autorrevisión decía "Pasa".
- **Verdad del negocio:**
  - el checkout era solo con tarjeta, pero el pedido real es un ticket compartible, sin pasarela;
  - el ejemplo "No tenemos picaña" (la picaña sí está en el Catálogo 2024 del dueño; ya corregido con "salmón");
  - categorías con 0 productos en el menú;
  - calorías calculadas por compra;
  - "Paquete Carnitas por Kilo";
  - el SMTP por defecto de Supabase da 2 correos de autenticación por hora;
  - hoy existe magic link, no código de 6 dígitos.
- **Herramientas nunca usadas:** Hyperframes, Emil, apple-design, mobile-native.

## #714 · Pipeline acordado (2026-09-23)

Investigación → abogado del diablo → arquitecto → mascota → bucles. Ya cumplido en la etapa de diseño.
Higgsfield funciona pero tiene 0 créditos; para imágenes gratis se usa la skill `imagen-gratis` (mflux local). Claude Design no genera ilustraciones: solo recorta y coloca las que se le dan.

## #715 · Trazabilidad de pedidos (2026-09-23)

- El "último loop" de 8 puntos nunca se aplicó en el diseño. Hoy están cubiertos por el export 1.1: Índice (falta miniaturas), links reales, logotipo tipográfico, Mis datos, Recetas guardadas, Ajustes, Paquetes y Catálogo de la semana.
- La lista de ítems de AdminNav está en el script del `.dc.html` (`AdminNav.dc.html:65`), no en el HTML.
- Contradicción real a decidir: íconos de contacto con color de marca (variante B) frente a la regla "una sola familia de íconos, sin color de marca". Quedó como opción A/B para Eduardo.

## Qué NO rehacer

Las 15 decisiones de `ESTADO.md` ya absorben lo anterior. El abogado del diablo debe atacarlas, no repetir esta auditoría.
