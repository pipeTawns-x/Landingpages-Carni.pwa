/**
 * Sistema de Carrito de Compras - Carnicería El Señor de La Misericordia
 * 
 * Este módulo gestiona el carrito de compras completo con funcionalidades avanzadas:
 * - Agregar productos con personalización (peso, piezas, grosor)
 * - Modificar cantidades en tiempo real
 * - Eliminar productos individuales
 * - Calcular totales dinámicos con opciones de entrega
 * - Generar tickets de compra
 * - Persistencia en localStorage
 * - Modal automático al agregar productos
 * 
 * Basado en funcionalidades del CodePen de referencia:
 * https://codepen.io/pipeTawns-x/pen/dPGYMxJ
 * 
 * @author pipeTawns-x
 * @version 1.0.0
 * @since 2026-01-09
*/
(function(){
  // Clave para almacenamiento en localStorage
  const LS_KEY = 'carni_cart_v1';

  /**
   * Carga el carrito desde localStorage
   * @returns {Array} Array de productos en el carrito
   */
  function loadCart(){
    try{ 
      return JSON.parse(localStorage.getItem(LS_KEY)) || []; 
    }catch(e){ 
      console.warn('Error al cargar carrito desde localStorage:', e);
      return []; 
    }
  }
  
  /**
   * Guarda el carrito en localStorage y dispara evento de actualización
   * @param {Array} cart - Array de productos a guardar
   */
  function saveCart(cart){ 
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cart)); 
      // Disparar evento personalizado para notificar cambios
      window.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { count: (cart || []).length }
      })); 
    } catch(e) {
      console.error('Error al guardar carrito en localStorage:', e);
    }
  }

  /**
   * Formatea un número como precio en formato mexicano
   * @param {number} n - Número a formatear
   * @returns {string} Precio formateado (ej: "$150.00")
   */
  function formatPrice(n){ 
    return '$' + Number(n).toFixed(2); 
  }

  /**
   * Renderiza el contenido del modal del carrito
   * Genera la interfaz completa con productos, controles y resumen
   */
  function renderCartModal(){
    const cart = loadCart();
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    
    // Validar que el contenedor existe
    if(!container) {
      console.warn('Contenedor de carrito no encontrado');
      return;
    }
    
    // Mostrar mensaje si el carrito está vacío
    if(cart.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <i class="bi bi-cart-x" style="font-size: 3rem; color: #ccc;"></i>
          <p class="text-muted mt-2">Tu carrito está vacío</p>
        </div>
      `;
      if(summary) summary.innerHTML = '';
      return;
    }
    
    container.innerHTML = '';
    let subtotal = 0;
    
    cart.forEach((it, idx)=>{
      const row = document.createElement('div'); 
      row.className='item-row d-flex align-items-start mb-3 p-3 border rounded';
      const itemPrice = Number(it.price||0);
      
      // Calcular cantidad según tipo
      let cantidad = 0;
      let itemTotal = 0;
      
      if(it.tipo === 'kg' || it.tipo === 'corte') {
        cantidad = it.peso || 0.5;
        if(it.tipo === 'corte' && it.grosor) {
          // Para cortes, el peso se calcula con grosor
          const pesoBase = it.basePeso || 0.3;
          cantidad = pesoBase * (it.grosor || 1.25);
        }
        itemTotal = itemPrice * cantidad;
      } else if(it.tipo === 'unidad' || it.tipo === 'paquete') {
        cantidad = it.piezas || 1;
        itemTotal = itemPrice * cantidad;
      }
      
      subtotal += itemTotal;
      
      row.innerHTML = `
        <div style="width:80px; flex-shrink: 0;">
          <img src="${it.img||'img/products/res.png'}" 
               style="width:80px;height:80px;object-fit:cover;border-radius:8px" 
               onerror="this.src='img/products/${it.categoria === 'otros' ? 'otrosproductos' : it.categoria === 'ofertas' ? 'premium' : (it.categoria||'res')}.png'">
        </div>
        <div style="flex:1; margin-left: 1rem;">
          <h6 class="mb-2">${it.name}</h6>
          <div class="item-controls mt-2 d-flex gap-3 flex-wrap align-items-center">
            ${it.tipo === 'kg' || it.tipo === 'corte' ? `
              <label class="d-flex align-items-center gap-1">
                <small>Peso (kg):</small>
                <input type="number" min="0.1" step="0.1" value="${cantidad.toFixed(2)}" 
                       data-idx="${idx}" class="peso-input form-control form-control-sm" style="width: 90px;">
              </label>
            ` : ''}
            ${it.tipo === 'unidad' || it.tipo === 'paquete' ? `
              <label class="d-flex align-items-center gap-1">
                <small>Piezas:</small>
                <input type="number" min="1" step="1" value="${cantidad}" 
                       data-idx="${idx}" class="piezas-input form-control form-control-sm" style="width: 80px;">
              </label>
            ` : ''}
            ${it.tipo === 'corte' ? `
              <label class="d-flex align-items-center gap-1">
                <small>Grosor (pulg):</small>
                <input type="range" min="0.5" max="5" step="0.25" value="${it.grosor||1.25}" 
                       data-idx="${idx}" class="grosor-input form-range" style="width: 120px;">
                <span class="grosor-value" style="min-width: 40px;">${it.grosor||1.25}"</span>
              </label>
            ` : ''}
          </div>
          <div class="mt-2">
            <small class="text-muted">Precio: ${formatPrice(itemPrice)}/${it.tipo === 'unidad' ? 'pieza' : it.tipo === 'paquete' ? 'paquete' : 'kg'}</small>
          </div>
        </div>
        <div style="min-width:120px;text-align:right; margin-left: 1rem;">
          <div class="fw-bold mb-2" style="font-size: 1.1rem; color: #dc3545;">${formatPrice(itemTotal)}</div>
          <button class="btn btn-sm btn-danger remove-item" data-idx="${idx}">
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </div>
      `;
      container.appendChild(row);
    });

    // Calcular total con delivery
    const deliverySelect = document.getElementById('deliverySelect');
    const deliveryCost = deliverySelect ? Number(deliverySelect.value) : 0;
    const total = subtotal + deliveryCost;
    
    if(summary){ 
      summary.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
          <strong>Subtotal:</strong>
          <strong>${formatPrice(subtotal)}</strong>
        </div>
        <div class="d-flex justify-content-between mb-3 border-top pt-2">
          <strong>Total:</strong>
          <strong class="text-danger fs-5">${formatPrice(total)}</strong>
        </div>
        <div class="mt-3">
          <label class="form-label">Tipo de entrega:</label>
          <select id="deliverySelect" class="form-select">
            <option value="0">Recoger en tienda (Gratis)</option>
            <option value="50">Delivery (+$50.00)</option>
          </select>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button id="generateTicket" class="btn btn-primary flex-fill">Generar Ticket</button>
          <button id="clearCartBtn" class="btn btn-outline-danger">Vaciar</button>
        </div>
      `; 
    }

    // Bind controls - Peso
    container.querySelectorAll('.peso-input').forEach(inp=>{
      inp.addEventListener('change', (e)=>{ 
        const i = Number(e.target.dataset.idx); 
        const cart = loadCart(); 
        if(!cart[i]) return; 
        cart[i].peso = Number(e.target.value);
        saveCart(cart); 
        renderCartModal(); 
        updateBadge(); 
      });
    });
    
    // Bind controls - Piezas
    container.querySelectorAll('.piezas-input').forEach(inp=>{
      inp.addEventListener('change', (e)=>{ 
        const i = Number(e.target.dataset.idx); 
        const cart = loadCart(); 
        if(!cart[i]) return; 
        cart[i].piezas = Number(e.target.value); 
        saveCart(cart); 
        renderCartModal(); 
        updateBadge(); 
      });
    });
    
    // Bind controls - Grosor
    container.querySelectorAll('.grosor-input').forEach(inp=>{
      inp.addEventListener('input', (e)=>{ 
        const i = Number(e.target.dataset.idx); 
        const cart = loadCart(); 
        if(!cart[i]) return; 
        cart[i].grosor = Number(e.target.value);
        const valueSpan = e.target.parentElement.querySelector('.grosor-value');
        if(valueSpan) valueSpan.textContent = e.target.value + '"';
        // Recalcular peso para cortes
        if(cart[i].tipo === 'corte') {
          const pesoBase = cart[i].basePeso || 0.3;
          cart[i].peso = pesoBase * cart[i].grosor;
        }
        saveCart(cart); 
        renderCartModal(); 
        updateBadge(); 
      });
    });

    // Bind controls - Eliminar
    container.querySelectorAll('.remove-item').forEach(btn=> {
      btn.addEventListener('click',(e)=>{ 
        const i = Number(e.target.closest('.remove-item').dataset.idx); 
        const cart = loadCart(); 
        cart.splice(i,1); 
        saveCart(cart); 
        renderCartModal(); 
    updateBadge();
      });
    });

    // Bind - Generar Ticket
    const gen = document.getElementById('generateTicket'); 
    if(gen) {
      // Remover listeners anteriores
      const newGen = gen.cloneNode(true);
      gen.parentNode.replaceChild(newGen, gen);
      
      newGen.addEventListener('click', ()=>{ 
        const cart = loadCart();
        const deliverySelect = document.getElementById('deliverySelect');
        const deliveryCost = deliverySelect ? Number(deliverySelect.value) : 0;
        let total = cart.reduce((sum, it) => {
          let cantidad = 0;
          if(it.tipo === 'kg' || it.tipo === 'corte') {
            cantidad = it.peso || 0.5;
            if(it.tipo === 'corte' && it.grosor) {
              const pesoBase = it.basePeso || 0.3;
              cantidad = pesoBase * it.grosor;
            }
          } else {
            cantidad = it.piezas || 1;
          }
          return sum + (Number(it.price||0) * cantidad);
        }, 0) + deliveryCost;
        
        alert(`✅ Ticket generado\n\nTotal: ${formatPrice(total)}\n\nVer consola para detalles completos`);
        console.log('🎫 TICKET GENERADO', { 
          cart, 
          deliveryCost, 
          total,
          items: cart.map(it => ({
            nombre: it.name,
            cantidad: it.tipo === 'kg' || it.tipo === 'corte' ? (it.peso || 0.5) + ' kg' : (it.piezas || 1) + ' piezas',
            precio: formatPrice(it.price),
            subtotal: formatPrice((it.price || 0) * (it.tipo === 'kg' || it.tipo === 'corte' ? (it.peso || 0.5) : (it.piezas || 1)))
          }))
        });
      });
    }
    
    // Bind - Vaciar Carrito
    const clearBtn = document.getElementById('clearCartBtn');
    if(clearBtn) {
      // Remover listeners anteriores
      const newClear = clearBtn.cloneNode(true);
      clearBtn.parentNode.replaceChild(newClear, clearBtn);
      
      newClear.addEventListener('click', () => {
        if(confirm('¿Estás seguro de vaciar el carrito?')) {
          saveCart([]);
          renderCartModal();
          updateBadge();
        }
      });
    }
    
    // Bind - Delivery Select
    const deliverySelectNew = document.getElementById('deliverySelect');
    if(deliverySelectNew) {
      // Remover listeners anteriores
      const newSelect = deliverySelectNew.cloneNode(true);
      deliverySelectNew.parentNode.replaceChild(newSelect, deliverySelectNew);
      
      newSelect.addEventListener('change', () => {
        renderCartModal();
      });
    }
  }

  /**
   * Actualiza el badge del contador de productos en el header
   * Calcula el total de items considerando piezas para productos por unidad
   */
  function updateBadge(){ 
    const cart = loadCart(); 
    const badgeEls = document.querySelectorAll('.cart-counter, .main-header__cart-count'); 
    
    badgeEls.forEach(badge => {
      // Calcular total de items (sumar piezas si aplica)
      const totalItems = cart.reduce((sum, item) => {
        if(item.tipo === 'unidad' || item.tipo === 'paquete') {
          return sum + (item.piezas || 1);
        }
        return sum + 1;
      }, 0);
      badge.textContent = totalItems;
    });
  }

  /**
   * Agrega un producto al carrito y abre el modal automáticamente
   * @param {Object} item - Objeto del producto a agregar
   * @param {string} item.id - ID único del producto
   * @param {string} item.name - Nombre del producto
   * @param {number} item.price - Precio unitario
   * @param {string} item.tipo - Tipo: 'kg', 'corte', 'unidad', 'paquete'
   */
  function addItem(item){ 
    const cart = loadCart(); 
    cart.push(item); 
    saveCart(cart); 
    updateBadge(); 
    
    // Abrir modal automáticamente después de agregar (pequeño delay para UX)
    setTimeout(() => {
      const cartModalEl = document.getElementById('cartModal');
      if (cartModalEl && typeof bootstrap !== 'undefined') {
        const cartModal = bootstrap.Modal.getOrCreateInstance(cartModalEl);
        cartModal.show();
      }
    }, 100);
  }

  // Exponer API pública para uso global
  window.CarniCart = { 
    addItem, 
    renderCartModal, 
    updateBadge, 
    loadCart, 
    saveCart 
  };

  /**
   * Función robusta para restaurar el body después de cerrar modal
   * Se ejecuta múltiples veces para asegurar que funcione
   */
  function restoreBodyAfterModal() {
    // Restaurar estilos del body inmediatamente
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.style.position = '';
    document.body.classList.remove('modal-open');
    
    // Remover todos los backdrops residuales
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Forzar reflow para asegurar que los cambios se apliquen
    void document.body.offsetHeight;
  }

  /**
   * Inicialización del módulo cuando el DOM está listo
   * Configura event listeners para el modal y actualiza el badge inicial
   */
  document.addEventListener('DOMContentLoaded', ()=>{
    const modalEl = document.getElementById('cartModal');
    
    if(modalEl){ 
      // Renderizar contenido cuando el modal se abre
      modalEl.addEventListener('shown.bs.modal', ()=>{ 
        renderCartModal(); 
      });
      
      /**
       * CORRECCIÓN DE BUG: Restaurar funcionalidad del body al cerrar modal
       * Bootstrap agrega clases y estilos que bloquean el scroll, esto los restaura
       * Se ejecuta múltiples veces para asegurar que funcione
       */
      modalEl.addEventListener('hidden.bs.modal', ()=>{
        restoreBodyAfterModal();
        
        // Ejecutar múltiples veces para asegurar restauración
        setTimeout(() => restoreBodyAfterModal(), 10);
        setTimeout(() => restoreBodyAfterModal(), 50);
        setTimeout(() => restoreBodyAfterModal(), 100);
      });
      
      // También escuchar cuando el modal se está ocultando
      modalEl.addEventListener('hide.bs.modal', () => {
        // Preparar restauración antes de que se oculte completamente
        restoreBodyAfterModal();
      });
    }
    
    // Actualizar badge al cargar la página
    updateBadge();
    
    // Escuchar cambios en el carrito desde otras pestañas/páginas
    window.addEventListener('storage', (e) => {
      if (e.key === LS_KEY) {
        updateBadge();
      }
    });
    
    // Escuchar eventos personalizados de actualización del carrito
    window.addEventListener('cart:updated', () => {
      updateBadge();
    });
  });
  
  /**
   * Listener adicional para corregir bug en todas las páginas
   * Se ejecuta cuando la página está completamente cargada
   */
  window.addEventListener('load', () => {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      // Asegurar que el modal no tenga backdrop estático que cause problemas
      const modalInstance = bootstrap.Modal.getInstance(cartModal);
      if (modalInstance) {
        // Configurar para que el backdrop se pueda cerrar
        cartModal.setAttribute('data-bs-backdrop', 'true');
      }
      
      // Listener adicional para asegurar restauración
      cartModal.addEventListener('hidden.bs.modal', () => {
        restoreBodyAfterModal();
        setTimeout(() => restoreBodyAfterModal(), 50);
        setTimeout(() => restoreBodyAfterModal(), 150);
      });
      
      // También escuchar cuando se está ocultando
      cartModal.addEventListener('hide.bs.modal', () => {
        restoreBodyAfterModal();
      });
    }
    
    // Actualizar badge al cargar completamente
    updateBadge();
    
    // Forzar restauración del body por si acaso hay algún estado residual
    restoreBodyAfterModal();
  });
  
  /**
   * Listener global para asegurar que el body siempre esté funcional
   * Se ejecuta periódicamente para limpiar cualquier estado residual
   */
  setInterval(() => {
    // Solo restaurar si no hay modal abierto
    const modalEl = document.getElementById('cartModal');
    if (modalEl && !modalEl.classList.contains('show')) {
      const hasBackdrop = document.querySelector('.modal-backdrop');
      if (hasBackdrop || document.body.classList.contains('modal-open')) {
        restoreBodyAfterModal();
      }
    }
  }, 500);

})();
