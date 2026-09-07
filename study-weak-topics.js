// ========================================
// Study Weak Topics
// ========================================
(function(){
  const A=v=>Array.isArray(v)?v:[];
  const d=()=>window.plannerData||{};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function collect(){
    const p=d(), map={};
    const add=(subject,topic,score,weight=1)=>{
      subject=subject||'General';topic=(topic||'General').trim()||'General';
      const key=subject+'\u0000'+topic;
      map[key]??={subject,topic,total:0,weight:0,wrong:0};
      map[key].total+=score*weight;map[key].weight+=weight;if(score<70)map[key].wrong+=weight;
    };
    A(p.studyPracticeHistory).forEach(h=>{
      const qs=A(h.questions||h.questionResults||h.items);
      if(qs.length){qs.forEach(q=>{const score=typeof q.score==='number'?q.score:(q.correct?100:0);add(q.subject||h.subject,q.topic||q.unit,score,1);});}
      else if(typeof h.percentage==='number'||typeof h.score==='number') add(h.subject,h.topic,h.percentage??h.score,1);
    });
    A(p.questionBank).forEach(q=>{if(q.lastScore!=null)add(q.subject,q.topic,Number(q.lastScore),2);});
    A(p.studySets).forEach(s=>A(s.items).forEach(c=>{if(c.mastery!=null)add(s.subject,c.tag||s.unit,Number(c.mastery),1);}));
    return Object.values(map).map(x=>({...x,mastery:Math.round(x.total/Math.max(1,x.weight)),need:Math.round(100-x.total/Math.max(1,x.weight))})).filter(x=>x.mastery<80).sort((a,b)=>(a.mastery-b.mastery)||(b.wrong-a.wrong));
  }
  function render(){
    const page=document.getElementById('studyPage');if(!page)return;
    let box=document.getElementById('weakTopics');if(!box){box=document.createElement('section');box.id='weakTopics';box.className='weak-topics';page.appendChild(box)}
    const rows=collect().slice(0,8);
    box.innerHTML='<div class="weak-topics-head"><div><h2>Topics needing attention</h2><p>These areas have lower recorded mastery or practice performance. Use them as focused study targets.</p></div></div>'+(rows.length?'<div class="weak-topic-list">'+rows.map(x=>'<div class="weak-topic"><div><strong>'+esc(x.topic)+'</strong><small>'+esc(x.subject)+' · '+x.wrong+' weaker result'+(x.wrong===1?'':'s')+'</small></div><div class="weak-topic-score">'+x.mastery+'%</div><button data-subject="'+esc(x.subject)+'" data-topic="'+esc(x.topic)+'">Study</button></div>').join('')+'</div>':'<div class="weak-topics-empty">No weak topics detected yet. More practice and reviews will make this section more useful.</div>');
    box.querySelectorAll('button[data-topic]').forEach(btn=>btn.onclick=()=>{sessionStorage.setItem('smartStudySubject',btn.dataset.subject);sessionStorage.setItem('smartStudyTopic',btn.dataset.topic);location.hash='#study';});
  }
  window.renderStudyWeakTopics=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#study')render()});
  window.addEventListener('hashchange',()=>{if(location.hash==='#study')render()});
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#study')render()});
})();
