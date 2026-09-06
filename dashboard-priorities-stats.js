// ========================================
// DASHBOARD PRIORITIZATION + STATISTICS
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
    function ensureStatsCard(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');if(!grid||document.querySelector('#dashboardStatsCard'))return;
        const card=document.createElement('section');card.className='card dashboard-stats-card';card.id='dashboardStatsCard';
        card.innerHTML='<h2>Overview</h2><div class="dashboard-stats-grid"><div class="dashboard-stat"><strong id="dashboardStatToday">0</strong><span>Today</span></div><div class="dashboard-stat"><strong id="dashboardStatUpcoming">0</strong><span>Upcoming</span></div><div class="dashboard-stat"><strong id="dashboardStatOverdue">0</strong><span>Overdue</span></div><div class="dashboard-stat"><strong id="dashboardStatCompleted">0</strong><span>Completed</span></div></div><div class="dashboard-priority-summary"><span>Priority</span><span id="dashboardHighCount">0 High</span><span id="dashboardNormalCount">0 Normal</span><span id="dashboardLowCount">0 Low</span></div><div class="dashboard-progress"><div id="dashboardProgressBar"></div></div><p id="dashboardProgressText" class="dashboard-progress-text">0% complete</p>';
        grid.appendChild(card);
        document.dispatchEvent(new Event('dashboard-widget-added'));
    }
    function setText(id,value){const node=document.getElementById(id);if(node)node.textContent=value;}
    function updateStats(){
        if(!document.querySelector('#dashboardPage'))return;ensureStatsCard();const all=tasks();
        const active=all.filter(task=>!task.completed&&task.status!=='Completed'),completed=all.filter(task=>task.completed||task.status==='Completed');
        const today=active.filter(task=>task.dueDate&&isToday(task)),overdue=active.filter(task=>isOverdue(task)),upcoming=active.filter(task=>isUpcoming(task));
        const high=active.filter(task=>task.priority==='High').length,normal=active.filter(task=>task.priority==='Normal'||!task.priority).length,low=active.filter(task=>task.priority==='Low').length,percent=all.length?Math.round(completed.length/all.length*100):0;
        setText('dashboardStatToday',today.length);setText('dashboardStatUpcoming',upcoming.length);setText('dashboardStatOverdue',overdue.length);setText('dashboardStatCompleted',completed.length);setText('dashboardHighCount',`${high} High`);setText('dashboardNormalCount',`${normal} Normal`);setText('dashboardLowCount',`${low} Low`);setText('dashboardProgressText',`${percent}% complete`);
        const bar=document.getElementById('dashboardProgressBar');if(bar){bar.style.width=`${percent}%`;bar.setAttribute('aria-valuenow',String(percent));bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('role','progressbar');bar.title=`${percent}% complete`;}
    }
    function refreshDashboard(){ensureStatsCard();updateStats();}
    function install(){
        if(window.__dashboardPriorityStatsInstalled)return true;
        if(typeof window.renderTasks!=='function')return false;
        const originalRender=window.renderTasks;
        window.renderTasks=function(){const result=originalRender.apply(this,arguments);renderPrioritizedDashboard();updateStats();return result;};
        window.__dashboardPriorityStatsInstalled=true;return true;
    }
    function boot(){install();refreshDashboard();renderPrioritizedDashboard();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});window.addEventListener('load',boot,{once:true});
    document.addEventListener('planner-data-changed',()=>{refreshDashboard();renderPrioritizedDashboard();});
})();
