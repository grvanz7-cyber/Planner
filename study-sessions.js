// ========================================
// STUDY SESSIONS — PLAN-BASED SESSION GENERATOR
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
    w.innerHTML='<div class="modal wide-modal"><div class="modal-header"><h2>Build a Study Session</h2><button class="close-button" id="studySessionClose">×</button></div><div id="studySessionGenerator"><div class="form-group"><label for="sessionSubject">Subject</label><select id="sessionSubject"></select></div><div class="form-group"><label for="sessionTopic">Topic / lesson <span class="field-hint">optional</span></label><input id="sessionTopic" placeholder="e.g. 1.5 Discovering Forces"></div><div class="form-group"><label for="sessionPurpose">Session purpose</label><select id="sessionPurpose"><option value="learn">Learn / refresh</option><option value="review">Review</option><option value="test">Test prep</option><option value="catchup">Catch-up</option></select></div><div class="form-group"><label for="sessionMinutes">Available time</label><select id="sessionMinutes"><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45" selected>45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></div><div class="modal-actions"><button class="cancel-button" id="sessionCancel">Cancel</button><button class="save-button" id="sessionBuild">Build Session</button></div></div></div>';
    document.body.appendChild(w);
    el('studySessionClose').onclick=closeGenerator;el('sessionCancel').onclick=closeGenerator;el('sessionBuild').onclick=build;
    w.addEventListener('click',e=>{if(e.target===w)closeGenerator();});
  }
  function populate(){const s=el('sessionSubject');if(!s)return;const current=el('studyPlanSubject')?.value||'';s.innerHTML=subjects().map(x=>`<option value="${esc(x.name)}">${esc(x.emoji||'📚')} ${esc(x.name)}</option>`).join('');if(current&&subjects().some(x=>x.name===current))s.value=current;}
  function openGenerator(){if(!subjects().length){alert('Add an active subject before building a study session.');return;}ensureModal();populate();el('sessionTopic').value='';el('sessionPurpose').value='learn';el('sessionMinutes').value=String(plan(el('sessionSubject').value).minutes<=60?plan(el('sessionSubject').value).minutes:45);el('studySessionModal').classList.add('open');}
  function closeGenerator(){el('studySessionModal')?.classList.remove('open');}
  function splitMinutes(total,count){const base=Math.floor(total/count);const rem=total-base*count;return Array.from({length:count},(_,i)=>base+(i<rem?1:0));}
  function build(){
    const subject=el('sessionSubject').value,topic=el('sessionTopic').value.trim(),purpose=el('sessionPurpose').value,minutes=Number(el('sessionMinutes').value)||45,p=plan(subject),methods=p.methods.slice();
    let selected;
    if(purpose==='learn')selected=['retrieval','worked-examples','self-explanation','practice-testing'];
    else if(purpose==='review')selected=['spacing','retrieval','practice-testing','self-explanation'];
    else if(purpose==='test')selected=['retrieval','practice-testing','interleaving','self-explanation'];
    else selected=['retrieval','practice-testing','self-explanation','spacing'];
    selected=selected.filter(id=>methods.includes(id));
    methods.forEach(id=>{if(selected.length<4&&!selected.includes(id))selected.push(id);});
    selected=selected.slice(0,Math.min(4,selected.length));
    const durations=splitMinutes(minutes,selected.length||1);
    const title=topic?`${subject} · ${topic}`:`${subject} study session`;
    const purposeLabels={learn:'Learn / refresh',review:'Review',test:'Test prep',catchup:'Catch-up'};
    const steps=selected.map((id,i)=>{const m=METHOD_STEPS[id];return {method:id,icon:m.icon,name:m.name,minutes:durations[i],instruction:m.step};});
    showResult(title,purposeLabels[purpose],minutes,p.goal,steps);
  }
  function showResult(title,purpose,minutes,goal,steps){
    const modal=el('studySessionModal'),box=el('studySessionGenerator');
    box.innerHTML=`<div class="study-session-result"><div class="study-session-result-head"><div><span class="study-plan-label">${esc(purpose)} · ${minutes} min</span><h3>${esc(title)}</h3><p>${esc(goal)}</p></div><button class="secondary-button" id="sessionBack">Adjust</button></div><div class="generated-session-steps">${steps.map((s,i)=>`<article class="generated-session-step"><div class="generated-step-number">${i+1}</div><div class="generated-step-icon">${s.icon}</div><div class="generated-step-main"><div class="generated-step-top"><strong>${esc(s.name)}</strong><span>${s.minutes} min</span></div><p>${esc(s.instruction)}</p></div></article>`).join('')}</div><div class="study-session-result-note"><strong>How to use it</strong><span>Work through the steps in order. When you finish, note what you still cannot retrieve and use that gap to guide your next review.</span></div><div class="modal-actions"><button class="cancel-button" id="sessionDone">Done</button></div></div>`;
    el('sessionBack').onclick=()=>{box.innerHTML=generatorMarkup();bindGenerator();populate();};el('sessionDone').onclick=closeGenerator;
  }
  function generatorMarkup(){return '<div class="form-group"><label for="sessionSubject">Subject</label><select id="sessionSubject"></select></div><div class="form-group"><label for="sessionTopic">Topic / lesson <span class="field-hint">optional</span></label><input id="sessionTopic" placeholder="e.g. 1.5 Discovering Forces"></div><div class="form-group"><label for="sessionPurpose">Session purpose</label><select id="sessionPurpose"><option value="learn">Learn / refresh</option><option value="review">Review</option><option value="test">Test prep</option><option value="catchup">Catch-up</option></select></div><div class="form-group"><label for="sessionMinutes">Available time</label><select id="sessionMinutes"><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45" selected>45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></div><div class="modal-actions"><button class="cancel-button" id="sessionCancel">Cancel</button><button class="save-button" id="sessionBuild">Build Session</button></div>';}
  function bindGenerator(){el('sessionCancel').onclick=closeGenerator;el('sessionBuild').onclick=build;}
  function render(){ensureButton();ensureModal();}
  window.renderStudySessions=render;window.openStudySessionGenerator=openGenerator;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(render,0));
  window.addEventListener('planner-data-changed',render);
})();
