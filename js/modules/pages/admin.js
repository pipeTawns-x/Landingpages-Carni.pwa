
import { checkAdminAuth } from '../core/auth.js';

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();
  loadAdminStats();
});

// Cargar estadísticas del dashboard
async function loadAdminStats() {
  // TODO: Implementar la lógica para cargar estadísticas del dashboard
}
