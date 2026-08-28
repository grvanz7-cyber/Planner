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
