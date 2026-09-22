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
  function achievementGrades(a){
    const g=a.grade;
    if(g&&typeof g==="object"&&g.achievements)return g.achievements;
    if(g&&typeof g==="object"&&g.percentage!=null)return {K:null,T:null,C:null,A:{raw:g.raw||"",earned:g.earned,possible:g.possible,percentage:Number(g.percentage)}};
    return {K:null,T:null,C:null,A:null};
  }
  function gradeText(a){
    const g=a.grade;
    if(g&&typeof g==="object"&&g.achievements){
      const entries=Object.entries(g.achievements).filter(([,v])=>v&&v.percentage!=null);
      if(!entries.length)return "Not graded";
      const weights=g.weights||{K:25,T:25,C:25,A:25};
      const total=entries.reduce((sum,[key])=>sum+(Number(weights[key])||0),0);
      if(!total)return "Not graded";
      const value=entries.reduce((sum,[key,v])=>sum+Number(v.percentage)*(Number(weights[key])||0),0)/total;
      return Math.round(value*10)/10+"%";
    }
    if(g===null||g===undefined||g==="")return "Not graded";
    if(typeof g==="object")return g.percentage!=null?g.percentage+"%":JSON.stringify(g);
    return String(g);
  }
  function parseGrade(value){
    const raw=String(value||"").trim();
    if(!raw)return null;
    const parts=raw.split("/").map(v=>v.trim());
    if(parts.length===2&&parts[0]!==""&&parts[1]!==""){
      const earned=Number(parts[0]),possible=Number(parts[1]);
      if(Number.isFinite(earned)&&Number.isFinite(possible)&&possible>0)return {raw,earned,possible,percentage:Math.round((earned/possible)*10000)/100};
    }
    const percent=raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*%$/);
    if(percent)return {raw,earned:null,possible:null,percentage:Number(percent[1])};
    const plain=raw.match(/^([0-9]+(?:\.[0-9]+)?)$/);
    if(plain){const percentage=Number(plain[1]);if(percentage>=0&&percentage<=100)return {raw,earned:null,possible:null,percentage};}
    return null;
  }
  function editGrade(a){
    const current=achievementGrades(a);
    const weights=a.grade&&typeof a.grade==="object"&&a.grade.weights?a.grade.weights:{K:25,T:25,C:25,A:25};
    const b=document.createElement("div");
    b.className="assignment-feature-modal-backdrop";
    b.innerHTML='<div class="assignment-feature-modal assignment-grade-modal" role="dialog" aria-modal="true" aria-label="Edit Grades">'+
      '<h2>Edit Grades</h2><p class="assignment-grade-context">'+esc(a.name)+'</p>'+
      '<p class="assignment-grade-hint">Enter any K/T/C/A grades that apply. Each achievement can have its own grade.</p>'+
      '<form class="assignment-feature-form" id="gradeForm"><div class="assignment-kcta-grid">'+
      '<div class="assignment-kcta-row"><label for="gradeK"><strong>K</strong></label><input id="gradeK" type="text" inputmode="decimal" placeholder="18/20 or 90%" value="'+esc(current.K?.raw||"")+'"><input id="weightK" type="number" min="0" max="100" step="1" value="'+(Number(weights.K)||0)+'"><span>%</span></div>'+
      '<div class="assignment-kcta-row"><label for="gradeT"><strong>T</strong></label><input id="gradeT" type="text" inputmode="decimal" placeholder="18/20 or 90%" value="'+esc(current.T?.raw||"")+'"><input id="weightT" type="number" min="0" max="100" step="1" value="'+(Number(weights.T)||0)+'"><span>%</span></div>'+
      '<div class="assignment-kcta-row"><label for="gradeC"><strong>C</strong></label><input id="gradeC" type="text" inputmode="decimal" placeholder="18/20 or 90%" value="'+esc(current.C?.raw||"")+'"><input id="weightC" type="number" min="0" max="100" step="1" value="'+(Number(weights.C)||0)+'"><span>%</span></div>'+
      '<div class="assignment-kcta-row"><label for="gradeA"><strong>A</strong></label><input id="gradeA" type="text" inputmode="decimal" placeholder="18/20 or 90%" value="'+esc(current.A?.raw||"")+'"><input id="weightA" type="number" min="0" max="100" step="1" value="'+(Number(weights.A)||0)+'"><span>%</span></div>'+
      '</div><p class="assignment-grade-hint">The K/T/C/A weights must total 100%. They apply within this assignment\'s grading category.</p>'+
      '<div class="assignment-feature-actions"><button type="button" class="assignment-feature-secondary" id="gradeCancel">Cancel</button><button class="assignment-feature-button" type="submit">Save Grades</button></div></form></div>';
    document.body.appendChild(b);
    const close=()=>b.remove();
    b.querySelector("#gradeCancel").onclick=close;
    b.onclick=e=>{if(e.target===b)close();};
    b.querySelector("#gradeForm").onsubmit=e=>{
      e.preventDefault();
      const achievements={};let hasGrade=false;
      for(const k of ["K","T","C","A"]){
        const raw=b.querySelector("#grade"+k).value.trim();
        if(!raw){achievements[k]=null;continue;}
        const parsed=parseGrade(raw);
        if(!parsed){alert("Please enter a valid grade for "+k+", such as 18/20 or 90%.");b.querySelector("#grade"+k).focus();return;}
        achievements[k]=parsed;hasGrade=true;
      }
      const weights={};let total=0;
      for(const k of ["K","T","C","A"]){const n=Number(b.querySelector("#weight"+k).value);if(!Number.isFinite(n)||n<0){alert("Weights must be 0 or greater.");return;}weights[k]=n;total+=n;}
      if(hasGrade&&Math.round(total*100)/100!==100){alert("K/T/C/A weights must total 100%.");return;}
      window.PlannerData.update("assignments",a.id,{grade:{achievements,weights}});
      close();
    };
  }

  function editNotes(a){const value=prompt("Notes",a.notes||"");if(value!==null)window.PlannerData.update("assignments",a.id,{notes:value});}
  function addResource(a){const value=prompt("Resource name or link");if(value)window.PlannerData.update("assignments",a.id,{resources:[...(a.resources||[]),value.trim()]});}

  function render(){const id=detailRoute();if(id)renderAssignment(id);}
  window.PlannerAssignments={showAddAssignment,openAssignment:id=>{location.hash=`assignment/${id}`}};
  window.addEventListener("hashchange",render);
  window.addEventListener("planner:data-changed",()=>{if(detailRoute())render();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);else render();
})();
