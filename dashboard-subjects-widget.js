// ========================================
// DASHBOARD SUBJECT SNAPSHOT WIDGET
// ========================================
(function installDashboardSubjectWidget(){
    const WIDGET_ID='dashboardSubjectSnapshotWidget';
    function data(){return{subjects:Array.isArray(plannerData?.settings?.subjects)?plannerData.settings.subjects:[],tasks:Array.isArray(plannerData?.tasks)?plannerData.tasks:[]};}
    function dateValue(v){const d=new Date(String(v||'').slice(0,10)+'T00:00:00');return Number.isNaN(d.getTime())?Infinity:d.getTime();}
    function completed(t){return !!t?.completed||String(t?.status||'').toLowerCase()==='completed';}
    function ensure(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');if(!grid||document.querySelector('#'+WIDGET_ID))return;
        const card=document.createElement('section');card.className='card dashboard-subject-widget';card.id=WIDGET_ID;
        card.innerHTML='<div class="dashboard-widget-heading"><div><h2>Subject Snapshot</h2><p>What is coming up in each subject</p></div><button type="button" class="dashboard-widget-link">Subjects</button></div><div class="dashboard-subject-list"></div>';
        card.querySelector('.dashboard-widget-link').onclick=()=>{if(typeof showPage==='function')showPage('subjects');};grid.appendChild(card);
        document.dispatchEvent(new Event('dashboard-widget-added'));
    }
    function render(){
        ensure();const list=document.querySelector('#'+WIDGET_ID+' .dashboard-subject-list');if(!list)return;const{subjects,tasks}=data();const active=subjects.filter(s=>s&&s.active!==false);list.innerHTML='';
        if(!active.length){list.innerHTML='<div class="dashboard-subject-empty">No active subjects yet.</div>';return;}
        active.forEach(s=>{
            const subjectTasks=tasks.filter(t=>t&&t.subject===s.name),activeTasks=subjectTasks.filter(t=>!completed(t)),upcoming=activeTasks.filter(t=>t.dueDate).sort((a,b)=>dateValue(a.dueDate)-dateValue(b.dueDate)).slice(0,2);
            const row=document.createElement('div');row.className='dashboard-subject-row';row.style.setProperty('--subject-color',s.colour||'var(--planner-accent, #304b8a)');
            row.innerHTML='<div class="dashboard-subject-top"><span class="dashboard-subject-name"><span class="dashboard-subject-emoji"></span><strong></strong></span><span class="dashboard-subject-count"></span></div><div class="dashboard-subject-deadlines"></div>';
            row.querySelector('.dashboard-subject-emoji').textContent=s.emoji||'📚';row.querySelector('.dashboard-subject-name strong').textContent=s.name||'Untitled subject';row.querySelector('.dashboard-subject-count').textContent=`${activeTasks.length} active`;
            const box=row.querySelector('.dashboard-subject-deadlines');
            if(upcoming.length)upcoming.forEach(t=>{const item=document.createElement('button');item.type='button';item.className='dashboard-subject-task';item.innerHTML='<span class="dashboard-subject-task-name"></span><span class="dashboard-subject-task-date"></span>';item.querySelector('.dashboard-subject-task-name').textContent=t.name||'Untitled task';item.querySelector('.dashboard-subject-task-date').textContent=t.dueDate;item.onclick=()=>{if(typeof openEditTaskModal==='function')openEditTaskModal(t.id);};box.appendChild(item);});
            else box.innerHTML='<span class="dashboard-subject-none">Nothing due 🎉</span>';
            list.appendChild(row);
        });
    }
    function boot(){if(typeof plannerData!=='undefined')render();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});window.addEventListener('load',boot,{once:true});
    document.addEventListener('click',()=>setTimeout(render,0));document.addEventListener('change',()=>setTimeout(render,0));
})();
