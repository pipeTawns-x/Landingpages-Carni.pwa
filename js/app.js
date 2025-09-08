// ==========================================================================
// APP.JS - JavaScript Principal - Carnicería El Señor de La Misericordia
// ==========================================================================

/**
 * Aplicación principal para la carnicería
 * Maneja toda la lógica del frontend
 */
class CarniceriaApp {
    constructor() {
        this.cart = new Map();
        this.weatherData = null;
        this.loyaltyPoints = 0;
        
        this.init();
    }
    
    /**
     * Inicializa la aplicación
     */
    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }
    
    /**
     * Se ejecuta cuando el DOM está listo
     */
    onDOMReady() {
        console.log('🥩 Carnicería El Señor de La Misericordia - Aplicación iniciada');
        
        this.initializeComponents();
        this.bindEvents();
        this.initializeWeather();
        this.checkOnlineStatus();
        this.initializeAnimations();
    }
    
    /**
     * Inicializa todos los componentes
     */
    initializeComponents() {
        this.initializeHeader();
        this.initializeCarousel();
        this.initializeSearch();
        this.initializeCart();
        this.initializeLoyalty();
        this.initializeContactForm();
        this.initializeProductCards();
    }
    
    /**
     * Inicializa el header
     */
    initializeHeader() {
        // Header sticky behavior
        const header = document.querySelector('.main-header');
        if (header) {
            let lastScrollY = window.scrollY;
            
            window.addEventListener('scroll', () => {
                const currentScrollY = window.scrollY;
                
                if (currentScrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                
                // Hide/show header on scroll
                if (currentScrollY > lastScrollY && currentScrollY > 200) {
                    header.style.transform = 'translateY(-100%)';
                } else {
                    header.style.transform = 'translateY(0)';
                }
                
                lastScrollY = currentScrollY;
            });
        }
    }
    
    /**
     * Inicializa el carrusel principal
     */
    initializeCarousel() {
        const carousel = document.querySelector('#heroCarousel');
        if (carousel) {
            const carouselInstance = new bootstrap.Carousel(carousel, {
                interval: 5000,
                wrap: true,
                touch: true
            });
            
            // Progress bar animation
            const progressBar = carousel.querySelector('.progress-bar');
            let progressInterval;
            
            const startProgress = () => {
                if (progressBar) {
                    progressBar.style.width = '0%';
                    progressBar.style.transition = 'width 5s linear';
                    // Small delay to ensure transition applies
                    setTimeout(() => {
                        progressBar.style.width = '100%';
                    }, 50);
                }
            };
            
            const resetProgress = () => {
                if (progressBar) {
                    progressBar.style.transition = 'none';
                    progressBar.style.width = '0%';
                }
            };
            
            // Start progress on page load
            startProgress();
            
            // Handle slide events
            carousel.addEventListener('slide.bs.carousel', (event) => {
                resetProgress();
                
                // Add slide-out animation to current slide
                const activeSlide = carousel.querySelector('.carousel-item.active');
                if (activeSlide) {
                    activeSlide.style.transform = 'translateX(-100%)';
                    activeSlide.style.transition = 'transform 0.6s ease-in-out';
                }
            });
            
            carousel.addEventListener('slid.bs.carousel', (event) => {
                // Reset previous slide
                const allSlides = carousel.querySelectorAll('.carousel-item');
                allSlides.forEach(slide => {
                    slide.style.transform = '';
                    slide.style.transition = '';
                });
                
                // Start progress for new slide
                setTimeout(startProgress, 100);
                
                // Trigger content animations
                this.animateSlideContent(event.relatedTarget);
            });
            
            // Pause on hover
            carousel.addEventListener('mouseenter', () => {
                carouselInstance.pause();
                if (progressBar) {
                    progressBar.style.animationPlayState = 'paused';
                }
            });
            
            carousel.addEventListener('mouseleave', () => {
                carouselInstance.cycle();
                if (progressBar) {
                    progressBar.style.animationPlayState = 'running';
                }
            });
            
            // Touch/swipe support enhancement
            let startX = 0;
            let startY = 0;
            let endX = 0;
            let endY = 0;
            
            carousel.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });
            
            carousel.addEventListener('touchend', (e) => {
                endX = e.changedTouches[0].clientX;
                endY = e.changedTouches[0].clientY;
                
                const deltaX = startX - endX;
                const deltaY = startY - endY;
                
                // Only handle horizontal swipes
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                        // Swipe left - next slide
                        carouselInstance.next();
                    } else {
                        // Swipe right - previous slide
                        carouselInstance.prev();
                    }
                }
            }, { passive: true });
            
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    carouselInstance.prev();
                } else if (e.key === 'ArrowRight') {
                    carouselInstance.next();
                }
            });
            
            // Indicator click enhancement
            const indicators = carousel.querySelectorAll('[data-bs-target]');
            indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    carouselInstance.to(index);
                });
            });
        }
    }
    
    /**
     * Anima el contenido del slide activo
     */
    animateSlideContent(activeSlide) {
        if (!activeSlide) return;
        
        const elements = {
            badge: activeSlide.querySelector('.product-badge'),
            title: activeSlide.querySelector('.slide-title'),
            description: activeSlide.querySelector('.slide-description'),
            price: activeSlide.querySelector('.price-container'),
            button: activeSlide.querySelector('.cta-button')
        };
        
        // Reset all animations
        Object.values(elements).forEach(el => {
            if (el) {
                el.style.animation = 'none';
                el.style.opacity = '0';
                el.style.transform = 'translateY(50px)';
            }
        });
        
        // Trigger animations with delays
        const animations = [
            { el: elements.badge, delay: 200, animation: 'fadeInUp 0.8s ease-out forwards' },
            { el: elements.title, delay: 400, animation: 'titleSlideIn 1.2s ease-out forwards' },
            { el: elements.description, delay: 600, animation: 'fadeInUp 1s ease-out forwards' },
            { el: elements.price, delay: 800, animation: 'priceGlow 1.5s ease-out forwards' },
            { el: elements.button, delay: 1000, animation: 'buttonSlideIn 1.2s ease-out forwards' }
        ];
        
        animations.forEach(({ el, delay, animation }) => {
            if (el) {
                setTimeout(() => {
                    el.style.animation = animation;
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, delay);
            }
        });
    }
    
    /**
     * Inicializa la funcionalidad de búsqueda
     */
    initializeSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const searchBar = document.getElementById('searchBar');
        const searchInput = document.getElementById('searchInput');
        const searchSubmit = document.getElementById('searchSubmit');
        
        if (searchBtn && searchBar) {
            searchBtn.addEventListener('click', () => {
                searchBar.classList.toggle('d-none');
                if (!searchBar.classList.contains('d-none')) {
                    searchInput?.focus();
                }
            });
        }
        
        if (searchInput) {
            // Búsqueda en tiempo real
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
            
            // Búsqueda al presionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(searchInput.value);
                }
            });
        }
        
        if (searchSubmit) {
            searchSubmit.addEventListener('click', () => {
                this.performSearch(searchInput?.value || '');
            });
        }
    }
    
    /**
     * Realiza una búsqueda
     */
    performSearch(query) {
        if (!query.trim()) return;
        
        console.log('Buscando:', query);
        
        // Filtrar productos visibles
        const productCards = document.querySelectorAll('.product-card');
        let visibleCount = 0;
        
        productCards.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const category = card.querySelector('.product-category')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.card-text')?.textContent.toLowerCase() || '';
            
            const searchTerm = query.toLowerCase();
            const isMatch = title.includes(searchTerm) || 
                           category.includes(searchTerm) || 
                           description.includes(searchTerm);
            
            const cardContainer = card.closest('.col-md-6, .col-lg-4');
            if (cardContainer) {
                if (isMatch) {
                    cardContainer.style.display = '';
                    card.classList.add('search-highlight');
                    visibleCount++;
                } else {
                    cardContainer.style.display = 'none';
                    card.classList.remove('search-highlight');
                }
            }
        });
        
        // Actualizar contador de resultados
        const resultsCount = document.querySelector('.results-count');
        if (resultsCount) {
            resultsCount.textContent = `Mostrando ${visibleCount} producto${visibleCount !== 1 ? 's' : ''}`;
        }
        
        // Mostrar mensaje si no hay resultados
        if (visibleCount === 0) {
            this.showNotification('No se encontraron productos que coincidan con tu búsqueda', 'info');
        }
    }
    
    /**
     * Inicializa el carrito de compras
     */
    initializeCart() {
        const cartBtn = document.getElementById('cartBtn');
        const cartCounter = document.querySelector('.cart-counter');
        
        // Botones de agregar al carrito
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-to-cart, .add-to-cart-hero')) {
                e.preventDefault();
                this.addToCart(e.target);
            }
        });
        
        // Click en botón del carrito
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.showCartModal();
            });
        }
        
        // Actualizar contador inicial
        this.updateCartCounter();
    }
    
    /**
     * Agrega un producto al carrito
     */
    addToCart(button) {
        const productData = this.extractProductData(button);
        
        if (this.cart.has(productData.id)) {
            this.cart.get(productData.id).quantity += 1;
        } else {
            this.cart.set(productData.id, {
                ...productData,
                quantity: 1
            });
        }
        
        this.updateCartCounter();
        this.showNotification(`${productData.name} agregado al carrito`, 'success');
        
        // Efecto visual en el botón
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }
    
    /**
     * Extrae datos del producto desde el DOM
     */
    extractProductData(button) {
        const productCard = button.closest('.product-card, .carousel-item');
        
        if (button.classList.contains('add-to-cart-hero')) {
            // Producto del carrusel
            const title = productCard.querySelector('.hero-title')?.textContent || 'Producto';
            const priceText = productCard.querySelector('.price-amount')?.textContent || '0';
            const price = parseInt(priceText.replace(/\D/g, '')) || 0;
            
            return {
                id: title.toLowerCase().replace(/\s+/g, '-'),
                name: title,
                price: price,
                image: productCard.querySelector('.hero-slide')?.style.backgroundImage || '',
                category: 'Premium'
            };
        } else {
            // Producto de la sección de productos
            const title = productCard.querySelector('.card-title')?.textContent || 'Producto';
            const priceText = productCard.querySelector('.product-price')?.textContent || '0';
            const price = parseInt(priceText.replace(/\D/g, '')) || 0;
            const image = productCard.querySelector('.card-img-top')?.src || '';
            const category = productCard.querySelector('.product-category')?.textContent || 'General';
            
            return {
                id: button.dataset.product || title.toLowerCase().replace(/\s+/g, '-'),
                name: title,
                price: price,
                image: image,
                category: category
            };
        }
    }
    
    /**
     * Actualiza el contador del carrito
     */
    updateCartCounter() {
        const counter = document.querySelector('.cart-counter');
        const totalItems = Array.from(this.cart.values()).reduce((sum, item) => sum + item.quantity, 0);
        
        if (counter) {
            counter.textContent = totalItems;
            counter.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }
    
    /**
     * Muestra el modal del carrito
     */
    showCartModal() {
        // Crear modal dinámicamente si no existe
        let cartModal = document.getElementById('cartModal');
        
        if (!cartModal) {
            cartModal = this.createCartModal();
            document.body.appendChild(cartModal);
        }
        
        this.updateCartModalContent();
        
        const modal = new bootstrap.Modal(cartModal);
        modal.show();
    }
    
    /**
     * Crea el modal del carrito
     */
    createCartModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'cartModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-cart me-2"></i>Carrito de Compras
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="cartModalBody">
                        <!-- Contenido dinámico -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="checkoutBtn">Proceder al Pago</button>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    /**
     * Actualiza el contenido del modal del carrito
     */
    updateCartModalContent() {
        const modalBody = document.getElementById('cartModalBody');
        if (!modalBody) return;
        
        if (this.cart.size === 0) {
            modalBody.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-cart-x display-1 text-muted"></i>
                    <h4 class="mt-3">Tu carrito está vacío</h4>
                    <p class="text-muted">Agrega algunos productos deliciosos para comenzar</p>
                </div>
            `;
            return;
        }
        
        let total = 0;
        let cartHTML = '<div class="cart-items">';
        
        for (const [id, item] of this.cart) {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            cartHTML += `
                <div class="cart-item d-flex align-items-center mb-3 p-3 border rounded">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img me-3" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                    <div class="cart-item-info flex-grow-1">
                        <h6 class="mb-1">${item.name}</h6>
                        <small class="text-muted">${item.category}</small>
                        <div class="mt-1">
                            <span class="fw-bold">${item.price}/kg</span>
                        </div>
                    </div>
                    <div class="cart-item-controls d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.updateCartQuantity('${id}', -1)">-</button>
                        <span class="mx-2">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.updateCartQuantity('${id}', 1)">+</button>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="app.removeFromCart('${id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <div class="cart-item-total ms-3">
                        <strong>${itemTotal}</strong>
                    </div>
                </div>
            `;
        }
        
        cartHTML += `</div>
            <div class="cart-total border-top pt-3 mt-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h5>Total: <strong>${total}</strong></h5>
                </div>
            </div>`;
        
        modalBody.innerHTML = cartHTML;
    }
    
    /**
     * Actualiza la cantidad de un producto en el carrito
     */
    updateCartQuantity(productId, change) {
        if (this.cart.has(productId)) {
            const item = this.cart.get(productId);
            item.quantity += change;
            
            if (item.quantity <= 0) {
                this.cart.delete(productId);
            }
            
            this.updateCartCounter();
            this.updateCartModalContent();
        }
    }
    
    /**
     * Elimina un producto del carrito
     */
    removeFromCart(productId) {
        if (this.cart.has(productId)) {
            const item = this.cart.get(productId);
            this.cart.delete(productId);
            
            this.updateCartCounter();
            this.updateCartModalContent();
            this.showNotification(`${item.name} eliminado del carrito`, 'info');
        }
    }
    
    /**
     * Inicializa el programa de fidelidad
     */
    initializeLoyalty() {
        const loyaltyBtn = document.getElementById('loyaltyBtn');
        const loyaltyModal = document.getElementById('loyaltyModal');
        
        if (loyaltyBtn) {
            loyaltyBtn.addEventListener('click', () => {
                this.loadLoyaltyContent();
                const modal = new bootstrap.Modal(loyaltyModal);
                modal.show();
            });
        }
    }
    
    /**
     * Carga el contenido del programa de fidelidad
     */
    loadLoyaltyContent() {
        const loyaltyContent = document.getElementById('loyaltyContent');
        if (!loyaltyContent) return;
        
        // Simular carga
        setTimeout(() => {
            loyaltyContent.innerHTML = `
                <div class="loyalty-program">
                    <div class="text-center mb-4">
                        <i class="bi bi-star-fill display-1 text-warning"></i>
                        <h4 class="mt-3">Programa de Fidelidad</h4>
                        <p class="text-muted">Acumula puntos con cada compra y obtén beneficios exclusivos</p>
                    </div>
                    
                    <div class="loyalty-points mb-4">
                        <div class="progress mb-2">
                            <div class="progress-bar bg-warning" role="progressbar" style="width: 35%"></div>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Puntos actuales: <strong>${this.loyaltyPoints}</strong></span>
                            <span>Próximo nivel: 1000 puntos</span>
                        </div>
                    </div>
                    
                    <div class="loyalty-benefits">
                        <h5 class="mb-3">Beneficios por nivel</h5>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <div class="benefit-card p-3 border rounded text-center">
                                    <i class="bi bi-bronze-medal fs-1 text-warning"></i>
                                    <h6 class="mt-2">Bronce</h6>
                                    <small>5% descuento</small>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="benefit-card p-3 border rounded text-center">
                                    <i class="bi bi-silver-medal fs-1 text-secondary"></i>
                                    <h6 class="mt-2">Plata</h6>
                                    <small>10% descuento</small>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="benefit-card p-3 border rounded text-center">
                                    <i class="bi bi-gold-medal fs-1 text-warning"></i>
                                    <h6 class="mt-2">Oro</h6>
                                    <small>15% descuento</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }, 1500);
    }
    
    /**
     * Inicializa el formulario de contacto
     */
    initializeContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;
        
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // Validación
            if (!this.validateContactForm(data)) {
                return;
            }
            
            // Simular envío
            this.submitContactForm(data);
        });
    }
    
    /**
     * Valida el formulario de contacto
     */
    validateContactForm(data) {
        let isValid = true;
        const errors = [];
        
        if (!data.name?.trim()) {
            errors.push('El nombre es requerido');
            isValid = false;
        }
        
        if (!data.email?.trim()) {
            errors.push('El email es requerido');
            isValid = false;
        } else if (!this.isValidEmail(data.email)) {
            errors.push('El email no es válido');
            isValid = false;
        }
        
        if (!data.message?.trim()) {
            errors.push('El mensaje es requerido');
            isValid = false;
        }
        
        if (!isValid) {
            this.showNotification(errors.join('<br>'), 'danger');
        }
        
        return isValid;
    }
    
    /**
     * Valida formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Envía el formulario de contacto
     */
    submitContactForm(data) {
        const submitBtn = document.querySelector('#contactForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Loading state
        submitBtn.innerHTML = '<i class="bi bi-spinner-border spinner-border-sm me-2"></i>Enviando...';
        submitBtn.disabled = true;
        
        // Simular envío
        setTimeout(() => {
            console.log('Formulario enviado:', data);
            
            this.showNotification('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
            
            // Reset form
            document.getElementById('contactForm').reset();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }
    
    /**
     * Inicializa las tarjetas de producto
     */
    initializeProductCards() {
        // Vista rápida de productos
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quick-view-btn')) {
                const productId = e.target.dataset.product;
                this.showQuickView(productId);
            }
        });
        
        // Cambio de vista (grid/list)
        const viewButtons = document.querySelectorAll('.view-btn');
        const catalogGrid = document.querySelector('.catalog-grid');
        
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewType = button.dataset.view;
                
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                catalogGrid.classList.remove('grid-view', 'list-view');
                catalogGrid.classList.add(`${viewType}-view`);
            });
        });
        
        // Ordenamiento
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortProducts(e.target.value);
            });
        }
    }
    
    /**
     * Muestra vista rápida del producto
     */
    showQuickView(productId) {
        // Crear modal de vista rápida si no existe
        let quickViewModal = document.getElementById('quickViewModal');
        
        if (!quickViewModal) {
            quickViewModal = this.createQuickViewModal();
            document.body.appendChild(quickViewModal);
        }
        
        // Cargar contenido del producto
        this.loadQuickViewContent(productId);
        
        const modal = new bootstrap.Modal(quickViewModal);
        modal.show();
    }
    
    /**
     * Crea el modal de vista rápida
     */
    createQuickViewModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'quickViewModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Vista Rápida</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="quickViewBody">
                        <div class="text-center py-4">
                            <div class="spinner-border" role="status"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }
    
    /**
     * Carga contenido de vista rápida
     */
    loadQuickViewContent(productId) {
        const quickViewBody = document.getElementById('quickViewBody');
        if (!quickViewBody) return;
        
        // Simular carga de datos del producto
        setTimeout(() => {
            quickViewBody.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <img src="img/products/res.png" class="img-fluid rounded" alt="Producto">
                    </div>
                    <div class="col-md-6">
                        <h4>Carne de Res Premium</h4>
                        <div class="rating mb-3">
                            <i class="bi bi-star-fill text-warning"></i>
                            <i class="bi bi-star-fill text-warning"></i>
                            <i class="bi bi-star-fill text-warning"></i>
                            <i class="bi bi-star-fill text-warning"></i>
                            <i class="bi bi-star-half text-warning"></i>
                            <span class="ms-2">(48 reseñas)</span>
                        </div>
                        <p class="text-muted">Los mejores cortes de res premium, seleccionados cuidadosamente para garantizar calidad y sabor excepcional.</p>
                        <div class="price mb-3">
                            <h3 class="text-primary">$320/kg</h3>
                        </div>
                        <button class="btn btn-primary btn-lg add-to-cart" data-product="res-premium">
                            <i class="bi bi-cart-plus me-2"></i>Agregar al Carrito
                        </button>
                    </div>
                </div>
            `;
        }, 800);
    }
    
    /**
     * Ordena los productos
     */
    sortProducts(sortType) {
        const productsContainer = document.querySelector('.products-row');
        const products = Array.from(productsContainer.children);
        
        products.sort((a, b) => {
            const aCard = a.querySelector('.product-card');
            const bCard = b.querySelector('.product-card');
            
            switch (sortType) {
                case 'price-asc':
                    const aPrice = parseInt(aCard.querySelector('.product-price').textContent.replace(/\D/g, ''));
                    const bPrice = parseInt(bCard.querySelector('.product-price').textContent.replace(/\D/g, ''));
                    return aPrice - bPrice;
                    
                case 'price-desc':
                    const aPriceDesc = parseInt(aCard.querySelector('.product-price').textContent.replace(/\D/g, ''));
                    const bPriceDesc = parseInt(bCard.querySelector('.product-price').textContent.replace(/\D/g, ''));
                    return bPriceDesc - aPriceDesc;
                    
                case 'name-asc':
                    const aName = aCard.querySelector('.card-title').textContent;
                    const bName = bCard.querySelector('.card-title').textContent;
                    return aName.localeCompare(bName);
                    
                case 'name-desc':
                    const aNameDesc = aCard.querySelector('.card-title').textContent;
                    const bNameDesc = bCard.querySelector('.card-title').textContent;
                    return bNameDesc.localeCompare(aNameDesc);
                    
                default:
                    return 0;
            }
        });
        
        // Reordenar en el DOM
        products.forEach(product => {
            productsContainer.appendChild(product);
        });
        
        this.showNotification('Productos ordenados correctamente', 'info');
    }
    
    /**
     * Inicializa el clima
     */
    initializeWeather() {
        this.loadWeatherData();
    }
    
    /**
     * Carga datos del clima
     */
    async loadWeatherData() {
        const weatherWidget = document.getElementById('weatherWidget');
        if (!weatherWidget) return;
        
        const tempElement = weatherWidget.querySelector('.weather-temp');
        const descElement = weatherWidget.querySelector('.weather-desc');
        const iconElement = weatherWidget.querySelector('.weather-icon');
        
        try {
            // Simular datos del clima para San Luis Potosí
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const weatherData = {
                temp: Math.floor(Math.random() * 10) + 20, // 20-30°C
                description: 'Soleado',
                icon: 'bi-sun'
            };
            
            if (tempElement) tempElement.textContent = `${weatherData.temp}°C`;
            if (descElement) descElement.textContent = weatherData.description;
            if (iconElement) {
                iconElement.className = `bi ${weatherData.icon} fs-2 me-3 weather-icon text-primary`;
            }
            
            this.weatherData = weatherData;
            
        } catch (error) {
            console.error('Error cargando clima:', error);
            if (tempElement) tempElement.textContent = 'N/A';
            if (descElement) descElement.textContent = 'Sin datos del clima';
        }
    }
    
    /**
     * Verifica el estado de conexión
     */
    checkOnlineStatus() {
        const offlineAlert = document.querySelector('.offline-alert');
        
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                offlineAlert?.classList.add('d-none');
            } else {
                offlineAlert?.classList.remove('d-none');
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }
    
    /**
     * Inicializa animaciones
     */
    initializeAnimations() {
        // Intersection Observer para animaciones
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);
        
        // Observar elementos animables
        document.querySelectorAll('.product-card, .schedule-box, .about-box, .contact-form-container').forEach(el => {
            observer.observe(el);
        });
    }
    
    /**
     * Vincula eventos generales
     */
    bindEvents() {
        // Smooth scrolling para enlaces internos
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
        
        // Cerrar búsqueda al hacer clic fuera
        document.addEventListener('click', (e) => {
            const searchBar = document.getElementById('searchBar');
            const searchBtn = document.getElementById('searchBtn');
            
            if (searchBar && !searchBar.classList.contains('d-none')) {
                if (!searchBar.contains(e.target) && !searchBtn.contains(e.target)) {
                    searchBar.classList.add('d-none');
                }
            }
        });
    }
    
    /**
     * Muestra una notificación
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show notification-toast`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
const app = new CarniceriaApp();