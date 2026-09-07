/* Practice enhancements: interleaving, targeted review, and question-bank authoring. */
(function(){
  'use strict';
  const KEY='plannerData';
  const get=()=>JSON.parse(localStorage.getItem(KEY)||'{}');
  const save=d=>{localStorage.setItem(KEY,JSON.stringify(d));window.dispatchEvent(new CustomEvent('planner-data-changed'));};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

  function bank(){const d=get();return Array.isArray(d.questionBank)?d.questionBank:[]}
  function addQuestion(){
    const d=get(); d.questionBank=Array.isArray(d.questionBank)?d.questionBank:[];
    const subjects=(d.settings?.subjects||[]).filter(s=>s&&s.active!==false);
    const overlay=document.createElement('div');overlay.className='modal-overlay study-practice-overlay';overlay.style.display='flex';
    overlay.innerHTML='<div class="modal study-practice-modal"><div class="modal-header"><h2>New practice question</h2><button class="close-button" id="qClose">×</button></div><div class="form-group"><label>Question</label><textarea id="qText" rows="4" placeholder="Write the question..."></textarea></div><div class="form-row"><div class="form-group"><label>Type</label><select id="qType"><option value="short-answer">Short answer</option><option value="multiple-choice">Multiple choice</option><option value="true-false">True / False</option></select></div><div class="form-group"><label>Subject</label><select id="qSubject"><option value="">General</option>'+subjects.map(s=>'<option value="'+esc(s.name)+'">'+esc(s.emoji||'📚')+' '+esc(s.name)+'</option>').join('')+'</select></div></div><div class="form-group"><label>Answer</label><input id="qAnswer" placeholder="Correct answer"></div><div class="form-group"><label>Explanation <small>(optional)</small></label><textarea id="qExplanation" rows="3" placeholder="Why is this the answer?"></textarea></div><div class="form-group"><label>Unit / topic <small>(optional)</small></label><input id="qTopic" placeholder="Unit 2 · Kinematics"></div><div id="qOptionsWrap" class="form-group" style="display:none"><label>Choices <small>(one per line)</small></label><textarea id="qOptions" rows="4" placeholder="Choice A\nChoice B\nChoice C\nChoice D"></textarea></div><div class="modal-actions"><button class="cancel-button" id="qCancel">Cancel</button><button class="save-button" id="qSave">Add question</button></div></div>';
    document.body.appendChild(overlay);
    const type=overlay.querySelector('#qType'), opts=overlay.querySelector('#qOptionsWrap'); type.onchange=()=>opts.style.display=type.value==='multiple-choice'?'block':'none';
    const close=()=>overlay.remove(); overlay.querySelector('#qClose').onclick=close; overlay.querySelector('#qCancel').onclick=close;
    overlay.querySelector('#qSave').onclick=()=>{const q=overlay.querySelector('#qText').value.trim(),a=overlay.querySelector('#qAnswer').value.trim();if(!q||!a)return alert('Add both a question and an answer.');const item={id:'Q-'+Date.now(),question:q,answer:a,explanation:overlay.querySelector('#qExplanation').value.trim(),type:type.value,subject:overlay.querySelector('#qSubject').value,topic:overlay.querySelector('#qTopic').value.trim(),options:overlay.querySelector('#qOptions').value.split('\n').map(x=>x.trim()).filter(Boolean),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};d.questionBank.unshift(item);save(d);close();window.renderStudyPractice&&window.renderStudyPractice()};
  }

  function interleavedPractice(){
    const d=get(); const qs=bank(); if(qs.length<2)return alert('Add at least two practice questions first.');
    const byTopic={}; qs.forEach(q=>{const k=(q.subject||'General')+' · '+(q.topic||'Mixed');(byTopic[k]??=[]).push(q)});
    const groups=Object.values(byTopic); let pool=[]; let changed=true; while(changed){changed=false;for(const g of groups){if(g.length){pool.push(g.shift());changed=true}}}
    pool=shuffle(pool.slice(0,20));
    const quiz={id:'PQ-I-'+Date.now(),name:'Interleaved Practice',subject:'',items:pool,questions:pool.map(q=>q.id),interleaved:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    d.studyQuizzes=Array.isArray(d.studyQuizzes)?d.studyQuizzes:[];d.studyQuizzes.unshift(quiz);save(d);window.openPracticeQuiz?window.openPracticeQuizWithQuiz(quiz):runFallback(quiz);
  }

  function runFallback(quiz){
    let i=0,score=0;const answers=[];const o=document.createElement('div');o.className='modal-overlay study-practice-overlay';o.style.display='flex';document.body.appendChild(o);
    function render(){const q=quiz.items[i],choices=q.type==='true-false'?['True','False']:(q.type==='multiple-choice'?q.options:[]);o.innerHTML='<div class="modal study-practice-modal"><div class="modal-header"><h2>'+esc(quiz.name)+'</h2><button class="close-button" id="x">×</button></div><div class="practice-progress">'+(i+1)+' of '+quiz.items.length+'</div><div class="practice-question"><h3>'+esc(q.question)+'</h3>'+(choices.length?'<div class="practice-options">'+choices.map(c=>'<button class="practice-option" data-a="'+esc(c)+'">'+esc(c)+'</button>').join('')+'</div>':'<textarea id="a" rows="4" placeholder="Answer from memory..."></textarea>')+'<div id="f"></div><button class="save-button" id="s">Check answer</button></div></div>';o.querySelector('#x').onclick=()=>o.remove();o.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>submit(b.dataset.a));o.querySelector('#s').onclick=()=>submit(o.querySelector('#a')?.value||'')}
    function submit(v){const q=quiz.items[i],ok=String(v).trim().toLowerCase()===String(q.answer).trim().toLowerCase();if(ok)score++;answers.push({question:q.question,given:v,correct:ok,expected:q.answer});o.querySelector('#f').innerHTML='<div class="practice-feedback '+(ok?'correct':'incorrect')+'"><strong>'+(ok?'✓ Correct':'Review this one')+'</strong><div>Answer: '+esc(q.answer)+'</div></div>';const s=o.querySelector('#s');s.textContent=i===quiz.items.length-1?'See results':'Next';s.onclick=()=>{if(i===quiz.items.length-1){o.remove()}else{i++;render()}}}
    render();
  }

  function addControls(){
    const page=document.getElementById('studyPracticePage'); if(!page||page.querySelector('.practice-extra-actions'))return;
    const toolbar=page.querySelector('.study-practice-toolbar'); if(!toolbar)return;
    const wrap=document.createElement('div');wrap.className='practice-extra-actions';wrap.innerHTML='<button class="cancel-button" id="addPracticeQuestion">+ Question</button><button class="cancel-button" id="interleavePractice">🔀 Interleaved quiz</button>';toolbar.appendChild(wrap);
    wrap.querySelector('#addPracticeQuestion').onclick=addQuestion;wrap.querySelector('#interleavePractice').onclick=interleavedPractice;
  }
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(addControls,1000);});
  window.addEventListener('planner-data-changed',addControls);
  window.renderStudyPracticeEnhancements=addControls;
})();
