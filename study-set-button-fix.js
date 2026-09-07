(()=>{
  const DATA_KEY='plannerData';
  const getData=()=>window.plannerData||JSON.parse(localStorage.getItem(DATA_KEY)||'null')||{};
  const getSubjects=()=>getData()?.settings?.subjects||[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getUnits=subjectName=>{
    if(window.SubjectRoadmap&&typeof window.SubjectRoadmap.get==='function')return window.SubjectRoadmap.get(subjectName)||[];
    const s=getSubjects().find(x=>String(x?.name||'').toLowerCase()===String(subjectName||'').toLowerCase());
    return s?.roadmap||s?.units||[];
  };
  const getUnit=(subject,id)=>getUnits(subject).find(u=>String(u?.id)===String(id));
  const close=()=>document.getElementById('studyFixModal')?.remove();
  const populateTopics=()=>{
    const subject=document.getElementById('studyFixSubject'),unit=document.getElementById('studyFixUnit'),topic=document.getElementById('studyFixTopic');
    if(!subject||!unit||!topic)return;
    const u=getUnit(subject.value,unit.value),lessons=u?.lessons||[];
    topic.innerHTML='<option value="">No topic / lesson</option>'+lessons.map(l=>`<option value="${esc(l.id)}">${esc(l.name||l.title||'Untitled lesson')}</option>`).join('');
    if(!unit.value)topic.innerHTML='<option value="">Choose a unit first</option>';
    else if(!lessons.length)topic.innerHTML='<option value="">No topics in this unit</option>';
    topic.disabled=!unit.value||!lessons.length;
  };
  const populateUnits=()=>{
    const subject=document.getElementById('studyFixSubject'),unit=document.getElementById('studyFixUnit');
    if(!subject||!unit)return;
    unit.innerHTML='<option value="">No unit / topic</option>'+getUnits(subject.value).map(u=>`<option value="${esc(u.id)}">${esc(u.name||u.title||'Untitled unit')}</option>`).join('');
    populateTopics();
  };
  const save=()=>{
    const d=getData(),name=document.getElementById('studyFixName')?.value.trim(),subject=document.getElementById('studyFixSubject')?.value||'',unitId=document.getElementById('studyFixUnit')?.value||'',topicId=document.getElementById('studyFixTopic')?.value||'';
    if(!name)return alert('Please enter a study set name.');
    if(!subject)return alert('Please choose a subject.');
    const unit=getUnit(subject,unitId),topic=(unit?.lessons||[]).find(l=>String(l?.id)===String(topicId)),now=new Date().toISOString();
    d.studySets=Array.isArray(d.studySets)?d.studySets:[];
    d.studySets.push({id:`S-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,subject,type:document.getElementById('studyFixType')?.value||'flashcards',unit:unit?.name||'',unitId:unit?.id||'',roadmapUnitId:unit?.id||'',topic:topic?.name||'',topicId:topic?.id||'',roadmapLessonId:topic?.id||'',description:document.getElementById('studyFixDescription')?.value.trim()||'',items:[],createdAt:now,updatedAt:now});
    window.plannerData=d;
    localStorage.setItem(DATA_KEY,JSON.stringify(d));
    if(d.tasks)localStorage.setItem('plannerTasks',JSON.stringify(d.tasks));
    close();
    window.dispatchEvent(new Event('planner-data-changed'));
    if(typeof window.renderStudy==='function')window.renderStudy();
  };
  const open=()=>{
    close();
    const modal=document.createElement('div');modal.id='studyFixModal';modal.className='modal-overlay';
    const subjects=getSubjects().filter(s=>s?.active!==false);
    modal.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><div><h2>New Study Set</h2><p>Create a study set linked to your subject roadmap.</p></div><button type="button" class="close-button" id="studyFixClose">×</button></div><div class="form-row"><div class="form-group"><label>Name</label><input id="studyFixName" placeholder="e.g. Kinematics Review"></div><div class="form-group"><label>Subject</label><select id="studyFixSubject"><option value="">Choose a subject</option>${subjects.map(s=>`<option value="${esc(s.name)}">${esc(s.emoji||'📚')} ${esc(s.name)}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-group"><label>Set type</label><select id="studyFixType"><option value="flashcards">🗂️ Flashcards</option><option value="notes">📝 Study notes</option><option value="questions">❓ Question bank</option></select></div><div class="form-group"><label>Unit</label><select id="studyFixUnit"><option value="">No unit / topic</option></select></div></div><div class="form-group"><label>Topic / lesson</label><select id="studyFixTopic" disabled><option value="">Choose a unit first</option></select></div><div class="form-group"><label>Description</label><textarea id="studyFixDescription" rows="3" placeholder="Optional context or study goal"></textarea></div><div class="modal-actions"><button type="button" class="cancel-button" id="studyFixCancel">Cancel</button><button type="button" class="save-button" id="studyFixSave">Create Study Set</button></div></div>`;
    document.body.appendChild(modal);
    modal.classList.add('open');
    document.getElementById('studyFixSubject').addEventListener('change',populateUnits);
    document.getElementById('studyFixUnit').addEventListener('change',populateTopics);
    document.getElementById('studyFixClose').onclick=close;
    document.getElementById('studyFixCancel').onclick=close;
    document.getElementById('studyFixSave').onclick=save;
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    populateUnits();
    document.getElementById('studyFixName')?.focus();
  };
  window.openStudySetModal=open;
  document.addEventListener('click',e=>{
    const button=e.target?.closest?.('#studyAddButton');
    if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();open();
  },true);
})();
