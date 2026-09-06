// ========================================
// DASHBOARD SCHOOL OVERVIEW WIDGET
// ========================================
(function installDashboardSchoolWidget(){
  const WIDGET_ID='dashboardSchoolWidget';

  function getData(){
    const tasks=Array.isArray(window.plannerData?.tasks)?window.plannerData.tasks:[];
    const subjects=Array.isArray(window.plannerData?.settings?.subjects)?window.plannerData.settings.subjects.filter(s=>s&&s.active!==false):[];
    const assignments=tasks.filter(t=>String(t.type||'').toLowerCase()==='assignment');
    const assessments=tasks.filter(t=>['quiz','test','exam'].includes(String(t.type||'').toLowerCase()));
    return {tasks,subjects,assignments,assessments};
  }

  function state(task){
    if(task.completed||String(task.status||'').toLowerCase()==='completed')return 'completed';
    if(!task.dueDate)return 'upcoming';
    const d=new Date(String(task.dueDate).slice(0,10)+'T00:00:00');
    const today=new Date();today.setHours(0,0,0,0);
    return d<today?'overdue':'upcoming';
  }

  function formatDate(value){
    if(!value)return 'No date';
    const d=new Date(String(value).slice(0,10)+'T00:00:00');
    return Number.isNaN(d.getTime())?'No date':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }

  function ensureWidget(){
    const grid=document.querySelector('#dashboardPage .dashboard-grid');
    if(!grid||document.getElementById(WIDGET_ID))return;
    const card=document.createElement('section');
    card.className='card dashboard-school-widget';
    card.id=WIDGET_ID;
    card.dataset.dashboardWidget='school';
    card.innerHTML=`
      <div class="dashboard-widget-heading">
        <div><h2>School</h2><p>Your next assignments and assessments.</p></div>
        <button type="button" class="dashboard-widget-link" id="schoolWidgetOpen">View all</button>
      </div>
      <div class="school-widget-stats">
        <div><strong id="schoolWidgetAssignments">0</strong><span>Assignments</span></div>
        <div><strong id="schoolWidgetAssessments">0</strong><span>Assessments</span></div>
        <div><strong id="schoolWidgetOverdue">0</strong><span>Overdue</span></div>
      </div>
      <div id="schoolWidgetList" class="school-widget-list"></div>`;
    grid.appendChild(card);
    document.getElementById('schoolWidgetOpen')?.addEventListener('click',()=>{
      if(typeof window.showPage==='function')window.showPage('assignments');
    });
  }

  function render(){
    ensureWidget();
    const widget=document.getElementById(WIDGET_ID);if(!widget)return;
    const {assignments,assessments}=getData();
    const school=[...assignments,...assessments].filter(t=>state(t)!=='completed');
    const overdue=school.filter(t=>state(t)==='overdue');
    const upcoming=school.filter(t=>state(t)==='upcoming').sort((a,b)=>String(a.dueDate||'9999-12-31').localeCompare(String(b.dueDate||'9999-12-31')));
    const list=[...overdue.sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||''))),...upcoming].slice(0,5);
    document.getElementById('schoolWidgetAssignments').textContent=assignments.filter(t=>state(t)!=='completed').length;
    document.getElementById('schoolWidgetAssessments').textContent=assessments.filter(t=>state(t)!=='completed').length;
    document.getElementById('schoolWidgetOverdue').textContent=overdue.length;
    const container=document.getElementById('schoolWidgetList');
    container.innerHTML='';
    if(!list.length){container.innerHTML='<p class="school-widget-empty">Nothing due right now.</p>';return;}
    list.forEach(task=>{
      const row=document.createElement('button');row.type='button';row.className='school-widget-item '+state(task);
      const icon=String(task.type||'').toLowerCase()==='assignment'?'📝':String(task.type||'').toLowerCase()==='exam'?'🎓':'🧪';
      row.innerHTML=`<span class="school-widget-item-icon">${icon}</span><span class="school-widget-item-main"><strong></strong><small></small></span><span class="school-widget-item-date"></span>`;
      row.querySelector('strong').textContent=task.name||'Untitled';
      row.querySelector('small').textContent=task.subject||task.type||'School';
      row.querySelector('.school-widget-item-date').textContent=state(task)==='overdue'?'Overdue':formatDate(task.dueDate);
      row.addEventListener('click',()=>{if(typeof window.openEditTaskModal==='function')window.openEditTaskModal(task.id);});
      container.appendChild(row);
    });
  }

  function boot(){render();}
  const style=document.createElement('style');style.textContent=`
    .dashboard-school-widget{grid-column:1 / -1}
    .dashboard-widget-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}
    .dashboard-widget-heading h2{margin:0 0 4px}
    .dashboard-widget-heading p{margin:0;color:var(--muted-text,#777);font-size:13px}
    .dashboard-widget-link{border:0;background:none;color:var(--planner-accent,#304b8a);font:inherit;font-weight:600;cursor:pointer;padding:4px 0}
    .school-widget-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
    .school-widget-stats div{padding:12px;border-radius:12px;background:var(--planner-accent-soft,rgba(48,75,138,.08));display:grid;gap:2px}
    .school-widget-stats strong{font-size:21px}
    .school-widget-stats span{font-size:12px;color:var(--muted-text,#777)}
    .school-widget-list{display:grid;gap:7px}
    .school-widget-item{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:10px 12px;border:1px solid var(--border-color,#e6e1da);border-radius:11px;background:var(--card-bg,#fff);font:inherit;color:inherit;text-align:left;cursor:pointer}
    .school-widget-item:hover{background:var(--hover-bg,#f4f1ed)}
    .school-widget-item.overdue{border-left:3px solid #dc2626}
    .school-widget-item-main{display:grid;gap:2px;min-width:0}.school-widget-item-main strong,.school-widget-item-main small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.school-widget-item-main small{font-size:12px;color:var(--muted-text,#777)}
    .school-widget-item-date{font-size:12px;color:var(--muted-text,#777);white-space:nowrap}.school-widget-item.overdue .school-widget-item-date{color:#dc2626;font-weight:600}
    .school-widget-empty{margin:8px 0;color:var(--muted-text,#777);text-align:center}
    @media(max-width:700px){.dashboard-school-widget{grid-column:auto}.school-widget-stats{grid-template-columns:1fr 1fr}.school-widget-stats div:last-child{grid-column:1 / -1}}
  `;document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded',boot,{once:true});
  window.addEventListener('load',boot,{once:true});
  document.addEventListener('click',()=>setTimeout(render,0));
  document.addEventListener('change',()=>setTimeout(render,0));
  window.addEventListener('storage',render);
})();
