// ========================================
// PAGE NAVIGATION
// ========================================

const VALID_PAGES = ['dashboard', 'calendar', 'tasks', 'settings'];

function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
}

function showPage(page, updateHistory = true) {
    if (!VALID_PAGES.includes(page)) page = 'dashboard';
    const pages = {
        dashboard: document.querySelector('#dashboardPage'),
        calendar: document.querySelector('#calendarPage'),
        tasks: document.querySelector('#tasksPage'),
        settings: document.querySelector('#settingsPage')
    };
    Object.values(pages).forEach(element => { if (element) element.classList.add('page-hidden'); });
    if (pages[page]) pages[page].classList.remove('page-hidden');
    setActiveNav(page);
    if (page === 'settings') {
        if (typeof renderSubjects === 'function') renderSubjects();
        if (typeof renderTaskTypes === 'function') renderTaskTypes();
    } else if (page === 'calendar') {
        if (typeof renderCalendar === 'function') renderCalendar();
    } else if (page === 'tasks') {
        if (typeof renderAllTasks === 'function') renderAllTasks();
    } else {
        if (typeof renderTasks === 'function') renderTasks();
    }
    if (updateHistory) history.replaceState(null, '', `#${page}`);
}

function loadSavedPage() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    showPage(VALID_PAGES.includes(hash) ? hash : 'dashboard', false);
}

window.addEventListener('hashchange', loadSavedPage);
document.addEventListener('DOMContentLoaded', loadSavedPage);
