// ========================================
// STUDY PAGE — FOUNDATION
// ========================================
(function(){
  const TYPES=[['flashcards','🗂️','Flashcards'],['notes','📝','Study notes'],['questions','❓','Question bank']];
  function el(id){return document.getElementById(id);}
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function subjects(){return (data().settings?.subjects||[]).filter(s=>s&&s.active!==false);}
  function ensureData(){if(!Array.isArray(data().studySets))data().studySets=[];}
  function wirePage(){const add=el('studyAddButton'),filter=el('studySubjectFilter');if(add)add.onclick=openModal;if(filter)filter.onchange=render;}
  function ensurePage(){
    const existing=el('studyPage');
    if(existing){wirePage();return;}
    const nav=document.querySelector('.nav-section:nth-of-type(2)');
    if(nav&&!document.querySelector('[data-page="study"]')){
      const a=document.createElement('a');a.href='#study';a.className='nav-item';a.dataset.page='study';a.textContent='🧠 Study';a.onclick=()=>{showPage('study');return false;};nav.appendChild(a);
    }
    const p=document.createElement('div');p.id='studyPage';p.className='page-hidden';
    p.innerHTML='<header class="header study-page-header"><div><h1>Study</h1><p>Build study sets, organize your material, and prepare to learn.</p></div><button class="save-button" id="studyAddButton">+ New Study Set</button></header><div class="study-summary"><div class="study-stat"><strong id="studySetCount">0</strong><span>Study sets</span></div><div class="study-stat"><strong id="studyCardCount">0</strong><span>Items to study</span></div><div class="study-stat"><strong id="studyDueCount">0</strong><span>Due for review</span></div></div><section class="card study-library-card"><div class="study-library-header"><div><h2>Your Study Library</h2><p>Sets can later grow into flashcards, notes, quizzes, and review sessions.</p></div><select id="studySubjectFilter"><option value="">All subjects</option></select></div><div id="studySets" class="study-sets"></div></section>';
    document.querySelector('.main')?.appendChild(p);wirePage();
  }
  function ensureModal(){
    if(el('studySetModal'))return;
    const w=document.createElement('div');w.className='modal-overlay';w.id='studySetModal';
    w.innerHTML='<div class="modal wide-modal"><div class="modal-header"><h2>New Study Set</h2><button class="close-button" id="studyClose">×</button></div><div class="form-group"><label for="studySetName">Name</label><input id="studySetName" placeholder="e.g. Kinematics — Unit 1"></div><div class="form-row"><div class="form-group"><label for="studySetSubject">Subject</label><select id="studySetSubject"></select></div><div class="form-group"><label for="studySetType">Set type</label><select id="studySetType"></select></div></div><div class="form-group"><label for="studySetUnit">Unit / topic <span class="field-hint">optional</span></label><input id="studySetUnit" placeholder="e.g. Unit 1 · Kinematics"></div><div class="form-group"><label for="studySetDescription">Description <span class="field-hint">optional</span></label><textarea id="studySetDescription" rows="3" placeholder="What is this set for?"></textarea></div><div class="modal-actions"><button class="cancel-button" id="studyCancel">Cancel</button><button class="save-button" id="studySave">Create Study Set</button></div></div>';
    document.body.appendChild(w);el('studyClose').onclick=closeModal;el('studyCancel').onclick=closeModal;el('studySave').onclick=createSet;w.addEventListener('click',e=>{if(e.target===w)closeModal();});
  }
  function populate(){
    const s=el('studySetSubject');if(s){s.innerHTML='<option value="">Choose a subject</option>';subjects().forEach(x=>{const o=document.createElement('option');o.value=x.name;o.textContent=`${x.emoji||'📚'} ${x.name}`;s.appendChild(o);});}
    const t=el('studySetType');if(t)t.innerHTML=TYPES.map(x=>`<option value="${x[0]}">${x[1]} ${x[2]}</option>`).join('');
    const f=el('studySubjectFilter');if(f){const cur=f.value;f.innerHTML='<option value="">All subjects</option>'+subjects().map(x=>`<option value="${x.name}">${x.emoji||'📚'} ${x.name}</option>`).join('');if(subjects().some(x=>x.name===cur))f.value=cur;}
  }
  function openModal(){ensureData();ensureModal();populate();el('studySetName').value='';el('studySetSubject').value='';el('studySetUnit').value='';el('studySetDescription').value='';el('studySetModal').classList.add('open');el('studySetName').focus();}
  function closeModal(){el('studySetModal')?.classList.remove('open');}
  function createSet(){ensureData();const d=data(),name=el('studySetName').value.trim(),subject=el('studySetSubject').value,type=el('studySetType').value,unit=el('studySetUnit').value.trim(),description=el('studySetDescription').value.trim();if(!name)return alert('Please enter a study set name.');if(!subject)return alert('Please choose a subject.');d.studySets.push({id:`S-${Date.now()}`,name,subject,type,unit,description,items:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});if(typeof savePlannerData==='function')savePlannerData();closeModal();render();}
  function deleteSet(id){const d=data(),set=(d.studySets||[]).find(x=>String(x.id)===String(id));if(!set)return;if(!confirm(`Delete “${set.name}”? This cannot be undone.`))return;d.studySets=d.studySets.filter(x=>String(x.id)!==String(id));if(typeof savePlannerData==='function')savePlannerData();render();}
  function render(){ensureData();ensurePage();populate();const d=data(),filter=el('studySubjectFilter')?.value||'',sets=d.studySets.filter(x=>!filter||x.subject===filter);el('studySetCount').textContent=d.studySets.length;el('studyCardCount').textContent=d.studySets.reduce((n,x)=>n+(Array.isArray(x.items)?x.items.length:0),0);el('studyDueCount').textContent=d.studySets.reduce((n,x)=>n+(Array.isArray(x.items)?x.items.filter(i=>i&&i.dueAt&&new Date(i.dueAt)<=new Date()).length:0),0);const list=el('studySets');if(!list)return;list.innerHTML='';if(!sets.length){list.innerHTML='<div class="study-empty"><div class="study-empty-icon">🧠</div><h3>No study sets yet</h3><p>Create your first set and we’ll build the study tools around it.</p><button class="secondary-button" onclick="window.openStudySetModal()">Create a study set</button></div>';return;}sets.forEach(s=>{const subject=subjects().find(x=>x.name===s.subject),type=TYPES.find(x=>x[0]===s.type)||TYPES[0],card=document.createElement('article');card.className='study-set-card';card.innerHTML=`<div class="study-set-icon">${subject?.emoji||type[1]}</div><div class="study-set-main"><div class="study-set-top"><div><h3>${escapeHtml(s.name)}</h3><div class="study-set-meta">${escapeHtml(s.subject)} · ${type[1]} ${type[2]}</div></div><button class="study-delete-button" type="button" aria-label="Delete study set">Delete</button></div>${s.unit?`<div class="study-set-unit">${escapeHtml(s.unit)}</div>`:''}<p>${escapeHtml(s.description||'Ready to add study material.')}</p><div class="study-set-footer"><span>${Array.isArray(s.items)?s.items.length:0} items</span><button class="secondary-button" type="button" disabled>Open set</button></div></div>`;card.querySelector('.study-delete-button').onclick=()=>deleteSet(s.id);list.appendChild(card);});}
  function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  window.renderStudy=render;window.openStudySetModal=openModal;
  document.addEventListener('DOMContentLoaded',()=>{ensurePage();ensureModal();});
  window.addEventListener('planner-data-changed',render);
})();
