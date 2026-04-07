// js/modules/delivery.js
// delivery.js - Manejo de opciones de entrega

export class DeliveryManager {
    constructor() {
        this.deliveryFee = 50.00; // Costo fijo de envío
        this.setupEventListeners();
        this.updateDeliveryOptions();
    }

    setupEventListeners() {
        // Escuchar cambios en el tipo de entrega
        const deliveryTypeInputs = document.querySelectorAll('input[name="deliveryType"]');
        deliveryTypeInputs.forEach(input => {
            input.addEventListener('change', () => this.updateDeliveryOptions());
        });

        // Validar hora de recogida
        const pickupTimeInput = document.getElementById('pickupTime');
        if (pickupTimeInput) {
            pickupTimeInput.addEventListener('change', (e) => this.validatePickupTime(e.target));
        }
    }

    updateDeliveryOptions() {
        const pickupOptions = document.getElementById('pickupOptions');
        const deliveryOptions = document.getElementById('deliveryOptions');
        const deliveryFeeElement = document.getElementById('deliveryFee');
        const isDelivery = document.getElementById('delivery').checked;

        // Mostrar/ocultar opciones según el tipo seleccionado
        pickupOptions.style.display = isDelivery ? 'none' : 'block';
        deliveryOptions.style.display = isDelivery ? 'block' : 'none';

        // Actualizar costo de envío
        deliveryFeeElement.textContent = isDelivery ? `$${this.deliveryFee.toFixed(2)}` : '$0.00';

        // Actualizar total
        this.updateTotal();
    }

    validatePickupTime(input) {
        const time = input.value;
        const [hours, minutes] = time.split(':').map(Number);
        const timeValue = hours * 60 + minutes;

        // Validar dentro del horario de atención (9:00 AM - 8:00 PM)
        const minTime = 9 * 60; // 9:00 AM
        const maxTime = 20 * 60; // 8:00 PM

        if (timeValue < minTime || timeValue > maxTime) {
            alert('Por favor seleccione un horario entre 9:00 AM y 8:00 PM');
            input.value = ''; // Limpiar el valor inválido
            return false;
        }
        return true;
    }

    getDeliveryDetails() {
        const isDelivery = document.getElementById('delivery').checked;
        
        if (isDelivery) {
            return {
                type: 'delivery',
                address: document.getElementById('deliveryAddress').value,
                references: document.getElementById('deliveryReferences').value,
                fee: this.deliveryFee
            };
        } else {
            return {
                type: 'pickup',
                pickupTime: document.getElementById('pickupTime').value,
                fee: 0
            };
        }
    }

    validateDeliveryDetails() {
        const isDelivery = document.getElementById('delivery').checked;
        
        if (isDelivery) {
            const address = document.getElementById('deliveryAddress').value;
            if (!address) {
                alert('Por favor ingrese una dirección de entrega');
                return false;
            }
        } else {
            const pickupTime = document.getElementById('pickupTime').value;
            if (!pickupTime || !this.validatePickupTime(document.getElementById('pickupTime'))) {
                alert('Por favor seleccione una hora válida de recogida');
                return false;
            }
        }
        return true;
    }

    updateTotal() {
        const subtotalElement = document.getElementById('cartSubtotal');
        const totalElement = document.getElementById('cartTotal');
        const deliveryFeeElement = document.getElementById('deliveryFee');

        const subtotal = parseFloat(subtotalElement.textContent.replace('$', '')) || 0;
        const deliveryFee = parseFloat(deliveryFeeElement.textContent.replace('$', '')) || 0;

        const total = subtotal + deliveryFee;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}