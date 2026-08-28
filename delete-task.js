// ========================================
// TASK DELETION
// ========================================
// Adds a safe delete action to the existing task edit modal.
// Dashboard, Tasks, and Calendar already open this modal, so deletion
// is available consistently from all three locations.

(function () {
    function getTaskById(id) {
        if (typeof plannerData === 'undefined' || !Array.isArray(plannerData.tasks)) return null;
        return plannerData.tasks.find(task => String(task.id) === String(id)) || null;
    }

    function deleteTaskById(id) {
        const task = getTaskById(id);
        if (!task) return false;

        const taskName = task.name || 'this task';
        const confirmed = window.confirm(`Delete “${taskName}”?\n\nThis cannot be undone.`);
        if (!confirmed) return false;

        plannerData.tasks = plannerData.tasks.filter(t => String(t.id) !== String(id));
        if (typeof savePlannerData === 'function') savePlannerData();

        if (typeof closeTaskModal === 'function') closeTaskModal();

        ['renderTasks', 'renderAllTasks', 'renderDashboard', 'renderCalendar', 'renderAssignments', 'updateDashboard']
            .forEach(fn => {
                if (typeof window[fn] === 'function') {
                    try { window[fn](); } catch (error) { console.warn(`Could not refresh ${fn}`, error); }
                }
            });

        return true;
    }

    function addDeleteButton(taskId) {
        const modal = document.querySelector('#taskModal');
        if (!modal) return;

        const actions = modal.querySelector('.modal-actions');
        if (!actions) return;

        let button = actions.querySelector('.delete-task-button');
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'delete-task-button';
            button.textContent = 'Delete task';
            actions.insertBefore(button, actions.firstChild);
        }

        button.onclick = function (event) {
            event.preventDefault();
            event.stopPropagation();
            deleteTaskById(taskId);
        };
    }

    window.deleteTaskById = deleteTaskById;
    window.addDeleteButtonToTaskModal = addDeleteButton;

    document.addEventListener('DOMContentLoaded', function () {
        const modal = document.querySelector('#taskModal');
        if (!modal) return;

        const observer = new MutationObserver(function () {
            if (!modal.classList.contains('open')) return;

            const taskId = modal.dataset.editingTaskId || modal.getAttribute('data-task-id');
            if (taskId) addDeleteButton(taskId);
        });

        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class', 'data-editing-task-id', 'data-task-id']
        });

        modal.addEventListener('click', function () {
            if (!modal.classList.contains('open')) return;
            const taskId = modal.dataset.editingTaskId || modal.getAttribute('data-task-id');
            if (taskId) addDeleteButton(taskId);
        }, true);
    });
})();

// Load the status consistency layer after all existing task/editor scripts.
// This keeps the current script order intact while adding the new behavior.
(function loadStatusConsistency() {
    const script = document.createElement('script');
    script.src = 'status-consistency.js';
    script.defer = false;
    document.head.appendChild(script);
})();
