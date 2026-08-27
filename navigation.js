// ========================================
// PAGE NAVIGATION
// ========================================

function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const target = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (target) target.classList.add('active');
}

function showPage(page, updateHistory = true) {
    const dashboard = document.querySelector('#dashboardPage');
    const settings = document.querySelector('#settingsPage');

    if (!dashboard || !settings) return;

    dashboard.classList.add('page-hidden');
    settings.classList.add('page-hidden');

    if (page === 'settings') {
        settings.classList.remove('page-hidden');
        if (typeof renderSubjects === 'function') renderSubjects();
        if (typeof renderTaskTypes === 'function') renderTaskTypes();
    } else {
        dashboard.classList.remove('page-hidden');
        page = 'dashboard';
        if (typeof renderTasks === 'function') renderTasks();
    }

    setActiveNav(page);

    if (updateHistory) {
        history.replaceState(null, '', `#${page}`);
    }
}

function loadSavedPage() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const page = hash === 'settings' ? 'settings' : 'dashboard';
    showPage(page, false);
}

window.addEventListener('hashchange', loadSavedPage);

document.addEventListener('DOMContentLoaded', loadSavedPage);
