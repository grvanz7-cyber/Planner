// ========================================
// CALENDAR
// ========================================

let calendarDate = new Date();
function calendarPreviousMonth() { calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1); renderCalendar(); }
function calendarNextMonth() { calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1); renderCalendar(); }
function calendarGoToToday() { calendarDate = new Date(); renderCalendar(); }
function getPlannerTasksForCalendar() { return typeof plannerData !== 'undefined' && Array.isArray(plannerData.tasks) ? plannerData.tasks : []; }
function getCalendarSubjects() { return typeof plannerData !== 'undefined' && plannerData.settings?.subjects ? plannerData.settings.subjects : []; }

function calendarRecurringDateMatches(task, dateString) {
    if (!task?.recurrence || !task.dueDate) return false;
    const start = new Date(String(task.dueDate).slice(0,10) + 'T00:00:00');
    const target = new Date(dateString + 'T00:00:00');
    if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime()) || target < start) return false;
    const diffDays = Math.floor((target - start) / 86400000);
    const recurrenceDay = Number(task.recurrenceDay ?? start.getDay());
    if (task.recurrence === 'daily') return true;
    if (task.recurrence === 'weekday') return target.getDay() !== 0 && target.getDay() !== 6;
    if (task.recurrence === 'weekly') return target.getDay() === recurrenceDay && diffDays % 7 === 0;
    if (task.recurrence === 'biweekly') return target.getDay() === recurrenceDay && diffDays % 14 === 0;
    if (task.recurrence === 'monthly') {
        const wanted = Number(task.recurrenceMonthDay || start.getDate());
        return target.getDate() === Math.min(wanted, new Date(target.getFullYear(), target.getMonth()+1, 0).getDate());
    }
    if (task.recurrence === 'custom') {
        const n = Math.max(1, Number(task.recurrenceInterval) || 1);
        if (task.recurrenceUnit === 'weeks') return diffDays % (n * 7) === 0;
        if (task.recurrenceUnit === 'months') {
            const months = (target.getFullYear()-start.getFullYear())*12 + target.getMonth()-start.getMonth();
            return target.getDate() === start.getDate() && months >= 0 && months % n === 0;
        }
        return diffDays % n === 0;
    }
    return false;
}

function getCalendarTasksForDate(tasks, dateString) {
    return tasks.filter(task => {
        if (task.dueDate && String(task.dueDate).slice(0,10) === dateString) return true;
        return calendarRecurringDateMatches(task, dateString);
    });
}

function openCalendarTask(taskId) {
    if (typeof window.openEditTaskModal === 'function') return window.openEditTaskModal(taskId);
    if (typeof window.openCalendarTask === 'function') return window.openCalendarTask(taskId);
}
function createCalendarTask(dateString) {
    if (typeof window.openTaskModal !== 'function') return;
    window.openTaskModal();
    const dueDate = document.querySelector('#taskDueDate');
    if (dueDate) dueDate.value = dateString;
}

function renderCalendar() {
    const title = document.querySelector('#calendarMonthTitle'), grid = document.querySelector('#calendarGrid');
    if (!title || !grid) return;
    const year = calendarDate.getFullYear(), month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(), tasks = getPlannerTasksForCalendar(), subjects = getCalendarSubjects();
    title.textContent = calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    grid.innerHTML = '';
    for (let i=0;i<firstDay;i++) { const blank=document.createElement('div'); blank.className='calendar-day calendar-day-empty'; grid.appendChild(blank); }
    for (let day=1;day<=daysInMonth;day++) {
        const cell=document.createElement('div'); cell.className='calendar-day';
        if(day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()) cell.classList.add('today');
        const number=document.createElement('div'); number.className='calendar-day-number'; number.textContent=day; cell.appendChild(number);
        const dateString=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dayTasks=getCalendarTasksForDate(tasks,dateString);
        dayTasks.slice(0,4).forEach(task=>{
            const item=document.createElement('button'); item.type='button'; item.className='calendar-task';
            if(task.completed||task.status==='Completed') item.classList.add('completed');
            const subject=subjects.find(s=>s.name===task.subject); if(subject?.colour) item.style.setProperty('--task-color',subject.colour);
            const icon=document.createElement('span'); icon.className='calendar-task-icon'; icon.textContent=subject?.emoji||'✓';
            const name=document.createElement('span'); name.className='calendar-task-name'; name.textContent=task.name||'Untitled task'; item.append(icon,name);
            if(task.recurrence){const repeat=document.createElement('span'); repeat.className='calendar-task-repeat'; repeat.textContent='↻'; repeat.title='Recurring task'; item.appendChild(repeat);}
            item.title=`Edit: ${task.name||'Untitled task'}`; item.onclick=e=>{e.stopPropagation();openCalendarTask(task.id);}; cell.appendChild(item);
        });
        if(dayTasks.length>4){const more=document.createElement('div'); more.className='calendar-more'; more.textContent=`+${dayTasks.length-4} more`; cell.appendChild(more);}
        cell.addEventListener('click',()=>createCalendarTask(dateString)); grid.appendChild(cell);
    }
}
