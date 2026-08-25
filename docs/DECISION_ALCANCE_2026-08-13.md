# Decisión de alcance — 13 agosto 2026

Tomada por Eduardo tras la corrida del abogado del diablo sobre afiliados.

**Razón**: los programas de fidelización, afiliados y publicidad dependen de números que solo el dueño de la carnicería puede dar — márgenes por categoría, ticket promedio, frecuencia del cliente, costo real de una entrega. Sin esos datos, cualquier cosa que se construya hoy es mock que habrá que rehacer. El abogado del diablo lo confirmó: de siete objeciones confirmadas, las dos de costo más alto son **decisiones de negocio, no de código**.

---

## Congelado hasta tener contacto con el dueño

| Módulo | Estado | Qué falta para descongelarlo |
|---|---|---|
| Fidelización por niveles | Blueprint escrito, mocks calibrados | Márgenes por categoría, ticket promedio, frecuencia |
| Programa de afiliados | 7 objeciones confirmadas, tesis reescrita | Cuánto vale adquirir un cliente nuevo |
| BuildAds | Scaffold `BuildAdsOrchestrator.tsx` | Presupuesto publicitario real, llaves de Predis y ElevenLabs |
| ProductAds | Nada construido | Fotos de producto de calidad |

**No se pierde el trabajo.** Queda documentado y listo para retomar:

- `docs/blueprints/logica-fidelizacion-afiliados.md` — invariantes, parámetros, 4 niveles, diseño del QR, tope de apilado
- `docs/abogado/01-objeciones.md`, `02-verificacion.md`, `03-juicio.md` — 7 objeciones confirmadas con evidencia y línea
- `.archon/workflows/abogado-fidelizacion.yaml` — corrida lista, sin ejecutar
- `docs/PLAN_MVP_COMPLETO.md` — las 8 fases con sus migraciones

Cuando el dueño dé sus números, se corre `archon run abogado-fidelizacion` y se sigue desde ahí.

---

## Activo ahora — dos frentes

### 1. Curso EBAC (prioridad más alta)

Es la única actividad pendiente de los 41 módulos y desbloquea todo lo que sigue: React III, Estilos, Redux I y II, Testing, Accesibilidad y el bloque de entrevistas técnicas.

**Estado verificado hoy:**

```
217cacd1        sigue SIN respaldo en ningún remoto (949 líneas)
practicas-ebac  1 commit local sin subir
docs/           sigue untracked
```

**Dato bueno**: `practicas/react/` **no importa Supabase**. Corre sin credenciales, que es exactamente lo que necesita el tutor para poder evaluarla. No lo cambiamos.

Pasos:

1. `git push -u origin practicas-ebac` — respaldo, no entrega
2. Commitear `docs/`
3. Los 3 huecos de la Práctica 2 contra la consigna 6.28.9
4. Texto de entrega con rutas verificadas contra el repo ya subido

### 2. Rediseño de tres páginas

Alcance recortado a lo que Eduardo pidió, no las 7 del blueprint original:

| Página | Rol |
|---|---|
| `index.html` | Landing |
| `products.html` | Catálogo y carrito |
| `accessweb.html` | Login y registro |

Se conserva el blueprint vigente (`docs/blueprints/web-redesign.md`): SCSS 7-1, paleta bloqueada, bento intacto, sin framework nuevo, sin rutas nuevas. Validación con capturas a 320 / 768 / 1024.

**Falta instalar**: `tododeia-animaciones`, marcada Missing en el triage. Y evaluar GSAP + ScrollTrigger — hoy `package.json` no tiene ninguna librería de animación.

---

## Una advertencia sobre "funcionalidad real" en las prácticas

Eduardo quiere que las prácticas sirvan de verdad dentro de Carni-mvp, no que sean ejercicios vacíos. Bien. Pero hay un límite duro:

**La práctica debe correr sin credenciales.** Si el módulo de inventario se conecta al Supabase real, el tutor abre el repo, no tiene `.env`, no arranca, y reprueba una práctica que estaba bien hecha.

La consigna 6.28.9 pide explícitamente "datos ficticios". La forma correcta de darle realidad sin romper eso es la que ya está: los 14 productos del seed real, con sus `product_id` verdaderos, embebidos en `types/carni.js`. Dominio real, datos estáticos, cero dependencias.

Eso ya está hecho y está bien. No lo toquemos.

---

## Orden

```
1. push de practicas-ebac + commit de docs/     ← hoy, sin discusión
2. los 3 huecos de la Práctica 2
3. entrega en el LMS
4. rediseño de las 3 páginas
```

El rediseño va después de la entrega porque la práctica tiene un evaluador humano esperando y el rediseño no tiene fecha.

---

## Lo que queda pendiente de decidir, sin bloquear nada

- **La contradicción del 10x**: `vision.md` dice 1 punto por $10, `loyalty.js` dice por $100. Corregir `vision.md` para que nadie implemente el error.
- **La objeción 2 del abogado del diablo**: `create_order_with_items()` acepta el `unit_price` del cliente. Es un agujero real del schema, independiente de afiliados. Va en su propia fila, no en la cubeta de un módulo congelado. Urgencia real depende de si las migraciones están aplicadas en un Supabase con datos reales — sin confirmar.
- **Molida 80/20 a $155** está bajo el piso nacional de mercado ($185–260). Revisar si es captación deliberada o precio viejo.
