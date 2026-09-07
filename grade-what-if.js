// ========================================
// GRADE WHAT-IF CALCULATOR
// ========================================
(function(){
  const CATS=['Knowledge','Communication','Thinking','Application'];
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function grades(){return Array.isArray(data().gradeAssessments)?data().gradeAssessments:[];}
  function average(rows){let total=0,weight=0;rows.forEach(r=>{const p=Number(r.percent);const w=Number(r.weight)>0?Number(r.weight):1;if(Number.isFinite(p)){total+=p*w;weight+=w;}});return weight?total/weight:null;}
  function course(subject){
    const d=data(), settings=d.gradeSettings?.[subject]||{knowledge:25,communication:25,thinking:25,application:25};
    const all=grades().filter(g=>g.subject===subject),cw=all.filter(g=>g.portion==='coursework'),cu=all.filter(g=>g.portion==='culminating');
    const cat={};
    CATS.forEach(c=>{const rows=[];cw.forEach(a=>{const cats=a.categories||[], overall=cats.find(x=>x.category==='Overall'), mark=overall||cats.find(x=>x.category===c);if(mark)rows.push({percent:mark.percent,weight:a.weight});});cat[c]=average(rows);});
    let total=0,used=0;CATS.forEach(c=>{const w=Number(settings[c.toLowerCase()])||0;if(cat[c]!=null&&w>0){total+=cat[c]*w;used+=w;}});
    const coursework=used?total/used:null;
    const culminating=average(cu.map(a=>{const rows=a.categories||[];return{percent:rows.length?rows.reduce((s,x)=>s+Number(x.percent||0),0)/rows.length:null,weight:a.weight};}).filter(x=>x.percent!=null));
    return{coursework,culminating,projected:coursework!=null&&culminating!=null?coursework*.7+culminating*.3:null};
  }
  function addButton(){
    const header=document.querySelector('#gradesPage .grades-header-actions');
    if(!header||header.querySelector('.grade-what-if-header-button'))return;
    const b=document.createElement('button');b.type='button';b.className='secondary-button grade-what-if-header-button';b.textContent='What-if Calculator';b.onclick=()=>open();header.insertBefore(b,header.lastElementChild);
  }
  function open(){
    const subjects=(data().settings?.subjects||[]).filter(s=>s&&s.active!==false);
    let modal=document.querySelector('#gradeWhatIfModal');
    if(!modal){modal=document.createElement('div');modal.className='modal-overlay';modal.id='gradeWhatIfModal';document.body.appendChild(modal);}
    const first=subjects[0]?.name||'';
    modal.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><div><h2>Grade What-if Calculator</h2><p>See what you need to reach a target final grade.</p></div><button class="close-button" type="button">×</button></div><div class="form-row"><div class="form-group"><label for="whatIfSubject">Subject</label><select id="whatIfSubject">${subjects.map(s=>`<option value="${s.name}">${s.emoji||'📚'} ${s.name}</option>`).join('')}</select></div><div class="form-group"><label for="whatIfTarget">Target final grade</label><div class="percentage-input"><input id="whatIfTarget" type="number" min="0" max="100" step="0.1" placeholder="90"><span>%</span></div></div></div><div id="whatIfCurrent" class="grade-what-if-current"></div><div id="whatIfResult" class="grade-what-if-result"></div><div class="modal-actions"><button class="cancel-button" type="button">Close</button></div></div>`;
    modal.classList.add('open');
    const subject=modal.querySelector('#whatIfSubject'),target=modal.querySelector('#whatIfTarget'),current=modal.querySelector('#whatIfCurrent'),result=modal.querySelector('#whatIfResult');
    subject.value=first;
    function calculate(){
      const d=course(subject.value),fmt=v=>v==null?'—':v.toFixed(1)+'%';
      current.innerHTML=`<div><span>Coursework</span><strong>${fmt(d.coursework)}</strong></div><div><span>Culminating</span><strong>${fmt(d.culminating)}</strong></div><div><span>Projected final</span><strong>${fmt(d.projected)}</strong></div>`;
      const t=Number(target.value);
      if(!Number.isFinite(t)||t<0||t>100){result.textContent='Enter a target between 0% and 100%.';return;}
      if(d.coursework!=null&&d.culminating==null){const need=(t-d.coursework*.7)/.3;result.innerHTML=need<=100?`You need <strong>${need.toFixed(1)}%</strong> on your culminating work to finish with ${t.toFixed(1)}%.`:`You would need <strong>${need.toFixed(1)}%</strong> on your culminating work, which is above 100%.`;
      }else if(d.coursework==null&&d.culminating!=null){const need=(t-d.culminating*.3)/.7;result.innerHTML=need<=100?`You need <strong>${need.toFixed(1)}%</strong> in coursework to finish with ${t.toFixed(1)}%.`:`You would need <strong>${need.toFixed(1)}%</strong> in coursework, which is above 100%.`;
      }else if(d.coursework!=null&&d.culminating!=null){result.innerHTML=`Your current projected final is <strong>${d.projected.toFixed(1)}%</strong>. Both portions already have grades, so there isn't a missing portion to solve for.`;
      }else{result.textContent='Add at least one grade first to calculate a target.';}
    }
    subject.onchange=calculate;target.oninput=calculate;
    const close=()=>modal.classList.remove('open');modal.querySelector('.close-button').onclick=close;modal.querySelector('.cancel-button').onclick=close;modal.onclick=e=>{if(e.target===modal)close();};
    calculate();target.focus();
  }
  window.openGradeWhatIf=open;
  window.addGradeWhatIfButton=addButton;
  const original=window.renderGrades;
  if(typeof original==='function'){window.renderGrades=function(){original();addButton();};}
  document.addEventListener('planner-data-changed',addButton);
  document.addEventListener('click',e=>{if(e.target?.closest?.('.grade-what-if-header-button'))open();});
  addButton();
  const style=document.createElement('style');style.textContent='.grade-what-if-current{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.grade-what-if-current>div{padding:14px;border-radius:12px;background:var(--surface-secondary,#f7f5f1);text-align:center}.grade-what-if-current span{display:block;font-size:12px;color:var(--muted-text,#777);margin-bottom:5px}.grade-what-if-current strong{font-size:20px}.grade-what-if-result{padding:16px;border-radius:12px;background:var(--surface-secondary,#f7f5f1);margin-top:14px;min-height:24px}.grade-what-if-result strong{font-size:20px}';document.head.appendChild(style);
})();
