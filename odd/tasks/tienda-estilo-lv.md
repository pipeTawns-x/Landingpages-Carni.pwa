# Tienda estilo LV: header, hero de video, bento, venta por pieza y seguridad

Objetivo: entregar landing, comercio, acceso y panel de la tienda Django funcionando y con buen diseño, sobre una sola base de datos y con la seguridad al día. Rama `backend`, sin push. Pruebas con el test runner de Django (`config.settings_test`).
Entrega: `ask-on-risk`; commits por unidad de trabajo.

## Specs
- S1 Fallos de la revisión: el zoom del video no se queda trabado ("el video se tiene que ver completo"), y Descuentos responde 404, no 500, ante un id que no es número.
- S2 Header como Louis Vuitton: "menú, lupa, título en medio… del otro lado contactos, un corazoncito y el icono de usuario". Lleva "el efecto del header" sobre el video (transparente arriba y sólido al bajar). "La lupa igual, ya sabes cómo se despliega" (panel con buscador y productos). El contacto se despliega desde el header "donde ahí está todo el contacto", y la sección de contacto del pie se queda.
- S3 Hero: "Se tiene que ver un video así… botones de play y pausa" ("música ahorita no"). "Se ve responsivo, respeta una sección de la web, la sección que te recibe." Se ve completo, sin zoom.
- S4 Bento: "un Bento Grid que en verdad sea un Bento Grid… donde una imagen es diferente al tamaño de otra imagen".
- S5 Sección familia: se conserva el fondo "como azulejo de una pared con estrellitas así black, negro… resaltando la descripción".
- S6 Venta por pieza: "que eso se haga desde el panel administrativo cuando se configuren o se agreguen los productos… también se puede pedir por pieza… y todavía le configuras el grosor". "No asumas": ningún peso por pieza se carga solo.
- S7 Carrito trifásico según el CodePen (dinero, peso, piezas y grosor), mejorado e integrado.
- S7b Configuración del producto según el CodePen (Engram #541, `carni/carrito/spec-codepen`):
  - toda la tarjeta abre la configuración, con precio por kg y por lb y la leyenda "Haz clic para personalizar tu pedido";
  - modo peso, precio o piezas; unidad kg, g o lb;
  - grosor de 0.5" a 3" en pasos de 0.25", 1.25" por defecto y el número visible;
  - `observaciones` en texto libre, que viajan con la línea hasta el panel;
  - resumen y subtotal en vivo;
  - "Agregar" nunca mete 1 kg a ciegas.
- S7c Carrito en dos versiones: "el header menú donde el cliente… pueda acceder a este carrito desde la web y no tenga que moverse… quitar, eliminar, verificar", y la página del carrito, donde se paga. El cajón no bloquea el scroll en escritorio ni en tablet.
- S7d "la lupa, todo lo que tiene que ver, igual la misma que tienes en la landing page tiene que estar en Web Products y en el Access Web": el mismo header en todas las páginas.
- S8 Mascota Don Carlos (imágenes sin fondo del chato) en la página de acceso de Django.
- S9 Seguridad: "alineada con las medidas de seguridad OWASP 2026", y "que sea un poco más complicado para la IA, que la rompa".
- Fuera de alcance por ahora: el inicio de sesión del cliente común (solo diseño), y además,, dicho por Eduardo: pickup y delivery, las webs plus, BuildAds y ProductAds (página de desarrollo), la música y el video nuevo.

## Tasks
- T1 S1: arreglos de la revisión. Ruta: inline. Hecho: 5c10f9b9 (descuentos 404), 52bfeb5f (prueba de clases de la tienda).
- T2 S2: header, lupa, contacto y favoritos. Ruta: inline (W1 se detuvo sin dejar archivos). Hecho: 0b1837b1.
- T3 S3: hero con play y pausa, sin zoom. Ruta: inline. Hecho: 0b1837b1.
- T4 S4 y S5: bento y fondo de azulejo. Ruta: inline. Hecho: f18c42e7 (bento), 52bfeb5f (azulejo).
- T5 S6 y S7: venta por pieza y grosor desde el panel; carrito. Ruta: inline. Hecho: 0b1837b1 (configuración y cajón), 88a63ed2 (interruptor del panel).
- T6 S8: mascota en acceso. Ruta: inline. Hecho: 52bfeb5f.
- T7 S9: auditoría y arreglos. Ruta: inline. Hecho: 62ebd9d6 (CSP, HSTS…), f55ec9f3 (RLS de pedidos, sin aplicar al remoto). Pendientes: MFA aal, throttle de /admin/, Turnstile, chat_messages.
- T8: carpeta views/. Ruta: inline. Hecho: eea1d2a0.

## Log
L1 (Eduardo, 2026-11-18, literal):

Sí, arréglalo. El video, ¿te acuerdas de la Luby? Se tiene que ver un video así. Botones de música, botones, bueno, música ahorita no, pero botones de play y pausa. Así como en el Louis Vuitton. Y esta tiene que abarcar no toda la web. Mira, basta con ir a la LB, la página que te he dado muchas veces de referencia. Una por la lupa, el header, cosa que creo que el header sí no lo has compuesto. El efecto del header. Y el video, ¿cómo se ve? Se ve responsivo, respeta una sección de la web, la sección que te recibe. ¿Mm? Mira, se tiene que ver algo así. Igual, chécale.


Te digo, debiste haber revisado todo lo que teníamos antes, porque si revisaste bien, viste que ya teníamos el efecto del header, que ya teníamos un... Bueno, no el tamaño perfecto, pero ya teníamos un tamañito. Igual con el zoom, o sea, el video se tiene que ver completo. Veo que no se generó un video nuevo con la historia que ya te había dado. Bueno, con un nuevo video con la perspectiva que ya te había dado. No hay problema. Igual porque cuando te dije que lo que habíamos hecho antes estaba mal y que lo eliminaras, pues ahí se fue. Y la sección de pruebas, preguntas, bueno, la sección que te decía yo de la web, si me gustaba, no era tal cual como tú la hiciste. Pero por ahí va, o sea, hay mejoras, muchas mejoras. Igual el Bento Grid, un Bento Grid lo quiero bien hecho, un Bento Grid que en verdad sea un Bento Grid. No, nada más quiero imágenes, una imagen grandota y las otras igual del mismo tamaño. No, un Bento Grid donde una imagen es diferente al tamaño de otra imagen, así. Bueno. Más déjame, te tomo captura para ver. Aquí en la sección de carnicería y familia, ese fondito que le das le da un detalle muy bueno. Sí se ve, sí. Un fondito como de Moisés, como de una, sí, Moisés, como azulejo de una pared con estrellitas así black, negro, así, resaltando imagen, resaltando la descripción. Igual un diseño así, ahí sí me gustó, ese es un buen acierto. Pues, la web LB, como se ve con sus botones, con su... Ya has visto la web LB. Ahorita nada más te mando capturas. Igual en el tema de la lupa, en el de contactos, este nuevo que te acabo de decir es un, aparte de nuestra sección en el footer de contactos, bueno, Louis Vuitton la implementa de manera en la que tú puedes desde el header acceder al contacto sin que se baje. Cómo se despliega un header menú, donde ahí está todo el contacto, se puede hacer para tener contactos al principio y que no tengas que recorrer toda la web. Y ya en dado caso que el cliente recorra toda la web, también encuentre la sección de contactos hacia abajo. O también, porque pues qué chiste, ¿no? Si el header se va a mantener durante toda la web, nada más con el efecto de que se cambian, bueno, con el efecto que se... No, sí, es el header se... No, pues sí. La sección de contactos del footer pasaría a ser una de contactos, pero en el header, al igual que en Louis Vuitton, desplegando así un header menú donde vengan todos los contactos. Igual te mando menús, te mando capturas. Ya en otras capturas has visto, en el header menú tiene menú, lupa, título en medio, bueno, Louis Vuitton en medio, y del otro lado contactos, un corazoncito y el icono. Y el icono de usuario. Así va a ser nuestra web en torno al Louis Vuitton. Igual, menú, lupa y el título de la carnicería, Señora de la Misericordia. Después contactos, un corazoncito y la de la register, bueno, la access web ahí en forma de icono SVG de un usuario, pues. La lupa igual, ya sabes cómo se despliega. En la sección de la web products, ahí tenemos una sección de productos de configuración. Tú me la eliminaste y dentro de la web products ahí tengo lo que configurar. Para empezar, no, porque por ejemplo estuve viendo que los cortes premium no puedes cogerlos por pieza. Vaya. Recuerda el ejercicio de CodePen. Esto es esencial para que tú puedas entregar un buen carrito trifásico. No asumas que... no asumas nada de eso. El carrito trifásico mantiene la lógica nada más. Después se configura. Ok, ¿cómo vas a configurar que en este caso mi hermana pueda activar la opción de escoger por pieza en los productos? Bueno, que eso se haga desde el panel administrativo cuando se configuren o se agreguen los productos. A este producto, al bisterres, también se puede pedir por pieza. El ribeye, también por pieza. Y todavía le configuras el grosor. Porque si recordamos el CodePen, vuelvo y reitero, el CodePen, ahí tienes la idea del carrito trifásico. Ahí tienes la idea de... no mejorado, tal vez con sus errores, pero es esto, lo que tenemos que hacer es mejorarlo e integrarlo. Carrito trifásico, en el CodePen también tienes lo de pickup y delivery, así que obviamente eso, igual que el ¿cómo se llama? El Product Ads y el Build Ads, espérate, eso también una página de próximamente, desarrollo, pues basta. Pero pues sí, nada más para que tomes en cuenta, recuerda el CodePen, recuerda tu contexto, lo que hemos hecho antes, todo eso, y entregar la web completa, bueno, las funcionalidades completas que te pedí que hicieras: landing page, commerce, access web y dashboard HTML, todas con un buen diseño, todas funcionales, todas compartiendo una misma base de datos, seguridad al 100%, que sea bastante segura, esté alineada con las medidas de seguridad OSWAP 2026 y todas las medidas más recientes para evitar, hay muchos fallos ahorita recientes que han pasado. Igual si puedes hacer que está mal, la web sea, lo que he visto que la IA está tomando y arrasando un chorro de cosas, ya sé que una web en la cual sea un poco más complicado para la IA, que es la rompa. Y bueno, en su momento lo vamos a probar, como ya sea contigo o con Chato, a ver quién de los dos puede romper, pero ahorita no, ahorita basta con ir desarrollando el proyecto, pero toma en cuenta eso. ¿Para qué? Para que subas tu nivel de los agentes, que los agentes de seguridad suban su nivel, suban el nivel de trabajo y pues generen un buen trabajo. Arregla fallos, arregla todo lo que tengas que arreglar, entrega la funcionalidad completa. Ya sabes lo que tienes que hacer, cómo lo tienes que hacer, hazlo, vuelvo y reitero, no me tienes que andar preguntando, a menos que en verdad sea una duda, no tienes que pidiendo autorización cuando ya te digo, haz esto, ¿estás seguro que quieres que...? No, chingada madre, no. En cambio, es otra cosa si me dices, haz esto, ¿te refieres a que haga...? Ahí sí. Pero, cana, creo que no soy tan... Te digo, yo te hablo así, ok, pero acuérdate del metaprompting. Todo lo que recibes lo tienes que convertir en un buen prompt. Todo lo que recibes. Ok, Felipe ahora me está pidiendo esto. Lo convierto en un prompt para generar la funcionalidad completa de lo que necesito. ¿Qué es la funcionalidad completa? Ya sabes, web commerce, landing page, access web y dashboard. Las webs plus, ahorita no, eso va igual que el pickup, delivery, te digo, todo eso. Venga.

L2 (Eduardo, mismo día): "Ey, el chato ya se quedó, se pausó. Así que, bueno, entrego unas imágenes sin fondos. Así que, pues, basta que las uses."

L3 (Eduardo): carrito en dos versiones (cajón desde el header y página de pago); los mismos componentes en productos y acceso; "la entrada del LMS… y la mejora del diseño. Eso es prioridad"; el ingreso de usuario común solo en diseño.
L4 (Eduardo): "Para investigar CodePen ya lo tienes… en Engram". Spec en #541.
L5: reparto. Escritores en paralelo con superficies separadas: W1 header y cajones; W2 configuración del producto y carrito; W3 panel por pieza. El padre se queda con hero, bento, familia, mascota, tienda.css, git y seguridad.
L6 (Eduardo, 2026-11-18): "Sí, sigue así y entrega todo funcionando" — panel e inventario siguen como dos apps dentro de /panel/.
L7: evidencia. Django 974 pruebas OK; SQL 784 pruebas, 0 fallas (reversa idéntica); ruff limpio; gitleaks sin hallazgos en 7 commits. Navegador: búsqueda en vivo con datos reales, cotización real (0.5 kg = $144.50; 3 piezas de 1.25" = $104.04), observación llega a la línea, el cajón del carrito deja desplazar la página, 375 px sin desbordes.
L8: decisión pendiente de Eduardo: 24 productos tienen "pieces" en sale_modes por los pesos que cargó load_piece_weights (supuestos). No se tocaron los datos reales.

L9 (Eduardo, 2026-11-18): "Sí, córrelos" — run the mandatory kit resources that were missing.
L10: evidence of that run.
- Security review (security-guardian): no high-severity finding. Fixed in 2abcf728:
  - the https redirect is on only behind the proxy, and asking for it without the proxy fails the start;
  - /buscar/ is throttled to 120/min;
  - cotizar checks its limit before any lookup and is never cached; buscar may be cached privately for 30 s;
  - the headers wrap every response, 413 and static files included;
  - orders and order_items are read-only for anon/authenticated (REVOKE ALL + GRANT SELECT).
- Supply chain: uv.lock has 16 packages and 0 advisories; the vendored GSAP 3.13.0 is byte-identical to the npm build. Fixes for Eduardo to run (Node side only, not Django): proxy-addr 2.0.7 (CRITICAL), axios 1.15.0 (14 HIGH), @playwright/mcp@latest.
- Design review (hallmark, ui-ux-pro-max, design-taste, emil, apple, awwwards, referencias-diseno, postmortem, #1022). Fixed in 4973b46b:
  - payment page with a sticky summary;
  - .campo with the control border;
  - red-text for words;
  - drawers close in 260 ms and open in 420 ms, Esc closes the cart, the menu and search lock the page;
  - thickness marks and aria-valuetext;
  - the price shows as busy while it loads;
  - an empty search says so;
  - the bento description is revealed on hover (postmortem E6).
- Kept on purpose: the card caption (spec #541), the logo, the italics of the strip and the eyebrows (identity Eduardo approved).
- Study (Big School pp. 9 and 15-16, roadmap.sh api-design/backend/cyber-security/software-design-architecture, ODD and skills transcripts, refactoring-guru). Its gaps were covered by the same commits: tests for 429/503/400, layers (ventas/throttle.py and cart.public_lines no longer import from the views), Cache-Control.
- Diagram: docs/diagramas/tienda-estilo-lv.md.
- Totals: Django 988 tests OK; SQL 796 tests, 0 failures; ruff clean; gitleaks clean.
