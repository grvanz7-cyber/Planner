// ========================================
// RECURRING TASKS
// ========================================
(function () {
    const RECURRENCE_OPTIONS = [['', 'Does not repeat'], ['daily', 'Every day'], ['weekday', 'Every weekday'], ['weekly', 'Every week'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Every month'], ['custom', 'Custom']];
    const DAYS = [['0','Sunday'],['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday']];

    function ensureRecurrenceControls(){
        const group=document.querySelector('#taskRecurrenceGroup'),select=document.querySelector('#taskRecurrence');
        if(!group||!select)return;
        if(!select.options.length)RECURRENCE_OPTIONS.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;select.appendChild(o);});
        const day=document.querySelector('#taskRecurrenceDay');
        if(day&&!day.options.length)DAYS.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;day.appendChild(o);});
        if(!select.dataset.recurrenceBound){select.addEventListener('change',updateRecurrenceVisibility);select.dataset.recurrenceBound='true';}
        updateRecurrenceVisibility();
    }
    function updateRecurrenceVisibility(){const r=document.querySelector('#taskRecurrence')?.value||'',weekly=document.querySelector('#weeklyRecurrenceOptions'),monthly=document.querySelector('#monthlyRecurrenceOptions'),custom=document.querySelector('#customRecurrenceOptions'),label=document.querySelector('#taskDateLabel');if(weekly)weekly.style.display=(r==='weekly'||r==='biweekly')?'block':'none';if(monthly)monthly.style.display=r==='monthly'?'block':'none';if(custom)custom.style.display=r==='custom'?'flex':'none';if(label)label.textContent=r?'Starts on':'Due date';}
    function getValues(){const r=document.querySelector('#taskRecurrence')?.value||'';return{recurrence:r,recurrenceDay:(r==='weekly'||r==='biweekly')?Number(document.querySelector('#taskRecurrenceDay')?.value||0):null,recurrenceMonthDay:r==='monthly'?Math.min(31,Math.max(1,Number(document.querySelector('#taskRecurrenceMonthDay')?.value||1))):null,recurrenceInterval:r==='custom'?Math.max(1,Number(document.querySelector('#taskRecurrenceInterval')?.value||1)):null,recurrenceUnit:r==='custom'?(document.querySelector('#taskRecurrenceUnit')?.value||'days'):null};}
    window.getRecurrenceValues=getValues;
    window.applyRecurrenceToTask=function(task){if(task)Object.assign(task,getValues());};
    window.setRecurrence=function(task){ensureRecurrenceControls();const r=document.querySelector('#taskRecurrence');if(!r)return;r.value=task?.recurrence||'';const day=document.querySelector('#taskRecurrenceDay');if(day)day.value=String(task?.recurrenceDay??(task?.dueDate?new Date(task.dueDate+'T00:00:00').getDay():0));const md=document.querySelector('#taskRecurrenceMonthDay');if(md)md.value=task?.recurrenceMonthDay||(task?.dueDate?Number(task.dueDate.slice(8,10)):1);const i=document.querySelector('#taskRecurrenceInterval');if(i)i.value=task?.recurrenceInterval||1;const u=document.querySelector('#taskRecurrenceUnit');if(u)u.value=task?.recurrenceUnit||'days';updateRecurrenceVisibility();};
    window.nextRecurringDate=function(dateString,task){const d=new Date(dateString+'T00:00:00');if(Number.isNaN(d.getTime()))return null;const r=task.recurrence;if(r==='daily')d.setDate(d.getDate()+1);else if(r==='weekday'){do{d.setDate(d.getDate()+1);}while(d.getDay()===0||d.getDay()===6);}else if(r==='weekly'||r==='biweekly'){d.setDate(d.getDate()+(r==='weekly'?7:14));if(task.recurrenceDay!=null)d.setDate(d.getDate()+((Number(task.recurrenceDay)-d.getDay()+7)%7));}else if(r==='monthly'){d.setMonth(d.getMonth()+1);const target=Math.min(31,Math.max(1,Number(task.recurrenceMonthDay)||d.getDate()));d.setDate(1);d.setDate(Math.min(target,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));}else if(r==='custom'){const n=Math.max(1,Number(task.recurrenceInterval)||1);if(task.recurrenceUnit==='weeks')d.setDate(d.getDate()+n*7);else if(task.recurrenceUnit==='months')d.setMonth(d.getMonth()+n);else d.setDate(d.getDate()+n);}else return null;return d.toISOString().slice(0,10);};

    function patchSaveFunctions(){
        // Capture recurrence BEFORE the normal save closes/clears the modal.
        if(typeof window.createTask==='function'&&!window.createTask.__recurrencePatched){
            const original=window.createTask;
            window.createTask=function(){
                ensureRecurrenceControls();
                const recurrence=getValues();
                const before=Array.isArray(window.plannerData?.tasks)?window.plannerData.tasks.length:0;
                const result=original.apply(this,arguments);
                const tasks=window.plannerData?.tasks;
                if(Array.isArray(tasks)&&tasks.length>before){
                    Object.assign(tasks[tasks.length-1],recurrence);
                    if(typeof window.savePlannerData==='function')window.savePlannerData();
                    if(typeof window.renderCalendar==='function')window.renderCalendar();
                }
                return result;
            };
            window.createTask.__recurrencePatched=true;
        }
        if(typeof window.saveEditedPlannerTask==='function'&&!window.saveEditedPlannerTask.__recurrencePatched){
            const original=window.saveEditedPlannerTask;
            window.saveEditedPlannerTask=function(taskId){
                ensureRecurrenceControls();
                const recurrence=getValues();
                const result=original.apply(this,arguments);
                const task=window.plannerData?.tasks?.find(t=>String(t.id)===String(taskId));
                if(task){Object.assign(task,recurrence);if(typeof window.savePlannerData==='function')window.savePlannerData();if(typeof window.renderCalendar==='function')window.renderCalendar();}
                return result;
            };
            window.saveEditedPlannerTask.__recurrencePatched=true;
        }
    }
    document.addEventListener('DOMContentLoaded',()=>{ensureRecurrenceControls();patchSaveFunctions();});
    window.addEventListener('load',()=>{ensureRecurrenceControls();patchSaveFunctions();});
    ensureRecurrenceControls();patchSaveFunctions();
})();
