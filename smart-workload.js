// ========================================
// Smart Workload Balancing
// ========================================
(function(){
  const read=()=>window.plannerData||JSON.parse(localStorage.getItem('plannerData')||'{}');
  const list=(v)=>Array.isArray(v)?v:[];
  const date=v=>{const d=new Date(v);return isNaN(d)?null:d};
  const daysUntil=v=>{const d=date(v);return d?(d-Date.now())/86400000:null};
  const subjects=d=>list((d.settings||{}).subjects).map(s=>typeof s==='string'?{name:s}:s).filter(s=>s&&s.name);
  function stats(d){
    const subs=subjects(d), tasks=[...list(d.tasks),...list(d.assignments).map(a=>({...a,type:a.type||'assignment'}))];
    const result=subs.map(s=>{
      const own=tasks.filter(t=>t.subject===s.name&&t.status!=='Completed'&&!t.completed);
      let points=own.length*8, urgent=0, minutes=0;
      own.forEach(t=>{const days=daysUntil(t.dueDate||t.dueAt); if(days!==null){if(days<0){points+=55;urgent++;}else if(days<1){points+=40;urgent++;}else if(days<3){points+=25;}else if(days<7){points+=12;}} if(t.priority==='High')points+=12; minutes+=Math.max(10,Math.min(90,Number(t.estimatedMinutes||t.duration||30)||30));});
      const sets=list(d.studySets).filter(x=>x.subject===s.name), due=sets.reduce((n,set)=>n+list(set.items).filter(c=>{const x=date(c.dueAt);return x&&x<=new Date();}).length,0);
      points+=due*3;
      const recent=list(d.studyPracticeHistory).filter(h=>h.subject===s.name||h.quizSubject===s.name).slice(-5);
      let accuracy=null; if(recent.length){const total=recent.reduce((n,h)=>n+Number(h.total||0),0),correct=recent.reduce((n,h)=>n+Number(h.score||0),0);if(total)accuracy=Math.round(correct/total*100);}
      if(accuracy!==null&&accuracy<70)points+=25;
      return {name:s.name,icon:s.emoji||'📚',tasks:own.length,minutes,due,urgent,accuracy,points};
    }).sort((a,b)=>b.points-a.points);
    const max=result[0]?.points||0;
    return result.map((x,i)=>({...x,rank:i+1,load:max?Math.round(x.points/max*100):0}));
  }
  function render(){
    const page=document.getElementById('smartStudyPage'); if(!page)return;
    let box=document.getElementById('smartWorkload');
    if(!box){box=document.createElement('div');box.id='smartWorkload';box.className='smart-workload';page.appendChild(box);}
    const rows=stats(read());
    box.innerHTML='<div class="smart-workload-head"><div><h2>Subject balance</h2><p>Prioritizes subjects that have more work, closer deadlines, due reviews, or recent weak practice.</p></div></div>'+(rows.length?rows.map((x,i)=>`<div class="smart-workload-row"><div class="smart-workload-rank">${i+1}</div><div class="smart-workload-icon">${x.icon}</div><div class="smart-workload-main"><strong>${x.name}</strong><div class="smart-workload-bar"><span style="width:${x.load}%"></span></div><small>${x.tasks} active task${x.tasks===1?'':'s'} · ${x.minutes} min estimated${x.due?` · ${x.due} review${x.due===1?'':'s'} due`:''}${x.accuracy!==null?` · ${x.accuracy}% recent practice`:''}</small></div><div class="smart-workload-status">${x.urgent?'🔥':''}${x.accuracy!==null&&x.accuracy<70?'🎯':''}</div></div>`).join(''):'<div class="smart-workload-empty">Add active subjects to see workload balance.</div>');
  }
  window.renderSmartWorkload=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#smart')render();});
  window.addEventListener('hashchange',()=>{if(location.hash==='#smart')render();});
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#smart')render();});
})();
