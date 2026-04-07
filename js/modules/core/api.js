// js/modules/api.js
// API module for service worker and online status

// Register Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/js/modules/utils/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
}

// Check online status
export function checkOnlineStatus() {
  const offlineAlert = document.querySelector('.offline-alert');
  
  function updateOnlineStatus() {
    if (navigator.onLine) {
      offlineAlert.classList.add('d-none');
    } else {
      offlineAlert.classList.remove('d-none');
    }
  }
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

// Supabase configuration
export function initSupabase() {
  // This would be your actual Supabase configuration
  const supabaseUrl = 'https://your-project.supabase.co';
  const supabaseKey = 'your-supabase-key';
  
  // return createClient(supabaseUrl, supabaseKey);
  console.log('Supabase initialized');
  return null;
}