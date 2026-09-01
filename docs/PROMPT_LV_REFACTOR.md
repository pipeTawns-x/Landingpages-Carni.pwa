# PROMPT PARA OPENCODE — REFACTOREO FRONTEND INDEX.HTML (INSPIRACIÓN LV)

## OBJETIVO
Refactorizar el frontend de `index.html` (Carnicería El Señor de La Misericordia) inspirándose en la elegancia, minimalismo y dinamismo visual de **Louis Vuitton**. Elevar la experiencia a un estándar de lujo, moderno y funcional.

## TAREAS TÉCNICAS

### 1. HEADER — Layout y comportamiento
- **Posición de elementos:**
  - izquierda → hamburger + lupa (centrados)
  - centro → logo (`img`)
  - derecha → usuario, carrito y clima (icono + temperatura corta, ej. "29°C")
- **Comportamiento al hacer scroll:**
  - Header se sobrepondrá al video del hero
  - Al hacer scroll, el header cambia a fondo negro (como LV)
  - Al hacer scroll sobre secciones oscuras, el header pasa a blanco
  - Transición suave (CSS) entre estados

### 2. HERO — Video de fondo
- Video autoplay, muted, loop, playsinline
- Poster de respaldo para `prefers-reduced-motion`
- Overlay sutil (no opaco) para legibilidad

### 3. CATEGORÍAS — Bento Grid
- Recuperar todas las cards que se borraron
- Quitar el gradiente oscuro excesivo
- Fondo claro o semitransparente (`rgba(255,255,255,0.08)`)
- Cards con borde sutil, espacio negativo
- Efecto hover suave (`scale(1.05)`, `cubic-bezier`)

### 4. CAROUSEL — Promociones
- Después del bento, un carousel con imágenes tipo LV (full-width)
- Debajo del carousel, 4 cards de "Ofertas del Día" (titulo centrado)
- 4 cards con imagen, nombre, precio (dato mock)
- Responsive: mobile apila, desktop 2x2 o 4x1

### 5. SECCIONES EXISTENTES (estilos)
- **Sobre Nosotros + Ubicación:** fondos carbón/negro, acentos rojo/dorado sutiles
- **Contacto:** botones de contacto directo con iconos claros
- **Footer:** limpio, fondo carbón, enlaces organizados

### 6. ANIMACIONES SCROLL (P-15)
- IntersectionObserver: reveal en Sobre Nosotros, Ubicación, Carousel, Ofertas, Footer
- `prefers-reduced-motion`: sin animación, aparecen visibles

### 7. VERIFICACIÓN
- Playwright 320 / 768 / 1024 px
- Consola limpia
- Video reproduciéndose
- Bento sin parpadeo
- Header cambia de color al hacer scroll
- Carousel y ofertas visibles

### 8. DOCUMENTACIÓN
- Actualizar `docs/PENDIENTES.md` con estado de P-09, P-10, P-15, P-16

## SKILLS / RECURSOS DEL PROYECTO
- `carni-frontend-guardrails`
- `carni-node-ebac`
- `frontend-design`
- `impeccable`
- `web-design-guidelines`

## REGLAS
- No pedir confirmación entre pasos
- Usar skills/recursos del proyecto primero
- Preguntar solo si hay bloqueo técnico real
- Reportar al final de cada step con captura
