# Rediseño moderno de Carni-mvp

Objetivo: llevar `index.html` y `accessweb.html`, y después el catálogo, al nivel de Horizon X y Motion Sites, mejorando el proyecto existente en su lugar, sobre Django con islas de React, Tailwind v4, GSAP/ScrollTrigger y Motion.
Ramas: `frontend` (UI) y `backend` (puente con Django). Estrategia de entrega: ask-on-risk. Pruebas: Jest + `node --test tests/visual/` + Django test.

## Specs

- **S1** Mejorar el proyecto existente, nunca uno paralelo: "si bien los trabajos anteriores era una iteración, o sea, no era una mejora a nuestro proyecto, no, se convirtió en un proyecto nuevo, que eso estaba mal".
- **S2** Accessweb: "eso es una mejora que sí se hizo al Access Web… la idea es mejorar toda la Access Web, hacerla más moderna". La base es la mascota de Don Carlos (`frontend` `37535551`).
- **S3** Landing: "La landing page, en este caso la index HTML, igual mejorarla. ¿Mm? Tenerla bien estructurada, bien animada, scroll driven, motion".
- **S4** Nivel visual: "una web al nivel como las de Horizon X o Motion Site, pero con tecnologías como Django, React, Tailwind, o si ocupa alguna otra más? Obviamente, esta que se ocupe… tiene que ser compatible con, sí o sí, con Django".
- **S5** Lo bueno del proyecto paralelo se trae al proyecto real: "en ese nuevo proyecto se puede mejorar nuestro proyecto para que quede a la par… implementarlo esta vez sí o sí en nuestro proyecto".

## Cómo se logra (decisión técnica)

| Capa | Herramienta | Por qué es compatible con Django |
|---|---|---|
| Páginas | Plantillas de Django (`backend/templates/`) | Django sirve el HTML; cada página conserva su diseño al migrar. |
| Puente | Manifiesto de Vite leído por una etiqueta de plantilla (`django-vite` u otra equivalente) + WhiteNoise | Vite compila y Django inserta los `<script>`/`<link>` con hash. Hoy no existe: es T1. |
| Interactividad | Islas de React montadas en `<div data-island>` | React solo donde hay estado (carrito, mascota, formularios); el resto es HTML. |
| Estilos | Tailwind v4 (`@tailwindcss/vite`, ya instalado) + SCSS 7-1 existente | Va dentro del mismo bundle de Vite. |
| Scroll y timelines | GSAP + ScrollTrigger | JavaScript puro: funciona sobre HTML de Django sin framework. |
| Microinteracciones | Motion, dentro de las islas de React | Vive en React y no toca el servidor. |
| 3D | Un solo momento, de carga diferida | Import dinámico detrás de IntersectionObserver. |

Reglas de calidad: `prefers-reduced-motion` en toda animación, LCP < 2.5 s y CLS < 0.1, comparación con capturas de las referencias (skill `design-references`).

## Tasks

| ID | Specs | Tarea | Ruta | Estado |
|---|---|---|---|---|
| T1 | S4 | Puente Django↔Vite en `backend`: etiqueta de plantilla que lee el manifiesto, con su prueba | inline | pendiente |
| T2 | S4 | Instalar GSAP y Motion en `frontend` con versión fija, dentro del devcontainer | inline | pendiente |
| T3 | S2 | Accessweb: entrada animada de la mascota, microinteracciones de formulario y PNG de 1.3 MB a WebP/AVIF | inline | pendiente |
| T4 | S3, S4 | Landing: secciones con ScrollTrigger y hero con video, sobre `index.html` | inline | pendiente |
| T5 | S5 | Traer a `index.html` y `accessweb.html` lo que sí funcionó de la tienda paralela de `backend` (`backend/ventas/templates/ventas/tienda/`, `backend/static/tienda/landing.js`, commit `f18c42e7`: ScrollTrigger, bento de nueve tamaños y video 16:9), pieza por pieza, sin copiar la tienda entera | inline | pendiente |
| T6 | S4 | Un momento 3D de carga diferida | inline | pendiente |

## Log

- **L1 (2026-11-21, Eduardo):** "Ya tenemos claro qué tecnologías se van a utilizar para lograr un resultado moderno, estético, funcional y mejorando de manera espectacular lo que ya se tiene… deja todo listo, empecemos a desarrollar ya."
- **L2 (2026-11-21):** Estado verificado al abrir este documento. `frontend` tiene React 18.3 y Tailwind 4.3 instalados, pero no tiene GSAP ni Motion. `backend` tiene Django 5.2 y WhiteNoise, pero no tiene ningún puente con el manifiesto de Vite. Lo que sí tiene es una tienda paralela, escrita aparte en `backend/ventas/templates/ventas/tienda/` entre el 17 y el 18 de noviembre (`204ba717`, `f18c42e7`), que carga GSAP y ScrollTrigger como estáticos sueltos. Ese es el error de S1: se rehízo la landing en vez de mover `index.html`. Pendientes heredados: `css/styles.css` no coincide con lo que compila `css/styles.scss` (134 330 contra 131 951 bytes) y está así desde antes de este documento. Los PNG de la mascota pesan 1.3 MB y 1.0 MB.
- **L3 (2026-11-21):** Este documento se escribió en el worktree `stack-carney-mvp-244236`, porque un hook bloquea escribir en `rama-frontend` desde esa sesión. La sesión de desarrollo lo copia a `frontend` en su primer commit.
