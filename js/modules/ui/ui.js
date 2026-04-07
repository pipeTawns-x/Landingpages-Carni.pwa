// js/modules/ui.js
export function initializeUI() {
  // Inicializar tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Smooth scroll para enlaces internos
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Efectos de hover en tarjetas de producto
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('shadow-lg');
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('shadow-lg');
    });
  });
  
  // Manejar formularios
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitBtn = this.querySelector('button[type="submit"]');
      
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 1500);
      }
    });
  });
  
  // Inicializar carrusel con intervalo
  const heroCarousel = document.getElementById('heroCarousel');
  if (heroCarousel) {
    const carousel = new bootstrap.Carousel(heroCarousel, {
      interval: 6000,
      wrap: true,
      touch: true
    });
    
    // Efecto de paralaje en el fondo
    heroCarousel.addEventListener('slide.bs.carousel', function (e) {
      const items = this.querySelectorAll('.carousel-item');
      items.forEach(item => {
        const slide = item.querySelector('.hero-slide');
        if (slide) {
          slide.style.transform = 'scale(1.1)';
          slide.style.transition = 'transform 10s ease';
        }
      });
    });
    
    heroCarousel.addEventListener('slid.bs.carousel', function (e) {
      const activeItem = this.querySelector('.carousel-item.active');
      const activeSlide = activeItem.querySelector('.hero-slide');
      
      if (activeSlide) {
        activeSlide.style.transform = 'scale(1)';
      }
    });
    
    // Pausar el carrusel cuando el mouse está encima
    heroCarousel.addEventListener('mouseenter', () => {
      carousel.pause();
    });
    
    heroCarousel.addEventListener('mouseleave', () => {
      carousel.cycle();
    });
  }
  
  // Botón de programa de fidelidad
  const loyaltyBtn = document.getElementById('loyaltyBtn');
  if (loyaltyBtn) {
    loyaltyBtn.addEventListener('click', () => {
      const loyaltyModal = new bootstrap.Modal(document.getElementById('loyaltyModal'));
      loyaltyModal.show();
    });
  }
  
  console.log('Aplicación inicializada correctamente');
}

// Función específica para el carrusel hero
export function initializeHeroCarousel() {
  const heroCarousel = document.getElementById('heroCarousel');
  
  if (heroCarousel) {
    // Configuración específica para el carrusel hero
    const carousel = new bootstrap.Carousel(heroCarousel, {
      interval: 6000,
      wrap: true,
      touch: true
    });
    
    // Efecto de zoom suave en las imágenes de fondo
    heroCarousel.addEventListener('slide.bs.carousel', function (e) {
      const items = this.querySelectorAll('.carousel-item');
      items.forEach(item => {
        const slide = item.querySelector('.hero-slide');
        if (slide) {
          slide.style.transform = 'scale(1.1)';
          slide.style.transition = 'transform 10s ease';
        }
      });
    });
    
    heroCarousel.addEventListener('slid.bs.carousel', function (e) {
      const activeItem = this.querySelector('.carousel-item.active');
      const activeSlide = activeItem.querySelector('.hero-slide');
      
      if (activeSlide) {
        activeSlide.style.transform = 'scale(1)';
      }
    });
    
    // Pausar el carrusel cuando el mouse está encima
    heroCarousel.addEventListener('mouseenter', () => {
      carousel.pause();
    });
    
    heroCarousel.addEventListener('mouseleave', () => {
      carousel.cycle();
    });
    
    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        carousel.prev();
      } else if (e.key === 'ArrowRight') {
        carousel.next();
      }
    });
  }
}