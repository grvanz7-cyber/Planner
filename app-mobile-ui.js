(() => {
  const root = document.documentElement;
  const content = () => document.getElementById('content');
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function tasks(){ return window.PlannerAppData ? window.PlannerAppData.getTasks() : []; }
  function saveTasks(next){
    try {
      localStorage.setItem('plannerTasks', JSON.stringify(next));
      const raw = JSON.parse(localStorage.getItem('plannerData') || 'null');
      if(raw && typeof raw === 'object'){ raw.tasks = next; localStorage.setItem('plannerData', JSON.stringify(raw)); }
    } catch(e) {}
    if(window.PlannerAppData) window.PlannerAppData.refresh();
  }

  function taskCard(t){
    const done = !!t.completed;
    return `<button class="mobile-task ${done?'done':''}" data-id="${esc(t.id || t.name)}">
      <span class="mobile-check">${done?'✓':''}</span>
      <span class="mobile-task-body"><strong>${esc(t.name || 'Untitled')}</strong><small>${esc(t.type || 'Task')}${t.subject?' · '+esc(t.subject):''}${t.dueDate?' · '+esc(t.dueDate):''}</small></span>
    </button>`;
  }

  function bindTaskCards(){
    document.querySelectorAll('.mobile-task').forEach(el=>el.onclick=()=>{
      const id=el.dataset.id;
      const list=tasks();
      const index=list.findIndex(t=>String(t.id||t.name)===id);
      if(index<0)return;
      list[index].completed=!list[index].completed;
      if(list[index].status) list[index].status=list[index].completed?'Completed':'Not Started';
      saveTasks(list);
      const view=el.closest('[data-mobile-view]')?.dataset.mobileView;
      if(view && window.PlannerAppNavigation) window.PlannerAppNavigation.render(view);
    });
  }

  function renderToday(c){
    const now=new Date(); now.setHours(0,0,0,0);
    const due=tasks().filter(t=>!t.completed && t.dueDate && new Date(t.dueDate+'T00:00:00').getTime()===now.getTime());
    const upcoming=tasks().filter(t=>!t.completed && t.dueDate && new Date(t.dueDate+'T00:00:00')>now).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).slice(0,5);
    c.innerHTML=`<div class="greeting"><h1>${new Date().getHours()<12?'Good morning!':new Date().getHours()<18?'Good afternoon!':'Good evening!'}</h1><p>Here’s what’s on your plate today.</p></div>
      <section class="card" data-mobile-view="today"><div class="card-head"><h2>Today</h2><span class="count">${due.length}</span></div>${due.length?due.map(taskCard).join(''):'<div class="empty">Nothing scheduled for today.</div>'}</section>
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
