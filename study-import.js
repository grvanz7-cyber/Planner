// STUDY IMPORT — quick flashcard creation
(function(){
  function el(id){return document.getElementById(id);}
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function ensureData(){if(!Array.isArray(data().studySets))data().studySets=[];}
  function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
  function flashcardSets(){return (data().studySets||[]).filter(s=>s&&s.type==='flashcards');}
  function ensureModal(){
    if(el('studyImportModal'))return;
    const w=document.createElement('div');w.className='modal-overlay';w.id='studyImportModal';
    w.innerHTML='<div class="modal wide-modal study-import-modal"><div class="modal-header"><div><span class="study-plan-label">⚡ Quick import</span><h2>Import flashcards</h2></div><button class="close-button" id="studyImportClose">×</button></div><div class="study-import-help"><strong>Paste your cards below</strong><span>One card per line: <code>question[TAB]answer</code>. You can paste directly from Quizlet or from a set formatted by ChatGPT.</span></div><div class="form-group"><label for="studyImportSet">Add to</label><select id="studyImportSet"></select></div><div class="form-group"><label for="studyImportText">Flashcards</label><textarea id="studyImportText" rows="14" spellcheck="false" placeholder="What is acceleration?\tThe rate of change of velocity.\nWhat is the SI unit of force?\tNewton (N)\n..."></textarea></div><div class="study-import-options"><label><input type="checkbox" id="studyImportSkipBlank" checked> Ignore blank lines</label><span id="studyImportCount">0 cards detected</span></div><div class="modal-actions"><button class="cancel-button" id="studyImportCancel">Cancel</button><button class="save-button" id="studyImportButton">Import cards</button></div></div>';
    document.body.appendChild(w);
    el('studyImportClose').onclick=close;
    el('studyImportCancel').onclick=close;
    el('studyImportButton').onclick=importCards;
    el('studyImportText').oninput=updateCount;
    w.addEventListener('click',e=>{if(e.target===w)close();});
  }
  function populate(preferredId){
    const s=el('studyImportSet');if(!s)return;
    const sets=flashcardSets();s.innerHTML=sets.length?sets.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.subject?' · '+esc(x.subject):''}</option>`).join(''):'<option value="">No flashcard sets yet</option>';
    if(preferredId&&sets.some(x=>String(x.id)===String(preferredId)))s.value=preferredId;
  }
  function parse(text){
    return text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{
      let parts=line.split('\t');
      if(parts.length<2)parts=line.split('::');
      if(parts.length<2)parts=line.split('|');
      if(parts.length<2){const m=line.match(/^(.+?)\s+-\s+(.+)$/);if(m)parts=[m[1],m[2]];}
      return parts.length>=2?{front:parts.shift().trim(),back:parts.join('\t').trim()}:null;
    }).filter(x=>x&&x.front&&x.back);
  }
  function updateCount(){const n=parse(el('studyImportText')?.value||'').length;if(el('studyImportCount'))el('studyImportCount').textContent=n+' card'+(n===1?'':'s')+' detected';}
  function open(preferredId){ensureData();ensureModal();populate(preferredId);el('studyImportText').value='';updateCount();el('studyImportModal').classList.add('open');el('studyImportText').focus();}
  function close(){el('studyImportModal')?.classList.remove('open');}
  function importCards(){
    ensureData();const d=data(),set=(d.studySets||[]).find(x=>String(x.id)===String(el('studyImportSet')?.value));
    if(!set)return alert('Create a flashcard set first.');
    const cards=parse(el('studyImportText')?.value||'');
    if(!cards.length)return alert('I could not find any complete flashcards. Put the question and answer on the same line, separated by a tab.');
    if(!Array.isArray(set.items))set.items=[];
    const now=new Date().toISOString();
    cards.forEach(card=>set.items.push({id:`C-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,front:card.front,back:card.back,tag:'',dueAt:now,createdAt:now,reviewCount:0,mastery:0}));
    set.updatedAt=now;
    if(typeof savePlannerData==='function')savePlannerData();
    close();
    if(typeof window.openStudySet==='function')window.openStudySet(set.id);else if(typeof window.renderStudy==='function')window.renderStudy();
  }
  function addButtons(){
    const page=document.getElementById('studyPage');if(!page)return;
    const header=page.querySelector('.study-page-header');
    if(header&&!el('studyImportLibraryButton')){const b=document.createElement('button');b.id='studyImportLibraryButton';b.className='secondary-button';b.textContent='⇩ Import Flashcards';b.onclick=()=>open();const add=el('studyAddButton');if(add&&add.parentNode)add.parentNode.insertBefore(b,add);else header.appendChild(b);}
    page.querySelectorAll('.study-set-card').forEach(card=>{
      if(card.querySelector('.study-import-set-button'))return;
      const openBtn=card.querySelector('.study-open-set');
      const title=card.querySelector('h3')?.textContent?.trim();
      const set=flashcardSets().find(s=>s.name===title);
      if(!set||!openBtn)return;
      const b=document.createElement('button');b.type='button';b.className='secondary-button study-import-set-button';b.textContent='Import';b.onclick=()=>open(set.id);openBtn.parentNode.insertBefore(b,openBtn);
    });
  }
  function wrap(name){
    const original=window[name];
    if(typeof original!=='function'||original.__studyImportWrapped)return;
    const wrapped=function(){const result=original.apply(this,arguments);addButtons();return result;};
    wrapped.__studyImportWrapped=true;window[name]=wrapped;
  }
  function init(){ensureModal();addButtons();wrap('renderStudy');wrap('openStudySet');}
  document.addEventListener('DOMContentLoaded',init);
  window.addEventListener('planner-data-changed',()=>setTimeout(addButtons,0));
  window.openStudyImport=open;
})();
