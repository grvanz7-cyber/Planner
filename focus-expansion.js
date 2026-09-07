// ========================================
// FOCUS SPACE EXPANSION
// Adds planner task selection, study material shortcuts,
// session history, totals, and simple productivity rewards.
// ========================================
(function(){
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function save(){if(typeof savePlannerData==='function')savePlannerData();try{document.dispatchEvent(new Event('planner-data-changed'));}catch(e){}}
  function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function tasks(){return Array.isArray(data().tasks)?data().tasks:[];}
  function subjects(){return data().settings?.subjects||[];}
  function activeTasks(){return tasks().filter(t=>t&&t.status!=='Completed').slice().sort((a,b)=>{
    const da=a.dueDate?new Date(a.dueDate).getTime():Infinity, db=b.dueDate?new Date(b.dueDate).getTime():Infinity;
    return da-db;
  });}
  function ensure(){const d=data();if(!Array.isArray(d.focusSessions))d.focusSessions=[];}
  function fmt(ms){const m=Math.floor(ms/60000),s=Math.floor((ms%60000)/1000);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function subjectEmoji(name){return subjects().find(s=>s.name===name)?.emoji||'📚';}
  function render(){
    ensure(); const p=document.getElementById('focusPage'); if(!p)return;
    const sessions=data().focusSessions||[];
    const total=sessions.reduce((n,s)=>n+(Number(s.duration)||0),0);
    const todayKey=new Date().toISOString().slice(0,10);
    const today=sessions.filter(s=>String(s.startedAt||'').slice(0,10)===todayKey).reduce((n,s)=>n+(Number(s.duration)||0),0);
    const taskOptions=activeTasks().map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
    const current=p.querySelector('#focusTaskSelect'); if(current){const val=current.value;current.innerHTML='<option value="">Choose a task (optional)</option>'+taskOptions;current.value=val;}
    const stats=p.querySelector('#focusExpansionStats'); if(stats)stats.innerHTML=`<div class="focus-stat"><strong>${fmt(total*60000)}</strong><span>Total focus time</span></div><div class="focus-stat"><strong>${fmt(today*60000)}</strong><span>Today</span></div><div class="focus-stat"><strong>${sessions.length}</strong><span>Sessions</span></div>`;
    const list=p.querySelector('#focusSessionHistory'); if(list){const recent=sessions.slice().reverse().slice(0,8);list.innerHTML=recent.length?recent.map(s=>`<article class="focus-history-item"><div><strong>${esc(s.topic||'Focus session')}</strong><span>${esc(s.taskName||s.subject||'Personal focus')}</span></div><time>${fmt((Number(s.duration)||0)*60000)}</time></article>`).join(''):'<div class="focus-empty">No focus sessions yet. Your completed sessions will appear here.</div>';}
  }
  function ensureUI(){
    const p=document.getElementById('focusPage'); if(!p||p.querySelector('#focusExpansion'))return;
    const section=document.createElement('section'); section.id='focusExpansion';section.className='card focus-expansion-card';
    section.innerHTML=`<div class="focus-section-header"><div><h2>Focus context</h2><p>Connect a session to a task or study topic.</p></div></div>
      <div class="focus-context-row"><select id="focusTaskSelect"><option value="">Choose a task (optional)</option></select><input id="focusTopicInput" placeholder="Topic or purpose (optional)"><button type="button" class="secondary-button" id="focusStudyButton">🧠 Study</button></div>
      <div id="focusExpansionStats" class="focus-expansion-stats"></div>
      <div class="focus-history"><h3>Recent sessions</h3><div id="focusSessionHistory"></div></div>`;
    p.appendChild(section);
    const select=section.querySelector('#focusTaskSelect');
    select.addEventListener('change',()=>{const t=tasks().find(x=>String(x.id)===String(select.value));if(t){const topic=section.querySelector('#focusTopicInput');if(topic&&!topic.value)topic.value=t.name;}});
    section.querySelector('#focusStudyButton').onclick=()=>{
      const subject=subjects()[0]?.name||'';
      if(typeof showPage==='function')showPage('study');
      if(typeof window.openStudySessionGenerator==='function')window.openStudySessionGenerator({subject});
    };
    populateTaskSelect();render();
  }
  function populateTaskSelect(){const s=document.getElementById('focusTaskSelect');if(!s)return;const cur=s.value;s.innerHTML='<option value="">Choose a task (optional)</option>'+activeTasks().map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');if(cur)s.value=cur;}
  function recordSession(info){
    ensure();const d=data();const minutes=Math.max(0,Math.round(Number(info?.minutes)||0));if(minutes<1)return;
    const task=tasks().find(t=>String(t.id)===String(info?.taskId));
    d.focusSessions.push({id:`F-${Date.now()}`,startedAt:info.startedAt||new Date().toISOString(),endedAt:new Date().toISOString(),duration:minutes,taskId:task?.id||'',taskName:task?.name||'',subject:task?.subject||info.subject||'',topic:info.topic||'',mode:info.mode||'custom'});
    if(typeof d.pet==='object'&&d.pet){d.pet.xp=(Number(d.pet.xp)||0)+Math.min(50,minutes);d.pet.coins=(Number(d.pet.coins)||0)+Math.max(1,Math.floor(minutes/10));d.pet.level=Math.max(1,Math.floor((Number(d.pet.xp)||0)/100)+1);}
    save();render();
  }
  window.recordFocusSession=recordSession;
  window.renderFocusExpansion=render;
  document.addEventListener('DOMContentLoaded',()=>{ensureUI();});
  document.addEventListener('planner-data-changed',()=>{ensureUI();populateTaskSelect();render();});
  setTimeout(()=>{ensureUI();populateTaskSelect();render();},300);
})();
