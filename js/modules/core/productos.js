/**
 * ProductosManager - Gestiona los botones de scroll del menú de categorías
 * @class
 */
class ProductosManager {
    constructor() {
        this.setupScrollButtons();
    }

    /**
     * Configura los botones de scroll (flechas) para el menú de categorías
     */
    setupScrollButtons() {
        const nav = document.querySelector('.categorias-menu .nav-scroll');
        const prev = document.querySelector('.categorias-menu .scroll-btn.prev');
        const next = document.querySelector('.categorias-menu .scroll-btn.next');

        if (!nav || !prev || !next) {
            // Reintentar si no están disponibles (puede que el DOM aún no esté listo)
            setTimeout(() => this.setupScrollButtons(), 500);
            return;
        }

        const scrollAmount = 200;
        
        // Remover listeners anteriores si existen
        const newPrev = prev.cloneNode(true);
        const newNext = next.cloneNode(true);
        prev.parentNode.replaceChild(newPrev, prev);
        next.parentNode.replaceChild(newNext, next);
        
        newPrev.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nav.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        
        newNext.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nav.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }
}

// Exportar como default para compatibilidad
export default ProductosManager;
export default ProductosManager;