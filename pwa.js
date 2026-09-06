// ========================================
// PWA
// ========================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => {
      console.warn('Planner service worker registration failed:', error);
    });
  });
}
