// ========================================
// GRADES PAGE — ONTARIO-STYLE 70/30 TRACKER
// ========================================
(function(){
  window.__gradesPageLoaded = true;
  const CATEGORIES = ['Knowledge','Communication','Thinking','Application'];
  const LEVELS = ['0','1-','1','1+','2-','2','2+','3-','3','3+','4-','4','4+','4++'];

  function el(id){ return document.getElementById(id); }
  function activeSubjects(){ return (plannerData?.settings?.subjects || []).filter(s=>s && s.active !== false); }
  function ensureData(){
    if(!plannerData.grades) plannerData.grades=[];
    if(!plannerData.gradeSettings) plannerData.gradeSettings={};
    if(!plannerData.gradeAssessments) plannerData.gradeAssessments=[];
    activeSubjects().forEach(s=>{
      if(!plannerData.gradeSettings[s.name]) plannerData.gradeSettings[s.name]={knowledge:25,communication:25,thinking:25,application:25};
    });
  }

  function ensurePage(){
    if(el('gradesPage')) return;
    const page=document.createElement('div');
    page.id='gradesPage'; page.className='page-hidden';
    page.innerHTML=`
      <header class="header grades-page-header">
        <div><h1>Grades</h1><p>Track the 70% coursework and 30% culminating portion of each course.</p></div>
        <div class="grades-header-actions"><button class="secondary-button" type="button" id="gradeSettingsButton">Course Setup</button><button class="save-button" type="button" id="gradeAddButton">+ Add Grade</button></div>
      </header>
      <div class="grade-filters"><select id="gradeSubjectFilter"><option value="">All subjects</option></select></div>
      <div id="gradeSubjects" class="grade-subjects"></div>`;
    document.querySelector('.main')?.appendChild(page);
    el('gradeAddButton').onclick=openGradeModal;
    el('gradeSettingsButton').onclick=openCourseSettings;
    el('gradeSubjectFilter').onchange=renderGrades;
  }

  function ensureModal(){
    if(el('gradeModal')) return;
    const wrap=document.createElement('div'); wrap.className='modal-overlay'; wrap.id='gradeModal';
    wrap.innerHTML=`<div class="modal grade-modal wide-modal">
      <div class="modal-header"><h2>Add Grade</h2><button class="close-button" type="button" id="gradeClose">×</button></div>
      <div class="form-group"><label for="gradeName">Name</label><input id="gradeName" type="text" placeholder="e.g. Unit 2 Test, Lab 3, Presentation"></div>
      <div class="form-row"><div class="form-group"><label for="gradeSubject">Subject</label><select id="gradeSubject"></select></div><div class="form-group"><label for="gradePeriod">Portion</label><select id="gradePeriod"><option value="coursework">Coursework — 70%</option><option value="culminating">Culminating — 30%</option></select></div></div>
      <div class="form-row"><div class="form-group"><label for="gradeItemWeight">Weight within portion <span class="field-hint">optional</span></label><div class="percentage-input"><input id="gradeItemWeight" type="number" min="0" max="100" step="0.1" placeholder="e.g. 10"><span>%</span></div></div><div class="form-group"><label for="gradeNotes">Notes <span class="field-hint">optional</span></label><input id="gradeNotes" type="text" placeholder="Teacher notes, unit, etc."></div></div>
      <div class="grade-entry-mode"><label><input type="radio" name="gradeMode" value="categories" checked> Category breakdown</label><label><input type="radio" name="gradeMode" value="total"> One total mark</label></div>
      <div id="categoryGradeBox" class="category-grade-box"></div>
      <div id="totalGradeBox" class="total-grade-box" style="display:none"></div>
      <div class="modal-actions"><button class="cancel-button" type="button" id="gradeCancel">Cancel</button><button class="save-button" type="button" id="gradeSave">Add Grade</button></div>
    </div>`;
    document.body.appendChild(wrap);
    el('gradeClose').onclick=closeGradeModal; el('gradeCancel').onclick=closeGradeModal; el('gradeSave').onclick=createGrade;
    wrap.addEventListener('click',e=>{if(e.target===wrap)closeGradeModal();});
    wrap.querySelectorAll('input[name="gradeMode"]').forEach(r=>r.onchange=renderGradeInputMode);
  }

  function ensureCourseModal(){
    if(el('courseSettingsModal')) return;
    const wrap=document.createElement('div');wrap.className='modal-overlay';wrap.id='courseSettingsModal';
    wrap.innerHTML=`<div class="modal wide-modal"><div class="modal-header"><h2>Course Grade Setup</h2><button class="close-button" type="button" id="courseClose">×</button></div><p class="modal-help">Coursework is 70% of the final grade and the culminating portion is 30%. Set how the 70% is divided among the four achievement categories for this subject.</p><div class="form-group"><label for="courseSubject">Subject</label><select id="courseSubject"></select></div><div class="category-settings-grid">${CATEGORIES.map(c=>`<div class="category-setting"><label for="catWeight${c}">${c}</label><div class="percentage-input"><input id="catWeight${c}" type="number" min="0" max="100" step="0.1"><span>% of coursework</span></div></div>`).join('')}</div><div class="course-total"><span>Category total</span><strong id="categoryWeightTotal">100%</strong></div><div class="modal-actions"><button class="cancel-button" type="button" id="courseCancel">Cancel</button><button class="save-button" type="button" id="courseSave">Save Setup</button></div></div>`;
    document.body.appendChild(wrap);
    el('courseClose').onclick=closeCourseSettings;el('courseCancel').onclick=closeCourseSettings;el('courseSave').onclick=saveCourseSettings;
    el('courseSubject').onchange=loadCourseSettings;
    CATEGORIES.forEach(c=>el('catWeight'+c).oninput=updateCategoryTotal);
    wrap.addEventListener('click',e=>{if(e.target===wrap)closeCourseSettings();});
  }

  function populateSubjects(selectId, includeAll){
    const s=el(selectId);if(!s)return;const cur=s.value;s.innerHTML=includeAll?'<option value="">All subjects</option>':'<option value="">Choose a subject</option>';
    activeSubjects().forEach(x=>{const o=document.createElement('option');o.value=x.name||'';o.textContent=`${x.emoji||'📚'} ${x.name||''}`;s.appendChild(o);});
    if([...s.options].some(o=>o.value===cur))s.value=cur;
  }

  function populateGradeSubjects(){populateSubjects('gradeSubject',false);}
  function populateFilter(){populateSubjects('gradeSubjectFilter',true);}

  function parsePointValue(value){
    const m=String(value||'').trim().match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if(!m)return null;const earned=Number(m[1]),possible=Number(m[2]);
    if(!Number.isFinite(earned)||!Number.isFinite(possible)||possible<=0)return null;
    return {earned,possible,percent:Math.max(0,Math.min(100,earned/possible*100))};
  }
  function levelPercent(level){
    const map={'0':0,'1-':45,'1':50,'1+':55,'2-':60,'2':65,'2+':70,'3-':75,'3':80,'3+':85,'4-':90,'4':95,'4+':97.5,'4++':100};
    return map[String(level||'').trim()] ?? null;
  }
  function categoryInput(c){
    return `<div class="category-grade-row"><div class="category-name"><strong>${c}</strong><small>Achievement category</small></div><select class="category-format" data-category="${c}"><option value="points">Points (x/x)</option><option value="level">Level (0–4++)</option></select><div class="category-value"><input class="category-points" data-category="${c}" type="text" placeholder="e.g. 17/20"><select class="category-level" data-category="${c}" style="display:none">${LEVELS.map(l=>`<option value="${l}">${l}</option>`).join('')}</select></div><button type="button" class="category-remove" data-category="${c}" title="Leave this category blank">—</button></div>`;
  }
  function renderGradeInputs(){
    const box=el('categoryGradeBox');if(!box)return;box.innerHTML=`<div class="category-grade-heading"><strong>Achievement categories</strong><span>Leave unused categories blank.</span></div>${CATEGORIES.map(categoryInput).join('')}`;
    box.querySelectorAll('.category-format').forEach(s=>s.onchange=()=>{const c=s.dataset.category;const p=box.querySelector('.category-points[data-category="'+c+'"]');const l=box.querySelector('.category-level[data-category="'+c+'"]');const level=s.value==='level';p.style.display=level?'none':'block';l.style.display=level?'block':'none';});
  }
  function renderTotalInput(){
    el('totalGradeBox').innerHTML=`<div class="total-grade-fields"><div class="form-group"><label for="gradeTotalValue">Mark</label><input id="gradeTotalValue" type="text" placeholder="e.g. 17/20 or 3+"></div><div class="form-group"><label for="gradeTotalFormat">Format</label><select id="gradeTotalFormat"><option value="points">Points (x/x)</option><option value="level">Level (0–4++)</option></select></div></div>`;
  }
  function renderGradeInputMode(){const mode=document.querySelector('input[name="gradeMode"]:checked')?.value||'categories';el('categoryGradeBox').style.display=mode==='categories'?'block':'none';el('totalGradeBox').style.display=mode==='total'?'block':'none';}

  function openGradeModal(){ensureData();ensureModal();populateGradeSubjects();renderGradeInputs();renderTotalInput();el('gradeName').value='';el('gradeSubject').value='';el('gradePeriod').value='coursework';el('gradeItemWeight').value='';el('gradeNotes').value='';document.querySelector('input[name="gradeMode"][value="categories"]').checked=true;renderGradeInputMode();el('gradeModal').classList.add('open');el('gradeName').focus();}
  function closeGradeModal(){el('gradeModal')?.classList.remove('open');}

  function readMark(format,value){
    if(format==='level'){const p=levelPercent(value);return p==null?null:{display:value,percent:p,kind:'level'};}
    const p=parsePointValue(value);return p?{display:`${p.earned}/${p.possible}`,percent:p.percent,kind:'points',earned:p.earned,possible:p.possible}:null;
  }
  function createGrade(){
    ensureData();const name=el('gradeName').value.trim(),subject=el('gradeSubject').value,portion=el('gradePeriod').value,weight=el('gradeItemWeight').value===''?null:Number(el('gradeItemWeight').value),notes=el('gradeNotes').value.trim();
    if(!name){alert('Please enter a grade name.');return;}if(!subject){alert('Please choose a subject.');return;}if(weight!==null&&(!Number.isFinite(weight)||weight<0||weight>100)){alert('Weight must be between 0 and 100.');return;}
    const mode=document.querySelector('input[name="gradeMode"]:checked')?.value||'categories';let categories=[];
    if(mode==='categories'){
      CATEGORIES.forEach(c=>{const fmt=el('categoryGradeBox').querySelector('.category-format[data-category="'+c+'"]')?.value;const raw=fmt==='level'?el('categoryGradeBox').querySelector('.category-level[data-category="'+c+'"]')?.value:el('categoryGradeBox').querySelector('.category-points[data-category="'+c+'"]')?.value.trim();if(raw){const parsed=readMark(fmt,raw);if(!parsed)throw new Error(`Invalid ${c} mark`);categories.push({category:c,...parsed});}});
      if(!categories.length){alert('Enter at least one category mark.');return;}
    }else{
      const fmt=el('gradeTotalFormat').value,raw=el('gradeTotalValue').value.trim(),parsed=readMark(fmt,raw);if(!parsed){alert('Enter a valid mark such as 17/20 or a level such as 3+.');return;}categories=[{category:'Overall',...parsed}];
    }
    plannerData.gradeAssessments.push({id:Date.now(),name,subject,portion,weight,notes,categories,createdAt:new Date().toISOString()});
    // Keep compatibility with existing task/grade data without pretending this is a simple 0-100 grade.
    savePlannerData();closeGradeModal();renderGrades();
  }

  function calcCategory(entries){
    if(!entries.length)return null;
    const points=entries.filter(x=>x.kind==='points'&&Number.isFinite(x.earned)&&Number.isFinite(x.possible)&&x.possible>0);
    const levels=entries.filter(x=>x.kind==='level'&&Number.isFinite(x.percent));
    if(points.length && !levels.length){const earned=points.reduce((a,x)=>a+x.earned,0),possible=points.reduce((a,x)=>a+x.possible,0);return possible?earned/possible*100:null;}
    return entries.reduce((a,x)=>a+Number(x.percent||0),0)/entries.length;
  }
  function courseSettings(subject){const s=plannerData.gradeSettings?.[subject];return s||{knowledge:25,communication:25,thinking:25,application:25};}
  function calcCourse(subject){
    const settings=courseSettings(subject),assessments=plannerData.gradeAssessments.filter(a=>a.subject===subject&&a.portion==='coursework');const cats={};CATEGORIES.forEach(c=>{cats[c]=[];});
    assessments.forEach(a=>a.categories.forEach(r=>{if(cats[r.category])cats[r.category].push(r);}));
    let coursework=0,used=0;CATEGORIES.forEach(c=>{const avg=calcCategory(cats[c]);const w=Number(settings[c.toLowerCase()]||0);if(avg!=null&&w>0){coursework+=avg*w;used+=w;}});const courseworkPct=used?coursework/used:null;
    const final=plannerData.gradeAssessments.filter(a=>a.subject===subject&&a.portion==='culminating');let finalTotal=0,finalWeight=0;final.forEach(a=>{const avg=calcCategory(a.categories);if(avg!=null){const w=a.weight!=null&&a.weight>0?a.weight:1;finalTotal+=avg*w;finalWeight+=w;}});const culminating=finalWeight?finalTotal/finalWeight:null;
    const projected=courseworkPct!=null&&culminating!=null?courseworkPct*.7+culminating*.3:courseworkPct!=null?courseworkPct*.7:culminating!=null?culminating*.3:null;
    return {settings,cats,courseworkPct,culminating,projected,assessments,final};
  }

  function renderGrades(){
    ensureData();const list=el('gradeSubjects');if(!list)return;populateFilter();const filter=el('gradeSubjectFilter')?.value||'';const subjects=activeSubjects().filter(s=>!filter||s.name===filter);list.innerHTML='';
    subjects.forEach(s=>{const data=calcCourse(s.name),section=document.createElement('section');section.className='grade-subject';const catCards=CATEGORIES.map(c=>{const avg=calcCategory(data.cats[c]);const w=Number(data.settings[c.toLowerCase()]||0);return `<div class="grade-category"><div><strong>${c}</strong><small>${w}% of coursework</small></div><span>${avg==null?'—':avg.toFixed(1)+'%'}</span></div>`;}).join('');
      const coursework=data.courseworkPct==null?'—':data.courseworkPct.toFixed(1)+'%';const culminating=data.culminating==null?'—':data.culminating.toFixed(1)+'%';const projected=data.projected==null?'—':data.projected.toFixed(1)+'%';
      section.innerHTML=`<div class="grade-subject-head"><div class="grade-subject-title"><span class="grade-subject-icon">${s.emoji||'📚'}</span><div><h2>${s.name}</h2><small>${data.assessments.length} coursework item${data.assessments.length===1?'':'s'} • ${data.final.length} culminating item${data.final.length===1?'':'s'}</small></div></div><strong class="grade-average">${projected}</strong></div><div class="grade-breakdown"><div class="grade-breakdown-heading"><strong>Coursework — 70%</strong><span>${coursework}</span></div><div class="grade-category-grid">${catCards}</div><div class="grade-progress"><span style="width:${data.courseworkPct==null?0:Math.max(0,Math.min(100,data.courseworkPct))}%"></span></div><div class="grade-breakdown-heading culminating"><strong>Culminating — 30%</strong><span>${culminating}</span></div></div><div class="grade-assessment-list"></div>`;
      const box=section.querySelector('.grade-assessment-list');[...data.assessments,...data.final].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).forEach(a=>{const avg=calcCategory(a.categories),details=a.categories.map(r=>`${r.category}: ${r.display}`).join(' • ');const row=document.createElement('div');row.className='grade-assessment-row';row.innerHTML=`<div><strong></strong><small></small></div><span></span><button type="button" aria-label="Delete grade">×</button>`;row.querySelector('strong').textContent=a.name;row.querySelector('small').textContent=`${a.portion==='coursework'?'Coursework':'Culminating'}${a.weight!=null?' • '+a.weight+'% within portion':''} • ${details}`;row.querySelector('span').textContent=avg==null?'—':avg.toFixed(1)+'%';row.querySelector('button').onclick=()=>deleteAssessment(a.id);box.appendChild(row);});
      list.appendChild(section);
    });
    if(!subjects.length)list.innerHTML='<div class="empty-grades">No active subjects found. Add a subject first.</div>';
  }
  function deleteAssessment(id){if(!confirm('Delete this grade?'))return;plannerData.gradeAssessments=plannerData.gradeAssessments.filter(a=>a.id!==id);savePlannerData();renderGrades();}

  function openCourseSettings(){ensureData();ensureCourseModal();populateSubjects('courseSubject',false);if(!el('courseSubject').value)el('courseSubject').value=activeSubjects()[0]?.name||'';loadCourseSettings();el('courseSettingsModal').classList.add('open');}
  function closeCourseSettings(){el('courseSettingsModal')?.classList.remove('open');}
  function loadCourseSettings(){const subject=el('courseSubject')?.value;if(!subject)return;const s=courseSettings(subject);CATEGORIES.forEach(c=>el('catWeight'+c).value=Number(s[c.toLowerCase()]??25));updateCategoryTotal();}
  function updateCategoryTotal(){const total=CATEGORIES.reduce((a,c)=>a+(Number(el('catWeight'+c)?.value)||0),0);el('categoryWeightTotal').textContent=total.toFixed(1)+'%';el('categoryWeightTotal').classList.toggle('invalid',Math.abs(total-100)>.01);}
  function saveCourseSettings(){const subject=el('courseSubject').value;if(!subject)return;const vals={};let total=0;CATEGORIES.forEach(c=>{const v=Number(el('catWeight'+c).value)||0;vals[c.toLowerCase()]=v;total+=v;});if(Math.abs(total-100)>.01){alert('The four category weights must add up to 100% of coursework.');return;}plannerData.gradeSettings[subject]=vals;savePlannerData();closeCourseSettings();renderGrades();}

  function installStyles(){if(el('gradesStyles'))return;const s=document.createElement('style');s.id='gradesStyles';s.textContent=`.grades-page-header{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;margin-bottom:20px}.grades-header-actions{display:flex;gap:10px;flex-wrap:wrap}.secondary-button{border:1px solid var(--border-color,#e6e1da);background:var(--card-bg,#fff);padding:10px 16px;border-radius:10px;cursor:pointer;font:inherit}.grade-filters{display:flex;gap:14px;margin-bottom:22px}.grade-filters select{min-width:210px}.grade-subjects{display:grid;gap:18px}.grade-subject{border:1px solid var(--border-color,#e6e1da);border-radius:18px;padding:20px;background:var(--card-bg,#fff)}.grade-subject-head{display:flex;justify-content:space-between;align-items:center;gap:16px}.grade-subject-title{display:flex;align-items:center;gap:12px}.grade-subject-icon{font-size:27px}.grade-subject-title h2{margin:0;font-size:19px}.grade-subject-title small,.grade-category small{color:var(--muted-text,#777)}.grade-average{font-size:28px}.grade-breakdown{margin-top:18px}.grade-breakdown-heading{display:flex;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid var(--border-color,#e6e1da);font-size:15px}.grade-breakdown-heading span{font-weight:700}.grade-category-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}.grade-category{border:1px solid var(--border-color,#e6e1da);border-radius:12px;padding:12px;display:flex;justify-content:space-between;gap:8px}.grade-category strong,.grade-category small{display:block}.grade-category span{font-weight:700}.grade-progress{height:8px;background:#0000000d;border-radius:99px;margin:14px 0 20px}.grade-progress span{display:block;height:100%;border-radius:99px;background:#7fa58a}.grade-breakdown-heading.culminating{margin-top:4px}.grade-assessment-list{margin-top:18px}.grade-assessment-row{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center;padding:12px 0;border-top:1px solid var(--border-color,#e6e1da)}.grade-assessment-row strong,.grade-assessment-row small{display:block}.grade-assessment-row small{font-size:12px;color:var(--muted-text,#777);margin-top:3px}.grade-assessment-row>span{font-weight:700}.grade-assessment-row button,.category-remove{border:0;background:transparent;color:#999;font-size:20px;cursor:pointer}.wide-modal{max-width:760px}.modal-help{color:var(--muted-text,#777);margin-top:-8px}.category-settings-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.category-setting{padding:14px;border:1px solid var(--border-color,#e6e1da);border-radius:12px}.category-setting label{display:block;font-weight:600;margin-bottom:8px}.percentage-input{display:flex;align-items:center;position:relative}.percentage-input input{width:100%;padding-right:110px}.percentage-input span{position:absolute;right:12px;color:var(--muted-text,#777);pointer-events:none;font-size:12px}.course-total{display:flex;justify-content:space-between;margin-top:14px;padding:12px;border-radius:10px;background:#00000006}.course-total strong.invalid{color:#b91c1c}.grade-entry-mode{display:flex;gap:20px;margin:12px 0 16px;padding:12px;border-radius:10px;background:#00000005}.grade-entry-mode label{display:flex;gap:7px;align-items:center}.category-grade-box{border:1px solid var(--border-color,#e6e1da);border-radius:14px;overflow:hidden}.category-grade-heading{display:flex;justify-content:space-between;padding:12px 14px;background:#00000005;font-size:13px}.category-grade-heading span{color:var(--muted-text,#777)}.category-grade-row{display:grid;grid-template-columns:1.3fr 1.1fr 1fr auto;gap:10px;align-items:center;padding:12px 14px;border-top:1px solid var(--border-color,#e6e1da)}.category-name small{display:block;color:var(--muted-text,#777);font-size:11px;margin-top:2px}.category-value input,.category-value select{width:100%}.total-grade-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field-hint{font-size:11px;color:var(--muted-text,#777)}.empty-grades{text-align:center;padding:45px;color:var(--muted-text,#777)}@media(max-width:800px){.grade-category-grid{grid-template-columns:repeat(2,1fr)}.category-grade-row{grid-template-columns:1fr 1fr}.category-value{grid-column:2}.category-remove{grid-column:1}.grades-page-header{flex-direction:column}.category-settings-grid,.total-grade-fields{grid-template-columns:1fr}}@media(max-width:520px){.grade-category-grid{grid-template-columns:1fr}.grade-assessment-row{grid-template-columns:1fr auto}.grade-assessment-row button{grid-column:3}.category-grade-row{grid-template-columns:1fr}.category-value{grid-column:auto}.category-remove{grid-column:auto;text-align:left}}`;document.head.appendChild(s);}

  window.renderGrades=renderGrades;window.openGradeModal=openGradeModal;window.closeGradeModal=closeGradeModal;window.openCourseSettings=openCourseSettings;window.closeCourseSettings=closeCourseSettings;window.createGrade=createGrade;
  function install(){ensureData();ensurePage();ensureModal();ensureCourseModal();installStyles();const nav=[...document.querySelectorAll('.nav-item')].find(a=>a.textContent.includes('Grades'));if(nav){nav.dataset.page='grades';nav.href='#grades';nav.onclick=()=>{showPage('grades');return false;};}if(window.location.hash.toLowerCase()==='#grades'&&typeof showPage==='function')showPage('grades',false);}
  install();document.addEventListener('DOMContentLoaded',install);window.addEventListener('load',install);
})();