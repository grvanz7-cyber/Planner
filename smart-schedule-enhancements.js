// ========================================
// Adaptive Schedule Enhancements
// ========================================
(function(){
  const A=v=>Array.isArray(v)?v:[];
  const d=()=>window.plannerData||{};
  const daysUntil=v=>{const x=new Date(v);return isNaN(x)?99:(x-Date.now())/86400000};
  function getItems(){
    const p=d();
    const tasks=[...A(p.tasks),...A(p.assignments).map(x=>({...x,type:x.type||'assignment'}))].filter(x=>x.status!=='Completed'&&!x.completed);
    const items=[];
    tasks.forEach(t=>items.push({id:t.id||t.name,name:t.name||'Schoolwork',subject:t.subject||'General',minutes:Math.max(15,Math.min(90,Number(t.estimatedMinutes||t.duration||30)||30)),due:daysUntil(t.dueDate||t.dueAt),priority:t.priority==='High'?3:1,type:'task'}));
    A(p.studySets).forEach(s=>{A(s.items).forEach(c=>{if(c.dueAt&&new Date(c.dueAt)<=new Date())items.push({id:'card-'+c.id,name:'Flashcard review',subject:s.subject||'General',minutes:10,due:0,priority:2,type:'review'});});});
    return items;
  }
  function build(days,minutes){
    const items=getItems().sort((a,b)=>(a.due<0?-20:a.due<2?-10:0)+(b.priority-a.priority)-(b.due<0?-20:b.due<2?-10:0));
    const used=new Set(),out=[];
    const bySubject={};items.forEach(x=>(bySubject[x.subject]??=[]).push(x));
    const subjects=Object.keys(bySubject);
    for(let day=0;day<days;day++){
      let left=minutes, chosen=[];
      for(let pass=0;pass<subjects.length&&left>=10;pass++){
        const s=subjects[(day+pass)%subjects.length];
        const x=bySubject[s].find(i=>!used.has(i.id));
        if(x&&x.minutes<=left){chosen.push(x);used.add(x.id);left-=x.minutes;}
      }
      // Fill remaining capacity with highest-scoring work.
      items.forEach(x=>{if(left>=x.minutes&&!used.has(x.id)){chosen.push(x);used.add(x.id);left-=x.minutes;}});
      out.push({day:day===0?'Today':day===1?'Tomorrow':new Date(Date.now()+day*86400000).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}),items:chosen,minutes:minutes-left});
    }
    return out;
  }
  function render(){
    const page=document.getElementById('smartStudyPage');if(!page)return;
    let box=document.getElementById('adaptiveSchedule');if(!box){box=document.createElement('div');box.id='adaptiveSchedule';box.className='adaptive-schedule';page.appendChild(box)}
    box.innerHTML='<div class="adaptive-head"><h2>Adaptive schedule</h2><p>Balances subjects across your available study time while protecting urgent work.</p></div><div class="adaptive-controls"><label>Days <input id="adaptiveDays" type="number" min="1" max="14" value="7"></label><label>Minutes/day <input id="adaptiveMinutes" type="number" min="15" max="480" value="120"></label><button id="adaptiveBuild">Build adaptive plan</button></div><div id="adaptiveResults"></div>';
    const draw=()=>{const days=Math.max(1,Math.min(14,Number(adaptiveDays.value)||7)),mins=Math.max(15,Math.min(480,Number(adaptiveMinutes.value)||120));adaptiveResults.innerHTML=build(days,mins).map(x=>`<div class="adaptive-day"><div class="adaptive-dayhead"><strong>${x.day}</strong><span>${x.minutes}/${mins} min</span></div>${x.items.length?x.items.map(i=>`<div class="adaptive-item"><span>${i.type==='review'?'🔁':'📚'}</span><div><strong>${String(i.name).replace(/[<>]/g,'')}</strong><small>${String(i.subject).replace(/[<>]/g,'')} · ${i.minutes} min${i.due<2?' · urgent':''}</small></div></div>`).join(''):'<div class="adaptive-empty">Buffer / recovery time</div>'}</div>`).join('')};
    adaptiveBuild.onclick=draw;draw();
  }
  window.renderAdaptiveSchedule=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#smart')render()});
  window.addEventListener('hashchange',()=>{if(location.hash==='#smart')render()});
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#smart')render()});
})();
