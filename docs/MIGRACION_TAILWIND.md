# Por qué Tailwind, y cómo se llega desde styled-components

Estado: decidido · Fecha: 2026-09-07 · Pendiente asociado: **P-37**

Este documento responde dos preguntas distintas y no las mezcla:

1. **Por qué la Práctica 4 se entrega con styled-components** aunque no sea lo
   que usaríamos hoy para empezar de cero.
2. **Por qué el destino es Tailwind v4** y cómo se llega sin romper nada.

---

## 1. La noticia: styled-components está en modo mantenimiento

El 17 de marzo de 2025 Evan Jacobs, su mantenedor, anunció que
styled-components entra en **modo mantenimiento**. Sus palabras, sin adornos:

> "For new projects, I would not recommend adopting styled-components."

No está deprecado ni abandonado: recibe parches críticos y de seguridad. Está
**congelado**. Y las dos razones técnicas son las que importan:

**a) No encaja con React Server Components.** Necesita `'use client'` en cada
componente que estiliza. Un componente de servidor no puede tener estilos de
styled-components, punto.

**b) Inyecta CSS en tiempo de ejecución.** Escribe las reglas durante el render
en vez de usar `useInsertionEffect`, el hook que React 18 añadió justo para
esto. Eso obliga al navegador a recalcular la disposición. La recomendación del
equipo de React es la contraria: extraer el CSS a una hoja estática y servirlo
con un `<link>`.

Sanity, que tenía miles de componentes escritos así, no reescribió: publicó un
fork —`styled-components-last-resort`— para poder seguir. Cuando la salida de
una biblioteca es bifurcarla, la biblioteca ya te está diciendo algo.

Fuentes:
- Anuncio y análisis técnico: https://www.sanity.io/blog/cut-styled-components-into-pieces-this-is-our-last-resort
- Video de midudev sobre la noticia: https://youtu.be/9GiosVIaDSY
- Estado del CSS-in-JS en 2026: https://blog.openreplay.com/state-css-in-js-2026/

---

## 2. Entonces, ¿por qué la práctica va con styled-components?

Porque el enunciado del módulo de Estilos con React **pide styled-components
por nombre**. Una entrega que lo sustituye por Tailwind no cumple el enunciado,
por buena que sea la razón. Y styled-components no está roto: está congelado.
Para una capa de islas React sobre HTML —que es lo que Carni-mvp es— funciona
perfectamente hoy.

La regla que se aplicó: **cumplir el enunciado y dejar la evolución escrita**.
No inventamos un criterio nuevo a mitad de una entrega evaluada.

---

## 3. Por qué Tailwind v4 y no otra cosa

| | styled-components 6.5.3 | Tailwind v4 |
|---|---|---|
| Coste en tiempo de ejecución | Inyecta CSS al renderizar | **Cero**: el CSS sale del build |
| React Server Components | Necesita `'use client'` | Compatible sin condiciones |
| Peso en el bundle | ~13 kB gzip de motor | 0 kB de motor |
| Mantenimiento | Congelado desde 03/2025 | Activo |
| Dependencias | Varias | 0 |
| Integración con Vite | Plugin de Babel | `@tailwindcss/vite`, oficial |

Se consideraron Panda CSS, vanilla-extract y StyleX. Los tres son buenos y los
tres son cero-runtime. Se elige Tailwind por una razón de proyecto, no de
biblioteca: **este repo ya tiene 45 SCSS vanilla y un sistema 7-1 vivo**.
Tailwind convive con CSS escrito a mano sin pedir que lo reescribas; Panda y
vanilla-extract quieren ser el sistema entero. Además Tailwind es lo que se pide
en el mercado local, y esto es una carnicería que algún día va a contratar a
alguien que lo mantenga.

---

## 4. Plan de migración

**No se migra nada hasta que el PR #9 esté en `main`.** El orden importa:

1. **Mergear el PR #9 a `main`.** Deliberado, no automático. Lleva la práctica
   entregada, la Lupa, el carrito compartido y la capa styled-components.
2. **Entregar la práctica tal como está.** Cumple el enunciado con
   styled-components. Esta decisión ya no se toca.
3. **Migrar por componente, no de golpe.** Un componente por PR, en este orden
   —de menos a más riesgo—:
   1. `OrderList` (aislado, sin estado propio)
   2. `ProductCard` (repetido 53 veces: es donde más se nota el runtime)
   3. `CartPanel` (tiene props transitorias `$isOpen`; hay que traducirlas a
      clases condicionales)
   4. `Lupa` (el más grande; va al final a propósito)
4. **Verificación visual obligatoria en cada paso**: capturas a 390 y 1440
   antes y después. Sin captura no se mergea. Ya se sabe lo que cuesta un
   "debería verse igual".
5. **`carniTheme.ts` no se tira: se traduce.** Sus tokens salen de
   `css/abstracts/_variables.scss` y pasan a `@theme` en el CSS de Tailwind v4.
   El ADN visual es el mismo archivo de origen en las tres formas.
6. **`createGlobalStyle` pasa a la hoja global.** Son cuatro reglas
   (`body.cart-is-open`, el bloqueo móvil y el colapso de la rejilla); no
   necesitan JavaScript para existir.

## 5. Qué NO se toca en la migración

- Los 45 SCSS vanilla y el sistema `css/` 7-1.
- `vite.config.js`, `netlify.toml`, `server/routes/buildads.ts`.
- Las rutas públicas: `index.html`, `products.html`, `accessweb.html`,
  `dashboar.html`.
