# Mensaje de entrega — Práctica React II (actividad 6.28.9)

Lección: https://lms.ebac.mx/lesson/e9a4e096-e5c8-4eb5-9d54-873937ace0b9

---

Hola, buen día.

Entrego la práctica implementada dentro de mi proyecto Carni-mvp, la tienda en línea de una carnicería en San Luis Potosí.

**Sobre la adaptación del dominio**

En la Práctica 1 entregué el ejercicio académico de la biblioteca musical. Cumplió y me sirvió para entender los conceptos, pero quedó como un ejercicio aislado, sin conexión con el proyecto. Para esta entrega decidí que la práctica no fuera un ejercicio aparte, sino la migración real del catálogo de mi sitio a React. Retiré la biblioteca musical del proyecto y apliqué el mismo patrón al negocio: la lista de resultados es el catálogo de cortes y la biblioteca del usuario es el pedido del cliente.

Los requisitos técnicos se cumplen íntegros. Lo que cambió es el dominio, no la técnica.

**Cómo se cumple cada punto**

1. Componentes funcionales conservando props — ProductList, OrderList, CartPanel y ProductCard
2. Componente que recibe un arreglo por props y lo recorre con map — src/components/ProductList/ProductList.tsx
3. Key única por elemento — key={product.id}, con los identificadores reales del catálogo
4. Segundo componente de lista, también con arreglo por props — src/components/OrderList/OrderList.tsx, con key={line.lineId}
5. Dos useState, uno vacío al inicio — products y order en src/entry/products.tsx
6. Botón que actualiza el segundo estado — "Agregar al pedido", con actualización inmutable: setOrder(current => [...current, nuevaLinea])
7. useEffect que registra cada cambio de la lista — sin condicional, por lo que también se dispara cuando el pedido queda vacío
8. Hoja de estilos por carpeta de componente — styles.scss dentro de cada carpeta

**Una aclaración sobre el punto 5**

El estado del pedido arranca vacío en un cliente nuevo, como pide la consigna. Si el cliente ya había armado un pedido en otra página del sitio, ese pedido se hidrata desde el almacenamiento compartido al montar el componente. Lo implementé así porque montar vacío y escribir de inmediato borraba el carrito del cliente. Fue la primera lección de la migración: el estado tiene consecuencias cuando el dato lo comparten varias partes del sitio.

Trabajar con datos reales sacó a la luz defectos que un ejercicio aislado nunca habría mostrado. Una línea de mercancía se facturaba como "1 kg" porque la unidad de venta estaba fija; los identificadores en texto se convertían en NaN y borraban el pedido al recargar; y las líneas vendidas por pieza se cobraban en cero. Los tres quedaron corregidos y documentados en los commits.

**Enlaces para revisión**

Pull Request (rama practicas-ebac hacia main):
https://github.com/pipeTawns-x/Landingpages-Carni.pwa/pull/5

Commits:

1. Migración del catálogo y el carrito a componentes React con hooks
https://github.com/pipeTawns-x/Landingpages-Carni.pwa/commit/4abf39135ea072720a33b94308ed5d49bb8e3fe1

2. Rediseño del bento, la cabecera y las tarjetas de producto
https://github.com/pipeTawns-x/Landingpages-Carni.pwa/commit/7c9eb25b27c91101b980a7ecc6d7ebb9522210d5

3. Conversión de imágenes a WebP y corrección de rutas del catálogo
https://github.com/pipeTawns-x/Landingpages-Carni.pwa/commit/ad8ae42ab42edd5d9615cf78249c79f310497c7b

4. Documentación de la entrega y reglas del proyecto
https://github.com/pipeTawns-x/Landingpages-Carni.pwa/commit/b84a1ffe35abf24438720813515b74fbb1c2f3ef

Los commits están escritos en español e inglés, siguiendo Conventional Commits.

La intención fue la misma que en la primera práctica, pero llevada hasta el final: no solo cumplir con la consigna, sino que el resultado quedara funcionando dentro del desarrollo real del proyecto.

s4lu60s!
