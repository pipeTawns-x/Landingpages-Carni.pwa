# Lazo · La página de configuración, el cajón-ticket, la lupa y los testimonios

**Para Claude Code. `~/Desktop/Carni-mvp`, rama `main`. Mobile-first, 390 px primero.**

**Este lazo corrige `LOOP_CARRITO_CAJON.md`.** Aquel decía "todo en el cajón, nunca una
página". Eduardo lo revisó el 3 de septiembre y decidió lo contrario, con razón:
meter configuración, pedido y entrega en un solo cajón **aprieta la interfaz y arruina
el UX**. La página se queda.

---

## El reparto de responsabilidades — esto es lo que cambia

```
PÁGINA  /producto/:id     configurar. Es donde se decide qué y cómo.
CAJÓN   lateral           TICKET. Solo para revisar lo que ya se pidió.
```

| Acción del cliente | A dónde va |
|---|---|
| Toca un corte en el catálogo | **la página** de configuración |
| Toca "Agregar" en una tarjeta | **la página** — ya no agrega a ciegas |
| Quiere ver qué lleva | **el cajón**, que es el ticket |
| Quiere **editar** algo del carrito | **icono de lápiz** → vuelve a la página de ese corte |
| Quiere terminar | del cajón al pedido |

**El cajón no configura. La página no muestra el pedido completo.** Cada uno hace una
cosa, y por eso ninguno se ve apretado.

### Los dos botones son recursividad

Hoy la tarjeta tiene **"Elegir"** y **"Agregar"** y hacen casi lo mismo. **Se queda uno.**
Sobrevive **"Agregar"** —es la palabra que el cliente busca— pero **navega a la página**,
que es lo que hacía "Elegir". Nada entra al pedido sin pasar por la configuración.

---

## Bloque 1 · La conversión automática de unidades

**Esto lo pidió Eduardo explícitamente y es lo primero.**

El problema real: el precio está por kilo. Un cliente que quiere medio kilo, con "kg"
seleccionado, escribe `0.5`. Hoy eso se queda como "0.5 kg", que se lee mal y se corta
peor. Y quien escribe `1000` en gramos debería ver "1 kg", no "1000 g".

### La regla

```
en KG      valor < 1        →  pasa a GRAMOS      0.5 kg    →  500 g
en KG      valor ≥ 1        →  se queda en kg     1.5 kg    →  1.5 kg
en GRAMOS  valor ≥ 1000     →  pasa a KILOS       1000 g    →  1 kg
                                                  2500 g    →  2.5 kg
en LIBRAS  no se convierte  →  es la unidad que el cliente eligió a propósito
```

**La conversión no cambia la cantidad, cambia cómo se escribe.** 0.5 kg y 500 g son el
mismo peso; lo que cambia es cuál de las dos lee mejor un ser humano.

### Cómo se implementa

Un **custom hook**, `useUnidadInteligente`. No un `useEffect` suelto dentro del
componente: es lógica reutilizable con estado propio, que es exactamente el criterio de
extracción de la clase 4 del módulo — **y es evaluable en EBAC**.

```
useUnidadInteligente(valorInicial, unidadInicial)
  → { valor, unidad, setValor, setUnidad, enKg, seConvirtio, textoDeConversion }
```

**Requisitos:**

- La conversión ocurre **al salir del campo** (`blur`) o tras una pausa al escribir,
  **nunca a media escritura**: convertir mientras el cliente teclea `1000` le cambia el
  campo bajo los dedos al llegar a `100`
- `seConvirtio` dispara un **aviso visible** —"Lo pusimos como 500 g"— que se desvanece
  solo. Eduardo lo pidió: *"que la persona lea muy bien que en verdad coincida con lo que
  pidió"*
- Las libras **nunca** se convierten solas
- El peso en kilos que sale del hook es el que alimenta `quote.js`. **Una sola verdad.**

**Verificación, con estos casos exactos:**

| Se escribe | Unidad | Debe quedar |
|---|---|---|
| `0.5` | kg | `500` g |
| `0.98` | kg | `980` g |
| `1.5` | kg | `1.5` kg |
| `1000` | g | `1` kg |
| `2500` | g | `2.5` kg |
| `800` | g | `800` g |
| `2` | lb | `2` lb |

Y el peso resultante en kg **idéntico** antes y después de convertir.

**Reporta y espera.**

---

## Bloque 2 · La página de configuración, bien hecha

Ya existe `src/pages/ProductoDetalle.tsx` y **funciona**. Este bloque la completa.

### Lo que le falta

1. **Observaciones** — texto libre. *"sin tanta grasa"*, *"más grueso"*. Viaja con la
   línea hasta el mostrador. **Sin esto no saben qué cortar.**
2. **Precio por libra** visible junto al de kilo — la base ya trae `price_per_lb`
3. **Resumen en vivo** en prosa: *"1.5 kg de Rib Eye, corte de 1.25 pulgadas"*
4. **El botón agrega de verdad** al pedido y **vuelve al catálogo**
5. La conversión del bloque 1, conectada

### La clave de variante — decidida

```
producto + modo + unidad + grosor + observaciones
```

**Va en una sola función**, `claveDeVariante(linea)`, para que cambiar la política sea
editar una línea.

**Por qué `modo` cuenta**, que es donde Eduardo corrigió el análisis: *"3 rib eye"* es
ambiguo — ¿3 kilos, 3 gramos, 3 piezas, 3 pesos? Esa ambigüedad es exactamente la que
hace que el mostrador corte mal. **El modo es parte de lo que se pidió, no solo de cómo
se escribió.**

### El diseño — y aquí no se escatima

Referencias que dio Eduardo: **Louis Vuitton** y **carnivoros.mx**. La observación que
importa: *"una plantilla de Shopify no lo trae y nuestro proyecto sí"*.

- Foto grande, respiración generosa, tipografía con jerarquía real
- Los controles no parecen un formulario de trámite
- **390 px primero.** Objetivos táctiles de 44 px sin excepción
- Carga con **esqueleto**, nunca spinner
- Cargar `ui-ux-pro-max` y `impeccable` antes de tocar el CSS. `hallmark` para no caer
  en estética genérica de IA

**Verificación:** los tres modos, las tres unidades, el grosor de 0.5" a 3" en pasos de
0.25", observaciones que sobreviven al recargar. Capturas a 390 y 1440.

**Reporta y espera.**

---

## Bloque 3 · El cajón como ticket

- Lista de lo pedido, cada línea con **su configuración legible**: modo, cantidad,
  grosor, observaciones
- **Icono de lápiz** por línea → navega a la página de ese corte **con su configuración
  cargada** para editarla
- Icono de basura → quita la línea
- Total, y el botón de continuar
- **No bloquea el desplazamiento en ≥768 px.** Es una regresión que Eduardo tuvo
  funcionando. En móvil sí puede ocupar la pantalla
- **En las tres páginas**: `index.html`, `products.html`, `accessweb.html`
- Borrar `premiumOrderModal` de `products.html`, que sigue vivo

**Verificación obligatoria, recorrida como usuario:** entrar → configurar → agregar →
seguir navegando → agregar otro → abrir el ticket → **tocar el lápiz** → comprobar que
vuelve con los datos cargados → recargar → comprobar que sobreviven.

**Reporta y espera.**

---

## Bloque 4 · La lupa

Sin salto de página. Panel de sugerencias bajo el campo, búsquedas recientes cuando está
vacío, datos de Supabase, con retardo al teclear. En las tres páginas — y a
`accessweb.html` hay que **añadirle el script**, que hoy no se carga.

Tocar un resultado navega a la página del producto. Eso es distinto de saltar al escribir.

**Verificación:** las tres páginas a 390 px, con el teclado abierto.

**Reporta y espera.**

---

## Bloque 5 · Testimonios en la landing

Las **siete reseñas reales** de `CONTEXTO_REELS_Y_RESENAS.md`. Textos en un **archivo de
datos**, no incrustados en el JSX.

- **"4.7 ★ · 61 opiniones en Google" visible**, con enlace al perfil
- Entrada suave, respetando `prefers-reduced-motion`
- Mobile-first

**No conectar la API de Google Places** — cuesta clave y cuota. Va a pendientes.

**Reporta y espera.**

---

## Bloque 6 · Recomendados y el banner

- **Productos similares** al pie de la página de configuración: de la misma categoría,
  excluyendo el actual. Es el camino para moverse entre cortes sin volver al catálogo
- **Banner editorial** en `products.html`, al estilo LV: imagen grande, poco texto, una
  sola llamada. **Sin empalmarse** con el catálogo maestro

**Reporta.**

---

## Fuera de alcance — a `PENDIENTES.md`, sin escribir una línea

Imágenes desde el panel · ofertas con temporizador · auth social · WhatsApp · delivery ·
reseñas en vivo de Google Places · verificación por SMS · BuildAds y ProductAds.

**Las reseñas negativas van al dashboard como telemetría**, no a la landing. Eduardo lo
decidió y tiene razón: sirven para detectar conductas y mejorar.

---

## Prohibido

- Dejar los dos botones "Elegir" y "Agregar" — es recursividad
- Que "Agregar" meta un kilo a ciegas
- Configurar dentro del cajón
- Que el cajón bloquee el desplazamiento en escritorio
- Perder las observaciones del cliente
- Tocar el bento · `netlify.toml` · `vite.config.js`
- Inventar peso por pieza o grosores de pollo, cerdo y embutidos
- `--force` · `sudo` · reescribir historia
- Decir que funciona sin recorrer el flujo completo a 390 px
