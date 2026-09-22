(() => {
  const PAGE = document.getElementById("page");

  function esc(v) { return String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
  function data() { return window.PlannerData.getData(); }
  function findAssignment(id) { return window.PlannerData.find("assignments", id); }
  function subjectOf(a) { return window.PlannerData.find("subjects", a.subjectId); }
  function unitOf(a) { return a.unitId ? window.PlannerData.find("units", a.unitId) : null; }
  function backToAssignmentParent(a) { const from=sessionStorage.getItem("planner-assignment-return"); if(from==="dashboard") return "dashboard"; return a.unitId ? `unit/${a.unitId}` : `subject/${a.subjectId}`; }

  function parseQuickCapture(text) {
    const original = text.trim();
    let remaining = original;
    const subjects = data().subjects;
    let subject = null;
    const aliases = {
      physics: ["physics", "phys", "sph4u"],
      chemistry: ["chemistry", "chem", "sch4u"],
      biology: ["biology", "bio", "sbi4u"],
      english: ["english", "eng"],
      mathematics: ["mathematics", "math", "maths", "mcr3u"]
    };
    const ordered = Object.entries(aliases).flatMap(([name, words]) => words.map(word => ({name, word}))).sort((a,b)=>b.word.length-a.word.length);
    for (const item of ordered) {
      const re = new RegExp(`(^|\\s)${item.word.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&")}(?=\\s|$)`, "i");
      if (re.test(remaining)) {
        subject = subjects.find(s => s.name.toLowerCase() === item.name.toLowerCase()) || null;
        if (subject) remaining = remaining.replace(re, " ");
        break;
      }
    }

    let unitNumber = null;
    remaining = remaining.replace(/\bunit\s*(\d+)\b/i, (_, n) => { unitNumber = Number(n); return " "; });

    let dueDate = null;
    const today = new Date(); today.setHours(0,0,0,0);
    const days = {sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
    remaining = remaining.replace(/\b(today|tomorrow)\b/i, word => {
      const d = new Date(today); if (word.toLowerCase() === "tomorrow") d.setDate(d.getDate()+1); dueDate=d.toISOString().slice(0,10); return " ";
    });
    if (!dueDate) remaining = remaining.replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i, word => {
      const target=days[word.toLowerCase()], d=new Date(today), diff=(target-d.getDay()+7)%7; d.setDate(d.getDate()+(diff===0?7:diff)); dueDate=d.toISOString().slice(0,10); return " ";
    });

    let workload = null;
    remaining = remaining.replace(/\b(1h30|1h|2h|15m|30m|45m)\b/i, value => { workload=value.toLowerCase(); return " "; });

    let type = null;
    const typeWords = {test:"Assessment",tests:"Assessment",quiz:"Assessment",quizzes:"Assessment",lab:"Assignment",assignment:"Assignment",essay:"Assignment",project:"Assignment",exam:"Assessment",culminating:"Culminating"};
    for (const [word,value] of Object.entries(typeWords)) {
      const re=new RegExp(`\\b${word}\\b`,"i");
      if(re.test(remaining)){type=value;remaining=remaining.replace(re," ");break;}
    }

    const name = remaining.replace(/\s+/g," ").trim();
    return {original, subjectId:subject?.id||null, unitNumber, dueDate, estimatedWorkload:workload, type, name:name||original};
  }

  function showAddAssignment(initialName = "", parsed = null) {
    const subjects = data().subjects;
    if (!subjects.length) { alert("Add a subject first before creating an assignment."); location.hash = "subjects"; return; }
    const p = parsed || {name:initialName};
    const b = document.createElement("div");
    b.className = "assignment-feature-modal-backdrop";
    b.innerHTML = `<div class="assignment-feature-modal" role="dialog" aria-modal="true" aria-label="Add Assignment">
      <h2>Add Assignment</h2>
      <form class="assignment-feature-form" id="assignmentForm">
        <div class="assignment-feature-field"><label for="assignmentName">Name</label><input id="assignmentName" value="${esc(p.name||"")}" required autofocus></div>
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
      if (p.unitNumber != null) { const match=units.find(u=>Number(u.number)===p.unitNumber); if(match)b.querySelector("#assignmentUnit").value=match.id; }
    }
    updateUnits();
    b.querySelector("#assignmentSubject").value = p.subjectId || subjects[0].id;
    updateUnits();
    if (p.type) b.querySelector("#assignmentType").value=p.type;
    if (p.dueDate) b.querySelector("#assignmentDue").value=p.dueDate;
    if (p.estimatedWorkload) b.querySelector("#assignmentWorkload").value=p.estimatedWorkload;
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
    document.getElementById("assignmentBack").onclick=()=>{const target=backToAssignmentParent(a);sessionStorage.removeItem("planner-assignment-return");location.hash=target;};
    document.getElementById("assignmentDelete").onclick=()=>{if(confirm(`Delete “${a.name}”?`)){window.PlannerData.remove("assignments",a.id);const target=backToAssignmentParent(a);sessionStorage.removeItem("planner-assignment-return");location.hash=target;}};
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
    const b=document.createElement("div");b.className="assignment-feature-modal-backdrop";b.innerHTML=`<div class="assignment-feature-modal" role="dialog" aria-modal="true"><h2>Edit Details</h2><form class="assignment-feature-form"><div class="assignment-feature-field"><label>Name</label><input id="edName" value="${esc(a.name)}" required></div><div class="assignment-feature-field"><label>Type</label><select id="edType"><option>Assignment</option><option>Assessment</option><option>Culminating</option></select></div><div class="assignment-feature-field"><label>Due date</label><input id="edDue" type="date" value="${esc(a.dueDate||"")}"></div><div class="assignment-feature-field"><label>Due time</label><input id="edTime" type="time" value="${esc(a.dueTime||"")}"><p class="calendar-add-hint">Leave blank for an all-day / no-time deadline.</p></div><div class="assignment-feature-field"><label>Status</label><select id="edStatus"><option>Not started</option><option>In progress</option><option>Finished</option><option>Submitted</option><option>Graded</option></select></div><div class="assignment-feature-field"><label>Priority</label><select id="edPriority"><option>Low</option><option>Normal</option><option>High</option></select></div><div class="assignment-feature-actions"><button type="button" class="assignment-feature-secondary" id="edCancel">Cancel</button><button class="assignment-feature-button">Save</button></div></form></div>`;document.body.appendChild(b);b.querySelector("#edType").value=a.type||"Assignment";b.querySelector("#edStatus").value=a.status||"Not started";b.querySelector("#edPriority").value=a.priority||"Normal";b.querySelector("#edCancel").onclick=()=>b.remove();b.onclick=e=>{if(e.target===b)b.remove()};b.querySelector("form").onsubmit=e=>{e.preventDefault();window.PlannerData.update("assignments",a.id,{name:b.querySelector("#edName").value.trim(),type:b.querySelector("#edType").value,dueDate:b.querySelector("#edDue").value||null,dueTime:b.querySelector("#edTime").value||null,dueTimeMode:b.querySelector("#edTime").value?"Custom":"No time specified",status:b.querySelector("#edStatus").value,priority:b.querySelector("#edPriority").value});b.remove();};
  }
  function parseGrade(value){
    const raw=String(value||"").trim();
    if(!raw)return null;
    const parts=raw.split("/").map(v=>v.trim());
    if(parts.length===2 && parts[0]!=="" && parts[1]!==""){
      const earned=Number(parts[0]), possible=Number(parts[1]);
      if(Number.isFinite(earned)&&Number.isFinite(possible)&&possible>0){
        return {raw,earned,possible,percentage:Math.round((earned/possible)*10000)/100};
      }
    }
    const percent=raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*%$/);
    if(percent)return {raw,earned:null,possible:null,percentage:Number(percent[1])};
    const plain=raw.match(/^([0-9]+(?:\.[0-9]+)?)$/);
    if(plain){
      const percentage=Number(plain[1]);
      if(percentage>=0&&percentage<=100)return {raw,earned:null,possible:null,percentage};
    }
    return null;
  }
  function editGrade(a){
    const current=a.grade&&typeof a.grade==="object" ? (a.grade.raw||gradeText(a)) : (a.grade||"");
    const value=prompt("Enter the grade (for example 18/20 or 90%).",current);
    if(value===null)return;
    const raw=value.trim();
    if(!raw){window.PlannerData.update("assignments",a.id,{grade:null});return;}
    const parsed=parseGrade(raw);
    if(!parsed){alert("Please enter a grade like 18/20 or 90%.");return;}
    window.PlannerData.update("assignments",a.id,{grade:parsed});
  }
  function editNotes(a){const value=prompt("Notes",a.notes||"");if(value!==null)window.PlannerData.update("assignments",a.id,{notes:value});}
  function addResource(a){const value=prompt("Resource name or link");if(value)window.PlannerData.update("assignments",a.id,{resources:[...(a.resources||[]),value.trim()]});}

  function render(){const id=detailRoute();if(id)renderAssignment(id);}
  window.PlannerAssignments={showAddAssignment,openAssignment:id=>{location.hash=`assignment/${id}`}};
  window.addEventListener("hashchange",render);
  window.addEventListener("planner:data-changed",()=>{if(detailRoute())render();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);else render();
})();
