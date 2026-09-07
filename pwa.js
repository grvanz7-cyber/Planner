// ========================================
// PWA
// ========================================
(function(){
  ['study-page.css','study-plans.css'].forEach((name,i)=>{const style=document.createElement('link');style.rel='stylesheet';style.href='./'+name+'?v=20260907'+i;document.head.appendChild(style);});
  const scripts=['./grade-entry-actions.js?v=20260906','./grade-what-if.js?v=20260907','./study-page.js?v=20260907','./study-plans.js?v=20260907'];
  scripts.forEach(src=>{const script=document.createElement('script');script.src=src;script.defer=true;document.head.appendChild(script);});
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
    } catch (error) { console.warn('Planner service worker registration failed:', error); }
  });
}
