(() => {
  const PAGE = document.getElementById("page");
  let viewDate = new Date();
  let viewMode = "month";

  function data() { return window.PlannerData.getData(); }
  function esc(v) { return String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
  function localDate(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
  function monthLabel(date) { return date.toLocaleDateString(undefined, { month: "long", year: "numeric" }); }
  function fullDateLabel(date) { return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
  function assignmentDate(a) { return a.dueDate || null; }
  function subjectOf(a) { return (data().subjects || []).find(s => s.id === a.subjectId) || null; }
  function assignmentsFor(key) { return (data().assignments || []).filter(a => assignmentDate(a) === key).sort((a,b) => String(a.name).localeCompare(String(b.name))); }
  function openAssignment(id) { window.PlannerAssignments?.openAssignment?.(id); }
  function itemMarkup(a) { const subject = subjectOf(a); return `<button type="button" class="calendar-item" data-assignment-id="${esc(a.id)}"><span>${esc(subject?.icon || "📝")}</span><span>${esc(a.name)}</span></button>`; }

  function renderMonth() {
    const year = viewDate.getFullYear(), month = viewDate.getMonth();
    const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
    const startOffset = first.getDay(), days = last.getDate(), today = localDate(new Date());
    let cells = "";
    for (let i = 0; i < startOffset; i++) cells += `<div class="calendar-cell calendar-cell-empty"></div>`;
    for (let day = 1; day <= days; day++) {
      const date = new Date(year, month, day), key = localDate(date), items = assignmentsFor(key);
      cells += `<div class="calendar-cell${key === today ? " calendar-today" : ""}"><div class="calendar-day-number">${day}</div><div class="calendar-items">${items.map(itemMarkup).join("")}</div></div>`;
    }
    const total = startOffset + days, trailing = (7 - (total % 7)) % 7;
    for (let i = 0; i < trailing; i++) cells += `<div class="calendar-cell calendar-cell-empty"></div>`;
    return `<div class="calendar-weekdays">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div>${d}</div>`).join("")}</div><div class="calendar-grid">${cells}</div>`;
  }

  function startOfWeek(date) { const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d; }
  function renderColumns(count) {
    const start = count === 1 ? new Date(viewDate) : startOfWeek(viewDate), today = localDate(new Date());
    let columns = "";
    for (let i = 0; i < count; i++) {
      const date = new Date(start); date.setDate(start.getDate() + i);
      const key = localDate(date), items = assignmentsFor(key);
      columns += `<div class="calendar-column${key === today ? " calendar-column-today" : ""}"><div class="calendar-column-header"><strong>${esc(date.toLocaleDateString(undefined,{weekday:"short"}))}</strong><span>${esc(date.toLocaleDateString(undefined,{month:"short",day:"numeric"}))}</span></div><div class="calendar-column-body"><div class="calendar-all-day-label">All day</div><div class="calendar-items">${items.map(itemMarkup).join("") || `<p class="calendar-empty-day">No assignments</p>`}</div></div></div>`;
    }
    return `<div class="calendar-columns calendar-columns-${count}">${columns}</div>`;
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

  function render() {
    if (!location.hash.replace(/^#/, "").startsWith("calendar")) return;
    PAGE.innerHTML = `<div class="page-header calendar-page-header"><div><h1>Calendar</h1><p>Assignments and deadlines in one calendar view.</p></div><div class="calendar-toolbar"><div class="calendar-view-switch" role="group" aria-label="Calendar view"><button type="button" class="calendar-view-button${viewMode === "month" ? " selected" : ""}" data-view="month">Month</button><button type="button" class="calendar-view-button${viewMode === "week" ? " selected" : ""}" data-view="week">Week</button><button type="button" class="calendar-view-button${viewMode === "day" ? " selected" : ""}" data-view="day">Day</button></div><div class="calendar-controls"><button type="button" class="calendar-control" id="calendarToday">Today</button><button type="button" class="calendar-control" id="calendarPrev" aria-label="Previous">‹</button><strong>${esc(title())}</strong><button type="button" class="calendar-control" id="calendarNext" aria-label="Next">›</button></div></div></div><section class="calendar-card">${viewMode === "month" ? renderMonth() : renderColumns(viewMode === "day" ? 1 : 7)}</section>`;
    document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === "calendar"));
    document.querySelectorAll(".calendar-view-button").forEach(button => button.addEventListener("click", () => { viewMode = button.dataset.view; render(); }));
    document.getElementById("calendarToday").addEventListener("click", () => { viewDate = new Date(); render(); });
    document.getElementById("calendarPrev").addEventListener("click", () => move(-1));
    document.getElementById("calendarNext").addEventListener("click", () => move(1));
    document.querySelectorAll(".calendar-item").forEach(button => button.addEventListener("click", () => { sessionStorage.setItem("planner-assignment-return", "calendar"); openAssignment(button.dataset.assignmentId); }));
  }

  window.PlannerCalendar = { render };
  window.addEventListener("hashchange", render);
  window.addEventListener("planner:data-changed", render);
  window.addEventListener("planner:assignment-created", render);
  render();
})();