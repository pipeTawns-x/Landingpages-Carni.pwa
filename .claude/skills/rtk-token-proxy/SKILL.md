---
name: rtk-token-proxy
description: Proxy de CLI en Rust que comprime la salida de comandos de shell antes de que la lea el agente, entre 60 y 90 por ciento menos bytes. Usala cuando una sesion se coma el contexto en salidas de build, test, git diff o npm, o cuando haya que decidir si adoptarlo. Trae el procedimiento de instalacion verificado y el informe de seguridad. NO esta instalado - la decision es de Eduardo.
source: https://github.com/rtk-ai/rtk
source_commit: master@2026-08-27
verified: 2026-08-27
---

# rtk — recortar la salida de shell antes de que llegue al contexto

Binario único de Rust que intercepta comandos de shell y comprime su salida
antes de que el agente la lea. 77.6k estrellas, Apache-2.0, con push el mismo
2026-08-27.

## Estado: NO instalado

**Este documento no instala nada.** La decisión de adoptarlo es de Eduardo. Lo
que hay aquí es el procedimiento verificado y el informe de seguridad, para que
la decisión se tome con datos.

## Informe de seguridad — qué se revisó y qué salió

Se auditó antes de proponerlo, porque una herramienta que intercepta **todos**
los comandos de shell es exactamente donde no se acepta la palabra del README.

| Riesgo buscado | Resultado |
| --- | --- |
| `postinstall` de npm | No aplica. Es un binario de Rust, no un paquete de npm |
| MITM / proxy de red | **No.** No intercepta tráfico de red, solo salida de procesos locales |
| Instala una CA en el sistema | **No** |
| Pide `sudo` | **No** |
| Modifica el perfil de shell (`.zshrc`, `.bashrc`) | **No** |
| Dónde escribe | Solo en `$HOME/.local/bin` |
| Licencia | Apache-2.0 |

**Cómo funciona en realidad:** usa los *hooks* del agente para reescribir
comandos, no un shim en el `PATH` ni un wrapper del intérprete. Eso importa:
si se desinstala, no queda nada roto detrás.

**Limitación que el propio proyecto declara** (README:64): las cuentas de tokens
que reporta son estimadas como `bytes / 4`. rtk no lleva tokenizador. Los
**porcentajes son fiables, los números absolutos son aproximados**. No es lo
mismo recortar 90% de la salida que recortar 90% de la factura, y el README lo
dice sin adornos (línea 60).

## Instalación — cuando Eduardo lo decida

Del README, sección *Installation*. Homebrew es la vía recomendada por el
proyecto y la que corresponde a esta máquina:

```bash
brew install rtk
```

Alternativas del mismo README, por si la fórmula falla:

```bash
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
```

```bash
cargo install --git https://github.com/rtk-ai/rtk
```

## Verificar que quedó el binario correcto

```bash
rtk --version
rtk gain
```

**Aviso de colisión de nombres, textual del README:109** — existe otro proyecto
llamado "rtk" (Rust Type Kit) en crates.io. Si `rtk gain` falla, el paquete
instalado es el equivocado; en ese caso hay que usar `cargo install --git`.

Esto no es un detalle: `cargo install rtk` a secas trae el proyecto que no es.

## Enganchar con Claude Code

```bash
rtk init -g
```

`-g` es global y el modo por defecto cubre Claude Code y Copilot. El README
lista variantes por agente (`--gemini`, `--codex`, `--agent cursor`, etc.).

## Para qué serviría aquí

Concreto, no genérico: en este repositorio las sesiones se van en salidas de
`npm run build`, `git diff` largos y listados de `supabase`. Ese es el gasto que
rtk recorta.

## Cómo revertirlo

Al no tocar el perfil de shell ni el `PATH`, desinstalar el binario y quitar los
hooks devuelve el sistema a su estado anterior. Esto **no se comprobó
ejecutándolo** — se deduce del hecho verificado de que no escribe fuera de
`$HOME/.local/bin`.

## NO VERIFICADO

No se instaló, no se ejecutó, no se midió el ahorro real en este repositorio.
Todo lo de arriba sale del README leído el 2026-08-27 vía `gh api` y de la
auditoría de la misma fecha. El ahorro real solo se sabe midiéndolo.
