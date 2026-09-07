// ========================================
// GRADE INTERACTIONS
// Makes grades and grade subjects clickable across the planner.
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
  function openGrade(grade){
    ensureModal();
    const body=el('gradeDetailBody');
    const linked=grade.taskId!=null?(plannerData.tasks||[]).find(t=>String(t.id)===String(grade.taskId)):null;
    const marks=(grade.categories||[]).map(c=>`<div class="grade-detail-mark"><strong>${escapeHtml(c.category)}</strong><span>${escapeHtml(c.display||'—')}</span>${c.percent!=null?`<small>${Number(c.percent).toFixed(1)}%</small>`:''}</div>`).join('');
    el('gradeDetailTitle').textContent=grade.name||'Grade';
    el('gradeDetailSubtitle').textContent=`${grade.subject||'No subject'} · ${grade.type||'Grade'} · ${grade.portion==='culminating'?'Culminating':'Coursework'}`;
    body.innerHTML=`<div class="grade-detail-summary"><div><small>Result</small><strong>${formatResult(grade)}</strong></div><div><small>Weight</small><strong>${grade.weight!=null&&grade.weight!==''?escapeHtml(grade.weight)+'%':'Not set'}</strong></div><div><small>Recorded</small><strong>${formatDate(grade.createdAt)}</strong></div></div><div class="grade-detail-section"><h3>Marks</h3><div class="grade-detail-marks">${marks||'<div class="subject-detail-empty">No mark details recorded.</div>'}</div></div>${linked?`<div class="grade-detail-section"><h3>Linked schoolwork</h3><button type="button" class="grade-detail-link" id="gradeDetailTask">${escapeHtml(linked.name||'Untitled task')}</button></div>`:''}${grade.notes?`<div class="grade-detail-section"><h3>Notes</h3><p>${escapeHtml(grade.notes)}</p></div>`:''}`;
    const taskButton=el('gradeDetailTask');
    if(taskButton&&linked)taskButton.onclick=()=>{close();if(typeof openEditTaskModal==='function')openEditTaskModal(linked.id);};
    el('gradeDetailModal').classList.add('open');
  }
  function formatResult(g){
    const cats=Array.isArray(g.categories)?g.categories:[];
    if(cats.length===1&&cats[0].category==='Overall')return cats[0].display||'—';
    if(!cats.length)return '—';
    const vals=cats.map(x=>Number(x.percent)).filter(Number.isFinite);
    return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)+'%':'Breakdown';
  }
  function formatDate(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});}
  function escapeHtml(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
  function findGradeForRow(row){
    const section=row.closest('.grade-subject');
    const subject=subjectNameFromSection(section);
    const rows=[...section.querySelectorAll('.grade-entry')];
    const index=rows.indexOf(row);
    if(index<0)return null;
    const matching=grades().filter(g=>String(g.subject||'').toLowerCase()===subject.toLowerCase()).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    return matching[index]||null;
  }
  function install(){
    ensureModal();
    document.querySelectorAll('.grade-subject').forEach(section=>{
      const title=section.querySelector('.grade-subject-title');
      if(title&&!title.dataset.gradeSubjectBound){
        title.dataset.gradeSubjectBound='1';
        title.setAttribute('role','button');title.tabIndex=0;title.classList.add('clickable-grade-subject');
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
      row.dataset.gradeBound='1';row.classList.add('clickable-grade-entry');row.tabIndex=0;
      const open=()=>openGrade(grade);
      row.addEventListener('click',open);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }
  const style=document.createElement('style');style.textContent=`.clickable-grade-subject,.clickable-grade-entry{cursor:pointer}.clickable-grade-subject{border-radius:12px;padding:5px 8px;margin:-5px -8px;transition:background .15s}.clickable-grade-subject:hover{background:var(--hover-bg,#f4f1ed)}.clickable-grade-entry{transition:background .15s,transform .15s;border-radius:10px}.clickable-grade-entry:hover{background:var(--hover-bg,#f7f4ef);padding-left:10px;padding-right:10px}.grade-detail-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}.grade-detail-summary>div,.grade-detail-mark{border:1px solid var(--border-color,#e6e1da);border-radius:12px;padding:13px}.grade-detail-summary small,.grade-detail-summary strong{display:block}.grade-detail-summary small{color:var(--muted-text,#777)}.grade-detail-summary strong{margin-top:4px}.grade-detail-section{margin-top:20px}.grade-detail-section h3{margin:0 0 10px}.grade-detail-marks{display:grid;gap:8px}.grade-detail-mark{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center}.grade-detail-mark small{color:var(--muted-text,#777)}.grade-detail-link{border:0;background:none;padding:0;color:inherit;font:inherit;font-weight:600;text-decoration:underline;cursor:pointer}@media(max-width:700px){.grade-detail-summary{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
  const observer=new MutationObserver(install);
  function start(){install();const root=document.querySelector('.main')||document.body;observer.observe(root,{childList:true,subtree:true});document.addEventListener('planner-data-changed',()=>setTimeout(install,0));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
