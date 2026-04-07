/**
 * Sistema de Búsqueda en Tiempo Real
 * - En index.html: Redirige a products.html con query
 * - En products.html: Filtra productos en tiempo real
 */

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const currentPage = window.location.pathname;

  if (!searchBtn) return;

  searchBtn.addEventListener('click', () => {
    if (currentPage.includes('products.html')) {
      // Mostrar barra de búsqueda inline
      showSearchBar();
    } else {
      // Redirigir a products.html
      window.location.href = 'products.html?search=true';
    }
  });

  // Si llegamos desde index con ?search=true, abrir búsqueda
  if (currentPage.includes('products.html') && window.location.search.includes('search=true')) {
    setTimeout(() => showSearchBar(), 300);
  }
});

function showSearchBar() {
  // Evitar duplicados
  if (document.querySelector('.search-bar')) return;

  const searchBar = document.createElement('div');
  searchBar.className = 'search-bar';
  searchBar.style.cssText = `
    position: fixed;
    top: 120px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1040;
    background: white;
    border-radius: 25px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 90%;
    max-width: 500px;
    animation: slideDown 0.3s ease;
  `;
  
  searchBar.innerHTML = `
    <i class="bi bi-search" style="color: #999; font-size: 1.2rem;"></i>
    <input type="search" 
           id="searchInput" 
           placeholder="Buscar productos..." 
           style="flex: 1; border: none; outline: none; font-size: 1rem;"
           autocomplete="off">
    <button id="closeSearch" style="background: transparent; border: none; cursor: pointer; font-size: 1.5rem; color: #999;">
      <i class="bi bi-x-lg"></i>
    </button>
  `;
  
  document.body.appendChild(searchBar);
  document.getElementById('searchInput').focus();
  
  // Filtrado en tiempo real
  document.getElementById('searchInput').addEventListener('input', (e) => {
    filterProducts(e.target.value);
  });
  
  // Cerrar búsqueda
  document.getElementById('closeSearch').addEventListener('click', () => {
    searchBar.remove();
    // Mostrar todos los productos
    filterProducts('');
  });

  // Cerrar con ESC
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      searchBar.remove();
      filterProducts('');
      document.removeEventListener('keydown', escHandler);
    }
  });
}

  function filterProducts(query) {
  const cards = document.querySelectorAll('.producto-card');
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    // Mostrar todos
    cards.forEach(card => {
      card.style.display = '';
    });
    return;
  }
  
  cards.forEach(card => {
    const title = card.querySelector('.producto-card__title')?.textContent.toLowerCase() || '';
    const desc = card.querySelector('.producto-card__description')?.textContent.toLowerCase() || '';
    const categoria = card.dataset.categoria?.toLowerCase() || '';
    
    if (title.includes(lowerQuery) || desc.includes(lowerQuery) || categoria.includes(lowerQuery)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

// Animación CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);
