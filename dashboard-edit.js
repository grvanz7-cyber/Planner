// ========================================
// DASHBOARD TASK EDITING
// ========================================

function openDashboardTask(taskId) {
    if (typeof window.openEditTaskModal === 'function') window.openEditTaskModal(taskId);
}

function makeDashboardTaskEditable(element, task) {
    if (!element || !task) return;
    element.classList.add('task-editable');
    element.title = 'Click to edit';
    element.addEventListener('click', event => {
        if (event.target && event.target.tagName === 'INPUT') return;
        openDashboardTask(task.id);
    });
}

const originalCreateTaskElementForDashboard = window.createTaskElement;
if (typeof originalCreateTaskElementForDashboard === 'function') {
    window.createTaskElement = function(task) {
        const element = originalCreateTaskElementForDashboard(task);
        makeDashboardTaskEditable(element, task);
        return element;
    };
}

const originalCreateUpcomingElementForDashboard = window.createUpcomingElement;
if (typeof originalCreateUpcomingElementForDashboard === 'function') {
    window.createUpcomingElement = function(task) {
        const element = originalCreateUpcomingElementForDashboard(task);
        makeDashboardTaskEditable(element, task);
        return element;
    };
}
