// js/modules/cart.js
import { DeliveryManager } from './delivery.js';
import { productos } from './base_dinamica.js';

export class CartManager {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cartItems')) || [];
        this.deliveryManager = new DeliveryManager();
        this.setupEventListeners();
        this.updateCartSummary();
    }

    setupEventListeners() {
        // Botones principales del carrito
        const clearCartBtn = document.getElementById('clearCartBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }

        // Observar cambios en el tipo de entrega para actualizar el total
        document.querySelectorAll('input[name="deliveryType"]').forEach(input => {
            input.addEventListener('change', () => this.updateCartSummary());
        });
    }

    addItem(product, quantity, customizations = {}) {
        const existingItem = this.items.find(item => 
            item.name === product.name && 
            JSON.stringify(item.customizations) === JSON.stringify(customizations)
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                customizations: customizations,
                image: product.image
            });
        }

        this.saveCart();
        this.updateCartSummary();
        this.showNotification('Producto agregado al carrito', 'success');
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.saveCart();
        this.updateCartSummary();
        this.showNotification('Producto eliminado del carrito', 'info');
    }

    updateItemQuantity(index, quantity) {
        quantity = parseInt(quantity);
        if (quantity > 0) {
            this.items[index].quantity = quantity;
        } else {
            this.items.splice(index, 1);
        }
        this.saveCart();
        this.updateCartSummary();
    }

    clearCart() {
        if (confirm('¿Está seguro que desea vaciar el carrito?')) {
            this.items = [];
            this.saveCart();
            this.updateCartSummary();
            this.showNotification('Carrito vaciado', 'info');
        }
    }

    saveCart() {
        localStorage.setItem('cartItems', JSON.stringify(this.items));
    }

    updateCartSummary() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            this.items.forEach((item, index) => {
                const itemElement = this.createCartItemElement(item, index);
                cartItemsContainer.appendChild(itemElement);
            });
        }

        // Calcular y mostrar subtotal
        const subtotal = this.calculateSubtotal();
        const subtotalElement = document.getElementById('cartSubtotal');
        if (subtotalElement) {
            subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        }

        // Actualizar el total incluyendo el envío
        if (this.deliveryManager) {
            this.deliveryManager.updateTotal();
        }

        // Actualizar contador del carrito
        this.updateCartCounter();
    }

    createCartItemElement(item, index) {
        const div = document.createElement('div');
        div.className = 'cart-item card mb-3';
        
        let customizationsHtml = '';
        if (Object.keys(item.customizations).length > 0) {
            customizationsHtml = '<small class="text-muted">';
            for (const [key, value] of Object.entries(item.customizations)) {
                customizationsHtml += `<br>${key}: ${value}`;
            }
            customizationsHtml += '</small>';
        }

        div.innerHTML = `
            <div class="card-body">
                <div class="row g-0">
                    <div class="col-4">
                        <img src="${item.image}" class="img-fluid rounded" alt="${item.name}" style="height: 80px; object-fit: cover;">
                    </div>
                    <div class="col-8">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="card-title mb-1">${item.name}</h6>
                            <button type="button" class="btn-close" aria-label="Remove" 
                                    onclick="cartManager.removeItem(${index})"></button>
                        </div>
                        ${customizationsHtml}
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <div class="input-group input-group-sm" style="width: 100px;">
                                <button class="btn btn-outline-secondary" type="button"
                                        onclick="cartManager.updateItemQuantity(${index}, ${item.quantity - 1})">-</button>
                                <input type="number" class="form-control text-center" value="${item.quantity}"
                                       min="1" onchange="cartManager.updateItemQuantity(${index}, this.value)">
                                <button class="btn btn-outline-secondary" type="button"
                                        onclick="cartManager.updateItemQuantity(${index}, ${item.quantity + 1})">+</button>
                            </div>
                            <span class="text-primary fw-bold">$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    calculateSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    updateCartCounter() {
        const cartCounter = document.querySelector('.cart-counter');
        if (!cartCounter) return;
        
        const totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
        cartCounter.textContent = totalItems;
        
        if (totalItems > 0) {
            cartCounter.classList.remove('d-none');
        } else {
            cartCounter.classList.add('d-none');
        }
    }

    showNotification(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast position-fixed bottom-0 end-0 m-3';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        const icon = type === 'success' ? 'bi-check-circle' : 'bi-info-circle';
        
        toast.innerHTML = `
            <div class="toast-header">
                <i class="bi ${icon} me-2"></i>
                <strong class="me-auto">Carrito</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    getProductImage(name) {
        // Buscar en la base de datos local
        for (const categoria in productos) {
            const producto = productos[categoria].find(p => p.nombre === name);
            if (producto && producto.imagen) {
                return producto.imagen;
            }
        }
        
        // Fallback a imágenes por categoría
        const imagePath = 'img/products/';
        if (name.toLowerCase().includes('res')) return imagePath + 'res.png';
        if (name.toLowerCase().includes('cerdo')) return imagePath + 'cerdo.png';
        if (name.toLowerCase().includes('pollo')) return imagePath + 'pollo.png';
        if (name.toLowerCase().includes('embutidos')) return imagePath + 'embutidos.png';
        if (name.toLowerCase().includes('especiales') || name.toLowerCase().includes('premium')) 
            return imagePath + 'premium.png';
        if (name.toLowerCase().includes('preparados')) return imagePath + 'preparadas.png';
        return imagePath + 'res.png'; // Imagen por defecto
    }

    async checkout() {
        // Validar que haya items en el carrito
        if (this.items.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        // Validar detalles de entrega
        if (!this.deliveryManager.validateDeliveryDetails()) {
            return;
        }

        // Obtener detalles de entrega
        const deliveryDetails = this.deliveryManager.getDeliveryDetails();

        // Preparar datos del pedido
        const order = {
            items: this.items,
            delivery: deliveryDetails,
            subtotal: this.calculateSubtotal(),
            total: parseFloat(document.getElementById('cartTotal').textContent.replace('$', '')),
            orderDate: new Date().toISOString()
        };

        try {
            // Aquí iría la lógica para enviar el pedido al servidor
            console.log('Procesando pedido:', order);
            
            // Simular proceso de pedido
            alert('¡Pedido realizado con éxito! Pronto nos pondremos en contacto contigo.');
            
            // Limpiar carrito después de un pedido exitoso
            this.clearCart();
            
            // Cerrar el offcanvas del carrito
            const cartOffcanvas = document.getElementById('cartOffcanvas');
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvas);
            if (bsOffcanvas) {
                bsOffcanvas.hide();
            }
        } catch (error) {
            console.error('Error al procesar el pedido:', error);
            alert('Hubo un error al procesar tu pedido. Por favor intenta nuevamente.');
        }
    }
}

// Exportar una instancia global para usar en el HTML
window.cartManager = new CartManager();