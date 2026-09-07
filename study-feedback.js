// ========================================
// Study Feedback & History
// ========================================
(function(){
  const KEY='plannerData';
  const read=()=>window.plannerData||JSON.parse(localStorage.getItem(KEY)||'{}');
  const arr=(o,k)=>Array.isArray(o&&o[k])?o[k]:[];
  const date=v=>{const d=new Date(v);return isNaN(d)?null:d};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function history(d){return arr(d,'studyPracticeHistory');}
  function attempts(d){
    return history(d).flatMap(h=>{
      const total=Number(h.total||h.questionCount||arr(h,'questions').length||0);
      const score=Number(h.score??h.correct??0);
      const pct=Number(h.percentage??(total?score/total*100:0));
      return [{...h,total,score,percentage:pct,when:date(h.completedAt||h.createdAt)}];
    });
  }
  function topicStats(d){
    const map={};
    const add=(subject,topic,kind,value,weight)=>{
      if(!topic)return;
      const key=`${subject||'General'}::${topic}`;
      map[key] ||= {subject:subject||'General',topic,reviews:0,masterySum:0,masteryN:0,practiceSum:0,practiceN:0,due:0};
      if(kind==='mastery'){map[key].masterySum+=value;map[key].masteryN+=weight;}
      if(kind==='practice'){map[key].practiceSum+=value;map[key].practiceN+=weight;}
      if(kind==='due')map[key].due+=value;
    };
    arr(d,'studySets').forEach(set=>arr(set,'items').forEach(card=>{
      const topic=card.topic||card.tag||set.topic||set.unit;
      const subject=card.subject||set.subject;
      if(topic){add(subject,topic,'mastery',Number(card.mastery||0),1); if(date(card.dueAt)&&date(card.dueAt)<=new Date())add(subject,topic,'due',1,1);}
    }));
    history(d).forEach(h=>{
      const qs=arr(h,'questions');
      const incorrect=arr(h,'incorrect');
      qs.forEach(q=>{
        const topic=q.topic||q.unit;
        const subject=q.subject||h.subject;
        if(topic){const wasWrong=incorrect.some(x=>(x.id&&q.id&&x.id===q.id)||(x.question&&q.question&&String(x.question).toLowerCase()===String(q.question).toLowerCase()));add(subject,topic,'practice',wasWrong?0:100,1);}
      });
    });
    return Object.values(map).map(x=>{
      const mastery=x.masteryN?x.masterySum/x.masteryN:null;
      const practice=x.practiceN?x.practiceSum/x.practiceN:null;
      let weakness=0;
      if(practice!==null)weakness+=(100-practice)*0.55;
      if(mastery!==null)weakness+=(100-mastery)*0.35;
      weakness+=Math.min(x.due,8)*3;
      let strength=0;
      if(practice!==null)strength+=practice*.55;
      if(mastery!==null)strength+=mastery*.35;
      strength-=Math.min(x.due,8)*3;
      return {...x,mastery,practice,weakness,strength};
    }).sort((a,b)=>b.weakness-a.weakness);
  }
  function summary(d){
    const a=attempts(d), total=a.reduce((n,x)=>n+x.total,0), correct=a.reduce((n,x)=>n+x.score,0);
    const recent=a.filter(x=>x.when).sort((x,y)=>y.when-x.when).slice(0,5);
    const recentAvg=recent.length?recent.reduce((n,x)=>n+x.percentage,0)/recent.length:null;
    const allAvg=total?correct/total*100:null;
    return {attempts:a.length,total,correct,allAvg,recentAvg};
  }
  function ensure(){
    const page=document.getElementById('studyPage')||document.querySelector('.study-page');
    if(!page||document.getElementById('studyFeedbackSection'))return;
    const section=document.createElement('section');section.id='studyFeedbackSection';section.className='study-feedback-section';
    section.innerHTML='<div class="study-feedback-header"><div><div class="eyebrow">Learning feedback</div><h2>Your study history</h2><p>See how your practice is changing and where another review could help.</p></div><button class="secondary" id="studyFeedbackRefresh">Refresh</button></div><div id="studyFeedbackMetrics" class="study-feedback-metrics"></div><div class="study-feedback-columns"><div><h3>Recent performance</h3><div id="studyFeedbackRecent"></div></div><div><h3>Needs attention</h3><div id="studyFeedbackWeak"></div></div></div>';
    page.appendChild(section);
  }
  function render(){
    ensure();
    const section=document.getElementById('studyFeedbackSection');if(!section)return;
    const d=read(),s=summary(d),topics=topicStats(d);
    document.getElementById('studyFeedbackMetrics').innerHTML=`<div><strong>${s.attempts}</strong><span>practice sessions</span></div><div><strong>${s.allAvg===null?'—':Math.round(s.allAvg)+'%'}</strong><span>overall practice</span></div><div><strong>${s.recentAvg===null?'—':Math.round(s.recentAvg)+'%'}</strong><span>recent average</span></div>`;
    const recent=attempts(d).filter(x=>x.when).sort((a,b)=>b.when-a.when).slice(0,6);
    document.getElementById('studyFeedbackRecent').innerHTML=recent.length?recent.map(x=>`<div class="study-feedback-row"><span>${esc(x.name||x.title||'Practice quiz')}</span><strong>${Math.round(x.percentage)}%</strong><small>${x.when.toLocaleDateString()}</small></div>`).join(''):'<p class="study-feedback-empty">Complete a practice quiz to build your history.</p>';
    const weak=topics.filter(x=>x.weakness>20).slice(0,6);
    document.getElementById('studyFeedbackWeak').innerHTML=weak.length?weak.map(x=>{const reason=x.practice!==null?`${Math.round(x.practice)}% practice`:x.mastery!==null?`${Math.round(x.mastery)}% mastery`:'Needs review';return `<button class="study-feedback-topic" data-subject="${esc(x.subject)}" data-topic="${esc(x.topic)}"><span><strong>${esc(x.topic)}</strong><small>${esc(x.subject)} · ${reason}${x.due?` · ${x.due} due`:''}</small></span><span>›</span></button>`}).join(''):'<p class="study-feedback-empty">No major weak topics detected yet.</p>';
    document.querySelectorAll('.study-feedback-topic').forEach(b=>b.addEventListener('click',()=>{sessionStorage.setItem('smartStudySubject',b.dataset.subject);sessionStorage.setItem('smartStudyTopic',b.dataset.topic);location.hash='#study';}));
    const refresh=document.getElementById('studyFeedbackRefresh');if(refresh&&!refresh.dataset.bound){refresh.dataset.bound='1';refresh.addEventListener('click',render);}
  }
  function route(){if(location.hash==='#study')render();}
  window.renderStudyFeedback=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#study')render();});
  window.addEventListener('hashchange',route);
  document.addEventListener('DOMContentLoaded',route);
})();
