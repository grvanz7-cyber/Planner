// ========================================
// DASHBOARD PRIORITIZATION + STATISTICS
// ========================================

(function () {
    const priorityRank = { High: 0, Normal: 1, Low: 2 };

    function getTaskData() {
        return (typeof plannerData !== 'undefined' && Array.isArray(plannerData.tasks)) ? plannerData.tasks : [];
    }

    function dateValue(task) {
        if (!task?.dueDate) return Number.POSITIVE_INFINITY;
        const value = new Date(task.dueDate + 'T00:00:00').getTime();
        return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
    }

    function compareTasks(a, b) {
        const overdueA = typeof isOverdue === 'function' && isOverdue(a);
        const overdueB = typeof isOverdue === 'function' && isOverdue(b);
        if (overdueA !== overdueB) return overdueA ? -1 : 1;
        const priorityA = priorityRank[a?.priority] ?? 1;
        const priorityB = priorityRank[b?.priority] ?? 1;
        if (priorityA !== priorityB) return priorityA - priorityB;
        const dateA = dateValue(a);
        const dateB = dateValue(b);
        if (dateA !== dateB) return dateA - dateB;
        const createdA = new Date(a?.createdAt || 0).getTime();
        const createdB = new Date(b?.createdAt || 0).getTime();
        return createdB - createdA;
    }

    function renderPrioritizedDashboard() {
        const tasks = getTaskData();
        if (!tasks.length) return;
        const todayContainer = document.querySelector('.today-tasks');
        const upcomingContainer = document.querySelector('.upcoming-tasks');
        if (!todayContainer || !upcomingContainer) return;
        const active = tasks.filter(task => !task.completed);
        const todayTasks = active.filter(task => !task.dueDate || isToday(task) || isOverdue(task)).sort(compareTasks);
        const upcomingTasks = active.filter(task => isUpcoming(task)).sort(compareTasks);

        function renderList(container, list, emptyText, factory) {
            container.innerHTML = '';
            if (!list.length) {
                container.innerHTML = `<p class="empty-message">${emptyText}</p>`;
                return;
            }
            list.forEach(task => container.appendChild(factory(task)));
        }
        renderList(todayContainer, todayTasks, 'Nothing here yet!', createTaskElement);
        renderList(upcomingContainer, upcomingTasks, 'Nothing upcoming!', createUpcomingElement);
    }

    function ensureStatsCard() {
        const dashboard = document.querySelector('#dashboardPage');
        const grid = dashboard?.querySelector('.dashboard-grid');
        if (!grid || document.querySelector('#dashboardStatsCard')) return;
        const card = document.createElement('section');
        card.className = 'card dashboard-stats-card';
        card.id = 'dashboardStatsCard';
        card.innerHTML = `
            <h2>Overview</h2>
            <div class="dashboard-stats-grid">
                <div class="dashboard-stat"><strong id="dashboardStatToday">0</strong><span>Today</span></div>
                <div class="dashboard-stat"><strong id="dashboardStatUpcoming">0</strong><span>Upcoming</span></div>
                <div class="dashboard-stat"><strong id="dashboardStatOverdue">0</strong><span>Overdue</span></div>
                <div class="dashboard-stat"><strong id="dashboardStatCompleted">0</strong><span>Completed</span></div>
            </div>
            <div class="dashboard-progress"><div id="dashboardProgressBar"></div></div>
            <p id="dashboardProgressText" class="dashboard-progress-text">0% complete</p>
        `;
        grid.appendChild(card);
    }

    function updateStats() {
        const tasks = getTaskData();
        if (!document.querySelector('#dashboardPage')) return;
        ensureStatsCard();
        const active = tasks.filter(task => !task.completed);
        const completed = tasks.filter(task => task.completed);
        const today = active.filter(task => task.dueDate && isToday(task));
        const overdue = active.filter(task => isOverdue(task));
        const upcoming = active.filter(task => isUpcoming(task));
        const total = tasks.length;
        const percent = total ? Math.round((completed.length / total) * 100) : 0;

        const set = (id, value) => {
            const node = document.querySelector('#' + id);
            if (node) node.textContent = value;
        };
        set('dashboardStatToday', today.length);
        set('dashboardStatUpcoming', upcoming.length);
        set('dashboardStatOverdue', overdue.length);
        set('dashboardStatCompleted', completed.length);
        set('dashboardProgressText', `${percent}% complete`);

        const bar = document.querySelector('#dashboardProgressBar');
        if (bar) {
            bar.style.width = `${percent}%`;
            bar.setAttribute('aria-valuenow', String(percent));
            bar.setAttribute('title', `${percent}% complete`);
        }
    }

    function refreshDashboard() {
        ensureStatsCard();
        renderPrioritizedDashboard();
        updateStats();
    }

    function install() {
        if (window.__dashboardPriorityStatsInstalled) return true;
        if (typeof window.renderTasks !== 'function') return false;
        const originalRender = window.renderTasks;
        window.renderTasks = function () {
            originalRender.apply(this, arguments);
            refreshDashboard();
        };
        window.__dashboardPriorityStatsInstalled = true;
        return true;
    }

    function installLiveUpdates() {
        if (window.__dashboardStatsLiveUpdatesInstalled) return;
        window.__dashboardStatsLiveUpdatesInstalled = true;
        document.addEventListener('click', () => setTimeout(refreshDashboard, 0));
        document.addEventListener('change', () => setTimeout(refreshDashboard, 0));
        window.addEventListener('storage', refreshDashboard);
        setInterval(refreshDashboard, 500);
    }

    const timer = setInterval(() => {
        if (install()) clearInterval(timer);
        refreshDashboard();
    }, 25);

    setTimeout(() => clearInterval(timer), 10000);
    document.addEventListener('DOMContentLoaded', () => {
        install();
        installLiveUpdates();
        refreshDashboard();
    });
    window.addEventListener('load', () => {
        install();
        installLiveUpdates();
        refreshDashboard();
    });
    installLiveUpdates();
})();
