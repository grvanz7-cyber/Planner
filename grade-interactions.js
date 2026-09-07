// ========================================
// GRADE INTERACTIONS
// Safe delegated interactions for grades and assignments.
// ========================================
(function(){
  function el(id){return document.getElementById(id);}
  function grades(){return Array.isArray(window.plannerData?.gradeAssessments)?window.plannerData.gradeAssessments:[];}
  function escapeHtml(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
  function closeModal(id){el(id)?.classList.remove('open');}
  function formatDate(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});}
  function result(g){const c=Array.isArray(g.categories)?g.categories:[];if(c.length===1&&c[0].category==='Overall')return c[0].display||'—';const p=c.map(x=>Number(x.percent)).filter(Number.isFinite);return p.length?(p.reduce((a,b)=>a+b,0)/p.length).toFixed(1)+'%':'Breakdown';}
  function ensureDetailModal(){
    if(el('gradeDetailModal'))return;
    const w=document.createElement('div');w.className='modal-overlay';w.id='gradeDetailModal';
    w.innerHTML='<div class="modal wide-modal"><div class="modal-header"><div><h2 id="gradeDetailTitle">Grade</h2><p id="gradeDetailSubtitle"></p></div><button class="close-button" id="gradeDetailClose">×</button></div><div id="gradeDetailBody"></div><div class="modal-actions"><button class="cancel-button" id="gradeDetailCloseButton">Close</button></div></div>';
    document.body.appendChild(w);el('gradeDetailClose').onclick=()=>closeModal('gradeDetailModal');el('gradeDetailCloseButton').onclick=()=>closeModal('gradeDetailModal');w.onclick=e=>{if(e.target===w)closeModal('gradeDetailModal');};
  }
  function openGradeDetails(g){
    if(!g)return;ensureDetailModal();
    const linked=g.taskId!=null?(plannerData.tasks||[]).find(t=>String(t.id)===String(g.taskId)):null;
    el('gradeDetailTitle').textContent=g.name||'Grade';
    el('gradeDetailSubtitle').textContent=`${g.subject||'No subject'} · ${g.type||'Grade'} · ${g.portion==='culminating'?'Culminating':'Coursework'}`;
    const marks=(g.categories||[]).map(c=>`<div class="grade-detail-mark"><strong>${escapeHtml(c.category)}</strong><span>${escapeHtml(c.display||'—')}</span><small>${c.percent!=null?Number(c.percent).toFixed(1)+'%':''}</small></div>`).join('');
    el('gradeDetailBody').innerHTML=`<div class="grade-detail-summary"><div><small>Result</small><strong>${result(g)}</strong></div><div><small>Weight</small><strong>${g.weight!=null&&g.weight!==''?escapeHtml(g.weight)+'%':'Not set'}</strong></div><div><small>Recorded</small><strong>${formatDate(g.createdAt)}</strong></div></div><div class="grade-detail-section"><h3>Marks</h3><div class="grade-detail-marks">${marks||'No mark details recorded.'}</div></div>${linked?`<div class="grade-detail-section"><h3>Linked schoolwork</h3><button type="button" class="grade-detail-link" id="gradeDetailTask">${escapeHtml(linked.name||'Untitled task')}</button></div>`:''}${g.notes?`<div class="grade-detail-section"><h3>Notes</h3><p>${escapeHtml(g.notes)}</p></div>`:''}<div class="modal-actions grade-detail-actions"><button type="button" class="cancel-button" id="gradeDetailEdit">Edit Grade</button></div>`;
    if(linked)el('gradeDetailTask').onclick=()=>{closeModal('gradeDetailModal');if(typeof openEditTaskModal==='function')openEditTaskModal(linked.id);};
    el('gradeDetailEdit').onclick=()=>{closeModal('gradeDetailModal');openGradeEditor(g);};
    el('gradeDetailModal').classList.add('open');
  }
  const LEVEL_PERCENT={'1-':40,'1':45,'1+':50,'2-':55,'2':60,'2+':65,'3-':70,'3':75,'3+':80,'4-':85,'4':90,'4+':95,'4++':100};
  function parseMark(v,kind){
    const raw=String(v||'').trim();
    if(kind==='level')return LEVEL_PERCENT[raw]!=null?{display:raw,percent:LEVEL_PERCENT[raw],kind:'level'}:null;
    const m=raw.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);if(!m||Number(m[2])<=0)return null;
    return{display:`${Number(m[1])}/${Number(m[2])}`,percent:Math.max(0,Math.min(100,Number(m[1])/Number(m[2])*100)),kind:'points',earned:Number(m[1]),possible:Number(m[2])};
  }
  function openGradeEditor(g){
    const old=el('gradeEditModal');if(old)old.remove();
    const w=document.createElement('div');w.className='modal-overlay';w.id='gradeEditModal';
    const cats=Array.isArray(g.categories)?g.categories:[];
    w.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><div><h2>Edit Grade</h2><p>${escapeHtml(g.name||'')}</p></div><button class="close-button" id="gradeEditClose">×</button></div><div class="form-row"><div class="form-group"><label>Name</label><input id="gradeEditName" value="${escapeHtml(g.name||'')}"></div><div class="form-group"><label>Subject</label><input id="gradeEditSubject" value="${escapeHtml(g.subject||'')}"></div></div><div class="form-row"><div class="form-group"><label>Type</label><input id="gradeEditType" value="${escapeHtml(g.type||'')}"></div><div class="form-group"><label>Weight within portion</label><input id="gradeEditWeight" type="number" min="0" max="100" step="0.1" value="${g.weight??''}"></div></div><div class="form-group"><label>Portion</label><select id="gradeEditPortion"><option value="coursework">Coursework — 70%</option><option value="culminating">Culminating — 30%</option></select></div>${cats.map((c,i)=>`<div class="form-group"><label>${escapeHtml(c.category)}</label><input id="gradeEditMark${i}" data-kind="${c.kind==='level'?'level':'points'}" value="${escapeHtml(c.display||'')}"><small class="field-hint">${c.kind==='level'?'Level such as 3+':'Points such as 17/20'}</small></div>`).join('')}<div class="form-group"><label>Notes</label><textarea id="gradeEditNotes" rows="3">${escapeHtml(g.notes||'')}</textarea></div><div class="modal-actions"><button class="cancel-button" id="gradeEditCancel">Cancel</button><button class="save-button" id="gradeEditSave">Save Grade</button></div></div>`;
    document.body.appendChild(w);el('gradeEditPortion').value=g.portion||'coursework';
    const close=()=>w.remove();el('gradeEditClose').onclick=close;el('gradeEditCancel').onclick=close;w.onclick=e=>{if(e.target===w)close();};
    el('gradeEditSave').onclick=()=>{
      const name=el('gradeEditName').value.trim(),wr=el('gradeEditWeight').value.trim();if(!name)return alert('Please enter a grade name.');const weight=wr===''?null:Number(wr);if(weight!==null&&(!Number.isFinite(weight)||weight<0||weight>100))return alert('Weight must be between 0 and 100.');
      const updated=cats.map((c,i)=>{const input=el('gradeEditMark'+i);const parsed=parseMark(input.value,input.dataset.kind);if(!parsed)throw new Error(c.category);return{category:c.category,...parsed};});
      try{g.name=name;g.subject=el('gradeEditSubject').value.trim();g.type=el('gradeEditType').value.trim()||'Other';g.weight=weight;g.portion=el('gradeEditPortion').value;g.notes=el('gradeEditNotes').value.trim();g.categories=updated;g.updatedAt=new Date().toISOString();}catch(e){return alert(`Please enter a valid mark for ${e.message}.`);}
      if(typeof savePlannerData==='function')savePlannerData();close();if(typeof renderGrades==='function')renderGrades();if(typeof renderAssignments==='function')renderAssignments();document.dispatchEvent(new Event('planner-data-changed'));
    };
  }
  function gradeForRow(row){
    const section=row.closest('.grade-subject');const subject=section?.querySelector('.grade-subject-title h2')?.textContent.trim()||'';const name=row.querySelector('strong')?.textContent.trim()||'';
    return grades().find(g=>String(g.subject||'').toLowerCase()===subject.toLowerCase()&&String(g.name||'').trim()===name)||grades().find(g=>String(g.name||'').trim()===name)||null;
  }
  function gradeForSubjectRow(row){
    const subject=el('subjectDetailPage')?.dataset.subject||'';const name=row.querySelector('strong')?.textContent.trim()||'';
    return grades().find(g=>String(g.subject||'').toLowerCase()===subject.toLowerCase()&&String(g.name||'').trim()===name)||null;
  }
  function syncAssignmentButtons(){
    document.querySelectorAll('#assignmentsList .assignment-row').forEach(row=>{const id=row.dataset.taskId,button=row.querySelector('.record-grade-button');if(!id||!button)return;const g=grades().find(x=>x.taskId!=null&&String(x.taskId)===String(id));button.textContent=g?'Edit Grade':'Record Grade';button.classList.toggle('has-grade',!!g);});
  }
  function handleClick(e){
    const subject=e.target.closest('.grade-subject-title');if(subject){const section=subject.closest('.grade-subject');const name=section?.querySelector('h2')?.textContent.trim();if(name&&typeof openSubjectPage==='function')openSubjectPage(name);return;}
    const row=e.target.closest('.grade-entry');if(row){const g=gradeForRow(row);if(g)openGradeDetails(g);return;}
    const srow=e.target.closest('#subjectDetailGrades .subject-grade-row');if(srow){const g=gradeForSubjectRow(srow);if(g)openGradeDetails(g);return;}
    const button=e.target.closest('#assignmentsList .record-grade-button');if(button){e.stopPropagation();const row=button.closest('.assignment-row');const id=row?.dataset.taskId;const g=grades().find(x=>x.taskId!=null&&String(x.taskId)===String(id));if(g){openGradeEditor(g);}else if(typeof openGradeModal==='function'){openGradeModal();const sel=el('gradeTask');if(sel){sel.value=String(id);sel.dispatchEvent(new Event('change'));}}}
  }
  function init(){
    document.addEventListener('click',handleClick,true);syncAssignmentButtons();
    document.addEventListener('planner-data-changed',syncAssignmentButtons);
    if(typeof window.savePlannerData==='function'&&!window.__gradeSaveHooked){const original=window.savePlannerData;window.savePlannerData=function(){const r=original.apply(this,arguments);setTimeout(syncAssignmentButtons,0);return r;};window.__gradeSaveHooked=true;}
    const style=document.createElement('style');style.textContent='.clickable-grade-subject,.clickable-grade-entry{cursor:pointer}.clickable-grade-subject:hover,.clickable-grade-entry:hover{background:var(--hover-bg,#f7f4ef)}.grade-detail-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}.grade-detail-summary>div,.grade-detail-mark{border:1px solid var(--border-color,#e6e1da);border-radius:12px;padding:12px}.grade-detail-summary small,.grade-detail-summary strong{display:block}.grade-detail-marks{display:grid;gap:8px}.grade-detail-mark{display:grid;grid-template-columns:1fr auto auto;gap:10px}.grade-detail-link{border:0;background:none;text-decoration:underline;cursor:pointer;font:inherit}.grade-detail-actions{justify-content:flex-end}@media(max-width:700px){.grade-detail-summary{grid-template-columns:1fr}}';document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();