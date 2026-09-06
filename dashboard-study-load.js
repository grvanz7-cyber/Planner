// ========================================
// DASHBOARD STUDY LOAD WIDGET
// ========================================
(function installDashboardStudyLoad(){
    const WIDGET_ID='dashboardStudyLoadWidget';
    const STYLE_ID='dashboardStudyLoadStyles';

    function db(){return window.PlannerDB||null;}
    function getData(){
        const store=db();
        if(store)return {subjects:store.getSubjects({activeOnly:true}),tasks:store.getTasks()};
        return {subjects:Array.isArray(window.plannerData?.settings?.subjects)?window.plannerData.settings.subjects.filter(s=>s&&s.active!==false):[],tasks:Array.isArray(window.plannerData?.tasks)?window.plannerData.tasks:[]};
    }
    function completed(task){return !!task?.completed||String(task?.status||'').toLowerCase()==='completed';}
    function isSchool(task){
        const type=String(task?.type||'').toLowerCase();
        const tags=Array.isArray(task?.tags)?task.tags.map(String):[];
        return tags.some(tag=>tag.toLowerCase()==='#school')||['assignment','quiz','test','exam','lab','project','presentation','essay','report','assessment'].includes(type);
    }
    function dateValue(value){
        if(!value)return Infinity;
        const d=new Date(String(value).slice(0,10)+'T00:00:00');
        return Number.isNaN(d.getTime())?Infinity:d.getTime();
    }
    function formatDate(value){
        if(!value)return '';
        const d=new Date(String(value).slice(0,10)+'T00:00:00');
        return Number.isNaN(d.getTime())?'':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
    }
    function openSubject(name){if(typeof window.openSubjectPage==='function')window.openSubjectPage(name);}
    function ensureStyles(){
        if(document.getElementById(STYLE_ID))return;
        const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`.dashboard-study-load-widget .dashboard-widget-heading{margin-bottom:16px}.dashboard-study-load-widget .dashboard-widget-heading h2{margin:0 0 4px}.dashboard-study-load-widget .dashboard-widget-heading p{margin:0;color:var(--muted-text,#777);font-size:13px}.study-load-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}.study-load-summary>div{padding:12px 13px;border:1px solid var(--border-color,#e6e1da);border-radius:12px;background:var(--hover-bg,#f7f5f2);display:grid;gap:3px}.study-load-summary strong{font-size:22px;line-height:1.05}.study-load-summary span{font-size:11px;color:var(--muted-text,#777)}.study-load-summary .study-load-overdue{border-color:rgba(220,38,38,.28);background:rgba(220,38,38,.05)}.study-load-summary .study-load-overdue strong,.study-load-summary .study-load-overdue span{color:#dc2626}.study-load-list{display:grid;gap:9px}.study-load-row{padding:11px 13px;border:1px solid var(--border-color,#e6e1da);border-radius:12px;background:var(--card-bg,#fff);min-width:0;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.study-load-row:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(0,0,0,.06)}.study-load-row:focus-visible{outline:2px solid var(--planner-accent,#304b8a);outline-offset:2px}.study-load-row-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}.study-load-subject{display:flex;align-items:center;gap:8px;min-width:0}.study-load-emoji{font-size:18px;line-height:1;flex:0 0 auto}.study-load-subject strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.study-load-count{font-size:11px;color:var(--muted-text,#777);white-space:nowrap}.study-load-bar{height:7px;border-radius:999px;background:var(--hover-bg,#eeeae5);overflow:hidden}.study-load-bar span{display:block;height:100%;width:0;border-radius:inherit;background:var(--subject-color,var(--planner-accent,#304b8a));transition:width .25s ease}.study-load-next{margin-top:6px;font-size:11px;color:var(--muted-text,#777);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.study-load-empty{padding:20px;text-align:center;color:var(--muted-text,#777);border:1px dashed var(--border-color,#ddd);border-radius:12px}@media(max-width:700px){.study-load-summary{grid-template-columns:1fr 1fr}.study-load-summary>div:last-child{grid-column:1 / -1}}`;document.head.appendChild(style);
    }
    function ensure(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid||document.querySelector('#'+WIDGET_ID))return;
        const card=document.createElement('section');
        card.className='card dashboard-study-load-widget';
        card.id=WIDGET_ID;
        card.dataset.dashboardWidget='study-load';
        card.innerHTML='<div class="dashboard-widget-heading"><div><h2>Study Load</h2><p>Where your active schoolwork is concentrated.</p></div></div><div class="study-load-summary"></div><div class="study-load-list"></div>';
        grid.appendChild(card);
        document.dispatchEvent(new Event('dashboard-widget-added'));
    }
    function render(){
        ensureStyles();ensure();
        const card=document.querySelector('#'+WIDGET_ID);if(!card)return;
        const summary=card.querySelector('.study-load-summary'),list=card.querySelector('.study-load-list');
        if(!summary||!list)return;
        const {subjects,tasks}=getData();
        const activeTasks=tasks.filter(t=>t&&!completed(t));
        const schoolTasks=activeTasks.filter(isSchool);
        const today=new Date();today.setHours(0,0,0,0);
        const weekEnd=new Date(today);weekEnd.setDate(weekEnd.getDate()+7);
        const overdue=schoolTasks.filter(t=>dateValue(t.dueDate)<today.getTime()).length;
        const nextWeek=schoolTasks.filter(t=>{const value=dateValue(t.dueDate);return value>=today.getTime()&&value<=weekEnd.getTime();}).length;
        summary.innerHTML=`<div><strong>${schoolTasks.length}</strong><span>active school items</span></div><div><strong>${nextWeek}</strong><span>due in 7 days</span></div><div class="study-load-overdue"><strong>${overdue}</strong><span>overdue</span></div>`;
        list.innerHTML='';
        if(!subjects.length){list.innerHTML='<div class="study-load-empty">Add active subjects to see your study load.</div>';return;}
        const rows=subjects.map(subject=>{
            const subjectTasks=activeTasks.filter(t=>t.subject===subject.name);
            const school=subjectTasks.filter(isSchool);
            const overdueItems=school.filter(t=>dateValue(t.dueDate)<today.getTime());
            const next=school.filter(t=>t.dueDate&&dateValue(t.dueDate)>=today.getTime()).sort((a,b)=>dateValue(a.dueDate)-dateValue(b.dueDate))[0];
            return {subject,count:subjectTasks.length,schoolCount:school.length,overdue:overdueItems.length,next};
        }).sort((a,b)=>b.schoolCount-a.schoolCount||b.count-a.count||String(a.subject.name).localeCompare(String(b.subject.name)));
        const max=Math.max(...rows.map(row=>row.schoolCount),1);
        rows.forEach(row=>{
            const item=document.createElement('div');item.className='study-load-row';item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-label',`Open ${row.subject.name} subject page`);item.style.setProperty('--subject-color',row.subject.colour||'var(--planner-accent,#304b8a)');
            item.innerHTML='<div class="study-load-row-top"><span class="study-load-subject"><span class="study-load-emoji"></span><strong></strong></span><span class="study-load-count"></span></div><div class="study-load-bar"><span></span></div><div class="study-load-next"></div>';
            item.querySelector('.study-load-emoji').textContent=row.subject.emoji||'📚';
            item.querySelector('.study-load-subject strong').textContent=row.subject.name||'Untitled subject';
            item.querySelector('.study-load-count').textContent=row.overdue?`${row.overdue} overdue · ${row.schoolCount} school`:`${row.schoolCount} school`;
            item.querySelector('.study-load-bar span').style.width=`${Math.max(0,(row.schoolCount/max)*100)}%`;
            item.querySelector('.study-load-next').textContent=row.next?`Next: ${row.next.name||'Untitled'} · ${formatDate(row.next.dueDate)}`:(row.schoolCount?'No future date scheduled':'No active schoolwork');
            item.onclick=()=>openSubject(row.subject.name);
            item.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSubject(row.subject.name);}};
            list.appendChild(item);
        });
    }
    document.addEventListener('DOMContentLoaded',render,{once:true});
    window.addEventListener('load',render,{once:true});
    document.addEventListener('planner-data-changed',render);
    document.addEventListener('dashboard-widget-added',render);
})();
