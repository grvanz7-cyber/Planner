const CACHE_NAME = 'planner-v2';

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
  './script.js',
  './planner-data-layer.js',
  './subject-enhancements.js',
  './navigation.js',
  './task-type-enhancements.js',
  './calendar.js',
  './calendar-edit.js',
  './task-subject-fix.js',
  './dashboard-edit.js',
  './tasks-page.js',
  './subjects-page.js',
  './subject-detail-page.js',
  './subject-roadmap.js',
  './assignments-page.js',
  './recurring-tasks.js',
  './delete-task.js',
  './status-consistency.js',
  './dashboard-priorities-stats.js',
  './calendar-day-fix.js',
  './tests-exams-page.js',
  './grades-page.js',
  './task-validation.js',
  './settings-enhancements.js',
  './dashboard-widgets.js',
  './dashboard-school-widget.js',
  './dashboard-subjects-widget.js',
  './dashboard-study-load.js',
  './dashboard-today-upcoming.js',
  './quick-add.js',
  './quick-add-fix.js',
  './pwa.js',
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

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });

      return cached || network.catch(() => caches.match('./index.html'));
    })
  );
});
