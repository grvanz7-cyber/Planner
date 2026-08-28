// ========================================
// TASK STATUS CONSISTENCY
// Keeps completed + status fields synchronized everywhere.
// ========================================

(function () {
    const STATUSES = ['Not Started', 'In Progress', 'Completed'];

    function normalizeTaskStatus(task) {
        if (!task) return;
        if (task.completed === true || task.status === 'Completed') {
            task.completed = true;
            task.status = 'Completed';
        } else if (STATUSES.includes(task.status)) {
            task.completed = false;
        } else {
            task.completed = false;
            task.status = 'Not Started';
        }
    }

    function normalizeAllStatuses() {
        if (!Array.isArray(window.plannerData?.tasks)) return;
        let changed = false;
        plannerData.tasks.forEach(task => {
            const beforeCompleted = task.completed;
            const beforeStatus = task.status;
            normalizeTaskStatus(task);
            if (beforeCompleted !== task.completed || beforeStatus !== task.status) changed = true;
        });
        if (changed && typeof savePlannerData === 'function') savePlannerData();
    }

    function addStatusField() {
        const modal = document.querySelector('#taskModal .modal');
        const priority = document.querySelector('#taskPriority');
        if (!modal || !priority || document.querySelector('#taskStatusGroup')) return;

        const group = document.createElement('div');
        group.className = 'form-group';
        group.id = 'taskStatusGroup';
        group.innerHTML = '<label for="taskStatus">Status</label><select id="taskStatus"><option value="Not Started">Not Started</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></select>';
        const recurrence = document.querySelector('#taskRecurrenceGroup');
        if (recurrence) recurrence.before(group);
        else priority.closest('.form-row')?.after(group);
    }

    const originalOpen = window.openTaskModal;
    window.openTaskModal = function () {
        if (typeof originalOpen === 'function') originalOpen();
        addStatusField();
        const status = document.querySelector('#taskStatus');
        if (status) status.value = 'Not Started';
    };

    const originalEdit = window.openEditTaskModal;
    if (typeof originalEdit === 'function') {
        window.openEditTaskModal = function (taskId) {
            originalEdit(taskId);
            addStatusField();
            const task = plannerData?.tasks?.find(t => String(t.id) === String(taskId));
            normalizeTaskStatus(task);
            const status = document.querySelector('#taskStatus');
            if (status) status.value = task?.status || 'Not Started';
        };
    }

    const originalSaveEdit = window.saveEditedPlannerTask;
    if (typeof originalSaveEdit === 'function') {
        window.saveEditedPlannerTask = function (taskId) {
            addStatusField();
            const status = document.querySelector('#taskStatus')?.value || 'Not Started';
            const task = plannerData?.tasks?.find(t => String(t.id) === String(taskId));
            if (task) {
                task.status = status;
                task.completed = status === 'Completed';
            }
            originalSaveEdit(taskId);
            normalizeAllStatuses();
        };
    }

    const originalToggle = window.toggleTask;
    if (typeof originalToggle === 'function') {
        window.toggleTask = function (id) {
            originalToggle(id);
            const task = plannerData?.tasks?.find(t => String(t.id) === String(id));
            if (task) {
                task.completed = !!task.completed;
                task.status = task.completed ? 'Completed' : 'Not Started';
                savePlannerData();
            }
            normalizeAllStatuses();
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        normalizeAllStatuses();
        addStatusField();
    });
})();
