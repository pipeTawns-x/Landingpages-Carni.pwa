import { supabase, appState } from './app.js';

// Elementos del DOM
const loyaltyBtn = document.getElementById('loyaltyBtn');

// Inicialización
if (loyaltyBtn) {
  loyaltyBtn.addEventListener('click', showLoyaltyInfo);
}

// Mostrar información de fidelidad
async function showLoyaltyInfo() {
  if (!appState.user) {
    // Mostrar modal de login/registro
    const modal = new bootstrap.Modal(document.getElementById('loyaltyModal'));
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
    modal.show();
    return;
  }
  
  // Cargar información de fidelidad del usuario
  const { data: loyaltyData, error } = await supabase
    .from('loyalty_program')
    .select('*')
    .eq('user_id', appState.user.id)
    .single();
  
  if (error) {
    console.error('Error loading loyalty data:', error);
    alert('Error cargando tu información de fidelidad');
    return;
  }
  
  // Mostrar modal con información de fidelidad
  const modal = new bootstrap.Modal(document.getElementById('loyaltyModal'));
  
  document.getElementById('loyaltyContent').innerHTML = `
    <div class="text-center">
      <h4 class="mb-4">Tu Programa de Fidelidad</h4>
      <div class="loyalty-card p-4 mb-4 bg-primary text-white rounded-3">
        <h1 class="display-4">${loyaltyData.points} Puntos</h1>
        <p class="mb-0">Acumulados</p>
      </div>
      <div class="qr-code mb-4">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${loyaltyData.qr_code || appState.user.id}" 
             alt="QR Code" class="img-fluid">
        <p class="small text-muted mt-2">Muestra este código al pagar para acumular puntos</p>
      </div>
      <div class="loyalty-benefits">
        <h5 class="mb-3">Beneficios</h5>
        <ul class="list-group">
          <li class="list-group-item">1 punto por cada $100 en compras</li>
          <li class="list-group-item">100 puntos = $50 de descuento</li>
          <li class="list-group-item">Ofertas exclusivas</li>
          <li class="list-group-item">Descuentos en cumpleaños</li>
        </ul>
      </div>
      <div class="loyalty-history mt-4">
        <h5 class="mb-3">Historial Reciente</h5>
        ${await getLoyaltyHistory()}
      </div>
    </div>
  `;
  
  modal.show();
}

// Obtener historial de puntos de fidelidad
async function getLoyaltyHistory() {
  const { data: history, error } = await supabase
    .from('loyalty_history')
    .select('*')
    .eq('user_id', appState.user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error || !history.length) {
    console.error('Error loading loyalty history:', error);
    return '<p class="text-muted">No hay historial reciente</p>';
  }
  
  let html = '<div class="list-group">';
  
  history.forEach(record => {
    const date = new Date(record.created_at).toLocaleDateString();
    const points = record.points > 0 ? 
      `<span class="text-success">+${record.points}</span>` : 
      `<span class="text-danger">${record.points}</span>`;
    
    html += `
      <div class="list-group-item">
        <div class="d-flex justify-content-between">
          <span>${record.description}</span>
          <div>
            ${points} puntos <span class="text-muted small">${date}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Función para agregar puntos de fidelidad
export async function addLoyaltyPoints(userId, points, description) {
  // Actualizar puntos totales
  const { data: currentData, error: fetchError } = await supabase
    .from('loyalty_program')
    .select('points')
    .eq('user_id', userId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching current points:', fetchError);
    return false;
  }
  
  const newPoints = currentData.points + points;
  
  const { error: updateError } = await supabase
    .from('loyalty_program')
    .update({ points: newPoints })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error updating points:', updateError);
    return false;
  }
  
  // Registrar en el historial
  const { error: historyError } = await supabase
    .from('loyalty_history')
    .insert([{
      user_id: userId,
      points,
      description,
      created_at: new Date().toISOString()
    }]);
  
  if (historyError) {
    console.error('Error adding history record:', historyError);
  }
  
  return true;
}