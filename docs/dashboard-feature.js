(() => {
  const PAGE = document.getElementById("page");

  function data() { return window.PlannerData.getData(); }
  function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function localDate(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
  function formatDate(key) {
    if (!key) return "No due date";
    return new Date(key + "T00:00:00").toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });
  }
  function subjectOf(a) { return (data().subjects || []).find(s => s.id === a.subjectId) || null; }
  function assignmentTypeLabel(a) { return a.type || "Assignment"; }
  function statusLabel(a) { return a.status || "Not started"; }

  function assignmentRow(a) {
    const subject = subjectOf(a);
    return `<button type="button" class="dashboard-item dashboard-assignment" data-assignment-id="${esc(a.id)}">
      <span class="dashboard-item-icon">${esc(subject?.icon || "📝")}</span>
      <span class="dashboard-item-main"><strong>${esc(a.name)}</strong><small>${esc(subject?.name || "No subject")} · ${esc(assignmentTypeLabel(a))}</small></span>
      <span class="dashboard-item-meta"><strong>${esc(formatDate(a.dueDate))}</strong><small>${esc(statusLabel(a))}</small></span>
    </button>`;
  }

  function taskRow(t) {
    return `<div class="dashboard-item dashboard-task">
      <span class="dashboard-item-icon">☑️</span>
      <span class="dashboard-item-main"><strong>${esc(t.name)}</strong><small>Task</small></span>
      <span class="dashboard-item-meta"><strong>${esc(formatDate(t.dueDate))}</strong><small>${esc(t.status || "Not started")}</small></span>
    </div>`;
  }

  function eventRow(e) {
    return `<div class="dashboard-item dashboard-event">
      <span class="dashboard-item-icon">📅</span>
      <span class="dashboard-item-main"><strong>${esc(e.name)}</strong><small>Event</small></span>
      <span class="dashboard-item-meta"><strong>${esc(formatDate(e.startDate || e.date))}</strong><small>${e.allDay ? "All day" : esc(e.startTime || "")}</small></span>
    </div>`;
  }

  function section(title, content, extraClass="") {
    return `<section class="dashboard-section ${extraClass}"><div class="dashboard-section-header"><h2>${esc(title)}</h2></div>${content}</section>`;
  }

  function notificationRow(n) {
    const actionable = n.itemType && n.itemId;
    return `<div class="dashboard-item dashboard-notification">
      <span class="dashboard-item-icon">⚠️</span>
      <span class="dashboard-item-main"><strong>${esc(n.title || "Needs attention")}</strong><small>${esc(n.message || "This item needs your attention.")}</small></span>
      <span class="dashboard-notification-actions">
        ${actionable ? `<button type="button" class="dashboard-notification-review" data-notification-id="${esc(n.id)}">Review</button>` : ""}
        <button type="button" class="dashboard-notification-resolve" data-notification-id="${esc(n.id)}">Resolve</button>
      </span>
    </div>`;
  }

  function priorityRank(value) {
    return value === "High" ? 0 : value === "Normal" ? 1 : 2;
  }

  function workloadMinutes(value) {
    const map = {"15m":15,"30m":30,"45m":45,"1h":60,"1h30":90,"2h":120};
    return map[value] || 0;
  }

  function suggestedNext(assignments) {
    const today = localDate(new Date());
    const now = new Date();
    return assignments
      .filter(a => a.status !== "Finished" && a.status !== "Submitted" && a.status !== "Graded")
      .map(a => {
        const due = a.dueDate ? new Date(a.dueDate + "T23:59:59") : null;
        const daysAway = due ? Math.ceil((due - now) / 86400000) : 99;
        return { a, daysAway };
      })
      .sort((x,y) =>
        priorityRank(x.a.priority) - priorityRank(y.a.priority) ||
        x.daysAway - y.daysAway ||
        workloadMinutes(x.a.estimatedWorkload) - workloadMinutes(y.a.estimatedWorkload) ||
        String(x.a.name).localeCompare(String(y.a.name))
      )
      .slice(0, 3)
      .map(({a, daysAway}) => {
        const subject = subjectOf(a);
        const dueText = !a.dueDate ? "No due date" : daysAway < 0 ? "Overdue" : daysAway === 0 ? "Due today" : daysAway === 1 ? "Due tomorrow" : "Due " + formatDate(a.dueDate);
        const workload = a.estimatedWorkload && a.estimatedWorkload !== "Not specified" ? " · ~" + a.estimatedWorkload : "";
        return `<button type="button" class="dashboard-item dashboard-suggestion" data-assignment-id="${esc(a.id)}">
          <span class="dashboard-item-icon">${esc(subject?.icon || "📝")}</span>
          <span class="dashboard-item-main"><strong>${esc(a.name)}</strong><small>${esc(subject?.name || "No subject")} · ${esc(dueText)}${esc(workload)}</small></span>
          <span class="dashboard-item-meta"><strong>${esc(a.priority || "Normal")}</strong><small>${esc(a.status || "Not started")}</small></span>
        </button>`;
      }).join("");
  }

  function render() {
    const d = data();
    const today = localDate(new Date());
    const upcomingEnd = new Date();
    upcomingEnd.setHours(0,0,0,0);
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);
    const endKey = localDate(upcomingEnd);

    const assignments = Array.isArray(d.assignments) ? d.assignments : [];
    const tasks = Array.isArray(d.tasks) ? d.tasks : [];
    const events = Array.isArray(d.events) ? d.events : [];
    const notifications = Array.isArray(d.notifications) ? d.notifications.filter(n => !n.resolved) : [];

    const todayAssignments = assignments.filter(a => a.dueDate === today).sort((a,b) => String(a.name).localeCompare(String(b.name)));
    const todayTasks = tasks.filter(t => t.dueDate === today).sort((a,b) => String(a.name).localeCompare(String(b.name)));
    const todayEvents = events.filter(e => (e.startDate || e.date) === today).sort((a,b) => String(a.name).localeCompare(String(b.name)));

    const upcomingAssignments = assignments.filter(a => a.dueDate && a.dueDate > today && a.dueDate <= endKey).sort((a,b) => String(a.dueDate).localeCompare(String(b.dueDate)) || String(a.name).localeCompare(String(b.name)));
    const upcomingTasks = tasks.filter(t => t.dueDate && t.dueDate > today && t.dueDate <= endKey).sort((a,b) => String(a.dueDate).localeCompare(String(b.dueDate)) || String(a.name).localeCompare(String(b.name)));
    const upcomingEvents = events.filter(e => { const k=e.startDate || e.date; return k && k > today && k <= endKey; }).sort((a,b) => String(a.startDate || a.date).localeCompare(String(b.startDate || b.date)) || String(a.name).localeCompare(String(b.name)));

    const todayItems = [...todayAssignments.map(assignmentRow), ...todayTasks.map(taskRow), ...todayEvents.map(eventRow)].join("");
    const upcomingItems = [...upcomingAssignments.map(assignmentRow), ...upcomingTasks.map(taskRow), ...upcomingEvents.map(eventRow)].join("");
    const attentionItems = notifications.map(notificationRow).join("");
    const suggestedItems = suggestedNext(assignments);

    const subjects = (d.subjects || []).filter(s => s.archived !== true).slice(0, 6);
    const subjectCards = subjects.length ? subjects.map(s => `<button type="button" class="dashboard-subject" data-subject-id="${esc(s.id)}"><span class="dashboard-subject-icon">${esc(s.icon || "📚")}</span><span><strong>${esc(s.name)}</strong><small>${esc(s.academicPeriod || "")}</small></span></button>`).join("") : `<div class="dashboard-empty">No subjects yet. Add your courses from Subjects.</div>`;

    PAGE.innerHTML = `
      <div class="page-header dashboard-header">
        <div><h1>Dashboard</h1><p>What matters today, what's coming up, and what you can do next.</p></div>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-main">
          ${section("Needs Attention", attentionItems || `<div class="dashboard-empty">Nothing needs your attention right now.</div>`, "dashboard-attention")}
          ${section("Suggested Next", suggestedItems || `<div class="dashboard-empty">Nothing to suggest right now.</div>`, "dashboard-suggested")}
          ${section("Today", todayItems || `<div class="dashboard-empty">Nothing scheduled for today.</div>`)}
          ${section("Upcoming · next 7 days", upcomingItems || `<div class="dashboard-empty">Nothing due in the next 7 days.</div>`)}
        </div>
        <aside class="dashboard-side">
          ${section("Subjects", `<div class="dashboard-subject-list">${subjectCards}</div>`)}
          ${section("Overview", `<div class="dashboard-stats"><div><strong>${assignments.length}</strong><span>Assignments</span></div><div><strong>${tasks.length}</strong><span>Tasks</span></div><div><strong>${events.length}</strong><span>Events</span></div></div>`)}
        </aside>
      </div>`;

    PAGE.querySelectorAll(".dashboard-notification-review").forEach(button => button.addEventListener("click", () => {
      const n = notifications.find(value => value.id === button.dataset.notificationId);
      if (!n) return;
      if (n.itemType === "assignment" && n.itemId) {
        sessionStorage.setItem("planner-assignment-return", "dashboard");
        window.location.hash = `assignment/${n.itemId}`;
      }
    }));
    PAGE.querySelectorAll(".dashboard-notification-resolve").forEach(button => button.addEventListener("click", () => {
      window.PlannerData.update("notifications", button.dataset.notificationId, { resolved: true, read: true, resolvedAt: new Date().toISOString() });
    }));
    PAGE.querySelectorAll(".dashboard-assignment,.dashboard-suggestion").forEach(button => button.addEventListener("click", () => {
      sessionStorage.setItem("planner-assignment-return","dashboard");
      window.location.hash = `assignment/${button.dataset.assignmentId}`;
    }));
    PAGE.querySelectorAll(".dashboard-subject").forEach(button => button.addEventListener("click", () => {
      window.location.hash = `subject/${button.dataset.subjectId}`;
    }));
  }

  window.PlannerDashboard = { render };
  window.addEventListener("planner:data-changed", () => {
    if ((window.location.hash.replace(/^#/,"") || "dashboard").split("/")[0] === "dashboard") render();
  });
})();