(() => {
  const PAGE = document.getElementById("page");
  let viewDate = new Date();
  let viewMode = "month";
  const filters = { assignments: true, tasks: true, events: true };
  const START_HOUR = 7;
  const END_HOUR = 22;
  const SLOT_MINUTES = 30;

  function data() { return window.PlannerData.getData(); }
  function esc(v) { return String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
  function localDate(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
  function monthLabel(date) { return date.toLocaleDateString(undefined, { month: "long", year: "numeric" }); }
  function fullDateLabel(date) { return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
  function assignmentDate(a) { return a.dueDate || null; }
  function subjectOf(a) { return (data().subjects || []).find(s => s.id === a.subjectId) || null; }
  function assignmentsFor(key) { return (data().assignments || []).filter(a => assignmentDate(a) === key).sort((a,b) => String(a.name).localeCompare(String(b.name))); }
  function tasksFor(key) { return (data().tasks || []).filter(t => t.dueDate === key).sort((a,b) => String(a.name).localeCompare(String(b.name))); }
  function eventsFor(key) { return (data().events || []).filter(e => (e.startDate || e.date) === key).sort((a,b) => String(a.name).localeCompare(String(b.name))); }
  function timedAssignmentsFor(key) { return assignmentsFor(key).filter(a => a.dueTime); }
  function allDayAssignmentsFor(key) { return assignmentsFor(key).filter(a => !a.dueTime); }
  function openAssignment(id) { window.PlannerAssignments?.openAssignment?.(id); }
  function itemMarkup(a) { const subject = subjectOf(a); return `<button type="button" class="calendar-item calendar-assignment-item" data-assignment-id="${esc(a.id)}"><span>${esc(subject?.icon || "📝")}</span><span>${esc(a.name)}</span></button>`; }
  function taskMarkup(t) { return `<div class="calendar-item calendar-task-item"><span>☑️</span><span>${esc(t.name)}</span></div>`; }
  function eventMarkup(e) { return `<div class="calendar-item calendar-event-item"><span>📅</span><span>${esc(e.name)}</span></div>`; }
  function dayItems(key) {
    let html = "";
    if (filters.assignments) html += assignmentsFor(key).map(itemMarkup).join("");
    if (filters.tasks) html += tasksFor(key).map(taskMarkup).join("");
    if (filters.events) html += eventsFor(key).map(eventMarkup).join("");
    return html;
  }
  function timeText(minutes) { const h = Math.floor(minutes / 60), m = minutes % 60, suffix = h >= 12 ? "PM" : "AM", display = h % 12 || 12; return `${display}:${String(m).padStart(2,"0")} ${suffix}`; }
  function timeValue(minutes) { const h = Math.floor(minutes / 60), m = minutes % 60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
  function dateTimeFrom(dateKey, time) { return `${dateKey}T${time}`; }
  function slotMarkup(dateKey, minutes) { return `<button type="button" class="calendar-time-slot" data-date="${esc(dateKey)}" data-minutes="${minutes}" aria-label="Add item ${esc(dateKey)} ${esc(timeText(minutes))}"><span>${minutes % 60 === 0 ? esc(timeText(minutes)) : ""}</span></button>`; }

  function renderMonth() {
    const year = viewDate.getFullYear(), month = viewDate.getMonth();
    const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
    const startOffset = first.getDay(), days = last.getDate(), today = localDate(new Date());
    let cells = "";
    for (let i = 0; i < startOffset; i++) cells += `<div class="calendar-cell calendar-cell-empty"></div>`;
    for (let day = 1; day <= days; day++) {
      const date = new Date(year, month, day), key = localDate(date);
      cells += `<div class="calendar-cell${key === today ? " calendar-today" : ""}"><div class="calendar-day-number">${day}</div><div class="calendar-items">${dayItems(key)}</div></div>`;
    }
    const total = startOffset + days, trailing = (7 - (total % 7)) % 7;
    for (let i = 0; i < trailing; i++) cells += `<div class="calendar-cell calendar-cell-empty"></div>`;
    return `<div class="calendar-weekdays">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div>${d}</div>`).join("")}</div><div class="calendar-grid">${cells}</div>`;
  }

  function startOfWeek(date) { const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d; }

  function renderTimedColumn(date) {
    const key = localDate(date), timed = filters.assignments ? timedAssignmentsFor(key) : [], allDay = filters.assignments ? allDayAssignmentsFor(key) : [], today = localDate(new Date());
    let rows = "";
    for (let minutes = START_HOUR * 60; minutes < END_HOUR * 60; minutes += SLOT_MINUTES) rows += `<div class="calendar-slot-row"><div class="calendar-time-label">${minutes % 60 === 0 ? esc(timeText(minutes)) : ""}</div><div class="calendar-slot-cell">${slotMarkup(key, minutes)}</div></div>`;
    const events = timed.map(a => {
      const [h,m] = String(a.dueTime).split(":").map(Number), minutes = h * 60 + m;
      if (minutes < START_HOUR*60 || minutes >= END_HOUR*60) return "";
      const subject = subjectOf(a);
      return `<button type="button" class="calendar-timed-item" data-assignment-id="${esc(a.id)}" style="top:${(minutes-START_HOUR*60)*2}px"><span>${esc(subject?.icon || "📝")}</span>${esc(a.name)}</button>`;
    }).join("");
    return `<div class="calendar-timed-column${key === today ? " calendar-column-today" : ""}"><div class="calendar-column-header"><strong>${esc(date.toLocaleDateString(undefined,{weekday:"short"}))}</strong><span>${esc(date.toLocaleDateString(undefined,{month:"short",day:"numeric"}))}</span></div><div class="calendar-all-day" data-all-day-date="${esc(key)}"><button type="button" class="calendar-all-day-label" data-all-day-date="${esc(key)}">All day</button><div class="calendar-items">${allDay.map(itemMarkup).join("")}</div></div><div class="calendar-time-grid"><div class="calendar-time-rows">${rows}</div><div class="calendar-timed-items">${events}</div></div></div>`;
  }

  function filterBar() {
    return `<div class="calendar-filters" role="group" aria-label="Calendar filters">
      <label><input type="checkbox" data-filter="assignments" ${filters.assignments ? "checked" : ""}> Assignments</label>
      <label><input type="checkbox" data-filter="tasks" ${filters.tasks ? "checked" : ""}> Tasks</label>
      <label><input type="checkbox" data-filter="events" ${filters.events ? "checked" : ""}> Events</label>
    </div>`;
  }

  function renderColumns(count) {
    const start = count === 1 ? new Date(viewDate) : startOfWeek(viewDate);
    let columns = "";
    for (let i = 0; i < count; i++) { const date = new Date(start); date.setDate(start.getDate() + i); columns += renderTimedColumn(date); }
    return `<div class="calendar-timed-view calendar-timed-view-${count}">${columns}</div>`;
  }

  function title() {
    if (viewMode === "month") return monthLabel(viewDate);
    if (viewMode === "day") return fullDateLabel(viewDate);
    const start = startOfWeek(viewDate), end = new Date(start); end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${end.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;
  }

  function move(delta) {
    if (viewMode === "month") viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    else viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + (viewMode === "week" ? delta * 7 : delta));
    render();
  }

  function showAddAtSlot(dateKey, minutes) {
    const subjects = data().subjects || [];
    const time = minutes == null ? null : timeValue(minutes);
    const b = document.createElement("div");
    b.className = "assignment-feature-modal-backdrop";
    b.innerHTML = `<div class="assignment-feature-modal calendar-add-modal" role="dialog" aria-modal="true" aria-label="Add calendar item"><h2>Add to calendar</h2><p class="calendar-add-time">${esc(new Date(dateKey+"T00:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}))} · ${esc(minutes == null ? "All day / no time specified" : timeText(minutes))}</p><form id="calendarAddForm" class="assignment-feature-form"><div class="assignment-feature-field"><label for="calendarAddType">Type</label><select id="calendarAddType"><option value="assignment">Assignment</option><option value="task">Task</option><option value="event">Event</option></select></div><div class="assignment-feature-field"><label for="calendarAddName">Name</label><input id="calendarAddName" required autofocus placeholder="What are you adding?"></div><div class="assignment-feature-field" id="calendarSubjectField"><label for="calendarAddSubject">Subject</label><select id="calendarAddSubject" ${subjects.length?"":"disabled"}>${subjects.map(s=>`<option value="${esc(s.id)}">${esc(s.icon||"📚")} ${esc(s.name)}</option>`).join("")}</select></div><div class="assignment-feature-field" id="calendarTimeField"><label for="calendarAddTime">Time</label><input id="calendarAddTime" type="time" value="${esc(time || "")}"><p class="calendar-add-hint">Leave blank to keep this item all day.</p></div><div class="assignment-feature-field" id="calendarEndField"><label for="calendarAddEnd">End time</label><input id="calendarAddEnd" type="time" value="${esc(timeValue(Math.min((minutes == null ? START_HOUR*60 : minutes)+60,END_HOUR*60)))}"></div><div class="assignment-feature-actions"><button type="button" class="assignment-feature-secondary" id="calendarAddCancel">Cancel</button><button class="assignment-feature-button">Add</button></div></form></div>`;
    document.body.appendChild(b);
    const type = b.querySelector("#calendarAddType"), subjectField = b.querySelector("#calendarSubjectField"), endField = b.querySelector("#calendarEndField");
    function updateFields(){ const isAssignment=type.value==="assignment", isEvent=type.value==="event"; subjectField.style.display=isAssignment?"":"none"; endField.style.display=isEvent?"":"none"; }
    type.onchange=updateFields; updateFields();
    b.querySelector("#calendarAddCancel").onclick=()=>b.remove(); b.onclick=e=>{if(e.target===b)b.remove()};
    b.querySelector("form").onsubmit=e=>{
      e.preventDefault();
      const name=b.querySelector("#calendarAddName").value.trim(); if(!name)return;
      const selectedTime=b.querySelector("#calendarAddTime").value || null;
      if(type.value==="assignment"){
        if(!subjects.length){alert("Add a subject first.");return;}
        const a=window.PlannerData.create("assignments",{name,subjectId:b.querySelector("#calendarAddSubject").value,type:"Assignment",unitId:null,dueDate:dateKey,dueTime:selectedTime,dueTimeMode:selectedTime?"Custom":"No time specified",priority:"Normal",estimatedWorkload:null,status:"Not started",notes:"",resources:[],grade:null,tasks:[],studyPlanId:null});
        sessionStorage.setItem("planner-assignment-return","calendar"); b.remove(); render();
      } else if(type.value==="task") {
        window.PlannerData.create("tasks",{name,subjectId:null,parentType:null,parentId:null,dueDate:dateKey,dueTime:selectedTime,priority:"Normal",estimatedTime:null,status:"Not started",notes:"",scheduledTime:null});
        b.remove(); render();
      } else {
        const end=b.querySelector("#calendarAddEnd").value || timeValue(Math.min(minutes+60,END_HOUR*60));
        window.PlannerData.create("events",{name,startDate:dateKey,startTime:selectedTime,endDate:dateKey,endTime:selectedTime ? end : null,allDay:!selectedTime,notes:""});
        b.remove(); render();
      }
    };
  }

  function render() {
    if (!location.hash.replace(/^#/, "").startsWith("calendar")) return;
    PAGE.innerHTML = `<div class="page-header calendar-page-header"><div><h1>Calendar</h1><p>Assignments and deadlines in one calendar view.</p></div><div class="calendar-toolbar"><div class="calendar-view-switch" role="group" aria-label="Calendar view"><button type="button" class="calendar-view-button${viewMode === "month" ? " selected" : ""}" data-view="month">Month</button><button type="button" class="calendar-view-button${viewMode === "week" ? " selected" : ""}" data-view="week">Week</button><button type="button" class="calendar-view-button${viewMode === "day" ? " selected" : ""}" data-view="day">Day</button></div><div class="calendar-controls"><button type="button" class="calendar-control" id="calendarToday">Today</button><button type="button" class="calendar-control" id="calendarPrev" aria-label="Previous">‹</button><strong>${esc(title())}</strong><button type="button" class="calendar-control" id="calendarNext" aria-label="Next">›</button></div>${filterBar()}</div></div><section class="calendar-card">${viewMode === "month" ? renderMonth() : renderColumns(viewMode === "day" ? 1 : 7)}</section>`;
    document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === "calendar"));
    document.querySelectorAll(".calendar-view-button").forEach(button => button.addEventListener("click", () => { viewMode = button.dataset.view; render(); }));
    document.getElementById("calendarToday").addEventListener("click", () => { viewDate = new Date(); render(); });
    document.getElementById("calendarPrev").addEventListener("click", () => move(-1));
    document.getElementById("calendarNext").addEventListener("click", () => move(1));
    document.querySelectorAll(".calendar-assignment-item,.calendar-timed-item").forEach(button => button.addEventListener("click", () => { sessionStorage.setItem("planner-assignment-return", "calendar"); openAssignment(button.dataset.assignmentId); }));
    document.querySelectorAll("[data-filter]").forEach(input => input.addEventListener("change", () => { filters[input.dataset.filter] = input.checked; render(); }));
    document.querySelectorAll(".calendar-time-slot").forEach(button => button.addEventListener("click", () => showAddAtSlot(button.dataset.date, Number(button.dataset.minutes))));
    document.querySelectorAll(".calendar-all-day-label").forEach(button => button.addEventListener("click", () => showAddAtSlot(button.dataset.allDayDate, null)));
  }

  window.PlannerCalendar = { render };
  window.addEventListener("hashchange", render);
  window.addEventListener("planner:data-changed", render);
  window.addEventListener("planner:assignment-created", render);
  render();
})();