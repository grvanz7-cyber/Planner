// ========================================
// GRADE BUTTON SYNC
// Keeps Assignment / Test / Exam grade buttons in sync with saved grades.
// ========================================
(function(){
  function data(){return window.plannerData||{};}
  function grades(){return Array.isArray(data().gradeAssessments)?data().gradeAssessments:[];}
  function hasGrade(task){
    if(!task)return false;
    const id=String(task.id);
    const name=String(task.name||'').trim().toLowerCase();
    const subject=String(task.subject||'').trim().toLowerCase();
    return grades().some(g=>{
      const linked=String(g.taskId ?? g.linkedTaskId ?? g.task ?? '').trim();
      if(linked && linked===id)return true;
      return String(g.name||'').trim().toLowerCase()===name &&
             String(g.subject||'').trim().toLowerCase()===subject;
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
  window.syncGradeButtons=sync;
  document.addEventListener('planner-data-changed',sync);
  document.addEventListener('DOMContentLoaded',sync);
  window.addEventListener('load',sync);
  setInterval(sync,300);
})();
