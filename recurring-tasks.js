// ========================================
// RECURRING TASKS
// ========================================
(function () {
    const RECURRENCE_OPTIONS = [
        ['', 'Does not repeat'], ['daily', 'Every day'], ['weekday', 'Every weekday'],
        ['weekly', 'Every week'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Every month'], ['custom', 'Custom']
    ];
    const DAYS = [['0','Sunday'],['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday']];

    function addRecurrenceField(modalSelector = '#taskModal .modal') {
        const modal = document.querySelector(modalSelector);
        if (!modal || modal.querySelector('#taskRecurrenceGroup')) return;
        const priority = modal.querySelector('#taskPriority');
        if (!priority) return;
        const group = document.createElement('div');
        group.className = 'form-group'; group.id = 'taskRecurrenceGroup';
        group.innerHTML = `<label for="taskRecurrence">Repeat</label><select id="taskRecurrence"></select>
          <div id="weeklyRecurrenceOptions" style="display:none;margin-top:8px"><label for="taskRecurrenceDay">On</label><select id="taskRecurrenceDay"></select></div>
          <div id="monthlyRecurrenceOptions" style="display:none;margin-top:8px"><label for="taskRecurrenceMonthDay">Day of month</label><input id="taskRecurrenceMonthDay" type="number" min="1" max="31" value="1"></div>
          <div id="customRecurrenceOptions" style="display:none;margin-top:8px;gap:8px;align-items:center"><span>Every</span><input id="taskRecurrenceInterval" type="number" min="1" value="1" style="max-width:90px"><select id="taskRecurrenceUnit"><option value="days">days</option><option value="weeks">weeks</option><option value="months">months</option></select></div>`;
        priority.closest('.form-row')?.after(group);
        const select = group.querySelector('#taskRecurrence');
        RECURRENCE_OPTIONS.forEach(([v,l]) => { const o=document.createElement('option'); o.value=v; o.textContent=l; select.appendChild(o); });
        const day = group.querySelector('#taskRecurrenceDay');
        DAYS.forEach(([v,l]) => { const o=document.createElement('option'); o.value=v; o.textContent=l; day.appendChild(o); });
        select.addEventListener('change', updateRecurrenceVisibility);
    }
    function updateRecurrenceVisibility() {
        const r=document.querySelector('#taskRecurrence')?.value;
        const weekly=document.querySelector('#weeklyRecurrenceOptions'), monthly=document.querySelector('#monthlyRecurrenceOptions'), custom=document.querySelector('#customRecurrenceOptions');
        if(weekly) weekly.style.display=(r==='weekly'||r==='biweekly')?'block':'none';
        if(monthly) monthly.style.display=r==='monthly'?'block':'none';
        if(custom) custom.style.display=r==='custom'?'flex':'none';
    }
    function setRecurrence(task) {
        addRecurrenceField();
        const select=document.querySelector('#taskRecurrence'); if(!select)return;
        select.value=task?.recurrence||'';
        const day=document.querySelector('#taskRecurrenceDay');
        if(day) day.value=String(task?.recurrenceDay ?? (task?.dueDate ? new Date(`${task.dueDate}T00:00:00`).getDay() : 1));
        const md=document.querySelector('#taskRecurrenceMonthDay');
        if(md) md.value=task?.recurrenceMonthDay || (task?.dueDate ? Number(String(task.dueDate).slice(8,10)) : 1);
        const interval=document.querySelector('#taskRecurrenceInterval'), unit=document.querySelector('#taskRecurrenceUnit');
        if(interval)interval.value=task?.recurrenceInterval||1; if(unit)unit.value=task?.recurrenceUnit||'days';
        updateRecurrenceVisibility();
    }
    function nextDate(dateString,r,interval=1,unit='days',day=null,monthDay=null){
        const d=new Date(`${dateString}T00:00:00`); if(Number.isNaN(d.getTime()))return null;
        if(r==='daily')d.setDate(d.getDate()+1);
        else if(r==='weekday'){do{d.setDate(d.getDate()+1)}while(d.getDay()===0||d.getDay()===6)}
        else if(r==='weekly'||r==='biweekly'){const step=r==='weekly'?7:14; d.setDate(d.getDate()+step); if(day!==null){const target=Number(day); d.setDate(d.getDate()+((target-d.getDay()+7)%7)); if(r==='biweekly' && d.getTime()<=new Date(`${dateString}T00:00:00`).getTime())d.setDate(d.getDate()+14)}}
        else if(r==='monthly'){d.setMonth(d.getMonth()+1); const target=Math.min(31,Math.max(1,Number(monthDay)||d.getDate())); d.setDate(1); const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(); d.setDate(Math.min(target,last));}
        else if(r==='custom'){const n=Math.max(1,Number(interval)||1); if(unit==='weeks')d.setDate(d.getDate()+n*7);else if(unit==='months')d.setMonth(d.getMonth()+n);else d.setDate(d.getDate()+n)}
        else return null; return d.toISOString().slice(0,10);
    }
    function makeNextOccurrence(task){
        if(!task?.recurrence||!task.dueDate)return; const next=nextDate(task.dueDate,task.recurrence,task.recurrenceInterval,task.recurrenceUnit,task.recurrenceDay,task.recurrenceMonthDay); if(!next)return;
        const parent=task.recurrenceParentId||task.id; if(plannerData.tasks.some(t=>(t.recurrenceParentId===parent||t.id===parent)&&t.dueDate===next&&!t.completed))return;
        plannerData.tasks.push({...task,id:Date.now()+Math.floor(Math.random()*1000),dueDate:next,completed:false,status:'Not Started',createdAt:new Date().toISOString(),recurrenceParentId:parent}); savePlannerData();
    }
    function getRecurrenceValues(){const r=document.querySelector('#taskRecurrence')?.value||'';return{recurrence:r,recurrenceInterval:r==='custom'?Math.max(1,Number(document.querySelector('#taskRecurrenceInterval')?.value)||1):null,recurrenceUnit:r==='custom'?(document.querySelector('#taskRecurrenceUnit')?.value||'days'):null,recurrenceDay:(r==='weekly'||r==='biweekly')?Number(document.querySelector('#taskRecurrenceDay')?.value):null,recurrenceMonthDay:r==='monthly'?Math.min(31,Math.max(1,Number(document.querySelector('#taskRecurrenceMonthDay')?.value)||1)):null};}
    window.applyRecurrenceToTask=function(task){if(!task)return;Object.assign(task,getRecurrenceValues());};
    const originalOpen=window.openTaskModal; window.openTaskModal=function(){if(typeof originalOpen==='function')originalOpen.apply(this,arguments);addRecurrenceField();setRecurrence(null);};
    const originalCreate=window.createTask; window.createTask=function(){addRecurrenceField();const v=getRecurrenceValues();if(typeof originalCreate==='function')originalCreate.apply(this,arguments);const ts=plannerData?.tasks;if(Array.isArray(ts)&&ts.length){Object.assign(ts[ts.length-1],v);savePlannerData();if(typeof renderTasks==='function')renderTasks();if(typeof renderCalendar==='function')renderCalendar();}};
    const originalToggle=window.toggleTask; window.toggleTask=function(id){const t=plannerData?.tasks?.find(x=>String(x.id)===String(id)),was=t&&!t.completed;if(typeof originalToggle==='function')originalToggle.apply(this,arguments);if(was&&t?.recurrence)makeNextOccurrence(t);};
    document.addEventListener('DOMContentLoaded',()=>addRecurrenceField());
    window.addRecurrenceField=addRecurrenceField;window.setRecurrence=setRecurrence;window.makeNextOccurrence=makeNextOccurrence;
})();
