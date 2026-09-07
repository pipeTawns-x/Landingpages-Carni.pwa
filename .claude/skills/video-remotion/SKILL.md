---
name: video-remotion
description: Video programático con React — composiciones renderizadas a MP4 desde componentes. Úsala para el video de fondo de la landing y el login (P-14), para creatividades de campaña, o para cualquier pieza de video que deba regenerarse cuando cambien los datos. OJO antes de adoptar - licencia gratuita solo hasta 3 empleados.
source: https://github.com/remotion-dev/remotion
source_commit: 775c13d8485e
verified: 2026-08-27
---

# Remotion — video programático con React

Se escriben composiciones como componentes de React y se renderizan a MP4. El
mismo stack que ya usa el proyecto, así que no hay lenguaje nuevo que aprender.

## Antes de nada: la licencia NO es libre para todos

Verificado leyendo `LICENSE.md` del repo, no el README:

> *"Individuals and small companies are allowed to use Remotion to create videos
> for free (even commercial), while a company license is required for for-profit
> organizations of a certain size."*

Gratis para: **individuos, organizaciones con hasta 3 empleados, y sin fines de
lucro.** Por encima de eso hace falta licencia comercial de pago.

**Carnicería El Señor de La Misericordia tiene que contarse antes de adoptarlo.**
Si supera los tres empleados, esto se paga o se usa otra cosa. No es un detalle
legal menor: el video sería para publicidad de un negocio con fines de lucro.

Eso lo decide Eduardo, no un agente.

## Para qué sirve aquí

- **P-14**: video de fondo para landing, login y registro
- Creatividades de campaña que se regeneran solas cuando cambia el catálogo —
  un video por corte, con su precio real leído de `products`
- Cualquier pieza donde el video deba seguir a los datos y no al revés

## Cómo arranca

```bash
npx create-video@latest
```

Levanta un proyecto con el Studio para previsualizar en vivo. El render:

```bash
npx remotion render <composicion> salida.mp4
```

## Lo que hay que saber antes de escribir la primera composición

- Todo se mide en **frames**, no en segundos. `useCurrentFrame()` es el reloj.
- El render corre en Chromium headless: lo que no se pinta en un navegador,
  no sale en el video.
- Los assets se sirven desde `public/`. En este repo eso choca con
  `vite.config.js`, que hoy declara `publicDir: 'img'` — ver P-06.

## NO VERIFICADO

No se instaló ni se renderizó nada. El procedimiento sale del README y del
`LICENSE.md` del repositorio, leídos el 2026-08-27. Falta comprobar el tiempo
de render en esta máquina, que para video es lo que decide si el flujo es
usable.
