// ========================================
// CALENDAR DAY CLICK + DASHBOARD EDITING
// ========================================

function openNewTaskForCalendarDate(dateString) {
    if (typeof openTaskModal !== 'function') return;
    openTaskModal();
    const dueDate = document.querySelector('#taskDueDate');
    if (dueDate) dueDate.value = dateString;
}

function attachDashboardTaskEditing() {
    document.querySelectorAll('.today-tasks [data-task-id], .upcoming-tasks [data-task-id]').forEach(element => {
        if (element.dataset.editAttached === 'true') return;
        element.dataset.editAttached = 'true';
        element.style.cursor = 'pointer';
        element.addEventListener('dblclick', () => {
            const id = element.dataset.taskId;
            if (typeof openEditTaskModal === 'function') openEditTaskModal(id);
        });
    });
}

// Wrap renderTasks so dashboard items become editable without changing
// the existing rendering code. Single click keeps the existing behaviour;
// double-click opens the editor.
if (typeof window.renderTasks === 'function') {
    const originalRenderTasksForDashboard = window.renderTasks;
    window.renderTasks = function () {
        originalRenderTasksForDashboard();
        attachDashboardTaskEditing();
    };
}

// Allow the dashboard task renderer to expose IDs if it hasn't already.
const dashboardObserver = new MutationObserver(() => attachDashboardTaskEditing());
function startDashboardTaskObserver() {
    document.querySelectorAll('.today-tasks, .upcoming-tasks').forEach(container => {
        dashboardObserver.observe(container, { childList: true, subtree: true });
    });
    attachDashboardTaskEditing();
}

document.addEventListener('DOMContentLoaded', startDashboardTaskObserver);
