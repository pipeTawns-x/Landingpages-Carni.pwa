// js/modules/premium.js
import { addToCart } from './cart.js';

export function initializePremiumPage() {
    const container = document.getElementById('premium-products-container');
    const loadingState = document.getElementById('loading-state');
    const priceFilter = document.getElementById('priceFilter');
    const searchInput = document.getElementById('searchProduct');

    if (!container) return;

    // Cargar productos premium
    loadPremiumProducts();

    // Event listeners para filtros
    if (priceFilter) {
        priceFilter.addEventListener('change', filterProducts);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    function loadPremiumProducts() {
        // Simular carga (en un caso real, esto vendría de una API)
        setTimeout(() => {
            if (loadingState) {
                loadingState.style.display = 'none';
            }
            renderProducts(productos.premium);
        }, 1000);
    }

    function renderProducts(products) {
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h3 class="mt-3">No se encontraron productos</h3>
                    <p class="text-muted">Intenta con otros filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        const productsHTML = products.map(product => `
            <div class="col-md-6 col-lg-4" data-product-id="${product.id}">
                <div class="card product-card h-100">
                    <div class="product-img-container">
                        <img src="img/products/${product.id}.png" class="card-img-top" alt="${product.nombre}" 
                             onerror="this.src='img/products/premium.png'">
                        <span class="badge bg-danger product-badge">Premium</span>
                    </div>
                    <div class="card-body">
                        <span class="product-category">CORTE PREMIUM</span>
                        <h5 class="card-title mt-1">${product.nombre}</h5>
                        <p class="card-text">${getProductDescription(product.nombre)}</p>
                        
                        <div class="product-details mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-muted">Peso aproximado:</span>
                                <span class="fw-bold">${product.basePeso ? product.basePeso + 'kg' : 'Por kg'}</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-1">
                                <span class="text-muted">Tipo:</span>
                                <span class="badge bg-secondary">${product.tipo}</span>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="product-price">
                                $${product.precioPorKg}/kg
                                ${product.basePeso ? 
                                    `<br><small class="text-muted">$${(product.precioPorKg * product.basePeso).toFixed(2)} c/u</small>` : 
                                    ''
                                }
                            </div>
                            <div class="rating">
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <span class="ms-1">(32)</span>
                            </div>
                        </div>
                        
                        <div class="product-actions mt-3">
                            <button class="btn btn-primary btn-product w-100" data-product='${JSON.stringify(product).replace(/'/g, "\\'")}'>
                                <i class="bi bi-cart-plus me-1"></i> Agregar al carrito
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = productsHTML;

        // Agregar event listeners a los botones
        container.querySelectorAll('.btn-product').forEach(btn => {
            btn.addEventListener('click', handleAddToCart);
        });
    }

    function handleAddToCart(event) {
        const btn = event.currentTarget;
        const productData = JSON.parse(btn.getAttribute('data-product'));
        
        // Calcular precio (para cortes premium, usamos precio por kg * basePeso si existe)
        let price = productData.precioPorKg;
        let quantityText = '1 kg';
        
        if (productData.basePeso) {
            price = productData.precioPorKg * productData.basePeso;
            quantityText = `${productData.basePeso} kg`;
        }
        
        addToCart(productData.nombre, price, quantityText);
        
        // Efecto visual
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Agregado';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = '<i class="bi bi-cart-plus me-1"></i> Agregar al carrito';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
            btn.disabled = false;
        }, 2000);
    }

    function filterProducts() {
        const priceValue = priceFilter ? priceFilter.value : 'all';
        const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
        
        let filteredProducts = [...productos.premium];
        
        // Filtrar por búsqueda
        if (searchValue) {
            filteredProducts = filteredProducts.filter(product => 
                product.nombre.toLowerCase().includes(searchValue)
            );
        }
        
        // Filtrar por precio
        if (priceValue !== 'all') {
            filteredProducts = filteredProducts.filter(product => {
                switch (priceValue) {
                    case 'low':
                        return product.precioPorKg < 450;
                    case 'medium':
                        return product.precioPorKg >= 450 && product.precioPorKg <= 550;
                    case 'high':
                        return product.precioPorKg > 550;
                    default:
                        return true;
                }
            });
        }
        
        renderProducts(filteredProducts);
    }
}

// Descripciones para productos premium
function getProductDescription(productName) {
    const descriptions = {
        'Bravette Steak': 'Corte jugoso y lleno de sabor, perfecto para la parrilla. Ideal para asados rápidos.',
        'Filet Mignon': 'El corte más tierno y exclusivo. Máxima suavidad y exquisitez en cada bocado.',
        'Flank Steak': 'Corte magro y sabroso, perfecto para marinar. Excelente para fajitas y tacos.',
        'New York Strip': 'Corte bien marmoleado con un equilibrio perfecto entre ternura y sabor intenso.',
        'Porterhouse': 'Combina la suavidad del filet mignon con el sabor del New York strip en un solo corte.',
        'Rib Eye': 'Extremadamente jugoso gracias a su marmoleo natural. Sabor intenso y textura incomparable.',
        'Skirt Steak': 'Corte delgado y lleno de sabor, perfecto para marinar y asar a la perfección.',
        'Tomahawk': 'Corte espectacular con hueso. Impresionante presentación y sabor extraordinario.',
        'Top Sirloin': 'Corte versátil y sabroso, balance perfecto entre calidad y precio.'
    };
    
    return descriptions[productName] || 'Corte premium de alta calidad, seleccionado cuidadosamente para garantizar la mejor experiencia gastronómica.';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializePremiumPage);