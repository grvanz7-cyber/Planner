// ========================================
// PWA
// ========================================

// Load desktop feature augmentations without changing the existing index
// script order.
(function(){
  const script=document.createElement('script');
  script.src='./grade-entry-actions.js?v=20260906';
  script.defer=true;
  document.head.appendChild(script);
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            console.info('A new Planner version is ready. Reload to update.');
          }
        });
      });
    } catch (error) {
      console.warn('Planner service worker registration failed:', error);
    }
  });
}
