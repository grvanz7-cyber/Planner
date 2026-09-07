// ========================================
// Smart Study Method Routing
// ========================================
(function(){
  const A=v=>Array.isArray(v)?v:[];
  const data=()=>window.plannerData||{};
  const METHODS={
    retrieval:{name:'Active recall',action:'Recall what you know without looking at your notes, then check and correct gaps.'},
    spacing:{name:'Spaced repetition',action:'Review due material, rate your recall, and schedule the next review.'},
    'practice-testing':{name:'Practice testing',action:'Answer practice questions without notes, then check your work.'},
    interleaving:{name:'Interleaving',action:'Mix related problems or topics so you have to choose the right approach.'},
    'self-explanation':{name:'Self-explanation',action:'Explain each step or idea in your own words and identify why it works.'},
    feynman:{name:'Feynman technique',action:'Explain the topic simply as if teaching someone new to it, then identify gaps.'},
    blurting:{name:'Blurting',action:'Write everything you can remember from memory, then compare with your materials.'},
    'worked-examples':{name:'Worked examples',action:'Study an example, cover the solution, and reproduce the reasoning independently.'},
    elaboration:{name:'Elaboration',action:'Ask how, why, and what-it-connects-to questions to deepen understanding.'}
  };
  const fallback=['retrieval','practice-testing','spacing','self-explanation'];
  function methodFor(subject,type,index){
    const plans=data().studyPlans||{};
    const p=plans[subject];
    let methods=p&&Array.isArray(p.methods)?p.methods.filter(x=>METHODS[x]):[];
    if(!methods.length) methods=fallback;
    if(type==='review'&&methods.includes('spacing')) return 'spacing';
    if(type==='review') return methods.includes('retrieval')?'retrieval':methods[0];
    return methods[index%methods.length];
  }
  function enhance(){
    const results=document.getElementById('adaptiveResults');if(!results)return;
    results.querySelectorAll('.adaptive-item').forEach((el,i)=>{
      const small=el.querySelector('small');
      if(!small||el.dataset.methodReady)return;
      const parts=small.textContent.split(' · ');
      const subject=parts[0]||'General';
      const type=el.textContent.includes('🔁')?'review':'task';
      const key=methodFor(subject,type,i);
      const m=METHODS[key];
      if(!m)return;
      small.textContent=parts.join(' · ')+' · '+m.name;
      el.title=m.action;
      el.dataset.methodReady='1';
    });
  }
  function addMethodSummary(){
    const page=document.getElementById('smartStudyPage');if(!page)return;
    let box=document.getElementById('studyMethodRouting');
    if(!box){box=document.createElement('div');box.id='studyMethodRouting';box.className='study-method-routing';page.appendChild(box)}
    const plans=data().studyPlans||{};
    const subjects=A(data().settings&&data().settings.subjects).filter(s=>s.active!==false).map(s=>s.name||s.subject).filter(Boolean);
    const names=subjects.length?subjects:[...new Set(Object.keys(plans))];
    box.innerHTML='<h2>Study method routing</h2><p>Your saved study plan now guides how Smart Study approaches each subject.</p><div class="method-routing-grid">'+names.map(s=>{const p=plans[s];const ms=p&&Array.isArray(p.methods)?p.methods.filter(x=>METHODS[x]):fallback;return '<div class="method-routing-card"><strong>'+String(s).replace(/[<>]/g,'')+'</strong><span>'+ms.slice(0,4).map(x=>METHODS[x].name).join(' · ')+'</span></div>'}).join('')+'</div>';
  }
  function render(){addMethodSummary();setTimeout(enhance,50)}
  window.renderSmartStudyMethods=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#smart')render()});
  window.addEventListener('hashchange',()=>{if(location.hash==='#smart')render()});
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#smart')render()});
})();
