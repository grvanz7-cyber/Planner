// This file exists only to clean up the old mobile service worker that
// previously controlled the root of the Planner site.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const registrations = await self.registration.unregister();
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.navigate(client.url));
  })());
});
