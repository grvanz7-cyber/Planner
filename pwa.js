// ========================================
// PWA
// ========================================
(function(){
  const style=document.createElement('link');
  style.rel='stylesheet';
  style.href='./study-page.css?v=20260907b';
  document.head.appendChild(style);
  const scripts=['./grade-entry-actions.js?v=20260906','./grade-what-if.js?v=20260907','./study-page.js?v=20260907','./study-system.js?v=20260907b'];
  scripts.forEach(src=>{const script=document.createElement('script');script.src=src;document.body.appendChild(script);});
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) console.info('A new Planner version is ready. Reload to update.');
        });
      });
    } catch (error) {
      console.warn('Planner service worker registration failed:', error);
    }
  });
}
