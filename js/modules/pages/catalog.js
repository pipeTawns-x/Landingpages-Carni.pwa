// js/modules/catalog.js
import { productos } from '../../utils/base_dinamica.js';

console.log('📦 catalog.js CARGADO');
console.log('📦 Productos disponibles:', Object.keys(productos));

// Función para renderizar productos
function renderizarProductos(categoria) {
    console.log('🎨 Renderizando productos de:', categoria);
    
    const contenedor = document.getElementById(`productos-${categoria}`);
    if (!contenedor) {
        console.error('❌ Contenedor no encontrado: productos-' + categoria);
        return;
                    }
    
    const productosCategoria = productos[categoria];
    console.log('📦 Productos encontrados:', productosCategoria);
    
    if (!productosCategoria || productosCategoria.length === 0) {
        contenedor.innerHTML = '<div class="col-12"><p class="text-center text-muted py-5">No hay productos disponibles</p></div>';
        console.warn('⚠️ No hay productos para:', categoria);
            return;
        }

        let html = '';
    productosCategoria.forEach(producto => {
        // Corregir ruta de imagen
        let imagenSrc = producto.imagen || `../img/products/${categoria}.png`;
        if (imagenSrc.startsWith('img/')) {
            imagenSrc = '../' + imagenSrc;
    }

        // Precio
        let precioHtml = '';
        if (producto.tipo === 'unidad') {
            precioHtml = `<div class="precio-kg">$${producto.precioPorUnidad}/pieza</div>`;
        } else if (producto.tipo === 'paquete') {
            precioHtml = `<div class="precio-kg">$${producto.precioPorPaquete}/paquete</div>`;
        } else if (producto.precioPorKg) {
            const precioLb = producto.precioLb || (producto.precioPorKg / 2.20462).toFixed(2);
            precioHtml = `
                <div class="precio-kg">$${producto.precioPorKg}/kg</div>
                <div class="precio-lb text-muted">$${precioLb}/lb</div>
            `;
        }
        
        // Card HTML - Diseño del codepen
        html += `
            <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
                <div class="card product-card h-100 shadow-sm">
                    <img src="${imagenSrc}" 
                         alt="${producto.nombre}" 
                         class="card-img-top" 
                         style="height: 200px; object-fit: cover; width: 100%;"
                         onerror="this.src='../img/products/${categoria}.png'">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title mb-2">${producto.nombre}</h5>
                        <div class="precio-info mb-3">
                            ${precioHtml}
                        </div>
                        <button class="btn btn-danger mt-auto w-100" 
                                data-product-id="${producto.id}">
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
    console.log('✅ Renderizados', productosCategoria.length, 'productos en', categoria);
}

// Función para cambiar categoría
function cambiarCategoria(categoria) {
    console.log('🔄 Cambiando a:', categoria);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.categoria-productos').forEach(section => {
        section.classList.add('d-none');
        section.classList.remove('active');
    });
        
    // Actualizar botones
    document.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-categoria') === categoria) {
            btn.classList.add('active');
        }
    });

    // Mostrar sección seleccionada
    const seccion = document.getElementById(categoria);
    if (seccion) {
        seccion.classList.remove('d-none');
        seccion.classList.add('active');
        renderizarProductos(categoria);
    } else {
        console.error('❌ Sección no encontrada:', categoria);
    }
}

// Inicialización
function initCatalog() {
    console.log('🚀 === INICIALIZANDO CATÁLOGO ===');
    console.log('URL completa:', window.location.href);

    // Leer categoría de URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaFromUrl = urlParams.get('categoria');
    const categoriasValidas = ['res', 'cerdo', 'pollo', 'embutidos', 'preparadas', 'premium', 'merch', 'otros', 'ofertas'];
    const categoriaInicial = (categoriaFromUrl && categoriasValidas.includes(categoriaFromUrl)) ? categoriaFromUrl : 'res';
    
    console.log('🔍 Categoría de URL:', categoriaFromUrl);
    console.log('🔍 Categoría inicial:', categoriaInicial);
    
    // Verificar elementos del DOM
    const categoriaBtns = document.querySelectorAll('.categoria-btn');
    const categoriaProductos = document.querySelectorAll('.categoria-productos');
    
    console.log('📋 Botones encontrados:', categoriaBtns.length);
    console.log('📋 Secciones encontradas:', categoriaProductos.length);
    
    if (categoriaBtns.length === 0) {
        console.error('❌ ERROR: No se encontraron botones de categoría');
        return;
    }
    
    if (categoriaProductos.length === 0) {
        console.error('❌ ERROR: No se encontraron secciones de productos');
        return;
        }

    // Event listeners para botones
    categoriaBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const categoria = btn.getAttribute('data-categoria');
            console.log('👆 Click en botón:', categoria);
            cambiarCategoria(categoria);
        });
    });
    
    // Aplicar categoría inicial
    console.log('🎯 Aplicando categoría inicial:', categoriaInicial);
    cambiarCategoria(categoriaInicial);
}

// Ejecutar cuando el DOM esté listo - MÚLTIPLES INTENTOS
function ejecutarInit() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initCatalog, 200);
        });
    } else {
        setTimeout(initCatalog, 200);
        }
}

// Ejecutar inmediatamente y también después de un delay
ejecutarInit();
setTimeout(ejecutarInit, 500);
setTimeout(ejecutarInit, 1000);

// Exportar para uso global
window.catalogManager = {
    cambiarCategoria: cambiarCategoria,
    renderizarProductos: renderizarProductos,
    init: initCatalog
};

console.log('✅ catalog.js completamente cargado');
