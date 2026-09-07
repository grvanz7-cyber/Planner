// ========================================
// Time-aware Smart Study
// ========================================
(function(){
  const get=()=>window.plannerData||JSON.parse(localStorage.getItem('plannerData')||'{}');
  const save=d=>{window.plannerData=d;localStorage.setItem('plannerData',JSON.stringify(d));document.dispatchEvent(new CustomEvent('planner-data-changed'));};
  const dates=v=>{const d=new Date(v);return isNaN(d)?null:d};
  const minutesFor=t=>Math.max(10,Math.min(90,Number(t.estimatedMinutes||t.duration||t.timeEstimate||30)||30));
  function candidates(d){
    const tasks=Array.isArray(d.tasks)?d.tasks:[], assignments=Array.isArray(d.assignments)?d.assignments:[];
    return [...tasks,...assignments.map(a=>({...a,type:a.type||'assignment'}))].filter(t=>t.status!=='Completed'&&!t.completed).map(t=>{
      const due=dates(t.dueDate||t.dueAt); const days=due?(due-Date.now())/86400000:30;
      let urgency=days<0?100:days<1?85:days<3?65:days<7?40:15;
      if(t.priority==='High')urgency+=25; else if(t.priority==='Medium')urgency+=12;
      if(/exam|test/i.test(t.type||''))urgency+=20;
      return {t,minutes:minutesFor(t),score:urgency};
    }).sort((a,b)=>b.score-a.score);
  }
  function planFor(limit){
    const d=get(), pool=candidates(d), picked=[], used=0;
    for(const x of pool){if(used+x.minutes<=limit){picked.push(x);used+=x.minutes;}}
    if(!picked.length&&pool.length) picked.push({...pool[0],minutes:Math.min(pool[0].minutes,limit)});
    return {picked,used,remaining:Math.max(0,limit-used)};
  }
  function render(){
    const box=document.getElementById('smartTimePlanner'); if(!box)return;
    const input=box.querySelector('[data-time-limit]'); const limit=Math.max(5,Math.min(240,Number(input?.value||30)||30));
    const p=planFor(limit);
    box.querySelector('[data-plan-output]').innerHTML=p.picked.length?p.picked.map((x,i)=>`<div class="smart-time-item"><span>${i+1}</span><div><strong>${x.t.name||'Untitled task'}</strong><small>${x.minutes} min${x.t.dueDate?` · Due ${new Date(x.t.dueDate).toLocaleDateString()}`:''}</small></div></div>`).join(''):`<div class="smart-time-empty">Nothing urgent fits this session. Nice work.</div>`;
    box.querySelector('[data-plan-meta]').textContent=`${p.used} min planned${p.remaining?` · ${p.remaining} min free`:''}`;
    box.querySelector('[data-start-plan]').onclick=()=>{if(p.picked[0])location.hash='#tasks';};
  }
  function ensure(){
    const page=document.getElementById('smartStudyPage'); if(!page||document.getElementById('smartTimePlanner'))return;
    const el=document.createElement('div');el.id='smartTimePlanner';el.className='smart-time-planner';el.innerHTML='<div class="smart-time-head"><div><h2>Plan my time</h2><p>Tell me how much time you have and I’ll build a focused work block.</p></div><button class="secondary" data-start-plan>Start</button></div><div class="smart-time-controls"><label>Available time <input data-time-limit type="number" min="5" max="240" value="30"> <span>minutes</span></label><button class="secondary" data-plan-refresh>Rebuild</button></div><div data-plan-output></div><div class="smart-time-footer"><span data-plan-meta></span></div>';
    page.appendChild(el);
    el.querySelector('[data-plan-refresh]').addEventListener('click',render);el.querySelector('[data-time-limit]').addEventListener('change',render);render();
  }
  function boot(){ensure();}
  document.addEventListener('planner-data-changed',boot);window.addEventListener('hashchange',boot);document.addEventListener('DOMContentLoaded',boot);
  window.renderSmartTimePlan=render;
})();
