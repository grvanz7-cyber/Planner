const CACHE_NAME = 'planner-app-v4';
const APP_SHELL = [
  './',
  './index.html',
  './app-shell.html',
  './manifest.webmanifest',
  './planner-icon.svg',
  './app-data.js',
  './app-navigation.js',
  './app-calendar.js',
  './app-tasks.js',
  './app-school.js',
  './app-settings.js',
  './app-mobile-ui.js?v=3',
  './app-add.js',
  './app-entry.js'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => { if (response.ok) { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)); } return response; });
  }).catch(() => caches.match('./app-shell.html')));
});
