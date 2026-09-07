// ========================================
// STUDY SET BUTTON FIX
// Keeps the Study Set modal independent from load-order issues.
// ========================================
(function(){
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function subjects(){return (data().settings?.subjects||[]).filter(s=>s&&s.active!==false);}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function openModal(){
    let modal=document.getElementById('studySetModal');
    if(!modal){
      modal=document.createElement('div');
      modal.className='modal-overlay';
      modal.id='studySetModal';
      modal.innerHTML='<div class="modal wide-modal"><div class="modal-header"><h2>New Study Set</h2><button type="button" class="close-button" id="studyFixClose">×</button></div><div class="form-group"><label for="studyFixName">Name</label><input id="studyFixName" placeholder="e.g. Kinematics — Unit 1"></div><div class="form-row"><div class="form-group"><label for="studyFixSubject">Subject</label><select id="studyFixSubject"></select></div><div class="form-group"><label for="studyFixType">Set type</label><select id="studyFixType"><option value="flashcards">🗂️ Flashcards</option><option value="notes">📝 Study notes</option><option value="questions">❓ Question bank</option></select></div></div><div class="form-group"><label for="studyFixUnit">Unit / topic <span class="field-hint">optional</span></label><input id="studyFixUnit" placeholder="e.g. Unit 1 · Kinematics"></div><div class="form-group"><label for="studyFixDescription">Description <span class="field-hint">optional</span></label><textarea id="studyFixDescription" rows="3" placeholder="What is this set for?"></textarea></div><div class="modal-actions"><button type="button" class="cancel-button" id="studyFixCancel">Cancel</button><button type="button" class="save-button" id="studyFixSave">Create Study Set</button></div></div>';
      document.body.appendChild(modal);
      document.getElementById('studyFixClose').onclick=closeModal;
      document.getElementById('studyFixCancel').onclick=closeModal;
      document.getElementById('studyFixSave').onclick=createSet;
      modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
    }
    const subject=document.getElementById('studyFixSubject');
    subject.innerHTML='<option value="">Choose a subject</option>'+subjects().map(s=>`<option value="${esc(s.name)}">${esc(s.emoji||'📚')} ${esc(s.name)}</option>`).join('');
    document.getElementById('studyFixName').value='';
    document.getElementById('studyFixSubject').value='';
    document.getElementById('studyFixType').value='flashcards';
    document.getElementById('studyFixUnit').value='';
    document.getElementById('studyFixDescription').value='';
    modal.classList.add('open');
    document.getElementById('studyFixName').focus();
  }
  function closeModal(){document.getElementById('studySetModal')?.classList.remove('open');}
  function createSet(){
    const d=data();
    if(!Array.isArray(d.studySets))d.studySets=[];
    const name=document.getElementById('studyFixName').value.trim();
    const subject=document.getElementById('studyFixSubject').value;
    if(!name){alert('Please enter a study set name.');return;}
    if(!subject){alert('Please choose a subject.');return;}
    const now=new Date().toISOString();
    d.studySets.push({id:`S-${Date.now()}`,name,subject,type:document.getElementById('studyFixType').value,unit:document.getElementById('studyFixUnit').value.trim(),description:document.getElementById('studyFixDescription').value.trim(),items:[],createdAt:now,updatedAt:now});
    if(typeof savePlannerData==='function')savePlannerData();
    closeModal();
    if(typeof window.renderStudy==='function')window.renderStudy();
    if(typeof window.renderStudySessions==='function')window.renderStudySessions();
  }
  function wire(){
    const old=document.getElementById('studyAddButton');
    if(!old)return false;
    const button=old.cloneNode(true);
    old.replaceWith(button);
    button.addEventListener('click',openModal);
    window.openStudySetModal=openModal;
    return true;
  }
  function init(){wire();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);
  window.addEventListener('planner-data-changed',init);
})();
