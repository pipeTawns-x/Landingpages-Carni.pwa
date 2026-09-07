# Agent Docs Moved

Canonical agent docs live in `/AGENTS.md` (repo root).

This file was consolidated into the root `AGENTS.md` to keep a single source of truth for local agent rules, roles, skills, and human-in-the-loop guardrails. Update the root file going forward.

## Servidor de desarrollo

Antes de cualquier tarea que dependa de la web —capturas, verificacion visual, medicion de rendimiento, revision de consola— comprobar que el servidor responde:

    curl -sI http://localhost:3002/index.html | head -1

Si no responde, levantarlo desacoplado de la sesion:

    nohup npm run dev > /tmp/vite.log 2>&1 &
    echo $! > /tmp/vite.pid
    sleep 4
    curl -sI http://localhost:3002/index.html | head -1

`nohup` evita que el proceso muera al terminar la sesion que lo lanzo. El PID queda registrado para detenerlo con `kill $(cat /tmp/vite.pid)`.

Nunca levantar el servidor como tarea en segundo plano del agente: ese proceso es hijo de la sesion y muere con ella.

Si no arranca, leer `/tmp/vite.log` antes de reintentar. Dos fallos seguidos significan revisar el log, no insistir.

## Estilos

Resumen de la regla vigente; la version canonica vive en `/AGENTS.md`.

- `css/` mantiene la arquitectura 7-1 para los estilos globales del sitio: variables, base, layout, paginas y componentes compartidos entre paginas HTML.
- Los componentes de React llevan su propia hoja de estilos co-locada en su carpeta, bajo `src/components/<Componente>/styles.scss`, compilada al `.css` hermano que importa el componente. Es el patron de co-locacion habitual en React y lo exige la actividad 6.28.9 de EBAC.
- Ningun otro directorio contiene SCSS.
