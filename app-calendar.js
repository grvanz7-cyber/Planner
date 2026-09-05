(() => {
  let viewDate = new Date();
  let selectedDate = new Date();

  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const tasks = () => window.PlannerAppData ? window.PlannerAppData.getTasks() : [];
  const due = t => t.dueDate ? new Date(`${t.dueDate}T00:00:00`) : null;
  const esc = s => String(s || 'Untitled').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function ensureStyles() {
    if (document.getElementById('calendarStyles')) return;
    const style = document.createElement('style');
    style.id = 'calendarStyles';
    style.textContent = `
      .calendar-card{padding:14px!important}
      .calendar-head{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;margin-bottom:12px}
      .calendar-head strong{text-align:center;font-size:17px}
      .calendar-head button{width:36px;height:36px;border:0;border-radius:11px;background:var(--soft);color:var(--text);font-size:25px;line-height:1}
      .calendar-head button:active{transform:scale(.92)}
      .weekdays,.month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
      .weekdays{margin-bottom:5px}
      .weekdays span{text-align:center;color:var(--muted);font-size:10px;font-weight:650;padding:4px 0}
      .cal-day{position:relative;min-width:0;aspect-ratio:1;border:0;border-radius:12px;background:transparent;color:var(--text);font:inherit;display:grid;place-items:center;font-size:13px;cursor:pointer}
      .cal-day:not(.blank):active{transform:scale(.94)}
      .cal-day.selected{background:var(--accent);color:#fff;font-weight:750}
      .cal-day.blank{pointer-events:none}
      .cal-day i{position:absolute;bottom:5px;width:5px;height:5px;border-radius:50%;background:var(--accent)}
      .cal-day.selected i{background:#fff}
      .calendar-task{display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--border)}
      .calendar-task:first-child{border-top:0}
      .calendar-task-icon{width:28px;height:28px;border-radius:9px;background:var(--soft);display:grid;place-items:center;font-size:14px;flex:0 0 28px}
      .calendar-task-body{min-width:0;flex:1}
      .calendar-task-name{font-size:14px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .calendar-task-meta{font-size:11px;color:var(--muted);margin-top:2px}
      .calendar-today{font-size:11px;color:var(--accent);font-weight:700;margin-left:5px}
    `;
    document.head.appendChild(style);
  }

  function iconFor(t) {
    const type = String(t.type || 'task').toLowerCase();
    return ({assignment:'📝',quiz:'❓',test:'📋',exam:'🎓',event:'📅',note:'📌',task:'✓'})[type] || '✓';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML = `<div class="greeting"><h1>Calendar</h1><p>Tap a date to see what's scheduled.</p></div>
      <section class="card calendar-card">
        <div class="calendar-head"><button id="calPrev" aria-label="Previous month">‹</button><strong id="calTitle"></strong><button id="calNext" aria-label="Next month">›</button></div>
        <div class="weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
        <div class="month-grid" id="calGrid"></div>
      </section>
      <section class="card"><div class="head"><h2 id="calSelected"></h2><span class="count" id="calCount"></span></div><div id="calItems"></div></section>`;
    root.querySelector('#calPrev').onclick = () => { viewDate.setDate(1); viewDate.setMonth(viewDate.getMonth()-1); draw(root); };
    root.querySelector('#calNext').onclick = () => { viewDate.setDate(1); viewDate.setMonth(viewDate.getMonth()+1); draw(root); };
    draw(root);
  }

  function draw(root) {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const last = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0);
    root.querySelector('#calTitle').textContent = viewDate.toLocaleDateString(undefined,{month:'long',year:'numeric'});
    const todayKey = key(new Date());
    const grid = root.querySelector('#calGrid');
    let html = '';
    for(let i=0;i<first.getDay();i++) html += '<div class="cal-day blank"></div>';
    for(let d=1;d<=last.getDate();d++) {
      const date = new Date(viewDate.getFullYear(),viewDate.getMonth(),d);
      const k = key(date);
      const has = tasks().some(t => { const x=due(t); return x && !t.completed && key(x)===k; });
      const isSelected = key(selectedDate)===k;
      html += `<button class="cal-day${isSelected?' selected':''}" data-key="${k}"><span>${d}</span>${has?'<i></i>':''}</button>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll('button').forEach(b => b.onclick = () => {
      selectedDate = new Date(`${b.dataset.key}T00:00:00`);
      if (key(selectedDate) === todayKey) selectedDate = new Date();
      draw(root);
    });

    const selectedKey = key(selectedDate);
    const title = root.querySelector('#calSelected');
    title.innerHTML = `${selectedDate.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}${selectedKey===todayKey?'<span class="calendar-today">TODAY</span>':''}`;
    const items = tasks().filter(t => { const x=due(t); return x && !t.completed && key(x)===selectedKey; });
    root.querySelector('#calCount').textContent = items.length ? `${items.length} item${items.length===1?'':'s'}` : '';
    root.querySelector('#calItems').innerHTML = items.length ? items.map(t =>
      `<div class="calendar-task"><span class="calendar-task-icon">${iconFor(t)}</span><div class="calendar-task-body"><div class="calendar-task-name">${esc(t.name)}</div><div class="calendar-task-meta">${esc(t.type||'Task')}${t.subject?' · '+esc(t.subject):''}${t.priority&&t.priority!=='Normal'?' · '+esc(t.priority):''}</div></div></div>`
    ).join('') : '<div class="empty">Nothing scheduled for this day.</div>';
  }

  window.PlannerAppCalendar = { mount };
})();