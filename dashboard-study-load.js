// ========================================
// DASHBOARD STUDY LOAD WIDGET
// ========================================
(function installDashboardStudyLoad(){
    const WIDGET_ID='dashboardStudyLoadWidget';

    function getData(){
        return {
            subjects:Array.isArray(window.plannerData?.settings?.subjects)?window.plannerData.settings.subjects:[],
            tasks:Array.isArray(window.plannerData?.tasks)?window.plannerData.tasks:[]
        };
    }

    function completed(task){
        return !!task?.completed || String(task?.status||'').toLowerCase()==='completed';
    }

    function isSchool(task){
        const type=String(task?.type||'').toLowerCase();
        const tags=Array.isArray(task?.tags)?task.tags.map(String):[];
        return tags.some(tag=>tag.toLowerCase()==='#school') || ['assignment','quiz','test','exam','lab','project','presentation','essay','report','assessment'].includes(type);
    }

    function dateValue(value){
        if(!value)return Infinity;
        const d=new Date(String(value).slice(0,10)+'T00:00:00');
        return Number.isNaN(d.getTime())?Infinity:d.getTime();
    }

    function ensure(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid || document.querySelector('#'+WIDGET_ID))return;

        const card=document.createElement('section');
        card.className='card dashboard-study-load-widget';
        card.id=WIDGET_ID;
        card.innerHTML='<div class="dashboard-widget-heading"><div><h2>Study Load</h2><p>Where your active schoolwork is concentrated</p></div></div><div class="study-load-summary"></div><div class="study-load-list"></div>';
        grid.appendChild(card);
        document.dispatchEvent(new Event('dashboard-widget-added'));
    }

    function render(){
        ensure();
        const card=document.querySelector('#'+WIDGET_ID);
        if(!card)return;

        const summary=card.querySelector('.study-load-summary');
        const list=card.querySelector('.study-load-list');
        if(!summary || !list)return;

        const {subjects,tasks}=getData();
        const activeSubjects=subjects.filter(s=>s&&s.active!==false);
        const activeTasks=tasks.filter(t=>t&&!completed(t));
        const schoolTasks=activeTasks.filter(isSchool);
        const dueTasks=schoolTasks.filter(t=>t.dueDate).sort((a,b)=>dateValue(a.dueDate)-dateValue(b.dueDate));

        const today=new Date();
        today.setHours(0,0,0,0);
        const weekEnd=new Date(today);
        weekEnd.setDate(weekEnd.getDate()+7);

        const overdue=schoolTasks.filter(t=>dateValue(t.dueDate)<today.getTime()).length;
        const nextWeek=schoolTasks.filter(t=>{
            const value=dateValue(t.dueDate);
            return value>=today.getTime() && value<=weekEnd.getTime();
        }).length;

        summary.innerHTML=`<div><strong>${schoolTasks.length}</strong><span>active school items</span></div><div><strong>${nextWeek}</strong><span>due this week</span></div><div class="study-load-overdue"><strong>${overdue}</strong><span>overdue</span></div>`;
        list.innerHTML='';

        if(!activeSubjects.length){
            list.innerHTML='<div class="study-load-empty">Add active subjects to see your study load.</div>';
            return;
        }

        const rows=activeSubjects.map(subject=>{
            const subjectTasks=activeTasks.filter(t=>t.subject===subject.name);
            const school=subjectTasks.filter(isSchool);
            const next=school.filter(t=>t.dueDate).sort((a,b)=>dateValue(a.dueDate)-dateValue(b.dueDate))[0];
            return {subject,count:subjectTasks.length,schoolCount:school.length,next};
        }).sort((a,b)=>b.schoolCount-a.schoolCount || b.count-a.count || String(a.subject.name).localeCompare(String(b.subject.name)));

        const max=Math.max(...rows.map(row=>row.schoolCount),1);
        rows.forEach(row=>{
            const item=document.createElement('div');
            item.className='study-load-row';
            item.style.setProperty('--subject-color',row.subject.colour||'var(--planner-accent,#304b8a)');
            const nextText=row.next ? `Next: ${row.next.name||'Untitled'} · ${String(row.next.dueDate).slice(0,10)}` : 'Nothing scheduled';
            item.innerHTML='<div class="study-load-row-top"><span class="study-load-subject"><span class="study-load-emoji"></span><strong></strong></span><span class="study-load-count"></span></div><div class="study-load-bar"><span></span></div><div class="study-load-next"></div>';
            item.querySelector('.study-load-emoji').textContent=row.subject.emoji||'📚';
            item.querySelector('.study-load-subject strong').textContent=row.subject.name||'Untitled subject';
            item.querySelector('.study-load-count').textContent=`${row.schoolCount} school · ${row.count} total`;
            item.querySelector('.study-load-bar span').style.width=`${Math.max(0,(row.schoolCount/max)*100)}%`;
            item.querySelector('.study-load-next').textContent=nextText;
            list.appendChild(item);
        });
    }

    function boot(){render();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});
    window.addEventListener('load',boot,{once:true});
    document.addEventListener('click',()=>setTimeout(render,0));
    document.addEventListener('change',()=>setTimeout(render,0));
})();
