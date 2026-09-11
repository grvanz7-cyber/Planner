// ========================================
// PAGE NAVIGATION
// ========================================

(function repairPlannerStorage(){
  try{
    const raw=localStorage.getItem('plannerData');
    if(!raw)return;
    const data=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))return;
    let changed=false;
    if(!data.settings||typeof data.settings!=='object'||Array.isArray(data.settings)){data.settings={};changed=true;}
    if(!Array.isArray(data.settings.subjects)){data.settings.subjects=[];changed=true;}
    if(!Array.isArray(data.settings.types)){data.settings.types=[];changed=true;}
    if(!Array.isArray(data.tasks)){data.tasks=[];changed=true;}
    if(changed){
      localStorage.setItem('plannerData',JSON.stringify(data));
      localStorage.setItem('plannerTasks',JSON.stringify(data.tasks));
      if(sessionStorage.getItem('plannerRepairReload')!=='1'){
        sessionStorage.setItem('plannerRepairReload','1');
        location.reload();
        return;
      }
    }
    sessionStorage.removeItem('plannerRepairReload');
  }catch(error){console.error('Planner storage repair failed:',error);}
})();

const VALID_PAGES=['dashboard','calendar','tasks','subjects','assignments','tests-exams','grades','study','settings','focus','habits','goals','companion','profile','friends','integrations','smart','study-map'];

function setActiveNav(page){
  document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active',item.dataset.page===page));
}

function dedupeSidebarNav(){
  const seen=new Set();
  document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(item=>{
    const page=item.dataset.page;
    if(seen.has(page))item.remove();
    else seen.add(page);
  });
}

function getSubjectHash(){
  const raw=window.location.hash.replace(/^#/,'');
  return raw.toLowerCase().startsWith('subject/')?raw.slice(8):null;
}

function restoreSubjectFromHash(){
  const encoded=getSubjectHash();
  if(encoded==null)return false;
  let subjectName='';
  try{subjectName=decodeURIComponent(encoded);}catch(e){return false;}
  if(!subjectName)return false;
  if(typeof window.openSubjectPage==='function'){
    window.openSubjectPage(subjectName,false);
    setCurrentDate();
    return true;
  }
  setTimeout(()=>{
    if(getSubjectHash()===encoded&&typeof window.openSubjectPage==='function'){
      window.openSubjectPage(subjectName,false);
      setCurrentDate();
    }
  },100);
  return true;
}

function ensureStudyPage(){
  if(document.getElementById('studyPage')){
    const existingButton=document.getElementById('studyAddButton');
    if(existingButton)existingButton.onclick=function(){
      if(typeof window.openStudySetModal==='function')window.openStudySetModal();
      return false;
    };
    return;
  }
  const main=document.querySelector('.main');
  if(!main)return;
  const p=document.createElement('div');
  p.id='studyPage';
  p.className='page-hidden';
  p.innerHTML='<header class="header study-page-header"><div><h1>Study</h1><p>Plan how you study, not just what you study.</p></div><button type="button" class="save-button" id="studyAddButton">+ New Study Set</button></header><div class="study-summary"><div class="study-stat"><strong id="studySetCount">0</strong><span>Study sets</span></div><div class="study-stat"><strong id="studyCardCount">0</strong><span>Items to study</span></div><div class="study-stat"><strong id="studyDueCount">0</strong><span>Due for review</span></div></div><section class="card study-library-card"><div class="study-library-header"><div><h2>Your Study Library</h2><p>Flashcards, notes, questions, and other study material.</p></div><select id="studySubjectFilter"><option value="">All subjects</option></select></div><div id="studySets" class="study-sets"></div></section>';
  main.appendChild(p);
  const button=p.querySelector('#studyAddButton');
  if(button)button.onclick=function(){
    if(typeof window.openStudySetModal==='function')window.openStudySetModal();
    return false;
  };
}

function ensureStudyNav(){
  const sections=document.querySelectorAll('.sidebar .nav-section');
  const school=sections[1];
  if(!school)return;
  const items=[...document.querySelectorAll('.sidebar .nav-item[data-page="study"]')];
  if(items.length){
    const keep=items[0];
    school.appendChild(keep);
    items.slice(1).forEach(item=>item.remove());
    return;
  }
  const a=document.createElement('a');
  a.href='#study';
  a.className='nav-item';
  a.dataset.page='study';
  a.textContent='🧠 Study';
  school.appendChild(a);
}

function ensureStudyMapPage(){
  return document.getElementById('study-mapPage');
}

function ensureRoadmapPage(page){
  const roadmapPages=['focus','habits','goals','companion','profile','friends','integrations','smart','study-map'];
  if(!roadmapPages.includes(page))return;
  if(getPageElement(page))return;
  if(typeof window.renderRoadmapCore==='function')window.renderRoadmapCore();
}

function getPageElement(page){
  const fixed={
    dashboard:'#dashboardPage',calendar:'#calendarPage',tasks:'#tasksPage',subjects:'#subjectsPage',
    assignments:'#assignmentsPage','tests-exams':'#testsExamsPage',grades:'#gradesPage',study:'#studyPage','study-map':'#study-mapPage',settings:'#settingsPage'
  };
  if(fixed[page])return document.querySelector(fixed[page]);
  return document.getElementById(page+'Page')||document.getElementById(page);
}

function showStudyMap(){
  ensureRoadmapPage('study-map');
  const target=document.getElementById('study-mapPage');
  if(!target){console.error('Study Map page could not be created.');return false;}
  document.querySelectorAll('.main > div').forEach(el=>{el.classList.add('page-hidden');el.style.display='none';});
  const detail=document.querySelector('#subjectDetailPage');
  if(detail&&detail!==target){detail.classList.add('page-hidden');detail.style.display='none';}
  target.classList.remove('page-hidden');target.style.display='';setActiveNav('study-map');
  if(typeof window.renderStudyMap==='function')window.renderStudyMap();
  history.replaceState(null,'','#study-map');return true;
}

function showPage(page,updateHistory=true){
  if(page==='study-map'){showStudyMap();return;}
  ensureStudyPage();ensureStudyNav();ensureRoadmapPage(page);dedupeSidebarNav();
  if(getSubjectHash()!=null&&window.__plannerRestoringSubject)window.__plannerRestoringSubject=false;
  if(!updateHistory&&getSubjectHash()!=null){restoreSubjectFromHash();return;}
  const target=getPageElement(page);
  if(!target)page='dashboard';
  const finalTarget=getPageElement(page)||document.querySelector('#dashboardPage');
  document.querySelectorAll('.main > div').forEach(el=>{el.classList.add('page-hidden');el.style.display='none';});
  const detail=document.querySelector('#subjectDetailPage');
  if(detail&&detail!==finalTarget){detail.classList.add('page-hidden');detail.style.display='none';}
  if(finalTarget){finalTarget.classList.remove('page-hidden');finalTarget.style.display='';}
  setActiveNav(page);
  try{
    if(page==='settings'){if(typeof renderSubjects==='function')renderSubjects();if(typeof renderTaskTypes==='function')renderTaskTypes();}
    else if(page==='calendar'){if(typeof renderCalendar==='function')renderCalendar();}
    else if(page==='tasks'){if(typeof renderAllTasks==='function')renderAllTasks();}
    else if(page==='subjects'){if(typeof renderSubjectsPage==='function')renderSubjectsPage();}
    else if(page==='assignments'){if(typeof renderAssignments==='function')renderAssignments();}
    else if(page==='tests-exams'){if(typeof renderAssessments==='function')renderAssessments();}
    else if(page==='grades'){if(typeof renderGrades==='function')renderGrades();}
    else if(page==='study'){if(typeof renderStudy==='function')renderStudy();if(typeof renderStudyPlans==='function')renderStudyPlans();}
  }catch(error){console.error('Planner page render error:',error);}
  if(updateHistory)history.replaceState(null,'','#'+page);
}

function setCurrentDate(){
  const dateElement=document.querySelector('#currentDate');
  if(dateElement&&dateElement.textContent==='Loading date...')dateElement.textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
}

function loadSavedPage(){
  ensureStudyPage();ensureStudyNav();ensureStudyMapPage();
  const rawHash=window.location.hash.replace(/^#/,'');
  if(rawHash.toLowerCase().startsWith('subject/')){restoreSubjectFromHash();return;}
  if(rawHash.toLowerCase()==='study-map'){showStudyMap();setCurrentDate();return;}
  showPage(rawHash.toLowerCase()||'dashboard',false);setCurrentDate();setTimeout(dedupeSidebarNav,0);
}

document.addEventListener('click',function(event){
  const item=event.target.closest?.('.sidebar .nav-item[data-page]');
  if(!item)return;
  const page=item.dataset.page;
  if(page==='study-map'){event.preventDefault();event.stopPropagation();showStudyMap();return;}
  ensureRoadmapPage(page);
  if(!getPageElement(page)&&page!=='study-map')return;
  event.preventDefault();event.stopPropagation();showPage(page,true);
},true);

document.addEventListener('DOMContentLoaded',loadSavedPage);
window.addEventListener('load',()=>{
  ensureStudyPage();ensureStudyNav();ensureStudyMapPage();dedupeSidebarNav();
  const raw=window.location.hash.replace(/^#/,'').toLowerCase();
  if(raw==='study-map')showStudyMap();else if(raw&&getPageElement(raw))showPage(raw,false);
});
window.addEventListener('hashchange',loadSavedPage);
