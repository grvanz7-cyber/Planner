// Calendar uses the same universal task modal as the rest of the planner.
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

// ============================================================
// RECURRENCE PERSISTENCE
// Keep a small dedicated recurrence mirror in localStorage.
// This protects recurrence data even if another part of the
// planner serializes/rebuilds tasks without those optional fields.
// ============================================================
(function installRecurrencePersistence(){
  const STORAGE_KEY = 'plannerTaskRecurrence';

  function readMirror(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e) { return {}; }
  }

  function writeMirror(mirror){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mirror));
  }

  function syncRecurrenceToMirror(){
    if (typeof plannerData === 'undefined' || !Array.isArray(plannerData.tasks)) return;
    const mirror = readMirror();
    let changed = false;

    plannerData.tasks.forEach(task => {
      if (!task || task.id == null || !task.recurrence) return;
      const value = {
        recurrence: task.recurrence,
        recurrenceDay: task.recurrenceDay ?? null,
        recurrenceMonthDay: task.recurrenceMonthDay ?? null,
        recurrenceInterval: task.recurrenceInterval ?? null,
        recurrenceUnit: task.recurrenceUnit ?? null
      };
      const key = String(task.id);
      if (JSON.stringify(mirror[key]) !== JSON.stringify(value)) {
        mirror[key] = value;
        changed = true;
      }
    });

    if (changed) writeMirror(mirror);
  }

  function restoreRecurrenceFromMirror(){
    if (typeof plannerData === 'undefined' || !Array.isArray(plannerData.tasks)) return;
    const mirror = readMirror();
    let changed = false;

    plannerData.tasks.forEach(task => {
      if (!task || task.id == null) return;
      const saved = mirror[String(task.id)];
      if (!saved) return;

      if (task.recurrence !== saved.recurrence ||
          task.recurrenceDay !== saved.recurrenceDay ||
          task.recurrenceMonthDay !== saved.recurrenceMonthDay ||
          task.recurrenceInterval !== saved.recurrenceInterval ||
          task.recurrenceUnit !== saved.recurrenceUnit) {
        Object.assign(task, saved);
        changed = true;
      }
    });

    if (changed && typeof savePlannerData === 'function') savePlannerData();
    if (changed && typeof renderCalendar === 'function') renderCalendar();
  }

  function readModalRecurrence(){
    const select = document.querySelector('#taskRecurrence');
    const value = select ? select.value : '';
    return {
      recurrence: value || '',
      recurrenceDay: (value === 'weekly' || value === 'biweekly')
        ? Number(document.querySelector('#taskRecurrenceDay')?.value ?? 0) : null,
      recurrenceMonthDay: value === 'monthly'
        ? Number(document.querySelector('#taskRecurrenceMonthDay')?.value ?? 1) : null,
      recurrenceInterval: value === 'custom'
        ? Number(document.querySelector('#taskRecurrenceInterval')?.value ?? 1) : null,
      recurrenceUnit: value === 'custom'
        ? (document.querySelector('#taskRecurrenceUnit')?.value || 'days') : null
    };
  }

  function patchCreate(){
    if (typeof window.createTask !== 'function' || window.__recurrenceCreatePatched) return !!window.__recurrenceCreatePatched;
    const original = window.createTask;
    window.createTask = function(){
      const recurrence = readModalRecurrence();
      const before = Array.isArray(plannerData?.tasks) ? plannerData.tasks.length : 0;
      original.apply(this, arguments);
      if (Array.isArray(plannerData?.tasks) && plannerData.tasks.length > before) {
        const task = plannerData.tasks[plannerData.tasks.length - 1];
        Object.assign(task, recurrence);
        savePlannerData();
        syncRecurrenceToMirror();
        if (typeof renderCalendar === 'function') renderCalendar();
      }
    };
    window.__recurrenceCreatePatched = true;
    return true;
  }

  // Restore saved recurrence as soon as the page's planner data exists.
  restoreRecurrenceFromMirror();

  // Catch both newly-created and edited recurring tasks without replacing
  // the planner's main save implementation.
  if (!patchCreate()) {
    const timer = setInterval(() => { if (patchCreate()) clearInterval(timer); }, 50);
    setTimeout(() => clearInterval(timer), 10000);
  }

  // Existing edit paths update plannerData directly. Mirror it frequently,
  // so an edit that works in the UI is still recoverable after reload.
  setInterval(() => {
    syncRecurrenceToMirror();
    restoreRecurrenceFromMirror();
  }, 500);
})();
