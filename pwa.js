// ========================================
// PWA
// ========================================
(function(){
  const VERSION='20260931';
  ['study-page.css','study-plans.css','study-sessions.css','focus-expansion.css','gamification-expansion.css','study-methods.css','study-activities.css','study-practice-system.css','study-practice-enhancements.css','study-review-engine.css','smart-study-planner.css','smart-study-time.css','smart-workload.css','smart-study-schedule.css','smart-study-balance.css','smart-schedule-enhancements.css','smart-study-method-routing.css','study-analytics.css','study-weak-topics.css','study-feedback.css','focus-space-v2.css','focus-environments.css','planner-roadmap-batch.css','roadmap-final-systems.css','roadmap-remaining-systems.css'].forEach((name,i)=>{const style=document.createElement('link');style.rel='stylesheet';style.href='./'+name+'?v='+VERSION+i;document.head.appendChild(style);});
  const scripts=['grade-entry-actions.js','grade-what-if.js','study-page.js','study-plans.js','study-sessions.js','focus-expansion.js','gamification-expansion.js','study-methods.js','study-activities.js','study-practice-system.js','study-practice-enhancements.js','study-review-engine.js','smart-study-planner.js','smart-study-time.js','smart-workload.js','smart-study-schedule.js','smart-study-balance.js','smart-schedule-enhancements.js','smart-study-method-routing.js','study-analytics.js','study-weak-topics.js','study-feedback.js','focus-space-v2.js','focus-environments.js','planner-roadmap-batch.js','roadmap-final-systems.js','roadmap-remaining-systems.js'];
  scripts.forEach((src,i)=>{const s=document.createElement('script');s.src='./'+src+'?v='+VERSION+i;document.body.appendChild(s);});
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js?v='+VERSION).catch(()=>{}));}
})();
