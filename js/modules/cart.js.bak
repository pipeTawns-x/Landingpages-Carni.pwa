// js/modules/cart.js
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

export function initializeCart() {
  const cartBtn = document.getElementById('cartBtn');
  const cartCounter = document.querySelector('.cart-counter');
  
  if (!cartBtn || !cartCounter) return;
  
  // Actualizar contador del carrito
  updateCartCounter();
  
  // Event listener para el botón del carrito
  cartBtn.addEventListener('click', () => {
    // Aquí podrías abrir un modal o redirigir a la página del carrito
    alert(`Tienes ${cartItems.length} productos en tu carrito.`);
  });
  
  // Agregar event listeners a los botones "Agregar" de productos
  document.querySelectorAll('.btn-product').forEach(btn => {
    if (btn.innerHTML.includes('bi-cart-plus')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const productCard = btn.closest('.product-card');
        const productName = productCard.querySelector('.card-title').textContent;
        const productPrice = parseFloat(productCard.querySelector('.product-price').textContent.replace('$', '').replace('/kg', ''));
        
        addToCart(productName, productPrice);
        
        // Efecto visual de agregado al carrito
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Agregado';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        
        setTimeout(() => {
          btn.innerHTML = '<i class="bi bi-cart-plus me-1"></i> Agregar';
          btn.classList.remove('btn-success');
          btn.classList.add('btn-primary');
        }, 2000);
      });
    }
  });
}

function addToCart(name, price) {
  // Verificar si el producto ya está en el carrito
  const existingItem = cartItems.find(item => item.name === name);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({
      id: Date.now(),
      name,
      price,
      quantity: 1,
      image: getProductImage(name)
    });
  }
  
  // Guardar en localStorage
  localStorage.setItem('cartItems', JSON.stringify(cartItems));
  
  // Actualizar contador
  updateCartCounter();
  
  // Mostrar notificación
  if (typeof showNotification === 'function') {
    showNotification('Producto agregado al carrito', 'success');
  }
}

function updateCartCounter() {
  const cartCounter = document.querySelector('.cart-counter');
  if (!cartCounter) return;
  
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  cartCounter.textContent = totalItems;
  
  if (totalItems > 0) {
    cartCounter.classList.remove('d-none');
  } else {
    cartCounter.classList.add('d-none');
  }
}

function getProductImage(name) {
  // Mapear nombres de productos a imágenes (simplificado)
  if (name.includes('Res')) return 'res.png';
  if (name.includes('Cerdo')) return 'cerdo.png';
  if (name.includes('Pollo')) return 'pollo.png';
  if (name.includes('Embutidos')) return 'embutidos.png';
  if (name.includes('Especiales') || name.includes('Premium')) return 'premium.png';
  if (name.includes('Preparados')) return 'preparadas.png';
  return 'res.png'; // Imagen por defecto
}