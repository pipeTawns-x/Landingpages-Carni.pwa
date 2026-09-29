# Loop v3 · tandas cortas, verificadas una por una

## Qué aprendimos de la pasada 1 (export `diseños1.zip`, 2026-09-29)

**Sí funcionó** (19 de 24 criterios, más dos falsos positivos):
- links reales: los `href="#"` pasaron de 87 a 0;
- logotipo tipográfico en lugar de la foto del letrero y del sello;
- Mis datos, las tres secciones nuevas de Ajustes y las frases de Paquetes;
- Catálogo de la semana en 1080×1350, sin "por Kilo" y sin "kcal por día";
- la Bitácora con estados CERRADO y PARCIAL.

**No funcionó:**
1. **La pasada era demasiado grande** y el límite de 5 horas, que comparten Claude Design y Claude Code, la cortó a medias.
2. **Las miniaturas del Índice salen rotas.** Usan `{{ p.mini }}` con imágenes que nunca existieron: Claude Design no puede tomarse capturas a sí mismo.
3. **La premisa de la picaña era falsa.** En la base no hay picaña (datos/catalogo-real.md), así que "No tenemos picaña" es verdad. Aun así, el ejemplo debe ser algo que nunca se venda en una carnicería.
4. **Faltaron:** el eje $0 / $5k / $10k / $15k con los minigráficos de 7 días, "Revisa tu correo" sin plazo y la nota de la plantilla de Supabase.

## Cómo se trabaja ahora

- **Una tanda por mensaje.** Cada tanda tiene de 1 a 4 ítems y se pega en Claude Design con el límite de 5 horas por debajo del 50 %.
- **El detalle vive en `loop-final.md`.** El mensaje de cada tanda solo nombra los ítems, su aceptación y el cierre.
- **Al cerrar cada tanda:** Eduardo exporta el .zip a Descargas y escribe aquí "TANDA X LISTA". Claude Code corre `docs/design/verificacion/verificar_export.py`, anota el resultado en `loop-estado.md` y da la siguiente tanda.
- **Lo que Claude Design no puede hacer lo hace Claude Code en el repo:** las miniaturas del Índice, las tiras de movimiento y las fotos de referencia.

## Tandas

| Tanda | Ítems de loop-final.md | Quién prepara algo antes |
|---|---|---|
| 1A | Cierre de la pasada 1: ejemplo de "sin resultados", "Revisa tu correo", nota de Supabase, minigráficos y eje del panel, fichas del Índice sin imágenes rotas | nadie |
| 1B | Miniaturas reales en el Índice | Claude Code las genera en `docs/design/miniaturas/` a partir del export |
| 2A | 2.1 Movimiento | Claude Code: tiras en `assets/movimiento/` (opcional) |
| 2B | 2.2 Portada | nadie (el cuadro más claro ya está) |
| 2C | 2.3 Catálogo y fotos + 2.4 Compra | Claude Code: `assets/fotos-referencia/` con mflux (opcional) |
| 3A | 3.1 Acceso | nadie (la mascota ya está) |
| 3B | 3.2 Métricas del chatbot | nadie |

## Mensaje de la tanda 1A (para pegar en Claude Design)

```
TANDA 1A · cierre de la pasada 1. Sigue las reglas de docs/design/loop-final.md (rama pruebas) y la Bitácora del Índice. Solo haz esto:

1. Ejemplo de "sin resultados" de la lupa (Componentes e Inventario Django): cambia "picaña" por "salmón", algo que una carnicería nunca vende. En Inventario Django, "Dar de alta" queda como acción secundaria.
2. "Revisa tu correo": sin ningún plazo ("en unos minutos", "pronto", etc.). Junto al código de 6 dígitos agrega la nota "falta configurar la plantilla del correo en Supabase".
3. Panel administrativo: un minigráfico de 7 días dentro de cada KPI y el eje de ventas en $0 / $5k / $10k / $15k.
4. Índice: las miniaturas no existen todavía. Quita todas las imágenes de las fichas y deja una ficha tipográfica (número grande, nombre, grupo y etiqueta) con un hueco gris de proporción 390×844 rotulado "miniatura pendiente". Claude Code generará las miniaturas en la tanda 1B.

Aceptación (con números):
- 0 apariciones de "picaña" en Componentes e Inventario Django;
- 0 plazos junto a "Revisa tu correo" y 1 nota de Supabase;
- KPI con minigráfico: todos (anota cuántos) y el eje con $15k;
- 0 imágenes rotas en el Índice;
- en la Bitácora, 1.1 y 1.8 en CERRADO.

Al terminar escribe "TANDA 1A LISTA" con esa tabla y detente. Eduardo exportará el .zip.
```
