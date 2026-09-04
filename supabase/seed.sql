-- ============================================================
-- Seed — Carnicería El Señor de La Misericordia (San Luis Potosí)
-- ============================================================
--
-- Catálogo de 9 categorías. Los precios de agosto 2026 están anclados a
-- datos reales de julio 2025 y ajustados al alza; cada uno lleva su nota.
--
-- REGLA DE IMÁGENES: solo se usan archivos que existen en img/products/.
-- Un producto con foto propia la usa; el resto hereda la de su categoría.
-- Las 18 disponibles, y no hay más:
--   Corte real: tomahawk · rib-eye · porterhouse · filet_mignon
--               ney_york_strip · top_sirloin · skirt_steak · flak_steak
--               bravette_steak
--   Categoría:  res · cerdo · pollo · embutidos · preparadas · premium
--               merch · otrosproductos · frutasverduras
--
-- price_per_lb NO se escribe a mano: se calcula como price_per_kg × 0.4536
-- (1 lb = 0.45359237 kg). Escribirlo a mano en 50 filas es pedir un error.
--
-- min_quantity_kg lo agrega la migración 202608210001. Lo que se vende al
-- peso arranca en 0.250 kg —un cuarto de kilo, el mínimo que da el cuchillo—
-- y lo que se vende por pieza va en 0.
-- ============================================================

TRUNCATE TABLE order_items, orders, favorites, promotions, products, categories
    RESTART IDENTITY CASCADE;

-- ============================================================
-- Categorías
-- ============================================================

INSERT INTO categories (name, slug, image_url, is_active, "order") VALUES
    ('Carnes Rojas',      'carnes-rojas',      '/img/products/res.webp',            true, 1),
    ('Cortes Especiales', 'cortes-especiales', '/img/products/premium.webp',        true, 2),
    ('Cerdo',             'cerdo',             '/img/products/cerdo.webp',          true, 3),
    ('Pollo',             'pollo',             '/img/products/pollo.webp',          true, 4),
    ('Embutidos',         'embutidos',         '/img/products/embutidos.webp',      true, 5),
    ('Preparadas',        'preparadas',        '/img/products/preparadas.webp',     true, 6),
    ('Ofertas',           'ofertas',           '/img/products/premium.webp',        true, 7),
    ('Merch',             'merch',             '/img/products/merch.webp',          true, 8),
    ('Otros',             'otros',             '/img/products/otrosproductos.webp', true, 9);

-- ============================================================
-- Productos
-- ============================================================
--
-- Se insertan con SELECT sobre una lista de VALUES para dos cosas: resolver
-- category_id por slug en vez de por un número que se rompe al reordenar, y
-- derivar price_per_lb del precio por kilo.

INSERT INTO products
    (category_id, name, description, price_per_kg, price_per_lb,
     image_url, stock, min_quantity_kg, is_active)
SELECT
    (SELECT id FROM categories WHERE slug = v.slug),
    v.nombre,
    v.descripcion,
    v.precio_kg,
    ROUND(v.precio_kg * 0.4536, 2),
    v.imagen,
    v.stock,
    v.minimo,
    true
FROM (VALUES

    -- ---------- Carnes Rojas ----------
    ('carnes-rojas', 'Bistec de Res',
     'Corte delgado de pulpa, listo para el sartén o el comal. El de diario.',
     289.00, '/img/products/res.webp', 80, 0.250),

    ('carnes-rojas', 'Molida de Res Especial',
     'Molida del día, sin relleno ni recortes de grasa. Para picadillo, albóndigas o hamburguesa.',
     215.00, '/img/products/res.webp', 100, 0.250),

    ('carnes-rojas', 'Diezmillo',
     'Corte del cuarto delantero, con buen jaspeado. Aguanta cocción larga sin secarse.',
     249.00, '/img/products/res.webp', 60, 0.250),

    ('carnes-rojas', 'Falda para Deshebrar',
     'La de la tinga y los tacos de hebra. Se cuece, se deshebra y rinde.',
     235.00, '/img/products/res.webp', 55, 0.250),

    ('carnes-rojas', 'Chambarete con Tuétano',
     'Con hueso y tuétano incluido. La base del caldo de res.',
     189.00, '/img/products/res.webp', 45, 0.500),

    ('carnes-rojas', 'Retazo con Hueso',
     'Para caldo y cocido. Rendidor y con sabor.',
     145.00, '/img/products/res.webp', 70, 0.500),

    -- ---------- Cortes Especiales ----------
    ('cortes-especiales', 'Tomahawk',
     'Rib eye con el hueso largo entero. Corte de exhibición: pesa de 1.2 a 1.5 kg por pieza.',
     649.00, '/img/products/tomahawk.webp', 15, 0.800),

    ('cortes-especiales', 'Rib Eye',
     'El más jaspeado del lomo alto. La grasa se derrite adentro y lo mantiene jugoso.',
     549.00, '/img/products/rib-eye.webp', 30, 0.300),

    ('cortes-especiales', 'Porterhouse',
     'Dos cortes en uno, separados por el hueso en T: New York de un lado, filete del otro.',
     579.00, '/img/products/porterhouse.webp', 18, 0.400),

    ('cortes-especiales', 'Filete Mignon',
     'La parte más suave del animal. Poca grasa, textura de mantequilla.',
     689.00, '/img/products/filet_mignon.webp', 20, 0.250),

    ('cortes-especiales', 'New York Strip',
     'Lomo corto con su cordón de grasa al borde. Firme, con carácter.',
     529.00, '/img/products/ney_york_strip.webp', 25, 0.300),

    ('cortes-especiales', 'Top Sirloin',
     'Sirloin de la parte alta. El equilibrio entre precio y suavidad.',
     389.00, '/img/products/top_sirloin.webp', 35, 0.300),

    ('cortes-especiales', 'Arrachera',
     'Diafragma marinado. Se sella rápido y se corta contra la fibra, nunca a favor.',
     449.00, '/img/products/skirt_steak.webp', 40, 0.300),

    ('cortes-especiales', 'Flank Steak',
     'Corte plano de la falda, de fibra larga. Ideal para asar entero y rebanar.',
     399.00, '/img/products/flak_steak.webp', 28, 0.300),

    -- ---------- Cerdo ----------
    ('cerdo', 'Chuleta de Cerdo',
     'Con hueso, grosor de dos dedos. Se dora por fuera y queda jugosa adentro.',
     169.00, '/img/products/cerdo.webp', 70, 0.250),

    ('cerdo', 'Costilla de Cerdo',
     'Costillar cortado en tiras. Para el asador o para hornear lento.',
     189.00, '/img/products/cerdo.webp', 55, 0.500),

    ('cerdo', 'Pierna de Cerdo sin Hueso',
     'Pulpa limpia, sin hueso. Para hornear entera o cortar en bistec.',
     179.00, '/img/products/cerdo.webp', 60, 0.250),

    ('cerdo', 'Lomo de Cerdo',
     'Magro y parejo. Se reseca si se pasa de cocción: cuidado con el fuego.',
     185.00, '/img/products/cerdo.webp', 50, 0.250),

    ('cerdo', 'Carnitas Surtidas',
     'Surtido de maciza, cuerito y buche, ya preparado. Se pide por kilo.',
     215.00, '/img/products/cerdo.webp', 40, 0.250),

    ('cerdo', 'Manteca de Cerdo',
     'Manteca de la casa, de la fritura de carnitas. Para frijoles y tamales.',
     89.00, '/img/products/cerdo.webp', 30, 0.500),

    -- ---------- Pollo ----------
    -- Regla del oficio: la pierna NO se vende sola. Sale unida al muslo,
    -- que es como llega del despiece y como la pide el cliente.
    ('pollo', 'Pierna y Muslo',
     'Va siempre en pieza unida, como se despieza: la pierna no se vende suelta. Jugosa y rendidora.',
     89.00, '/img/products/pollo.webp', 150, 0.500),

    ('pollo', 'Pechuga Completa',
     'Pechuga entera con alas. La más magra del pollo.',
     159.00, '/img/products/pollo.webp', 90, 0.250),

    ('pollo', 'Media Pechuga sin Alas',
     'Media pechuga limpia, sin ala. Para milanesas o para rellenar.',
     165.00, '/img/products/pollo.webp', 85, 0.250),

    ('pollo', 'Pollo Entero',
     'Pollo completo, limpio. Se lleva entero o se parte aquí sin costo.',
     119.00, '/img/products/pollo.webp', 60, 1.000),

    ('pollo', 'Mitad de Pollo a lo Largo',
     'Partido de la pechuga a la rabadilla: media pechuga, un ala, pierna y muslo. Para el asador.',
     125.00, '/img/products/pollo.webp', 50, 0.500),

    ('pollo', 'Mitad de Pollo a lo Ancho',
     'Partido a la mitad del cuerpo: arriba las pechugas y alas, abajo piernas y muslos.',
     125.00, '/img/products/pollo.webp', 50, 0.500),

    ('pollo', 'Alas Naturales',
     'Alas limpias, sin sazonar. Enteras, con los tres segmentos.',
     109.00, '/img/products/pollo.webp', 95, 0.500),

    ('pollo', 'Alas Adobadas',
     'Alas en adobo de la casa, listas para el asador. Ya vienen sazonadas.',
     129.00, '/img/products/pollo.webp', 80, 0.500),

    -- ---------- Embutidos ----------
    ('embutidos', 'Salchicha Argentina',
     'Salchicha gruesa de cerdo para asador. Se abre a lo largo y va al choripán.',
     145.00, '/img/products/embutidos.webp', 70, 0.250),

    ('embutidos', 'Longaniza',
     'Longaniza de cerdo en tripa larga, sin porcionar. Se corta al gusto.',
     135.00, '/img/products/embutidos.webp', 75, 0.250),

    ('embutidos', 'Tocino',
     'Tocino de panza, rebanado grueso. Para el asador o para la mañana.',
     199.00, '/img/products/embutidos.webp', 60, 0.250),

    ('embutidos', 'Chistorra',
     'Chistorra delgada y curada. Se hace rápido y suelta mucha grasa con sabor.',
     189.00, '/img/products/embutidos.webp', 45, 0.250),

    ('embutidos', 'Jamón de Pierna',
     'Jamón de pierna rebanado al momento, del grosor que pidas.',
     155.00, '/img/products/embutidos.webp', 65, 0.250),

    -- ---------- Preparadas ----------
    ('preparadas', 'Chorizo Rojo',
     'Chorizo de cerdo con chile guajillo y pimentón. El color viene de la especia, no de colorante.',
     139.00, '/img/products/preparadas.webp', 90, 0.250),

    ('preparadas', 'Chorizo Verde',
     'Al estilo Toluca: cilantro, epazote y chile verde. Verde de hierba, no de tinte.',
     149.00, '/img/products/preparadas.webp', 70, 0.250),

    ('preparadas', 'Chorizo Argentino',
     'Chorizo fresco de cerdo, poco condimentado. El del choripán.',
     169.00, '/img/products/preparadas.webp', 65, 0.250),

    ('preparadas', 'Ranchera',
     'Longaniza ranchera en rueda, ya sazonada. Va directo a la parrilla.',
     159.00, '/img/products/preparadas.webp', 60, 0.250),

    ('preparadas', 'Bistec Adobado',
     'Bistec de res en adobo de la casa. Reposa mínimo doce horas antes de venderse.',
     299.00, '/img/products/preparadas.webp', 55, 0.250),

    ('preparadas', 'Pollo Marinado',
     'Pollo en marinada de cítricos y achiote. Para el asador, sin más trabajo.',
     139.00, '/img/products/preparadas.webp', 70, 0.500),

    -- ---------- Ofertas ----------
    ('ofertas', 'Vacío en Oferta',
     'Bavette de la semana, a precio de temporada. Sujeto a existencia.',
     379.00, '/img/products/bravette_steak.webp', 20, 0.300),

    ('ofertas', 'Paquete Asador 4 a 6 Personas',
     'Arrachera, chorizo argentino, cebolla cambray y carbón. Precio por paquete, no por kilo.',
     1599.00, '/img/products/premium.webp', 12, 0),

    ('ofertas', 'Paquete Parrillada Familiar 8 a 10 Personas',
     'Rib eye, costilla de cerdo, pollo marinado, embutidos surtidos y guarnición. Por paquete.',
     3249.00, '/img/products/premium.webp', 8, 0),

    ('ofertas', 'Paquete Carnitas por Kilo',
     'Kilo de carnitas surtidas con tortillas, salsa y cebolla. Encargo del día anterior.',
     389.00, '/img/products/cerdo.webp', 15, 0),

    -- ---------- Merch (por pieza, nunca por kilo) ----------
    ('merch', 'Gorra Bordada',
     'Gorra con el logo de la carnicería, bordado. Talla ajustable.',
     250.00, '/img/products/merch.webp', 40, 0),

    ('merch', 'Hielera Rígida',
     'Hielera de 24 litros con el logo. Mantiene frío toda la jornada.',
     890.00, '/img/products/merch.webp', 10, 0),

    ('merch', 'Cuchillo Cebollero',
     'Cuchillo de acero inoxidable de 20 cm. El de uso diario en la tabla.',
     650.00, '/img/products/merch.webp', 18, 0),

    ('merch', 'Tabla para Picar',
     'Tabla de madera dura con canal para los jugos.',
     420.00, '/img/products/merch.webp', 22, 0),

    ('merch', 'Delantal de Carnicero',
     'Delantal de lona encerada, resistente a manchas.',
     380.00, '/img/products/merch.webp', 25, 0),

    -- ---------- Otros (por pieza o por bolsa) ----------
    ('otros', 'Carbón de Mezquite',
     'Bolsa de 3 kg. Prende parejo y aguanta la brasa.',
     120.00, '/img/products/otrosproductos.webp', 50, 0),

    ('otros', 'Leña de Mezquite',
     'Manojo de leña seca. Para el ahumado o para arrancar el asador.',
     95.00, '/img/products/otrosproductos.webp', 35, 0),

    ('otros', 'Bolsa de Hielo',
     'Bolsa de 5 kg de hielo en cubo.',
     35.00, '/img/products/otrosproductos.webp', 80, 0),

    ('otros', 'Limón con Sal y Chile',
     'Bolsa de limón partido con sal y chile en polvo, lista para la carne asada.',
     45.00, '/img/products/frutasverduras.webp', 60, 0),

    ('otros', 'Cebolla Cambray',
     'Manojo de cebolla cambray con rabo, para el asador.',
     55.00, '/img/products/frutasverduras.webp', 45, 0)

) AS v(slug, nombre, descripcion, precio_kg, imagen, stock, minimo);

-- ============================================================
-- Verificaciones — fallan ruidosamente si el catálogo quedó mal
-- ============================================================

DO $$
DECLARE
    v_dup INTEGER;
    v_huerfano INTEGER;
    v_categorias INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_dup FROM (
        SELECT lower(trim(name)) FROM products GROUP BY 1 HAVING COUNT(*) > 1
    ) d;
    IF v_dup > 0 THEN
        RAISE EXCEPTION 'Hay % nombres de producto duplicados', v_dup;
    END IF;

    SELECT COUNT(*) INTO v_huerfano FROM products WHERE category_id IS NULL;
    IF v_huerfano > 0 THEN
        RAISE EXCEPTION '% productos quedaron sin categoría: un slug no coincide', v_huerfano;
    END IF;

    SELECT COUNT(DISTINCT category_id) INTO v_categorias FROM products;
    IF v_categorias <> 9 THEN
        RAISE EXCEPTION 'Se esperaban 9 categorías con producto, hay %', v_categorias;
    END IF;

    RAISE NOTICE 'Seed OK: % productos en % categorías',
        (SELECT COUNT(*) FROM products), v_categorias;
END $$;
