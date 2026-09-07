// ========================================
// GRADE BUTTON SYNC
// Keeps Assignment / Test / Exam grade buttons in sync with saved grades.
// ========================================
(function(){
  function data(){return window.plannerData||{};}
  function grades(){return Array.isArray(data().gradeAssessments)?data().gradeAssessments:[];}
  function hasGrade(task){
    if(!task)return false;
    const id=String(task.id).trim();
    const name=String(task.name||'').trim().toLowerCase();
    const subject=String(task.subject||'').trim().toLowerCase();
    return grades().some(g=>{
      const linked=String(g.taskId ?? g.linkedTaskId ?? g.task ?? '').trim();
      if(linked && linked===id)return true;
      return name && String(g.name||'').trim().toLowerCase()===name &&
             subject && String(g.subject||'').trim().toLowerCase()===subject;
    });
  }
  function sync(){
    document.querySelectorAll('#assignmentsList .record-grade-button,#assessmentsList .record-grade-button').forEach(button=>{
      const row=button.closest('.assignment-row,.assessment-row');
      if(!row)return;
      const id=row.dataset.taskId;
      const task=(data().tasks||[]).find(t=>String(t.id)===String(id));
      button.textContent=hasGrade(task)?'Edit Grade':'Record Grade';
    });
  }
  function wrapRender(name){
    const original=window[name];
    if(typeof original!=='function'||original.__gradeButtonWrapped)return;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      sync();
      return result;
    };
    wrapped.__gradeButtonWrapped=true;
    wrapped.__original=original;
    window[name]=wrapped;
  }
  window.gradeExistsForTask=hasGrade;
  window.syncGradeButtons=sync;
  wrapRender('renderAssignments');
  wrapRender('renderAssessments');
  document.addEventListener('planner-data-changed',sync);
  document.addEventListener('DOMContentLoaded',sync);
  window.addEventListener('load',sync);
  const observer=new MutationObserver(()=>sync());
  function observe(){
    ['assignmentsList','assessmentsList'].forEach(id=>{const node=document.getElementById(id);if(node&&!node.__gradeButtonObserver){observer.observe(node,{childList:true,subtree:true});node.__gradeButtonObserver=true;}});
    sync();
  }
  document.addEventListener('DOMContentLoaded',observe);
  window.addEventListener('load',observe);
  setInterval(()=>{wrapRender('renderAssignments');wrapRender('renderAssessments');observe();},500);
})();
