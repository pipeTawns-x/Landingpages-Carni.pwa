// js/modules/catalog.js
import { productos } from './base_dinamica.js';

export class CatalogManager {
    constructor() {
        this.currentProduct = null;
        this.setupEventListeners();
        this.loadInitialProducts();
    }

    setupEventListeners() {
        // Manejo de cambio de categorías
        document.addEventListener('DOMContentLoaded', () => {
            const categoriaBtns = document.querySelectorAll('.categoria-btn');
            const categoriaProductos = document.querySelectorAll('.categoria-productos');
            
            categoriaBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remover clase active de todos los botones
                    categoriaBtns.forEach(b => b.classList.remove('active'));
                    // Añadir clase active al botón clickeado
                    btn.classList.add('active');
                    
                    // Obtener la categoría seleccionada
                    const categoria = btn.getAttribute('data-categoria');
                    
                    // Ocultar todas las categorías de productos
                    categoriaProductos.forEach(prod => {
                        prod.classList.add('d-none');
                        prod.classList.remove('active');
                    });
                    
                    // Mostrar la categoría seleccionada
                    const categoriaSeleccionada = document.getElementById(categoria);
                    if (categoriaSeleccionada) {
                        categoriaSeleccionada.classList.remove('d-none');
                        categoriaSeleccionada.classList.add('active');
                        
                        // Cargar productos de la categoría
                        this.loadCategoryProducts(categoria);
                    }
                });
            });

            // Cargar productos iniciales
            this.loadCategoryProducts('res');
        });

        // Manejo del modal de productos
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('personalizar-btn')) {
                const productId = e.target.getAttribute('data-product-id');
                const categoria = e.target.getAttribute('data-categoria');
                this.openProductModal(productId, categoria);
            }
        });

        // Configurar eventos del modal
        this.setupModalEvents();
    }

    loadInitialProducts() {
        // Cargar productos de res por defecto
        this.loadCategoryProducts('res');
    }

    loadCategoryProducts(categoria) {
        const contenedor = document.getElementById(`productos-${categoria}`);
        if (!contenedor) return;

        // Mostrar loading
        contenedor.innerHTML = this.getLoadingHTML();

        // Simular delay de carga
        setTimeout(() => {
            const productosCategoria = productos[categoria] || [];
            this.renderProducts(contenedor, productosCategoria, categoria);
        }, 500);
    }

    renderProducts(container, productosList, categoria) {
        if (productosList.length === 0) {
            container.innerHTML = this.getNoProductsHTML();
            return;
        }

        let html = '';
        productosList.forEach(producto => {
            html += this.createProductCardHTML(producto, categoria);
        });
        
        container.innerHTML = html;
    }

    createProductCardHTML(producto, categoria) {
        const precioHtml = this.getPriceHTML(producto);
        
        return `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="card product-card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="product-name">${producto.nombre}</h5>
                        <div class="precio-info mb-2">
                            ${precioHtml}
                        </div>
                        <button class="btn btn-outline-primary personalizar-btn mt-auto" 
                                data-product-id="${producto.id}" 
                                data-categoria="${categoria}">
                            Haz clic para personalizar tu pedido
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getPriceHTML(producto) {
        if (producto.tipo === 'unidad') {
            return `<div class="precio-kg">$${producto.precioPorUnidad}/pieza</div>`;
        } else if (producto.tipo === 'paquete') {
            return `<div class="precio-kg">$${producto.precioPorPaquete}/paquete</div>`;
        } else {
            return `
                <div class="precio-kg">$${producto.precioPorKg}/kg</div>
                <div class="precio-lb">$${producto.precioLb}/lb</div>
            `;
        }
    }

    openProductModal(productId, categoria) {
        const producto = productos[categoria].find(p => p.id === productId);
        if (!producto) return;
        
        this.currentProduct = producto;
        this.updateModalContent(producto);
        
        const productoModal = new bootstrap.Modal(document.getElementById('productoModal'));
        productoModal.show();
    }

    updateModalContent(producto) {
        // Actualizar información básica del producto
        document.querySelector('.product-name').textContent = producto.nombre;
        document.querySelector('.precio-valor').textContent = producto.precioPorKg || producto.precioPorUnidad || producto.precioPorPaquete;
        document.querySelector('.precio-lb-valor').textContent = producto.precioLb || 'N/A';
        
        // Actualizar imagen si existe
        const productImage = document.querySelector('.product-image');
        if (producto.imagen && productImage) {
            productImage.src = producto.imagen;
            productImage.alt = producto.nombre;
        }

        // Configurar el botón de agregar al carrito
        const addToCartBtn = document.getElementById('addToCartBtn');
        addToCartBtn.onclick = () => this.addToCart(producto);
    }

    setupModalEvents() {
        // Manejar cambios en el tipo de pedido
        document.querySelectorAll('input[name="tipoPedido"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleQuantityInputs(e.target.value);
                this.updateOrderSummary();
            });
        });

        // Manejar cambios en cantidades
        document.getElementById('cantidadPeso')?.addEventListener('input', () => this.updateOrderSummary());
        document.getElementById('unidadPeso')?.addEventListener('change', () => this.updateOrderSummary());
        document.getElementById('cantidadPrecio')?.addEventListener('input', () => this.updateOrderSummary());
        document.getElementById('cantidadPiezas')?.addEventListener('input', () => this.updateOrderSummary());
        document.getElementById('preparacion')?.addEventListener('change', () => this.updateOrderSummary());

        // Botones de incremento/decremento
        document.getElementById('increasePeso')?.addEventListener('click', () => this.adjustQuantity('peso', 0.1));
        document.getElementById('decreasePeso')?.addEventListener('click', () => this.adjustQuantity('peso', -0.1));
        document.getElementById('increasePieces')?.addEventListener('click', () => this.adjustQuantity('piezas', 1));
        document.getElementById('decreasePieces')?.addEventListener('click', () => this.adjustQuantity('piezas', -1));
    }

    toggleQuantityInputs(tipo) {
        document.getElementById('pesoCantidad').style.display = tipo === 'peso' ? 'block' : 'none';
        document.getElementById('precioCantidad').style.display = tipo === 'precio' ? 'block' : 'none';
        document.getElementById('piezasCantidad').style.display = tipo === 'piezas' ? 'block' : 'none';
    }

    adjustQuantity(tipo, cambio) {
        if (tipo === 'peso') {
            const input = document.getElementById('cantidadPeso');
            let valor = parseFloat(input.value) || 0;
            valor = Math.max(0.1, valor + cambio);
            input.value = valor.toFixed(1);
        } else if (tipo === 'piezas') {
            const input = document.getElementById('cantidadPiezas');
            let valor = parseInt(input.value) || 0;
            valor = Math.max(1, valor + cambio);
            input.value = valor;
        }
        this.updateOrderSummary();
    }

    updateOrderSummary() {
        if (!this.currentProduct) return;

        const tipoPedido = document.querySelector('input[name="tipoPedido"]:checked').value;
        let cantidad, unidad, total, resumen;

        if (tipoPedido === 'peso') {
            cantidad = parseFloat(document.getElementById('cantidadPeso').value) || 0;
            unidad = document.getElementById('unidadPeso').value;
            
            // Convertir a kg para cálculo
            let cantidadKg = cantidad;
            if (unidad === 'lb') {
                cantidadKg = cantidad / 2.20462;
            } else if (unidad === 'g') {
                cantidadKg = cantidad / 1000;
            }
            
            total = cantidadKg * this.currentProduct.precioPorKg;
            resumen = `${cantidad} ${unidad}`;
        } else if (tipoPedido === 'precio') {
            const monto = parseFloat(document.getElementById('cantidadPrecio').value) || 0;
            const cantidadKg = monto / this.currentProduct.precioPorKg;
            total = monto;
            resumen = `$${monto.toFixed(2)} (${cantidadKg.toFixed(2)} kg)`;
        } else if (tipoPedido === 'piezas') {
            cantidad = parseInt(document.getElementById('cantidadPiezas').value) || 0;
            total = cantidad * (this.currentProduct.precioPorUnidad || this.currentProduct.precioPorPaquete);
            resumen = `${cantidad} pieza(s)`;
        }

        // Aplicar recargo por preparación premium
        const preparacion = document.getElementById('preparacion').value;
        if (preparacion === 'premium') {
            total *= 1.2;
            resumen += ' + preparación premium';
        }

        // Actualizar UI
        document.getElementById('resumenPedido').textContent = `${resumen} de ${this.currentProduct.nombre}`;
        document.getElementById('totalPedido').textContent = total.toFixed(2);
    }

    addToCart(producto) {
        const tipoPedido = document.querySelector('input[name="tipoPedido"]:checked').value;
        const preparacion = document.getElementById('preparacion').value;
        const instrucciones = document.getElementById('instrucciones').value;

        let quantity, price, customizations = {};

        if (tipoPedido === 'peso') {
            quantity = parseFloat(document.getElementById('cantidadPeso').value) || 0;
            const unidad = document.getElementById('unidadPeso').value;
            price = producto.precioPorKg;
            customizations = { tipo: 'peso', cantidad: quantity, unidad, preparacion, instrucciones };
        } else if (tipoPedido === 'precio') {
            const monto = parseFloat(document.getElementById('cantidadPrecio').value) || 0;
            quantity = monto / producto.precioPorKg;
            price = producto.precioPorKg;
            customizations = { tipo: 'precio', monto, preparacion, instrucciones };
        } else if (tipoPedido === 'piezas') {
            quantity = parseInt(document.getElementById('cantidadPiezas').value) || 0;
            price = producto.precioPorUnidad || producto.precioPorPaquete;
            customizations = { tipo: 'piezas', cantidad: quantity, preparacion, instrucciones };
        }

        if (window.cartManager) {
            window.cartManager.addItem({
                id: producto.id,
                name: producto.nombre,
                price: price,
                image: producto.imagen
            }, quantity, customizations);

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('productoModal'));
            modal.hide();
        }
    }

    getLoadingHTML() {
        return `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando productos...</span>
                </div>
                <p class="mt-2">Cargando productos...</p>
            </div>
        `;
    }

    getNoProductsHTML() {
        return `
            <div class="col-12 text-center">
                <i class="bi bi-box-seam fs-1 text-muted"></i>
                <p class="mt-3">No hay productos disponibles en esta categoría.</p>
            </div>
        `;
    }
}

// Inicializar el catálogo cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.catalogManager = new CatalogManager();
});