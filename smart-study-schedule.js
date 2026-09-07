// ========================================
// Automatic Study Schedule
// ========================================
(function(){
  const DAY=86400000;
  const getData=()=>window.plannerData||JSON.parse(localStorage.getItem('plannerData')||'{}');
  const arr=v=>Array.isArray(v)?v:[];
  const dt=v=>{const d=new Date(v);return isNaN(d)?null:d};
  const subjects=d=>arr((d.settings||{}).subjects).map(s=>typeof s==='string'?{name:s}:s).filter(s=>s&&s.name);
  const daysUntil=v=>{const d=dt(v);return d?(d-Date.now())/DAY:null};
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function build(days,hours){
    const d=getData(), subs=subjects(d), tasks=[...arr(d.tasks),...arr(d.assignments).map(a=>({...a,type:a.type||'assignment'}))].filter(t=>t.status!=='Completed'&&!t.completed);
    const capacity=Math.max(30,Number(hours||2)*60), perDay=Math.max(30,Math.floor(capacity/Math.max(1,days)));
    const rows=[];
    subs.forEach(s=>{
      const own=tasks.filter(t=>t.subject===s.name), dueReviews=arr(d.studySets).filter(x=>x.subject===s.name).reduce((n,set)=>n+arr(set.items).filter(c=>{const x=dt(c.dueAt);return x&&x<=new Date();}).length,0);
      let score=own.length*8+dueReviews*4;
      own.forEach(t=>{const n=daysUntil(t.dueDate||t.dueAt);if(n!==null){if(n<0)score+=60;else if(n<1)score+=45;else if(n<3)score+=30;else if(n<7)score+=15;}if(t.priority==='High')score+=15;if(/exam|test|quiz|assessment/i.test(t.type||t.name||''))score+=10;});
      if(score>0)rows.push({subject:s.name,icon:s.emoji||'📚',score,tasks:own,dueReviews});
    });
    rows.sort((a,b)=>b.score-a.score);
    const plan=[];let remaining=capacity;
    for(let day=0;day<days;day++){
      let used=0, picked=[];
      const rotation=rows.slice(day%Math.max(1,rows.length)).concat(rows.slice(0,day%Math.max(1,rows.length)));
      rotation.forEach(r=>{if(used>=perDay)return;const t=r.tasks.find(x=>!picked.some(p=>p.id===x.id)&&!plan.some(p=>p.id===x.id));if(t){const mins=Math.min(Math.max(20,Number(t.estimatedMinutes||t.duration||30)||30),perDay-used);picked.push({id:t.id||t.name,name:t.name||'Study task',subject:r.subject,icon:r.icon,minutes:mins,kind:'task'});used+=mins;}});
      const extra=rows.find(r=>r.dueReviews&&!picked.some(p=>p.subject===r.subject));
      if(extra&&used+20<=perDay){picked.push({id:'review-'+extra.subject+'-'+day,name:'Flashcard review',subject:extra.subject,icon:extra.icon,minutes:20,kind:'review'});used+=20;}
      plan.push({label:day===0?'Today':day===1?'Tomorrow':new Date(Date.now()+day*DAY).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}),items:picked,used});
    }
    return {plan,rows,capacity};
  }
  function render(){
    const page=document.getElementById('smartStudyPage');if(!page)return;
    let box=document.getElementById('smartSchedule');if(!box){box=document.createElement('div');box.id='smartSchedule';box.className='smart-schedule';page.appendChild(box);}
    const saved=JSON.parse(sessionStorage.getItem('smartSchedulePrefs')||'{}');
    box.innerHTML=`<div class="smart-schedule-head"><div><h2>Automatic study schedule</h2><p>Turns your workload, deadlines and review needs into a balanced plan.</p></div><div class="smart-schedule-controls"><label>Days <input id="smartScheduleDays" type="number" min="1" max="14" value="${saved.days||7}"></label><label>Hours/day <input id="smartScheduleHours" type="number" min="0.5" max="8" step="0.5" value="${saved.hours||2}"></label><button id="smartScheduleBuild">Build plan</button></div></div><div id="smartScheduleBody"></div>`;
    const draw=()=>{const days=Math.max(1,Math.min(14,Number(document.getElementById('smartScheduleDays').value)||7)),hours=Math.max(.5,Math.min(8,Number(document.getElementById('smartScheduleHours').value)||2));sessionStorage.setItem('smartSchedulePrefs',JSON.stringify({days,hours}));const out=build(days,hours);document.getElementById('smartScheduleBody').innerHTML=out.plan.map(x=>`<div class="smart-schedule-day"><div class="smart-schedule-dayhead"><strong>${x.label}</strong><span>${x.used}/${Math.round(out.capacity/days)} min</span></div>${x.items.length?x.items.map(i=>`<div class="smart-schedule-item"><span class="smart-schedule-icon">${i.icon}</span><div><strong>${escape(i.name)}</strong><small>${escape(i.subject)} · ${i.minutes} min${i.kind==='review'?' · review':''}</small></div></div>`).join(''):'<div class="smart-schedule-empty">No scheduled work — use this as a recovery/buffer day.</div>'}</div>`).join('');};
    document.getElementById('smartScheduleBuild').onclick=draw;draw();
  }
  window.renderSmartStudySchedule=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#smart')render();});
  window.addEventListener('hashchange',()=>{if(location.hash==='#smart')render();});
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#smart')render();});
})();
