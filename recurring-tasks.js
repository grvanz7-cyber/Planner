// ========================================
// RECURRING TASKS
// Adds recurrence options without replacing the existing task system.
// ========================================

(function () {
    const RECURRENCE_OPTIONS = [
        ['', 'Does not repeat'],
        ['daily', 'Every day'],
        ['weekday', 'Every weekday'],
        ['weekly', 'Every week'],
        ['biweekly', 'Every 2 weeks'],
        ['monthly', 'Every month']
    ];

    function addRecurrenceField() {
        const modal = document.querySelector('#taskModal .modal');
        const priority = document.querySelector('#taskPriority');
        if (!modal || !priority || document.querySelector('#taskRecurrenceGroup')) return;

        const group = document.createElement('div');
        group.className = 'form-group';
        group.id = 'taskRecurrenceGroup';
        group.innerHTML = '<label for="taskRecurrence">Repeat</label><select id="taskRecurrence"></select>';
        priority.closest('.form-row')?.after(group);

        const select = group.querySelector('#taskRecurrence');
        RECURRENCE_OPTIONS.forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });
    }

    function resetRecurrence() {
        const select = document.querySelector('#taskRecurrence');
        if (select) select.value = '';
    }

    function nextDate(dateString, recurrence) {
        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return null;
        if (recurrence === 'daily') date.setDate(date.getDate() + 1);
        else if (recurrence === 'weekday') {
            do { date.setDate(date.getDate() + 1); } while (date.getDay() === 0 || date.getDay() === 6);
        } else if (recurrence === 'weekly') date.setDate(date.getDate() + 7);
        else if (recurrence === 'biweekly') date.setDate(date.getDate() + 14);
        else if (recurrence === 'monthly') date.setMonth(date.getMonth() + 1);
        else return null;
        return date.toISOString().slice(0, 10);
    }

    function makeNextOccurrence(task) {
        if (!task || !task.recurrence || !task.dueDate) return;
        const nextDue = nextDate(task.dueDate, task.recurrence);
        if (!nextDue) return;

        const exists = plannerData.tasks.some(t =>
            t.recurrenceParentId === task.id && t.dueDate === nextDue && !t.completed
        );
        if (exists) return;

        const nextTask = {
            ...task,
            id: Date.now() + Math.floor(Math.random() * 1000),
            dueDate: nextDue,
            completed: false,
            status: 'Not Started',
            createdAt: new Date().toISOString(),
            recurrenceParentId: task.recurrenceParentId || task.id
        };
        plannerData.tasks.push(nextTask);
        savePlannerData();
    }

    const originalOpen = window.openTaskModal;
    window.openTaskModal = function () {
        if (typeof originalOpen === 'function') originalOpen();
        addRecurrenceField();
        resetRecurrence();
    };

    const originalCreate = window.createTask;
    window.createTask = function () {
        addRecurrenceField();
        const recurrence = document.querySelector('#taskRecurrence')?.value || '';
        if (typeof originalCreate === 'function') originalCreate();
        const tasks = plannerData?.tasks;
        if (Array.isArray(tasks) && tasks.length && recurrence) {
            const task = tasks[tasks.length - 1];
            task.recurrence = recurrence;
            savePlannerData();
            if (typeof renderTasks === 'function') renderTasks();
            if (typeof renderAllTasks === 'function') renderAllTasks();
            if (typeof renderCalendar === 'function') renderCalendar();
        }
    };

    const originalToggle = window.toggleTask;
    window.toggleTask = function (id) {
        const task = plannerData?.tasks?.find(t => t.id === id);
        const wasIncomplete = task && !task.completed;
        if (typeof originalToggle === 'function') originalToggle(id);
        if (wasIncomplete && task?.recurrence) makeNextOccurrence(task);
        if (typeof renderTasks === 'function') renderTasks();
        if (typeof renderAllTasks === 'function') renderAllTasks();
        if (typeof renderCalendar === 'function') renderCalendar();
    };

    document.addEventListener('DOMContentLoaded', addRecurrenceField);
})();
