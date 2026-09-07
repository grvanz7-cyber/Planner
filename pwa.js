// ========================================
// PWA
// ========================================
(function(){
  ['study-page.css','study-plans.css','study-sessions.css'].forEach((name,i)=>{const style=document.createElement('link');style.rel='stylesheet';style.href='./'+name+'?v=20260918'+i;document.head.appendChild(style);});

  const scripts=[
    './grade-entry-actions.js?v=20260906',
    './grade-what-if.js?v=20260907',
    './study-page.js?v=20260918',
    './study-plans.js?v=20260918',
    './study-sessions.js?v=20260918',
    './study-set-button-fix.js?v=20260918'
  ];

  scripts.forEach(src=>{
    const script=document.createElement('script');
    script.src=src;
    script.onload=()=>{
      if(src.includes('study-page.js') && typeof window.renderStudy==='function')window.renderStudy();
      if(src.includes('study-plans.js') && typeof window.renderStudyPlans==='function')window.renderStudyPlans();
      if(src.includes('study-sessions.js') && typeof window.renderStudySessions==='function')window.renderStudySessions();
    };
    script.onerror=()=>console.warn('Planner script failed to load:',src);
    document.head.appendChild(script);
  });
})();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js?v=20260918');
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) console.info('A new Planner version is ready. Reload to update.');
        });
      });
    } catch (error) { console.warn('Planner service worker registration failed:', error); }
  });
})();
