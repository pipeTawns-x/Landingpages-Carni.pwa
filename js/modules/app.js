// js/app.js
import { initializeSearch } from './modules/search.js';
import { initializeCart } from './modules/cart.js';
import { initializeUI, initializeHeroCarousel } from './modules/ui.js';

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar funcionalidades
  initializeSearch();
  initializeCart();
  initializeUI();
  initializeHeroCarousel();
  
  // Efecto de header al hacer scroll
  const header = document.querySelector('.main-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
  
  console.log('Aplicación inicializada correctamente');
});