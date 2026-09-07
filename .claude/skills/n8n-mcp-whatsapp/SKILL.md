---
name: n8n-mcp-whatsapp
description: Conecta n8n por MCP para construir flujos desde el agente — pedidos por WhatsApp, avance del estado desde el mostrador y atencion al cliente. Usala cuando arranque el bot de WhatsApp o cuando haya que levantar la instancia de n8n; trae la entrada de .mcp.json verificada contra docs/SELF_HOSTING.md y lo que hace falta antes. Hoy NO se conecta - falta una instancia de n8n corriendo.
source: https://github.com/czlonkowski/n8n-mcp
source_commit: 71f338b0df04
verified: 2026-08-27
---

# n8n por MCP — el bot de WhatsApp

Servidor MCP que le da al agente las herramientas de n8n: construir flujos,
consultar nodos, validar workflows. Complementa a `n8n-workflow-method-local`,
que trae el criterio de diseño; esta trae la conexión.

## Corrección respecto a la versión del 2026-08-27 (mañana)

La primera versión traía una entrada de `.mcp.json` **reconstruida** a partir de
una mención suelta de `N8N_API_URL` y `N8N_API_KEY` en el README (línea 374).
No estaba copiada del bloque de configuración real, y le faltaba algo que rompe
el servidor:

```
MCP_MODE: "stdio"
```

El propio `docs/SELF_HOSTING.md` lo marca en negrita, línea 20:

> *"The `MCP_MODE: "stdio"` environment variable is **required**. Without it, you
> will see JSON parsing errors like `"Unexpected token..."` in the UI."*

La entrada anterior habría producido exactamente ese fallo. Abajo va la buena.

## Por qué es una skill y no una entrada en `.mcp.json` todavía

La escalera manda que un servicio con endpoint va al escalón 2, y es correcto.
Pero **`n8n-mcp` no habla con un servicio ajeno: habla con TU instancia de n8n**,
y en este proyecto no hay ninguna corriendo. Verificado el 2026-08-27: no existe
contenedor de n8n en el repo y `docs/CONTEXTO_2026-08-20.md:137` lo dice
explícitamente.

Agregarlo a `.mcp.json` hoy crearía un servidor que arranca y falla en cada
sesión: un cascarón, que es justo lo que este trabajo vino a eliminar. La
conexión queda documentada aquí, lista para pegar, y sube al escalón 2 el día
que haya instancia.

## Los tres usos concretos

Del contexto del proyecto, no inventados:

1. **Pedidos por WhatsApp** — que el cliente pida por ahí y el pedido entre a
   `orders`
2. **Avance del proceso** — que el mostrador mueva el estado desde el teléfono,
   sin abrir el dashboard
3. **Atención al cliente** por el mismo canal

## La entrada, copiada de `docs/SELF_HOSTING.md:40-56`

Solo para cuando exista la instancia:

```json
"n8n-mcp": {
  "command": "npx",
  "args": ["n8n-mcp"],
  "env": {
    "MCP_MODE": "stdio",
    "LOG_LEVEL": "error",
    "DISABLE_CONSOLE_OUTPUT": "true",
    "N8N_API_URL": "${N8N_API_URL}",
    "N8N_API_KEY": "${N8N_API_KEY}"
  }
}
```

Las tres primeras variables son fijas y van tal cual. **Las dos últimas van por
entorno, nunca escritas en el archivo.** `.mcp.json` vive en el repositorio: una
llave ahí dentro es una llave publicada. La regla está en `docs/brain/security.md`.

Sin `N8N_API_URL` y `N8N_API_KEY` el servidor arranca igual, pero solo con las
herramientas de documentación de nodos — sin poder crear ni desplegar flujos.
Ese es el modo "basic configuration" del mismo documento, líneas 23-37.

## Prueba rápida antes de pegar nada

```bash
npx n8n-mcp
```

Del mismo documento, línea 15. No requiere instalación previa.

## Lo que hace falta antes

- Una instancia de n8n corriendo — Docker, y hoy el proyecto no tiene compose
  de producción, solo el devcontainer
- Un API key generada desde esa instancia, que la pone Eduardo
- Decidir dónde vive: local para probar, o VPS para que el bot conteste cuando
  la laptop está cerrada. Un bot de WhatsApp que solo funciona con la máquina
  encendida no es un bot.

## Advertencia del propio proyecto

README, sección *Important Safety Warning*: **nunca editar flujos de producción
directamente con IA.** Copia primero, prueba en desarrollo, exporta respaldos.

## NO VERIFICADO

No se conectó nada. `npx n8n-mcp` no se ejecutó — no hay instancia contra la que
probarlo. La configuración de arriba sale de `docs/SELF_HOSTING.md` leído el
2026-08-27 vía `gh api`, no de una ejecución.
