import { supabase } from '../supabase.js';
import { appState, showNotification, formatCurrency } from '../app.js';
import { isAuthenticated, getCurrentUser } from '../core/auth.js';

// Dashboard initialization
export async function initializeDashboard() {
  let user = getCurrentUser();

  if (!user) {
    const {
      data: { user: sessionUser }
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  if (!isAuthenticated() && !user) {
    showNotification('Debes iniciar sesión para acceder al dashboard', 'error');
    window.location.href = '/accessweb.html?redirectTo=' + encodeURIComponent(window.location.pathname);
    return;
  }

  try {
    console.log('Initializing dashboard...');
    
    // Load dashboard data
    await loadDashboardData();
    
    // Initialize dashboard components
    initializeDashboardComponents();
    
    // Set up event listeners
    setupDashboardEvents();
    
    console.log('Dashboard initialized successfully');
    
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showNotification('Error al cargar el dashboard', 'error');
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const currentUser = getCurrentUser() || (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error('No hay sesión activa');
    }
    
    // Load user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    // Load recent orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      throw ordersError;
    }
    
    // Load favorite products
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', currentUser.id);

    if (favoritesError) {
      throw favoritesError;
    }
    
    // Update UI with loaded data
    updateDashboardUI({
      currentUser,
      profile,
      orders: orders || [],
      favoritesCount: favorites?.length || 0
    });
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
}

// Update dashboard UI with data
function updateDashboardUI(data) {
  const { currentUser, profile, orders, favoritesCount } = data;
  const points = profile?.points || 0;
  const loyalty = { points, level: getCurrentLevel(points) };
  
  // Update user info
  updateElementText('.user-name', profile.full_name || currentUser.email || 'Cliente');
  updateElementText('.user-email', currentUser.email || '');
  updateElementText('.user-phone', profile.phone || 'No especificado');
  
  // Update stats cards
  updateElementText('.stats-points .stat-value', loyalty.points.toString());
  updateElementText('.stats-orders .stat-value', orders.length.toString());
  updateElementText('.stats-favorites .stat-value', favoritesCount.toString());
  
  // Calculate total spent
  const totalSpent = orders.reduce((total, order) => total + Number(order.total || 0), 0);
  updateElementText('.stats-total .stat-value', formatCurrency(totalSpent));
  
  // Update loyalty progress
  updateLoyaltyProgress(loyalty);
  
  // Update recent orders table
  updateOrdersTable(orders);
}

function getCurrentLevel(points) {
  if (points >= 1000) return 'diamond';
  if (points >= 500) return 'gold';
  if (points >= 200) return 'silver';
  return 'bronze';
}

// Update loyalty progress
function updateLoyaltyProgress(loyalty) {
  const progressBar = document.querySelector('.loyalty-progress .progress-bar');
  const progressText = document.querySelector('.loyalty-progress-text');
  
  if (!progressBar || !progressText) return;
  
  const { points, level } = loyalty;
  const nextLevel = getNextLevel(level);
  const progress = Math.min((points / nextLevel.pointsRequired) * 100, 100);
  
  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute('aria-valuenow', progress);
  
  progressText.textContent = `Nivel ${level} - ${points}/${nextLevel.pointsRequired} puntos`;
}

// Get next loyalty level information
function getNextLevel(currentLevel) {
  const levels = {
    bronze: { pointsRequired: 200, next: 'silver' },
    silver: { pointsRequired: 500, next: 'gold' },
    gold: { pointsRequired: 1000, next: 'diamond' },
    diamond: { pointsRequired: Infinity, next: null }
  };
  
  return levels[currentLevel] || levels.bronze;
}

// Update orders table
function updateOrdersTable(orders) {
  const tbody = document.querySelector('.orders-table tbody');
  
  if (!tbody) return;
  
  tbody.innerHTML = orders.length === 0 ? 
    '<tr><td colspan="6" class="text-center py-4">No hay pedidos recientes</td></tr>' :
    orders.map(order => `
      <tr>
        <td>#${order.id.slice(-6)}</td>
        <td>${new Date(order.created_at).toLocaleDateString()}</td>
        <td>${order.items?.length ?? 0} productos</td>
        <td>${formatCurrency(order.total)}</td>
        <td><span class="badge badge-${getStatusBadgeClass(order.status)}">${order.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-order" data-order-id="${order.id}">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
}

// Get badge class for order status
function getStatusBadgeClass(status) {
  const statusClasses = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    cancelled: 'danger',
    refunded: 'secondary'
  };
  
  return statusClasses[status] || 'secondary';
}

// Initialize dashboard components
function initializeDashboardComponents() {
  // Initialize charts
  initializeCharts();
  
  // Initialize quick actions
  initializeQuickActions();
  
  // Initialize notifications
  initializeNotifications();
}

// Initialize charts
function initializeCharts() {
  // This would initialize actual charts using a library like Chart.js
  // For now, we'll just show placeholders
  
  const chartContainers = document.querySelectorAll('.chart-container');
  
  chartContainers.forEach(container => {
    const canvas = container.querySelector('canvas');
    if (canvas) {
      // Initialize chart here
      console.log('Initializing chart:', canvas.id);
    }
  });
}

// Initialize quick actions
function initializeQuickActions() {
  const quickActions = document.querySelectorAll('.quick-action');
  
  quickActions.forEach(action => {
    action.addEventListener('click', (e) => {
      e.preventDefault();
      
      const actionType = action.getAttribute('data-action');
      
      switch (actionType) {
        case 'redeem-points':
          showRedeemPointsModal();
          break;
        case 'view-orders':
          window.location.href = '/products.html';
          break;
        case 'edit-profile':
          window.location.href = '/accessweb.html';
          break;
        case 'contact-support':
          window.location.href = '/index.html#contacto';
          break;
      }
    });
  });
}

// Initialize notifications
function initializeNotifications() {
  const notificationBell = document.querySelector('.notification-bell');
  
  if (notificationBell) {
    notificationBell.addEventListener('click', (e) => {
      e.preventDefault();
      showNotificationsModal();
    });
  }
}

// Setup dashboard events
function setupDashboardEvents() {
  // View order details
  document.addEventListener('click', (e) => {
    if (e.target.closest('.view-order')) {
      const orderId = e.target.closest('.view-order').getAttribute('data-order-id');
      viewOrderDetails(orderId);
    }
  });
  
  // Refresh dashboard data
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.innerHTML = '<span class="spinner spinner-sm"></span>';
      await loadDashboardData();
      refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
      showNotification('Datos actualizados', 'success');
    });
  }
}

// Show redeem points modal
function showRedeemPointsModal() {
  // Implement redeem points modal
  showNotification('Funcionalidad de canje de puntos en desarrollo', 'info');
}

// Show notifications modal
function showNotificationsModal() {
  // Implement notifications modal
  showNotification('Centro de notificaciones en desarrollo', 'info');
}

// View order details
function viewOrderDetails(orderId) {
  // Implement order details view
  showNotification(`Viendo detalles del pedido ${orderId}`, 'info');
}

// Helper function to update element text
function updateElementText(selector, text) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.dashboard-container')) {
    initializeDashboard();
  }
});