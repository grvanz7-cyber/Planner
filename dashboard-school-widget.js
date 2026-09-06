// ========================================
// DASHBOARD SCHOOL OVERVIEW WIDGET
// ========================================
(function installDashboardSchoolWidget(){
  const WIDGET_ID='dashboardSchoolWidget';
  const STYLE_ID='dashboardSchoolWidgetStyles';

  function getData(){
    const store=window.PlannerDB;
    if(store)return {assignments:store.getAssignments(),assessments:store.getAssessments()};
    const tasks=Array.isArray(window.plannerData?.tasks)?window.plannerData.tasks:[];
    return {
      assignments:tasks.filter(t=>String(t.type||'').toLowerCase()==='assignment'),
      assessments:tasks.filter(t=>['quiz','test','exam'].includes(String(t.type||'').toLowerCase()))
    };
  }

  function state(task){
    if(task.completed||String(task.status||'').toLowerCase()==='completed')return 'completed';
    if(!task.dueDate)return 'upcoming';
    const d=new Date(String(task.dueDate).slice(0,10)+'T00:00:00');
    const today=new Date();
    today.setHours(0,0,0,0);
    return d<today?'overdue':'upcoming';
  }

  function formatDate(value){
    if(!value)return 'No date';
    const d=new Date(String(value).slice(0,10)+'T00:00:00');
    return Number.isNaN(d.getTime())?'No date':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }

  function typeLabel(task){
    const type=String(task.type||'').toLowerCase();
    if(type==='assignment')return 'Assignment';
    if(type==='quiz')return 'Quiz';
    if(type==='test')return 'Test';
    if(type==='exam')return 'Exam';
    return 'School';
  }

  function typeIcon(task){
    const type=String(task.type||'').toLowerCase();
    if(type==='assignment')return '📝';
    if(type==='exam')return '🎓';
    if(type==='test')return '📋';
    return '🧪';
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .dashboard-school-widget .dashboard-widget-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}
      .dashboard-school-widget .dashboard-widget-heading h2{margin:0 0 4px}
      .dashboard-school-widget .dashboard-widget-heading p{margin:0;color:var(--muted-text,#777);font-size:13px}
      .dashboard-school-widget .dashboard-widget-link{border:0;background:none;color:var(--planner-accent,#304b8a);font:inherit;font-weight:600;cursor:pointer;padding:4px 0;white-space:nowrap}
      .school-widget-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
      .school-widget-stats div{padding:11px 12px;border:1px solid var(--border-color,#e6e1da);border-radius:12px;background:var(--planner-accent-soft,rgba(48,75,138,.07));display:grid;gap:3px}
      .school-widget-stats strong{font-size:21px;line-height:1.1}
      .school-widget-stats span{font-size:12px;color:var(--muted-text,#777)}
      .school-widget-stats .school-widget-stat-overdue{background:rgba(220,38,38,.06);border-color:rgba(220,38,38,.16)}
      .school-widget-stats .school-widget-stat-overdue strong{color:#dc2626}
      .school-widget-list{display:grid;gap:7px}
      .school-widget-item{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:9px 11px;border:1px solid var(--border-color,#e6e1da);border-radius:11px;background:var(--card-bg,#fff);font:inherit;color:inherit;text-align:left;cursor:pointer;transition:background .15s ease,border-color .15s ease,transform .15s ease}
      .school-widget-item:hover{background:var(--hover-bg,#f4f1ed);transform:translateY(-1px)}
      .school-widget-item.overdue{border-left:3px solid #dc2626;padding-left:9px}
      .school-widget-item-icon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--planner-accent-soft,rgba(48,75,138,.08));font-size:16px}
      .school-widget-item-main{display:grid;gap:3px;min-width:0}
      .school-widget-item-main strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
      .school-widget-item-main small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--muted-text,#777)}
      .school-widget-item-meta{display:flex;align-items:center;gap:6px;min-width:0}
      .school-widget-type{font-size:10px;font-weight:700;padding:2px 6px;border-radius:999px;background:var(--hover-bg,#f4f1ed);color:var(--muted-text,#777);white-space:nowrap}
      .school-widget-item-date{font-size:12px;color:var(--muted-text,#777);white-space:nowrap;font-weight:600}
      .school-widget-item.overdue .school-widget-item-date{color:#dc2626}
      .school-widget-empty{margin:8px 0;color:var(--muted-text,#777);text-align:center;font-size:13px}
      @media(max-width:700px){
        .school-widget-stats{grid-template-columns:1fr 1fr}
        .school-widget-stats div:last-child{grid-column:1 / -1}
      }
    `;
    document.head.appendChild(style);
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
        <div class="school-widget-stat-overdue"><strong id="schoolWidgetOverdue">0</strong><span>Overdue</span></div>
      </div>
      <div id="schoolWidgetList" class="school-widget-list"></div>
    `;

    grid.appendChild(card);
    document.getElementById('schoolWidgetOpen')?.addEventListener('click',()=>{
      if(typeof window.showPage==='function')window.showPage('assignments');
    });
    document.dispatchEvent(new Event('dashboard-widget-added'));
  }

  function render(){
    ensureStyles();
    ensureWidget();
    const widget=document.getElementById(WIDGET_ID);
    if(!widget)return;

    const {assignments,assessments}=getData();
    const activeAssignments=assignments.filter(t=>state(t)!=='completed');
    const activeAssessments=assessments.filter(t=>state(t)!=='completed');
    const school=[...activeAssignments,...activeAssessments];
    const overdue=school.filter(t=>state(t)==='overdue');
    const upcoming=school
      .filter(t=>state(t)==='upcoming')
      .sort((a,b)=>String(a.dueDate||'9999-12-31').localeCompare(String(b.dueDate||'9999-12-31')));
    const list=[
      ...overdue.sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||''))),
      ...upcoming
    ].slice(0,5);

    widget.querySelector('#schoolWidgetAssignments').textContent=activeAssignments.length;
    widget.querySelector('#schoolWidgetAssessments').textContent=activeAssessments.length;
    widget.querySelector('#schoolWidgetOverdue').textContent=overdue.length;

    const container=widget.querySelector('#schoolWidgetList');
    container.innerHTML='';

    if(!list.length){
      container.innerHTML='<p class="school-widget-empty">Nothing due right now.</p>';
      return;
    }

    list.forEach(task=>{
      const taskState=state(task);
      const row=document.createElement('button');
      row.type='button';
      row.className='school-widget-item '+taskState;
      row.innerHTML=`
        <span class="school-widget-item-icon">${typeIcon(task)}</span>
        <span class="school-widget-item-main">
          <strong></strong>
          <span class="school-widget-item-meta"><small></small><span class="school-widget-type"></span></span>
        </span>
        <span class="school-widget-item-date"></span>
      `;
      row.querySelector('strong').textContent=task.name||'Untitled';
      row.querySelector('small').textContent=task.subject||'School';
      row.querySelector('.school-widget-type').textContent=typeLabel(task);
      row.querySelector('.school-widget-item-date').textContent=taskState==='overdue'?'Overdue':formatDate(task.dueDate);
      row.addEventListener('click',()=>{
        if(typeof window.openEditTaskModal==='function')window.openEditTaskModal(task.id);
      });
      container.appendChild(row);
    });
  }

  document.addEventListener('DOMContentLoaded',render,{once:true});
  window.addEventListener('load',render,{once:true});
  document.addEventListener('planner-data-changed',render);
  document.addEventListener('dashboard-widget-added',render);
})();
