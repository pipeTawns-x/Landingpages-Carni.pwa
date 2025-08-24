// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'your-supabase-key';

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Estado de la aplicación
let appState = {
  user: null,
  cart: [],
  loyaltyPoints: 0
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  loadCartFromStorage();
  updateCartCounter();
  setupEventListeners();
});

// Verificar estado de autenticación
async function checkAuthState() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    appState.user = user;
    document.getElementById('userBtn').innerHTML = '<i class="bi bi-person-check"></i>';
    loadUserLoyaltyPoints(user.id);
  }
}

// Cargar puntos de fidelidad del usuario
async function loadUserLoyaltyPoints(userId) {
  const { data, error } = await supabase
    .from('loyalty_program')
    .select('points')
    .eq('user_id', userId)
    .single();
  
  if (data) {
    appState.loyaltyPoints = data.points;
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Botón de búsqueda
  document.getElementById('searchBtn').addEventListener('click', toggleSearchBar);
  
  // Botón de carrito
  document.getElementById('cartBtn').addEventListener('click', () => {
    alert('Carrito de compras (próximamente)');
  });
  
  // Botón de programa de fidelidad
  document.getElementById('loyaltyBtn').addEventListener('click', showLoyaltyModal);
  
  // Formulario de contacto
  document.getElementById('contactForm').addEventListener('submit', handleContactFormSubmit);
}

// Alternar barra de búsqueda
function toggleSearchBar() {
  const searchBar = document.getElementById('searchBar');
  searchBar.classList.toggle('d-none');
  
  if (!searchBar.classList.contains('d-none')) {
    document.getElementById('searchInput').focus();
  }
}

// Mostrar modal de fidelidad
function showLoyaltyModal() {
  const modal = new bootstrap.Modal(document.getElementById('loyaltyModal'));
  
  if (appState.user) {
    // Usuario autenticado
    document.getElementById('loyaltyContent').innerHTML = `
      <div class="text-center">
        <h4 class="mb-4">Tu Programa de Fidelidad</h4>
        <div class="loyalty-card p-4 mb-4 bg-primary text-white rounded-3">
          <h1 class="display-4">${appState.loyaltyPoints} Puntos</h1>
          <p class="mb-0">Acumulados</p>
        </div>
        <div class="qr-code mb-4">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${appState.user.id}" 
               alt="QR Code" class="img-fluid">
          <p class="small text-muted mt-2">Muestra este código al pagar para acumular puntos</p>
        </div>
        <div class="loyalty-benefits">
          <h5 class="mb-3">Beneficios</h5>
          <ul class="list-group">
            <li class="list-group-item">1 punto por cada $100 en compras</li>
            <li class="list-group-item">100 puntos = $50 de descuento</li>
            <li class="list-group-item">Ofertas exclusivas</li>
          </ul>
        </div>
      </div>
    `;
  } else {
    // Usuario no autenticado
    document.getElementById('loyaltyContent').innerHTML = `
      <div class="text-center py-4">
        <h4 class="mb-4">Programa de Fidelidad</h4>
        <p class="mb-4">Únete a nuestro programa de fidelidad y comienza a ganar puntos con cada compra</p>
        <div class="d-flex justify-content-center gap-3">
          <a href="register.html" class="btn btn-primary">Regístrate</a>
          <a href="login.html" class="btn btn-outline-primary">Inicia Sesión</a>
        </div>
      </div>
    `;
  }
  
  modal.show();
}

// Manejar envío de formulario de contacto
async function handleContactFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = {
    name: form.name.value,
    email: form.email.value,
    subject: form.subject.value,
    message: form.message.value,
    created_at: new Date().toISOString()
  };
  
  // Validación simple
  if (!formData.name || !formData.email || !formData.message) {
    alert('Por favor completa todos los campos requeridos');
    return;
  }
  
  // Enviar a Supabase
  const { error } = await supabase
    .from('contacts')
    .insert([formData]);
  
  if (error) {
    console.error('Error enviando mensaje:', error);
    alert('Hubo un error al enviar tu mensaje. Por favor intenta nuevamente.');
  } else {
    alert('¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.');
    form.reset();
  }
}

// Funciones del carrito
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    appState.cart = JSON.parse(savedCart);
  }
}

function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(appState.cart));
}

function updateCartCounter() {
  const totalItems = appState.cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll('.cart-counter').forEach(el => {
    el.textContent = totalItems;
    el.style.display = totalItems > 0 ? 'block' : 'none';
  });
}

// Exportar para otros módulos
export { supabase, appState, updateCartCounter };