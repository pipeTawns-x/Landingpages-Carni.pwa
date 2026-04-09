const CACHE_NAME = 'carniceria-cache-v3';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/products.html',
  '/accessweb.html',
  '/offline.html',
  '/css/styles.css',
  '/js/modules/core/cart.js',
  '/js/modules/core/auth.js',
  '/js/modules/ui/header.js',
  '/js/modules/ui/search.js',
  '/img/recursos_web/logo-user.png',
  '/img/products/res.png',
  '/img/products/cerdo.png',
  '/img/products/pollo.png',
  '/img/recursos_web/carniLogin.png',
  '/img/recursos_web/carniRegistro.png',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Cache primero, luego red
self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes que no son GET
  if (event.request.method !== 'GET') return;
  
  // Para solicitudes de la API, usar network primero
  if (event.request.url.includes('/rest/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clonar la respuesta para guardarla en caché
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseToCache));
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar con el caché
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para otros recursos, usar caché primero
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Devolver respuesta en caché si existe
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no está en caché, hacer solicitud a la red
        return fetch(event.request)
          .then((response) => {
            // No cachear respuestas que no son válidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para guardarla en caché
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
            
            return response;
          })
          .catch(() => {
            // Si es una página, mostrar la página offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Manejar mensajes push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/img/recursos_web/logo-user.png',
    badge: '/img/recursos_web/logo-user.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});