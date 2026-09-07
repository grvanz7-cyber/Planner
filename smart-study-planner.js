// ========================================
// Adaptive Study Planner
// ========================================
(function(){
  const KEY='plannerData';
  const now=()=>new Date();
  const read=()=>window.plannerData||JSON.parse(localStorage.getItem(KEY)||'{}');
  const save=d=>{window.plannerData=d;localStorage.setItem(KEY,JSON.stringify(d));document.dispatchEvent(new CustomEvent('planner-data-changed'));};
  const arr=(d,k)=>Array.isArray(d[k])?d[k]:[];
  const validDate=v=>{const x=new Date(v);return isNaN(x)?null:x};

  function subjects(d){
    const s=arr(d.settings||{},'subjects');
    return s.length?s.map(x=>typeof x==='string'?{name:x}:x).filter(x=>x&&x.name):[];
  }
  function taskScore(t){
    let score=0;
    const due=validDate(t.dueDate||t.dueAt);
    if(due){const days=(due-now())/86400000; if(days<0)score+=90; else if(days<1)score+=75; else if(days<3)score+=55; else if(days<7)score+=30; else score+=10;}
    if(t.priority==='High')score+=25; else if(t.priority==='Medium')score+=12;
    if(t.type==='test'||t.type==='exam')score+=25; else if(t.type==='quiz'||t.type==='assignment')score+=15;
    if(t.status==='Completed'||t.completed)score-=100;
    return score;
  }
  function dueCards(d,subject){
    const sets=arr(d,'studySets'); const cutoff=now(); const out=[];
    sets.forEach(set=>{
      if(subject && set.subject!==subject)return;
      arr(set,'items').forEach(card=>{
        if(!card.front||!card.back)return;
        const due=validDate(card.dueAt);
        if(!due || due<=cutoff) out.push({kind:'flashcard',set,card,score:100+(card.mastery||0)*-0.3});
      });
    });
    return out;
  }
  function weakQuestions(d,subject){
    const history=arr(d,'studyPracticeHistory');
    const bad=history.flatMap(h=>arr(h,'incorrect').map(q=>({...q,last:h.completedAt||h.createdAt}))).filter(q=>!subject||q.subject===subject);
    return bad.slice(0,8);
  }
  function recommendations(){
    const d=read(), ts=arr(d,'tasks'), as=arr(d,'assignments');
    const upcoming=[...ts,...as.map(a=>({...a,type:a.type||'assignment'}))].filter(x=>x.status!=='Completed'&&!x.completed).map(x=>({...x,score:taskScore(x)})).sort((a,b)=>b.score-a.score);
    const subs=subjects(d);
    const rec=[];
    upcoming.slice(0,4).forEach(t=>rec.push({kind:'task',icon:'📌',title:t.name||'School task',detail:t.dueDate?`Due ${new Date(t.dueDate).toLocaleDateString()}`:'No due date',subject:t.subject,score:t.score,action:()=>{location.hash='#tasks';}}));
    subs.forEach(s=>{
      const due=dueCards(d,s.name), weak=weakQuestions(d,s.name);
      if(due.length)rec.push({kind:'review',icon:'🔁',title:`Review ${s.name}`,detail:`${due.length} card${due.length===1?'':'s'} due`,subject:s.name,score:70+Math.min(due.length,10),action:()=>{location.hash='#study';}});
      if(weak.length)rec.push({kind:'weak',icon:'🎯',title:`Practice ${s.name}`,detail:`${weak.length} recent weak question${weak.length===1?'':'s'}`,subject:s.name,score:60,action:()=>{location.hash='#practice';}});
    });
    if(!rec.length)rec.push({kind:'rest',icon:'🌿',title:'You’re caught up',detail:'No urgent school or study work was found.',score:1,action:()=>{}});
    return rec.sort((a,b)=>b.score-a.score).slice(0,8);
  }

  function ensurePage(){
    if(!document.getElementById('smartStudyPage')){
      const page=document.createElement('section'); page.id='smartStudyPage'; page.className='page smart-study-page';
      page.innerHTML='<div class="smart-study-header"><div><div class="eyebrow">Study intelligence</div><h1>What should I do next?</h1><p>Recommendations based on deadlines, priority, reviews, and recent practice.</p></div><button class="secondary" id="refreshSmartStudy">Refresh</button></div><div id="smartStudySummary" class="smart-study-summary"></div><div id="smartStudyList" class="smart-study-list"></div>';
      const host=document.querySelector('main')||document.body; host.appendChild(page);
    }
    if(!document.querySelector('[data-smart-study-nav]')){
      const nav=document.querySelector('nav')||document.querySelector('.sidebar');
      if(nav){const a=document.createElement('a');a.href='#smart';a.textContent='✨ What next?';a.dataset.smartStudyNav='1';nav.appendChild(a);}
    }
  }
  function render(){
    ensurePage();
    const list=document.getElementById('smartStudyList'), summary=document.getElementById('smartStudySummary'); if(!list)return;
    const d=read(), rec=recommendations();
    const due=dueCards(d).length;
    summary.innerHTML=`<div><strong>${due}</strong><span>cards due</span></div><div><strong>${rec.filter(x=>x.kind==='task').length}</strong><span>priority tasks</span></div><div><strong>${rec.filter(x=>x.kind==='weak').length}</strong><span>weak areas</span></div>`;
    list.innerHTML=rec.map((r,i)=>`<button class="smart-study-card" data-smart-index="${i}"><span class="smart-study-icon">${r.icon}</span><span class="smart-study-copy"><strong>${r.title}</strong><small>${r.detail}${r.subject?` · ${r.subject}`:''}</small></span><span class="smart-study-arrow">›</span></button>`).join('');
    list.querySelectorAll('[data-smart-index]').forEach(b=>b.addEventListener('click',()=>rec[+b.dataset.smartIndex].action()));
    const refresh=document.getElementById('refreshSmartStudy'); if(refresh&&!refresh.dataset.bound){refresh.dataset.bound='1';refresh.addEventListener('click',render);}
  }
  function route(){if(location.hash==='#smart')render();}
  window.renderSmartStudy=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#smart')render();});
  window.addEventListener('hashchange',route);
  document.addEventListener('DOMContentLoaded',route);
})();
