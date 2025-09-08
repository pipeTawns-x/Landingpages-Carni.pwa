import { supabase, appState, updateCartCounter } from './app.js';

// Cargar productos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  setupProductFilters();

// Cargar productos desde Supabase
async function loadProducts() {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;
  
  productsGrid.innerHTML = `
    <div class="col-12 text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando productos...</span>
      </div>
    </div>
  `;
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true });
  
  if (error) {
    console.error('Error loading products:', error);
    productsGrid.innerHTML = `
      <div class="col-12 text-center text-danger">
        <i class="bi bi-exclamation-triangle-fill fs-1"></i>
        <p class="mt-3">Error cargando los productos. Por favor intenta nuevamente.</p>
      </div>
    `;
    return;
  }
  
  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div class="col-12 text-center text-muted">
        <i class="bi bi-box-seam fs-1"></i>
        <p class="mt-3">No hay productos disponibles en este momento.</p>
      </div>
    `;
    return;
  }
  
  // Agrupar productos por categoría
  const productsByCategory = {};
  products.forEach(product => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });
  
  // Mostrar productos
  let html = '';
  
  for (const category in productsByCategory) {
    html += `
      <div class="col-12 mt-4">
        <h3 class="category-title">${category}</h3>
        <hr>
      </div>
    `;
    
    productsByCategory[category].forEach(product => {
      html += `
        <div class="col-md-4 mb-4">
          <div class="card h-100 product-card">
            <img src="${product.image_url || 'img/placeholder-meat.jpg'}" 
                 class="card-img-top" 
                 alt="${product.name}"
                 loading="lazy">
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">${product.description || 'Producto de alta calidad'}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="price">$${product.price.toFixed(2)}</span>
                <button class="btn btn-sm btn-primary add-to-cart" 
                        data-id="${product.id}"
                        data-name="${product.name}"
                        data-price="${product.price}">
                  <i class="bi bi-cart-plus"></i> Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  productsGrid.innerHTML = html;
  
  // Configurar event listeners para los botones de añadir al carrito
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', addToCart);
  });
}
});

// Añadir producto al carrito
function addToCart(e) {
  const button = e.currentTarget;
  const product = {
    id: button.dataset.id,
    name: button.dataset.name,
    price: parseFloat(button.dataset.price),
    quantity: 1
  };
  
  // Verificar si el producto ya está en el carrito
  const existingItem = appState.cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    appState.cart.push(product);
  }
  
  // Actualizar almacenamiento local y contador
  saveCartToStorage();
  updateCartCounter();
  
  // Feedback visual
  button.innerHTML = '<i class="bi bi-check"></i> Añadido';
  button.classList.remove('btn-primary');
  button.classList.add('btn-success');
  
  setTimeout(() => {
    button.innerHTML = '<i class="bi bi-cart-plus"></i> Añadir';
    button.classList.remove('btn-success');
    button.classList.add('btn-primary');
  }, 1000);
}

// Configurar filtros de productos
function setupProductFilters() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }
}

// Filtrar productos basado en búsqueda
function filterProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    const title = card.querySelector('.card-title').textContent.toLowerCase();
    const description = card.querySelector('.card-text').textContent.toLowerCase();
    
    if (title.includes(searchTerm) || description.includes(searchTerm)) {
      card.parentElement.style.display = 'block';
    } else {
      card.parentElement.style.display = 'none';
    }
  });
}

// Guardar carrito en almacenamiento local
function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(appState.cart));
}