// ========================================
// GRADE INTERACTIONS
// Makes grades and grade subjects clickable across the planner.
// Also keeps assignment grade buttons in sync and provides grade editing.
// ========================================
(function(){
  function el(id){return document.getElementById(id);}
  function grades(){return Array.isArray(window.plannerData?.gradeAssessments)?window.plannerData.gradeAssessments:[];}
  function subjectNameFromSection(section){return section?.querySelector('.grade-subject-title h2')?.textContent?.trim()||'';}
  function ensureModal(){
    if(el('gradeDetailModal'))return;
    const wrap=document.createElement('div');
    wrap.className='modal-overlay';
    wrap.id='gradeDetailModal';
    wrap.innerHTML=`<div class="modal wide-modal grade-detail-modal"><div class="modal-header"><div><h2 id="gradeDetailTitle">Grade</h2><p id="gradeDetailSubtitle"></p></div><button class="close-button" type="button" id="gradeDetailClose">×</button></div><div id="gradeDetailBody"></div><div class="modal-actions"><button class="cancel-button" type="button" id="gradeDetailCloseButton">Close</button></div></div>`;
    document.body.appendChild(wrap);
    el('gradeDetailClose').onclick=close;
    el('gradeDetailCloseButton').onclick=close;
    wrap.addEventListener('click',e=>{if(e.target===wrap)close();});
  }
  function close(){el('gradeDetailModal')?.classList.remove('open');}
  function escapeHtml(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
  function formatDate(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});}
  function formatResult(g){
    const cats=Array.isArray(g.categories)?g.categories:[];
    if(cats.length===1&&cats[0].category==='Overall')return cats[0].display||'—';
    if(!cats.length)return '—';
    const vals=cats.map(x=>Number(x.percent)).filter(Number.isFinite);
    return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)+'%':'Breakdown';
  }
  function openGrade(grade){
    ensureModal();
    const body=el('gradeDetailBody');
    const linked=grade.taskId!=null?(plannerData.tasks||[]).find(t=>String(t.id)===String(grade.taskId)):null;
    const marks=(grade.categories||[]).map(c=>`<div class="grade-detail-mark"><strong>${escapeHtml(c.category)}</strong><span>${escapeHtml(c.display||'—')}</span>${c.percent!=null?`<small>${Number(c.percent).toFixed(1)}%</small>`:''}</div>`).join('');
    el('gradeDetailTitle').textContent=grade.name||'Grade';
    el('gradeDetailSubtitle').textContent=`${grade.subject||'No subject'} · ${grade.type||'Grade'} · ${grade.portion==='culminating'?'Culminating':'Coursework'}`;
    body.innerHTML=`<div class="grade-detail-summary"><div><small>Result</small><strong>${formatResult(grade)}</strong></div><div><small>Weight</small><strong>${grade.weight!=null&&grade.weight!==''?escapeHtml(grade.weight)+'%':'Not set'}</strong></div><div><small>Recorded</small><strong>${formatDate(grade.createdAt)}</strong></div></div><div class="grade-detail-section"><h3>Marks</h3><div class="grade-detail-marks">${marks||'<div class="subject-detail-empty">No mark details recorded.</div>'}</div></div>${linked?`<div class="grade-detail-section"><h3>Linked schoolwork</h3><button type="button" class="grade-detail-link" id="gradeDetailTask">${escapeHtml(linked.name||'Untitled task')}</button></div>`:''}${grade.notes?`<div class="grade-detail-section"><h3>Notes</h3><p>${escapeHtml(grade.notes)}</p></div>`:''}<div class="modal-actions grade-detail-actions"><button type="button" class="cancel-button" id="gradeDetailEdit">Edit Grade</button></div>`;
    const taskButton=el('gradeDetailTask');
    if(taskButton&&linked)taskButton.onclick=()=>{close();if(typeof openEditTaskModal==='function')openEditTaskModal(linked.id);};
    el('gradeDetailEdit').onclick=()=>{close();openGradeEditor(grade);};
    el('gradeDetailModal').classList.add('open');
  }
  function parsePoints(v){const m=String(v||'').trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);if(!m)return null;const earned=Number(m[1]),possible=Number(m[2]);if(possible<=0)return null;return{display:`${earned}/${possible}`,percent:Math.max(0,Math.min(100,earned/possible*100)),kind:'points',earned,possible};}
  const LEVEL_PERCENT={'1-':40,'1':45,'1+':50,'2-':55,'2':60,'2+':65,'3-':70,'3':75,'3+':80,'4-':85,'4':90,'4+':95,'4++':100};
  function parseLevel(v){const x=String(v||'').trim();return LEVEL_PERCENT[x]!=null?{display:x,percent:LEVEL_PERCENT[x],kind:'level'}:null;}
  function openGradeEditor(grade){
    const id='gradeEditModal';
    if(el(id))el(id).remove();
    const wrap=document.createElement('div');wrap.className='modal-overlay';wrap.id=id;
    const cats=Array.isArray(grade.categories)?grade.categories:[];
    const markFields=cats.map((c,i)=>{const level=c.kind==='level';return `<div class="form-group"><label>${escapeHtml(c.category)}</label><input id="gradeEditMark${i}" data-kind="${level?'level':'points'}" value="${escapeHtml(c.display||'')}" placeholder="${level?'e.g. 3+':'e.g. 17/20'}"><small class="field-hint">${level?'Level: 1-, 1, 1+, 2-, 2, 2+, 3-, 3, 3+, 4-, 4, 4+, 4++':'Points: earned/possible'}</small></div>`;}).join('');
    wrap.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><div><h2>Edit Grade</h2><p>${escapeHtml(grade.name||'')}</p></div><button class="close-button" type="button" id="gradeEditClose">×</button></div><div class="form-row"><div class="form-group"><label>Name</label><input id="gradeEditName" value="${escapeHtml(grade.name||'')}"></div><div class="form-group"><label>Subject</label><input id="gradeEditSubject" value="${escapeHtml(grade.subject||'')}"></div></div><div class="form-row"><div class="form-group"><label>Type</label><input id="gradeEditType" value="${escapeHtml(grade.type||'')}"></div><div class="form-group"><label>Weight within portion</label><input id="gradeEditWeight" type="number" min="0" max="100" step="0.1" value="${grade.weight??''}"></div></div><div class="form-group"><label>Portion</label><select id="gradeEditPortion"><option value="coursework">Coursework — 70%</option><option value="culminating">Culminating — 30%</option></select></div>${markFields||'<p>No mark fields found.</p>'}<div class="form-group"><label>Notes</label><textarea id="gradeEditNotes" rows="3">${escapeHtml(grade.notes||'')}</textarea></div><div class="modal-actions"><button class="cancel-button" type="button" id="gradeEditCancel">Cancel</button><button class="save-button" type="button" id="gradeEditSave">Save Grade</button></div></div>`;
    document.body.appendChild(wrap);
    el('gradeEditPortion').value=grade.portion||'coursework';
    const closeEdit=()=>wrap.remove();
    el('gradeEditClose').onclick=closeEdit;el('gradeEditCancel').onclick=closeEdit;wrap.addEventListener('click',e=>{if(e.target===wrap)closeEdit();});
    el('gradeEditSave').onclick=()=>{
      const name=el('gradeEditName').value.trim(),weightRaw=el('gradeEditWeight').value.trim();
      if(!name)return alert('Please enter a grade name.');
      const weight=weightRaw===''?null:Number(weightRaw);if(weight!==null&&(!Number.isFinite(weight)||weight<0||weight>100))return alert('Weight must be between 0 and 100.');
      const updated=[];
      for(let i=0;i<cats.length;i++){const input=el('gradeEditMark'+i),raw=input.value.trim();if(!raw)return alert(`Please enter a mark for ${cats[i].category}.`);const parsed=input.dataset.kind==='level'?parseLevel(raw):parsePoints(raw);if(!parsed)return alert(`Please enter a valid mark for ${cats[i].category}.`);updated.push({category:cats[i].category,...parsed});}
      grade.name=name;grade.subject=el('gradeEditSubject').value.trim();grade.type=el('gradeEditType').value.trim()||'Other';grade.weight=weight;grade.portion=el('gradeEditPortion').value;grade.notes=el('gradeEditNotes').value.trim();grade.categories=updated;grade.updatedAt=new Date().toISOString();
      if(typeof savePlannerData==='function')savePlannerData();
      closeEdit();
      if(typeof window.renderGrades==='function')window.renderGrades();
      if(typeof window.renderAssignments==='function')window.renderAssignments();
      document.dispatchEvent(new Event('planner-data-changed'));
      setTimeout(()=>install(),0);
    };
  }
  function findGradeForRow(row){
    const section=row.closest('.grade-subject');
    const subject=subjectNameFromSection(section);
    const candidates=grades().filter(g=>String(g.subject||'').toLowerCase()===subject.toLowerCase());
    const text=(row.textContent||'').trim().toLowerCase();
    // Prefer an exact name match rather than relying on DOM order.
    const exact=candidates.find(g=>g.name&&text.includes(String(g.name).trim().toLowerCase()));
    if(exact)return exact;
    const rows=[...section.querySelectorAll('.grade-entry')];
    const index=rows.indexOf(row);
    return candidates.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[index]||null;
  }
  function install(){
    ensureModal();
    document.querySelectorAll('.grade-subject').forEach(section=>{
      const title=section.querySelector('.grade-subject-title');
      if(title&&!title.dataset.gradeSubjectBound){
        title.dataset.gradeSubjectBound='1';title.setAttribute('role','button');title.tabIndex=0;title.classList.add('clickable-grade-subject');
        const open=()=>{const name=subjectNameFromSection(section);if(name&&typeof window.openSubjectPage==='function')window.openSubjectPage(name);};
        title.addEventListener('click',open);title.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
      }
      section.querySelectorAll('.grade-entry').forEach(row=>{
        if(row.dataset.gradeBound)return;
        row.dataset.gradeBound='1';row.classList.add('clickable-grade-entry');row.tabIndex=0;
        const open=()=>{const grade=findGradeForRow(row);if(grade)openGrade(grade);};
        row.addEventListener('click',open);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
      });
    });
    document.querySelectorAll('#subjectDetailGrades .subject-grade-row').forEach((row,index)=>{
      if(row.dataset.gradeBound)return;
      const subject=el('subjectDetailPage')?.dataset.subject||'';
      const matching=grades().filter(g=>String(g.subject||'').toLowerCase()===subject.toLowerCase()).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
      const grade=matching[index];
      if(!grade)return;
      row.dataset.gradeBound='1';row.classList.add('clickable-grade-entry');row.tabIndex=0;const open=()=>openGrade(grade);row.addEventListener('click',open);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
    document.querySelectorAll('#assignmentsList .assignment-row').forEach(row=>{
      const taskId=row.dataset.taskId;if(!taskId)return;
      const button=row.querySelector('.record-grade-button');if(!button)return;
      const existing=grades().find(g=>g.taskId!=null&&String(g.taskId)===String(taskId));
      button.textContent=existing?'Edit Grade':'Record Grade';
      button.dataset.gradeBound='1';
      if(existing&&!button.dataset.editBound){
        button.dataset.editBound='1';
        button.onclick=e=>{e.stopPropagation();openGradeEditor(existing);};
      }
    });
  }
  const style=document.createElement('style');style.textContent=`.clickable-grade-subject,.clickable-grade-entry{cursor:pointer}.clickable-grade-subject{border-radius:12px;padding:5px 8px;margin:-5px -8px;transition:background .15s}.clickable-grade-subject:hover{background:var(--hover-bg,#f4f1ed)}.clickable-grade-entry{transition:background .15s,transform .15s;border-radius:10px}.clickable-grade-entry:hover{background:var(--hover-bg,#f7f4ef);padding-left:10px;padding-right:10px}.grade-detail-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}.grade-detail-summary>div,.grade-detail-mark{border:1px solid var(--border-color,#e6e1da);border-radius:12px;padding:13px}.grade-detail-summary small,.grade-detail-summary strong{display:block}.grade-detail-summary small{color:var(--muted-text,#777)}.grade-detail-summary strong{margin-top:4px}.grade-detail-section{margin-top:20px}.grade-detail-section h3{margin:0 0 10px}.grade-detail-marks{display:grid;gap:8px}.grade-detail-mark{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center}.grade-detail-mark small{color:var(--muted-text,#777)}.grade-detail-link{border:0;background:none;padding:0;color:inherit;font:inherit;font-weight:600;text-decoration:underline;cursor:pointer}.grade-detail-actions{justify-content:flex-end!important;margin-top:22px}.grade-detail-actions .cancel-button{margin-left:auto}@media(max-width:700px){.grade-detail-summary{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
  const observer=new MutationObserver(install);
  function start(){install();const root=document.querySelector('.main')||document.body;observer.observe(root,{childList:true,subtree:true});document.addEventListener('planner-data-changed',()=>setTimeout(install,0));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();