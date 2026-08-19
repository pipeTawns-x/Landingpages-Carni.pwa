# Investigación real + los 6 prompts para Code

Fecha: 12 agosto 2026. Todo lo de abajo se leyó de la fuente. Nada inventado. Lo que no pude verificar está en la sección final.

---

## PARTE 1 — Los 8 reels: qué dicen realmente

Entré a tu Facebook con la extensión de Chrome y los abrí uno por uno. **Aclaración honesta: no puedo ver el video.** Leí el texto del post, el autor y los comentarios. Con eso alcanzó, porque los 8 son tutoriales y el valor está escrito.

| # | Autor | Tema |
|---|---|---|
| 1 | **Juanbertorello.ia** | "Fable 5 ya está acá. Tu web sigue pareciendo IA" |
| 2 | **Píldoras de programación** | Firecrawl — la herramienta que facilita el web scraping |
| 3 | **Soy Enrique Rocha** | "Diseña con Claude con las mejores skills" |
| 4 | **Midudev** | React Doctor — detecta antipatrones: `useEffect` innecesarios, errores de accesibilidad |
| 5 | **Midudev** | GSAP + ScrollTrigger — animación estilo Apple al hacer scroll |
| 6 | **Soy Enrique Rocha** | "Claude crea animaciones web profesionales" |
| 7 | **Soy Enrique Rocha** | "Claude con reglas gasta mucho menos" |
| 8 | **Soy Enrique Rocha** | "Claude ahora es tu investigador profesional" |

### El reel 1 es la receta completa. Texto literal del post:

> "Lo típico es abrirlo y pedirle 'armame una web linda'. Te devuelve algo prolijo, centrado y genérico, igual a las otras mil, porque no le diste ningún criterio: **le pediste una web, no un diseño**."
>
> "Lo que cambia son 3 herramientas que casi nadie combina."

| Herramienta | Para qué (según el autor) | Estado tuyo |
|---|---|---|
| **UI/UX Pro Max** | "le mete criterio de diseñador de verdad: paleta, tipografía, jerarquía, espaciado. Sin eso, Claude te arma lo que le sale por defecto" | **YA LA TIENES INSTALADA** (`ui-ux-pro-max` en tu registro) |
| **21st.dev** | "tiene animaciones ya hechas. Elegís la que te gusta, copiás lo que te da la página, se lo pasás a Claude y te la implementa" | servicio web, gratis de consultar |
| **Higgsfield** | "para el video animado de fondo, que es eso que hace que una web se sienta cara. Le subís la foto de tu producto, lo recreás y se lo das para que lo integre" | servicio externo |

Esto responde exactamente lo que pediste: *"ediciones de video en la página, como bienvenidas, en el login y el registro"*. Es Higgsfield. Y el criterio de diseño que evita el look genérico ya lo tienes instalado y no lo estás usando.

### El reel 5 es el efecto "web dinámica"

Midudev, texto literal: *"las animaciones que se pueden hacer con la biblioteca GSAP en pocas líneas de código. Por ejemplo, al estilo de la página de Apple donde hay una animación estilo vídeo mientras haces scroll. Para eso puedes usar el plugin de ScrollTrigger."*

**Verificado en tu `package.json`: no tienes GSAP, ni framer-motion, ni lottie.** Ninguna librería de animación. Hoy solo tienes React 18, Vite 7, TypeScript, Express 5, Supabase y axios.

Y ojo con los comentarios de ese mismo reel, porque son el contraargumento gratis:
- *"Ese efecto yo lo hago con framer + lottie encoded images, creo que es mejor que usar gsap"*
- *"Yo seguro intento eso en mi trabajo y de una me lo echan para atrás, que mal optimizado, que mucho peso"*

O sea: hay debate real de performance. Eso entra al prompt del rediseño como vector de ataque.

### El reel 2 responde tu pedido de scraping

**Firecrawl**. Un comentario dice: *"Es muy útil como tool en agentes de n8n. Lo he usado para escrapear páginas de e-commerce para buscar ofertas."* Encaja con tu Fase 7 de n8n.

### Tus guardados completos

Abrí `facebook.com/watch/saved/`. Solo devuelve **12 videos**, y de esos únicamente uno es técnico y nuevo:

> **"Claude design gratis sin quemar tu cuenta de Claude"** — Soy Enrique Rocha, hace 14 semanas.

Ese es el "Claude Design" que mencionaste. Los otros 11 son viejos y sin relación (Temu, una barbería, brownies, One Piece).

**Los 8 que me pasaste no aparecen en esa lista.** Sus URLs traen `ref=saved`, así que están guardados, pero en otra colección que esa vista no expone. Si quieres que barra la colección completa, dime dónde la ves tú en la interfaz y entro por ahí.

---

## PARTE 2 — La competencia real

### Carnívoros no usa WordPress. Usa Shopify.

Traje `carnivoros.mx` y la evidencia es dura: `meta-shopify-checkout-api-token`, `meta-shopify-digital-wallet`, imágenes bajo `cdn/shop/files/`, y "Tecnología de Shopify" en el pie.

Corrijo tu suposición porque cambia la estrategia: competirle a un Shopify con tema estándar es distinto a competirle a un WordPress.

**Lo que hacen:**

| | Carnívoros |
|---|---|
| Plataforma | Shopify, tema de catálogo estándar |
| Precios | **por pieza y por paquete, nunca por kilo** — Arrachera Select $339, Cowboy Select $355, T-Bone $349.50, Costilla de Cerdo $250 |
| Paquetes | por número de personas: Uno (10–12) $1,799 · Carnívoro (8–10) $1,599 · Dos (15–17) $2,599 · Tres (20–22) $3,249 |
| Pago | **solo PayPal** |
| Contacto | 444 328 00 21 (lada de SLP) |
| Categorías | Paquetes · Cortes (Estándar / Choice-Prime) · Complementos (Fríos / Extras) |
| Contenido | banner de noviembre 2021, sin actualizar |

**Sus huecos, que son tus diferenciadores:**

1. **Solo PayPal.** En México eso deja fuera a media ciudad. Tu bifurcación Efectivo/Tarjeta y `agente-pagokit` (Clip, Conekta, MercadoPago) atacan esto directo.
2. **No venden por peso ni por presupuesto.** Solo piezas y paquetes cerrados. Tu **pedido trifásico** (peso / precio / pieza) no lo tiene nadie de los que revisé. Es tu ventaja más fuerte y la más difícil de copiar.
3. **Cero fidelización.** Ningún programa de puntos ni niveles.
4. **Cero PWA.** Web de escritorio adaptada.
5. **Contenido congelado en 2021.**

**Lo que sí les vale copiar:** vender **paquetes por número de personas**. "Carne para 10-12 personas" es cómo la gente piensa una carne asada, no en kilos. Es una capa sobre tu modo por precio, no un reemplazo.

Otros del sector nacional, todos con el mismo patrón de precio por pieza o por kilo sin modo presupuesto: [CarnesM](https://carnesm.com.mx/), [Carnes San Francisco](https://www.carnessanfrancisco.com.mx/), [Carnes Premium XO](https://www.carnespremiumxo.com/), [La Cuchilla del Carnicero](https://carnicero.mx/) — este último ya estaba fichado en tu `competitor-scan.md`.

---

## PARTE 3 — Estado real del rediseño

Verificado, no supuesto:

- **39 archivos SCSS** en arquitectura 7-1 completa: abstracts, base, components, layout, pages, themes, vendors
- **9 entrypoints HTML**: index, products, accessweb, dashboar, admin-products, admin-customers, admin-orders, offline, ebac-react
- `_bento-main.scss` existe, con el mapa `category-card-1..9`
- Paleta confirmada en `_variables.scss`: `$carni-red #DC2626`, `$carni-gold #F59E0B`
- **Sin librería de animación.** Ni GSAP, ni framer-motion, ni lottie

O sea: la estructura está completa y sana. Lo que falta es la capa de movimiento y el criterio de diseño. No estás empezando de cero.

---

# PARTE 4 — Los 6 prompts

Cada uno se corre **por separado**, en su propia sesión de Code. Uno por vez.

---

## PROMPT 1 — Afiliados y backend seguro

```
Usa la skill abogado-del-diablo contra esta tesis:

"Un cliente de Carni-mvp puede referir a otro cliente y cobrar una recompensa,
sin que exista una forma rentable de defraudar el sistema."

CONTEXTO VERIFICADO — no asumas nada fuera de esto:
Repo ~/Desktop/Carni-mvp. Schema en supabase/migrations/202604100001_initial_schema.sql
7 tablas: profiles, categories, products, orders, order_items, favorites, promotions.
  profiles: id UUID (=auth.uid), full_name, phone TEXT CHECK(char_length=10),
            address JSONB, role ∈ {customer, admin}, points INTEGER
  orders.status ∈ {pending, confirmed, preparing, ready, delivered, cancelled}
Funciones: handle_new_user(), protect_profile_system_fields(), create_order_with_items(),
  cancel_order(), apply_promotion(), add_points(), update_order_status(), 3 RPC de favoritos.
RLS por tabla con helpers get_user_role() e is_admin().

NO EXISTE: affiliates, referrals, tips_ledger, tier_settings, track_score,
server/routes/affiliate.ts. El único route existente es server/routes/buildads.ts.

Alcance propuesto en docs/blueprints/module-scopes.md sección "Affiliate program":
  affiliates (profile_id, referral_code UNIQUE, status, total_referred, total_rewarded)
  referrals  (referrer_id, referred_profile_id, first_order_id,
              reward_status ∈ {pending, granted, void}, created_at)

Negocio: carnicería familiar real en San Luis Potosí. La recompensa sale del
bolsillo del dueño. Márgenes de carnicería, no de software.

RESTRICCIONES: React 18 + Vite 7 + TypeScript + Express 5 + SCSS 7-1.
Sin Next.js, sin Tailwind, sin rutas nuevas de página.
Supabase MCP está en read_only: no ejecutes escrituras.

ATACA:
1. La premisa — ¿resuelve un problema real de ESTA carnicería o se copia porque
   otros lo tienen?
2. El fraude — cuenta falsa, auto-referido con segundo teléfono, farmeo de primeras
   compras mínimas, colusión entre dos clientes, referido que cancela después de
   otorgada la recompensa. El CHECK de 10 dígitos en profiles.phone, ¿alcanza como
   identidad única en México donde un chip prepago cuesta 50 pesos?
3. La dependencia — qué no puede existir sin Track Score, sin orders escribiendo
   de verdad, o sin medio de pago cerrado.
4. El trigger protect_profile_system_fields() — si la recompensa escribe en
   profiles, ¿lo bloquea?
5. El mantenimiento — quién vigila el fraude mientras el dueño corta carne, y cómo
   se revoca una recompensa ya pagada.
6. La economía — ¿de dónde sale la recompensa y en qué punto pierde dinero?

REGLAS: no propongas soluciones, solo objeciones. No escribas código. No toques
archivos. Ordena de más letal a menos. Marca lo especulativo como especulativo.
Al final, di qué no pudiste evaluar.
```

---

## PROMPT 2 — Rediseño

```
Usa la skill abogado-del-diablo contra esta tesis:

"Carni-mvp puede alcanzar un nivel visual de lujo — animaciones al scroll estilo
Apple y video de fondo en landing y login — cubriendo sus 9 entrypoints HTML,
sin abandonar SCSS 7-1, sin agregar framework, y sin degradar el rendimiento en
un celular de gama media con red 4G en San Luis Potosí."

CONTEXTO VERIFICADO:
39 archivos SCSS en 7-1 (abstracts, base, components, layout, pages, themes, vendors).
9 entrypoints: index, products, accessweb, dashboar, admin-products, admin-customers,
  admin-orders, offline, ebac-react.
_bento-main.scss tiene el mapa category-card-1..9 (intencional, no reinventar).
Paleta bloqueada en css/abstracts/_variables.scss:
  $carni-red #DC2626, $carni-gold #F59E0B, $carni-green #059669,
  $carni-beige #E4D1B0, $carni-brown #363432
  superficies oscuras: #050505, #111111, #181818
Breakpoints existentes: 576, 768, 870 (auth), 992, 1200.
Objetivos de aceptación: 320 / 768 / 1024.

package.json HOY: React 18.3, Vite 7.1, TypeScript 6, Express 5, Supabase, axios.
NO hay GSAP, ni framer-motion, ni lottie. Ninguna librería de animación.

Blueprint vigente: docs/blueprints/web-redesign.md — ebac-react.html y offline.html
están FUERA del alcance del rediseño.

Referencias que quiero incorporar (de tutoriales reales, no inventadas):
 - GSAP + ScrollTrigger para animación tipo video al hacer scroll (estilo Apple)
 - Video animado de fondo generado con Higgsfield para landing, login y registro
 - Componentes de animación de 21st.dev
 - La skill ui-ux-pro-max, que ya tengo instalada, para criterio de diseño

Contraargumentos reales que ya recogí de los comentarios de esos tutoriales:
 - "mejor framer + lottie encoded images que GSAP"
 - "mal optimizado, mucho peso, en el trabajo me lo echan para atrás"

Es una PWA con service worker. Los clientes son de carnicería, no de tecnología.

ATACA:
1. El peso — GSAP + ScrollTrigger + video de fondo en una PWA: ¿cuánto cuesta en
   First Contentful Paint y en datos móviles? ¿Un cliente en 4G va a esperar?
2. La contradicción con "sin framework" — agregar GSAP, ¿es una librería o es
   framework encubierto? ¿Dónde está la línea?
3. El service worker — video de fondo pesado y cacheo offline, ¿conviven?
4. La accesibilidad — animación al scroll y prefers-reduced-motion. ¿Y usuarios
   con mareo por movimiento?
5. El alcance — ¿9 entrypoints con este nivel es realista para una persona, o vamos
   a terminar con 2 páginas de lujo y 7 abandonadas?
6. La premisa de negocio — ¿el cliente de carnicería compra más por una web de lujo,
   o compra por precio, frescura y que llegue rápido? ¿Estamos optimizando lo que
   importa?
7. Higgsfield y 21st.dev son servicios externos — dependencia, costo y qué pasa el
   día que cambien de precio o cierren.

REGLAS: no propongas soluciones. No escribas código. No instales nada. Ordena de
más letal a menos. Di qué no pudiste evaluar.
```

---

## PROMPT 3 — Práctica 1 de React

**Ojo**: esta corrida NO es para objetar la consigna de EBAC — está aprobada 100/100 y no se reentrega. Es para decidir qué debe ser esa práctica dentro de tu proyecto real.

```
Usa la skill abogado-del-diablo contra esta tesis:

"La Práctica 1 de React de EBAC puede reescribirse como un módulo de inventario
con componentes de CLASE que sirva de verdad dentro de Carni-mvp, en vez de
quedarse como ejercicio académico desechable."

CONTEXTO VERIFICADO:
La consigna original del M27 pedía una "Biblioteca Musical": Header.js y Song.js
como componentes de clase, props, mínimo 3 instancias en App, estilos en App.css,
y componentDidMount imprimiendo en consola.

Ya está ENTREGADA Y APROBADA con 100/100. El tutor Salvador P. Cruzaley no dejó
observaciones. NO se puede ni se necesita reentregar. Esta corrida es sobre qué
conviene que sea ese código dentro del proyecto real, no sobre la nota.

Lo que existe hoy en el repo (verificado con git ls-tree sobre el commit 217cacd1):
  practicas/react/practica-01/InventoryApp.js  — class InventoryApp extends React.Component
                                                  state con 3 productos de Carni,
                                                  componentDidMount con console.log,
                                                  render con React.createElement
  practicas/react/practica-01/components/InventoryHeader.js
  practicas/react/practica-01/components/ProductCard.js
  practicas/react/practica-01/styles.css, index.html, main.jsx

Además, suelto en src/components/ hay un Song.js del dominio musical genérico que
contradice el texto que le entregué al tutor (ese texto menciona OrderLineItem.js,
archivo que NUNCA existió en ninguna rama).

Stack real: React 18 + Vite 7 + TypeScript + Express 5 + SCSS 7-1.
Schema real: products (id, category_id, name, price_per_kg, price_per_lb, stock,
is_active, metadata JSONB), 14 productos en supabase/seed.sql.

TENSIÓN A RESOLVER: los componentes de clase son un requisito académico de EBAC.
El resto del proyecto usa componentes funcionales con hooks y TypeScript.

ATACA:
1. ¿Tiene sentido mantener código de CLASE en un proyecto que va a producción con
   hooks, o es deuda técnica desde el minuto cero?
2. Si la práctica ya está aprobada, ¿reescribirla es aprendizaje o es procrastinar
   el trabajo real del MVP?
3. ¿Vale más borrar Song.js y aceptar la incoherencia con el texto ya entregado, o
   dejarlo como está y no tocar lo que el tutor ya calificó?
4. Un módulo de inventario que solo se ve en ebac-react.html y no se usa en
   producción, ¿es útil o es un tercer artefacto huérfano sumado a los que ya hay?
5. ¿Cuál es el costo real de mantener practicas/react/ separado de src/ para
   siempre?

REGLAS: no propongas soluciones. No escribas código. No toques archivos.
Di qué no pudiste evaluar.
```

---

## PROMPT 4 — Práctica 2 de React

```
Usa la skill abogado-del-diablo contra esta tesis:

"La Práctica 2 de React puede cumplir los 8 requisitos literales de la consigna
6.28.9 de EBAC y al mismo tiempo ser un prototipo real del gestor de inventario
de Carni-mvp, sin que ninguno de los dos objetivos degrade al otro."

CONSIGNA LITERAL 6.28.9 (leída del LMS, es lo que el tutor va a verificar):
1. Refactorizar Header y Song de clase a funcionales, conservando props
2. Componente SearchResults que reciba un array por props, iterado con map
3. key única por elemento
4. Componente Library que también reciba un array por props, con map
5. useState en App para DOS estados: resultados de búsqueda, y biblioteca
   (inicialmente VACÍA)
6. Botón "Agregar a mi biblioteca" en cada elemento, que actualice el estado
7. useEffect en App que imprima en consola CADA VEZ que la biblioteca se actualice
8. Un styles.css EN CADA CARPETA DE COMPONENTE (no uno global)

Entrega: repo GitHub sin node_modules, link en la plataforma. Mínimo 70 para
aprobar. 3 intentos. Califica un tutor humano en un día hábil.

ESTADO REAL DEL CÓDIGO (leído de practicas/react/practica-02/ en el commit 217cacd1):
  InventoryApp.jsx — useState para products (14 del seed real) y flashOffers (Set
    vacío al inicio); useEffect que loguea; handleAddProduct con spread inmutable;
    handleToggleFlash con Set; lazy init desde localStorage
  components/InventoryHeader.jsx — funcional, recibe props ✅
  components/ProductCard.jsx — funcional, recibe props, botón toggle ✅
  components/AddProductForm.jsx — formulario, NO pedido por la consigna
  types/carni.js — SEED_PRODUCTS con los 14 product_id reales del seed
  styles.css — UNO SOLO en la raíz de practica-02

HUECOS QUE YA DETECTÉ contra la consigna:
  - el .map() está INLINE dentro de InventoryApp.jsx, no en un componente hijo
    que reciba el array por props (incumple 2 y 4)
  - no hay segundo componente de lista; flashOffers se renderiza inline (incumple 4)
  - hay un solo styles.css, no uno por carpeta (incumple 8)
  - el useEffect está envuelto en if (flashOffers.size > 0), así que NO imprime
    cuando la lista se vacía (cumple 7 a medias)
  - flashOffers es un Set, la consigna habla de arrays

RESTRICCIÓN DURA: la consigna exige styles.css PLANO por carpeta. El sitio real
corre SCSS 7-1. Meter el pipeline de SCSS en la práctica la reprueba.

ATACA:
1. ¿Los dos objetivos son de verdad compatibles, o cumplir la consigna al pie de
   la letra va a producir código que no sirve para producción?
2. localStorage y AddProductForm no los pide la consigna. ¿Suman valor real o son
   ruido que distrae al tutor de lo que sí debe encontrar?
3. Un tutor humano abre el repo y ve practicas/react/practica-01, practica-02,
   src/components/Song.js suelto, ProductCard.tsx y BentoGrid.tsx. ¿Qué concluye?
   ¿Ese desorden cuesta puntos?
4. ¿Duplicar la paleta como hex planos en cada styles.css crea una segunda fuente
   de verdad que va a divergir de _variables.scss?
5. El Set en vez de array — ¿lo defiendo como decisión técnica correcta o lo cambio
   para no discutir con el evaluador?
6. ¿Vale la pena que esta práctica sea "prototipo real" cuando su destino es
   ebac-react.html, que está fuera del alcance del rediseño?

REGLAS: no propongas soluciones. No escribas código. No toques archivos.
Di qué no pudiste evaluar.
```

---

## PROMPT 5 — BuildAds

```
Usa la skill abogado-del-diablo contra esta tesis:

"Un agente puede vigilar el stock real de Carni-mvp y proponer campañas
publicitarias, sin publicar nada ni gastar un peso sin autorización humana
explícita, y sin comprometer legalmente a la carnicería."

CONTEXTO VERIFICADO:
Existe el scaffold src/modules/buildads/BuildAdsOrchestrator.tsx y
server/routes/buildads.ts (único route del proyecto).
NO existe la tabla campaign_proposals.
products tiene: stock INTEGER, is_active, price_per_kg, price_per_lb, metadata JSONB.
promotions tiene: code, discount_percent, min_purchase, valid_from/until.

Diseño propuesto en docs/brain/vision.md:
  Wizard de 6 pasos: plataforma y objetivo (IG/WhatsApp/TikTok/Google/Web) →
  config (geo, presupuesto $4/$10/$20 USD, idioma) → loading → preview de
  estrategia → elección de creativo → generar y lanzar con botón Authorize.
  APIs: Groq (copy), Predis.ai (creativos), ElevenLabs (voz "Don Carlos").
  Predis y ElevenLabs son PLACEHOLDERS, sin llave de producción.
  Loop HITL: agente detecta exceso de stock → propone → admin revisa →
  un clic autoriza → escribe en promotions Y publica a Meta/TikTok/WhatsApp.
  "ADN de Marca": extrae identidad analizando feeds sociales, muestras de audio
  y texto descriptivo.

Negocio: carnicería familiar en San Luis Potosí. Presupuesto publicitario real,
chico. El dueño no es publicista.

Competencia verificada hoy: Carnívoros (carnivoros.mx) corre en Shopify con tema
estándar, precios por pieza y paquete, solo PayPal, y su banner es de 2021.

ATACA:
1. Stock mal capturado — si el inventario está desactualizado y el agente
   promociona lo que no hay, ¿quién responde ante el cliente que ya pagó?
2. El botón Authorize — ¿un clic es autorización informada, o el dueño va a
   aprobar sin leer después de la tercera propuesta? ¿Eso sigue siendo HITL?
3. Reversibilidad — una campaña ya publicada en Meta, ¿cómo se retira? ¿El dinero
   gastado se recupera?
4. "ADN de Marca" analizando feeds sociales — ¿de quién es ese contenido?
   ¿Hay riesgo de derechos de autor o de datos personales de terceros?
5. Políticas de plataforma — si el copy generado por Groq incumple políticas de
   Meta y suspenden la cuenta del negocio, ¿qué se pierde?
6. Voz sintética "Don Carlos" — ¿es una persona real? Si sí, ¿hay consentimiento?
   Si no, ¿decirle a los clientes que hablan con alguien que no existe es honesto?
7. Predis y ElevenLabs sin llaves de producción — ¿el módulo es viable hoy o es
   una promesa que depende de contratos que no existen?
8. Economía — con presupuesto de $4 a $20 USD, ¿la campaña mueve la aguja o es
   ruido caro?

REGLAS: no propongas soluciones. No escribas código. No toques archivos.
No conectes ninguna API. Ordena de más letal a menos.
```

---

## PROMPT 6 — ProductAds

```
Usa la skill abogado-del-diablo contra esta tesis:

"Carni-mvp puede generar automáticamente video publicitario de sus propios
productos — a partir de fotos reales del inventario — con calidad suficiente para
publicarse, sin intervención de un editor humano."

CONTEXTO VERIFICADO:
Skills instaladas que tocan esto:
  hyperframes — renderiza HTML/CSS/animaciones a MP4 con headless Chrome + FFmpeg
  claude-banana — ingeniería de prompts de imagen
  open-design — plataforma de diseño con IA
Marcadas Missing en docs/tooling/triage.md:
  Hainrixz/editor-pro-max, jordanrendric/claude-video-vision, Hainrixz/claude-ads

products.image_url existe. NO verifiqué si las 14 imágenes del seed existen ni
qué calidad tienen.

Roadmap fase 8: crear la skill productads-autonomo con skill-creator.

Referencia real de un tutorial: Higgsfield genera video animado de fondo a partir
de una foto de producto. Se usa para que "una web se sienta cara".

Negocio: carnicería. El producto es carne cruda. Una foto mala de carne no se ve
poco atractiva: se ve desagradable, y eso espanta clientes.

ATACA:
1. La materia prima — si las fotos de producto son de celular con mala luz,
   ¿qué puede salvar la IA? ¿No estamos automatizando la producción de basura
   a escala?
2. Carne cruda y uncanny valley — video generado por IA de comida cruda,
   ¿apetitoso o repulsivo? ¿Hay evidencia de que funcione en este rubro?
3. Publicidad engañosa — si el video muestra un corte que no coincide con lo que
   se entrega, ¿qué exposición legal hay ante PROFECO?
4. "Sin intervención humana" — ¿es una meta razonable o es donde se rompe todo?
   ¿Cuál sería el punto mínimo de revisión humana?
5. Costo real — render de video, llamadas a API, almacenamiento. ¿Cuánto cuesta
   por pieza de contenido y cuántas se necesitan al mes para mover ventas?
6. Alternativa aburrida — un celular moderno, luz de ventana y 20 minutos a la
   semana, ¿le gana a todo el pipeline automático? Compara honestamente.
7. Dependencia — hyperframes necesita headless Chrome y FFmpeg. ¿Dónde corre eso
   en producción y quién lo mantiene?

REGLAS: no propongas soluciones. No escribas código. No generes ningún video.
Ordena de más letal a menos. Di qué no pudiste evaluar.
```

---

## Orden de corridas

```
1. Afiliados    ← empieza aquí; es la prueba de la herramienta
2. Rediseño     ← el que más te va a doler, y el que más te ahorra
3. BuildAds
4. ProductAds
5. Práctica 2
6. Práctica 1
```

Las dos prácticas van al final a propósito: son las de menor riesgo económico y las que ya tienen respuesta casi decidida.

Después de cada corrida, clasifica en tres cubetas —**mata la idea / cambia el alcance / ruido**— y reescribe la tesis con lo que sobrevivió. Si queda más chica, funcionó.

---

## Lo que no verifiqué

- **No vi ninguno de los 8 videos.** Leí el texto de los posts, autores y comentarios. Lo que reporto es lo escrito, no lo mostrado en pantalla.
- **No leí `SKILL.md` de `abogado-del-diablo`** — fuera de las carpetas conectadas. Si su contrato pide otro formato, ese archivo manda sobre estos prompts.
- **La vista `/watch/saved/` solo devolvió 12 videos**, y los 8 que me pasaste no están ahí. Hay otra colección que no encontré.
- **No probé Firecrawl, 21st.dev, Higgsfield ni GSAP.** Solo leí de qué van.
- **No verifiqué si existen las imágenes de los 14 productos del seed** ni su calidad.
- **No corrí nada**: ni build, ni tests, ni capturas, ni migraciones, ni Lighthouse.
- **Precios de Carnívoros leídos hoy** de su portada; no revisé fichas de producto una por una.
```

Sources:
- [Carnívoros](https://www.carnivoros.mx/)
- [CarnesM](https://carnesm.com.mx/)
- [Carnes San Francisco](https://www.carnessanfrancisco.com.mx/)
- [Carnes Premium XO](https://www.carnespremiumxo.com/)
- [La Cuchilla del Carnicero](https://carnicero.mx/)
- [Carnívoros en Facebook (SLP)](https://www.facebook.com/carnivorosmx/?locale=es_LA)
