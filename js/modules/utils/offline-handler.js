// Manejador del estado offline
export const setupOfflineHandler = () => {
    window.addEventListener('online', () => {
        showOfflineNotification(false);
    });
    
    window.addEventListener('offline', () => {
        showOfflineNotification(true);
    });
};

// Mostrar notificación de estado offline
export const showOfflineNotification = (isOffline) => {
    const notification = document.getElementById('offlineNotification');
    if (notification) {
        notification.classList.toggle('show', isOffline);
        notification.textContent = isOffline ? 
            'No hay conexión a Internet. Trabajando en modo offline.' : 
            'Conexión restablecida.';
    }
};