// ========================================
// PLANNER ROADMAP — COMPATIBILITY LAYER
// Keeps the original roadmap core authoritative while adding safe extras.
// ========================================
(function(){
  const KEY='plannerData';
  const read=()=>window.plannerData||JSON.parse(localStorage.getItem(KEY)||'{}');
  const save=d=>{window.plannerData=d;localStorage.setItem(KEY,JSON.stringify(d));document.dispatchEvent(new CustomEvent('planner-data-changed'));};
  const arr=(o,k)=>Array.isArray(o&&o[k])?o[k]:[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function ensure(){const d=read();let changed=false;const fields=[['goals',[]],['habits',[]],['focusSessions',[]],['friends',[]],['sharedProjects',[]],['achievements',[]],['dailyQuests',[]],['rewardLog',[]],['smartPlans',[]]];fields.forEach(([k,v])=>{if(!Array.isArray(d[k])){d[k]=v;changed=true;}});if(!d.pet){d.pet={name:'Sprout',emoji:'🌱',happiness:70,xp:0,coins:0,level:1};changed=true;}if(!d.profile){d.profile={displayName:'',avatar:'🌿',theme:'Cozy'};changed=true;}if(!d.integrations){d.integrations={googleCalendar:false,edsby:false,email:false,music:false};changed=true;}if(changed)save(d);else window.plannerData=d;return d;}
  function addFullScreen(){const p=document.getElementById('focusPage');if(!p||p.querySelector('#focusFullscreen'))return;const b=document.createElement('button');b.id='focusFullscreen';b.className='focus-fullscreen-button secondary-button';b.textContent='⛶ Full-screen focus';b.onclick=()=>{document.body.classList.toggle('focus-distraction-free');b.textContent=document.body.classList.contains('focus-distraction-free')?'✕ Exit full-screen':'⛶ Full-screen focus';};p.prepend(b);}
  function addFocusExtras(){const p=document.getElementById('focusPage');if(!p||p.querySelector('#focusRoadmapExtras'))return;const s=document.createElement('section');s.id='focusRoadmapExtras';s.className='roadmap-feature-section';const d=read();s.innerHTML=`<div class="feature-heading"><div><h2>Focus shortcuts</h2><p>Jump directly into the study tools you need.</p></div></div><div class="roadmap-feature-grid"><article class="roadmap-feature-card"><strong>📚 Study</strong><p>Open your study library and session tools.</p><button class="secondary-button" id="focusStudyShortcut">Open Study</button></article><article class="roadmap-feature-card"><strong>✓ Current work</strong><p>${arr(d,'tasks').filter(t=>t.status!=='Completed'&&!t.completed).length} active tasks available.</p><button class="secondary-button" id="focusTasksShortcut">Open Tasks</button></article></div>`;p.appendChild(s);s.querySelector('#focusStudyShortcut').onclick=()=>location.hash='#study';s.querySelector('#focusTasksShortcut').onclick=()=>location.hash='#tasks';}
  function render(){ensure();addFullScreen();addFocusExtras();}
  window.PlannerRoadmapBatch={render,initData:ensure};
  const boot=()=>render();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  document.addEventListener('planner-data-changed',()=>setTimeout(render,0));window.addEventListener('hashchange',()=>setTimeout(render,0));
})();
