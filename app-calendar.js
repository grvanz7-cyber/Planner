(() => {
  let viewDate = new Date();
  let selectedDate = new Date();

  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const tasks = () => window.PlannerAppData ? window.PlannerAppData.getTasks() : [];
  const due = t => t.dueDate ? new Date(`${t.dueDate}T00:00:00`) : null;
  const esc = s => String(s || 'Untitled').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function mount(root) {
    root.innerHTML = `<div class="greeting"><h1>Calendar</h1><p>Tap a date to see what is due.</p></div>
      <section class="card calendar-card">
        <div class="calendar-head"><button id="calPrev">‹</button><strong id="calTitle"></strong><button id="calNext">›</button></div>
        <div class="weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
        <div class="month-grid" id="calGrid"></div>
      </section>
      <section class="card"><div class="head"><h2 id="calSelected"></h2></div><div id="calItems"></div></section>`;
    root.querySelector('#calPrev').onclick=()=>{viewDate.setMonth(viewDate.getMonth()-1);draw(root)};
    root.querySelector('#calNext').onclick=()=>{viewDate.setMonth(viewDate.getMonth()+1);draw(root)};
    draw(root);
  }

  function draw(root) {
    const first=new Date(viewDate.getFullYear(),viewDate.getMonth(),1);
    const last=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,0);
    root.querySelector('#calTitle').textContent=viewDate.toLocaleDateString(undefined,{month:'long',year:'numeric'});
    const grid=root.querySelector('#calGrid'); let html='';
    for(let i=0;i<first.getDay();i++) html+='<div class="cal-day blank"></div>';
    for(let d=1;d<=last.getDate();d++) {
      const date=new Date(viewDate.getFullYear(),viewDate.getMonth(),d), k=key(date);
      const has=tasks().some(t=>{const x=due(t);return x&&!t.completed&&key(x)===k});
      html+=`<button class="cal-day${key(selectedDate)===k?' selected':''}" data-key="${k}"><span>${d}</span>${has?'<i></i>':''}</button>`;
    }
    grid.innerHTML=html;
    grid.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedDate=new Date(`${b.dataset.key}T00:00:00`);draw(root)});
    const title=root.querySelector('#calSelected'); title.textContent=selectedDate.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    const items=tasks().filter(t=>{const x=due(t);return x&&!t.completed&&key(x)===key(selectedDate)});
    root.querySelector('#calItems').innerHTML=items.length?items.map(t=>`<div class="task"><div class="check"></div><div><div class="task-name">${esc(t.name)}</div><div class="task-meta">${esc(t.type||'Task')}${t.subject?' · '+esc(t.subject):''}</div></div></div>`).join(''):'<div class="empty">Nothing scheduled.</div>';
  }

  window.PlannerAppCalendar={mount};
})();
