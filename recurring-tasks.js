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

  function patchCreate(){
    if(typeof window.createTask!=='function'||window.createTask.__recurrencePatched)return;
    const original=window.createTask;
    window.createTask=function(){
      ensure();
      const recurrence=values();
      let beforeIds=[];
      try{
        const stored=JSON.parse(localStorage.getItem('plannerData')||'null');
        beforeIds=Array.isArray(stored?.tasks)?stored.tasks.map(t=>String(t.id)):[];
      }catch(e){}

      const result=original.apply(this,arguments);

      // The original createTask has already saved plannerData. Re-read that
      // persisted copy, identify the task it just created, attach recurrence,
      // and write it back. This avoids relying on another script wrapping the
      // lexical savePlannerData function.
      try{
        const stored=JSON.parse(localStorage.getItem('plannerData')||'null');
        if(stored&&Array.isArray(stored.tasks)&&stored.tasks.length){
          let task=stored.tasks.find(t=>!beforeIds.includes(String(t.id)));
          if(!task)task=stored.tasks[stored.tasks.length-1];
          if(task){
            Object.assign(task,recurrence);
            localStorage.setItem('plannerData',JSON.stringify(stored));
            localStorage.setItem('plannerTasks',JSON.stringify(stored.tasks));
          }
        }
      }catch(e){console.error('Could not persist recurrence:',e);}

      // Keep the live in-memory data in sync too.
      if(typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)){
        const task=plannerData.tasks.find(t=>!beforeIds.includes(String(t.id)))||plannerData.tasks[plannerData.tasks.length-1];
        if(task)Object.assign(task,recurrence);
      }
      if(typeof renderCalendar==='function')renderCalendar();
      return result;
    };
    window.createTask.__recurrencePatched=true;
  }

  function patchOpen(){
    if(typeof window.openTaskModal!=='function'||window.openTaskModal.__recurrenceOpenPatched)return;
    const original=window.openTaskModal;
    window.openTaskModal=function(task){
      const result=original.apply(this,arguments);
      if(task)setTimeout(()=>window.setRecurrence(task),0);
      return result;
    };
    window.openTaskModal.__recurrenceOpenPatched=true;
  }

  function boot(){ensure();patchCreate();patchOpen();}
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  boot();
})();
