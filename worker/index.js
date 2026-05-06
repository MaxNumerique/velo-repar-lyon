self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notification reçue !');
  const data = event.data.json();
  console.log('[Service Worker] Données reçues:', data);
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200], // Vibration plus marquée sur Android
    tag: data.url, // Regroupe les notifications vers la même URL
    renotify: true, // Fait vibrer même si le tag est le même
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Clic sur notification');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Si une fenêtre est déjà ouverte sur cette URL, on lui donne le focus
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    // Sinon on ouvre une nouvelle fenêtre
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
