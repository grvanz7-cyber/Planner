(() => {
  const fallbackSubjects = [
    {name:'English', emoji:'📖'},
    {name:'Physics', emoji:'⚛️'},
    {name:'Chemistry', emoji:'🧪'},
    {name:'Math', emoji:'📐'}
  ];

  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tasks = () => window.PlannerAppData?.getTasks?.() || [];
  const dateOnly = v => { if(!v)return null; const d=new Date(String(v).slice(0,10)+'T00:00:00'); return Number.isNaN(d.getTime())?null:d; };
  const typeIcon = t => ({assignment:'📄',quiz:'❓',test:'🧪',exam:'🎓'})[String(t||'').toLowerCase()] || '📚';
  const fmt = v => { const d=dateOnly(v); if(!d)return 'No due date'; const n=new Date();n.setHours(0,0,0,0);const diff=Math.round((d-n)/86400000);if(diff===0)return 'Today';if(diff===1)return 'Tomorrow';if(diff===-1)return 'Yesterday';return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}); };

  function getSubjects(all){
    const subjects = [];
    try {
      const raw = JSON.parse(localStorage.getItem('plannerData') || 'null');
      const configured = raw?.subjects;
      if(Array.isArray(configured)) configured.forEach(s=>{
        const name = s?.name || s?.subject;
        if(name && !subjects.some(x=>x.name.toLowerCase()===String(name).toLowerCase())) subjects.push({name:String(name),emoji:s.emoji||'📚'});
      });
    } catch(e){}
    all.forEach(t=>{
      if(!t.subject)return;
      const name=String(t.subject).trim();
      if(name && !subjects.some(x=>x.name.toLowerCase()===name.toLowerCase())) subjects.push({name,emoji:'📚'});
    });
    fallbackSubjects.forEach(s=>{
      if(!subjects.some(x=>x.name.toLowerCase()===s.name.toLowerCase())) subjects.push(s);
    });
    return subjects;
  }

  function schoolTasks(all){
    return all.filter(t=>t.subject || ['assignment','quiz','test','exam'].includes(String(t.type||'').toLowerCase()));
  }

  function render(container){
    const all=tasks();
    const school=schoolTasks(all);
    const subjects=getSubjects(all);
    const active=school.filter(t=>!t.completed && String(t.status||'').toLowerCase()!=='completed');
    const assessments=active.filter(t=>['quiz','test','exam'].includes(String(t.type||'').toLowerCase()));
    const assignments=active.filter(t=>String(t.type||'').toLowerCase()==='assignment');
    const next=[...active].filter(t=>t.dueDate).sort((a,b)=>String(a.dueDate).localeCompare(String(b.dueDate))).slice(0,5);

    container.innerHTML=`
      <style>
        .school-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:12px}
        .school-stat{background:var(--card);border-radius:15px;padding:12px 8px;text-align:center;box-shadow:0 2px 10px #0000000d}
        .school-stat strong{display:block;font-size:21px;line-height:1.1}.school-stat span{display:block;color:var(--muted);font-size:11px;margin-top:3px}
        .school-subject-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
        .school-subject{border:1px solid var(--border);background:var(--bg);color:var(--text);border-radius:15px;padding:14px;text-align:left;cursor:pointer;min-height:82px}
        .school-subject:active{transform:scale(.98)}.school-subject-icon{font-size:24px;display:block;margin-bottom:7px}.school-subject strong{font-size:14px}
        .school-section{margin-top:12px}.school-list{display:flex;flex-direction:column}.school-item{display:flex;align-items:center;gap:11px;padding:12px 0;border-top:1px solid var(--border);cursor:pointer}.school-item:first-child{border-top:0}
        .school-item-icon{width:34px;height:34px;border-radius:11px;background:var(--soft);display:grid;place-items:center;font-size:17px;flex:0 0 34px}.school-item-main{min-width:0;flex:1}.school-item-name{font-size:14px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.school-item-meta{font-size:11px;color:var(--muted);margin-top:3px}.school-due{font-size:11px;color:var(--muted);white-space:nowrap}.school-due.soon{color:var(--text);font-weight:650}.school-due.overdue{color:#c96d5c;font-weight:700}
        .school-sheet-backdrop{position:fixed;inset:0;z-index:60;background:#00000055;display:flex;align-items:flex-end}.school-sheet{position:relative;width:100%;max-height:82%;overflow:auto;background:var(--card);border-radius:24px 24px 0 0;padding:10px 18px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -8px 30px #00000025}.school-grab{width:42px;height:5px;border-radius:9px;background:#0003;margin:0 auto 13px}.school-sheet-head{display:flex;justify-content:space-between;align-items:center}.school-sheet h2{margin:0;font-size:20px}.school-sheet-close{border:0;background:transparent;color:var(--muted);font-size:30px;line-height:1}.school-progress{height:7px;border-radius:8px;background:var(--soft);overflow:hidden;margin:12px 0 15px}.school-progress i{display:block;height:100%;background:var(--accent);border-radius:8px}
      </style>
      <div class="greeting"><h1>School</h1><p>Keep your classes and schoolwork in one place.</p></div>
      <div class="school-stat-grid">
        <div class="school-stat"><strong>${active.length}</strong><span>Active</span></div>
        <div class="school-stat"><strong>${assignments.length}</strong><span>Assignments</span></div>
        <div class="school-stat"><strong>${assessments.length}</strong><span>Assessments</span></div>
      </div>
      <section class="card"><div class="head"><h2>Subjects</h2><span class="count">${subjects.length}</span></div><div class="school-subject-grid">${subjects.map(s=>`<button class="school-subject" data-subject="${esc(s.name)}"><span class="school-subject-icon">${s.emoji}</span><strong>${esc(s.name)}</strong></button>`).join('')}</div></section>
      <section class="card school-section"><div class="head"><h2>Coming up</h2><span class="count">${next.length}</span></div><div class="school-list">${next.length?next.map(t=>item(t)).join(''):'<div class="empty">No upcoming schoolwork.</div>'}</div></section>
      <section class="card school-section"><div class="head"><h2>Schoolwork</h2><span class="count">${school.length}</span></div><div class="school-list">${school.length?[...school].sort((a,b)=>String(b.completed)-String(a.completed)||String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999'))).slice(0,8).map(t=>item(t)).join(''):'<div class="empty">No schoolwork yet.</div>'}</div></section>`;

    container.querySelectorAll('.school-subject').forEach(b=>b.onclick=()=>showSubject(b.dataset.subject));
    container.querySelectorAll('.school-item').forEach(el=>el.onclick=()=>showTask(el.dataset.id));
  }

  function item(t){
    const d=dateOnly(t.dueDate); const n=new Date();n.setHours(0,0,0,0); const diff=d?Math.round((d-n)/86400000):null;
    return `<div class="school-item" data-id="${esc(t.id||'')}"><div class="school-item-icon">${typeIcon(t.type)}</div><div class="school-item-main"><div class="school-item-name">${esc(t.name)}</div><div class="school-item-meta">${esc(t.subject||'School')} · ${esc(t.type||'Task')}</div></div><div class="school-due ${diff!=null&&diff<0?'overdue':''} ${diff!=null&&diff>=0&&diff<=1?'soon':''}">${esc(fmt(t.dueDate))}</div></div>`;
  }

  function showSubject(subject){
    const matching=schoolTasks(tasks()).filter(t=>String(t.subject||'').toLowerCase()===subject.toLowerCase());
    const active=matching.filter(t=>!t.completed); const completed=matching.length-active.length; const pct=matching.length?Math.round(completed/matching.length*100):0;
    const backdrop=document.createElement('div'); backdrop.className='school-sheet-backdrop';
    backdrop.innerHTML=`<section class="school-sheet" role="dialog" aria-modal="true"><div class="school-grab"></div><div class="school-sheet-head"><div><h2>${esc(subject)}</h2><div class="count">${completed} of ${matching.length} completed</div></div><button class="school-sheet-close" aria-label="Close">×</button></div><div class="school-progress"><i style="width:${pct}%"></i></div><div class="school-list">${matching.length?[...matching].sort((a,b)=>String(a.completed)-String(b.completed)||String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999'))).map(t=>item(t)).join(''):'<div class="empty">No schoolwork for this subject.</div>'}</div></section>`;
    document.body.appendChild(backdrop);
    backdrop.onclick=e=>{if(e.target===backdrop||e.target.closest('.school-sheet-close'))backdrop.remove();};
    backdrop.querySelectorAll('.school-item').forEach(el=>el.onclick=()=>showTask(el.dataset.id));
  }

  function showTask(id){
    const t=tasks().find(x=>String(x.id)===String(id)); if(!t)return;
    const backdrop=document.createElement('div'); backdrop.className='school-sheet-backdrop';
    backdrop.innerHTML=`<section class="school-sheet" role="dialog" aria-modal="true"><div class="school-grab"></div><div class="school-sheet-head"><h2>${esc(t.name)}</h2><button class="school-sheet-close" aria-label="Close">×</button></div><div class="quick" style="margin-top:10px"><span class="quick-icon">${typeIcon(t.type)}</span><div class="quick-main"><div class="quick-title">${esc(t.type||'Task')}</div><div class="quick-sub">${esc(t.subject||'School')} · ${esc(fmt(t.dueDate))}</div></div></div><div class="quick"><span class="quick-icon">${t.completed?'✓':'○'}</span><div class="quick-main"><div class="quick-title">${t.completed?'Completed':'In progress'}</div><div class="quick-sub">${esc(t.priority||'Normal')} priority</div></div></div></section>`;
    document.body.appendChild(backdrop);
    backdrop.onclick=e=>{if(e.target===backdrop||e.target.closest('.school-sheet-close'))backdrop.remove();};
  }

  window.PlannerAppSchool={render,showSubject};
})();