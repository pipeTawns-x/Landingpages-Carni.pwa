---
name: stitch-a-codigo
description: Baja diseños de UI generados en Google Stitch y los convierte en pantallas servibles o en un sitio Astro. Úsala al trabajar el dashboard administrativo (P-21) o cualquier rediseño que arranque de una maqueta de Stitch, y para no volver a traducir un diseño a CSS mirándolo de reojo.
source: https://github.com/davideast/stitch-mcp
source_commit: d8d055b02d76
verified: 2026-08-27
---

# Stitch a código

CLI que trae los diseños generados en la plataforma Stitch de Google al flujo de
desarrollo, en vez de mirarlos en el navegador y traducirlos a mano.

## Para qué sirve aquí

**P-21, el dashboard administrativo.** Y ya existe material: el repo tiene
`docs/blueprints/STITCH_REDESIGN_PROMPT.md`, que es la especificación visual del
rediseño y hasta el 2026-08-27 vivía perdida dentro de `agents/`.

También sirve para la deuda que dejó el rediseño anterior: cuando la maqueta y
el CSS se traducen a ojo, aparecen cosas como un botón en `rgba(0,0,0,0)`.

## Los tres comandos

Sacados textuales del README, no inventados:

```bash
# Inicializa la configuracion en el proyecto
npx @_davideast/stitch-mcp init

# Sirve todas las pantallas del proyecto en un servidor local
npx @_davideast/stitch-mcp serve -p <project-id>

# Construye un sitio Astro mapeando pantallas a rutas
npx @_davideast/stitch-mcp site -p <project-id>
```

El `<project-id>` sale de la URL del proyecto en Stitch.

## Cuidado con `site`

`site` genera un sitio **Astro**. Carni-mvp corre Vite con SCSS 7-1 y un overlay
de React: **no se adopta Astro aquí**. Para este repo el comando útil es `serve`,
que expone las pantallas para mirarlas al lado del código y portar decisiones
concretas de espaciado, tipografía y color.

Usar `site` sería meter un segundo framework por la puerta de atrás.

## NO VERIFICADO

No se ejecutó ningún comando: hace falta una cuenta de Stitch y un `project-id`
que Eduardo no ha provisto. Los comandos salen del README leído el 2026-08-27.
Falta comprobar qué formato exacto devuelve `serve` — si es HTML plano, si trae
el CSS aparte, y si los tokens de diseño son extraíbles o vienen ya compilados.
