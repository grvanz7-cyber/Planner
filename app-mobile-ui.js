(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function tasks(){ return window.PlannerAppData ? window.PlannerAppData.getTasks() : []; }

  function saveTasks(next){
    try {
      localStorage.setItem('plannerTasks', JSON.stringify(next));
      const raw = JSON.parse(localStorage.getItem('plannerData') || 'null');
      if(raw && typeof raw === 'object'){
        raw.tasks = next;
        localStorage.setItem('plannerData', JSON.stringify(raw));
      }
    } catch(e) {}
    window.PlannerAppData?.refresh?.();
  }

  function dateOnly(value){
    if(!value) return null;
    const d = new Date(String(value).slice(0,10) + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function dayKey(d){ return d.toISOString().slice(0,10); }

  function formatDate(value){
    const d = dateOnly(value);
    if(!d) return '';
    const now = new Date();
    now.setHours(0,0,0,0);
    const diff = Math.round((d-now)/86400000);
    if(diff === 0) return 'Today';
    if(diff === 1) return 'Tomorrow';
    if(diff > 1 && diff < 7) return d.toLocaleDateString(undefined,{weekday:'long'});
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }

  function typeIcon(t){
    const type=String(t.type||'task').toLowerCase();
    return type==='event'?'◷':type==='note'?'📝':type==='assignment'?'📄':type==='quiz'?'❓':type==='test'?'🧪':type==='exam'?'🎓':'✓';
  }

  function taskCard(t, extraClass=''){
    const done = !!t.completed;
    const date = formatDate(t.dueDate);
    const meta = [t.type || 'Task', t.subject, date].filter(Boolean).join(' · ');
    return `<button class="mobile-task ${done?'done':''} ${extraClass}" data-id="${esc(t.id || t.name)}">
      <span class="mobile-check">${done?'✓':typeIcon(t)}</span>
      <span class="mobile-task-body"><strong>${esc(t.name || 'Untitled')}</strong><small>${esc(meta)}</small></span>
      ${t.priority && String(t.priority).toLowerCase()!=='normal' ? `<span class="priority-dot priority-${esc(String(t.priority).toLowerCase())}" aria-label="${esc(t.priority)} priority"></span>` : ''}
    </button>`;
  }

  function bindTaskCards(){
    document.querySelectorAll('.mobile-task').forEach(el=>el.onclick=()=>{
      const id=el.dataset.id;
      const list=tasks();
      const index=list.findIndex(t=>String(t.id||t.name)===id);
      if(index<0)return;
      list[index].completed=!list[index].completed;
      if('status' in list[index]) list[index].status=list[index].completed?'Completed':'Not Started';
      saveTasks(list);
      const view=el.closest('[data-mobile-view]')?.dataset.mobileView;
      if(view && window.PlannerAppNavigation) window.PlannerAppNavigation.render(view);
    });
  }

  function renderToday(c){
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayKey = dayKey(today);
    const all = tasks();
    const active = all.filter(t=>!t.completed);
    const overdue = active.filter(t=>{
      const d=dateOnly(t.dueDate);
      return d && d < today;
    }).sort((a,b)=>dateOnly(a.dueDate)-dateOnly(b.dueDate));
    const due = active.filter(t=>{
      const d=dateOnly(t.dueDate);
      return d && dayKey(d)===todayKey;
    });
    const upcoming = active.filter(t=>{
      const d=dateOnly(t.dueDate);
      return d && d > today;
    }).sort((a,b)=>dateOnly(a.dueDate)-dateOnly(b.dueDate)).slice(0,5);

    const hour=new Date().getHours();
    const greeting=hour<12?'Good morning!':hour<18?'Good afternoon!':'Good evening!';
    const totalToday=due.length;
    const totalOverdue=overdue.length;
    const summary = totalOverdue
      ? `${totalOverdue} overdue · ${totalToday} due today`
      : totalToday
        ? `${totalToday} item${totalToday===1?'':'s'} due today`
        : 'You’re all caught up for today';

    c.innerHTML=`<div class="greeting"><h1>${greeting}</h1><p>${summary}</p></div>
      <section class="today-summary">
        <div><strong>${totalToday}</strong><span>Today</span></div>
        <div><strong>${totalOverdue}</strong><span>Overdue</span></div>
        <div><strong>${active.length}</strong><span>Active</span></div>
      </section>
      ${overdue.length?`<section class="card overdue-card" data-mobile-view="today"><div class="card-head"><h2>Overdue</h2><span class="count">${overdue.length}</span></div>${overdue.map(t=>taskCard(t,'overdue-task')).join('')}</section>`:''}
      <section class="card" data-mobile-view="today"><div class="card-head"><h2>Today</h2><span class="count">${due.length}</span></div>${due.length?due.map(taskCard).join(''):'<div class="empty today-empty"><span>✓</span><strong>Nothing due today</strong><small>Enjoy the breathing room.</small></div>'}</section>
      <section class="card"><div class="card-head"><h2>Upcoming</h2><span class="count">${upcoming.length}</span></div>${upcoming.length?upcoming.map(taskCard).join(''):'<div class="empty">Nothing coming up.</div>'}</section>`;
    bindTaskCards();
  }

  function renderTasks(c){
    const active=tasks().filter(t=>!t.completed);
    const done=tasks().filter(t=>t.completed).slice(0,5);
    c.innerHTML=`<div class="greeting"><h1>Tasks</h1><p>${active.length} active task${active.length===1?'':'s'}</p></div>
      <section class="card" data-mobile-view="tasks"><div class="card-head"><h2>Active</h2></div>${active.length?active.map(taskCard).join(''):'<div class="empty">You’re all caught up.</div>'}</section>
      ${done.length?`<section class="card" data-mobile-view="tasks"><div class="card-head"><h2>Recently completed</h2></div>${done.map(taskCard).join('')}</section>`:''}`;
    bindTaskCards();
  }

  function renderMore(c){
    if(window.PlannerAppSettings) return window.PlannerAppSettings.render(c);
  }

  window.PlannerMobileUI={renderToday,renderTasks,renderMore,bindTaskCards};
})();
