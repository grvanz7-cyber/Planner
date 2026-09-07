// ========================================
// Study Intelligence Loop
// Connects weak areas -> study actions -> practice/review.
// ========================================
(function(){
  const KEY='plannerData';
  const read=()=>window.plannerData||JSON.parse(localStorage.getItem(KEY)||'{}');
  const arr=(v)=>Array.isArray(v)?v:[];
  const date=v=>{const d=new Date(v);return isNaN(d)?null:d;};

  function buildTopics(d){
    const map={};
    const ensure=(subject,topic)=>{
      subject=String(subject||'').trim(); topic=String(topic||'General').trim()||'General';
      if(!subject)return null;
      const key=subject+'\u0000'+topic;
      if(!map[key])map[key]={subject,topic,cards:0,due:0,masterySum:0,reviews:0,practiceTotal:0,practiceCorrect:0,incorrect:0};
      return map[key];
    };
    arr(d.studySets).forEach(set=>{
      const subject=set.subject||'';
      arr(set.items).forEach(card=>{
        if(!card.front)return;
        const topic=card.topic||card.unit||card.tag||set.unit||'General';
        const x=ensure(subject,topic); if(!x)return;
        x.cards++; x.masterySum+=Number(card.mastery)||0; x.reviews+=Number(card.reviewCount)||0;
        const due=date(card.dueAt); if(!due||due<=new Date())x.due++;
      });
    });
    arr(d.questionBank).forEach(q=>{const x=ensure(q.subject,q.topic||q.unit||'General'); if(x)x.practiceTotal++;});
    arr(d.studyPracticeHistory).forEach(h=>{
      arr(h.questions||h.items||h.answers).forEach(q=>{
        const x=ensure(q.subject||h.subject,q.topic||q.unit||h.topic||'General'); if(!x)return;
        const correct=q.correct===true||q.isCorrect===true||q.result==='correct';
        if(correct)x.practiceCorrect++; else x.incorrect++;
        if(q.attempted||q.correct!==undefined||q.isCorrect!==undefined)x.practiceTotal++;
      });
      arr(h.incorrect).forEach(q=>{const x=ensure(q.subject||h.subject,q.topic||q.unit||h.topic||'General');if(x)x.incorrect++;});
    });
    return Object.values(map).map(x=>{
      x.mastery=x.cards?Math.round(x.masterySum/x.cards):null;
      x.accuracy=x.practiceTotal?Math.round((x.practiceCorrect/x.practiceTotal)*100):null;
      let score=0;
      if(x.accuracy!==null)score+=(100-x.accuracy)*0.55;
      if(x.mastery!==null)score+=(100-x.mastery)*0.30;
      score+=Math.min(x.due*6,30);
      score+=Math.min(x.incorrect*4,20);
      x.weakScore=Math.round(score);
      x.weak=x.weakScore>=35 && (x.accuracy===null || x.accuracy<80 || x.mastery===null || x.mastery<80 || x.due>0);
      x.strong=x.weakScore<20 && (x.accuracy===null || x.accuracy>=85) && (x.mastery===null || x.mastery>=85) && x.due===0;
      return x;
    }).filter(x=>x.cards||x.practiceTotal||x.incorrect);
  }

  function action(topic,mode){
    sessionStorage.setItem('smartStudySubject',topic.subject);
    sessionStorage.setItem('smartStudyTopic',topic.topic);
    sessionStorage.setItem('smartStudyMode',mode||'review');
    location.hash=mode==='practice'?'#practice':'#study';
  }

  function render(){
    const page=document.getElementById('studyPage'); if(!page)return;
    let section=document.getElementById('studyIntelligenceSection');
    if(!section){
      section=document.createElement('section'); section.id='studyIntelligenceSection'; section.className='study-intelligence-section';
      const anchor=page.querySelector('.study-library-card')||page.firstElementChild; if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(section,anchor.nextSibling); else page.appendChild(section);
    }
    const topics=buildTopics(read()).sort((a,b)=>b.weakScore-a.weakScore);
    const weak=topics.filter(x=>x.weak).slice(0,5), strong=topics.filter(x=>x.strong).slice(0,4);
    const reason=x=>{
      const r=[]; if(x.accuracy!==null&&x.accuracy<80)r.push(`${x.accuracy}% practice accuracy`); if(x.mastery!==null&&x.mastery<80)r.push(`${x.mastery}% card mastery`); if(x.due)r.push(`${x.due} card${x.due===1?'':'s'} due`); if(x.incorrect)r.push(`${x.incorrect} recent misses`); return r.slice(0,2).join(' · ')||'Needs another review pass';
    };
    section.innerHTML=`<div class="study-intelligence-header"><div><div class="eyebrow">Learning loop</div><h2>What needs attention?</h2><p>Use your recent reviews and practice results to decide what to study next.</p></div><div class="study-intelligence-count">${weak.length} weak · ${strong.length} strong</div></div><div class="study-intelligence-grid"><div><h3>Focus next</h3><div class="study-intelligence-list">${weak.length?weak.map((x,i)=>`<div class="study-intelligence-card weak"><div><strong>${x.topic}</strong><small>${x.subject} · ${reason(x)}</small></div><button class="secondary" data-intel-action="${i}" data-intel-mode="${x.accuracy!==null&&x.accuracy<75?'practice':'review'}">${x.accuracy!==null&&x.accuracy<75?'Practice':'Review'}</button></div>`).join(''):'<div class="study-intelligence-empty">No clear weak areas yet. Keep studying and the planner will learn from your results.</div>'}</div></div><div><h3>Looking strong</h3><div class="study-intelligence-list">${strong.length?strong.map(x=>`<div class="study-intelligence-card strong"><div><strong>${x.topic}</strong><small>${x.subject} · ${x.mastery!==null?x.mastery+'% mastery':'strong recent performance'}</small></div><span>✓</span></div>`).join(''):'<div class="study-intelligence-empty">Strong areas will appear after enough review data is available.</div>'}</div></div></div>`;
    section.querySelectorAll('[data-intel-action]').forEach(b=>b.addEventListener('click',()=>{const x=weak[+b.dataset.intelAction];if(x)action(x,b.dataset.intelMode);}));
  }

  function route(){if(location.hash==='#study')setTimeout(render,0);}
  window.renderStudyIntelligence=render;
  window.getStudyIntelligence=()=>buildTopics(read());
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#study')render();});
  window.addEventListener('hashchange',route);
  document.addEventListener('DOMContentLoaded',route);
})();
