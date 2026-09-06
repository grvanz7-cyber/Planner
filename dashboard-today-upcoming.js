// ========================================
// DASHBOARD TODAY + UPCOMING WIDGETS
// ========================================
(function installDashboardTodayUpcoming(){
    const STYLE_ID='dashboardTodayUpcomingStyles';

    function data(){
        try{
            if(window.PlannerDB)return {tasks:window.PlannerDB.getTasks(),subjects:window.PlannerDB.getSubjects()};
            return {tasks:Array.isArray(window.plannerData?.tasks)?window.plannerData.tasks:[],subjects:Array.isArray(window.plannerData?.settings?.subjects)?window.plannerData.settings.subjects:[]};
        }catch(e){return {tasks:[],subjects:[]};}
    }

    function dateOnly(value){
        if(!value)return null;
        const d=new Date(String(value).slice(0,10)+'T00:00:00');
        return Number.isNaN(d.getTime())?null:d;
    }

    function today(){const d=new Date();d.setHours(0,0,0,0);return d;}
    function isToday(task){const d=dateOnly(task?.dueDate);return !!d&&d.getTime()===today().getTime();}
    function isOverdue(task){const d=dateOnly(task?.dueDate);return !!d&&d<today();}

    function formatDue(value,mode){
        const d=dateOnly(value);if(!d)return mode==='today'?'No due date':'No date';
        if(isToday({dueDate:value}))return 'Today';
        const diff=Math.round((d-today())/86400000);
        if(diff===1)return 'Tomorrow';
        if(diff>1&&diff<7)return d.toLocaleDateString(undefined,{weekday:'short'});
        return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
    }

    function escape(value){
        if(typeof window.escapeHTML==='function')return window.escapeHTML(String(value??''));
        const div=document.createElement('div');div.textContent=String(value??'');return div.innerHTML;
    }

    function ensureStyles(){
        if(document.getElementById(STYLE_ID))return;
        const style=document.createElement('style');style.id=STYLE_ID;
        style.textContent=`
        #dashboardPage .dashboard-grid .today-tasks,
        #dashboardPage .dashboard-grid .upcoming-tasks{min-width:0}
        .dashboard-task-list{display:grid;gap:7px}
        .dashboard-task-row{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-width:0;padding:10px 11px;border:1px solid var(--border-color,#e6e1da);border-radius:11px;background:var(--card-bg,#fff);box-sizing:border-box;transition:background .15s ease,border-color .15s ease,transform .15s ease}
        .dashboard-task-row:hover{background:var(--hover-bg,#f4f1ed);transform:translateY(-1px)}
        .dashboard-task-row.overdue{border-left:3px solid #c96d6d;padding-left:9px}
        .dashboard-task-row.today{border-left:3px solid var(--planner-accent,#687b5e);padding-left:9px}
        .dashboard-task-check{width:28px;height:28px;border:1px solid var(--border-color,#ded5c6);border-radius:8px;background:var(--card-background,#fff);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;font:inherit;color:var(--muted-text,#777);font-size:15px}
        .dashboard-task-check:hover{background:var(--hover-bg,#f4f1ed);border-color:var(--planner-accent,#687b5e)}
        .dashboard-task-icon{width:28px;height:28px;border-radius:8px;background:var(--task-soft,rgba(104,123,94,.10));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
        .dashboard-task-main{display:grid;gap:3px;min-width:0;text-align:left}
        .dashboard-task-name{font-size:13px;font-weight:600;color:var(--text-color,#505148);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dashboard-task-meta{font-size:11px;color:var(--muted-text,#969082);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dashboard-task-side{display:flex;align-items:center;gap:7px;justify-content:flex-end;min-width:0}
        .dashboard-task-due{font-size:11px;font-weight:600;color:var(--muted-text,#777);white-space:nowrap}
        .dashboard-task-row.overdue .dashboard-task-due{color:#b45c5c}
        .dashboard-task-priority{font-size:10px;padding:4px 7px;border-radius:7px;background:#f0eadf;color:#82796b;white-space:nowrap}
        .dashboard-task-priority.high{background:#f7e7e2;color:#a05c4d}.dashboard-task-priority.low{opacity:.72}
        .dashboard-widget-count{font-size:11px;font-weight:600;color:var(--muted-text,#969082);margin-left:auto}
        .dashboard-task-empty{padding:22px 8px;text-align:center;color:var(--muted-text,#a29b8e);font-size:13px}
        .dashboard-upcoming-day{display:grid;gap:6px}.dashboard-upcoming-day+.dashboard-upcoming-day{margin-top:12px}
        .dashboard-upcoming-day-label{display:flex;align-items:center;justify-content:space-between;padding:0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-text,#9a9488)}
        .dashboard-upcoming-day-label strong{font-size:11px;letter-spacing:0;text-transform:none;color:var(--text-color,#68685f)}
        .dashboard-widget-small .dashboard-task-list{gap:5px}.dashboard-widget-small .dashboard-task-row{grid-template-columns:26px minmax(0,1fr);padding:7px 8px}.dashboard-widget-small .dashboard-task-side{display:none}.dashboard-widget-small .dashboard-task-icon{width:24px;height:24px;font-size:14px}.dashboard-widget-small .dashboard-task-name{font-size:12px}.dashboard-widget-small .dashboard-task-meta{font-size:9px}.dashboard-widget-small .dashboard-task-row:nth-child(n+3){display:none}
        .dashboard-widget-medium-vertical .dashboard-task-list,.dashboard-widget-large .dashboard-task-list{gap:8px}
        @media(max-width:700px){.dashboard-task-row{grid-template-columns:30px minmax(0,1fr) auto}.dashboard-task-priority{display:none}.dashboard-upcoming-day+.dashboard-upcoming-day{margin-top:10px}}
        `;
        document.head.appendChild(style);
    }

    function subjectFor(task,subjects){return subjects.find(s=>s&&s.name===task?.subject)||null;}
    function typeIcon(task){
        const t=String(task?.type||'').toLowerCase();
        if(t==='quiz')return '❓';if(t==='test')return '🧪';if(t==='exam')return '🎓';if(t==='assignment')return '📝';if(t==='homework')return '📚';return '✓';
    }

    function complete(task){
        if(typeof window.toggleTask==='function'){window.toggleTask(task.id);return;}
        task.completed=true;if(typeof window.savePlannerData==='function')window.savePlannerData();
        document.dispatchEvent(new Event('planner-data-changed'));
    }

    function open(task){if(typeof window.openDashboardTask==='function')window.openDashboardTask(task.id);else if(typeof window.openEditTaskModal==='function')window.openEditTaskModal(task.id);}

    function taskRow(task,subjects,showCheck){
        const subject=subjectFor(task,subjects),icon=subject?.emoji||typeIcon(task),colour=subject?.colour||'#687b5e';
        const row=document.createElement('div');row.className='dashboard-task-row'+(isOverdue(task)?' overdue':'')+(isToday(task)?' today':'');row.style.setProperty('--task-soft',colour+'18');
        const leading=document.createElement('button');leading.type='button';leading.className=showCheck?'dashboard-task-check':'dashboard-task-icon';leading.setAttribute('aria-label',showCheck?'Complete '+(task.name||'task'):'Open '+(task.name||'task'));leading.textContent=showCheck?'✓':icon;
        leading.addEventListener('click',e=>{e.stopPropagation();showCheck?complete(task):open(task);});
        const main=document.createElement('button');main.type='button';main.className='dashboard-task-main';main.style.cssText='border:0;background:none;padding:0;margin:0;font:inherit;cursor:pointer;width:100%';
        const name=document.createElement('span');name.className='dashboard-task-name';name.textContent=task.name||'Untitled task';
        const meta=document.createElement('span');meta.className='dashboard-task-meta';meta.textContent=[task.subject,task.type].filter(Boolean).join(' · ')||'Task';
        main.append(name,meta);main.addEventListener('click',()=>open(task));
        const side=document.createElement('div');side.className='dashboard-task-side';
        const due=document.createElement('span');due.className='dashboard-task-due';due.textContent=isOverdue(task)?'Overdue':formatDue(task.dueDate,'today');
        const priority=document.createElement('span');priority.className='dashboard-task-priority '+String(task.priority||'Normal').toLowerCase();priority.textContent=task.priority||'Normal';
        side.append(due,priority);row.append(leading,main,side);return row;
    }

    function renderToday(){
        const container=document.querySelector('.today-tasks');if(!container)return;
        const {tasks,subjects}=data();const active=tasks.filter(t=>!t?.completed&&String(t?.status||'').toLowerCase()!=='completed');
        const list=active.filter(t=>!t.dueDate||isToday(t)||isOverdue(t)).sort((a,b)=>{
            const overdue=(isOverdue(b)?1:0)-(isOverdue(a)?1:0);if(overdue)return overdue;
            const pa={High:0,Normal:1,Low:2};const p=(pa[a.priority]??1)-(pa[b.priority]??1);if(p)return p;
            return (dateOnly(a.dueDate)?.getTime()??Infinity)-(dateOnly(b.dueDate)?.getTime()??Infinity);
        });
        container.innerHTML='';
        const card=container.closest('.card'),heading=card?.querySelector('h2');
        if(heading&&!heading.querySelector('.dashboard-widget-count')){const count=document.createElement('span');count.className='dashboard-widget-count';heading.style.display='flex';heading.style.alignItems='center';count.textContent=list.length?list.length+' active':'';heading.appendChild(count);}
        if(!list.length){container.innerHTML='<div class="dashboard-task-empty">Nothing here yet!</div>';return;}
        const wrap=document.createElement('div');wrap.className='dashboard-task-list';list.forEach(t=>wrap.appendChild(taskRow(t,subjects,true)));container.appendChild(wrap);
    }

    function renderUpcoming(){
        const container=document.querySelector('.upcoming-tasks');if(!container)return;
        const {tasks,subjects}=data();const active=tasks.filter(t=>!t?.completed&&String(t?.status||'').toLowerCase()!=='completed');
        const list=active.filter(t=>isUpcoming(t)).sort((a,b)=>(dateOnly(a.dueDate)?.getTime()??Infinity)-(dateOnly(b.dueDate)?.getTime()??Infinity));
        container.innerHTML='';
        if(!list.length){container.innerHTML='<div class="dashboard-task-empty">Nothing upcoming!</div>';return;}
        const groups=[];list.slice(0,12).forEach(task=>{const key=String(task.dueDate).slice(0,10);let group=groups.find(g=>g.key===key);if(!group){group={key,tasks:[]};groups.push(group);}group.tasks.push(task);});
        const wrap=document.createElement('div');wrap.className='dashboard-task-list';groups.forEach(group=>{const section=document.createElement('div');section.className='dashboard-upcoming-day';const label=document.createElement('div');label.className='dashboard-upcoming-day-label';label.innerHTML='<span>'+escape(formatDue(group.key,'upcoming'))+'</span><strong>'+group.tasks.length+'</strong>';section.appendChild(label);group.tasks.forEach(t=>section.appendChild(taskRow(t,subjects,false)));wrap.appendChild(section);});container.appendChild(wrap);
    }

    function installFactories(){
        window.createTaskElement=function(task){
            const subjects=data().subjects;return taskRow(task,subjects,true);
        };
        window.createUpcomingElement=function(task){
            const subjects=data().subjects;return taskRow(task,subjects,false);
        };
    }

    function render(){ensureStyles();installFactories();renderToday();renderUpcoming();}
    function boot(){render();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});
    window.addEventListener('load',boot,{once:true});
    document.addEventListener('planner-data-changed',render);
})();
