// ========================================
// STUDY QUIZZES — PRACTICE QUIZ SYSTEM
// ========================================
(function(){
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function sets(){return (data().studySets||[]).filter(s=>s&&s.type==='flashcards'&&Array.isArray(s.items)&&s.items.some(c=>c&&(c.front||c.question)&&(c.back||c.answer)));}
  function cards(set){return set.items.filter(c=>c&&(c.front||c.question)&&(c.back||c.answer));}
  function el(id){return document.getElementById(id);}
  function esc(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML;}
  function shuffle(a){return [...a].sort(()=>Math.random()-.5);}

  function ensureQuizSection(){
    const page=el('studyPage'); if(!page||el('studyQuizSection'))return;
    const section=document.createElement('section'); section.id='studyQuizSection'; section.className='card study-quiz-section';
    section.innerHTML='<div class="study-library-header"><div><span class="study-plan-label">Practice</span><h2>Practice Quizzes</h2><p>Turn any flashcard set into a quick quiz and review what you miss.</p></div><button class="save-button" id="studyQuizButton">▶ Build a Quiz</button></div><div class="study-quiz-mini" id="studyQuizMini"></div>';
    const progress=el('studyProgressStats');
    (progress?.closest('section')||page).after(section);
    el('studyQuizButton').onclick=openQuizBuilder;
    renderMini();
  }

  function renderMini(){
    const box=el('studyQuizMini'); if(!box)return;
    const ss=sets();
    if(!ss.length){box.innerHTML='<span class="study-muted">Create a flashcard set to start practicing.</span>';return;}
    const total=ss.reduce((n,s)=>n+cards(s).length,0);
    box.innerHTML='<div><strong>'+ss.length+'</strong><span>quiz-ready sets</span></div><div><strong>'+total+'</strong><span>questions available</span></div><div><strong>3</strong><span>question styles</span></div>';
  }

  function ensureModal(){
    if(el('studyQuizModal'))return;
    const w=document.createElement('div');w.className='modal-overlay';w.id='studyQuizModal';
    w.innerHTML='<div class="modal wide-modal study-quiz-modal"><div class="modal-header"><div><span class="study-plan-label">Practice quiz</span><h2 id="quizModalTitle">Build a quiz</h2></div><button class="close-button" id="quizClose">×</button></div><div id="quizModalBody"></div></div>';
    document.body.appendChild(w);el('quizClose').onclick=closeModal;w.addEventListener('click',e=>{if(e.target===w)closeModal();});
  }
  function closeModal(){el('studyQuizModal')?.classList.remove('open');}

  function openQuizBuilder(){
    ensureModal(); const ss=sets();
    if(!ss.length){alert('Create a flashcard set first.');return;}
    const body=el('quizModalBody');
    body.innerHTML='<div class="form-group"><label for="quizSet">Flashcard set</label><select id="quizSet">'+ss.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+' · '+esc(s.subject)+' ('+cards(s).length+')</option>').join('')+'</select></div><div class="form-row"><div class="form-group"><label for="quizCount">Questions</label><select id="quizCount"><option value="5">5</option><option value="10" selected>10</option><option value="15">15</option><option value="all">All available</option></select></div><div class="form-group"><label for="quizStyle">Question style</label><select id="quizStyle"><option value="mixed">Mixed</option><option value="multiple">Multiple choice</option><option value="truefalse">True / false</option><option value="short">Short answer</option></select></div></div><div class="study-quiz-help"><strong>How it works</strong><p>Questions are generated from your flashcards. Your score and missed questions stay in this session so you can review them at the end.</p></div><div class="modal-actions"><button class="cancel-button" id="quizCancel">Cancel</button><button class="save-button" id="quizStart">Start quiz</button></div>';
    el('quizCancel').onclick=closeModal;el('quizStart').onclick=startQuiz;el('studyQuizModal').classList.add('open');
  }

  let session=null;
  function startQuiz(){
    const set=(sets()).find(s=>String(s.id)===String(el('quizSet').value));if(!set)return;
    const pool=shuffle(cards(set));const raw=el('quizCount').value;const count=raw==='all'?pool.length:Math.min(Number(raw),pool.length);
    session={set,questions:pool.slice(0,count),style:el('quizStyle').value,index:0,score:0,wrong:[]};
    renderQuestion();
  }

  function makeQuestion(card,index){
    const front=card.front||card.question,back=card.back||card.answer;
    let style=session.style;
    if(style==='mixed')style=['multiple','truefalse','short'][index%3];
    if(style==='short'||cards(session.set).length<2)return {type:'short',prompt:front,answer:back};
    if(style==='multiple'){
      const distractors=shuffle(cards(session.set).filter(c=>c!==card)).slice(0,3).map(c=>c.back||c.answer);
      return {type:'multiple',prompt:front,answer:back,options:shuffle([back,...distractors])};
    }
    const isTrue=index%2===0;
    if(isTrue)return {type:'truefalse',prompt:front,answer:back,statement:back,correct:true};
    const other=shuffle(cards(session.set).filter(c=>c!==card))[0];
    return {type:'truefalse',prompt:front,answer:back,statement:other?(other.back||other.answer):back,correct:!other};
  }

  function renderQuestion(){
    const q=makeQuestion(session.questions[session.index],session.index);session.current=q;
    const body=el('quizModalBody');el('quizModalTitle').textContent='Question '+(session.index+1)+' of '+session.questions.length;
    let input='';
    if(q.type==='multiple')input='<div class="quiz-options">'+q.options.map((o,i)=>'<button class="quiz-option" data-value="'+esc(o)+'">'+String.fromCharCode(65+i)+'. '+esc(o)+'</button>').join('')+'</div>';
    else if(q.type==='truefalse')input='<div class="quiz-statement"><strong>True or false?</strong><p>'+esc(q.statement)+'</p></div><div class="quiz-options"><button class="quiz-option" data-value="true">True</button><button class="quiz-option" data-value="false">False</button></div>';
    else input='<div class="form-group"><label for="quizAnswer">Your answer</label><textarea id="quizAnswer" rows="5" placeholder="Type what you remember..."></textarea></div>';
    body.innerHTML='<div class="quiz-progress"><span>'+Math.round((session.index/session.questions.length)*100)+'% complete</span><span>Score: '+session.score+'</span></div><div class="quiz-question"><span class="study-plan-label">Recall</span><h3>'+esc(q.prompt)+'</h3></div>'+input+'<div id="quizFeedback"></div><div class="modal-actions"><button class="cancel-button" id="quizQuit">Quit</button><button class="save-button" id="quizSubmit">Check answer</button></div>';
    el('quizQuit').onclick=closeModal;el('quizSubmit').onclick=()=>checkAnswer(q);
    body.querySelectorAll('.quiz-option').forEach(b=>b.onclick=()=>{body.querySelectorAll('.quiz-option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');});
  }

  function normalize(v){return String(v||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
  function checkAnswer(q){
    let given='',correct=false;
    if(q.type==='short'){given=el('quizAnswer')?.value||'';const a=normalize(given),b=normalize(q.answer);correct=a===b||(a.length>4&&b.includes(a))||(b.length>4&&a.includes(b));}
    else {const selected=document.querySelector('#quizModalBody .quiz-option.selected');if(!selected){alert('Choose an answer first.');return;}given=selected.dataset.value;correct=q.type==='multiple'?normalize(given)===normalize(q.answer):String(given)==='true'===q.correct;}
    if(correct)session.score++;
    else session.wrong.push({question:q.prompt,answer:q.answer,given});
    const feedback=el('quizFeedback');feedback.innerHTML='<div class="quiz-feedback '+(correct?'correct':'incorrect')+'"><strong>'+(correct?'✓ Correct':'Not quite')+'</strong><p>'+(correct?'Nice — keep going.':'Answer: '+esc(q.answer))+'</p></div>';
    el('quizSubmit').textContent=session.index===session.questions.length-1?'Finish':'Next question';el('quizSubmit').onclick=()=>{session.index++;session.index>=session.questions.length?finishQuiz():renderQuestion();};
  }

  function finishQuiz(){
    const total=session.questions.length,percent=Math.round((session.score/total)*100);el('quizModalTitle').textContent='Quiz complete';
    const wrong=session.wrong;
    el('quizModalBody').innerHTML='<div class="quiz-results"><div class="quiz-score"><strong>'+percent+'%</strong><span>'+session.score+' / '+total+' correct</span></div><p>'+(percent>=80?'Great work.':'Use the missed questions as your next review target.')+'</p>'+(wrong.length?'<div class="quiz-review"><h3>Review missed questions</h3>'+wrong.map(w=>'<article><strong>'+esc(w.question)+'</strong><span>Your answer: '+esc(w.given||'No answer')+'</span><span>Correct answer: '+esc(w.answer)+'</span></article>').join('')+'</div>':'<div class="quiz-feedback correct"><strong>Perfect score!</strong><p>Nothing to review this time.</p></div>')+'</div><div class="modal-actions"><button class="cancel-button" id="quizDone">Done</button><button class="save-button" id="quizAgain">Retake quiz</button></div>';
    el('quizDone').onclick=closeModal;el('quizAgain').onclick=openQuizBuilder;
  }

  function init(){ensureQuizSection();renderMini();}
  document.addEventListener('DOMContentLoaded',init);
  window.addEventListener('planner-data-changed',init);
})();