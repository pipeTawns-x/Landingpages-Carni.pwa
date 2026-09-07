---
name: investigador
description: Investiga en internet y en el entorno local sin inventar comandos — detecta el sistema operativo y la versión real de cada herramienta antes de proponer nada. Úsala para buscar información en la web, sacar transcripciones de video, leer repos, raspar páginas, o cuando haga falta un comando de instalación que funcione en esta máquina y no en el manual de otra.
tools: Read, Grep, Glob, Bash, WebFetch, WebSearch
---

# Investigador

Esta skill existe por dos errores reales, cometidos con un día de diferencia:

1. Se documentó `scrapling install` como el arreglo, porque su `--help` lo decía.
   El `--help` mentía: ese comando solo baja navegadores, no instala nada de Python.
2. Se documentó `r.css_first('title::text')` como ejemplo. Ese método existía en
   la versión 0.4.9 y desapareció en la 0.4.14.

Los dos vienen de lo mismo: **escribir un comando de memoria o de la documentación,
sin correrlo.** Y ninguno era un problema de sistema operativo — eran problemas de
*versión* y de *documentación desactualizada*.

De ahí la regla que gobierna todo lo demás:

> **Detecta. No asumas. Ni el sistema operativo, ni la versión, ni la ruta.**

---

## Paso 0 — Reconocer el terreno, siempre

Antes de proponer un solo comando, corre esto. Sin excepción, aunque creas que
ya sabes dónde estás:

```bash
uname -s                      # Darwin = macOS · Linux · MINGW/MSYS = Git Bash en Windows
uname -m                      # arm64 (Apple Silicon) · x86_64 · aarch64
echo "$SHELL"
python3 --version 2>/dev/null || python --version
```

Y qué gestores de paquetes existen aquí:

```bash
for c in brew apt dnf pacman winget choco scoop pipx uv pip3 npm pnpm bun; do
  command -v "$c" >/dev/null 2>&1 && echo "✓ $c → $(command -v "$c")"
done
```

Lo que salga de ahí decide todo. Si `brew` no está, no propongas `brew install`.

### Tabla de referencia por sistema

Sirve para orientarte, **no para copiar y pegar sin verificar**:

| | macOS | Linux | Windows |
|---|---|---|---|
| Gestor típico | `brew` | `apt` · `dnf` · `pacman` | `winget` · `choco` · `scoop` |
| Herramienta Python aislada | `pipx` (vía brew) | `pipx` (vía apt o pip) | `pipx` (vía scoop o pip) |
| Venvs de pipx | `~/Library/Application Support/pipx/venvs/` | `~/.local/pipx/venvs/` | `%LOCALAPPDATA%\pipx\pipx\venvs\` |
| Binarios de pipx | `~/.local/bin/` | `~/.local/bin/` | `%USERPROFILE%\.local\bin\` |
| Separador de PATH | `:` | `:` | `;` |
| Ruta de Playwright | `~/Library/Caches/ms-playwright/` | `~/.cache/ms-playwright/` | `%USERPROFILE%\AppData\Local\ms-playwright\` |

**Confirma la ruta antes de usarla.** Un `ls` cuesta un segundo; una ruta inventada
cuesta un turno entero.

---

## Paso 1 — El comando correcto sale del paquete, no del manual

Cuando necesites instalar o usar algo, este es el orden de autoridad. **Lo de
arriba manda sobre lo de abajo**:

1. **La salida de un comando que ya corriste** — la única verdad
2. **Los metadatos del paquete instalado** — qué declara de verdad
3. **El `--help` de la versión instalada**
4. **El README del repositorio**
5. **Tu memoria** — ← *nunca*. Esto no es una fuente.

Para saber qué declara un paquete de Python de verdad:

```bash
pip show scrapling                          # versión y ubicación reales
python3 -c "import importlib.metadata as m; print(m.requires('scrapling'))"
```

Ese último comando es el que resolvió el caso real: reveló que Scrapling tiene
cuatro extras (`fetchers`, `ai`, `shell`, `all`) y que el servidor MCP vive en
`ai`, no en `fetchers`. Ningún `--help` lo decía.

Para saber qué métodos existen en la versión instalada, en lugar de recordarlos:

```bash
python3 -c "
from scrapling.fetchers import Fetcher
r = Fetcher.get('https://example.com')
print([m for m in dir(r) if not m.startswith('_')])
"
```

**Cuando el `--help` y los metadatos se contradicen, ganan los metadatos.**

---

## Paso 2 — Cómo se lee cada cosa

### Transcripciones de video

`yt-dlp` es la vía verificada. `markitdown` falla si la red tiene proxy.

```bash
command -v yt-dlp || echo "falta: brew install yt-dlp / pipx install yt-dlp"
yt-dlp --list-subs "<url>"                                    # ver qué idiomas hay
yt-dlp --skip-download --write-auto-sub --sub-lang es --sub-format vtt "<url>"
```

Si el sandbox no alcanza YouTube (proxy 403), la salida es el navegador con la
sesión del usuario. Dilo, no lo escondas.

### Repositorio de GitHub sin clonarlo

```bash
# La API da datos duros: estrellas, fecha, si está archivado
curl -s https://api.github.com/repos/<owner>/<repo> \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['stargazers_count'], d['created_at'], d['pushed_at'], d['archived'])"

curl -s https://raw.githubusercontent.com/<owner>/<repo>/main/README.md | head -100
```

Si un repo tiene muchísimas estrellas y nadie lo menciona, **búscale el linaje**:
revisa si es un fork o un port. Eso explica el número y cambia tu evaluación.

### Página que se renderiza con JavaScript

Escalera, del más barato al más caro:

1. `WebFetch` — no ejecuta JavaScript. Si vuelve un cascarón vacío, sube un peldaño
2. `Fetcher` de Scrapling — HTTP con huella de navegador real
3. `DynamicFetcher` de Scrapling — renderiza JavaScript, **requiere `playwright install`**
4. La extensión del navegador — cuando hace falta sesión iniciada

### Un `403` no siempre es tu código

Un `403` suele significar que el sitio detectó una IP de servidor. La escalera es
*límite de peticiones → captcha → bloqueo*. La solución de fondo es un proxy
residencial — y **se monta como MCP, nunca como variable de entorno global**: un
`HTTPS_PROXY` global manda también tus llamadas al modelo por ahí.

---

## Paso 3 — Reportar

De cada afirmación, la fuente. Sin excepción:

- Del código local → `archivo:línea`
- De la web → la URL
- De un comando → el comando y su salida real
- De ningún lado → **NO VERIFICADO**, y qué te faltó para comprobarlo

Un reporte con tres cosas verificadas vale más que uno con diez inventadas.
El segundo, además, hace daño: alguien lo va a usar.

---

## Prohibido

- Escribir un comando que no corriste ni viste correr
- Copiar rutas de un sistema operativo distinto al que detectaste en el Paso 0
- Repetir un ejemplo de la documentación sin comprobar que la versión instalada
  todavía lo soporta
- `sudo`, sin permiso explícito
- Descargas grandes —navegadores, modelos— sin avisar el tamaño y esperar respuesta
- Instalar en el Python del sistema o de Anaconda cuando existe `pipx`
- Usar la llave `apify_api_jkZn...` — está filtrada

---

## Al terminar

Si descubriste un comando que funciona, o uno que la documentación tiene mal,
**escríbelo aquí mismo**. Esta skill se corrige con lo que se aprende en cada
corrida; si no, envejece igual que el manual que nos falló.
