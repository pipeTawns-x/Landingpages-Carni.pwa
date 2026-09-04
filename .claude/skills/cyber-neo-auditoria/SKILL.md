---
name: cyber-neo-auditoria
description: Auditoria de seguridad de solo lectura sobre todo el proyecto — dependencias con CVE, patrones de codigo inseguro, secretos filtrados, fallos de autorizacion, criptografia debil y CI. Cubre OWASP 2025 Top 10 y CWE Top 25 con semgrep, trivy y gitleaks. Usala antes de publicar, tras rotar llaves, o cuando haya que revisar las politicas RLS de Supabase de punta a punta. NO esta instalado - trae el procedimiento y la decision es de Eduardo.
source: https://github.com/Hainrixz/cyber-neo
source_commit: 2026-07-18
verified: 2026-08-27
---

# Cyber Neo — auditoría de seguridad de todo el proyecto

Plugin de Claude Code que corre una auditoría de seguridad completa y **de solo
lectura** sobre un proyecto local. 244 estrellas, MIT, activo.

## Estado: NO instalado

Igual que `rtk-token-proxy`: aquí está el procedimiento verificado, la decisión
de instalarlo es de Eduardo.

## Por qué no duplica lo que ya hay

El registro ya tiene tres cosas de seguridad. Se comprobaron una por una antes
de proponer esta:

| Skill / agente existente | Qué cubre | Escáner real que invoca |
| --- | --- | --- |
| `ci-security-and-governance` | Endurecer el CI, gates de gobernanza | TruffleHog |
| `supply-chain-defense` | Cadena de suministro | `npm audit` |
| `security-guardian` (agente) | Revisión puntual de secretos, auth y RLS | ninguno |

Cyber Neo añade **SAST** (semgrep), **SCA de contenedores y dependencias**
(trivy) y **escaneo del historial de git** (gitleaks), que ninguna de las tres
hace. Y corre sobre el proyecto entero, no sobre un diff.

Ese es el hueco. Si solo repitiera `npm audit`, no estaría aquí.

## Para qué sirve en este repositorio

No es hipotético. Este proyecto ya tuvo:

- Una llave de Apify filtrada, rotada el 2026-08-25 (P-01, P-02, P-17)
- Políticas RLS y funciones `SECURITY DEFINER` con `search_path` que hubo que
  corregir a mano
- Una CSP escrita a mano en `netlify.toml`, sin nadie que la valide

Un escaneo de historial con gitleaks es exactamente lo que responde "¿quedó
algo más?" sin depender de que alguien se acuerde.

## La ley de hierro del propio paquete

Textual de su `SKILL.md`:

> **IRON LAW: READ-ONLY.** *"You MUST NOT modify, delete, or create any file in
> the target project."*

No ejecuta código del proyecto, no instala paquetes, no corre `npm audit --fix`.
Su única escritura es el informe. Eso es lo que la hace aceptable aquí.

## Instalación — del README, sección *Installation*

Opción 1, directa a las skills del usuario:

```bash
cd ~/.claude/skills
git clone https://github.com/Hainrixz/cyber-neo.git
```

Opción 2, clonar aparte y enlazar:

```bash
git clone https://github.com/Hainrixz/cyber-neo.git ~/projects/cyber-neo
ln -s ~/projects/cyber-neo ~/.claude/skills/cyber-neo
```

> **Ojo con la opción 2 en este stack.** El 2026-08-27 se comprobó que Claude
> Code sí descubre skills enlazadas por symlink, pero `gentle-ai` 1.39.4 **no**.
> Una skill instalada así funciona en el agente y queda invisible en el registro.
> Está anotado como P-28. Si se adopta, usar la opción 1.

El README menciona una tercera vía por marketplace (`/plugin install cyber-neo`)
pero él mismo la marca como *"coming soon"*.

## Verificar y usar

```
/cyber-neo .
```

O con ruta explícita: `/cyber-neo /path/to/project`. Si quedó bien instalado,
pide la ruta del proyecto a escanear.

## Escáneres opcionales que amplifican el resultado

Funciona sin ellos usando análisis nativo, pero los detecta si están:

```bash
brew install semgrep
brew install trivy
brew install gitleaks
```

Del README, líneas 294-296. Sin estos tres, la cobertura de SAST y de historial
baja mucho — que es justo lo que lo diferencia de lo que ya hay.

## NO VERIFICADO

No se clonó, no se instaló, no se ejecutó ningún escaneo. Los comandos salen del
`README.md`, del `SKILL.md` y del `.claude-plugin/plugin.json` del repositorio,
leídos el 2026-08-27 vía `gh api`. Falta medir cuánto tarda sobre este proyecto
y cuántos falsos positivos produce sobre un repo con `dist/` y `node_modules/`.
