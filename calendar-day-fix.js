// ========================================
// CALENDAR DAY VIEW REFINEMENTS
// ========================================
(function(){
  function key(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function style(){
    if(document.getElementById('calendarDayFixStyles'))return;
    const s=document.createElement('style');s.id='calendarDayFixStyles';
    s.textContent=`
      #calendarPage.calendar-day-active .calendar-weekdays{display:none!important}
      .calendar-day-only .calendar-weekdays{display:none!important}
      .calendar-day-time-grid{display:grid;grid-template-columns:72px 1fr;min-height:1224px}
      .calendar-day-time-labels{font-size:12px;color:#777}
      .calendar-day-time-label{height:72px;box-sizing:border-box;padding:5px 8px;text-align:right;border-bottom:1px solid #eee}
      .calendar-day-time-column{position:relative}
      .calendar-day-half-slot{height:36px;box-sizing:border-box;border-bottom:1px solid #eee;cursor:pointer;position:relative}
      .calendar-day-half-slot:hover{background:rgba(124,58,237,.06)}
      .calendar-day-half-slot .half-label{position:absolute;left:6px;top:2px;font-size:10px;color:#999;pointer-events:none}
      .calendar-day-tasks{padding:6px 0;border-bottom:1px solid #eee}
      .calendar-day-task{display:block;width:calc(100% - 12px);margin:4px 6px;padding:7px 9px;border-radius:7px;border-left:4px solid var(--item-color,#7c3aed);background:rgba(124,58,237,.10);text-align:left;cursor:pointer}
      .calendar-day-untimed{padding:4px 0;border-bottom:1px solid #eee}
      .calendar-day-event{display:block;width:calc(100% - 12px);margin:4px 6px;padding:7px 9px;border-radius:7px;border-left:4px solid var(--event-color,#7c3aed);background:rgba(124,58,237,.10);text-align:left;cursor:pointer}
      .calendar-day-timed-item{position:absolute;left:6px;right:6px;min-height:28px;padding:5px 8px;border-radius:7px;border-left:4px solid var(--event-color,#7c3aed);background:rgba(124,58,237,.10);font-size:13px;overflow:hidden;text-align:left;z-index:2}
    `;document.head.appendChild(s);
  }
  function openEvent(date,time){
    if(typeof openEventModal!=='function')return;
    openEventModal(null,date);
    setTimeout(()=>{const t=document.getElementById('eventTime');if(t)t.value=time;},0);
  }
  function renderDay(){
    if(typeof calendarView==='undefined'||calendarView!=='day')return false;
    const title=document.querySelector('#calendarMonthTitle'),grid=document.querySelector('#calendarGrid');
    if(!title||!grid)return false;
    style();
    const date=new Date(calendarDate.getFullYear(),calendarDate.getMonth(),calendarDate.getDate());
    const dateKey=key(date),tasks=getPlannerTasksForCalendar(),events=getCalendarEvents(),subjects=getCalendarSubjects();
    title.textContent=date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    grid.innerHTML='';grid.className='calendar-grid calendar-day-only';
    document.getElementById('calendarPage')?.classList.add('calendar-day-active');

    const column=document.createElement('div');column.className='calendar-view-column';
    const header=document.createElement('div');header.className='calendar-view-header';header.textContent=date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});if(dateKey===key(new Date()))header.classList.add('today');column.appendChild(header);

    // Tasks are date-based, not timed, so keep them together at the top.
    const dayTasks=getCalendarTasksForDate(tasks,dateKey);
    if(dayTasks.length){
      const taskBox=document.createElement('div');taskBox.className='calendar-day-tasks';
      dayTasks.forEach(t=>{const item=document.createElement('button');item.type='button';item.className='calendar-day-task';if(t.completed||t.status==='Completed')item.classList.add('completed');const sub=subjects.find(x=>x.name===t.subject);item.style.setProperty('--item-color',sub?.colour||'#7c3aed');item.textContent=`${sub?.emoji||'✓'} ${t.name||'Untitled task'}${t.recurrence?' ↻':''}`;item.onclick=e=>{e.stopPropagation();openCalendarTask(t.id);};taskBox.appendChild(item);});column.appendChild(taskBox);
    }

    // Events without a time are also date-based and do not consume hourly space.
    const dayEvents=getCalendarEventsForDate(events,dateKey),untimed=dayEvents.filter(e=>!e.time),timed=dayEvents.filter(e=>e.time);
    if(untimed.length){
      const box=document.createElement('div');box.className='calendar-day-untimed';
      untimed.forEach(e=>{const item=document.createElement('button');item.type='button';item.className='calendar-day-event';item.style.setProperty('--event-color',e.colour||'#7c3aed');item.textContent=`${e.name||'Untitled event'} · All day`;item.onclick=x=>{x.stopPropagation();if(typeof openEventModal==='function')openEventModal(e.id);};box.appendChild(item);});column.appendChild(box);
    }

    const timeGrid=document.createElement('div');timeGrid.className='calendar-day-time-grid';
    const labels=document.createElement('div');labels.className='calendar-day-time-labels';
    const timeColumn=document.createElement('div');timeColumn.className='calendar-day-time-column';
    for(let h=6;h<=23;h++){
      const label=document.createElement('div');label.className='calendar-day-time-label';label.textContent=`${h%12||12}:00 ${h>=12?'PM':'AM'}`;labels.appendChild(label);
      for(let half=0;half<2;half++){
        const minute=half*30,slot=document.createElement('div');slot.className='calendar-day-half-slot';slot.dataset.time=`${String(h).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;slot.onclick=()=>openEvent(dateKey,slot.dataset.time);if(half===1){const l=document.createElement('span');l.className='half-label';l.textContent=':30';slot.appendChild(l);}timeColumn.appendChild(slot);
      }
    }
    timeGrid.append(labels,timeColumn);column.appendChild(timeGrid);

    // Only timed events are positioned in the hourly grid.
    timed.forEach(e=>{const parts=String(e.time).split(':'),h=Number(parts[0]),min=Number(parts[1]||0);if(!Number.isFinite(h)||h<6||h>23)return;const item=document.createElement('button');item.type='button';item.className='calendar-day-timed-item';item.style.setProperty('--event-color',e.colour||'#7c3aed');item.textContent=`${e.time} · ${e.name||'Untitled event'}`;item.onclick=x=>{x.stopPropagation();if(typeof openEventModal==='function')openEventModal(e.id);};item.style.top=((h-6)*72+(min/60)*72)+'px';item.style.height='40px';timeColumn.appendChild(item);});
    grid.appendChild(column);return true;
  }
  function install(){style();if(typeof calendarView!=='undefined'&&calendarView==='day')renderDay();else document.getElementById('calendarPage')?.classList.remove('calendar-day-active');}
  const original=window.renderCalendar;
  window.renderCalendar=function(){if(renderDay())return;return original?.apply(this,arguments);};
  document.addEventListener('DOMContentLoaded',install);window.addEventListener('load',install);setInterval(install,500);
})();
