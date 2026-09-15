(() => {
  const PAGE = document.getElementById("page");
  const SUBJECTS_NAV = document.querySelector('.nav-item[data-page="subjects"]');

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
  }

  function data() { return window.PlannerData.getData(); }

  function subjectRoute() {
    const parts = window.location.hash.replace(/^#/, "").split("/");
    if (parts[0] === "subjects") return { type: "subjects" };
    if (parts[0] === "subject" && parts[1]) return { type: "subject", id: parts[1] };
    return null;
  }

  function setSubjectsActive(active) {
    if (active && SUBJECTS_NAV) SUBJECTS_NAV.classList.add("active");
  }

  function renderSubjects() {
    setSubjectsActive(true);
    const subjects = data().subjects;
    PAGE.innerHTML = `
      <div class="subjects-feature">
        <div class="subjects-feature-header">
          <div><h2>Subjects</h2><p>Your courses, units, grades, and academic progress.</p></div>
          <button class="subjects-feature-button" id="subjectsAddButton">+ Add Subject</button>
        </div>
        ${subjects.length ? `<div class="subjects-feature-grid">${subjects.map(subjectCard).join("")}</div>` : `
          <div class="subjects-feature-empty"><strong>No subjects yet</strong>Add your first subject to get started.</div>`}
      </div>`;
    document.getElementById("subjectsAddButton").addEventListener("click", showAddSubject);
    PAGE.querySelectorAll("[data-subject-id]").forEach(card => card.addEventListener("click", () => {
      window.location.hash = `subject/${card.dataset.subjectId}`;
    }));
  }

  function subjectCard(subject) {
    const units = data().units.filter(unit => unit.subjectId === subject.id);
    return `<article class="subjects-feature-card" data-subject-id="${escapeHtml(subject.id)}">
      <div class="subjects-feature-icon" style="background:${escapeHtml(subject.color || "#e5ede7")}">${escapeHtml(subject.icon || "📚")}</div>
      <h3>${escapeHtml(subject.name)}</h3>
      <div class="subjects-feature-meta">Current grade: —<br>Current unit: —${units.length ? `<br>${units.length} unit${units.length === 1 ? "" : "s"}` : ""}</div>
    </article>`;
  }

  function showAddSubject() {
    const backdrop = document.createElement("div");
    backdrop.className = "subjects-feature-modal-backdrop";
    backdrop.innerHTML = `<div class="subjects-feature-modal" role="dialog" aria-modal="true" aria-label="Add Subject">
      <h2>Add Subject</h2>
      <form class="subjects-feature-form" id="subjectsFeatureForm">
        <div class="subjects-feature-field"><label for="subjectName">Name</label><input id="subjectName" required autofocus></div>
        <div class="subjects-feature-field"><label for="subjectIcon">Icon</label><input id="subjectIcon" value="📚" maxlength="4"></div>
        <div class="subjects-feature-field"><label for="subjectColor">Colour</label><input id="subjectColor" type="color" value="#e5ede7"></div>
        <div class="subjects-feature-field"><label for="subjectPeriod">Academic period</label><select id="subjectPeriod"><option>Semester 1</option><option>Semester 2</option></select></div>
        <div class="subjects-feature-actions"><button type="button" class="subjects-feature-secondary" id="subjectCancel">Cancel</button><button class="subjects-feature-button" type="submit">Add Subject</button></div>
      </form>
    </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector("#subjectCancel").addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", event => { if (event.target === backdrop) backdrop.remove(); });
    backdrop.querySelector("#subjectsFeatureForm").addEventListener("submit", event => {
      event.preventDefault();
      const subject = window.PlannerData.create("subjects", {
        name: backdrop.querySelector("#subjectName").value.trim(),
        icon: backdrop.querySelector("#subjectIcon").value.trim() || "📚",
        color: backdrop.querySelector("#subjectColor").value,
        academicPeriod: backdrop.querySelector("#subjectPeriod").value
      });
      backdrop.remove();
      renderSubject(subject.id);
    });
  }

  function renderSubject(id) {
    setSubjectsActive(true);
    const subject = window.PlannerData.find("subjects", id);
    if (!subject) { window.location.hash = "subjects"; return; }
    const units = data().units.filter(unit => unit.subjectId === subject.id).sort((a,b) => (a.number ?? 999) - (b.number ?? 999));
    PAGE.innerHTML = `<div class="subjects-feature">
      <div class="subjects-feature-header">
        <div><button class="subjects-feature-secondary" id="subjectBack">← Back</button><h2 style="margin-top:16px">${escapeHtml(subject.icon || "📚")} ${escapeHtml(subject.name)}</h2><p>Current grade: — &nbsp; · &nbsp; Current unit: —</p></div>
      </div>
      <section><h3>Units</h3>${units.length ? `<div class="subjects-feature-grid">${units.map(unit => `<article class="subjects-feature-card"><h3>Unit ${escapeHtml(unit.number ?? "")} — ${escapeHtml(unit.name)}</h3><div class="subjects-feature-meta">Status: ${escapeHtml(unit.status || "Upcoming")}</div></article>`).join("")}</div>` : `<div class="subjects-feature-empty"><strong>No units yet</strong>Units will appear here as they are added.</div>`}</section>
    </div>`;
    document.getElementById("subjectBack").addEventListener("click", () => window.location.hash = "subjects");
  }

  function render() {
    const route = subjectRoute();
    if (!route) return;
    if (route.type === "subjects") renderSubjects();
    if (route.type === "subject") renderSubject(route.id);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("planner:data-changed", () => { if (subjectRoute()) render(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
