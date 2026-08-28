// ========================================
// RECURRING TASKS
// ========================================
(function () {
  const OPTIONS=[['','Does not repeat'],['daily','Every day'],['weekday','Every weekday'],['weekly','Every week'],['biweekly','Every 2 weeks'],['monthly','Every month'],['custom','Custom']];
  const DAYS=[['0','Sunday'],['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday']];

  function ensure(){
    const select=document.querySelector('#taskRecurrence'); if(!select)return;
    if(select.options.length===0)OPTIONS.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;select.appendChild(o);});
    const day=document.querySelector('#taskRecurrenceDay');
    if(day&&day.options.length===0)DAYS.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;day.appendChild(o);});
    if(!select.dataset.bound){select.addEventListener('change',visibility);select.dataset.bound='1';}
    visibility();
  }
  function visibility(){const r=document.querySelector('#taskRecurrence')?.value||'';const w=document.querySelector('#weeklyRecurrenceOptions'),m=document.querySelector('#monthlyRecurrenceOptions'),c=document.querySelector('#customRecurrenceOptions'),l=document.querySelector('#taskDateLabel');if(w)w.style.display=(r==='weekly'||r==='biweekly')?'block':'none';if(m)m.style.display=r==='monthly'?'block':'none';if(c)c.style.display=r==='custom'?'flex':'none';if(l)l.textContent=r?'Starts on':'Due date';}
  function values(){const r=document.querySelector('#taskRecurrence')?.value||'';return{recurrence:r,recurrenceDay:(r==='weekly'||r==='biweekly')?Number(document.querySelector('#taskRecurrenceDay')?.value||0):null,recurrenceMonthDay:r==='monthly'?Math.min(31,Math.max(1,Number(document.querySelector('#taskRecurrenceMonthDay')?.value||1))):null,recurrenceInterval:r==='custom'?Math.max(1,Number(document.querySelector('#taskRecurrenceInterval')?.value||1)):null,recurrenceUnit:r==='custom'?(document.querySelector('#taskRecurrenceUnit')?.value||'days'):null};}
  window.getRecurrenceValues=values;
  window.applyRecurrenceToTask=t=>{if(t)Object.assign(t,values());};
  window.setRecurrence=function(t){ensure();const r=document.querySelector('#taskRecurrence');if(!r)return;r.value=t?.recurrence||'';const d=document.querySelector('#taskRecurrenceDay');if(d)d.value=String(t?.recurrenceDay??(t?.dueDate?new Date(t.dueDate+'T00:00:00').getDay():0));const md=document.querySelector('#taskRecurrenceMonthDay');if(md)md.value=t?.recurrenceMonthDay||(t?.dueDate?Number(String(t.dueDate).slice(8,10)):1);const i=document.querySelector('#taskRecurrenceInterval');if(i)i.value=t?.recurrenceInterval||1;const u=document.querySelector('#taskRecurrenceUnit');if(u)u.value=t?.recurrenceUnit||'days';visibility();};

  // Make Calendar's call openTaskModal(task) actually load the existing task's
  // recurrence settings instead of opening a fresh blank modal.
  function patchOpen(){
    if(typeof window.openTaskModal!=='function'||window.openTaskModal.__recurrenceOpenPatched)return;
    const original=window.openTaskModal;
    const patched=function(task){
      const result=original.apply(this,arguments);
      if(task){
        setTimeout(()=>{
          const name=document.querySelector('#taskName');
          const subject=document.querySelector('#taskSubject');
          const type=document.querySelector('#taskType');
          const date=document.querySelector('#taskDueDate');
          const priority=document.querySelector('#taskPriority');
          const tags=document.querySelector('#taskTags');
          if(name)name.value=task.name||'';
          if(subject)subject.value=task.subject||'';
          if(type)type.value=task.type||'';
          if(date)date.value=task.dueDate?String(task.dueDate).slice(0,10):'';
          if(priority)priority.value=task.priority||'Normal';
          if(tags)tags.value=Array.isArray(task.tags)?task.tags.join(', '):(task.tags||'');
          window.setRecurrence(task);
        },0);
      }
      return result;
    };
    patched.__recurrenceOpenPatched=true;
    window.openTaskModal=patched;
  }

  function patchCreate(){
    if(typeof window.createTask!=='function'||window.createTask.__recurrencePatched)return;
    const original=window.createTask;
    const patched=function(){
      ensure();
      const recurrence=values();
      const count=typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)?plannerData.tasks.length:0;
      const result=original.apply(this,arguments);
      if(typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)&&plannerData.tasks.length>count){
        Object.assign(plannerData.tasks[plannerData.tasks.length-1],recurrence);
        savePlannerData();
        if(typeof renderCalendar==='function')renderCalendar();
      }
      return result;
    };
    patched.__recurrencePatched=true;
    window.createTask=patched;
  }

  function patchEdit(){
    const names=['saveEditedPlannerTask','saveTaskEdit','saveTaskChanges'];
    names.forEach(name=>{
      if(typeof window[name]!=='function'||window[name].__recurrencePatched)return;
      const original=window[name];
      const patched=function(id){const recurrence=values();const result=original.apply(this,arguments);const task=typeof plannerData!=='undefined'&&plannerData.tasks?.find(t=>String(t.id)===String(id));if(task){Object.assign(task,recurrence);savePlannerData();if(typeof renderCalendar==='function')renderCalendar();}return result;};
      patched.__recurrencePatched=true;window[name]=patched;
    });
  }

  function boot(){ensure();patchOpen();patchCreate();patchEdit();}
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  boot();
})();
