// ========================================
// Study Analytics
// ========================================
(function(){
  const A=v=>Array.isArray(v)?v:[];
  const d=()=>window.plannerData||{};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function stats(){
    const p=d(), sets=A(p.studySets), cards=sets.flatMap(s=>A(s.items).map(c=>({...c,subject:s.subject||'General',set:s.name||'Study set'})));
    const history=A(p.studyPracticeHistory), reviews=cards.reduce((n,c)=>n+Number(c.reviewCount||0),0);
    const mastered=cards.filter(c=>Number(c.mastery||0)>=80).length;
    const due=cards.filter(c=>c.dueAt&&new Date(c.dueAt)<=new Date()).length;
    const accuracy=history.length?Math.round(history.reduce((n,x)=>n+Number(x.score||x.percentage||0),0)/history.length):0;
    const by={};cards.forEach(c=>{by[c.subject]??={cards:0,reviews:0,mastered:0,due:0};by[c.subject].cards++;by[c.subject].reviews+=Number(c.reviewCount||0);if(Number(c.mastery||0)>=80)by[c.subject].mastered++;if(c.dueAt&&new Date(c.dueAt)<=new Date())by[c.subject].due++;});
    return {sets:sets.length,cards:cards.length,reviews,mastered,due,accuracy,history:history.length,by};
  }
  function render(){
    const page=document.getElementById('studyPage');if(!page)return;
    let box=document.getElementById('studyAnalytics');if(!box){box=document.createElement('section');box.id='studyAnalytics';box.className='study-analytics';page.appendChild(box)}
    const s=stats(), rows=Object.entries(s.by).sort((a,b)=>(b[1].due-a[1].due)||(b[1].reviews-a[1].reviews));
    box.innerHTML='<div class="study-analytics-head"><div><h2>Study analytics</h2><p>See your review activity, mastery, practice performance, and areas needing attention.</p></div></div><div class="study-analytics-metrics"><div><strong>'+s.cards+'</strong><span>Cards</span></div><div><strong>'+s.reviews+'</strong><span>Reviews</span></div><div><strong>'+s.mastered+'</strong><span>Mastered</span></div><div><strong>'+s.due+'</strong><span>Due</span></div><div><strong>'+s.accuracy+'%</strong><span>Practice accuracy</span></div></div><div class="study-analytics-subjects">'+(rows.length?rows.map(([name,x])=>{const pct=x.cards?Math.round(x.mastered/x.cards*100):0;return '<div class="study-analytics-row"><div><strong>'+esc(name)+'</strong><small>'+x.cards+' cards · '+x.reviews+' reviews · '+x.due+' due</small></div><div class="study-analytics-bar"><i style="width:'+pct+'%"></i></div><b>'+pct+'%</b></div>'}).join(''):'<div class="study-analytics-empty">Study activity will appear here as you build and review material.</div>')+'</div>';
  }
  window.renderStudyAnalytics=render;
  document.addEventListener('planner-data-changed',()=>{if(location.hash==='#study')render()});
  window.addEventListener('hashchange',()=>{if(location.hash==='#study')render()});
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#study')render()});
})();
