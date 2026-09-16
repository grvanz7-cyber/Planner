(() => {
  const PAGE = document.getElementById("page");
  let viewDate = new Date();

  function data() { return window.PlannerData.getData(); }
  function esc(v) { return String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
  function localDate(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
  function monthLabel(date) { return date.toLocaleDateString(undefined, { month: "long", year: "numeric" }); }
  function assignmentDate(a) { return a.dueDate || null; }
  function subjectOf(a) { return (data().subjects || []).find(s => s.id === a.subjectId) || null; }

  function render() {
    if (!location.hash.replace(/^#/, "").startsWith("calendar")) return;
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startOffset = first.getDay();
    const days = last.getDate();
    const today = localDate(new Date());
    const assignments = (data().assignments || []).filter(a => assignmentDate(a));
    const byDate = {};
    assignments.forEach(a => { const d = assignmentDate(a); (byDate[d] ||= []).push(a); });

    let cells = "";
    for (let i = 0; i < startOffset; i++) cells += `<div class="calendar-cell calendar-cell-empty"></div>`;
    for (let day = 1; day <= days; day++) {
      const date = new Date(year, month, day);
      const key = localDate(date);
      const items = (byDate[key] || []).sort((a,b) => String(a.name).localeCompare(String(b.name)));
      cells += `<div class="calendar-cell${key === today ? " calendar-today" : ""}">
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-items">${items.map(a => {
          const subject = subjectOf(a);
          return `<button type="button" class="calendar-item" data-assignment-id="${esc(a.id)}"><span>${esc(subject?.icon || "📝")}</span><span>${esc(a.name)}</span></button>`;
        }).join("")}</div>
      </div>`;
    }
    const total = startOffset + days;
    const trailing = (7 - (total % 7)) % 7;
    for (let i = 0; i < trailing; i++) cells += `<div class="calendar-cell calendar-cell-empty"></div>`;

    PAGE.innerHTML = `<div class="page-header calendar-page-header">
      <div><h1>Calendar</h1><p>Assignments and deadlines in one calendar view.</p></div>
      <div class="calendar-controls">
        <button type="button" class="calendar-control" id="calendarToday">Today</button>
        <button type="button" class="calendar-control" id="calendarPrev" aria-label="Previous month">‹</button>
        <strong>${esc(monthLabel(viewDate))}</strong>
        <button type="button" class="calendar-control" id="calendarNext" aria-label="Next month">›</button>
      </div>
    </div>
    <section class="calendar-card">
      <div class="calendar-weekdays">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div>${d}</div>`).join("")}</div>
      <div class="calendar-grid">${cells}</div>
    </section>`;

    document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === "calendar"));
    document.getElementById("calendarToday").addEventListener("click", () => { viewDate = new Date(); render(); });
    document.getElementById("calendarPrev").addEventListener("click", () => { viewDate = new Date(year, month - 1, 1); render(); });
    document.getElementById("calendarNext").addEventListener("click", () => { viewDate = new Date(year, month + 1, 1); render(); });
    document.querySelectorAll(".calendar-item").forEach(button => button.addEventListener("click", () => { window.PlannerAssignments?.openAssignment?.(button.dataset.assignmentId); }));
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("planner:data-changed", render);
  window.addEventListener("planner:assignment-created", render);
  render();
})();
