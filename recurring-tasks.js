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
  window.setRecurrence=function(t){ensure();const r=document.querySelector('#taskRecurrence');if(!r)return;r.value=t?.recurrence||'';const d=document.querySelector('#taskRecurrenceDay');if(d)d.value=String(t?.recurrenceDay??(t?.dueDate?new Date(t.dueDate+'T00:00:00').getDay():0));const md=document.querySelector('#taskRecurrenceMonthDay');if(md)md.value=t?.recurrenceMonthDay||(t?.dueDate?Number(String(t.dueDate).slice(8,10)):1);const i=document.querySelector('#taskRecurrenceInterval');if(i)i.value=t?.recurrenceInterval||1;const u=document.querySelector('#taskRecurrenceUnit');if(u)u.value=t?.recurrenceUnit||'days';visibility();};

  // The key persistence fix: savePlannerData is wrapped so recurrence is
  // attached BEFORE localStorage is written. This avoids relying on timing
  // around closeTaskModal()/clearTaskForm().
  let pendingRecurrence=null;
  function patchSave(){
    if(typeof window.savePlannerData!=='function'||window.savePlannerData.__recurrencePatched)return;
    const original=window.savePlannerData;
    const patched=function(){
      if(pendingRecurrence&&typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)&&plannerData.tasks.length){
        const task=plannerData.tasks[plannerData.tasks.length-1];
        Object.assign(task,pendingRecurrence);
        pendingRecurrence=null;
      }
      return original.apply(this,arguments);
    };
    patched.__recurrencePatched=true;
    window.savePlannerData=patched;
  }

  function patchCreate(){
    if(typeof window.createTask!=='function'||window.createTask.__recurrencePatched)return;
    const original=window.createTask;
    const patched=function(){
      ensure();
      pendingRecurrence=values();
      const before=typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)?plannerData.tasks.length:0;
      const result=original.apply(this,arguments);
      // If the original save function was not intercepted for any reason,
      // persist the recurrence explicitly after creation as a fallback.
      if(typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)&&plannerData.tasks.length>before){
        Object.assign(plannerData.tasks[plannerData.tasks.length-1],pendingRecurrence||{});
        pendingRecurrence=null;
        if(typeof window.savePlannerData==='function')window.savePlannerData();
        if(typeof renderCalendar==='function')renderCalendar();
      }
      return result;
    };
    patched.__recurrencePatched=true;
    window.createTask=patched;
  }

  function patchOpen(){
    if(typeof window.openTaskModal!=='function'||window.openTaskModal.__recurrenceOpenPatched)return;
    const original=window.openTaskModal;
    const patched=function(task){
      const result=original.apply(this,arguments);
      if(task){
        setTimeout(()=>{
          const fields={name:task.name||'',subject:task.subject||'',type:task.type||'',date:task.dueDate?String(task.dueDate).slice(0,10):'',priority:task.priority||'Normal',tags:Array.isArray(task.tags)?task.tags.join(', '):(task.tags||'')};
          const n=document.querySelector('#taskName'),s=document.querySelector('#taskSubject'),ty=document.querySelector('#taskType'),d=document.querySelector('#taskDueDate'),p=document.querySelector('#taskPriority'),g=document.querySelector('#taskTags');
          if(n)n.value=fields.name;if(s)s.value=fields.subject;if(ty)ty.value=fields.type;if(d)d.value=fields.date;if(p)p.value=fields.priority;if(g)g.value=fields.tags;
          window.setRecurrence(task);
        },0);
      }
      return result;
    };
    patched.__recurrenceOpenPatched=true;
    window.openTaskModal=patched;
  }

  function boot(){patchSave();patchCreate();patchOpen();ensure();}
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  boot();
})();
