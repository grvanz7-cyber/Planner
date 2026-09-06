// ========================================
// DASHBOARD OVERVIEW + PRIORITIZATION
// ========================================
(function(){
    const priorityRank={High:0,Normal:1,Low:2};

    function tasks(){
        if(window.PlannerDB)return window.PlannerDB.getTasks();
        return typeof plannerData!=='undefined'&&Array.isArray(plannerData.tasks)?plannerData.tasks:[];
    }

    function dateValue(task){
        if(!task?.dueDate)return Infinity;
        const value=new Date(String(task.dueDate).slice(0,10)+'T00:00:00').getTime();
        return Number.isFinite(value)?value:Infinity;
    }

    function compareTasks(a,b){
        const overdueA=typeof isOverdue==='function'&&isOverdue(a),overdueB=typeof isOverdue==='function'&&isOverdue(b);
        if(overdueA!==overdueB)return overdueA?-1:1;
        const priorityA=priorityRank[a?.priority]??1,priorityB=priorityRank[b?.priority]??1;
        if(priorityA!==priorityB)return priorityA-priorityB;
        const dateA=dateValue(a),dateB=dateValue(b);if(dateA!==dateB)return dateA-dateB;
        return new Date(b?.createdAt||0).getTime()-new Date(a?.createdAt||0).getTime();
    }

    function renderPrioritizedDashboard(){
        const all=tasks(),todayContainer=document.querySelector('.today-tasks'),upcomingContainer=document.querySelector('.upcoming-tasks');
        if(!todayContainer||!upcomingContainer)return;
        const active=all.filter(task=>!task.completed&&task.status!=='Completed');
        const todayTasks=active.filter(task=>!task.dueDate||isToday(task)||isOverdue(task)).sort(compareTasks);
        const upcomingTasks=active.filter(task=>isUpcoming(task)).sort(compareTasks);
        const renderList=(container,list,emptyText,factory)=>{container.innerHTML='';if(!list.length){container.innerHTML=`<p class="empty-message">${emptyText}</p>`;return;}list.forEach(task=>{if(typeof factory==='function')container.appendChild(factory(task));});};
        renderList(todayContainer,todayTasks,'Nothing here yet!',window.createTaskElement);
        renderList(upcomingContainer,upcomingTasks,'Nothing upcoming!',window.createUpcomingElement);
    }

    function ensureStyles(){
        if(document.getElementById('dashboardOverviewStyles'))return;
        const style=document.createElement('style');
        style.id='dashboardOverviewStyles';
        style.textContent=`
        .dashboard-stats-card{position:relative;overflow:hidden}
        .dashboard-stats-card h2{display:flex;align-items:center;margin:0 0 14px;font-size:17px}
        .dashboard-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
        .dashboard-stat{min-width:0;padding:11px 8px;border:1px solid var(--border-color,#e6e1da);border-radius:11px;background:var(--hover-bg,#f7f4ef);text-align:center}
        .dashboard-stat strong{display:block;font-size:22px;line-height:1.05;font-weight:700;color:var(--text-color,#505148)}
        .dashboard-stat span{display:block;margin-top:4px;font-size:10px;color:var(--muted-text,#969082);white-space:nowrap}
        .dashboard-priority-summary{display:flex;align-items:center;gap:7px;margin-top:11px;flex-wrap:wrap;font-size:10px;color:var(--muted-text,#969082)}
        .dashboard-priority-summary>span:not(:first-child){padding:4px 7px;border-radius:7px;background:var(--hover-bg,#f4f1ed)}
        .dashboard-priority-summary>span:nth-child(2){background:#f7e7e2;color:#a05c4d}.dashboard-priority-summary>span:nth-child(3){background:#f0eadf;color:#82796b}.dashboard-priority-summary>span:nth-child(4){background:#ecebe7;color:#77766e}
        .dashboard-progress{height:7px;margin-top:12px;border-radius:999px;background:var(--hover-bg,#ece8e1);overflow:hidden}
        .dashboard-progress>div{height:100%;width:0;border-radius:inherit;background:var(--planner-accent,#687b5e);transition:width .25s ease}
        .dashboard-progress-text{margin:6px 0 0;text-align:right;font-size:10px;color:var(--muted-text,#969082)}
        .dashboard-widget-small.dashboard-stats-card{padding:14px!important}
        .dashboard-widget-small .dashboard-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
        .dashboard-widget-small .dashboard-stats-card h2{margin-bottom:9px}
        .dashboard-widget-small .dashboard-stat{padding:8px 5px;border-radius:8px}
        .dashboard-widget-small .dashboard-stat strong{font-size:17px}
        .dashboard-widget-small .dashboard-stat span{font-size:8px;margin-top:3px}
        .dashboard-widget-small .dashboard-priority-summary{display:none}
        .dashboard-widget-small .dashboard-progress{margin-top:8px;height:5px}
        .dashboard-widget-small .dashboard-progress-text{font-size:9px;margin-top:4px}
        .dashboard-widget-medium-vertical .dashboard-stats-grid,.dashboard-widget-large .dashboard-stats-grid{gap:10px}
        .dashboard-widget-medium-vertical .dashboard-stat,.dashboard-widget-large .dashboard-stat{padding:14px 9px}
        .dashboard-widget-medium-vertical .dashboard-stat strong,.dashboard-widget-large .dashboard-stat strong{font-size:25px}
        .dashboard-widget-medium-vertical .dashboard-priority-summary,.dashboard-widget-large .dashboard-priority-summary{margin-top:14px}
        @media(max-width:700px){.dashboard-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        `;
        document.head.appendChild(style);
    }

    function ensureStatsCard(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');if(!grid||document.querySelector('#dashboardStatsCard'))return;
        const card=document.createElement('section');card.className='card dashboard-stats-card';card.id='dashboardStatsCard';
        card.innerHTML='<h2>Overview</h2><div class="dashboard-stats-grid"><div class="dashboard-stat"><strong id="dashboardStatToday">0</strong><span>Today</span></div><div class="dashboard-stat"><strong id="dashboardStatUpcoming">0</strong><span>Upcoming</span></div><div class="dashboard-stat"><strong id="dashboardStatOverdue">0</strong><span>Overdue</span></div><div class="dashboard-stat"><strong id="dashboardStatCompleted">0</strong><span>Completed</span></div></div><div class="dashboard-priority-summary"><span>Priority</span><span id="dashboardHighCount">0 High</span><span id="dashboardNormalCount">0 Normal</span><span id="dashboardLowCount">0 Low</span></div><div class="dashboard-progress"><div id="dashboardProgressBar"></div></div><p id="dashboardProgressText" class="dashboard-progress-text">0% complete</p>';
        grid.appendChild(card);
        document.dispatchEvent(new Event('dashboard-widget-added'));
    }

    function setText(id,value){const node=document.getElementById(id);if(node)node.textContent=value;}

    function updateStats(){
        if(!document.querySelector('#dashboardPage'))return;
        ensureStyles();
        ensureStatsCard();
        const all=tasks();
        const active=all.filter(task=>!task.completed&&task.status!=='Completed');
        const completed=all.filter(task=>task.completed||task.status==='Completed');
        const today=active.filter(task=>task.dueDate&&isToday(task));
        const overdue=active.filter(task=>isOverdue(task));
        const upcoming=active.filter(task=>isUpcoming(task));
        const high=active.filter(task=>task.priority==='High').length;
        const normal=active.filter(task=>task.priority==='Normal'||!task.priority).length;
        const low=active.filter(task=>task.priority==='Low').length;
        const percent=all.length?Math.round(completed.length/all.length*100):0;
        setText('dashboardStatToday',today.length);
        setText('dashboardStatUpcoming',upcoming.length);
        setText('dashboardStatOverdue',overdue.length);
        setText('dashboardStatCompleted',completed.length);
        setText('dashboardHighCount',`${high} High`);
        setText('dashboardNormalCount',`${normal} Normal`);
        setText('dashboardLowCount',`${low} Low`);
        setText('dashboardProgressText',`${percent}% complete`);
        const bar=document.getElementById('dashboardProgressBar');
        if(bar){bar.style.width=`${percent}%`;bar.setAttribute('aria-valuenow',String(percent));bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('role','progressbar');bar.title=`${percent}% complete`;}
    }

    function refreshDashboard(){ensureStatsCard();updateStats();}

    function install(){
        if(window.__dashboardPriorityStatsInstalled)return true;
        if(typeof window.renderTasks!=='function')return false;
        const originalRender=window.renderTasks;
        window.renderTasks=function(){const result=originalRender.apply(this,arguments);renderPrioritizedDashboard();updateStats();return result;};
        window.__dashboardPriorityStatsInstalled=true;return true;
    }

    function boot(){ensureStyles();install();refreshDashboard();renderPrioritizedDashboard();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});
    window.addEventListener('load',boot,{once:true});
    document.addEventListener('planner-data-changed',()=>{refreshDashboard();renderPrioritizedDashboard();});
})();
