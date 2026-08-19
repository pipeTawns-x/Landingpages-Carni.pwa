## Qué resuelve

Carni-mvp es la tienda en línea de una carnicería en San Luis Potosí. Este cambio migra el catálogo y el carrito de JavaScript vanilla a componentes de React, y rediseña la portada, el catálogo y el acceso.

El catálogo dejó de ser una lista estática: filtra por categoría, muestra existencias reales y precio por kilo y por libra. El carrito pasó de ventana modal a panel lateral, de modo que el cliente sigue agregando cortes sin cerrarlo.

## Cambios principales

| Área | Antes | Ahora |
|---|---|---|
| Catálogo | JavaScript vanilla, productos repitiendo la misma imagen | React, catálogo completo con imagen propia por producto |
| Carrito | ventana modal que bloquea la página | panel lateral, el catálogo sigue usable |
| Bento de portada | tarjetas con gran espacio vacío | tarjetas ajustadas a su contenido |
| Imágenes | rutas rotas, PNG pesados | rutas corregidas, WebP con respaldo |
| Encabezado | nombre del negocio repetido tres veces, sin menú | logo único, menú hamburguesa, buscador expandido |

## Actividad 6.28.9 — React II

| Requisito | Implementación |
|---|---|
| 1. Componentes funcionales conservando props | ProductList, OrderList, CartPanel, ProductCard |
| 2. Componente que recibe un arreglo por props y lo recorre con map | src/components/ProductList/ProductList.tsx |
| 3. Key única por elemento | key={product.id}, identificadores reales del catálogo |
| 4. Segundo componente de lista, también con arreglo por props | src/components/OrderList/OrderList.tsx |
| 5. useState con dos estados, uno vacío al inicio | products y order en src/entry/products.tsx |
| 6. Botón que actualiza el segundo estado | Agregar al pedido, con actualización inmutable |
| 7. useEffect que registra cada cambio de la lista | sin condicional, se dispara también al vaciarla |
| 8. Hoja de estilos por carpeta de componente | styles.scss dentro de cada carpeta de componente |

### Sobre la adaptación del dominio

La consigna plantea una biblioteca musical. Aquí el mismo patrón se aplica al negocio real: la lista de resultados es el catálogo de cortes y la biblioteca del usuario es el pedido. Los requisitos técnicos se cumplen íntegros; cambia el dominio, no la técnica.

## Correcciones de comportamiento incluidas

Durante la revisión previa al commit se detectaron y corrigieron cuatro defectos:

- El pedido se hidrata desde el almacenamiento compartido al montar el componente, en lugar de arrancar vacío y sobrescribir un carrito existente. Antes, un carrito armado en la portada se perdía al abrir el catálogo.
- Cada línea del pedido conserva su unidad de venta: kilo, pieza o paquete. Antes estaba fijada a kilo, de modo que un artículo de mercancía se mostraba como "1 kg".
- El identificador de línea recurre a un contador cuando crypto.randomUUID no está disponible fuera de contexto seguro, situación habitual al demostrar el proyecto desde un teléfono en la red local.
- El temporizador de carga se limpia en finally.

## Cómo probarlo

Instalar dependencias con npm install y levantar el entorno con npm run dev. El catálogo está en /products.html. Al agregar un corte, el panel lateral se abre y la consola registra el cambio del pedido. Al vaciarlo, también.

## Nota sobre practicas/react/

La carpeta practicas/react/ conserva la primera versión de las prácticas del módulo, escrita como ejercicio aislado del proyecto. La entrega vigente es la migración a React del sitio real, en src/components/ y src/entry/. Se mantiene el histórico para dejar visible la evolución del trabajo.

## Pendiente

Fotografía definitiva de algunos productos, documentada en img/products/PENDIENTES.md. El catálogo funciona con la imagen genérica de su categoría mientras tanto.
