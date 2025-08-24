
import { supabase, checkAdminAuth } from './app.js';

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();
  loadAdminStats();
});

// Cargar estadísticas del dashboard
async function loadAdminStats() {
  // TODO: Implementar la lógica para cargar estadísticas del dashboard
}
