// Calendar uses the same universal task modal as the rest of the planner.
// This file only supplies the bridge that opens it with Calendar's selected task/date.
function openCalendarTask(taskId){
  const task = typeof plannerData !== 'undefined' && Array.isArray(plannerData.tasks)
    ? plannerData.tasks.find(t => String(t.id) === String(taskId)) : null;
  if (!task) return;
  if (typeof window.openTaskModal === 'function') {
    window.openTaskModal(task);
    return;
  }
  console.warn('Universal task modal is not available yet.');
}

function closeCalendarTaskModal(){
  if (typeof window.closeTaskModal === 'function') window.closeTaskModal();
}

function saveCalendarTask(){
  if (typeof window.saveTask === 'function') window.saveTask();
  else if (typeof window.createTask === 'function') window.createTask();
}

function deleteCalendarTask(){
  if (typeof window.deleteTask === 'function') {
    const id = document.querySelector('#taskEditId')?.value;
    window.deleteTask(id);
  }
}

// Persist recurrence values when the universal task modal creates a task.
(function installRecurrencePersistence(){
  function readRecurrence(){
    const select = document.querySelector('#taskRecurrence');
    const value = select ? select.value : '';
    return {
      recurrence: value || '',
      recurrenceDay: (value === 'weekly' || value === 'biweekly') ? Number(document.querySelector('#taskRecurrenceDay')?.value ?? 0) : null,
      recurrenceMonthDay: value === 'monthly' ? Number(document.querySelector('#taskRecurrenceMonthDay')?.value ?? 1) : null,
      recurrenceInterval: value === 'custom' ? Number(document.querySelector('#taskRecurrenceInterval')?.value ?? 1) : null,
      recurrenceUnit: value === 'custom' ? (document.querySelector('#taskRecurrenceUnit')?.value || 'days') : null
    };
  }

  function patchCreate(){
    if (typeof window.createTask !== 'function' || window.__recurrenceCreatePatched) return !!window.__recurrenceCreatePatched;
    const original = window.createTask;
    window.createTask = function(){
      const recurrence = readRecurrence();
      const before = Array.isArray(plannerData?.tasks) ? plannerData.tasks.length : 0;
      original.apply(this, arguments);
      if (Array.isArray(plannerData?.tasks) && plannerData.tasks.length > before) {
        Object.assign(plannerData.tasks[plannerData.tasks.length - 1], recurrence);
        savePlannerData();
        if (typeof renderCalendar === 'function') renderCalendar();
      }
    };
    window.__recurrenceCreatePatched = true;
    return true;
  }

  if (!patchCreate()) {
    const timer = setInterval(() => { if (patchCreate()) clearInterval(timer); }, 50);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();
