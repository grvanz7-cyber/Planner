// ========================================
// Balanced Study Rotation
// ========================================
(function(){
  const A=v=>Array.isArray(v)?v:[];
  const D=86400000;
  const data=()=>window.plannerData||{};
  const subjects=d=>A((d.settings||{}).subjects).map(s=>typeof s==='string'?{name:s}:s).filter(s=>s&&s.name);
  const days=v=>{const x=new Date(v);return isNaN(x)?null:(x-Date.now())/D};
  function make(){
    const d=data(), ts=[...A(d.tasks),...A(d.assignments).map(a=>({...a,type:a.type||'assignment'}))].filter(x=>x.status!=='Completed'&&!x.completed);
    const ss=subjects(d), rows=ss.map(s=>{
      const own=ts.filter(t=>t.subject===s.name), due=A(d.studySets).filter(x=>x.subject===s.name).reduce((n,z)=>n+A(z.items).filter(c=>{const q=new Date(c.dueAt);return !isNaN(q)&&q<=new Date()}).length,0);
      let urgency=0, weight=own.length*2+due*3;
      own.forEach(t=>{const n=days(t.dueDate||t.dueAt);if(n!==null){if(n<0)urgency+=8;else if(n<2)urgency+=6;else if(n<5)urgency+=3;else if(n<8)urgency+=1;}if(t.priority==='High')urgency+=4;if(/exam/i.test(t.type||t.name||''))urgency+=5;else if(/test/i.test(t.type||t.name||''))urgency+=3;});
      return {name:s.name,icon:s.emoji||'📚',work:own.length,due,score:weight+urgency,urgency};
    });
    return rows.sort((a,b)=>b.score-a.score);
  }
  function render(){
    const page=document.getElementById('smartStudyPage');if(!page)return;
    let box=document.getElementById('smartBalance');if(!box){box=document.createElement('div');box.id='smartBalance';box.className='smart-balance';page.appendChild(box)}
    const rows=make();
    box.innerHTML='<div class="smart-balance-head"><h2>Balanced study rotation</h2><p>Prevents your schedule from becoming all one subject while still respecting urgency.</p></div>'+(rows.length?'<div class="smart-balance-grid">'+rows.map((r,i)=>`<div class="smart-balance-card"><div class="smart-balance-top"><span class="smart-balance-icon">${r.icon}</span><strong>${r.name}</strong><span class="smart-balance-rank">#${i+1}</span></div><div class="smart-balance-stats"><span>${r.work} active</span><span>${r.due} reviews due</span><span>${r.urgency} urgency</span></div><button data-subject="${String(r.name).replace(/"/g,'&quot;')}">Study this</button></div>`).join('')+'</div>':'<div class="smart-balance-empty">Add active subjects and schoolwork to build a rotation.</div>');
    box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const s=b.dataset.subject;sessionStorage.setItem('smartStudySubject',s);location.hash='#study';});
  }
  window.renderSmartBalance=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#smart')render()});
  window.addEventListener('hashchange',()=>{if(location.hash==='#smart')render()});
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#smart')render()});
})();
