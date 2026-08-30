// ========================================
// CALENDAR
// ========================================
let calendarDate = new Date();
function calendarPreviousMonth(){calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);renderCalendar();}
function calendarNextMonth(){calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);renderCalendar();}
function calendarGoToToday(){calendarDate=new Date();renderCalendar();}
function getPlannerTasksForCalendar(){return typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)?plannerData.tasks:[];}
function getCalendarSubjects(){return typeof plannerData!=='undefined'&&plannerData.settings?.subjects?plannerData.settings.subjects:[];}
function getCalendarEvents(){return typeof plannerData!=='undefined'&&Array.isArray(plannerData.events)?plannerData.events:[];}
function calendarRecurringDateMatches(task,dateString){
 const start=new Date(String(task.dueDate).slice(0,10)+'T00:00:00'),target=new Date(dateString+'T00:00:00'); if(Number.isNaN(start.getTime())||target<start)return false;
 const diff=Math.floor((target-start)/86400000),day=Number(task.recurrenceDay??start.getDay()),r=task.recurrence;
 if(r==='daily')return true;if(r==='weekday')return target.getDay()>0&&target.getDay()<6;
 if(r==='weekly')return target.getDay()===day&&diff%7===0;if(r==='biweekly')return target.getDay()===day&&diff%14===0;
 if(r==='monthly'){const wanted=Number(task.recurrenceMonthDay||start.getDate());return target.getDate()===Math.min(wanted,new Date(target.getFullYear(),target.getMonth()+1,0).getDate());}
 if(r==='custom'){const n=Math.max(1,Number(task.recurrenceInterval)||1);if(task.recurrenceUnit==='weeks')return diff%(n*7)===0;if(task.recurrenceUnit==='months'){const m=(target.getFullYear()-start.getFullYear())*12+target.getMonth()-start.getMonth();return target.getDate()===start.getDate()&&m>=0&&m%n===0;}return diff%n===0;}return false;
}
function getCalendarTasksForDate(tasks,date){return tasks.filter(t=>(t.dueDate&&String(t.dueDate).slice(0,10)===date)||calendarRecurringDateMatches(t,date));}
function getCalendarEventsForDate(events,date){return events.filter(e=>{const start=String(e.date||'').slice(0,10),end=String(e.endDate||e.date||'').slice(0,10);return start&&date>=start&&date<=end;});}
function openCalendarTask(taskId){if(typeof window.openEditTaskModal==='function')return window.openEditTaskModal(taskId);if(typeof window.openCalendarTask==='function')return window.openCalendarTask(taskId);}
function createCalendarTask(date){if(typeof window.openTaskModal!=='function')return;window.openTaskModal();const d=document.querySelector('#taskDueDate');if(d)d.value=date;}
function renderCalendar(){
 const title=document.querySelector('#calendarMonthTitle'),grid=document.querySelector('#calendarGrid');if(!title||!grid)return;const y=calendarDate.getFullYear(),m=calendarDate.getMonth(),first=new Date(y,m,1).getDay(),count=new Date(y,m+1,0).getDate(),today=new Date(),tasks=getPlannerTasksForCalendar(),events=getCalendarEvents(),subjects=getCalendarSubjects();title.textContent=calendarDate.toLocaleDateString(undefined,{month:'long',year:'numeric'});grid.innerHTML='';
 for(let i=0;i<first;i++){const b=document.createElement('div');b.className='calendar-day calendar-day-empty';grid.appendChild(b);}
 for(let day=1;day<=count;day++){const cell=document.createElement('div');cell.className='calendar-day';if(day===today.getDate()&&m===today.getMonth()&&y===today.getFullYear())cell.classList.add('today');const num=document.createElement('div');num.className='calendar-day-number';num.textContent=day;cell.appendChild(num);const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  getCalendarEventsForDate(events,date).slice(0,3).forEach(e=>{const item=document.createElement('button');item.type='button';item.className='calendar-event';item.style.setProperty('--event-color',e.colour||'#7c3aed');if(String(e.date).slice(0,10)===date)item.classList.add('event-start');else item.classList.add('event-continuation');const icon=document.createElement('span');icon.textContent='•';const name=document.createElement('span');name.className='calendar-event-name';name.textContent=e.name||'Untitled event';item.append(icon,name);if(e.time&&String(e.date).slice(0,10)===date){const time=document.createElement('span');time.className='calendar-event-time';time.textContent=e.time;item.appendChild(time);}item.title=`Edit: ${e.name||'Untitled event'}`;item.onclick=x=>{x.stopPropagation();if(typeof openEventModal==='function')openEventModal(e.id);};cell.appendChild(item);});
  getCalendarTasksForDate(tasks,date).slice(0,4).forEach(t=>{const item=document.createElement('button');item.type='button';item.className='calendar-task';if(t.completed||t.status==='Completed')item.classList.add('completed');const s=subjects.find(x=>x.name===t.subject);if(s?.colour)item.style.setProperty('--task-color',s.colour);const icon=document.createElement('span');icon.className='calendar-task-icon';icon.textContent=s?.emoji||'✓';const name=document.createElement('span');name.className='calendar-task-name';name.textContent=t.name||'Untitled task';item.append(icon,name);if(t.recurrence){const repeat=document.createElement('span');repeat.className='calendar-task-repeat';repeat.textContent='↻';repeat.title='Recurring task';item.appendChild(repeat);}item.title=`Edit: ${t.name||'Untitled task'}`;item.onclick=e=>{e.stopPropagation();openCalendarTask(t.id);};cell.appendChild(item);});
  cell.addEventListener('click',()=>createCalendarTask(date));grid.appendChild(cell);
 }
}

// Load the event UI after the calendar module so the existing index.html
// does not need to be rewritten just to add another script tag.
if(!window.__calendarEventsScriptLoaded){window.__calendarEventsScriptLoaded=true;const s=document.createElement('script');s.src='calendar-events.js';document.head.appendChild(s);}
