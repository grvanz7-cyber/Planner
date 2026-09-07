// ========================================
// PWA
// ========================================
(function(){
  const VERSION='20260931';
  ['study-page.css','study-plans.css','study-sessions.css','focus-expansion.css','gamification-expansion.css','study-methods.css','study-activities.css','study-practice-system.css','study-practice-enhancements.css','study-review-engine.css'].forEach((name,i)=>{const style=document.createElement('link');style.rel='stylesheet';style.href='./'+name+'?v='+VERSION+i;document.head.appendChild(style);});
  const scripts=['grade-entry-actions.js','grade-what-if.js','study-page.js','study-plans.js','study-sessions.js','focus-expansion.js','gamification-expansion.js','study-methods.js','study-activities.js','study-practice-system.js','study-practice-enhancements.js','study-review-engine.js'];
  scripts.forEach((src,i)=>{const s=document.createElement('script');s.src='./'+src+'?v='+VERSION+i;document.body.appendChild(s);});
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js?v='+VERSION).catch(()=>{}));}
})();