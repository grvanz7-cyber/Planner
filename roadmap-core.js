/* Planner roadmap feature foundation. Intentionally modular and additive. */
(function(){
  const KEY='plannerData';
  const get=()=>window.plannerData || (typeof plannerData!=='undefined'?plannerData:{}) || {};
  const ensure=()=>{const d=get(); d.settings=d.settings||{}; d.settings.subjects=d.settings.subjects||[]; d.tasks=d.tasks||[]; d.assignments=d.assignments||[]; d.studySets=d.studySets||[]; d.habits=d.habits||[]; d.goals=d.goals||[]; d.focusSessions=d.focusSessions||[]; d.pet=d.pet||{name:'Sprout',emoji:'🌱',happiness:70,xp:0,coins:0,level:1}; d.profile=d.profile||{displayName:'',avatar:'🌿',theme:'Cozy'}; d.friends=d.friends||[]; d.sharedProjects=d.sharedProjects||[]; return d;};
  function init(){
    // Roadmap pages are owned by roadmap-systems.js. Keeping this legacy
    // initializer data-only prevents duplicate page renderers from fighting
    // over the same DOM elements and event handlers.
    ensure();
  }
  window.renderRoadmapCore=init;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
