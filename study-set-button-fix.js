// ========================================
// STUDY SET BUTTON FIX + PRACTICE QUIZZES
// Keeps the Study Set modal independent from load-order issues.
// Practice quizzes live here so PWA/index.html remain untouched.
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

  // ----------------------------------------
  // Practice quizzes — isolated from page rendering
  // ----------------------------------------
  function quizSets(){return (data().studySets||[]).filter(s=>s&&s.type==='flashcards'&&Array.isArray(s.items)&&s.items.some(c=>c&&(c.front||c.question)&&(c.back||c.answer)));}
  function quizCards(set){return (set.items||[]).filter(c=>c&&(c.front||c.question)&&(c.back||c.answer));}
  function shuffle(a){return [...a].sort(()=>Math.random()-.5);}
  function ensureQuizSection(){
    const page=document.getElementById('studyPage');
    if(!page||document.getElementById('studyQuizSection'))return;
    const section=document.createElement('section');
    section.id='studyQuizSection';
    section.className='card study-quiz-section';
    section.innerHTML='<div class="study-library-header"><div><span class="study-plan-label">Practice</span><h2>Practice Quizzes</h2><p>Turn a flashcard set into a quick quiz and review what you miss.</p></div><button type="button" class="save-button" id="studyQuizButton">▶ Build a Quiz</button></div><div class="study-quiz-mini" id="studyQuizMini"></div>';
    const progress=document.getElementById('studyProgressStats');
    (progress?.closest('section')||page).after(section);
    document.getElementById('studyQuizButton').onclick=openQuizBuilder;
    renderQuizMini();
  }
  function renderQuizMini(){
    const box=document.getElementById('studyQuizMini');if(!box)return;
    const sets=quizSets();
    if(!sets.length){box.innerHTML='<span class="study-muted">Create a flashcard set to start practicing.</span>';return;}
    const total=sets.reduce((n,s)=>n+quizCards(s).length,0);
    box.innerHTML='<div><strong>'+sets.length+'</strong><span>quiz-ready sets</span></div><div><strong>'+total+'</strong><span>questions available</span></div><div><strong>3</strong><span>question styles</span></div>';
  }
  function ensureQuizModal(){
    if(document.getElementById('studyQuizModal'))return;
    const w=document.createElement('div');w.className='modal-overlay';w.id='studyQuizModal';
    w.innerHTML='<div class="modal wide-modal study-quiz-modal"><div class="modal-header"><div><span class="study-plan-label">Practice quiz</span><h2 id="quizModalTitle">Build a quiz</h2></div><button type="button" class="close-button" id="quizClose">×</button></div><div id="quizModalBody"></div></div>';
    document.body.appendChild(w);
    document.getElementById('quizClose').onclick=closeQuizModal;
    w.addEventListener('click',e=>{if(e.target===w)closeQuizModal();});
  }
  function closeQuizModal(){document.getElementById('studyQuizModal')?.classList.remove('open');}
  function openQuizBuilder(){
    ensureQuizModal();
    const sets=quizSets();
    if(!sets.length){alert('Create a flashcard set first.');return;}
    const body=document.getElementById('quizModalBody');
    body.innerHTML='<div class="form-group"><label for="quizSet">Flashcard set</label><select id="quizSet">'+sets.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+' · '+esc(s.subject)+' ('+quizCards(s).length+')</option>').join('')+'</select></div><div class="form-row"><div class="form-group"><label for="quizCount">Questions</label><select id="quizCount"><option value="5">5</option><option value="10" selected>10</option><option value="15">15</option><option value="all">All available</option></select></div><div class="form-group"><label for="quizStyle">Question style</label><select id="quizStyle"><option value="mixed">Mixed</option><option value="multiple">Multiple choice</option><option value="truefalse">True / false</option><option value="short">Short answer</option></select></div></div><div class="study-quiz-help"><strong>How it works</strong><p>Questions are generated from your flashcards. Your score and missed questions stay in this session so you can review them at the end.</p></div><div class="modal-actions"><button type="button" class="cancel-button" id="quizCancel">Cancel</button><button type="button" class="save-button" id="quizStart">Start quiz</button></div>';
    document.getElementById('quizCancel').onclick=closeQuizModal;
    document.getElementById('quizStart').onclick=startQuiz;
    document.getElementById('studyQuizModal').classList.add('open');
  }
  let quizSession=null;
  function startQuiz(){
    const set=quizSets().find(s=>String(s.id)===String(document.getElementById('quizSet').value));if(!set)return;
    const pool=shuffle(quizCards(set));const raw=document.getElementById('quizCount').value;const count=raw==='all'?pool.length:Math.min(Number(raw),pool.length);
    quizSession={set,questions:pool.slice(0,count),style:document.getElementById('quizStyle').value,index:0,score:0,wrong:[],answered:false};
    renderQuizQuestion();
  }
  function makeQuizQuestion(card,index){
    const front=card.front||card.question,back=card.back||card.answer;let style=quizSession.style;
    if(style==='mixed')style=['multiple','truefalse','short'][index%3];
    if(style==='short'||quizCards(quizSession.set).length<2)return {type:'short',prompt:front,answer:back};
    if(style==='multiple'){
      const distractors=shuffle(quizCards(quizSession.set).filter(c=>c!==card)).slice(0,3).map(c=>c.back||c.answer);
      return {type:'multiple',prompt:front,answer:back,options:shuffle([back,...distractors])};
    }
    const other=shuffle(quizCards(quizSession.set).filter(c=>c!==card))[0];
    if(index%2===0)return {type:'truefalse',prompt:front,answer:back,statement:back,correct:true};
    return {type:'truefalse',prompt:front,answer:back,statement:other?(other.back||other.answer):back,correct:!!other?false:true};
  }
  function renderQuizQuestion(){
    const q=makeQuizQuestion(quizSession.questions[quizSession.index],quizSession.index);quizSession.current=q;quizSession.answered=false;
    const body=document.getElementById('quizModalBody'),total=quizSession.questions.length;
    document.getElementById('quizModalTitle').textContent='Question '+(quizSession.index+1)+' of '+total;
    let input='';
    if(q.type==='multiple')input='<div class="quiz-options">'+q.options.map((o,i)=>'<button type="button" class="quiz-option" data-value="'+esc(o)+'">'+String.fromCharCode(65+i)+'. '+esc(o)+'</button>').join('')+'</div>';
    else if(q.type==='truefalse')input='<div class="quiz-statement"><strong>True or false?</strong><p>'+esc(q.statement)+'</p></div><div class="quiz-options"><button type="button" class="quiz-option" data-value="true">True</button><button type="button" class="quiz-option" data-value="false">False</button></div>';
    else input='<div class="form-group"><label for="quizAnswer">Your answer</label><textarea id="quizAnswer" rows="5" placeholder="Type what you remember..."></textarea></div>';
    body.innerHTML='<div class="quiz-progress"><span>'+Math.round((quizSession.index/total)*100)+'% complete</span><span>Score: '+quizSession.score+'</span></div><div class="quiz-question"><span class="study-plan-label">Recall</span><h3>'+esc(q.prompt)+'</h3></div>'+input+'<div id="quizFeedback"></div><div class="modal-actions"><button type="button" class="cancel-button" id="quizQuit">Quit</button><button type="button" class="save-button" id="quizSubmit">Check answer</button></div>';
    document.getElementById('quizQuit').onclick=closeQuizModal;
    document.getElementById('quizSubmit').onclick=()=>checkQuizAnswer(q);
    body.querySelectorAll('.quiz-option').forEach(b=>b.onclick=()=>{body.querySelectorAll('.quiz-option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');});
  }
  function normalize(v){return String(v||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
  function checkQuizAnswer(q){
    if(quizSession.answered)return;
    let given='',correct=false;
    if(q.type==='short'){
      given=document.getElementById('quizAnswer')?.value||'';const a=normalize(given),b=normalize(q.answer);
      correct=a===b||(a.length>4&&b.includes(a))||(b.length>4&&a.includes(b));
    }else{
      const selected=document.querySelector('#quizModalBody .quiz-option.selected');if(!selected){alert('Choose an answer first.');return;}
      given=selected.dataset.value;correct=q.type==='multiple'?normalize(given)===normalize(q.answer):((String(given)==='true')===q.correct);
    }
    quizSession.answered=true;if(correct)quizSession.score++;else quizSession.wrong.push({question:q.prompt,answer:q.answer,given});
    const feedback=document.getElementById('quizFeedback');feedback.innerHTML='<div class="quiz-feedback '+(correct?'correct':'incorrect')+'"><strong>'+(correct?'✓ Correct':'Not quite')+'</strong><p>'+(correct?'Nice — keep going.':'Answer: '+esc(q.answer))+'</p></div>';
    const button=document.getElementById('quizSubmit');button.textContent=quizSession.index===quizSession.questions.length-1?'Finish':'Next question';button.onclick=()=>{quizSession.index++;quizSession.index>=quizSession.questions.length?finishQuiz():renderQuizQuestion();};
  }
  function finishQuiz(){
    const total=quizSession.questions.length,percent=total?Math.round((quizSession.score/total)*100):0,wrong=quizSession.wrong;
    document.getElementById('quizModalTitle').textContent='Quiz complete';
    document.getElementById('quizModalBody').innerHTML='<div class="quiz-results"><div class="quiz-score"><strong>'+percent+'%</strong><span>'+quizSession.score+' / '+total+' correct</span></div><p>'+(percent>=80?'Great work.':'Use the missed questions as your next review target.')+'</p>'+(wrong.length?'<div class="quiz-review"><h3>Review missed questions</h3>'+wrong.map(w=>'<article><strong>'+esc(w.question)+'</strong><span>Your answer: '+esc(w.given||'No answer')+'</span><span>Correct answer: '+esc(w.answer)+'</span></article>').join('')+'</div>':'<div class="quiz-feedback correct"><strong>Perfect score!</strong><p>Nothing to review this time.</p></div>')+'</div><div class="modal-actions"><button type="button" class="cancel-button" id="quizDone">Done</button><button type="button" class="save-button" id="quizAgain">Retake quiz</button></div>';
    document.getElementById('quizDone').onclick=closeQuizModal;document.getElementById('quizAgain').onclick=openQuizBuilder;
  }

  function wire(){
    const old=document.getElementById('studyAddButton');
    if(old){const button=old.cloneNode(true);old.replaceWith(button);button.addEventListener('click',openModal);window.openStudySetModal=openModal;}
    ensureQuizSection();renderQuizMini();
  }
  function init(){wire();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);
  window.addEventListener('planner-data-changed',init);
})();
