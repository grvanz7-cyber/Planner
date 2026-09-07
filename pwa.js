// ========================================
// PWA
// ========================================
(function(){
  const VERSION='20260931';
  ['study-page.css','study-plans.css','study-sessions.css','focus-expansion.css','gamification-expansion.css','study-methods.css'].forEach((name,i)=>{const style=document.createElement('link');style.rel='stylesheet';style.href='./'+name+'?v='+VERSION+i;document.head.appendChild(style);});

  const scripts=[
    './grade-entry-actions.js?v=20260906',
    './grade-what-if.js?v=20260907',
    './study-page.js?v='+VERSION,
    './study-plans.js?v=20260912',
    './study-sessions.js?v=20260912',
    './focus-expansion.js?v=20260907',
    './gamification-expansion.js?v=20260907',
    './study-methods.js?v=20260907'
  ];

  function loadNext(index){
    if(index>=scripts.length)return;
    const src=scripts[index];
    const script=document.createElement('script');
    script.src=src;
    script.onload=()=>{
      if(src.includes('study-page.js')&&typeof window.renderStudy==='function')window.renderStudy();
      if(src.includes('study-plans.js')&&typeof window.renderStudyPlans==='function')window.renderStudyPlans();
      if(src.includes('study-sessions.js')&&typeof window.renderStudySessions==='function')window.renderStudySessions();
      if(src.includes('focus-expansion.js')&&typeof window.renderFocusExpansion==='function')window.renderFocusExpansion();
      if(src.includes('gamification-expansion.js')&&typeof window.renderGamification==='function')window.renderGamification();
      if(src.includes('study-methods.js')&&typeof window.renderStudyMethods==='function')window.renderStudyMethods();
      loadNext(index+1);
    };
    script.onerror=()=>{console.warn('Planner script failed to load:',src);loadNext(index+1);};
    document.head.appendChild(script);
  }
  loadNext(0);
})();

if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      const registration=await navigator.serviceWorker.register('./service-worker.js?v=20260931');
      await registration.update();
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        if(!worker)return;
        worker.addEventListener('statechange',()=>{
          if(worker.state==='installed'&&navigator.serviceWorker.controller)console.info('A new Planner version is ready. Reload to update.');
        });
      });
    }catch(error){console.warn('Planner service worker registration failed:',error);}
  });
}
