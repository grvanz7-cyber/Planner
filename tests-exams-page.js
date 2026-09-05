// ========================================
// TESTS & EXAMS PAGE
// ========================================
(function(){
  window.__testsExamsPageLoaded=true;
  function el(id){return document.getElementById(id);}
  function ensurePage(){
    if(el('testsExamsPage'))return;
    const page=document.createElement('div');
    page.id='testsExamsPage';page.className='page-hidden';
    page.innerHTML=`<header class="header assessments-page-header"><div><h1>Tests & Exams</h1><p>Keep track of your tests, quizzes, and exams.</p></div><button class="save-button" type="button" id="assessmentAddButton">+ Add Assessment</button></header><div class="assessment-summary"><div class="assessment-stat"><span id="assessmentUpcomingCount">0</span><small>Upcoming</small></div><div class="assessment-stat"><span id="assessmentOverdueCount">0</span><small>Overdue</small></div><div class="assessment-stat"><span id="assessmentCompletedCount">0</span><small>Completed</small></div></div><section class="card assessments-card"><div class="assessment-filters"><select id="assessmentSubjectFilter"><option value="">All subjects</option></select><select id="assessmentTypeFilter"><option value="">Tests & exams</option><option value="Test">Tests</option><option value="Exam">Exams</option><option value="Quiz">Quizzes</option></select><select id="assessmentStatusFilter"><option value="">All statuses</option><option value="upcoming">Upcoming</option><option value="overdue">Overdue</option><option value="completed">Completed</option></select></div><div id="assessmentsList" class="assessments-list"></div></section>`;
    document.querySelector('.main')?.appendChild(page);
    el('assessmentAddButton').onclick=()=>openAssessmentModal();
    el('assessmentSubjectFilter').onchange=renderAssessments;
    el('assessmentTypeFilter').onchange=renderAssessments;
    el('assessmentStatusFilter').onchange=renderAssessments;
  }
  function ensureModal(){
    if(el('assessmentModal'))return;
    const wrap=document.createElement('div');wrap.className='modal-overlay';wrap.id='assessmentModal';
    wrap.innerHTML=`<div class="modal"><div class="modal-header"><h2 id="assessmentModalTitle">New Assessment</h2><button class="close-button" type="button" id="assessmentClose">×</button></div><div class="form-group"><label for="assessmentName">Name</label><input id="assessmentName" type="text" placeholder="e.g. Unit 3 Test"></div><div class="form-row"><div class="form-group"><label for="assessmentSubject">Subject</label><select id="assessmentSubject"></select></div><div class="form-group"><label for="assessmentType">Type</label><select id="assessmentType"><option value="Quiz">❓ Quiz</option><option value="Test" selected>🧪 Test</option><option value="Exam">🎓 Exam</option></select></div></div><div class="form-row"><div class="form-group"><label for="assessmentDueDate">Date</label><input id="assessmentDueDate" type="date"></div><div class="form-group"><label for="assessmentPriority">Priority</label><select id="assessmentPriority"><option value="Low">Low</option><option value="Normal" selected>Normal</option><option value="High">High</option></select></div></div><div class="form-group"><label for="assessmentWeight">Weight</label><div class="percentage-input"><input id="assessmentWeight" type="number" min="0" max="100" step="0.1" placeholder="Optional"><span>%</span></div></div><div class="form-group"><label for="assessmentNotes">Notes</label><textarea id="assessmentNotes" rows="3" placeholder="Topics, study notes, or instructions..."></textarea></div><div class="modal-actions"><button class="cancel-button" type="button" id="assessmentCancel">Cancel</button><button class="save-button" type="button" id="assessmentSave">Add Assessment</button></div></div>`;
    document.body.appendChild(wrap);
    el('assessmentClose').onclick=closeAssessmentModal;el('assessmentCancel').onclick=closeAssessmentModal;el('assessmentSave').onclick=createAssessment;
    wrap.addEventListener('click',e=>{if(e.target===wrap)closeAssessmentModal();});
  }
  function populateSubjects(){
    const select=el('assessmentSubject');if(!select)return;
    select.innerHTML='<option value="">Choose a subject</option>';
    (plannerData?.settings?.subjects||[]).filter(s=>s&&s.active!==false).forEach(s=>{const o=document.createElement('option');o.value=s.name||'';o.textContent=`${s.emoji||'📚'} ${s.name||''}`;select.appendChild(o);});
  }
  function populateFilter(){
    const select=el('assessmentSubjectFilter');if(!select)return;const cur=select.value;
    select.innerHTML='<option value="">All subjects</option>';
    (plannerData?.settings?.subjects||[]).filter(s=>s&&s.active!==false).forEach(s=>{const o=document.createElement('option');o.value=s.name||'';o.textContent=`${s.emoji||'📚'} ${s.name||''}`;select.appendChild(o);});
    if([...select.options].some(o=>o.value===cur))select.value=cur;
  }
  function assessmentTasks(){return (Array.isArray(plannerData?.tasks)?plannerData.tasks:[]).filter(t=>['quiz','test','exam'].includes(String(t.type||'').toLowerCase()));}
  function state(t){if(t.completed||String(t.status||'').toLowerCase()==='completed')return'completed';if(!t.dueDate)return'upcoming';const d=new Date(String(t.dueDate).slice(0,10)+'T00:00:00');const today=new Date();today.setHours(0,0,0,0);return d<today?'overdue':'upcoming';}
  function typeEmoji(type){return type==='Exam'?'🎓':type==='Test'?'🧪':'❓';}
  function renderAssessments(){
    const list=el('assessmentsList');if(!list)return;
    const all=assessmentTasks();populateFilter();const subject=el('assessmentSubjectFilter')?.value||'',type=el('assessmentTypeFilter')?.value||'',status=el('assessmentStatusFilter')?.value||'';
    const filtered=all.filter(t=>(!subject||t.subject===subject)&&(!type||t.type===type)&&(!status||state(t)===status)).sort((a,b)=>String(a.dueDate||'9999-12-31').localeCompare(String(b.dueDate||'9999-12-31')));
    el('assessmentUpcomingCount').textContent=all.filter(t=>state(t)==='upcoming').length;el('assessmentOverdueCount').textContent=all.filter(t=>state(t)==='overdue').length;el('assessmentCompletedCount').textContent=all.filter(t=>state(t)==='completed').length;
    list.innerHTML='';
    if(!filtered.length){list.innerHTML='<div class="empty-assessments">No assessments match your filters.</div>';return;}
    const subjects=plannerData?.settings?.subjects||[];
    filtered.forEach(t=>{const s=subjects.find(x=>x.name===t.subject),r=document.createElement('button');r.type='button';r.className='assessment-row '+state(t);if(s?.colour)r.style.setProperty('--assessment-color',s.colour);r.innerHTML='<span class="assessment-icon"></span><span class="assessment-main"><strong></strong><small></small></span><span class="assessment-meta"><span class="assessment-type"></span><span class="assessment-due"></span><span class="assessment-weight"></span></span>';r.querySelector('.assessment-icon').textContent=s?.emoji||typeEmoji(t.type);r.querySelector('strong').textContent=t.name||'Untitled assessment';r.querySelector('small').textContent=t.subject||'No subject';r.querySelector('.assessment-type').textContent=`${typeEmoji(t.type)} ${t.type||'Assessment'}`;r.querySelector('.assessment-due').textContent=t.dueDate?`Due ${t.dueDate}`:'No date';r.querySelector('.assessment-weight').textContent=t.weight!==''&&t.weight!=null?`${t.weight}%`:'';r.onclick=()=>{if(typeof openEditTaskModal==='function')openEditTaskModal(t.id);};list.appendChild(r);});
  }
  function openAssessmentModal(){ensureModal();populateSubjects();el('assessmentName').value='';el('assessmentDueDate').value='';el('assessmentType').value='Test';el('assessmentPriority').value='Normal';el('assessmentWeight').value='';el('assessmentNotes').value='';el('assessmentModalTitle').textContent='New Assessment';el('assessmentSave').textContent='Add Assessment';el('assessmentModal').classList.add('open');el('assessmentName').focus();}
  function closeAssessmentModal(){el('assessmentModal')?.classList.remove('open');}
  function createAssessment(){
    const name=el('assessmentName').value.trim(),subject=el('assessmentSubject').value,type=el('assessmentType').value,dueDate=el('assessmentDueDate').value;
    if(!name){alert('Please enter an assessment name.');return;}if(!subject){alert('Please choose a subject.');return;}if(!dueDate){alert('Please choose a date.');return;}
    plannerData.tasks.push({id:Date.now(),name,subject,type,priority:el('assessmentPriority').value||'Normal',dueDate,tags:['#School'],notes:el('assessmentNotes').value.trim(),weight:el('assessmentWeight').value||'',completed:false,status:'Not Started',createdAt:new Date().toISOString()});
    savePlannerData();closeAssessmentModal();renderAssessments();if(typeof renderTasks==='function')renderTasks();if(typeof renderCalendar==='function')renderCalendar();if(typeof renderAllTasks==='function')renderAllTasks();
  }
  function installNav(){
    const items=[...document.querySelectorAll('.nav-item')];const item=items.find(a=>a.textContent.includes('Tests & Exams'));if(!item)return;
    item.dataset.page='tests-exams';item.href='#tests-exams';item.onclick=()=>{showPage('tests-exams');return false;};
  }
  function installStyles(){
    if(el('testsExamsStyles'))return;const s=document.createElement('style');s.id='testsExamsStyles';s.textContent=`.assessments-page-header{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;margin-bottom:24px}.assessment-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:0 0 24px}.assessment-stat{background:var(--card-bg,#fff);border:1px solid var(--border-color,#e6e1da);border-radius:18px;padding:20px 22px;box-shadow:0 2px 10px rgba(0,0,0,.025)}.assessment-stat span{display:block;font-size:28px;font-weight:700}.assessment-stat small{color:var(--muted-text,#777)}.assessments-card{padding:24px}.assessment-filters{display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap}.assessment-filters select{min-width:180px}.assessments-list{display:grid;gap:10px}.assessment-row{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:18px;align-items:center;width:100%;padding:18px 20px;border:1px solid var(--border-color,#e6e1da);border-left:4px solid var(--assessment-color,#7c3aed);border-radius:16px;background:var(--card-bg,#fff);font:inherit;color:inherit;text-align:left;cursor:pointer}.assessment-row:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.06)}.assessment-row.completed{opacity:.62}.assessment-row.overdue{border-left-color:#dc2626}.assessment-main{display:grid;gap:5px}.assessment-main small{color:var(--muted-text,#777)}.assessment-meta{display:flex;align-items:center;gap:14px;color:var(--muted-text,#777);font-size:14px}.assessment-weight{padding:5px 9px;border-radius:8px;background:rgba(0,0,0,.035)}.percentage-input{display:flex;align-items:center;position:relative}.percentage-input input{padding-right:30px;width:100%}.percentage-input span{position:absolute;right:12px;color:var(--muted-text,#777);pointer-events:none}.empty-assessments{text-align:center;padding:40px;color:var(--muted-text,#777)}@media(max-width:700px){.assessment-summary{grid-template-columns:1fr}.assessments-page-header{flex-direction:column}.assessment-filters select{width:100%}.assessment-row{grid-template-columns:38px minmax(0,1fr)}.assessment-meta{grid-column:2;flex-wrap:wrap;gap:8px}}`;
    document.head.appendChild(s);
  }
  window.renderAssessments=renderAssessments;window.openAssessmentModal=openAssessmentModal;window.closeAssessmentModal=closeAssessmentModal;window.createAssessment=createAssessment;
  function install(){ensurePage();ensureModal();installNav();installStyles();if(window.location.hash.toLowerCase()==='#tests-exams'&&typeof showPage==='function')showPage('tests-exams',false);}
  install();document.addEventListener('DOMContentLoaded',install);window.addEventListener('load',install);setInterval(install,500);
})();
