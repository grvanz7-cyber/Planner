// ========================================
// STUDY PLANS — EVIDENCE-INFORMED SUBJECT PROFILES
// ========================================
(function(){
  const METHODS=[
    {id:'retrieval',icon:'🧠',name:'Active recall',strength:'Strong evidence',desc:'Retrieve information from memory before checking your notes.'},
    {id:'spacing',icon:'📅',name:'Spaced repetition',strength:'Strong evidence',desc:'Review material across increasing time intervals.'},
    {id:'practice-testing',icon:'📝',name:'Practice testing',strength:'Strong evidence',desc:'Use questions and problems to test what you can produce independently.'},
    {id:'interleaving',icon:'🔀',name:'Interleaving',strength:'Moderate evidence',desc:'Mix related problem types instead of doing one type in a block.'},
    {id:'self-explanation',icon:'💬',name:'Self-explanation',strength:'Moderate evidence',desc:'Explain why a step, answer, or idea makes sense.'},
    {id:'feynman',icon:'🗣️',name:'Feynman technique',strength:'Useful application',desc:'Explain a concept simply, identify gaps, then repair them.'},
    {id:'blurting',icon:'✍️',name:'Blurting',strength:'Retrieval-based',desc:'Write everything you can remember, then compare and fill the gaps.'},
    {id:'worked-examples',icon:'🧩',name:'Worked examples',strength:'Strong application',desc:'Study a solved example, then gradually remove the support and solve independently.'},
    {id:'elaboration',icon:'🔎',name:'Elaboration',strength:'Moderate evidence',desc:'Ask how, why, when, and how ideas connect to existing knowledge.'}
  ];
  const DEFAULTS={
    quantitative:['retrieval','practice-testing','worked-examples','interleaving','self-explanation','spacing'],
    conceptual:['retrieval','practice-testing','blurting','feynman','elaboration','spacing'],
    language:['retrieval','spacing','practice-testing','elaboration','self-explanation'],
    mixed:['retrieval','practice-testing','spacing','self-explanation','interleaving','elaboration']
  };
  const SUBJECT_PRESETS={
    physics:{kind:'quantitative',methods:['retrieval','practice-testing','worked-examples','interleaving','self-explanation','spacing'],label:'Problem solving'},
    math:{kind:'quantitative',methods:['retrieval','practice-testing','worked-examples','interleaving','self-explanation','spacing'],label:'Problem solving'},
    chemistry:{kind:'mixed',methods:['retrieval','practice-testing','worked-examples','self-explanation','blurting','spacing'],label:'Concepts + problems'},
    biology:{kind:'conceptual',methods:['retrieval','blurting','feynman','elaboration','practice-testing','spacing'],label:'Concept-heavy'},
    english:{kind:'language',methods:['retrieval','elaboration','self-explanation','practice-testing','spacing'],label:'Reading + writing'},
    history:{kind:'conceptual',methods:['retrieval','blurting','elaboration','feynman','practice-testing','spacing'],label:'Recall + connections'}
  };
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function subjects(){return (data().settings?.subjects||[]).filter(s=>s&&s.active!==false);}
  function ensure(){if(!data().studyPlans)data().studyPlans={};}
  function key(s){return String(s||'').trim().toLowerCase();}
  function preset(subject){const n=key(subject);for(const p of Object.keys(SUBJECT_PRESETS)){if(n.includes(p))return SUBJECT_PRESETS[p];}return {kind:'mixed',methods:DEFAULTS.mixed,label:'General study'};}
  function plan(subject){ensure();const k=key(subject),saved=data().studyPlans[k]||{};const p=preset(subject);return {subject,kind:saved.kind||p.kind,methods:Array.isArray(saved.methods)&&saved.methods.length?saved.methods.slice():p.methods.slice(),sessionMinutes:Number(saved.sessionMinutes)||45,reviewCadence:saved.reviewCadence||'1, 3, 7, 14 days',goal:saved.goal||'Understand, retrieve, and apply the material'};}
  function save(subject,patch){ensure();const p=plan(subject);data().studyPlans[key(subject)]={...p,...patch,subject};if(typeof savePlannerData==='function')savePlannerData();window.dispatchEvent(new Event('planner-data-changed'));}
  function el(id){return document.getElementById(id);}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function ensureUI(){
    const page=el('studyPage');if(!page||el('studyPlansSection'))return;
    const section=document.createElement('section');section.className='card study-plans-card';section.id='studyPlansSection';
    section.innerHTML='<div class="study-plans-heading"><div><h2>Subject Study Plans</h2><p>Planner recommends methods based on the kind of learning your subject requires. You can customize every plan.</p></div><button class="secondary-button" id="studyPlanEdit">Edit plan</button></div><div class="study-plan-selector"><label for="studyPlanSubject">Subject</label><select id="studyPlanSubject"></select></div><div id="studyPlanContent"></div>';
    page.appendChild(section);
    el('studyPlanSubject').onchange=renderPlan;
    el('studyPlanEdit').onclick=()=>openEditor(el('studyPlanSubject').value);
  }
  function populateSubjects(){const s=el('studyPlanSubject');if(!s)return;const current=s.value;s.innerHTML=subjects().map(x=>`<option value="${esc(x.name)}">${esc(x.emoji||'📚')} ${esc(x.name)}</option>`).join('');if(current&&subjects().some(x=>x.name===current))s.value=current;}
  function renderPlan(){ensureUI();populateSubjects();const s=el('studyPlanSubject')?.value;if(!s){el('studyPlanContent').innerHTML='<div class="study-plan-empty">Add an active subject to create a study plan.</div>';return;}const p=plan(s),methodMap=Object.fromEntries(METHODS.map(m=>[m.id,m]));const presetInfo=preset(s);el('studyPlanContent').innerHTML=`<div class="study-plan-overview"><div><span class="study-plan-label">Approach</span><strong>${esc(presetInfo.label)}</strong></div><div><span class="study-plan-label">Typical session</span><strong>${p.sessionMinutes} min</strong></div><div><span class="study-plan-label">Review pattern</span><strong>${esc(p.reviewCadence)}</strong></div></div><div class="study-method-list">${p.methods.map(id=>{const m=methodMap[id];return m?`<div class="study-method"><span class="study-method-icon">${m.icon}</span><div><strong>${esc(m.name)}</strong><span>${esc(m.desc)}</span></div><small>${esc(m.strength)}</small></div>`:''}).join('')}</div><div class="study-session-preview"><div><h3>Recommended session</h3><p>${esc(p.goal)}</p></div><div class="study-session-steps"><span>1 · Learn / refresh</span><span>2 · Retrieve without notes</span><span>3 · Apply or explain</span><span>4 · Check gaps</span><span>5 · Schedule review</span></div></div>`;}
  function ensureEditor(){if(el('studyPlanModal'))return;const w=document.createElement('div');w.className='modal-overlay';w.id='studyPlanModal';w.innerHTML='<div class="modal wide-modal"><div class="modal-header"><h2>Edit Study Plan</h2><button class="close-button" id="studyPlanClose">×</button></div><div id="studyPlanEditor"></div></div>';document.body.appendChild(w);el('studyPlanClose').onclick=closeEditor;w.addEventListener('click',e=>{if(e.target===w)closeEditor();});}
  function openEditor(subject){if(!subject)return;ensureEditor();const p=plan(subject);const checked=id=>p.methods.includes(id)?'checked':'';el('studyPlanEditor').innerHTML=`<div class="form-group"><label>Subject</label><input value="${esc(subject)}" disabled></div><div class="form-row"><div class="form-group"><label for="planKind">Learning style</label><select id="planKind"><option value="quantitative">Problem solving</option><option value="conceptual">Concept-heavy</option><option value="language">Reading + writing</option><option value="mixed">Mixed</option></select></div><div class="form-group"><label for="planMinutes">Typical session (minutes)</label><input id="planMinutes" type="number" min="15" max="180" step="5" value="${p.sessionMinutes}"></div></div><div class="form-group"><label>Methods to prioritize</label><div class="study-method-editor">${METHODS.map(m=>`<label class="study-method-option"><input type="checkbox" value="${m.id}" ${checked(m.id)}><span>${m.icon} <strong>${esc(m.name)}</strong><small>${esc(m.strength)}</small></span></label>`).join('')}</div></div><div class="form-group"><label for="planCadence">Review cadence</label><input id="planCadence" value="${esc(p.reviewCadence)}" placeholder="e.g. 1, 3, 7, 14 days"></div><div class="form-group"><label for="planGoal">Main goal</label><input id="planGoal" value="${esc(p.goal)}"></div><div class="modal-actions"><button class="cancel-button" onclick="window.closeStudyPlanEditor()">Cancel</button><button class="save-button" id="saveStudyPlan">Save Study Plan</button></div>`;el('planKind').value=p.kind;el('saveStudyPlan').onclick=()=>{const methods=[...el('studyPlanEditor').querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value);if(!methods.length)return alert('Choose at least one study method.');save(subject,{kind:el('planKind').value,methods,sessionMinutes:Math.max(15,Number(el('planMinutes').value)||45),reviewCadence:el('planCadence').value.trim()||'1, 3, 7, 14 days',goal:el('planGoal').value.trim()||'Understand, retrieve, and apply the material'});closeEditor();renderPlan();};el('studyPlanModal').classList.add('open');}
  function closeEditor(){el('studyPlanModal')?.classList.remove('open');}
  window.closeStudyPlanEditor=closeEditor;
  function render(){ensureUI();populateSubjects();renderPlan();}
  window.renderStudyPlans=render;
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(render,0);});
  window.addEventListener('planner-data-changed',render);
})();
