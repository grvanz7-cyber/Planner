(()=>{
  const DATA_KEY='plannerData';
  const data=()=>window.plannerData||JSON.parse(localStorage.getItem(DATA_KEY)||'null')||{};
  const subjects=()=>data()?.settings?.subjects||[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getUnits=subjectName=>{
    if(window.SubjectRoadmap&&typeof window.SubjectRoadmap.get==='function')return window.SubjectRoadmap.get(subjectName)||[];
    const s=subjects().find(x=>String(x?.name||'').toLowerCase()===String(subjectName||'').toLowerCase());
    return s?.roadmap||s?.units||[];
  };
  const getUnit=(subjectName,unitId)=>getUnits(subjectName).find(u=>String(u?.id)===String(unitId));
  const populateUnits=()=>{
    const subject=document.getElementById('studyFixSubject');
    const unit=document.getElementById('studyFixUnit');
    const topic=document.getElementById('studyFixTopic');
    if(!subject||!unit||!topic)return;
    const units=getUnits(subject.value);
    const previousUnit=unit.value;
    unit.innerHTML='<option value="">No unit / topic</option>'+units.map(u=>`<option value="${esc(u.id)}">${esc(u.name||u.title||'Untitled unit')}</option>`).join('');
    if(units.some(u=>String(u.id)===String(previousUnit)))unit.value=previousUnit;
    populateTopics();
  };
  const populateTopics=()=>{
    const subject=document.getElementById('studyFixSubject');
    const unit=document.getElementById('studyFixUnit');
    const topic=document.getElementById('studyFixTopic');
    if(!subject||!unit||!topic)return;
    const selected=getUnit(subject.value,unit.value);
    const lessons=selected?.lessons||[];
    const previous=topic.value;
    topic.innerHTML='<option value="">No topic / lesson</option>'+lessons.map(l=>`<option value="${esc(l.id)}">${esc(l.name||l.title||'Untitled lesson')}</option>`).join('');
    if(lessons.some(l=>String(l.id)===String(previous)))topic.value=previous;
    topic.disabled=!unit.value||lessons.length===0;
    if(!unit.value)topic.innerHTML='<option value="">Choose a unit first</option>';
    else if(!lessons.length)topic.innerHTML='<option value="">No topics in this unit</option>';
  };
  const persist=d=>{
    try{localStorage.setItem(DATA_KEY,JSON.stringify(d));if(d.tasks)localStorage.setItem('plannerTasks',JSON.stringify(d.tasks));}catch(e){console.error('Study set persistence failed:',e);throw e;}
    try{if(typeof window.savePlannerData==='function')window.savePlannerData();}catch(e){console.warn('savePlannerData failed after direct persistence:',e);}
  };
  const closeModal=()=>document.getElementById('studySetModal')?.remove();
  const createSet=()=>{
    const d=data();
    const name=document.getElementById('studyFixName')?.value.trim();
    const subject=document.getElementById('studyFixSubject')?.value||'';
    const unitId=document.getElementById('studyFixUnit')?.value||'';
    const topicId=document.getElementById('studyFixTopic')?.value||'';
    const unitObj=getUnit(subject,unitId);
    const topicObj=(unitObj?.lessons||[]).find(l=>String(l?.id)===String(topicId));
    if(!name){alert('Please enter a study set name.');return;}
    const now=new Date().toISOString();
    const set={
      id:`S-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      name,subject,
      type:document.getElementById('studyFixType')?.value||'flashcards',
      unit:unitObj?.name||'',
      unitId:unitObj?.id||'',
      roadmapUnitId:unitObj?.id||'',
      topic:topicObj?.name||'',
      topicId:topicObj?.id||'',
      roadmapLessonId:topicObj?.id||'',
      description:document.getElementById('studyFixDescription')?.value.trim()||'',
      items:[],createdAt:now,updatedAt:now
    };
    d.studySets=Array.isArray(d.studySets)?d.studySets:[];
    d.studySets.push(set);
    try{persist(d);}catch(e){alert('The study set could not be saved. Please try again.');return;}
    closeModal();
    if(typeof window.renderStudy==='function')window.renderStudy();
    if(typeof window.renderStudySessions==='function')window.renderStudySessions();
    if(typeof window.renderStudyPlans==='function')window.renderStudyPlans();
    if(typeof window.dispatchEvent==='function')window.dispatchEvent(new Event('planner-data-changed'));
  };
  const openModal=()=>{
    closeModal();
    const modal=document.createElement('div');modal.id='studySetModal';modal.className='modal-overlay';
    const opts=subjects().filter(s=>s?.active!==false).map(s=>`<option value="${esc(s.name)}">${esc(s.emoji||'')} ${esc(s.name)}</option>`).join('');
    modal.innerHTML=`<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="studySetModalTitle"><div class="modal-header"><div><h2 id="studySetModalTitle">New Study Set</h2><p>Create a study set linked to your subject roadmap.</p></div><button type="button" class="modal-close" id="studyFixClose">×</button></div><div class="form-grid"><label>Name<input id="studyFixName" type="text" placeholder="e.g. Kinematics Review"></label><label>Subject<select id="studyFixSubject">${opts||'<option value="">No subjects available</option>'}</select></label><label>Set type<select id="studyFixType"><option value="flashcards">🗂️ Flashcards</option><option value="notes">📝 Study notes</option><option value="questions">❓ Question bank</option></select></label><label>Unit<select id="studyFixUnit"><option value="">No unit / topic</option></select></label><label>Topic / lesson<select id="studyFixTopic"><option value="">Choose a unit first</option></select></label><label>Description<textarea id="studyFixDescription" rows="3" placeholder="Optional context or study goal"></textarea></label></div><div class="modal-actions"><button type="button" class="cancel-button" id="studyFixCancel">Cancel</button><button type="button" class="save-button" id="studyFixSave">Create Study Set</button></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('studyFixSubject').addEventListener('change',populateUnits);
    document.getElementById('studyFixUnit').addEventListener('change',populateTopics);
    document.getElementById('studyFixClose').onclick=closeModal;
    document.getElementById('studyFixCancel').onclick=closeModal;
    document.getElementById('studyFixSave').onclick=createSet;
    populateUnits();
    document.getElementById('studyFixName')?.focus();
  };
  const wire=()=>{
    const old=document.getElementById('studyAddButton');if(!old)return false;
    const button=old.cloneNode(true);old.replaceWith(button);button.addEventListener('click',openModal);window.openStudySetModal=openModal;return true;
  };
  const init=()=>wire();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);
  window.addEventListener('planner-data-changed',wire);
})();