(() => {
  const views = {
    today: `<div class="greeting"><h1>Today</h1><p>Your tasks for today.</p></div><section class="card"><div class="head"><h2>Tasks</h2><span class="count" id="navTodayCount"></span></div><div id="navTodayList"></div></section>`,
    calendar: `<div class="greeting"><h1>Calendar</h1><p>See what is happening across your schedule.</p></div><section class="card"><div class="empty">Calendar view is ready for the next step.</div></section>`,
    tasks: `<div class="greeting"><h1>Tasks</h1><p>All your active tasks in one place.</p></div><section class="card"><div id="navTasksList"></div></section>`,
    school: `<div class="greeting"><h1>School</h1><p>Subjects, assignments, quizzes and tests.</p></div><section class="card"><div class="empty">School view is ready for the next step.</div></section>`,
    more: `<div class="greeting"><h1>More</h1><p>Planner settings and extra tools.</p></div><section class="card"><div class="quick"><div class="quick-icon">⚙️</div><div class="quick-main"><div class="quick-title">Settings</div><div class="quick-sub">Customize your planner</div></div></div><div class="quick"><div class="quick-icon">📊</div><div class="quick-main"><div class="quick-title">Stats</div><div class="quick-sub">See your progress</div></div></div></section>`
  };

  function render(view) {
    const content = document.getElementById('content');
    if (!content) return;
    content.innerHTML = views[view] || views.today;
    document.querySelectorAll('.bottom button').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    if (view === 'today') fillToday();
    if (view === 'tasks') fillTasks();
  }

  function fillToday() {
    const tasks = window.PlannerAppData ? window.PlannerAppData.getTasks() : [];
    const today = new Date(); today.setHours(0,0,0,0);
    const due = tasks.filter(t => t.dueDate && new Date(t.dueDate + 'T00:00:00').getTime() === today.getTime() && !t.completed);
    const count = document.getElementById('navTodayCount');
    const list = document.getElementById('navTodayList');
    if (count) count.textContent = `${due.length} task${due.length === 1 ? '' : 's'}`;
    if (list) list.innerHTML = due.length ? due.map(t => `<div class="task"><div class="check"></div><div><div class="taskName">${escapeHtml(t.name)}</div><div class="taskMeta">${escapeHtml(t.type || 'Task')}${t.subject ? ' · ' + escapeHtml(t.subject) : ''}</div></div></div>`).join('') : '<div class="empty">Nothing scheduled for today.</div>';
  }

  function fillTasks() {
    const tasks = window.PlannerAppData ? window.PlannerAppData.getTasks() : [];
    const active = tasks.filter(t => !t.completed);
    const list = document.getElementById('navTasksList');
    if (list) list.innerHTML = active.length ? active.map(t => `<div class="task"><div class="check"></div><div><div class="taskName">${escapeHtml(t.name)}</div><div class="taskMeta">${escapeHtml(t.dueDate || 'No due date')}</div></div></div>`).join('') : '<div class="empty">No active tasks.</div>';
  }

  function escapeHtml(value) { return String(value || 'Untitled').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  window.PlannerAppNavigation = { render };
})();
