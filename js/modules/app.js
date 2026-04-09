import { appState } from './core/auth.js';

export { appState };

export function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `app-notification alert alert-${mapNotificationType(type)} shadow-sm`;
  notification.setAttribute('role', 'status');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '1rem';
  notification.style.right = '1rem';
  notification.style.zIndex = '1080';
  notification.style.minWidth = '240px';

  document.body.appendChild(notification);

  window.setTimeout(() => {
    notification.remove();
  }, 3200);
}

function mapNotificationType(type) {
  const typeMap = {
    success: 'success',
    warning: 'warning',
    error: 'danger',
    danger: 'danger',
    info: 'info'
  };

  return typeMap[type] || 'info';
}