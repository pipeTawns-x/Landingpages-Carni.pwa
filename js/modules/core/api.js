// js/modules/api.js
// API module for online status

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