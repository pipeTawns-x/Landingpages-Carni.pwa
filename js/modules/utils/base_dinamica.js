// js/modules/base_dinamica.js
// Base de datos de productos organizada por categorías
export const productos = {
    res: [
        { 
            id: 'bisteck_res', 
            nombre: 'Bisteck de Res', 
            precioPorKg: 180, 
            precioLb: 81.65,
            categoria: 'res', 
            tipo: 'kg',
            imagen: 'img/products/res.png'
        },
        { 
            id: 'trozo_res', 
            nombre: 'Trozo de Res', 
            precioPorKg: 160, 
            precioLb: 72.57,
            categoria: 'res', 
            tipo: 'kg',
            imagen: 'img/products/res.png'
        },
        { 
            id: 'trocito_res', 
            nombre: 'Trocito de Res', 
            precioPorKg: 150, 
            precioLb: 68.04,
            categoria: 'res', 
            tipo: 'kg',
            imagen: 'img/products/res.png'
        },
        { 
            id: 'molida_res', 
            nombre: 'Molida de Res', 
            precioPorKg: 170, 
            precioLb: 77.11,
            categoria: 'res', 
            tipo: 'kg',
            imagen: 'img/products/res.png'
        }
    ],
    pollo: [
        { 
            id: 'filete_pollo', 
            nombre: 'Filete de Pollo', 
            precioPorKg: 120, 
            precioLb: 54.36,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'pechuga_sin_hueso_sin_alas', 
            nombre: 'Pechuga sin Hueso y sin Alas', 
            precioPorKg: 140, 
            precioLb: 63.50,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'pechuga_con_hueso_sin_alas', 
            nombre: 'Pechuga con Hueso y sin Alas', 
            precioPorKg: 110, 
            precioLb: 49.90,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'pechuga_sin_alas', 
            nombre: 'Pechuga sin Alas', 
            precioPorKg: 130, 
            precioLb: 58.97,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'pechuga_con_hueso_alas', 
            nombre: 'Pechuga con Hueso y Alas', 
            precioPorKg: 100, 
            precioLb: 45.36,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'pollo_completo', 
            nombre: 'Pollo Completo', 
            precioPorKg: 90, 
            precioLb: 40.82,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'pollo_completo_sin_alas', 
            nombre: 'Pollo Completo sin Alas', 
            precioPorKg: 95, 
            precioLb: 43.09,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'piernas_muslos', 
            nombre: 'Piernas y Muslos de Pollo', 
            precioPorKg: 100, 
            precioLb: 45.36,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'alas_naturales', 
            nombre: 'Alas Naturales', 
            precioPorKg: 95, 
            precioLb: 43.09,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        },
        { 
            id: 'alas_adobadas', 
            nombre: 'Alas Adobadas', 
            precioPorKg: 110, 
            precioLb: 49.90,
            categoria: 'pollo', 
            tipo: 'kg',
            imagen: 'img/products/pollo.png'
        }
    ],
    cerdo: [
        { 
            id: 'bisteck_cerdo', 
            nombre: 'Bisteck de Cerdo', 
            precioPorKg: 130, 
            precioLb: 58.97,
            categoria: 'cerdo', 
            tipo: 'kg',
            imagen: 'img/products/cerdo.png'
        },
        { 
            id: 'trocito_cerdo', 
            nombre: 'Trocito de Cerdo', 
            precioPorKg: 120, 
            precioLb: 54.43,
            categoria: 'cerdo', 
            tipo: 'kg',
            imagen: 'img/products/cerdo.png'
        },
        { 
            id: 'trozo_cerdo', 
            nombre: 'Trozo de Cerdo', 
            precioPorKg: 125, 
            precioLb: 56.70,
            categoria: 'cerdo', 
            tipo: 'kg',
            imagen: 'img/products/cerdo.png'
        },
        { 
            id: 'molida_cerdo', 
            nombre: 'Molida de Cerdo', 
            precioPorKg: 135, 
            precioLb: 61.24,
            categoria: 'cerdo', 
            tipo: 'kg',
            imagen: 'img/products/cerdo.png'
        }
    ],
    embutidos: [
        { 
            id: 'jamon', 
            nombre: 'Jamón', 
            precioPorKg: 160, 
            precioLb: 72.57,
            categoria: 'embutidos', 
            tipo: 'kg',
            imagen: 'img/products/embutidos.png'
        },
        { 
            id: 'salchicha_pieza', 
            nombre: 'Salchicha (por pieza)', 
            precioPorUnidad: 25, 
            categoria: 'embutidos', 
            tipo: 'unidad',
            imagen: 'img/products/embutidos.png'
        },
        { 
            id: 'salchicha_argentina', 
            nombre: 'Salchicha Argentina (paquete 2 piezas)', 
            precioPorPaquete: 60, 
            categoria: 'embutidos', 
            tipo: 'paquete',
            imagen: 'img/products/embutidos.png'
        },
        { 
            id: 'chorizo_embutido', 
            nombre: 'Chorizo', 
            precioPorKg: 150, 
            precioLb: 68.04,
            categoria: 'embutidos', 
            tipo: 'kg',
            imagen: 'img/products/embutidos.png'
        }
    ],
    premium: [
        { 
            id: 'bravette_steak', 
            nombre: 'Bravette Steak', 
            precioPorKg: 450, 
            precioLb: 204.12,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.3,
            imagen: 'img/carrusel_products/bravette_steak.png'
        },
        { 
            id: 'filet_mignon', 
            nombre: 'Filet Mignon', 
            precioPorKg: 600, 
            precioLb: 272.16,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.25,
            imagen: 'img/carrusel_products/filet_mignon.png'
        },
        { 
            id: 'flank_steak', 
            nombre: 'Flank Steak', 
            precioPorKg: 380, 
            precioLb: 172.37,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.4,
            imagen: 'img/carrusel_products/flak_steak.png'
        },
        { 
            id: 'new_york_strip', 
            nombre: 'New York Strip', 
            precioPorKg: 520, 
            precioLb: 235.87,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.35,
            imagen: 'img/carrusel_products/ney_york_strip.png'
        },
        { 
            id: 'porterhouse', 
            nombre: 'Porterhouse', 
            precioPorKg: 580, 
            precioLb: 263.08,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.5,
            imagen: 'img/carrusel_products/porterhouse.png'
        },
        { 
            id: 'rib_eye', 
            nombre: 'Rib Eye', 
            precioPorKg: 550, 
            precioLb: 249.48,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.4,
            imagen: 'img/carrusel_products/rib-eye.png'
        },
        { 
            id: 'skirt_steak', 
            nombre: 'Skirt Steak', 
            precioPorKg: 420, 
            precioLb: 190.51,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.3,
            imagen: 'img/carrusel_products/skirt_steak.png'
        },
        { 
            id: 'tomahawk', 
            nombre: 'Tomahawk', 
            precioPorKg: 650, 
            precioLb: 294.64,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.8,
            imagen: 'img/carrusel_products/tomahawk.png'
        },
        { 
            id: 'top_sirloin', 
            nombre: 'Top Sirloin', 
            precioPorKg: 480, 
            precioLb: 217.72,
            categoria: 'premium', 
            tipo: 'corte', 
            basePeso: 0.35,
            imagen: 'img/carrusel_products/top_sirloin.png'
        }
    ],
    preparadas: [
        { 
            id: 'arrachera_marinada', 
            nombre: 'Arrachera Marinada de Res', 
            precioPorKg: 280, 
            precioLb: 127.0,
            categoria: 'preparadas', 
            tipo: 'kg',
            imagen: 'img/products/preparadas.png'
        },
        { 
            id: 'carne_pastor', 
            nombre: 'Carne de Pastor', 
            precioPorKg: 220, 
            precioLb: 99.79,
            categoria: 'preparadas', 
            tipo: 'kg',
            imagen: 'img/products/preparadas.png'
        },
        { 
            id: 'preparado_alambre', 
            nombre: 'Preparado de Alambre', 
            precioPorKg: 240, 
            precioLb: 108.86,
            categoria: 'preparadas', 
            tipo: 'kg',
            imagen: 'img/products/preparadas.png'
        },
        { 
            id: 'alitas_adobadas', 
            nombre: 'Alitas Adobadas', 
            precioPorKg: 180, 
            precioLb: 81.65,
            categoria: 'preparadas', 
            tipo: 'kg',
            imagen: 'img/products/preparadas.png'
        },
        { 
            id: 'filete_pollo_empanizado', 
            nombre: 'Filete de Pollo Empanizado', 
            precioPorKg: 160, 
            precioLb: 72.57,
            categoria: 'preparadas', 
            tipo: 'kg',
            imagen: 'img/products/preparadas.png'
        },
        { 
            id: 'milaneza_empanizada', 
            nombre: 'Milaneza Empanizada', 
            precioPorKg: 200, 
            precioLb: 90.72,
            categoria: 'preparadas', 
            tipo: 'kg',
            imagen: 'img/products/preparadas.png'
        },
        { 
            id: 'milaneza_premium', 
            nombre: 'Milaneza Premium (100% res)', 
            precioPorKg: 320, 
            precioLb: 145.15,
            categoria: 'preparadas', 
            tipo: 'kg',
            imagen: 'img/products/preparadas.png'
        }
    ],
    merch: [
        { 
            id: 'gorra_logo', 
            nombre: 'Gorra con Logo', 
            precioPorUnidad: 250, 
            categoria: 'merch', 
            tipo: 'unidad',
            imagen: 'img/products/merch.png'
        },
        { 
            id: 'playera_basica', 
            nombre: 'Playera Básica', 
            precioPorUnidad: 300, 
            categoria: 'merch', 
            tipo: 'unidad',
            imagen: 'img/products/merch.png'
        },
        { 
            id: 'playera_premium', 
            nombre: 'Playera Premium', 
            precioPorUnidad: 450, 
            categoria: 'merch', 
            tipo: 'unidad',
            imagen: 'img/products/merch.png'
        },
        { 
            id: 'delantal_cocinero', 
            nombre: 'Delantal de Cocinero', 
            precioPorUnidad: 350, 
            categoria: 'merch', 
            tipo: 'unidad',
            imagen: 'img/products/merch.png'
        },
        { 
            id: 'taza_ceramica', 
            nombre: 'Taza de Cerámica', 
            precioPorUnidad: 180, 
            categoria: 'merch', 
            tipo: 'unidad',
            imagen: 'img/products/merch.png'
        }
    ],
    otros: [
        { 
            id: 'huevo_campo', 
            nombre: 'Huevo de Campo', 
            precioPorKg: 80, 
            precioLb: 36.29,
            categoria: 'otros', 
            tipo: 'kg',
            imagen: 'img/products/otrosproductos.png'
        },
        { 
            id: 'queso_fresco', 
            nombre: 'Queso Fresco', 
            precioPorKg: 120, 
            precioLb: 54.43,
            categoria: 'otros', 
            tipo: 'kg',
            imagen: 'img/products/otrosproductos.png'
        },
        { 
            id: 'chorizo_verde', 
            nombre: 'Chorizo Verde', 
            precioPorKg: 140, 
            precioLb: 63.50,
            categoria: 'otros', 
            tipo: 'kg',
            imagen: 'img/products/otrosproductos.png'
        },
        { 
            id: 'manteca_cerdo', 
            nombre: 'Manteca de Cerdo', 
            precioPorKg: 90, 
            precioLb: 40.82,
            categoria: 'otros', 
            tipo: 'kg',
            imagen: 'img/products/otrosproductos.png'
        }
    ],
    ofertas: [
        { 
            id: 'paquete_familiar_res', 
            nombre: 'Paquete Familiar de Res', 
            precioPorPaquete: 1200, 
            categoria: 'ofertas', 
            tipo: 'paquete',
            imagen: 'img/products/premium.png'
        },
        { 
            id: 'paquete_parrilla', 
            nombre: 'Paquete Parrilla Completo', 
            precioPorPaquete: 1500, 
            categoria: 'ofertas', 
            tipo: 'paquete',
            imagen: 'img/products/premium.png'
        },
        { 
            id: 'combo_premium', 
            nombre: 'Combo Premium', 
            precioPorPaquete: 2000, 
            categoria: 'ofertas', 
            tipo: 'paquete',
            imagen: 'img/products/premium.png'
        },
        { 
            id: 'promo_martes', 
            nombre: 'Promoción Martes (20% descuento)', 
            precioPorKg: 144, 
            precioLb: 65.29,
            categoria: 'ofertas', 
            tipo: 'kg',
            imagen: 'img/products/premium.png'
        }
    ]
};

// Exponer datos globalmente para fallback cuando se carga como script (no módulo)
if (typeof window !== 'undefined') {
    window.productosData = productos;
}