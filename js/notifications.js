// Verificar y solicitar permisos para notificaciones
export async function checkNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Mostrar notificación
export function showNotification(title, options) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, options);
      }
    });
  }
}

// Configurar notificaciones push con Service Worker
export async function setupPushNotifications() {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!('PushManager' in window)) {
      console.log('Push messaging no soportado');
      return;
    }
    
    // Suscribir al usuario
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || 'your-vapid-key')
    });
    
    // Enviar suscripción al servidor (Supabase en este caso)
    await saveSubscription(subscription);
  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
}

// Guardar suscripción en el servidor
async function saveSubscription(subscription) {
  const { error } = await supabase
    .from('push_subscriptions')
    .insert([{
      user_id: appState.user?.id,
      subscription: JSON.stringify(subscription),
      created_at: new Date().toISOString()
    }]);
  
  if (error) {
    console.error('Error saving subscription:', error);
  }
}

// Convertir clave VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Ejemplo de notificación de bienvenida
export function showWelcomeNotification() {
  showNotification('Bienvenido a Carnicería Sr. Misericordia', {
    body: 'Gracias por visitarnos. ¡Disfruta de nuestras ofertas especiales!',
    icon: 'img/icon-192.png',
    badge: 'img/badge.png'
  });
}

// Notificación basada en el clima
export function showWeatherNotification(weatherData) {
  let body = '';
  
  if (weatherData.main.temp > 30) {
    body = '¡Hace calor! Prueba nuestras carnes frías y ensaladas.';
  } else if (weatherData.main.temp < 15) {
    body = '¡Hace frío! Perfecto para nuestros cortes para guisos.';
  } else {
    body = '¡Buen día para una parrillada con nuestros cortes premium!';
  }
  
  showNotification('Sugerencia del día', {
    body,
    icon: 'img/icon-192.png'
  });
}