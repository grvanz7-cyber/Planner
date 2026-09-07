(()=>{
  const DATA_KEY='plannerData';
  const SETS_KEY='plannerStudySets';
  const data=()=>{
    try{if(typeof plannerData!=='undefined'&&plannerData&&typeof plannerData==='object')return plannerData;}catch(e){}
    if(window.plannerData&&typeof window.plannerData==='object')return window.plannerData;
    try{return JSON.parse(localStorage.getItem(DATA_KEY)||'null')||{};}catch(e){return {};}
  };
  const subjects=()=>data()?.settings?.subjects||[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const units=subject=>{
    if(window.SubjectRoadmap?.get)return window.SubjectRoadmap.get(subject)||[];
    const s=subjects().find(x=>String(x?.name||'').toLowerCase()===String(subject||'').toLowerCase());
    return s?.roadmap||s?.units||[];
  };
  const findUnit=(subject,id)=>units(subject).find(u=>String(u?.id)===String(id));
  const restore=()=>{
    const d=data();
    try{
      const stored=JSON.parse(localStorage.getItem(SETS_KEY)||'[]');
      if(Array.isArray(stored)&&stored.length){
        if(!Array.isArray(d.studySets))d.studySets=[];
        const map=new Map(d.studySets.filter(Boolean).map(s=>[String(s.id),s]));
        stored.forEach(s=>map.set(String(s.id),s));
        d.studySets=[...map.values()];
      }
      window.plannerData=d;
      localStorage.setItem(DATA_KEY,JSON.stringify(d));
    }catch(e){console.error('Study Set restore failed:',e);}
    return d;
  };
  const persist=d=>{
    try{
      const sets=Array.isArray(d.studySets)?d.studySets:[];
      localStorage.setItem(SETS_KEY,JSON.stringify(sets));
      localStorage.setItem(DATA_KEY,JSON.stringify(d));
      if(Array.isArray(d.tasks))localStorage.setItem('plannerTasks',JSON.stringify(d.tasks));
      window.plannerData=d;
      return true;
    }catch(e){console.error('Study Set save failed:',e);return false;}
  };
  const close=id=>document.getElementById(id)?.remove();
  const fillTopics=()=>{
    const s=document.getElementById('studyFixSubject'),u=document.getElementById('studyFixUnit'),t=document.getElementById('studyFixTopic');
    if(!s||!u||!t)return;
    const unit=findUnit(s.value,u.value),lessons=unit?.lessons||[];
    t.innerHTML=!u.value?'<option value="">Choose a unit first</option>':lessons.length?'<option value="">No topic / lesson</option>'+lessons.map(x=>`<option value="${esc(x.id)}">${esc(x.name||x.title||'Untitled lesson')}</option>`).join(''):'<option value="">No topics in this unit</option>';
    t.disabled=!u.value||!lessons.length;
  };
  const fillUnits=()=>{
    const s=document.getElementById('studyFixSubject'),u=document.getElementById('studyFixUnit');
    if(!s||!u)return;
    u.innerHTML='<option value="">No unit / topic</option>'+units(s.value).map(x=>`<option value="${esc(x.id)}">${esc(x.name||x.title||'Untitled unit')}</option>`).join('');
    fillTopics();
  };
  const openEditor=id=>{
    restore();
    const d=data(),set=(d.studySets||[]).find(s=>String(s?.id)===String(id));
    if(!set)return alert('That study set could not be found.');
    close('studyFixEditor');
    const modal=document.createElement('div');modal.id='studyFixEditor';modal.className='modal-overlay';
    modal.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><div><h2>${esc(set.name)}</h2><p>${esc(set.subject)} · ${set.type==='flashcards'?'Flashcards':set.type==='notes'?'Study notes':'Question bank'}</p></div><button type="button" class="close-button" id="studyFixEditorClose">×</button></div><div id="studyFixCards"></div><div class="modal-actions"><button type="button" class="cancel-button" id="studyFixEditorDone">Done</button></div></div>`;
    document.body.appendChild(modal);modal.classList.add('open');
    const cards=modal.querySelector('#studyFixCards');
    const renderCards=()=>{
      const items=Array.isArray(set.items)?set.items:[];
      if(set.type!=='flashcards'){
        cards.innerHTML='<p class="empty-message">This study set type is ready to use, but its editor will be added next.</p>';return;
      }
      cards.innerHTML=`<div class="study-fix-card-list">${items.length?items.map((c,i)=>`<div class="study-fix-card"><div><strong>Card ${i+1}</strong><p>${esc(c.front||'')}</p><small>${esc(c.back||'')}</small>${c.tag?`<span>${esc(c.tag)}</span>`:''}</div><button type="button" data-edit-card="${esc(c.id)}">Edit</button><button type="button" data-delete-card="${esc(c.id)}">Delete</button></div>`).join(''):'<p class="empty-message">No flashcards yet.</p>'}<button type="button" class="save-button" id="studyFixAddCard">+ Add Flashcard</button></div>`;
      cards.querySelectorAll('[data-edit-card]').forEach(b=>b.onclick=()=>cardForm(b.dataset.editCard));
      cards.querySelectorAll('[data-delete-card]').forEach(b=>b.onclick=()=>{set.items=set.items.filter(c=>String(c.id)!==String(b.dataset.deleteCard));set.updatedAt=new Date().toISOString();persist(d);renderCards();});
      cards.querySelector('#studyFixAddCard').onclick=()=>cardForm(null);
    };
    const cardForm=id2=>{
      const card=id2?set.items.find(c=>String(c.id)===String(id2)):null;
      cards.innerHTML=`<div class="form-group"><label>Front / Question</label><textarea id="studyFixFront" rows="4">${esc(card?.front||'')}</textarea></div><div class="form-group"><label>Back / Answer</label><textarea id="studyFixBack" rows="4">${esc(card?.back||'')}</textarea></div><div class="form-group"><label>Tag (optional)</label><input id="studyFixCardTag" value="${esc(card?.tag||'')}"></div><div class="modal-actions"><button type="button" class="cancel-button" id="studyFixCardCancel">Cancel</button><button type="button" class="save-button" id="studyFixCardSave">Save Card</button></div>`;
      cards.querySelector('#studyFixCardCancel').onclick=renderCards;
      cards.querySelector('#studyFixCardSave').onclick=()=>{
        const front=cards.querySelector('#studyFixFront').value.trim(),back=cards.querySelector('#studyFixBack').value.trim();
        if(!front||!back)return alert('Please enter both sides of the flashcard.');
        if(!Array.isArray(set.items))set.items=[];
        const now=new Date().toISOString();
        if(card){card.front=front;card.back=back;card.tag=cards.querySelector('#studyFixCardTag').value.trim();card.updatedAt=now;}
        else set.items.push({id:`C-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,front,back,tag:cards.querySelector('#studyFixCardTag').value.trim(),dueAt:now,createdAt:now});
        set.updatedAt=now;persist(d);renderCards();
      };
    };
    modal.querySelector('#studyFixEditorClose').onclick=()=>close('studyFixEditor');
    modal.querySelector('#studyFixEditorDone').onclick=()=>close('studyFixEditor');
    modal.addEventListener('click',e=>{if(e.target===modal)close('studyFixEditor');});
    renderCards();
  };
  const openNew=()=>{
    close('studyFixModal');
    const list=subjects().filter(s=>s?.active!==false);
    const modal=document.createElement('div');modal.id='studyFixModal';modal.className='modal-overlay';
    modal.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><div><h2>New Study Set</h2><p>Create a study set linked to your subject roadmap.</p></div><button type="button" class="close-button" id="studyFixClose">×</button></div><div class="form-row"><div class="form-group"><label>Name</label><input id="studyFixName" placeholder="e.g. Kinematics Review"></div><div class="form-group"><label>Subject</label><select id="studyFixSubject"><option value="">Choose a subject</option>${list.map(s=>`<option value="${esc(s.name)}">${esc(s.emoji||'📚')} ${esc(s.name)}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-group"><label>Set type</label><select id="studyFixType"><option value="flashcards">🗂️ Flashcards</option><option value="notes">📝 Study notes</option><option value="questions">❓ Question bank</option></select></div><div class="form-group"><label>Unit</label><select id="studyFixUnit"><option value="">No unit / topic</option></select></div></div><div class="form-group"><label>Topic / lesson</label><select id="studyFixTopic" disabled><option value="">Choose a unit first</option></select></div><div class="form-group"><label>Description</label><textarea id="studyFixDescription" rows="3" placeholder="Optional context or study goal"></textarea></div><div class="modal-actions"><button type="button" class="cancel-button" id="studyFixCancel">Cancel</button><button type="button" class="save-button" id="studyFixSave">Create Study Set</button></div></div>`;
    document.body.appendChild(modal);modal.classList.add('open');
    modal.querySelector('#studyFixClose').onclick=()=>close('studyFixModal');
    modal.querySelector('#studyFixCancel').onclick=()=>close('studyFixModal');
    modal.querySelector('#studyFixSubject').onchange=fillUnits;
    modal.querySelector('#studyFixUnit').onchange=fillTopics;
    modal.querySelector('#studyFixSave').onclick=()=>{
      const d=restore(),name=modal.querySelector('#studyFixName').value.trim(),subject=modal.querySelector('#studyFixSubject').value,unitId=modal.querySelector('#studyFixUnit').value,topicId=modal.querySelector('#studyFixTopic').value;
      if(!name)return alert('Please enter a study set name.');if(!subject)return alert('Please choose a subject.');
      const unit=findUnit(subject,unitId),topic=(unit?.lessons||[]).find(x=>String(x.id)===String(topicId)),now=new Date().toISOString();
      if(!Array.isArray(d.studySets))d.studySets=[];
      const set={id:`S-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,subject,type:modal.querySelector('#studyFixType').value,unit:unit?.name||'',unitId:unit?.id||'',roadmapUnitId:unit?.id||'',topic:topic?.name||'',topicId:topic?.id||'',roadmapLessonId:topic?.id||'',description:modal.querySelector('#studyFixDescription').value.trim(),items:[],createdAt:now,updatedAt:now};
      d.studySets.push(set);persist(d);close('studyFixModal');
      window.renderStudy?.();document.dispatchEvent(new CustomEvent('planner-data-changed',{detail:{reason:'study-set-create',setId:set.id}}));
    };
    modal.addEventListener('click',e=>{if(e.target===modal)close('studyFixModal');});
    fillUnits();modal.querySelector('#studyFixName')?.focus();
  };
  restore();
  window.openStudySet=openEditor;
  window.openStudySetModal=openNew;
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#studyAddButton');
    if(b){e.preventDefault();e.stopImmediatePropagation();openNew();}
  },true);
})();
