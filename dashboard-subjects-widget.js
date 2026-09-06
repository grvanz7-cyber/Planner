// ========================================
// DASHBOARD SUBJECT SNAPSHOT WIDGET
// ========================================
(function installDashboardSubjectWidget(){
    const WIDGET_ID='dashboardSubjectSnapshotWidget';
    const STYLE_ID='dashboardSubjectWidgetStyles';
    function data(){
        const store=window.PlannerDB;
        if(store)return {subjects:store.getSubjects({activeOnly:true}),tasks:store.getTasks()};
        return {subjects:Array.isArray(window.plannerData?.settings?.subjects)?window.plannerData.settings.subjects.filter(s=>s&&s.active!==false):[],tasks:Array.isArray(window.plannerData?.tasks)?window.plannerData.tasks:[]};
    }
    function dateValue(v){const d=new Date(String(v||'').slice(0,10)+'T00:00:00');return Number.isNaN(d.getTime())?Infinity:d.getTime();}
    function formatDate(v){if(!v)return '';const d=new Date(String(v).slice(0,10)+'T00:00:00');return Number.isNaN(d.getTime())?'':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});}
    function completed(t){return !!t?.completed||String(t?.status||'').toLowerCase()==='completed';}
    function state(t){if(!t?.dueDate)return 'nodate';const d=dateValue(t.dueDate),today=new Date();today.setHours(0,0,0,0);return d<today.getTime()?'overdue':'upcoming';}
    function ensureStyles(){
        if(document.getElementById(STYLE_ID))return;
        const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`.dashboard-subject-widget .dashboard-widget-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.dashboard-subject-widget .dashboard-widget-heading h2{margin:0 0 4px}.dashboard-subject-widget .dashboard-widget-heading p{margin:0;color:var(--muted-text,#777);font-size:13px}.dashboard-subject-widget .dashboard-widget-link{border:0;background:none;color:var(--planner-accent,#304b8a);font:inherit;font-weight:600;cursor:pointer;padding:4px 0}.dashboard-subject-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dashboard-subject-row{min-width:0;padding:12px 13px;border:1px solid var(--border-color,#e6e1da);border-left:4px solid var(--subject-color,var(--planner-accent,#304b8a));border-radius:12px;background:var(--card-bg,#fff);transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.dashboard-subject-row:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(0,0,0,.06)}.dashboard-subject-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.dashboard-subject-name{display:flex;align-items:center;gap:8px;min-width:0}.dashboard-subject-name strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dashboard-subject-emoji{font-size:19px;line-height:1;flex:0 0 auto}.dashboard-subject-count{font-size:11px;color:var(--muted-text,#777);white-space:nowrap}.dashboard-subject-deadlines{display:grid;gap:5px}.dashboard-subject-task{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:7px 8px;border:1px solid var(--border-color,#ece8e2);border-radius:8px;background:var(--hover-bg,#f7f5f2);color:inherit;font:inherit;text-align:left;cursor:pointer}.dashboard-subject-task:hover{border-color:var(--subject-color,var(--planner-accent,#304b8a));background:var(--card-bg,#fff)}.dashboard-subject-task-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.dashboard-subject-task-date{font-size:11px;color:var(--muted-text,#777);white-space:nowrap}.dashboard-subject-task.overdue{border-left:3px solid #dc2626}.dashboard-subject-task.overdue .dashboard-subject-task-date{color:#dc2626;font-weight:600}.dashboard-subject-none{font-size:12px;color:var(--muted-text,#777)}.dashboard-subject-empty{padding:20px;text-align:center;color:var(--muted-text,#777);border:1px dashed var(--border-color,#ddd);border-radius:12px}@media(max-width:700px){.dashboard-subject-list{grid-template-columns:1fr}}`;document.head.appendChild(style);
    }
    function ensure(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');if(!grid||document.querySelector('#'+WIDGET_ID))return;
        const card=document.createElement('section');card.className='card dashboard-subject-widget';card.id=WIDGET_ID;card.dataset.dashboardWidget='subjects';
        card.innerHTML='<div class="dashboard-widget-heading"><div><h2>Subject Snapshot</h2><p>A quick look at what is active in each subject.</p></div><button type="button" class="dashboard-widget-link">Subjects</button></div><div class="dashboard-subject-list"></div>';
        card.querySelector('.dashboard-widget-link').onclick=()=>{if(typeof showPage==='function')showPage('subjects');};grid.appendChild(card);document.dispatchEvent(new Event('dashboard-widget-added'));
    }
    function render(){
        ensureStyles();ensure();const list=document.querySelector('#'+WIDGET_ID+' .dashboard-subject-list');if(!list)return;const{subjects,tasks}=data();list.innerHTML='';
        if(!subjects.length){list.innerHTML='<div class="dashboard-subject-empty">No active subjects yet.</div>';return;}
        subjects.forEach(s=>{
            const subjectTasks=tasks.filter(t=>t&&t.subject===s.name),activeTasks=subjectTasks.filter(t=>!completed(t)),overdue=activeTasks.filter(t=>state(t)==='overdue'),upcoming=activeTasks.filter(t=>state(t)==='upcoming').sort((a,b)=>dateValue(a.dueDate)-dateValue(b.dueDate)).slice(0,2);
            const row=document.createElement('div');row.className='dashboard-subject-row';row.style.setProperty('--subject-color',s.colour||'var(--planner-accent, #304b8a)');
            row.innerHTML='<div class="dashboard-subject-top"><span class="dashboard-subject-name"><span class="dashboard-subject-emoji"></span><strong></strong></span><span class="dashboard-subject-count"></span></div><div class="dashboard-subject-deadlines"></div>';
            row.querySelector('.dashboard-subject-emoji').textContent=s.emoji||'📚';row.querySelector('.dashboard-subject-name strong').textContent=s.name||'Untitled subject';row.querySelector('.dashboard-subject-count').textContent=overdue.length?`${overdue.length} overdue · ${activeTasks.length} active`:`${activeTasks.length} active`;
            const box=row.querySelector('.dashboard-subject-deadlines');
            const visible=[...overdue.sort((a,b)=>dateValue(a.dueDate)-dateValue(b.dueDate)).slice(0,1),...upcoming].slice(0,2);
            if(visible.length)visible.forEach(t=>{const item=document.createElement('button');item.type='button';item.className='dashboard-subject-task '+(state(t)==='overdue'?'overdue':'');item.innerHTML='<span class="dashboard-subject-task-name"></span><span class="dashboard-subject-task-date"></span>';item.querySelector('.dashboard-subject-task-name').textContent=t.name||'Untitled task';item.querySelector('.dashboard-subject-task-date').textContent=state(t)==='overdue'?'Overdue':formatDate(t.dueDate);item.onclick=()=>{if(typeof openEditTaskModal==='function')openEditTaskModal(t.id);};box.appendChild(item);});
            else box.innerHTML='<span class="dashboard-subject-none">Nothing due 🎉</span>';
            list.appendChild(row);
        });
    }
    document.addEventListener('DOMContentLoaded',render,{once:true});window.addEventListener('load',render,{once:true});document.addEventListener('planner-data-changed',render);document.addEventListener('dashboard-widget-added',render);
})();
