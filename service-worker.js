const CACHE_NAME = 'planner-v8';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './aesthetic.css',
  './subject-enhancements.css',
  './task-type-enhancements.css',
  './calendar.css',
  './calendar-polish.css',
  './tasks-page.css',
  './subjects-page.css',
  './subject-detail-page.css',
  './subject-roadmap.css',
  './subject-grade-graph.css',
  './assignments-page.css',
  './dashboard-widgets.css',
  './dashboard-subjects-widget.css',
  './dashboard-study-load.css',
  './study-page.css',
  './study-plans.css',
  './study-sessions.css',
  './icons/planner-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isDynamicDocument = url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  const isDynamicScript = url.pathname.endsWith('.js');

  if (isDynamicDocument || isDynamicScript) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
