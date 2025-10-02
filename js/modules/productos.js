import { productos } from './base_dinamica.js';

class ProductosManager {
    constructor() {
        this.init();
        this.carrito = [];
    }

    init() {
        this.initializeTabs();
        this.loadProducts();
        this.setupEventListeners();
        this.setupFilters();
    }

    initializeTabs() {
        const tabs = document.querySelectorAll('#productTabs .nav-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleTabChange(tab);
            });
        });
    }

    handleTabChange(selectedTab) {
        // Remove active class from all tabs
        document.querySelectorAll('#productTabs .nav-link').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to selected tab
        selectedTab.classList.add('active');
        
        // Show corresponding content
        const targetId = selectedTab.getAttribute('data-bs-target').substring(1);
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
        });
        document.getElementById(targetId).classList.add('show', 'active');
    }

    loadProducts() {
        this.loadCategories();
        this.loadFeaturedProducts();
        this.loadOffers();
    }

    loadCategories() {
        const container = document.getElementById('categoriesContainer');
        const categories = Object.keys(productos);
        
        container.innerHTML = categories.map(category => `
            <div class="col-md-4 mb-4">
                <div class="producto-card" data-category="${category}">
                    <img src="img/products/${category}.png" alt="${category}" class="producto-img">
                    <div class="producto-info">
                        <h3 class="text-capitalize">${category}</h3>
                        <p>${this.getCategoryDescription(category)}</p>
                        <button class="btn btn-primary w-100" onclick="showCategoryProducts('${category}')">
                            Ver productos
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getCategoryDescription(category) {
        const descriptions = {
            res: 'Los mejores cortes de res premium seleccionados.',
            pollo: 'Variedad de cortes de pollo fresco.',
            cerdo: 'Selectos cortes de cerdo de primera calidad.',
            embutidos: 'Embutidos artesanales y productos procesados.',
            premium: 'Cortes especiales y premium para ocasiones especiales.',
            preparadas: 'Carnes marinadas y preparadas listas para cocinar.'
        };
        return descriptions[category] || 'Productos seleccionados de calidad';
    }

    loadFeaturedProducts() {
        const container = document.getElementById('featuredContainer');
        const featuredProducts = this.getFeaturedProducts();
        
        container.innerHTML = featuredProducts.map(product => this.createProductCard(product)).join('');
    }

    getFeaturedProducts() {
        // Seleccionar productos destacados de diferentes categorías
        return Object.values(productos)
            .flat()
            .filter(product => product.destacado)
            .slice(0, 6);
    }

    loadOffers() {
        const container = document.getElementById('offersContainer');
        const offers = this.getOffers();
        
        container.innerHTML = offers.map(product => this.createProductCard(product, true)).join('');
    }

    getOffers() {
        // Seleccionar productos en oferta
        return Object.values(productos)
            .flat()
            .filter(product => product.oferta)
            .slice(0, 6);
    }

    createProductCard(product, showDiscount = false) {
        const precio = product.precioPorKg || product.precioPorUnidad || product.precioPorPaquete;
        const precioOriginal = showDiscount ? precio * 1.2 : null;
        
        return `
            <div class="col-md-4 mb-4">
                <div class="producto-card" data-product-id="${product.id}">
                    <div class="position-relative">
                        <img src="img/products/${product.categoria}/${product.id}.png" 
                             alt="${product.nombre}" 
                             class="producto-img">
                        ${showDiscount ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2">-20%</span>' : ''}
                    </div>
                    <div class="producto-info">
                        <h3>${product.nombre}</h3>
                        <div class="precio-container">
                            ${showDiscount ? `<del class="text-muted">$${precioOriginal.toFixed(2)}</del>` : ''}
                            <div class="precio">$${precio.toFixed(2)} ${this.getUnitLabel(product)}</div>
                        </div>
                        <button class="btn btn-primary w-100 mt-3" onclick="showProductModal('${product.id}')">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getUnitLabel(product) {
        switch(product.tipo) {
            case 'kg': return '/kg';
            case 'unidad': return '/pieza';
            case 'paquete': return '/paquete';
            case 'corte': return '/kg';
            default: return '';
        }
    }

    setupFilters() {
        const searchInput = document.getElementById('searchProducts');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');

        searchInput.addEventListener('input', () => this.applyFilters());
        categoryFilter.addEventListener('change', () => this.applyFilters());
        sortFilter.addEventListener('change', () => this.applyFilters());
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortFilter').value;

        let filteredProducts = this.getAllProducts();

        // Apply category filter
        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.categoria === category);
        }

        // Apply search filter
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.nombre.toLowerCase().includes(searchTerm) ||
                product.categoria.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        filteredProducts.sort((a, b) => {
            const priceA = a.precioPorKg || a.precioPorUnidad || a.precioPorPaquete;
            const priceB = b.precioPorKg || b.precioPorUnidad || b.precioPorPaquete;

            switch(sortBy) {
                case 'price-asc':
                    return priceA - priceB;
                case 'price-desc':
                    return priceB - priceA;
                default:
                    return a.nombre.localeCompare(b.nombre);
            }
        });

        this.displayFilteredProducts(filteredProducts);
    }

    displayFilteredProducts(products) {
        const container = document.querySelector('.tab-pane.active .row');
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-emoji-frown display-4"></i>
                    <p class="mt-3">No se encontraron productos que coincidan con tu búsqueda.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }

    getAllProducts() {
        return Object.values(productos).flat();
    }
}

// Initialize the products manager
const productosManager = new ProductosManager();
export default productosManager;