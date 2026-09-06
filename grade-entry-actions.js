// ========================================
// GRADE ENTRY ACTIONS
// ========================================
(function(){
  function el(id){return document.getElementById(id);}
  function grades(){return Array.isArray(window.plannerData?.gradeAssessments)?window.plannerData.gradeAssessments:[];}
  function save(){if(typeof window.savePlannerData==='function')window.savePlannerData();}
  function taskFor(g){return (plannerData.tasks||[]).find(t=>String(t.id)===String(g.taskId));}
  function renderActions(){
    document.querySelectorAll('#gradeSubjects .grade-entry').forEach(row=>{
      if(row.querySelector('.grade-entry-actions'))return;
      const entries=grades();
      const subject=row.closest('.grade-subject');
      const name=row.querySelector('strong')?.textContent||'';
      const linkedText=row.querySelector('small')?.textContent||'';
      const g=entries.find(x=>x.name===name&&linkedText.includes(x.type||'Grade'));
      if(!g)return;
      const actions=document.createElement('div');
      actions.className='grade-entry-actions';
      actions.innerHTML='<button type="button" class="grade-edit-button">Edit</button><button type="button" class="grade-delete-button">Delete</button>';
      actions.querySelector('.grade-edit-button').onclick=e=>{e.stopPropagation();openEdit(g.id);};
      actions.querySelector('.grade-delete-button').onclick=e=>{e.stopPropagation();deleteGrade(g.id);};
      row.appendChild(actions);
    });
  }
  function ensureModal(){
    if(el('gradeEditModal'))return;
    const w=document.createElement('div');
    w.className='modal-overlay';w.id='gradeEditModal';
    w.innerHTML='<div class="modal"><div class="modal-header"><h2>Edit Grade</h2><button type="button" class="close-button" id="gradeEditClose">×</button></div><div class="form-group"><label for="gradeEditName">Name</label><input id="gradeEditName"></div><div class="form-row"><div class="form-group"><label for="gradeEditType">Type</label><select id="gradeEditType"><option>Assignment</option><option>Quiz</option><option>Test</option><option>Lab</option><option>Exam</option><option>Other</option></select></div><div class="form-group"><label for="gradeEditPortion">Portion</label><select id="gradeEditPortion"><option value="coursework">Coursework — 70%</option><option value="culminating">Culminating — 30%</option></select></div></div><div class="form-group"><label for="gradeEditWeight">Weight within portion</label><div class="percentage-input"><input id="gradeEditWeight" type="number" min="0" max="100" step="0.1"><span>%</span></div></div><div class="form-group"><label for="gradeEditNotes">Notes</label><textarea id="gradeEditNotes" rows="3"></textarea></div><p class="field-hint">The recorded mark itself is preserved here. Use Delete + Add Grade if the mark needs to be replaced.</p><div class="modal-actions"><button type="button" class="cancel-button" id="gradeEditCancel">Cancel</button><button type="button" class="save-button" id="gradeEditSave">Save Changes</button></div></div>';
    document.body.appendChild(w);
    el('gradeEditClose').onclick=closeEdit;el('gradeEditCancel').onclick=closeEdit;el('gradeEditSave').onclick=saveEdit;
    w.addEventListener('click',e=>{if(e.target===w)closeEdit();});
  }
  function openEdit(id){
    const g=grades().find(x=>String(x.id)===String(id));if(!g)return;
    ensureModal();
    el('gradeEditModal').dataset.id=String(id);
    el('gradeEditName').value=g.name||'';
    el('gradeEditType').value=g.type||'Other';
    el('gradeEditPortion').value=g.portion||'coursework';
    el('gradeEditWeight').value=g.weight==null?'':g.weight;
    el('gradeEditNotes').value=g.notes||'';
    el('gradeEditModal').classList.add('open');el('gradeEditName').focus();
  }
  function closeEdit(){el('gradeEditModal')?.classList.remove('open');}
  function saveEdit(){
    const id=el('gradeEditModal')?.dataset.id,g=grades().find(x=>String(x.id)===String(id));if(!g)return;
    const name=el('gradeEditName').value.trim(),weight=el('gradeEditWeight').value===''?null:Number(el('gradeEditWeight').value);
    if(!name)return alert('Please enter a grade name.');
    if(weight!==null&&(!Number.isFinite(weight)||weight<0||weight>100))return alert('Weight must be between 0 and 100.');
    g.name=name;g.type=el('gradeEditType').value;g.portion=el('gradeEditPortion').value;g.weight=weight;g.notes=el('gradeEditNotes').value.trim();
    save();closeEdit();if(typeof window.renderGrades==='function')window.renderGrades();setTimeout(renderActions,0);
  }
  function deleteGrade(id){
    const index=grades().findIndex(x=>String(x.id)===String(id));if(index<0)return;
    const g=grades()[index];
    if(!confirm(`Delete the grade “${g.name||'Untitled'}”? This cannot be undone.`))return;
    grades().splice(index,1);save();if(typeof window.renderGrades==='function')window.renderGrades();setTimeout(renderActions,0);
  }
  function install(){ensureModal();renderActions();}
  const observer=new MutationObserver(()=>renderActions());
  document.addEventListener('DOMContentLoaded',install);window.addEventListener('load',install);setTimeout(()=>{const target=el('gradeSubjects');if(target)observer.observe(target,{childList:true,subtree:true});install();},500);
  window.openGradeEdit=openEdit;window.deleteGrade=deleteGrade;
})();
