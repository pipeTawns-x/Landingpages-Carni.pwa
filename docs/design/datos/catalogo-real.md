# Catálogo real de la tienda

Esta es una foto de la base de Supabase (proyecto `wlikxgklwutxxazbhmkv`), leída en modo de solo lectura el 2026-09-29.

Claude Design la usa para nombres, precios, mínimos y fotos: no se inventan productos.

## Categorías (9, todas con productos)

Cortes Especiales (8) · Pollo (8) · Carnes Rojas (6) · Cerdo (6) · Preparadas (6) · Embutidos (5) · Merch (5) · Otros (5) · Ofertas (4).

"Frutas y verduras" y "Especias" **no existen en la base**. El menú no las muestra.

## Mínimos de pedido (`store_settings`)

- Para recoger: sin mínimo ($0).
- A domicilio: $150.

## Fotos

- Solo **9 de 53 productos tienen foto propia**: los 8 Cortes Especiales y "Vacío en Oferta".
- Los otros 44 comparten una foto genérica por categoría. En el rediseño llevan "foto pendiente" (loop-final.md, 2.3).

## Productos (53, todos activos)

La columna "Precio" viene del campo `price_per_kg` de la base.
- En carnes, cerdo, pollo, embutidos y preparadas es precio por kg.
- En Merch, Otros y los paquetes de Ofertas, el mismo campo guarda el precio por pieza o por paquete. La unidad exacta se confirma con el dueño.

| Categoría | Producto | Precio | Mínimo | Foto |
|---|---|---|---|---|
| Carnes Rojas | Bistec de Res | $289.00 | 0.250 kg | compartida con 5 más |
| Carnes Rojas | Chambarete con Tuétano | $189.00 | 0.500 kg | compartida con 5 más |
| Carnes Rojas | Diezmillo | $249.00 | 0.250 kg | compartida con 5 más |
| Carnes Rojas | Falda para Deshebrar | $235.00 | 0.250 kg | compartida con 5 más |
| Carnes Rojas | Molida de Res Especial | $215.00 | 0.250 kg | compartida con 5 más |
| Carnes Rojas | Retazo con Hueso | $145.00 | 0.500 kg | compartida con 5 más |
| Cerdo | Carnitas Surtidas | $215.00 | 0.250 kg | compartida con 6 más |
| Cerdo | Chuleta de Cerdo | $169.00 | 0.250 kg | compartida con 6 más |
| Cerdo | Costilla de Cerdo | $189.00 | 0.500 kg | compartida con 6 más |
| Cerdo | Lomo de Cerdo | $185.00 | 0.250 kg | compartida con 6 más |
| Cerdo | Manteca de Cerdo | $89.00 | 0.500 kg | compartida con 6 más |
| Cerdo | Pierna de Cerdo sin Hueso | $179.00 | 0.250 kg | compartida con 6 más |
| Cortes Especiales | Arrachera | $449.00 | 0.300 kg | propia |
| Cortes Especiales | Filete Mignon | $689.00 | 0.250 kg | propia |
| Cortes Especiales | Flank Steak | $399.00 | 0.300 kg | propia |
| Cortes Especiales | New York Strip | $529.00 | 0.300 kg | propia |
| Cortes Especiales | Porterhouse | $579.00 | 0.400 kg | propia |
| Cortes Especiales | Rib Eye | $549.00 | 0.300 kg | propia |
| Cortes Especiales | Tomahawk | $649.00 | 0.800 kg | propia |
| Cortes Especiales | Top Sirloin | $389.00 | 0.300 kg | propia |
| Embutidos | Chistorra | $189.00 | 0.250 kg | compartida con 4 más |
| Embutidos | Jamón de Pierna | $155.00 | 0.250 kg | compartida con 4 más |
| Embutidos | Longaniza | $135.00 | 0.250 kg | compartida con 4 más |
| Embutidos | Salchicha Argentina | $145.00 | 0.250 kg | compartida con 4 más |
| Embutidos | Tocino | $199.00 | 0.250 kg | compartida con 4 más |
| Merch | Cuchillo Cebollero | $650.00 | — | compartida con 4 más |
| Merch | Delantal de Carnicero | $380.00 | — | compartida con 4 más |
| Merch | Gorra Bordada | $250.00 | — | compartida con 4 más |
| Merch | Hielera Rígida | $890.00 | — | compartida con 4 más |
| Merch | Tabla para Picar | $420.00 | — | compartida con 4 más |
| Ofertas | Paquete Asador 4 a 6 Personas | $1599.00 | — | compartida con 1 más |
| Ofertas | Paquete Carnitas por Kilo | $389.00 | — | compartida con 6 más |
| Ofertas | Paquete Parrillada Familiar 8 a 10 Personas | $3249.00 | — | compartida con 1 más |
| Ofertas | Vacío en Oferta | $379.00 | 0.300 kg | propia |
| Otros | Bolsa de Hielo | $35.00 | — | compartida con 2 más |
| Otros | Carbón de Mezquite | $120.00 | — | compartida con 2 más |
| Otros | Cebolla Cambray | $55.00 | — | compartida con 1 más |
| Otros | Leña de Mezquite | $95.00 | — | compartida con 2 más |
| Otros | Limón con Sal y Chile | $45.00 | — | compartida con 1 más |
| Pollo | Alas Adobadas | $129.00 | 0.500 kg | compartida con 7 más |
| Pollo | Alas Naturales | $109.00 | 0.500 kg | compartida con 7 más |
| Pollo | Media Pechuga sin Alas | $165.00 | 0.250 kg | compartida con 7 más |
| Pollo | Mitad de Pollo a lo Ancho | $125.00 | 0.500 kg | compartida con 7 más |
| Pollo | Mitad de Pollo a lo Largo | $125.00 | 0.500 kg | compartida con 7 más |
| Pollo | Pechuga Completa | $159.00 | 0.250 kg | compartida con 7 más |
| Pollo | Pierna y Muslo | $89.00 | 0.500 kg | compartida con 7 más |
| Pollo | Pollo Entero | $119.00 | 1.000 kg | compartida con 7 más |
| Preparadas | Bistec Adobado | $299.00 | 0.250 kg | compartida con 5 más |
| Preparadas | Chorizo Argentino | $169.00 | 0.250 kg | compartida con 5 más |
| Preparadas | Chorizo Rojo | $139.00 | 0.250 kg | compartida con 5 más |
| Preparadas | Chorizo Verde | $149.00 | 0.250 kg | compartida con 5 más |
| Preparadas | Pollo Marinado | $139.00 | 0.500 kg | compartida con 5 más |
| Preparadas | Ranchera | $159.00 | 0.250 kg | compartida con 5 más |

## Notas para el diseño

- En la base se llama "Paquete Carnitas por Kilo". En la tienda se muestra "Paquete Carnitas" (loop-final.md, 1.8). Renombrarlo en la base es trabajo de backend.
- Los paquetes reales son 3: Asador 4 a 6 personas, Carnitas y Parrillada Familiar 8 a 10 personas. Llevan las frases del anticipo (1.6).
- El stock real vive en la base. En la tienda no se muestra el número (2.3); en el panel sí.
