(() => {
  const PAGE = document.getElementById("page");

  function esc(v) {
    return String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }

  function data() { return window.PlannerData.getData(); }

  function showAddAssignment(initialName = "") {
    const subjects = data().subjects;
    if (!subjects.length) {
      alert("Add a subject first before creating an assignment.");
      location.hash = "subjects";
      return;
    }

    const b = document.createElement("div");
    b.className = "assignment-feature-modal-backdrop";
    b.innerHTML = `<div class="assignment-feature-modal" role="dialog" aria-modal="true" aria-label="Add Assignment">
      <h2>Add Assignment</h2>
      <form class="assignment-feature-form" id="assignmentForm">
        <div class="assignment-feature-field"><label for="assignmentName">Name</label><input id="assignmentName" value="${esc(initialName)}" required autofocus></div>
        <div class="assignment-feature-field"><label for="assignmentSubject">Subject</label><select id="assignmentSubject" required>${subjects.map(s => `<option value="${esc(s.id)}">${esc(s.icon || "📚")} ${esc(s.name)}</option>`).join("")}</select></div>
        <div class="assignment-feature-field"><label for="assignmentType">Type</label><select id="assignmentType"><option>Assignment</option><option>Assessment</option><option>Culminating</option></select></div>
        <div class="assignment-feature-field"><label for="assignmentUnit">Unit</label><select id="assignmentUnit"><option value="">No unit</option></select></div>
        <div class="assignment-feature-field"><label for="assignmentDue">Due date</label><input id="assignmentDue" type="date"></div>
        <div class="assignment-feature-field"><label>Priority</label><div class="assignment-feature-options" id="assignmentPriority"><button type="button" data-value="Low">Low</button><button type="button" data-value="Normal" class="selected">Normal</button><button type="button" data-value="High">High</button></div></div>
        <div class="assignment-feature-field"><label for="assignmentWorkload">Estimated workload</label><select id="assignmentWorkload"><option value="">Not specified</option><option value="15m">15 minutes</option><option value="30m">30 minutes</option><option value="45m">45 minutes</option><option value="1h">1 hour</option><option value="1h30">1 hour 30 minutes</option><option value="2h">2 hours</option></select></div>
        <div class="assignment-feature-field"><label for="assignmentStatus">Status</label><select id="assignmentStatus"><option>Not started</option><option>In progress</option><option>Finished</option><option>Submitted</option><option>Graded</option></select></div>
        <div class="assignment-feature-actions"><button type="button" class="assignment-feature-secondary" id="assignmentCancel">Cancel</button><button class="assignment-feature-button" type="submit">Add Assignment</button></div>
      </form>
    </div>`;
    document.body.appendChild(b);

    let selectedPriority = "Normal";

    function updateUnits() {
      const subjectId = b.querySelector("#assignmentSubject").value;
      const unitSelect = b.querySelector("#assignmentUnit");
      const units = data().units.filter(u => u.subjectId === subjectId).sort((a, z) => (Number(a.number) || 999) - (Number(z.number) || 999));
      unitSelect.innerHTML = `<option value="">No unit</option>${units.map(u => `<option value="${esc(u.id)}">Unit ${esc(u.number)} — ${esc(u.name)}</option>`).join("")}`;
    }

    updateUnits();
    b.querySelector("#assignmentSubject").onchange = updateUnits;
    b.querySelectorAll("[data-value]").forEach(btn => btn.onclick = () => {
      selectedPriority = btn.dataset.value;
      b.querySelectorAll("[data-value]").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
    });
    b.querySelector("#assignmentCancel").onclick = () => b.remove();
    b.onclick = e => { if (e.target === b) b.remove(); };
    b.querySelector("form").onsubmit = e => {
      e.preventDefault();
      const unitId = b.querySelector("#assignmentUnit").value || null;
      const assignment = window.PlannerData.create("assignments", {
        name: b.querySelector("#assignmentName").value.trim(),
        subjectId: b.querySelector("#assignmentSubject").value,
        type: b.querySelector("#assignmentType").value,
        unitId,
        dueDate: b.querySelector("#assignmentDue").value || null,
        dueTime: null,
        dueTimeMode: "No time specified",
        priority: selectedPriority,
        estimatedWorkload: b.querySelector("#assignmentWorkload").value || null,
        status: b.querySelector("#assignmentStatus").value,
        notes: "",
        resources: [],
        grade: null,
        tasks: [],
        studyPlanId: null
      });
      b.remove();
      window.dispatchEvent(new CustomEvent("planner:assignment-created", { detail: assignment }));
    };
  }

  window.PlannerAssignments = { showAddAssignment };
})();
