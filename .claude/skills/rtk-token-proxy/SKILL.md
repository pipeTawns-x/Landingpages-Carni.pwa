---
name: rtk-token-proxy
description: Proxy de CLI en Rust que comprime la salida de comandos de shell antes de que la lea el modelo. Usala cuando una sesion se coma el contexto en salidas de build, test, git diff, ls o npm, cuando haya que instalarlo o desinstalarlo, o cuando el hook deje de recortar. Trae instalacion y desinstalacion verificadas en esta maquina, la medicion real de ahorro, y los seis errores que tuvo la primera version de este documento.
source: https://github.com/rtk-ai/rtk
source_commit: v0.46.0
verified: 2026-08-28
---

# rtk — recortar la salida de shell antes de que llegue al contexto

Binario único de Rust que intercepta comandos de shell y comprime su salida
antes de que el modelo la lea. Apache-2.0.

**Estado: INSTALADO** en esta máquina el 2026-08-28, versión 0.46.0, por
Homebrew. El objetivo real no era instalarlo: era dejar de quedarse sin
créditos a media sesión.

---

## Cómo se desinstala

Escrito y verificado **antes** de instalar. Una herramienta que engancha el
shell sin camino de vuelta documentado no se instala.

### 1 · Quitar los artefactos que crea `init`

```bash
rtk init -g --uninstall
```

Se puede ensayar antes sin que escriba nada:

```bash
rtk init -g --uninstall --dry-run
```

`--dry-run` funciona con **todas** las variantes de `init`, incluida
`--uninstall`. Imprime cada archivo que tocaría con el prefijo
`[dry-run] would ...` y cierra con `[dry-run] Nothing written.` Lo único con lo
que no se combina es `--show`.

### 2 · Borrar el binario — según por dónde entró

```bash
brew uninstall rtk          # si vino de Homebrew  <- esta maquina
rm ~/.local/bin/rtk         # si vino del instalador por curl
cargo uninstall rtk         # si vino de Cargo
```

**No son intercambiables.** Ver el error 1 más abajo.

### 3 · La red de seguridad: los respaldos

`init` **no crea un archivo, toca cinco**. Antes de instalar se copiaron los dos
que ya existían y que rtk modifica en vez de crear:

```
~/.claude/settings.json.pre-rtk-20260828    4074 bytes   sha256 dd22f896...
~/.claude/CLAUDE.md.pre-rtk-20260828       35425 bytes   sha256 8fd0e6aa...
```

Si `--uninstall` deja restos:

```bash
cp ~/.claude/settings.json.pre-rtk-20260828 ~/.claude/settings.json
cp ~/.claude/CLAUDE.md.pre-rtk-20260828 ~/.claude/CLAUDE.md
```

Esto importa por dos razones. `settings.json` **ya tenía hooks propios** —el
refresco del registro de skills de `gentle-ai` y `claude-office-hook`—. Y
`CLAUDE.md` son las instrucciones globales escritas a mano por Eduardo: el
protocolo de Engram, las reglas del orquestador, la persona. Un desinstalador
que se lleve de más borra trabajo que no es suyo.

### 4 · Comprobar que quedó limpio

```bash
command -v rtk                          # sin salida = binario fuera
grep -c rtk ~/.claude/settings.json     # 0 = sin entrada
ls ~/.claude/RTK.md                     # No such file = sin residuo
grep -c RTK ~/.claude/CLAUDE.md         # 0 = sin la referencia @RTK.md
ls "$HOME/Library/Application Support/rtk/"   # sin filters.toml
```

El `grep` sobre `settings.json` lo recomienda el propio proyecto en
`docs/guide/resources/troubleshooting.md:62`.

### El perfil del shell NO se toca

`~/.local/bin` ya estaba en el `PATH` desde antes, por `~/.zshrc:134`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

El instalador por curl **no escribe** en ningún perfil: si la ruta falta, solo
imprime un aviso (`install.sh:161-162`). Homebrew tampoco. Desinstalar no
requiere quitar ninguna línea de ningún perfil, y **quitar esa línea rompería**
`claude`, `scrapling` y todo lo demás que vive en esa carpeta.

---

## Los cinco archivos que toca `init`

Sacados de `rtk init --global --dry-run`, no del README:

| Archivo | Qué hace |
| --- | --- |
| `~/.claude/RTK.md` | lo **crea** — las instrucciones para el modelo |
| `~/.claude/CLAUDE.md` | le **añade** una referencia `@RTK.md` |
| `~/.claude/settings.json` | lo **parchea** con el hook |
| `~/Library/Application Support/rtk/filters.toml` | plantilla de filtros |

Correr el `--dry-run` antes de cualquier `init` es gratis y evita sorpresas. Si
alguna vez esta tabla no coincide con lo que imprime, manda el `--dry-run`.

---

## Informe de seguridad

Se auditó antes de proponerlo, porque una herramienta que intercepta **todos**
los comandos de shell es donde no se acepta la palabra del README.

| Riesgo buscado | Resultado |
| --- | --- |
| `postinstall` de npm | No aplica. Es un binario de Rust |
| MITM / proxy de red | **No.** No intercepta tráfico, solo salida de procesos locales |
| Instala una CA en el sistema | **No** |
| Pide `sudo` | **No** |
| Modifica el perfil de shell | **No.** Solo avisa que agregues el `PATH` a mano |
| Licencia | Apache-2.0 |

**Dónde escribe — con la precisión que faltaba.** El instalador por curl escribe
solo en `$HOME/.local/bin` (`install.sh:9,141-149`). Homebrew escribe en su
Cellar. Pero **`rtk init` escribe en otros cuatro sitios**, listados arriba.
Decir "escribe solo en `~/.local/bin`" a secas es verdad del instalador y falso
del conjunto. Ese matiz es el error 4.

**Cómo funciona:** usa los *hooks* del agente para reescribir comandos, no un
shim en el `PATH` ni un wrapper del intérprete. Si se desinstala, no queda nada
roto detrás.

**Limitación que el propio proyecto declara** (README:64): las cuentas de tokens
que reporta son estimadas como `bytes / 4`; rtk no lleva tokenizador. Los
**porcentajes son fiables, los números absolutos aproximados**. Recortar 90% de
la salida no es recortar 90% de la factura, y el README lo dice sin adornos.

---

## Instalación

### En esta máquina, lo que funcionó

```bash
brew install rtk
```

Dejó `rtk 0.46.0` en `/opt/homebrew/Cellar/rtk/0.46.0/bin/rtk`, con enlace en
`/opt/homebrew/bin/rtk`.

### Alternativas, si Homebrew falla

```bash
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
```

```bash
cargo install --git https://github.com/rtk-ai/rtk
```

**Aviso de colisión de nombres, textual del README:109** — existe otro proyecto
llamado "rtk" (Rust Type Kit) en crates.io. Si `rtk gain` falla, el paquete
instalado es el equivocado; hay que usar `cargo install --git`. `cargo install
rtk` a secas trae el que no es.

### Verificar

```bash
rtk --version   # 0.46.0 en esta maquina
rtk gain        # el panel de ahorro
```

`rtk gain` es la prueba real de que es el paquete correcto: el otro "rtk" no
tiene ese subcomando. Recién instalado responde
`No tracking data yet.` — eso es correcto, no un fallo.

### Enganchar con Claude Code

```bash
rtk init -g --auto-patch
```

`--auto-patch` evita el diálogo interactivo de confirmación. **Sin ese flag, en
una sesión no interactiva el comando se queda esperando una respuesta que nunca
llega.** Ese es el error 5.

Después hay que **reiniciar el agente** para que el hook cargue.

---

## Los seis errores que tuvo la primera versión de este documento

Se escribió el 2026-08-27 sin instalar nada, y la instalación del 2026-08-28 la
desmintió en seis puntos. Quedan escritos porque un documento que solo muestra
el comando bueno no enseña dónde se tropieza.

1. **Decía que el binario queda en `~/.local/bin`, y recomendaba Homebrew.**
   Las dos cosas a la vez no pueden ser. Homebrew lo deja en su Cellar; solo el
   instalador por curl usa `~/.local/bin`. La desinstalación estaba mal por lo
   mismo: `rm ~/.local/bin/rtk` no habría borrado nada.
2. **Decía que `rtk --version` debía mostrar `0.28.2`.** Salió `0.46.0`. Ese
   número venía del README, que está desactualizado. Un número de versión
   copiado de un README no es una verificación.
3. **No decía que `init` toca `~/.claude/CLAUDE.md`**, que son las instrucciones
   globales escritas a mano. Ese archivo no estaba en ningún respaldo hasta que
   el `--dry-run` lo delató.
4. **El informe de seguridad decía "escribe solo en `$HOME/.local/bin`".** Eso
   describe el instalador, no la herramienta. `init` escribe en cuatro sitios
   más.
5. **No mencionaba `--auto-patch`.** Sin él, `init` abre un diálogo y en sesión
   no interactiva se cuelga.
6. **No mencionaba `--dry-run`,** que es lo único que permite saber qué va a
   tocar **antes** de que lo toque. Es la herramienta más útil del paquete para
   este trabajo y estaba ausente.

La lección: leer un README y escribir un procedimiento produce un documento
verosímil, no uno verificado. La diferencia solo aparece al correrlo.

---

## Ahorro real medido en este repositorio

Medido el 2026-08-28. Mismos comandos antes y después, contando caracteres.

Medido el 2026-08-28 en Carni-mvp. Mismos comandos antes y después, contando
caracteres con `wc -c`. Nueve comandos reales, no sintéticos.

| Comando | Antes | Después | Ahorro |
| --- | ---: | ---: | ---: |
| `git log -5` | 26 404 | 1 684 | **93.6%** |
| `ls -la node_modules` | 69 619 | 15 838 | **77.3%** |
| `git diff HEAD~1` | 87 690 | 30 970 | **64.7%** |
| `git status` | 778 | 424 | **45.5%** |
| `ls -R src` | 810 | 760 | 6.2% |
| `git log --oneline -50` | 2 618 | 2 580 | 1.5% |
| `npm run build` | 3 136 | 3 100 | 1.1% |
| `npm ls --depth=1` | 345 465 | 345 464 | **0.0%** |
| `git diff HEAD~1 --stat` | 895 | 904 | **−1.0%** |

**Global: 25.2%.** El panel propio de rtk (`rtk gain`) reporta 25.8% sobre los
mismos nueve comandos, así que las dos mediciones concuerdan.

### Cómo leer esa tabla, porque el 25% engaña

El promedio global está aplastado por un solo comando. Quitando `npm ls`, que no
tiene filtro y pesa 345 KB él solo, **el ahorro sobre los otros ocho es 70.7%**.

El patrón real es binario, no gradual:

- **Donde rtk tiene filtro, recorta entre 45% y 94%.** Son exactamente los
  comandos ruidosos: `git log` con formato completo, listados largos, diffs.
- **Donde no tiene filtro, hace cero.** Y sobre salida ya compacta
  (`--oneline`, `--stat`) **añade unos bytes de cabecera y sale negativo**.

### Los dos hallazgos que importan

1. **`npm ls --depth=1` es la salida más grande de la muestra —345 KB— y rtk le
   ahorra 1 byte.** No hay filtro para ese comando. Si una sesión se está
   comiendo el contexto ahí, rtk no la va a salvar.
2. **Pasar por rtk un comando ya compacto es contraproducente.** `git diff
   --stat` salió 1% más grande. Poco, pero la dirección es la equivocada: no todo
   se gana metiéndolo por el proxy.

**Conclusión honesta:** rtk sirve, y mucho, en el caso que motivó instalarlo
—salidas ruidosas que llenan el contexto—. No es un descuento parejo sobre todo
lo que corre la sesión.

---

## Para qué sirve aquí

Concreto: en este repositorio las sesiones se van en salidas de `npm run build`,
`git diff` largos, `git log` y listados de `node_modules`. Ese es el gasto que
rtk recorta.
