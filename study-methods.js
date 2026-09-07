// ========================================
// STUDY METHODS — ACTIONABLE PLANNER ACTIVITIES
// ========================================
(function(){
  const METHODS=[
    {id:'retrieval',icon:'🧠',name:'Active recall',desc:'Close your notes and retrieve what you know from memory.',action:'Recall the key ideas, formulas, terms, or steps without looking.'},
    {id:'spacing',icon:'📅',name:'Spaced repetition',desc:'Review material again after time has passed.',action:'Review due material, then schedule the next review.'},
    {id:'practice-testing',icon:'📝',name:'Practice testing',desc:'Test yourself with questions or problems before checking answers.',action:'Complete questions independently, then mark and correct your work.'},
    {id:'interleaving',icon:'🔀',name:'Interleaving',desc:'Mix related problem or question types.',action:'Choose mixed problems and decide which approach each one needs.'},
    {id:'self-explanation',icon:'💬',name:'Self-explanation',desc:'Explain why each step or answer makes sense.',action:'Talk or write through your reasoning as if teaching yourself.'},
    {id:'feynman',icon:'🗣️',name:'Feynman technique',desc:'Explain a concept simply, find gaps, and repair them.',action:'Explain it in plain language without notes, then revisit anything unclear.'},
    {id:'blurting',icon:'✍️',name:'Blurting',desc:'Write everything you remember before checking your material.',action:'Brain-dump everything you can remember, then compare and fill gaps.'},
    {id:'worked-examples',icon:'🧩',name:'Worked examples',desc:'Study a solved example and gradually solve independently.',action:'Follow a worked example, cover steps, then solve a similar problem yourself.'},
    {id:'elaboration',icon:'🔎',name:'Elaboration',desc:'Connect new ideas to what you already know.',action:'Ask how, why, when, and what this connects to.'}
  ];
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function subjects(){return (data().settings?.subjects||[]).filter(s=>s&&s.active!==false);}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function plan(subject){const p=data().studyPlans?.[String(subject||'').trim().toLowerCase()]||{};return Array.isArray(p.methods)&&p.methods.length?p.methods:['retrieval','practice-testing','spacing'];}
  function ensurePage(){
    if(document.getElementById('studyMethodsPage'))return;
    const main=document.querySelector('.main');if(!main)return;
    const page=document.createElement('div');page.id='studyMethodsPage';page.className='page-hidden';
    page.innerHTML='<header class="header"><h1>Study Methods</h1><p>Turn the methods in your subject study plans into actual study activities.</p></header><section class="card study-methods-control"><div class="form-group"><label for="methodSubject">Subject</label><select id="methodSubject"></select></div><div id="studyMethodsGrid" class="study-methods-grid"></div></section>';
    main.appendChild(page);populate();
    document.getElementById('methodSubject').onchange=render;
  }
  function ensureNav(){
    if(document.querySelector('[data-page="study-methods"]'))return;
    const sidebar=document.querySelector('.sidebar');if(!sidebar)return;
    const section=document.createElement('div');section.className='nav-section study-methods-nav';section.innerHTML='<div class="nav-title">Study</div><a href="#study-methods" class="nav-item" data-page="study-methods">🧠 Methods</a>';
    section.querySelector('a').onclick=function(e){e.preventDefault();if(typeof showPage==='function')showPage('study-methods');else{document.querySelectorAll("[id$=Page]").forEach(p=>p.classList.add('page-hidden'));document.getElementById('studyMethodsPage')?.classList.remove('page-hidden');}};
    sidebar.appendChild(section);
  }
  function populate(){const s=document.getElementById('methodSubject');if(!s)return;const old=s.value;s.innerHTML=subjects().map(x=>`<option value="${esc(x.name)}">${esc(x.emoji||'📚')} ${esc(x.name)}</option>`).join('');if(old&&subjects().some(x=>x.name===old))s.value=old;}
  function addStudyTask(method,subject){
    const now=new Date().toISOString();const task={id:'ST-'+Date.now().toString(36),name:`${method.name} · ${subject}`,subject,type:'study',priority:'Normal',status:'Not Started',tags:['#Study',`#${method.id}`],createdAt:now,updatedAt:now,studyMethod:method.id,studyInstruction:method.action};
    const x=data();x.tasks=Array.isArray(x.tasks)?x.tasks:[];x.tasks.push(task);if(typeof savePlannerData==='function')savePlannerData();window.dispatchEvent(new Event('planner-data-changed'));if(typeof showPage==='function')showPage('tasks');
  }
  function render(){ensurePage();ensureNav();populate();const s=document.getElementById('methodSubject')?.value,grid=document.getElementById('studyMethodsGrid');if(!grid)return;const chosen=plan(s);grid.innerHTML=METHODS.map(m=>{const active=chosen.includes(m.id);return `<article class="study-method-action ${active?'plan-method':''}"><div class="study-method-action-top"><span class="study-method-action-icon">${m.icon}</span><div><h3>${esc(m.name)}</h3><p>${esc(m.desc)}</p></div></div><div class="study-method-action-body"><span>${esc(m.action)}</span><button class="save-button" data-method="${m.id}" ${s?'':'disabled'}>${active?'Add study task':'Use method'}</button></div></article>`;}).join('');grid.querySelectorAll('[data-method]').forEach(btn=>btn.onclick=()=>{const m=METHODS.find(x=>x.id===btn.dataset.method);if(m)addStudyTask(m,s);});}
  window.renderStudyMethods=render;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(render,100));
  window.addEventListener('planner-data-changed',render);
})();