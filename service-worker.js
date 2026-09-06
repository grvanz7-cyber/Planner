// Root cleanup service worker for old mobile installations.
// During the transition to the split desktop/mobile deployment, always
// prefer the live network copy of the desktop Planner and remove stale
// root-level caches/service-worker state.

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.registration.unregister();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith((async () => {
    try {
      return await fetch(event.request, { cache: 'no-store' });
    } catch (error) {
      return caches.match(event.request);
    }
  })());
});
