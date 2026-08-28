// ========================================
// RECURRENCE PERSISTENCE SAFETY NET
// ========================================
// Captures the recurrence controls before the universal task modal closes,
// then writes those values directly onto the newly-created task.
(function(){
  function readRecurrence(){
    const r=document.querySelector('#taskRecurrence');
    if(!r)return null;
    const value=r.value||'';
    return {
      recurrence:value,
      recurrenceDay:(value==='weekly'||value==='biweekly')?Number(document.querySelector('#taskRecurrenceDay')?.value||0):null,
      recurrenceMonthDay:value==='monthly'?Number(document.querySelector('#taskRecurrenceMonthDay')?.value||1):null,
      recurrenceInterval:value==='custom'?Number(document.querySelector('#taskRecurrenceInterval')?.value||1):null,
      recurrenceUnit:value==='custom'?(document.querySelector('#taskRecurrenceUnit')?.value||'days'):null
    };
  }

  document.addEventListener('click',function(e){
    const button=e.target.closest('#taskModal .modal-actions .save-button');
    if(!button)return;
    const recurrence=readRecurrence();
    if(!recurrence)return;

    // createTask() runs from the button's inline onclick after this listener.
    // Wait until it has pushed the task and closed the modal, then persist the
    // recurrence directly to the task that was just created.
    const beforeIds=new Set((typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)?plannerData.tasks:[]).map(t=>String(t.id)));
    setTimeout(function(){
      if(typeof plannerData==='undefined'||!Array.isArray(plannerData.tasks))return;
      let task=plannerData.tasks.find(t=>!beforeIds.has(String(t.id)));
      if(!task) task=plannerData.tasks[plannerData.tasks.length-1];
      if(!task)return;
      Object.assign(task,recurrence);
      if(typeof savePlannerData==='function')savePlannerData();
      if(typeof renderTasks==='function')renderTasks();
      if(typeof renderCalendar==='function')renderCalendar();
    },50);
  },true);
})();
