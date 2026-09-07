// ========================================
// STUDY SESSIONS — CONTEXT-AWARE SESSION GENERATOR
// ========================================
(function(){
  const METHOD_STEPS={
    retrieval:{icon:'🧠',name:'Active recall',step:'Retrieve what you already know without looking at your notes.'},
    spacing:{icon:'📅',name:'Spaced review',step:'Review older material that is due, then schedule the next review.'},
    'practice-testing':{icon:'📝',name:'Practice testing',step:'Answer questions or problems independently, then check your work.'},
    interleaving:{icon:'🔀',name:'Interleaving',step:'Mix related problem or question types so you have to choose the approach.'},
    'self-explanation':{icon:'💬',name:'Self-explanation',step:'Explain why the answer or process works, not just what the answer is.'},
    feynman:{icon:'🗣️',name:'Feynman technique',step:'Explain the idea simply, find gaps, and repair them.'},
    blurting:{icon:'✍️',name:'Blurting',step:'Write everything you can remember, then compare against your material.'},
    'worked-examples':{icon:'🧩',name:'Worked examples',step:'Study a worked example, then solve a similar problem with less support.'},
    elaboration:{icon:'🔎',name:'Elaboration',step:'Connect the idea to what you already know by asking how, why, and when.'}
  };
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function subjects(){return (data().settings?.subjects||[]).filter(s=>s&&s.active!==false);}
  function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
  function el(id){return document.getElementById(id);}
  function plan(subject){const saved=data().studyPlans?.[String(subject||'').trim().toLowerCase()]||{};const methods=Array.isArray(saved.methods)&&saved.methods.length?saved.methods:['retrieval','practice-testing','spacing'];return {methods,minutes:Math.max(15,Number(saved.sessionMinutes)||45),goal:saved.goal||'Understand, retrieve, and apply the material'};}
  function roadmap(subject){const s=subjects().find(x=>String(x.name).toLowerCase()===String(subject).toLowerCase());return Array.isArray(s?.roadmap)?s.roadmap:[];}
  function selectedContext(){
    const subject=el('sessionSubject')?.value||'';
    const unitId=el('sessionUnit')?.value||'';
    const lessonId=el('sessionLesson')?.value||'';
    const units=roadmap(subject);
    const unit=units.find(u=>String(u.id)===String(unitId));
    const lesson=unit?.lessons?.find(l=>String(l.id)===String(lessonId));
    return {subject,unit,lesson};
  }
  function relevantSets(subject,unit,lesson){
    const sets=Array.isArray(data().studySets)?data().studySets:[];
    const subjectSets=sets.filter(s=>String(s?.subject||'').toLowerCase()===String(subject||'').toLowerCase());
    if(!unit)return subjectSets;
    const unitName=String(unit.name||'').toLowerCase();
    const lessonName=String(lesson?.name||'').toLowerCase();
    const exact=subjectSets.filter(s=>{
      const text=`${s.name||''} ${s.unit||''} ${s.description||''}`.toLowerCase();
      return (lessonName&&text.includes(lessonName))||(unitName&&text.includes(unitName));
    });
    return exact.length?exact:subjectSets;
  }
  function ensureButton(){
    const section=el('studyPlansSection');
    if(!section||el('buildStudySessionButton'))return;
    const heading=section.querySelector('.study-plans-heading');
    if(!heading)return;
    const actions=document.createElement('div');actions.className='study-plan-actions';
    const edit=el('studyPlanEdit');
    const btn=document.createElement('button');btn.className='save-button';btn.id='buildStudySessionButton';btn.type='button';btn.textContent='Build study session';btn.onclick=openGenerator;
    actions.appendChild(btn);
    if(edit){heading.removeChild(edit);actions.appendChild(edit);}
    heading.appendChild(actions);
  }
  function ensureModal(){
    if(el('studySessionModal'))return;
    const w=document.createElement('div');w.className='modal-overlay';w.id='studySessionModal';
    w.innerHTML='<div class="modal wide-modal"><div class="modal-header"><h2>Build a Study Session</h2><button class="close-button" id="studySessionClose">×</button></div><div id="studySessionGenerator"></div></div>';
    document.body.appendChild(w);el('studySessionClose').onclick=closeGenerator;w.addEventListener('click',e=>{if(e.target===w)closeGenerator();});
    renderGeneratorForm();
  }
  function generatorMarkup(){return '<div class="form-group"><label for="sessionSubject">Subject</label><select id="sessionSubject"></select></div><div class="form-row"><div class="form-group"><label for="sessionUnit">Unit <span class="field-hint">optional</span></label><select id="sessionUnit"></select></div><div class="form-group"><label for="sessionLesson">Lesson <span class="field-hint">optional</span></label><select id="sessionLesson"></select></div></div><div id="sessionMaterialPreview" class="study-session-material-preview"></div><div class="form-group"><label for="sessionTopic">Topic / lesson <span class="field-hint">optional</span></label><input id="sessionTopic" placeholder="Or enter a custom topic"></div><div class="form-group"><label for="sessionPurpose">Session purpose</label><select id="sessionPurpose"><option value="learn">Learn / refresh</option><option value="review">Review</option><option value="test">Test prep</option><option value="catchup">Catch-up</option></select></div><div class="form-group"><label for="sessionMinutes">Available time</label><select id="sessionMinutes"><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45" selected>45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></div><div class="modal-actions"><button class="cancel-button" id="sessionCancel">Cancel</button><button class="save-button" id="sessionBuild">Build Session</button></div>';}
  function renderGeneratorForm(){const box=el('studySessionGenerator');if(!box)return;box.innerHTML=generatorMarkup();bindGenerator();populate();}
  function populate(){
    const s=el('sessionSubject');if(!s)return;
    const current=s.value||el('studyPlanSubject')?.value||'';
    s.innerHTML=subjects().map(x=>`<option value="${esc(x.name)}">${esc(x.emoji||'📚')} ${esc(x.name)}</option>`).join('');
    if(current&&subjects().some(x=>x.name===current))s.value=current;
    updateRoadmapSelectors();
    const savedMinutes=plan(s.value).minutes;
    el('sessionMinutes').value=String(savedMinutes<=60?Math.max(20,savedMinutes):45);
  }
  function updateRoadmapSelectors(){
    const subject=el('sessionSubject')?.value||'',unitSelect=el('sessionUnit'),lessonSelect=el('sessionLesson');
    if(!unitSelect||!lessonSelect)return;
    const units=roadmap(subject),oldUnit=unitSelect.value,oldLesson=lessonSelect.value;
    unitSelect.innerHTML='<option value="">All units / no specific unit</option>'+units.map((u,i)=>`<option value="${esc(u.id)}">Unit ${i+1} · ${esc(u.name||'Untitled unit')}</option>`).join('');
    if(units.some(u=>String(u.id)===String(oldUnit)))unitSelect.value=oldUnit;
    else unitSelect.value='';
    updateLessonSelector(oldLesson);
  }
  function updateLessonSelector(preferredId){
    const {subject,unit}=selectedContext(),lessonSelect=el('sessionLesson');if(!lessonSelect)return;
    const lessons=unit&&Array.isArray(unit.lessons)?unit.lessons:[];
    lessonSelect.innerHTML='<option value="">All lessons / no specific lesson</option>'+lessons.map(l=>`<option value="${esc(l.id)}">${esc(l.name||'Untitled lesson')}</option>`).join('');
    if(preferredId&&lessons.some(l=>String(l.id)===String(preferredId)))lessonSelect.value=preferredId;
    updateMaterialPreview(subject,unit,null);
  }
  function updateMaterialPreview(subject,unit,lesson){
    const box=el('sessionMaterialPreview');if(!box)return;
    const sets=relevantSets(subject,unit,lesson);
    if(!sets.length){box.innerHTML='<div class="study-session-material-empty">No study sets are linked to this subject yet. You can still build the session and add material later.</div>';return;}
    const shown=sets.slice(0,5);
    box.innerHTML=`<div class="study-session-material-head"><strong>Available study material</strong><span>${sets.length} set${sets.length===1?'':'s'}</span></div><div class="study-session-material-list">${shown.map(s=>`<span class="study-session-material-chip">${esc(s.type==='flashcards'?'🗂️':s.type==='questions'?'❓':'📝')} ${esc(s.name)}${Array.isArray(s.items)&&s.items.length?` · ${s.items.length} items`:''}</span>`).join('')}</div>${sets.length>5?'<small>Showing the first 5 relevant sets.</small>':''}`;
  }
  function bindGenerator(){
    el('sessionCancel').onclick=closeGenerator;el('sessionBuild').onclick=build;
    el('sessionSubject').onchange=()=>{updateRoadmapSelectors();updateMaterialPreview(el('sessionSubject').value,null,null);};
    el('sessionUnit').onchange=()=>{updateLessonSelector();const c=selectedContext();updateMaterialPreview(c.subject,c.unit,null);};
    el('sessionLesson').onchange=()=>{const c=selectedContext();updateMaterialPreview(c.subject,c.unit,c.lesson);};
  }
  function openGenerator(){
    if(!subjects().length){alert('Add an active subject before building a study session.');return;}
    ensureModal();renderGeneratorForm();el('sessionTopic').value='';el('sessionPurpose').value='learn';el('studySessionModal').classList.add('open');
  }
  function closeGenerator(){el('studySessionModal')?.classList.remove('open');}
  function splitMinutes(total,count){const base=Math.floor(total/count);const rem=total-base*count;return Array.from({length:count},(_,i)=>base+(i<rem?1:0));}
  function build(){
    const subject=el('sessionSubject').value,topic=el('sessionTopic').value.trim(),purpose=el('sessionPurpose').value,minutes=Number(el('sessionMinutes').value)||45,p=plan(subject),context=selectedContext();
    const methods=p.methods.slice();let selected;
    if(purpose==='learn')selected=['retrieval','worked-examples','self-explanation','practice-testing'];
    else if(purpose==='review')selected=['spacing','retrieval','practice-testing','self-explanation'];
    else if(purpose==='test')selected=['retrieval','practice-testing','interleaving','self-explanation'];
    else selected=['retrieval','practice-testing','self-explanation','spacing'];
    selected=selected.filter(id=>methods.includes(id));methods.forEach(id=>{if(selected.length<4&&!selected.includes(id))selected.push(id);});selected=selected.slice(0,Math.min(4,selected.length));
    const durations=splitMinutes(minutes,selected.length||1),material=relevantSets(subject,context.unit,context.lesson),contextName=context.lesson?.name||context.unit?.name||topic;
    const title=contextName?`${subject} · ${contextName}`:`${subject} study session`,purposeLabels={learn:'Learn / refresh',review:'Review',test:'Test prep',catchup:'Catch-up'};
    const steps=selected.map((id,i)=>{const m=METHOD_STEPS[id];let instruction=m.step;if(context.lesson)instruction+=` Focus specifically on “${context.lesson.name}”.`;else if(context.unit)instruction+=` Focus on the material in “${context.unit.name}”.`;return {method:id,icon:m.icon,name:m.name,minutes:durations[i],instruction};});
    showResult(title,purposeLabels[purpose],minutes,p.goal,steps,material,context);
  }
  function showResult(title,purpose,minutes,goal,steps,material,context){
    const box=el('studySessionGenerator');
    const materialHtml=material.length?`<div class="study-session-result-material"><strong>Use these study sets</strong><div>${material.slice(0,6).map(s=>`<span class="study-session-material-chip">${esc(s.type==='flashcards'?'🗂️':s.type==='questions'?'❓':'📝')} ${esc(s.name)}</span>`).join('')}</div></div>`:'';
    const contextLabel=context.lesson?`${context.unit?.name||'Unit'} · ${context.lesson.name}`:context.unit?.name||'';
    box.innerHTML=`<div class="study-session-result"><div class="study-session-result-head"><div><span class="study-plan-label">${esc(purpose)} · ${minutes} min</span><h3>${esc(title)}</h3>${contextLabel?`<p>${esc(contextLabel)}</p>`:''}<p>${esc(goal)}</p></div><button class="secondary-button" id="sessionBack">Adjust</button></div>${materialHtml}<div class="generated-session-steps">${steps.map((s,i)=>`<article class="generated-session-step"><div class="generated-step-number">${i+1}</div><div class="generated-step-icon">${s.icon}</div><div class="generated-step-main"><div class="generated-step-top"><strong>${esc(s.name)}</strong><span>${s.minutes} min</span></div><p>${esc(s.instruction)}</p></div></article>`).join('')}</div><div class="study-session-result-note"><strong>How to use it</strong><span>Work through the steps in order. When you finish, note what you still cannot retrieve and use that gap to guide your next review.</span></div><div class="modal-actions"><button class="cancel-button" id="sessionDone">Done</button></div></div>`;
    el('sessionBack').onclick=()=>renderGeneratorForm();el('sessionDone').onclick=closeGenerator;
  }
  function render(){ensureButton();ensureModal();}
  window.renderStudySessions=render;window.openStudySessionGenerator=openGenerator;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(render,0));
  window.addEventListener('planner-data-changed',render);
})();
