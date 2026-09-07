// ========================================
// Focus Space v2
// ========================================
(function(){
  const KEY='plannerData';
  const read=()=>window.plannerData||JSON.parse(localStorage.getItem(KEY)||'{}');
  const arr=(o,k)=>Array.isArray(o&&o[k])?o[k]:[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const save=d=>{window.plannerData=d;localStorage.setItem(KEY,JSON.stringify(d));document.dispatchEvent(new CustomEvent('planner-data-changed'));};

  function activeTasks(){
    const d=read();
    return arr(d,'tasks').filter(t=>t.status!=='Completed'&&!t.completed).concat(arr(d,'assignments').filter(t=>t.status!=='Completed'&&!t.completed));
  }
  function sessions(){return arr(read(),'focusSessions').filter(x=>x&&x.startedAt);}
  function totalMinutes(){return sessions().reduce((n,s)=>n+Number(s.durationMinutes||s.minutes||0),0);}
  function todayMinutes(){
    const key=new Date().toDateString();
    return sessions().filter(s=>new Date(s.startedAt).toDateString()===key).reduce((n,s)=>n+Number(s.durationMinutes||s.minutes||0),0);
  }
  function render(){
    const page=document.getElementById('focusPage')||document.getElementById('focusSpacePage'); if(!page)return;
    let section=document.getElementById('focusSpaceV2');
    if(!section){section=document.createElement('section');section.id='focusSpaceV2';section.className='focus-v2';page.appendChild(section);}
    const tasks=activeTasks().slice(0,12), recent=sessions().slice(-5).reverse();
    section.innerHTML=`<div class="focus-v2-hero"><div><div class="eyebrow">Focus space</div><h2>Settle in and get one thing done.</h2><p>Choose a task, pick a focus mode, and start a distraction-light session.</p></div><div class="focus-v2-stats"><div><strong>${Math.round(totalMinutes())}</strong><span>total min</span></div><div><strong>${Math.round(todayMinutes())}</strong><span>today</span></div><div><strong>${sessions().length}</strong><span>sessions</span></div></div></div><div class="focus-v2-grid"><div class="focus-v2-panel"><h3>Choose your focus</h3><label>Task<select id="focusV2Task"><option value="">Just focus</option>${tasks.map(t=>`<option value="${esc(t.id)}">${esc(t.name||t.title||'Untitled')}</option>`).join('')}</select></label><label>Topic<input id="focusV2Topic" placeholder="What are you working on?"></label><div class="focus-v2-modes"><button data-focus-mode="pomodoro">Pomodoro<br><small>25 min</small></button><button data-focus-mode="short">Short<br><small>15 min</small></button><button data-focus-mode="flow">Flow<br><small>45 min</small></button><button data-focus-mode="custom">Custom<br><small>Set time</small></button></div><div class="focus-v2-actions"><button class="primary" id="focusV2Start">Start focus</button><button class="secondary" id="focusV2Study">Study mode</button></div></div><div class="focus-v2-panel"><h3>Recent focus</h3><div class="focus-v2-recent">${recent.length?recent.map(s=>`<div><span>${esc(s.topic||s.taskName||'Focus session')}</span><strong>${Number(s.durationMinutes||s.minutes||0)} min</strong></div>`).join(''):'<p class="focus-v2-empty">Your completed sessions will appear here.</p>'}</div></div></div>`;
    section.querySelectorAll('[data-focus-mode]').forEach(b=>b.addEventListener('click',()=>{section.querySelectorAll('[data-focus-mode]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');section.dataset.mode=b.dataset.focusMode;}));
    const start=section.querySelector('#focusV2Start'); if(start)start.addEventListener('click',()=>startSession(section));
    const study=section.querySelector('#focusV2Study'); if(study)study.addEventListener('click',()=>{if(typeof window.openStudySessionGenerator==='function')window.openStudySessionGenerator();else location.hash='#study';});
  }
  function startSession(section){
    const mode=section.dataset.mode||'pomodoro';
    const durations={pomodoro:25,short:15,flow:45};
    let minutes=durations[mode]||25;
    if(mode==='custom'){const input=prompt('How many minutes?','30');minutes=Math.max(1,Math.min(240,Number(input)||30));}
    const d=read(),id=section.querySelector('#focusV2Task')?.value||'';
    const task=activeTasks().find(t=>String(t.id)===String(id));
    const topic=section.querySelector('#focusV2Topic')?.value.trim()||'';
    const started=new Date().toISOString();
    section.innerHTML=`<div class="focus-v2-running"><div class="eyebrow">${esc(mode)} focus</div><h2>${esc(topic||task?.name||task?.title||'Focus session')}</h2><div class="focus-v2-clock" id="focusV2Clock">${String(minutes).padStart(2,'0')}:00</div><p>Stay with this one thing. You can finish early whenever you need.</p><button class="secondary" id="focusV2Stop">Finish session</button></div>`;
    let left=minutes*60; const clock=section.querySelector('#focusV2Clock');
    const timer=setInterval(()=>{left--;if(clock)clock.textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;if(left<=0){clearInterval(timer);finish();}},1000);
    section.querySelector('#focusV2Stop').addEventListener('click',()=>{clearInterval(timer);finish();});
    function finish(){
      const elapsed=Math.max(0,minutes-left);
      if(elapsed<1){render();return;}
      d.focusSessions=arr(d,'focusSessions');d.focusSessions.push({id:'FS-'+Date.now(),startedAt:started,endedAt:new Date().toISOString(),durationMinutes:elapsed,minutes:elapsed,mode,topic,taskId:task?.id||'',taskName:task?.name||task?.title||''});save(d);
      if(typeof window.recordFocusSession==='function'&&window.recordFocusSession!==finish)try{window.recordFocusSession({minutes:elapsed,topic,taskId:task?.id||'',mode});}catch(e){}
      render();
    }
  }
  window.renderFocusSpaceV2=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#focus')render();});
  window.addEventListener('hashchange',()=>{if(location.hash==='#focus')render();});
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#focus')render();});
})();
