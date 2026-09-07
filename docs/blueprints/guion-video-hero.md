# Guion · Video del hero de la landing

**Reemplaza el carrusel de imágenes de `index.html`.** Ocupa el ancho completo de la
primera sección. Debajo van las categorías.

**Historia:** una pareja aburrida en su sala pide carne desde la app, el hombre se
teletransporta a la carnicería, le preparan y entregan su corte, y vuelve a su patio
a una carne asada con su pareja y sus amigos.

No vende la carnicería. **Vende la tienda en línea.**

---

## La lección que costó 89 créditos

Se intentaron cuatro generaciones pidiendo **las seis tomas en un solo video de 12-15
segundos**. Las cuatro fallaron, y siempre igual: personajes que desaparecen, escenas
que se fusionan, la carne entregada en la parrilla en vez del mostrador.

**No es un problema de redacción. Es aritmética:** seis escenas en quince segundos son
2.5 segundos por toma. En esa ventana el modelo no sostiene seis situaciones con los
mismos personajes, así que fusiona y descarta.

| Método | Costo | Riesgo por fallo |
|---|---|---|
| Un video de 15 s con 6 tomas | 22.5 (std) · 26.25 (pro) | se pierde todo |
| **Seis tomas de 5 s** | **45 en total** | **7.5, solo esa toma** |

Seis tomas sueltas cuestan **menos** que los dos intentos de 15 segundos que ya se
quemaron, y cada una es una instrucción simple que el modelo sí cumple.

**Regla: una toma por generación. Siempre.**

---

## Configuración para cada disparo

```
modelo          kling3_0
duration        5
aspect_ratio    16:9
sound           off        ← mudo por diseño, y más barato
mode            std        ← pro solo cuando la toma ya quedó
costo           7.5 créditos
```

Si Higgsfield sugiere el preset **"IN THE DARK"**, recházalo. Impone su propio estilo
sobre el nuestro.

**Regla que atraviesa las seis:** el **tercio izquierdo va más oscuro y despejado**.
Ahí se coloca el titular. Si el cuadro se llena de detalle, el texto no se lee.

---

## El bloque que va al final de las seis

Pégalo debajo de cada toma. Evita repetirlo y mantiene la unidad visual:

```
Style: documentary realism, natural available light, muted color grade,
shallow depth of field, 35mm film look, slight handheld movement. Left third
of the frame darker and less busy.

Avoid: American suburban backyard, round kettle Weber grill, string lights,
white matching patio furniture, manicured lawn, thick American-style steaks,
Asian or European cast, fashion models, romance scene, smiling directly at
camera, stock photo look, plastic skin, sterile supermarket, text, logos,
subtitles, watermarks.
```

> En inglés porque los generadores obedecen mejor. La descripción, en español.

---

## Toma 1 · El aburrimiento

```
A single continuous shot. A modest Mexican living room at dusk. Painted
concrete walls, a worn cloth sofa, a plastic-framed family photo on the wall.
A Mexican man in his thirties and his girlfriend sit slumped on the sofa,
bored, nothing to do. Warm lamp light from one side. He reaches over and
picks up his phone. Slow static camera.
```

---

## Toma 2 · La app

```
A single continuous shot. Tight over-the-shoulder on a phone screen held by
a Mexican man. The screen shows a dark-themed butcher shop app: a vertical
feed of cards, each card a photograph of raw red meat with a name under it, a
price in pesos, and a red rectangular button. His thumb moves down the feed
and taps the red button once. The screen glow lights his face from below.
```

**Si la pantalla sale genérica**, la salida es generar esta toma con **Seedance 2.0**,
que acepta `image_references`, y pasarle una captura real de `products.html` en móvil.
Ahí sí sale tu app y no una inventada.

---

## Toma 3 · Llega de frente

```
A single continuous shot. A Mexican man in his thirties stands inside a
Mexican neighborhood butcher shop, FACING the camera, facing a butcher across
a steel counter. We see his face, never his back. He is talking, ordering,
pointing at the refrigerated glass case. White tiled walls, the case full of
red meat, a hanging brass scale, a wooden block behind the butcher.
```

**De frente, no de espaldas.** Está pidiendo, no mirando.

---

## Toma 4 · El oficio

```
A single continuous shot. A Mexican butcher in a white apron lifts a slab of
beef onto a thick wooden board and slices THIN flat steaks with a long knife,
one after another. Close on the knife, the hands and the meat. Hard side
light raking across the surface. Focused, practiced movement.
```

Cortes **delgados y planos**, no filetes gruesos de steakhouse.

---

## Toma 5 · La entrega — **en el mostrador**

```
A single continuous shot. A Mexican butcher in a white apron wraps thin cuts
of beef in white butcher paper, folding the edges with practiced speed, slides
the package into a plastic bag and hands it ACROSS THE STEEL COUNTER. A
customer's hands reach in from the near side and take it. The exchange happens
at the counter, inside the butcher shop.
```

**Aquí se equivocaba siempre:** entregaba la carne junto a la parrilla. Envuelve,
embolsa y entrega **en el mostrador**, y de ahí pasa a sus manos.

---

## Toma 6 · La carne asada

```
A single continuous shot. A carne asada in a small concrete backyard in
Mexico, late afternoon. A LONG RECTANGULAR steel asador on legs with mesquite
charcoal and heavy smoke rising — not a round grill. On the grate: thin flat
cuts of arrachera laid side by side, whole green onions charring beside them,
corn tortillas warming at the edge. A Mexican man in his thirties stands at
the asador turning the meat with tongs, a beer bottle in his other hand.
Behind him a folding table with a plastic tablecloth where his girlfriend and
two friends sit on mismatched plastic chairs, with beer bottles, cut limes and
salsa in a stone molcajete, talking. Plain painted cinderblock wall, exposed
brick, a laundry line, a black water tinaco on the roof against the sky.
Slow handheld drift to the right, staying wide. Warm low sun, smoke catching
the light. Slow fade to black at the end.
```

**Por qué sale americano si no se cuida.** Pedir "backyard barbecue" devuelve el
promedio de internet, y ese promedio es Texas. Lo que hace mexicana esta toma son
detalles concretos que hay que nombrar: el **asador rectangular de lámina**, las
**cebollitas**, las **tortillas en la orilla**, las **sillas de plástico dispares**, el
**molcajete**, y el **tinaco en la azotea**.

---

## Al montar

- **Corte directo entre tomas.** Sin fundidos cruzados: le quitan el pulso documental.
- **El bucle empalma la 6 con la 1** — por eso la 6 cierra a negro.
- **Exporta sin pista de audio**, no con el volumen en cero.
- **Sin texto quemado.** El titular es HTML, para poder traducirlo, leerlo con lector
  de pantalla y cambiarlo sin regenerar nada.
- Herramienta de montaje: el workflow **`video-editing`** de Higgsfield, que corre en
  sandbox y renderiza MP4. O cualquier editor.

---

## Lo que además hay que generar

**Una imagen fija de respaldo**, tomada de la toma 4 o la 6. Sirve para dos cosas:

- El primer cuadro tarda en bajar; sin ella el hero aparece vacío
- A quien tenga `prefers-reduced-motion: reduce` se le muestra la imagen, nunca el
  video. Misma regla que el bento

---

## Y una decisión de maquetación pendiente

Hoy el hero tiene el carrusel de un lado y los botones **VER PRODUCTOS** y
**FIDELIDAD** del otro. Al pasar el video a todo el ancho, esos botones necesitan otro
sitio.

**No se resuelve improvisando el día del montaje.** Es trabajo de rediseño, con las
skills que ya recuperaron la voz.
