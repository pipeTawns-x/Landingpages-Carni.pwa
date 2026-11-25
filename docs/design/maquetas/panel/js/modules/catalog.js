// Generated from supabase/seed.sql (categories and products). Do not edit by hand.
// Each product keeps the seed.sql line where its VALUES tuple starts.
// price_unit comes from the seed column "unidad"; sale_modes follow the seed CASE:
// kg -> {money, weight}; piece or package -> {pieces}.
window.CARNI_CATALOG = {
"imgBase": "../../../../public/img/products/",
"categories": [
{
"name": "Carnes Rojas",
"slug": "carnes-rojas",
"img": "res.webp",
"order": 1,
"line": 39
},
{
"name": "Cortes Especiales",
"slug": "cortes-especiales",
"img": "premium.webp",
"order": 2,
"line": 40
},
{
"name": "Cerdo",
"slug": "cerdo",
"img": "cerdo.webp",
"order": 3,
"line": 41
},
{
"name": "Pollo",
"slug": "pollo",
"img": "pollo.webp",
"order": 4,
"line": 42
},
{
"name": "Embutidos",
"slug": "embutidos",
"img": "embutidos.webp",
"order": 5,
"line": 43
},
{
"name": "Preparadas",
"slug": "preparadas",
"img": "preparadas.webp",
"order": 6,
"line": 44
},
{
"name": "Ofertas",
"slug": "ofertas",
"img": "premium.webp",
"order": 7,
"line": 45
},
{
"name": "Merch",
"slug": "merch",
"img": "merch.webp",
"order": 8,
"line": 46
},
{
"name": "Otros",
"slug": "otros",
"img": "otrosproductos.webp",
"order": 9,
"line": 47
}
],
"products": [
{
"id": 1,
"cat": "carnes-rojas",
"name": "Bistec de Res",
"desc": "Corte delgado de pulpa, listo para el sartén o el comal. El de diario.",
"price": 289.0,
"img": "res.webp",
"stock": 80,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 77
},
{
"id": 2,
"cat": "carnes-rojas",
"name": "Molida de Res Especial",
"desc": "Molida del día, sin relleno ni recortes de grasa. Para picadillo, albóndigas o hamburguesa.",
"price": 215.0,
"img": "res.webp",
"stock": 100,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 81
},
{
"id": 3,
"cat": "carnes-rojas",
"name": "Diezmillo",
"desc": "Corte del cuarto delantero, con buen jaspeado. Aguanta cocción larga sin secarse.",
"price": 249.0,
"img": "res.webp",
"stock": 60,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 85
},
{
"id": 4,
"cat": "carnes-rojas",
"name": "Falda para Deshebrar",
"desc": "La de la tinga y los tacos de hebra. Se cuece, se deshebra y rinde.",
"price": 235.0,
"img": "res.webp",
"stock": 55,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 89
},
{
"id": 5,
"cat": "carnes-rojas",
"name": "Chambarete con Tuétano",
"desc": "Con hueso y tuétano incluido. La base del caldo de res.",
"price": 189.0,
"img": "res.webp",
"stock": 45,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 93
},
{
"id": 6,
"cat": "carnes-rojas",
"name": "Retazo con Hueso",
"desc": "Para caldo y cocido. Rendidor y con sabor.",
"price": 145.0,
"img": "res.webp",
"stock": 70,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 97
},
{
"id": 7,
"cat": "cortes-especiales",
"name": "Tomahawk",
"desc": "Rib eye con el hueso largo entero. Corte de exhibición: pesa de 1.2 a 1.5 kg por pieza.",
"price": 649.0,
"img": "tomahawk.webp",
"stock": 15,
"min": 0.8,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 102
},
{
"id": 8,
"cat": "cortes-especiales",
"name": "Rib Eye",
"desc": "El más jaspeado del lomo alto. La grasa se derrite adentro y lo mantiene jugoso.",
"price": 549.0,
"img": "rib-eye.webp",
"stock": 30,
"min": 0.3,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 106
},
{
"id": 9,
"cat": "cortes-especiales",
"name": "Porterhouse",
"desc": "Dos cortes en uno, separados por el hueso en T: New York de un lado, filete del otro.",
"price": 579.0,
"img": "porterhouse.webp",
"stock": 18,
"min": 0.4,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 110
},
{
"id": 10,
"cat": "cortes-especiales",
"name": "Filete Mignon",
"desc": "La parte más suave del animal. Poca grasa, textura de mantequilla.",
"price": 689.0,
"img": "filet_mignon.webp",
"stock": 20,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 114
},
{
"id": 11,
"cat": "cortes-especiales",
"name": "New York Strip",
"desc": "Lomo corto con su cordón de grasa al borde. Firme, con carácter.",
"price": 529.0,
"img": "ney_york_strip.webp",
"stock": 25,
"min": 0.3,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 118
},
{
"id": 12,
"cat": "cortes-especiales",
"name": "Top Sirloin",
"desc": "Sirloin de la parte alta. El equilibrio entre precio y suavidad.",
"price": 389.0,
"img": "top_sirloin.webp",
"stock": 35,
"min": 0.3,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 122
},
{
"id": 13,
"cat": "cortes-especiales",
"name": "Arrachera",
"desc": "Diafragma marinado. Se sella rápido y se corta contra la fibra, nunca a favor.",
"price": 449.0,
"img": "skirt_steak.webp",
"stock": 40,
"min": 0.3,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 126
},
{
"id": 14,
"cat": "cortes-especiales",
"name": "Flank Steak",
"desc": "Corte plano de la falda, de fibra larga. Ideal para asar entero y rebanar.",
"price": 399.0,
"img": "flak_steak.webp",
"stock": 28,
"min": 0.3,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 130
},
{
"id": 15,
"cat": "cerdo",
"name": "Chuleta de Cerdo",
"desc": "Con hueso, grosor de dos dedos. Se dora por fuera y queda jugosa adentro.",
"price": 169.0,
"img": "cerdo.webp",
"stock": 70,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 135
},
{
"id": 16,
"cat": "cerdo",
"name": "Costilla de Cerdo",
"desc": "Costillar cortado en tiras. Para el asador o para hornear lento.",
"price": 189.0,
"img": "cerdo.webp",
"stock": 55,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 139
},
{
"id": 17,
"cat": "cerdo",
"name": "Pierna de Cerdo sin Hueso",
"desc": "Pulpa limpia, sin hueso. Para hornear entera o cortar en bistec.",
"price": 179.0,
"img": "cerdo.webp",
"stock": 60,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 143
},
{
"id": 18,
"cat": "cerdo",
"name": "Lomo de Cerdo",
"desc": "Magro y parejo. Se reseca si se pasa de cocción: cuidado con el fuego.",
"price": 185.0,
"img": "cerdo.webp",
"stock": 50,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 147
},
{
"id": 19,
"cat": "cerdo",
"name": "Carnitas Surtidas",
"desc": "Surtido de maciza, cuerito y buche, ya preparado. Se pide por kilo.",
"price": 215.0,
"img": "cerdo.webp",
"stock": 40,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 151
},
{
"id": 20,
"cat": "cerdo",
"name": "Manteca de Cerdo",
"desc": "Manteca de la casa, de la fritura de carnitas. Para frijoles y tamales.",
"price": 89.0,
"img": "cerdo.webp",
"stock": 30,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 155
},
{
"id": 21,
"cat": "pollo",
"name": "Pierna y Muslo",
"desc": "Va siempre en pieza unida, como se despieza: la pierna no se vende suelta. Jugosa y rendidora.",
"price": 89.0,
"img": "pollo.webp",
"stock": 150,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 162
},
{
"id": 22,
"cat": "pollo",
"name": "Pechuga Completa",
"desc": "Pechuga entera con alas. La más magra del pollo.",
"price": 159.0,
"img": "pollo.webp",
"stock": 90,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 166
},
{
"id": 23,
"cat": "pollo",
"name": "Media Pechuga sin Alas",
"desc": "Media pechuga limpia, sin ala. Para milanesas o para rellenar.",
"price": 165.0,
"img": "pollo.webp",
"stock": 85,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 170
},
{
"id": 24,
"cat": "pollo",
"name": "Pollo Entero",
"desc": "Pollo completo, limpio. Se lleva entero o se parte aquí sin costo.",
"price": 119.0,
"img": "pollo.webp",
"stock": 60,
"min": 1.0,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 174
},
{
"id": 25,
"cat": "pollo",
"name": "Mitad de Pollo a lo Largo",
"desc": "Partido de la pechuga a la rabadilla: media pechuga, un ala, pierna y muslo. Para el asador.",
"price": 125.0,
"img": "pollo.webp",
"stock": 50,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 178
},
{
"id": 26,
"cat": "pollo",
"name": "Mitad de Pollo a lo Ancho",
"desc": "Partido a la mitad del cuerpo: arriba las pechugas y alas, abajo piernas y muslos.",
"price": 125.0,
"img": "pollo.webp",
"stock": 50,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 182
},
{
"id": 27,
"cat": "pollo",
"name": "Alas Naturales",
"desc": "Alas limpias, sin sazonar. Enteras, con los tres segmentos.",
"price": 109.0,
"img": "pollo.webp",
"stock": 95,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 186
},
{
"id": 28,
"cat": "pollo",
"name": "Alas Adobadas",
"desc": "Alas en adobo de la casa, listas para el asador. Ya vienen sazonadas.",
"price": 129.0,
"img": "pollo.webp",
"stock": 80,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 190
},
{
"id": 29,
"cat": "embutidos",
"name": "Salchicha Argentina",
"desc": "Salchicha gruesa de cerdo para asador. Se abre a lo largo y va al choripán.",
"price": 145.0,
"img": "embutidos.webp",
"stock": 70,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 195
},
{
"id": 30,
"cat": "embutidos",
"name": "Longaniza",
"desc": "Longaniza de cerdo en tripa larga, sin porcionar. Se corta al gusto.",
"price": 135.0,
"img": "embutidos.webp",
"stock": 75,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 199
},
{
"id": 31,
"cat": "embutidos",
"name": "Tocino",
"desc": "Tocino de panza, rebanado grueso. Para el asador o para la mañana.",
"price": 199.0,
"img": "embutidos.webp",
"stock": 60,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 203
},
{
"id": 32,
"cat": "embutidos",
"name": "Chistorra",
"desc": "Chistorra delgada y curada. Se hace rápido y suelta mucha grasa con sabor.",
"price": 189.0,
"img": "embutidos.webp",
"stock": 45,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 207
},
{
"id": 33,
"cat": "embutidos",
"name": "Jamón de Pierna",
"desc": "Jamón de pierna rebanado al momento, del grosor que pidas.",
"price": 155.0,
"img": "embutidos.webp",
"stock": 65,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 211
},
{
"id": 34,
"cat": "preparadas",
"name": "Chorizo Rojo",
"desc": "Chorizo de cerdo con chile guajillo y pimentón. El color viene de la especia, no de colorante.",
"price": 139.0,
"img": "preparadas.webp",
"stock": 90,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 216
},
{
"id": 35,
"cat": "preparadas",
"name": "Chorizo Verde",
"desc": "Al estilo Toluca: cilantro, epazote y chile verde. Verde de hierba, no de tinte.",
"price": 149.0,
"img": "preparadas.webp",
"stock": 70,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 220
},
{
"id": 36,
"cat": "preparadas",
"name": "Chorizo Argentino",
"desc": "Chorizo fresco de cerdo, poco condimentado. El del choripán.",
"price": 169.0,
"img": "preparadas.webp",
"stock": 65,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 224
},
{
"id": 37,
"cat": "preparadas",
"name": "Ranchera",
"desc": "Longaniza ranchera en rueda, ya sazonada. Va directo a la parrilla.",
"price": 159.0,
"img": "preparadas.webp",
"stock": 60,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 228
},
{
"id": 38,
"cat": "preparadas",
"name": "Bistec Adobado",
"desc": "Bistec de res en adobo de la casa. Reposa mínimo doce horas antes de venderse.",
"price": 299.0,
"img": "preparadas.webp",
"stock": 55,
"min": 0.25,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 232
},
{
"id": 39,
"cat": "preparadas",
"name": "Pollo Marinado",
"desc": "Pollo en marinada de cítricos y achiote. Para el asador, sin más trabajo.",
"price": 139.0,
"img": "preparadas.webp",
"stock": 70,
"min": 0.5,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 236
},
{
"id": 40,
"cat": "ofertas",
"name": "Vacío en Oferta",
"desc": "Bavette de la semana, a precio de temporada. Sujeto a existencia.",
"price": 379.0,
"img": "bravette_steak.webp",
"stock": 20,
"min": 0.3,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 241
},
{
"id": 41,
"cat": "ofertas",
"name": "Paquete Asador 4 a 6 Personas",
"desc": "Arrachera, chorizo argentino, cebolla cambray y carbón. Precio por paquete, no por kilo.",
"price": 1599.0,
"img": "premium.webp",
"stock": 12,
"min": 0.0,
"unit": "package",
"modes": [
"pieces"
],
"line": 245
},
{
"id": 42,
"cat": "ofertas",
"name": "Paquete Parrillada Familiar 8 a 10 Personas",
"desc": "Rib eye, costilla de cerdo, pollo marinado, embutidos surtidos y guarnición. Por paquete.",
"price": 3249.0,
"img": "premium.webp",
"stock": 8,
"min": 0.0,
"unit": "package",
"modes": [
"pieces"
],
"line": 249
},
{
"id": 43,
"cat": "ofertas",
"name": "Paquete Carnitas por Kilo",
"desc": "Kilo de carnitas surtidas con tortillas, salsa y cebolla. Encargo del día anterior.",
"price": 389.0,
"img": "cerdo.webp",
"stock": 15,
"min": 0.0,
"unit": "kg",
"modes": [
"money",
"weight"
],
"line": 253
},
{
"id": 44,
"cat": "merch",
"name": "Gorra Bordada",
"desc": "Gorra con el logo de la carnicería, bordado. Talla ajustable.",
"price": 250.0,
"img": "merch.webp",
"stock": 40,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 258
},
{
"id": 45,
"cat": "merch",
"name": "Hielera Rígida",
"desc": "Hielera de 24 litros con el logo. Mantiene frío toda la jornada.",
"price": 890.0,
"img": "merch.webp",
"stock": 10,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 262
},
{
"id": 46,
"cat": "merch",
"name": "Cuchillo Cebollero",
"desc": "Cuchillo de acero inoxidable de 20 cm. El de uso diario en la tabla.",
"price": 650.0,
"img": "merch.webp",
"stock": 18,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 266
},
{
"id": 47,
"cat": "merch",
"name": "Tabla para Picar",
"desc": "Tabla de madera dura con canal para los jugos.",
"price": 420.0,
"img": "merch.webp",
"stock": 22,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 270
},
{
"id": 48,
"cat": "merch",
"name": "Delantal de Carnicero",
"desc": "Delantal de lona encerada, resistente a manchas.",
"price": 380.0,
"img": "merch.webp",
"stock": 25,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 274
},
{
"id": 49,
"cat": "otros",
"name": "Carbón de Mezquite",
"desc": "Bolsa de 3 kg. Prende parejo y aguanta la brasa.",
"price": 120.0,
"img": "otrosproductos.webp",
"stock": 50,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 279
},
{
"id": 50,
"cat": "otros",
"name": "Leña de Mezquite",
"desc": "Manojo de leña seca. Para el ahumado o para arrancar el asador.",
"price": 95.0,
"img": "otrosproductos.webp",
"stock": 35,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 283
},
{
"id": 51,
"cat": "otros",
"name": "Bolsa de Hielo",
"desc": "Bolsa de 5 kg de hielo en cubo.",
"price": 35.0,
"img": "otrosproductos.webp",
"stock": 80,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 287
},
{
"id": 52,
"cat": "otros",
"name": "Limón con Sal y Chile",
"desc": "Bolsa de limón partido con sal y chile en polvo, lista para la carne asada.",
"price": 45.0,
"img": "frutasverduras.webp",
"stock": 60,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 291
},
{
"id": 53,
"cat": "otros",
"name": "Cebolla Cambray",
"desc": "Manojo de cebolla cambray con rabo, para el asador.",
"price": 55.0,
"img": "frutasverduras.webp",
"stock": 45,
"min": 0.0,
"unit": "piece",
"modes": [
"pieces"
],
"line": 295
}
]
};
