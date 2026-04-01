// Self-destructing service worker — clears old PWA cache
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => {
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => client.navigate(client.url))
  })
  self.registration.unregister()
  caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
})
