const CACHE_NAME = 'planner-app-v1';
const APP_SHELL = [
  './app-shell.html',
  './manifest.webmanifest',
  './app-data.js',
  './app-navigation.js',
  './app-calendar.js',
  './app-tasks.js',
  './app-school.js',
  './app-settings.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      });
    }).catch(() => caches.match('./app-shell.html'))
  );
});
