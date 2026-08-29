// ========================================
// TASK STATUS CONSISTENCY + VALIDATION
// Keeps task data valid and status fields synchronized everywhere.
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

    function validateTaskForm() {
        const name = document.querySelector('#taskName')?.value.trim() || '';
        if (!name) {
            alert('Please enter a task name.');
            document.querySelector('#taskName')?.focus();
            return false;
        }
        if (name.length > 200) {
            alert('Task names can be up to 200 characters.');
            document.querySelector('#taskName')?.focus();
            return false;
        }
        const due = document.querySelector('#taskDueDate')?.value || '';
        if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
            alert('Please enter a valid due date.');
            return false;
        }
        const priority = document.querySelector('#taskPriority')?.value || 'Normal';
        if (!['Low', 'Normal', 'High'].includes(priority)) {
            alert('Please choose a valid priority.');
            return false;
        }
        const recurrence = document.querySelector('#taskRecurrence')?.value || '';
        if (!['', 'daily', 'weekday', 'weekly', 'biweekly', 'monthly', 'custom'].includes(recurrence)) {
            alert('Please choose a valid repeat option.');
            return false;
        }
        if (recurrence === 'weekly' || recurrence === 'biweekly') {
            const day = Number(document.querySelector('#taskRecurrenceDay')?.value);
            if (!Number.isInteger(day) || day < 0 || day > 6) {
                alert('Please choose a valid recurring day.');
                return false;
            }
        }
        if (recurrence === 'monthly') {
            const day = Number(document.querySelector('#taskRecurrenceMonthDay')?.value);
            if (!Number.isInteger(day) || day < 1 || day > 31) {
                alert('Please choose a valid day of the month.');
                return false;
            }
        }
        if (recurrence === 'custom') {
            const interval = Number(document.querySelector('#taskRecurrenceInterval')?.value);
            const unit = document.querySelector('#taskRecurrenceUnit')?.value || '';
            if (!Number.isInteger(interval) || interval < 1 || !['days', 'weeks', 'months'].includes(unit)) {
                alert('Please enter a valid custom repeat interval.');
                return false;
            }
        }
        return true;
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
            if (!validateTaskForm()) return;
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

    function patchCreate() {
        if (typeof window.createTask !== 'function' || window.createTask.__validationPatched) return;
        const originalCreate = window.createTask;
        window.createTask = function () {
            if (!validateTaskForm()) return false;
            return originalCreate.apply(this, arguments);
        };
        window.createTask.__validationPatched = true;
    }

    function boot() {
        patchCreate();
        normalizeAllStatuses();
        addStatusField();
    }

    document.addEventListener('DOMContentLoaded', boot);
    window.addEventListener('load', boot);
    boot();
})();
