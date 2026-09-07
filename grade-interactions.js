// ========================================
// GRADE INTERACTIONS
// ========================================
(function(){
  function data(){return window.plannerData||{};}
  function grades(){return Array.isArray(data().gradeAssessments)?data().gradeAssessments:[];}
  function gradeForTask(id){return grades().find(g=>String(g.taskId||'')===String(id))||null;}

  function syncGradeButtons(){
    document.querySelectorAll('.record-grade-button').forEach(button=>{
      const row=button.closest('.assignment-row,.assessment-row');
      const id=row?.dataset?.taskId;
      if(id!=null)button.textContent=gradeForTask(id)?'Edit Grade':'Record Grade';
    });
  }

  function showGradeDetails(g){
    if(!g)return;
    let modal=document.querySelector('#gradeDetailsModal');
    if(!modal){modal=document.createElement('div');modal.id='gradeDetailsModal';modal.className='modal-overlay';document.body.appendChild(modal);}
    const marks=(g.categories||[]).map(x=>`<div class="grade-detail-mark"><strong>${x.category||'Overall'}</strong><span>${x.display||((x.percent??'')+'%')}</span></div>`).join('');
    modal.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><div><h2>${g.name||'Grade'}</h2><p>${g.subject||''} • ${g.type||'Assessment'}</p></div><button class="close-button" type="button">×</button></div><div class="grade-detail-summary"><strong>${(g.categories||[]).length?((g.categories||[]).reduce((a,x)=>a+Number(x.percent||0),0)/(g.categories||[]).length).toFixed(1)+'%':'—'}</strong><span>${g.portion==='culminating'?'Culminating — 30%':'Coursework — 70%'}</span></div><div class="grade-detail-marks">${marks||'<p>No marks recorded.</p>'}</div><div class="grade-detail-meta"><span>Weight: ${g.weight==null||g.weight===''?'Not set':g.weight+'%'}</span><span>Recorded: ${g.createdAt?new Date(g.createdAt).toLocaleDateString():''}</span></div><div class="modal-actions"><button class="cancel-button" type="button">Close</button><button class="save-button" type="button">Edit Grade</button></div></div>`;
    modal.classList.add('open');
    const close=()=>modal.classList.remove('open');
    modal.querySelector('.close-button').onclick=close;
    modal.querySelector('.cancel-button').onclick=close;
    modal.onclick=e=>{if(e.target===modal)close();};
    modal.querySelector('.save-button').onclick=()=>{close();openGradeEditModal(g);};
  }

  function openGradeEditModal(g){
    let modal=document.querySelector('#gradeEditModal');
    if(!modal){modal=document.createElement('div');modal.id='gradeEditModal';modal.className='modal-overlay';document.body.appendChild(modal);}
    const cats=['Knowledge','Communication','Thinking','Application'];
    modal.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><h2>Edit Grade</h2><button class="close-button" type="button">×</button></div><div class="form-group"><label>Name</label><input id="editGradeName"></div><div class="form-row"><div class="form-group"><label>Subject</label><select id="editGradeSubject"></select></div><div class="form-group"><label>Type</label><select id="editGradeType"><option>Assignment</option><option>Quiz</option><option>Test</option><option>Lab</option><option>Exam</option><option>Other</option></select></div></div><div class="form-row"><div class="form-group"><label>Portion</label><select id="editGradePortion"><option value="coursework">Coursework — 70%</option><option value="culminating">Culminating — 30%</option></select></div><div class="form-group"><label>Weight</label><input id="editGradeWeight" type="number" min="0" max="100" step="0.1"></div></div><div class="form-group"><label>Notes</label><input id="editGradeNotes"></div><div class="grade-edit-categories">${cats.map(c=>`<div class="form-row"><label>${c}</label><input data-edit-category="${c}" placeholder="17/20 or 3+"></div>`).join('')}</div><div class="modal-actions"><button class="cancel-button" type="button">Cancel</button><button class="save-button" type="button">Save Changes</button></div></div>`;
    modal.querySelector('#editGradeName').value=g.name||'';
    const subjectSelect=modal.querySelector('#editGradeSubject');
    (data().settings?.subjects||[]).filter(s=>s&&s.active!==false).forEach(s=>{const o=document.createElement('option');o.value=s.name;o.textContent=`${s.emoji||'📚'} ${s.name}`;subjectSelect.appendChild(o);});
    subjectSelect.value=g.subject||'';
    modal.querySelector('#editGradeType').value=g.type||'Assignment';
    modal.querySelector('#editGradePortion').value=g.portion||'coursework';
    modal.querySelector('#editGradeWeight').value=g.weight??'';
    modal.querySelector('#editGradeNotes').value=g.notes||'';
    cats.forEach(c=>{const mark=(g.categories||[]).find(x=>x.category===c);modal.querySelector(`[data-edit-category="${c}"]`).value=mark?.display||'';});
    const close=()=>modal.classList.remove('open');
    modal.querySelector('.close-button').onclick=close;
    modal.querySelector('.cancel-button').onclick=close;
    modal.querySelector('.save-button').onclick=()=>{
      g.name=modal.querySelector('#editGradeName').value.trim();
      g.subject=subjectSelect.value;
      g.type=modal.querySelector('#editGradeType').value;
      g.portion=modal.querySelector('#editGradePortion').value;
      g.weight=modal.querySelector('#editGradeWeight').value===''?null:Number(modal.querySelector('#editGradeWeight').value);
      g.notes=modal.querySelector('#editGradeNotes').value.trim();
      savePlannerData();
      close();
      if(typeof renderGrades==='function')renderGrades();
      syncGradeButtons();
    };
    modal.classList.add('open');
  }

  window.openGradeDetails=showGradeDetails;
  window.openGradeEditModal=openGradeEditModal;
  window.syncGradeButtons=syncGradeButtons;

  document.addEventListener('planner-data-changed',syncGradeButtons);

  // Use one normal delegated click handler. No capture phase and no polling.
  document.addEventListener('click',function(e){
    const target=e.target?.closest?.('.record-grade-button');
    if(target && (target.closest('#assignmentsList')||target.closest('#assessmentsList'))){
      const row=target.closest('.assignment-row,.assessment-row');
      const id=row?.dataset?.taskId;
      const existing=gradeForTask(id);
      if(existing){
        e.preventDefault();
        e.stopPropagation();
        showGradeDetails(existing);
      }
      return;
    }

    const gradeRow=e.target?.closest?.('#gradesPage .grade-entry');
    if(gradeRow){
      e.preventDefault();
      const subject=gradeRow.closest('.grade-subject')?.querySelector('.grade-subject-title h2')?.textContent?.trim()||'';
      const name=gradeRow.querySelector('strong')?.textContent?.trim()||'';
      const g=grades().find(x=>x.subject===subject&&String(x.name||'').trim()===name);
      if(g)showGradeDetails(g);
      return;
    }

    const subjectRow=e.target?.closest?.('#subjectDetailGrades .subject-grade-row');
    if(subjectRow){
      e.preventDefault();
      const subject=document.querySelector('#subjectDetailPage')?.dataset?.subject||'';
      const name=subjectRow.querySelector('strong')?.textContent?.trim()||'';
      const g=grades().find(x=>x.subject===subject&&String(x.name||'').trim()===name);
      if(g)showGradeDetails(g);
    }
  });
})();
