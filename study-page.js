// ========================================
// STUDY PAGE — FOUNDATION + FLASHCARD EDITOR
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
    p.innerHTML='<header class="header study-page-header"><div><h1>Study</h1><p>Build study sets, organize your material, and prepare to learn.</p></div><button class="save-button" id="studyAddButton">+ New Study Set</button></header><div class="study-summary"><div class="study-stat"><strong id="studySetCount">0</strong><span>Study sets</span></div><div class="study-stat"><strong id="studyCardCount">0</strong><span>Items to study</span></div><div class="study-stat"><strong id="studyDueCount">0</strong><span>Due for review</span></div></div><section class="card study-library-card"><div class="study-library-header"><div><h2>Your Study Library</h2><p>Sets can grow into flashcards, notes, quizzes, and review sessions.</p></div><select id="studySubjectFilter"><option value="">All subjects</option></select></div><div id="studySets" class="study-sets"></div></section>';
    document.querySelector('.main')?.appendChild(p);wirePage();
  }
  function ensureModal(){
    if(el('studySetModal'))return;
    const w=document.createElement('div');w.className='modal-overlay';w.id='studySetModal';
    w.innerHTML='<div class="modal wide-modal"><div class="modal-header"><h2>New Study Set</h2><button class="close-button" id="studyClose">×</button></div><div class="form-group"><label for="studySetName">Name</label><input id="studySetName" placeholder="e.g. Kinematics — Unit 1"></div><div class="form-row"><div class="form-group"><label for="studySetSubject">Subject</label><select id="studySetSubject"></select></div><div class="form-group"><label for="studySetType">Set type</label><select id="studySetType"></select></div></div><div class="form-group"><label for="studySetUnit">Unit / topic <span class="field-hint">optional</span></label><input id="studySetUnit" placeholder="e.g. Unit 1 · Kinematics"></div><div class="form-group"><label for="studySetDescription">Description <span class="field-hint">optional</span></label><textarea id="studySetDescription" rows="3" placeholder="What is this set for?"></textarea></div><div class="modal-actions"><button class="cancel-button" id="studyCancel">Cancel</button><button class="save-button" id="studySave">Create Study Set</button></div></div>';
    document.body.appendChild(w);el('studyClose').onclick=closeModal;el('studyCancel').onclick=closeModal;el('studySave').onclick=createSet;w.addEventListener('click',e=>{if(e.target===w)closeModal();});
  }
  function ensureSetModal(){
    if(el('studySetEditorModal'))return;
    const w=document.createElement('div');w.className='modal-overlay';w.id='studySetEditorModal';
    w.innerHTML='<div class="modal wide-modal study-set-editor"><div class="modal-header"><div><span class="study-plan-label" id="studyEditorType"></span><h2 id="studyEditorTitle"></h2></div><button class="close-button" id="studyEditorClose">×</button></div><div id="studyEditorBody"></div></div>';
    document.body.appendChild(w);el('studyEditorClose').onclick=closeSetEditor;w.addEventListener('click',e=>{if(e.target===w)closeSetEditor();});
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
  function openSet(id){ensureSetModal();const set=(data().studySets||[]).find(x=>String(x.id)===String(id));if(!set)return;el('studyEditorType').textContent=(TYPES.find(x=>x[0]===set.type)||TYPES[0])[1]+' '+(TYPES.find(x=>x[0]===set.type)||TYPES[0])[2];el('studyEditorTitle').textContent=set.name;renderFlashcardEditor(set);el('studySetEditorModal').classList.add('open');}
  function closeSetEditor(){el('studySetEditorModal')?.classList.remove('open');}
  function renderFlashcardEditor(set){
    const body=el('studyEditorBody');
    if(set.type!=='flashcards'){body.innerHTML='<div class="study-editor-placeholder"><div class="study-empty-icon">'+((TYPES.find(x=>x[0]===set.type)||TYPES[0])[1])+'</div><h3>This set is ready</h3><p>The editor for '+escapeHtml((TYPES.find(x=>x[0]===set.type)||TYPES[0])[2].toLowerCase())+' is coming next.</p></div>';return;}
    if(!Array.isArray(set.items))set.items=[];
    body.innerHTML='<div class="study-editor-toolbar"><div><strong id="studyEditorCount">'+set.items.length+'</strong> cards</div><button class="save-button" id="addFlashcardButton">+ Add Flashcard</button></div><div id="flashcardEditorList" class="flashcard-editor-list"></div>';
    const list=el('flashcardEditorList');
    if(!set.items.length){list.innerHTML='<div class="study-empty study-editor-empty"><div class="study-empty-icon">🗂️</div><h3>No flashcards yet</h3><p>Add your first question and answer to start building this set.</p><button class="secondary-button" id="emptyAddFlashcard">+ Add Flashcard</button></div>';el('emptyAddFlashcard').onclick=()=>addFlashcard(set);}
    else set.items.forEach((card,index)=>list.appendChild(cardEditor(set,card,index)));
    el('addFlashcardButton').onclick=()=>addFlashcard(set);
  }
  function cardEditor(set,card,index){
    const row=document.createElement('article');row.className='flashcard-editor-card';row.innerHTML='<div class="flashcard-editor-top"><span>Card '+(index+1)+'</span><button type="button" class="study-delete-button">Delete</button></div><div class="form-row"><div class="form-group"><label>Front / Question</label><textarea class="flashcard-front" rows="3" placeholder="What do you want to be able to recall?">'+escapeHtml(card.front||card.question||'')+'</textarea></div><div class="form-group"><label>Back / Answer</label><textarea class="flashcard-back" rows="3" placeholder="What is the answer?">'+escapeHtml(card.back||card.answer||'')+'</textarea></div></div><div class="flashcard-editor-bottom"><label class="flashcard-tag-field">Tag <input class="flashcard-tag" value="'+escapeHtml(card.tag||'')+'" placeholder="e.g. forces"></label><button type="button" class="small-button flashcard-save">Save card</button></div>';
    row.querySelector('.flashcard-save').onclick=()=>{const front=row.querySelector('.flashcard-front').value.trim(),back=row.querySelector('.flashcard-back').value.trim();if(!front||!back){alert('Add both a front and a back before saving this card.');return;}card.front=front;card.back=back;card.tag=row.querySelector('.flashcard-tag').value.trim();card.question=undefined;card.answer=undefined;card.updatedAt=new Date().toISOString();card.dueAt=card.dueAt||new Date().toISOString();set.updatedAt=new Date().toISOString();if(typeof savePlannerData==='function')savePlannerData();renderFlashcardEditor(set);};
    row.querySelector('.study-delete-button').onclick=()=>{if(!confirm('Delete this flashcard?'))return;set.items.splice(index,1);set.updatedAt=new Date().toISOString();if(typeof savePlannerData==='function')savePlannerData();renderFlashcardEditor(set);};
    return row;
  }
  function addFlashcard(set){if(!Array.isArray(set.items))set.items=[];set.items.push({id:`C-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,front:'',back:'',tag:'',dueAt:new Date().toISOString(),createdAt:new Date().toISOString()});set.updatedAt=new Date().toISOString();if(typeof savePlannerData==='function')savePlannerData();renderFlashcardEditor(set);const rows=document.querySelectorAll('.flashcard-editor-card');rows[rows.length-1]?.scrollIntoView({behavior:'smooth',block:'center'});}
  function render(){ensureData();ensurePage();populate();const d=data(),filter=el('studySubjectFilter')?.value||'',sets=d.studySets.filter(x=>!filter||x.subject===filter);el('studySetCount').textContent=d.studySets.length;el('studyCardCount').textContent=d.studySets.reduce((n,x)=>n+(Array.isArray(x.items)?x.items.length:0),0);el('studyDueCount').textContent=d.studySets.reduce((n,x)=>n+(Array.isArray(x.items)?x.items.filter(i=>i&&i.dueAt&&new Date(i.dueAt)<=new Date()).length:0),0);const list=el('studySets');if(!list)return;list.innerHTML='';if(!sets.length){list.innerHTML='<div class="study-empty"><div class="study-empty-icon">🧠</div><h3>No study sets yet</h3><p>Create your first set and we’ll build the study tools around it.</p><button class="secondary-button" onclick="window.openStudySetModal()">Create a study set</button></div>';return;}sets.forEach(s=>{const subject=subjects().find(x=>x.name===s.subject),type=TYPES.find(x=>x[0]===s.type)||TYPES[0],card=document.createElement('article');card.className='study-set-card';card.innerHTML=`<div class="study-set-icon">${subject?.emoji||type[1]}</div><div class="study-set-main"><div class="study-set-top"><div><h3>${escapeHtml(s.name)}</h3><div class="study-set-meta">${escapeHtml(s.subject)} · ${type[1]} ${type[2]}</div></div><button class="study-delete-button" type="button" aria-label="Delete study set">Delete</button></div>${s.unit?`<div class="study-set-unit">${escapeHtml(s.unit)}</div>`:''}<p>${escapeHtml(s.description||'Ready to add study material.')}</p><div class="study-set-footer"><span>${Array.isArray(s.items)?s.items.length:0} items</span><button class="secondary-button study-open-set" type="button">Open set</button></div></div>`;card.querySelector('.study-delete-button').onclick=()=>deleteSet(s.id);card.querySelector('.study-open-set').onclick=()=>openSet(s.id);list.appendChild(card);});}
  function escapeHtml(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
  window.renderStudy=render;window.openStudySetModal=openModal;window.openStudySet=openSet;
  document.addEventListener('DOMContentLoaded',()=>{ensurePage();ensureModal();ensureSetModal();});
  window.addEventListener('planner-data-changed',render);
})();
