// js/modules/search.js
// Datos de ejemplo para búsqueda
const products = [
  { id: 1, name: "Rib Eye", category: "Res", price: 320, image: "rib-eye.png" },
  { id: 2, name: "Filet Mignon", category: "Res", price: 380, image: "filet_mignon.png" },
  { id: 3, name: "Porterhouse", category: "Res", price: 350, image: "porterhouse.png" },
  { id: 4, name: "New York Strip", category: "Res", price: 300, image: "ney_york_strip.png" },
  { id: 5, name: "Tomahawk", category: "Res", price: 450, image: "tomahawk.png" },
  { id: 6, name: "Bavette Steak", category: "Res", price: 280, image: "bravette_steak.png" },
  { id: 7, name: "Fisk Steak", category: "Res", price: 270, image: "fisk_steak.png" },
  { id: 8, name: "Skirt Steak", category: "Res", price: 250, image: "skirt_steak.png" },
  { id: 9, name: "Top Sirloin", category: "Res", price: 220, image: "top_sirloin.png" },
  { id: 10, name: "Chuleta de Cerdo", category: "Cerdo", price: 180, image: "cerdo.png" },
  { id: 11, name: "Pierna de Cerdo", category: "Cerdo", price: 160, image: "cerdo.png" },
  { id: 12, name: "Costillas de Cerdo", category: "Cerdo", price: 200, image: "cerdo.png" },
  { id: 13, name: "Pechuga de Pollo", category: "Pollo", price: 95, image: "pollo.png" },
  { id: 14, name: "Muslos de Pollo", category: "Pollo", price: 85, image: "pollo.png" },
  { id: 15, name: "Alas de Pollo", category: "Pollo", price: 90, image: "pollo.png" },
  { id: 16, name: "Chorizo", category: "Embutidos", price: 120, image: "embutidos.png" },
  { id: 17, name: "Salchichas", category: "Embutidos", price: 100, image: "embutidos.png" },
  { id: 18, name: "Jamón", category: "Embutidos", price: 140, image: "embutidos.png" },
  { id: 19, name: "Carne Molida Premium", category: "Preparados", price: 210, image: "preparadas.png" },
  { id: 20, name: "Brochetas", category: "Preparados", price: 230, image: "preparadas.png" }
];

export function initializeSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('searchInput');
  const searchSubmit = document.getElementById('searchSubmit');
  const searchSuggestions = document.getElementById('searchSuggestions');
  
  if (!searchBtn || !searchBar || !searchInput) return;
  
  // Alternar visibilidad de la barra de búsqueda
  searchBtn.addEventListener('click', () => {
    searchBar.classList.toggle('d-none');
    if (!searchBar.classList.contains('d-none')) {
      searchInput.focus();
    }
  });
  
  // Función para buscar productos
  const performSearch = () => {
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length < 2) {
      searchSuggestions.classList.add('d-none');
      return;
    }
    
    // Filtrar productos que coincidan con la consulta
    const results = products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.category.toLowerCase().includes(query)
    );
    
    // Mostrar sugerencias
    displaySuggestions(results);
  };
  
  // Mostrar sugerencias de búsqueda
  const displaySuggestions = (results) => {
    if (results.length === 0) {
      searchSuggestions.innerHTML = '<div class="suggestion-item text-muted">No se encontraron productos</div>';
      searchSuggestions.classList.remove('d-none');
      return;
    }
    
    searchSuggestions.innerHTML = results.slice(0, 5).map(product => `
      <div class="suggestion-item" data-product-id="${product.id}">
        <div class="d-flex justify-content-between">
          <span>${product.name}</span>
          <small class="text-muted">${product.category}</small>
        </div>
        <small class="text-primary">$${product.price}/kg</small>
      </div>
    `).join('');
    
    searchSuggestions.classList.remove('d-none');
    
    // Agregar event listeners a las sugerencias
    document.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const productId = item.getAttribute('data-product-id');
        const product = products.find(p => p.id === parseInt(productId));
        
        if (product) {
          // Redirigir a la página de productos o mostrar detalles
          window.location.href = `#productos`;
          searchInput.value = product.name;
          searchSuggestions.classList.add('d-none');
          
          // Aquí podrías mostrar un modal o destacar el producto
          console.log('Producto seleccionado:', product);
        }
      });
    });
  };
  
  // Event listeners para la búsqueda
  searchInput.addEventListener('input', performSearch);
  searchSubmit.addEventListener('click', performSearch);
  
  // Ocultar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!searchBar.contains(e.target) && e.target !== searchBtn) {
      searchSuggestions.classList.add('d-none');
    }
  });
  
  // Manejar tecla Enter en la búsqueda
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}