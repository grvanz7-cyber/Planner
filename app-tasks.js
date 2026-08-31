(() => {
  function data() { return window.PlannerAppData ? window.PlannerAppData.getTasks() : []; }
  function escape(v) { return String(v || 'Untitled').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function dueTime(t) { return t.dueDate ? new Date(t.dueDate + 'T00:00:00').getTime() : Infinity; }

  window.PlannerAppTasks = {
    render(container) {
      let filter = 'active';
      const draw = () => {
        const tasks = data().filter(t => filter === 'active' ? !t.completed : !!t.completed)
          .sort((a,b) => dueTime(a) - dueTime(b));
        container.innerHTML = `<div class="taskFilters"><button data-filter="active" class="selected">Active</button><button data-filter="completed">Completed</button></div><div class="taskList"></div>`;
        const list = container.querySelector('.taskList');
        list.innerHTML = tasks.length ? tasks.map(t => `<button class="taskRow" data-id="${escape(t.id)}"><span class="taskCheck">${t.completed ? '✓' : ''}</span><span class="taskInfo"><strong>${escape(t.name)}</strong><small>${escape(t.dueDate || 'No due date')}${t.type ? ' · '+escape(t.type) : ''}${t.subject ? ' · '+escape(t.subject) : ''}</small></span></button>`).join('') : '<div class="empty">No '+filter+' tasks.</div>';
        container.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter=b.dataset.filter; draw(); });
        container.querySelectorAll('.taskRow').forEach(b => b.onclick = () => {
          const task = data().find(t => String(t.id) === b.dataset.id);
          if (task) window.PlannerAppTasks.showDetails(task);
        });
      };
      draw();
    },
    showDetails(task) {
      const existing = document.getElementById('taskDetailSheet');
      if (existing) existing.remove();
      const sheet = document.createElement('div');
      sheet.id = 'taskDetailSheet'; sheet.className = 'sheetBackdrop';
      sheet.innerHTML = `<div class="sheet"><button class="sheetClose">×</button><h2>${escape(task.name)}</h2><p>${escape(task.dueDate || 'No due date')}</p><p>${escape(task.type || 'Task')}${task.subject ? ' · '+escape(task.subject) : ''}</p><button class="sheetAction">${task.completed ? 'Mark active' : 'Mark complete'}</button></div>`;
      document.body.appendChild(sheet);
      sheet.onclick = e => { if (e.target === sheet || e.target.classList.contains('sheetClose')) sheet.remove(); };
    }
  };
})();
