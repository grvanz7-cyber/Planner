// ========================================
// PAGE NAVIGATION
// ========================================

(function repairPlannerStorage(){
  try{
    const raw=localStorage.getItem('plannerData');
    if(!raw)return;
    const data=JSON.parse(raw);
    let changed=false;
    if(!data||typeof data!=='object'||Array.isArray(data))return;
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
  }catch(error){
    try{
      localStorage.removeItem('plannerData');
      sessionStorage.setItem('plannerRepairReload','1');
      location.reload();
    }catch(e){}
  }
})();

const VALID_PAGES=['dashboard','calendar','tasks','subjects','assignments','tests-exams','grades','settings'];

function setActiveNav(page){
  document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active',item.dataset.page===page));
}

function getSubjectHash(){
  const raw=window.location.hash.replace(/^#/,'');
  return raw.toLowerCase().startsWith('subject/') ? raw.slice(8) : null;
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

function showPage(page,updateHistory=true){
  // Do not let startup rendering overwrite a saved subject-detail URL.
  if(!updateHistory&&getSubjectHash()!=null){
    restoreSubjectFromHash();
    return;
  }
  if(!VALID_PAGES.includes(page))page='dashboard';
  const pages={
    dashboard:document.querySelector('#dashboardPage'),
    calendar:document.querySelector('#calendarPage'),
    tasks:document.querySelector('#tasksPage'),
    subjects:document.querySelector('#subjectsPage'),
    assignments:document.querySelector('#assignmentsPage'),
    'tests-exams':document.querySelector('#testsExamsPage'),
    grades:document.querySelector('#gradesPage'),
    settings:document.querySelector('#settingsPage')
  };
  const detail=document.querySelector('#subjectDetailPage');
  Object.values(pages).forEach(el=>{if(el){el.classList.add('page-hidden');el.style.setProperty('display','none','important');}});
  if(detail){detail.classList.add('page-hidden');detail.style.setProperty('display','none','important');}
  if(pages[page]){pages[page].classList.remove('page-hidden');pages[page].style.removeProperty('display');}
  setActiveNav(page);
  try{
    if(page==='settings'){
      if(typeof renderSubjects==='function')renderSubjects();
      if(typeof renderTaskTypes==='function')renderTaskTypes();
    }else if(page==='calendar'){
      if(typeof renderCalendar==='function')renderCalendar();
    }else if(page==='tasks'){
      if(typeof renderAllTasks==='function')renderAllTasks();
    }else if(page==='subjects'){
      if(typeof renderSubjectsPage==='function')renderSubjectsPage();
    }else if(page==='assignments'){
      if(typeof renderAssignments==='function')renderAssignments();
    }else if(page==='tests-exams'){
      if(typeof renderAssessments==='function')renderAssessments();
    }else if(page==='grades'){
      if(typeof renderGrades==='function')renderGrades();
    }else if(typeof renderTasks==='function'){
      renderTasks();
    }
  }catch(error){
    console.error('Planner page render error:',error);
  }
  if(updateHistory)history.replaceState(null,'',`#${page}`);
}

function setCurrentDate(){
  const dateElement=document.querySelector('#currentDate');
  if(dateElement&&dateElement.textContent==='Loading date...'){
    dateElement.textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  }
}

function loadSavedPage(){
  if(restoreSubjectFromHash())return;
  const rawHash=window.location.hash.replace(/^#/,'');
  const lower=rawHash.toLowerCase();
  showPage(VALID_PAGES.includes(lower)?lower:'dashboard',false);
  setCurrentDate();
}

window.addEventListener('hashchange',loadSavedPage);
document.addEventListener('DOMContentLoaded',loadSavedPage);
