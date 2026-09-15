(() => {
  const PAGE = document.getElementById("page");

  function esc(v) { return String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
  function data() { return window.PlannerData.getData(); }
  function findAssignment(id) { return window.PlannerData.find("assignments", id); }
  function subjectOf(a) { return window.PlannerData.find("subjects", a.subjectId); }
  function unitOf(a) { return a.unitId ? window.PlannerData.find("units", a.unitId) : null; }
  function backToAssignmentParent(a) { return a.unitId ? `unit/${a.unitId}` : `subject/${a.subjectId}`; }

  function showAddAssignment(initialName = "") {
    const subjects = data().subjects;
    if (!subjects.length) { alert("Add a subject first before creating an assignment."); location.hash = "subjects"; return; }
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
      const units = data().units.filter(u => u.subjectId === subjectId).sort((a,z)=>(Number(a.number)||999)-(Number(z.number)||999));
      b.querySelector("#assignmentUnit").innerHTML = `<option value="">No unit</option>${units.map(u=>`<option value="${esc(u.id)}">Unit ${esc(u.number)} — ${esc(u.name)}</option>`).join("")}`;
    }
    updateUnits();
    b.querySelector("#assignmentSubject").onchange=updateUnits;
    b.querySelectorAll("[data-value]").forEach(btn=>btn.onclick=()=>{selectedPriority=btn.dataset.value;b.querySelectorAll("[data-value]").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected")});
    b.querySelector("#assignmentCancel").onclick=()=>b.remove(); b.onclick=e=>{if(e.target===b)b.remove()};
    b.querySelector("form").onsubmit=e=>{e.preventDefault();const assignment=window.PlannerData.create("assignments",{name:b.querySelector("#assignmentName").value.trim(),subjectId:b.querySelector("#assignmentSubject").value,type:b.querySelector("#assignmentType").value,unitId:b.querySelector("#assignmentUnit").value||null,dueDate:b.querySelector("#assignmentDue").value||null,dueTime:null,dueTimeMode:"No time specified",priority:selectedPriority,estimatedWorkload:b.querySelector("#assignmentWorkload").value||null,status:b.querySelector("#assignmentStatus").value,notes:"",resources:[],grade:null,tasks:[],studyPlanId:null});b.remove();window.dispatchEvent(new CustomEvent("planner:assignment-created",{detail:assignment}));};
  }

  function detailRoute(){const p=location.hash.replace(/^#/,"").split("/");return p[0]==="assignment"&&p[1]?p[1]:null;}
  function formatDate(value){if(!value)return "No due date";return new Date(value+"T00:00:00").toLocaleDateString(undefined,{weekday:"short",month:"long",day:"numeric",year:"numeric"});}
  function workload(value){return ({"15m":"15 minutes","30m":"30 minutes","45m":"45 minutes","1h":"1 hour","1h30":"1 hour 30 minutes","2h":"2 hours"}[value]||value||"Not specified");}
  function gradeText(a){if(a.grade===null||a.grade===undefined||a.grade==="")return "Not graded";if(typeof a.grade==="object")return a.grade.percentage!=null?`${a.grade.percentage}%`:JSON.stringify(a.grade);return String(a.grade);}

  function renderAssignment(id){
    const a=findAssignment(id); if(!a){location.hash="subjects";return;}
    const s=subjectOf(a),u=unitOf(a), tasks=Array.isArray(a.tasks)?a.tasks:[];
    const done=tasks.filter(t=>t.completed).length;
    const resources=Array.isArray(a.resources)?a.resources:[];
    PAGE.innerHTML=`<div class="assignment-detail">
      <div class="assignment-detail-top"><button class="assignment-feature-secondary" id="assignmentBack">← Back</button><div class="assignment-detail-actions"><button class="assignment-feature-secondary" id="assignmentDelete">Delete</button></div></div>
      <header class="assignment-detail-header"><div class="assignment-detail-title"><span class="assignment-detail-icon">${esc(s?.icon||"📚")}</span><div><p class="assignment-detail-kicker">${esc(s?.name||"Unknown subject")}${u?` · Unit ${esc(u.number)} — ${esc(u.name)}`:""}</p><h1>${esc(a.name)}</h1><div class="assignment-detail-badges"><span>${esc(a.type||"Assignment")}</span><span>${esc(a.status||"Not started")}</span><span>${esc(a.priority||"Normal")} priority</span></div></div></div></header>
      <div class="assignment-detail-grid">
        <section class="assignment-detail-card"><div class="assignment-detail-card-heading"><h2>Details</h2><button class="assignment-detail-edit" data-edit="details">Edit</button></div><div class="assignment-detail-info-grid"><div><span>Subject</span><strong>${esc(s?.name||"—")}</strong></div><div><span>Unit</span><strong>${u?`Unit ${esc(u.number)} — ${esc(u.name)}`:"No unit"}</strong></div><div><span>Due</span><strong>${esc(formatDate(a.dueDate))}</strong></div><div><span>Workload</span><strong>${esc(workload(a.estimatedWorkload))}</strong></div></div></section>
        <section class="assignment-detail-card"><div class="assignment-detail-card-heading"><h2>Tasks</h2><span>${done}/${tasks.length} complete</span></div><div class="assignment-detail-progress"><div style="width:${tasks.length?Math.round(done/tasks.length*100):0}%"></div></div><div class="assignment-detail-task-list">${tasks.length?tasks.map((t,i)=>`<label class="assignment-detail-task ${t.completed?"complete":""}"><input type="checkbox" data-task-index="${i}" ${t.completed?"checked":""}><span>${esc(t.name||t.title||"Task")}</span><button type="button" data-delete-task="${i}" aria-label="Delete task">×</button></label>`).join(""):"<p class=\"assignment-detail-muted\">No tasks yet.</p>"}</div><form class="assignment-detail-inline-form" id="taskForm"><input id="newTask" placeholder="Add a task…" required><button class="assignment-feature-button">Add</button></form></section>
        <section class="assignment-detail-card"><div class="assignment-detail-card-heading"><h2>Grade</h2><button class="assignment-detail-edit" data-edit="grade">Edit</button></div><div class="assignment-detail-grade-value">${esc(gradeText(a))}</div><p class="assignment-detail-muted">Enter a grade when this assignment has been marked.</p></section>
        <section class="assignment-detail-card"><div class="assignment-detail-card-heading"><h2>Notes</h2><button class="assignment-detail-edit" data-edit="notes">Edit</button></div><div class="assignment-detail-notes">${a.notes?esc(a.notes).replace(/\n/g,"<br>"):"<span class=\"assignment-detail-muted\">No notes yet.</span>"}</div></section>
        <section class="assignment-detail-card"><div class="assignment-detail-card-heading"><h2>Resources</h2><button class="assignment-detail-edit" data-edit="resources">Add</button></div>${resources.length?`<ul class="assignment-detail-resources">${resources.map((r,i)=>`<li><span>${esc(typeof r==="string"?r:r.name||r.url||"Resource")}</span><button type="button" data-delete-resource="${i}">×</button></li>`).join("")}</ul>`:"<p class=\"assignment-detail-muted\">No resources yet.</p>"}</section>
        <section class="assignment-detail-card"><div class="assignment-detail-card-heading"><h2>Activity</h2></div><div class="assignment-detail-activity"><p>Created ${esc(new Date(a.createdAt).toLocaleString())}</p><p>Last updated ${esc(new Date(a.updatedAt).toLocaleString())}</p></div></section>
      </div>
    </div>`;
    document.getElementById("assignmentBack").onclick=()=>location.hash=backToAssignmentParent(a);
    document.getElementById("assignmentDelete").onclick=()=>{if(confirm(`Delete “${a.name}”?`)){window.PlannerData.remove("assignments",a.id);location.hash=backToAssignmentParent(a);}};
    PAGE.querySelectorAll("[data-edit=details]").forEach(x=>x.onclick=()=>editDetails(a));
    PAGE.querySelectorAll("[data-edit=grade]").forEach(x=>x.onclick=()=>editGrade(a));
    PAGE.querySelectorAll("[data-edit=notes]").forEach(x=>x.onclick=()=>editNotes(a));
    PAGE.querySelectorAll("[data-edit=resources]").forEach(x=>x.onclick=()=>addResource(a));
    PAGE.querySelectorAll("[data-task-index]").forEach(x=>x.onchange=()=>{const updated=[...tasks];updated[Number(x.dataset.taskIndex)]={...updated[Number(x.dataset.taskIndex)],completed:x.checked};window.PlannerData.update("assignments",a.id,{tasks:updated});});
    PAGE.querySelectorAll("[data-delete-task]").forEach(x=>x.onclick=()=>{const updated=tasks.filter((_,i)=>i!==Number(x.dataset.deleteTask));window.PlannerData.update("assignments",a.id,{tasks:updated});});
    PAGE.querySelectorAll("[data-delete-resource]").forEach(x=>x.onclick=()=>{const updated=resources.filter((_,i)=>i!==Number(x.dataset.deleteResource));window.PlannerData.update("assignments",a.id,{resources:updated});});
    document.getElementById("taskForm").onsubmit=e=>{e.preventDefault();const name=document.getElementById("newTask").value.trim();if(!name)return;window.PlannerData.update("assignments",a.id,{tasks:[...tasks,{id:Math.random().toString(36).slice(2,9),name,completed:false,createdAt:new Date().toISOString()}]});};
  }

  function editDetails(a){
    const s=subjectOf(a),b=document.createElement("div");b.className="assignment-feature-modal-backdrop";b.innerHTML=`<div class="assignment-feature-modal" role="dialog" aria-modal="true"><h2>Edit Details</h2><form class="assignment-feature-form"><div class="assignment-feature-field"><label>Name</label><input id="edName" value="${esc(a.name)}" required></div><div class="assignment-feature-field"><label>Type</label><select id="edType"><option>Assignment</option><option>Assessment</option><option>Culminating</option></select></div><div class="assignment-feature-field"><label>Due date</label><input id="edDue" type="date" value="${esc(a.dueDate||"")}"></div><div class="assignment-feature-field"><label>Status</label><select id="edStatus"><option>Not started</option><option>In progress</option><option>Finished</option><option>Submitted</option><option>Graded</option></select></div><div class="assignment-feature-field"><label>Priority</label><select id="edPriority"><option>Low</option><option>Normal</option><option>High</option></select></div><div class="assignment-feature-actions"><button type="button" class="assignment-feature-secondary" id="edCancel">Cancel</button><button class="assignment-feature-button">Save</button></div></form></div>`;document.body.appendChild(b);b.querySelector("#edType").value=a.type||"Assignment";b.querySelector("#edStatus").value=a.status||"Not started";b.querySelector("#edPriority").value=a.priority||"Normal";b.querySelector("#edCancel").onclick=()=>b.remove();b.onclick=e=>{if(e.target===b)b.remove()};b.querySelector("form").onsubmit=e=>{e.preventDefault();window.PlannerData.update("assignments",a.id,{name:b.querySelector("#edName").value.trim(),type:b.querySelector("#edType").value,dueDate:b.querySelector("#edDue").value||null,status:b.querySelector("#edStatus").value,priority:b.querySelector("#edPriority").value});b.remove();};
  }
  function editGrade(a){const value=prompt("Enter the grade (for example 18/20 or 90%).",a.grade==null?"":gradeText(a));if(value!==null)window.PlannerData.update("assignments",a.id,{grade:value.trim()||null});}
  function editNotes(a){const value=prompt("Notes",a.notes||"");if(value!==null)window.PlannerData.update("assignments",a.id,{notes:value});}
  function addResource(a){const value=prompt("Resource name or link");if(value)window.PlannerData.update("assignments",a.id,{resources:[...(a.resources||[]),value.trim()]});}

  function render(){const id=detailRoute();if(id)renderAssignment(id);}
  window.PlannerAssignments={showAddAssignment,openAssignment:id=>{location.hash=`assignment/${id}`}};
  window.addEventListener("hashchange",render);
  window.addEventListener("planner:data-changed",()=>{if(detailRoute())render();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);else render();
})();
