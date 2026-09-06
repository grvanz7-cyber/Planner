// ========================================
// DASHBOARD SCHOOL OVERVIEW WIDGET
// ========================================
(function installDashboardSchoolWidget(){
  const WIDGET_ID='dashboardSchoolWidget';
  function getData(){
    const store=window.PlannerDB;
    if(store)return {assignments:store.getAssignments(),assessments:store.getAssessments()};
    const tasks=Array.isArray(window.plannerData?.tasks)?window.plannerData.tasks:[];
    return {assignments:tasks.filter(t=>String(t.type||'').toLowerCase()==='assignment'),assessments:tasks.filter(t=>['quiz','test','exam'].includes(String(t.type||'').toLowerCase()))};
  }
  function state(task){
    if(task.completed||String(task.status||'').toLowerCase()==='completed')return 'completed';
    if(!task.dueDate)return 'upcoming';
    const d=new Date(String(task.dueDate).slice(0,10)+'T00:00:00'),today=new Date();today.setHours(0,0,0,0);
    return d<today?'overdue':'upcoming';
  }
  function formatDate(value){
    if(!value)return 'No date';
    const d=new Date(String(value).slice(0,10)+'T00:00:00');
    return Number.isNaN(d.getTime())?'No date':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }
  function ensureWidget(){
    const grid=document.querySelector('#dashboardPage .dashboard-grid');if(!grid||document.getElementById(WIDGET_ID))return;
    const card=document.createElement('section');card.className='card dashboard-school-widget';card.id=WIDGET_ID;card.dataset.dashboardWidget='school';
    card.innerHTML=`<div class="dashboard-widget-heading"><div><h2>School</h2><p>Your next assignments and assessments.</p></div><button type="button" class="dashboard-widget-link" id="schoolWidgetOpen">View all</button></div><div class="school-widget-stats"><div><strong id="schoolWidgetAssignments">0</strong><span>Assignments</span></div><div><strong id="schoolWidgetAssessments">0</strong><span>Assessments</span></div><div><strong id="schoolWidgetOverdue">0</strong><span>Overdue</span></div></div><div id="schoolWidgetList" class="school-widget-list"></div>`;
    grid.appendChild(card);
    document.getElementById('schoolWidgetOpen')?.addEventListener('click',()=>{if(typeof window.showPage==='function')window.showPage('assignments');});
    document.dispatchEvent(new Event('dashboard-widget-added'));
  }
  function render(){
    ensureWidget();const widget=document.getElementById(WIDGET_ID);if(!widget)return;
    const {assignments,assessments}=getData();const school=[...assignments,...assessments].filter(t=>state(t)!=='completed');
    const overdue=school.filter(t=>state(t)==='overdue');const upcoming=school.filter(t=>state(t)==='upcoming').sort((a,b)=>String(a.dueDate||'9999-12-31').localeCompare(String(b.dueDate||'9999-12-31')));
    const list=[...overdue.sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||''))),...upcoming].slice(0,5);
    widget.querySelector('#schoolWidgetAssignments').textContent=assignments.filter(t=>state(t)!=='completed').length;
    widget.querySelector('#schoolWidgetAssessments').textContent=assessments.filter(t=>state(t)!=='completed').length;
    widget.querySelector('#schoolWidgetOverdue').textContent=overdue.length;
    const container=widget.querySelector('#schoolWidgetList');container.innerHTML='';
    if(!list.length){container.innerHTML='<p class="school-widget-empty">Nothing due right now.</p>';return;}
    list.forEach(task=>{
      const row=document.createElement('button');row.type='button';row.className='school-widget-item '+state(task);
      const icon=String(task.type||'').toLowerCase()==='assignment'?'📝':String(task.type||'').toLowerCase()==='exam'?'🎓':'🧪';
      row.innerHTML=`<span class="school-widget-item-icon">${icon}</span><span class="school-widget-item-main"><strong></strong><small></small></span><span class="school-widget-item-date"></span>`;
      row.querySelector('strong').textContent=task.name||'Untitled';row.querySelector('small').textContent=task.subject||task.type||'School';row.querySelector('.school-widget-item-date').textContent=state(task)==='overdue'?'Overdue':formatDate(task.dueDate);
      row.addEventListener('click',()=>{if(typeof window.openEditTaskModal==='function')window.openEditTaskModal(task.id);});container.appendChild(row);
    });
  }
  document.addEventListener('DOMContentLoaded',render,{once:true});
  window.addEventListener('load',render,{once:true});
  document.addEventListener('planner-data-changed',render);
  document.addEventListener('dashboard-widget-added',render);
})();
