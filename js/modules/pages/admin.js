
import { checkAdminAuth } from '../core/auth.js';
import { supabase } from '../supabase.js';

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();
  loadAdminStats();
});

// Cargar estadísticas del dashboard
async function loadAdminStats() {
  try {
    // 1. Total de pedidos (no cancelados)
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'cancelled');

    // 2. Ingresos totales (pedidos confirmados/entregados)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total')
      .in('status', ['confirmed', 'preparing', 'ready', 'delivered']);
    const totalRevenue = (revenueData || []).reduce((sum, o) => sum + Number(o.total || 0), 0);

    // 3. Pedidos recientes
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Productos con stock bajo
    const { data: lowStock } = await supabase
      .from('products')
      .select('id, name, stock, category_id')
      .eq('is_active', true)
      .lt('stock', 10)
      .order('stock');

    // Render stats in dashboard
    renderDashboardStats({
      orderCount: orderCount || 0,
      totalRevenue,
      recentOrders: recentOrders || [],
      lowStock: lowStock || []
    });
  } catch (err) {
    console.error('Error cargando estadísticas admin:', err);
  }
}

function renderDashboardStats({ orderCount, totalRevenue, recentOrders, lowStock }) {
  // KPI cards (if containers exist in the HTML)
  const statsContainer = document.getElementById('adminStats') || document.querySelector('.admin-stats');
  if (!statsContainer) {
    console.warn('No #adminStats container found in HTML — stats loaded but not rendered');
    console.table({ orderCount, totalRevenue, recentOrders: recentOrders.length, lowStock: lowStock.length });
    return;
  }

  statsContainer.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card text-center border-0 shadow-sm">
          <div class="card-body">
            <h6 class="text-muted">Pedidos Totales</h6>
            <h2 class="fw-bold">${orderCount}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center border-0 shadow-sm">
          <div class="card-body">
            <h6 class="text-muted">Ingresos</h6>
            <h2 class="fw-bold text-success">$${totalRevenue.toFixed(2)}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center border-0 shadow-sm">
          <div class="card-body">
            <h6 class="text-muted">Pedidos Recientes</h6>
            <h2 class="fw-bold">${recentOrders.length}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center border-0 shadow-sm">
          <div class="card-body">
            <h6 class="text-muted">Stock Bajo</h6>
            <h2 class="fw-bold ${lowStock.length > 0 ? 'text-danger' : ''}">${lowStock.length}</h2>
          </div>
        </div>
      </div>
    </div>
    ${recentOrders.length > 0 ? `
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white"><strong>Últimos Pedidos</strong></div>
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead><tr><th>ID</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            ${recentOrders.map(o => `
              <tr>
                <td><small>${o.id.slice(0, 8)}...</small></td>
                <td>$${Number(o.total).toFixed(2)}</td>
                <td><span class="badge bg-secondary">${o.status}</span></td>
                <td>${new Date(o.created_at).toLocaleDateString('es-MX')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}
    ${lowStock.length > 0 ? `
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white"><strong>⚠️ Stock Bajo</strong></div>
      <ul class="list-group list-group-flush">
        ${lowStock.map(p => `
          <li class="list-group-item d-flex justify-content-between">
            <span>${p.name}</span>
            <span class="badge bg-danger">${p.stock} kg</span>
          </li>`).join('')}
      </ul>
    </div>` : ''}
  `;
}
