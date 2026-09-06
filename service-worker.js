// Root cleanup service worker for old mobile installations.
// It unregisters itself and clears old caches, but deliberately does not
// navigate/reload clients so it cannot trap the desktop Planner in a loop.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.registration.unregister();
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  })());
});
