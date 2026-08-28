// ========================================
// RECURRING TASKS
// ========================================

(function () {
    const RECURRENCE_OPTIONS = [
        ['', 'Does not repeat'],
        ['daily', 'Every day'],
        ['weekday', 'Every weekday'],
        ['weekly', 'Every week'],
        ['biweekly', 'Every 2 weeks'],
        ['monthly', 'Every month'],
        ['custom', 'Custom']
    ];

    function addRecurrenceField(modalSelector = '#taskModal .modal') {
        const modal = document.querySelector(modalSelector);
        if (!modal || modal.querySelector('#taskRecurrenceGroup')) return;
        const priority = modal.querySelector('#taskPriority');
        if (!priority) return;

        const group = document.createElement('div');
        group.className = 'form-group';
        group.id = 'taskRecurrenceGroup';
        group.innerHTML = `
            <label for="taskRecurrence">Repeat</label>
            <select id="taskRecurrence"></select>
            <div id="customRecurrenceOptions" style="display:none;margin-top:8px;display:none;gap:8px;align-items:center;">
                <span>Every</span>
                <input id="taskRecurrenceInterval" type="number" min="1" value="1" style="max-width:90px;">
                <select id="taskRecurrenceUnit">
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                </select>
            </div>`;
        priority.closest('.form-row')?.after(group);

        const select = group.querySelector('#taskRecurrence');
        RECURRENCE_OPTIONS.forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });
        select.addEventListener('change', () => {
            group.querySelector('#customRecurrenceOptions').style.display = select.value === 'custom' ? 'flex' : 'none';
        });
    }

    function setRecurrence(task) {
        const select = document.querySelector('#taskRecurrence');
        const interval = document.querySelector('#taskRecurrenceInterval');
        const unit = document.querySelector('#taskRecurrenceUnit');
        if (!select) return;
        select.value = task?.recurrence || '';
        if (interval) interval.value = task?.recurrenceInterval || 1;
        if (unit) unit.value = task?.recurrenceUnit || 'days';
        select.dispatchEvent(new Event('change'));
    }

    function nextDate(dateString, recurrence, interval = 1, unit = 'days') {
        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return null;
        if (recurrence === 'daily') date.setDate(date.getDate() + 1);
        else if (recurrence === 'weekday') {
            do { date.setDate(date.getDate() + 1); } while (date.getDay() === 0 || date.getDay() === 6);
        } else if (recurrence === 'weekly') date.setDate(date.getDate() + 7);
        else if (recurrence === 'biweekly') date.setDate(date.getDate() + 14);
        else if (recurrence === 'monthly') date.setMonth(date.getMonth() + 1);
        else if (recurrence === 'custom') {
            const amount = Math.max(1, Number(interval) || 1);
            if (unit === 'weeks') date.setDate(date.getDate() + amount * 7);
            else if (unit === 'months') date.setMonth(date.getMonth() + amount);
            else date.setDate(date.getDate() + amount);
        } else return null;
        return date.toISOString().slice(0, 10);
    }

    function makeNextOccurrence(task) {
        if (!task || !task.recurrence || !task.dueDate) return;
        const nextDue = nextDate(task.dueDate, task.recurrence, task.recurrenceInterval, task.recurrenceUnit);
        if (!nextDue) return;
        const parentId = task.recurrenceParentId || task.id;
        const exists = plannerData.tasks.some(t => t.recurrenceParentId === parentId && t.dueDate === nextDue && !t.completed);
        if (exists) return;

        plannerData.tasks.push({
            ...task,
            id: Date.now() + Math.floor(Math.random() * 1000),
            dueDate: nextDue,
            completed: false,
            status: 'Not Started',
            createdAt: new Date().toISOString(),
            recurrenceParentId: parentId
        });
        savePlannerData();
    }

    function getRecurrenceValues() {
        const recurrence = document.querySelector('#taskRecurrence')?.value || '';
        return {
            recurrence,
            recurrenceInterval: recurrence === 'custom' ? Math.max(1, Number(document.querySelector('#taskRecurrenceInterval')?.value) || 1) : null,
            recurrenceUnit: recurrence === 'custom' ? (document.querySelector('#taskRecurrenceUnit')?.value || 'days') : null
        };
    }

    window.applyRecurrenceToTask = function (task) {
        if (!task) return;
        const values = getRecurrenceValues();
        task.recurrence = values.recurrence;
        task.recurrenceInterval = values.recurrenceInterval;
        task.recurrenceUnit = values.recurrenceUnit;
    };

    const originalOpen = window.openTaskModal;
    window.openTaskModal = function () {
        if (typeof originalOpen === 'function') originalOpen.apply(this, arguments);
        addRecurrenceField();
        setRecurrence(null);
    };

    const originalCreate = window.createTask;
    window.createTask = function () {
        addRecurrenceField();
        const values = getRecurrenceValues();
        if (typeof originalCreate === 'function') originalCreate.apply(this, arguments);
        const tasks = plannerData?.tasks;
        if (Array.isArray(tasks) && tasks.length) {
            const task = tasks[tasks.length - 1];
            task.recurrence = values.recurrence;
            task.recurrenceInterval = values.recurrenceInterval;
            task.recurrenceUnit = values.recurrenceUnit;
            savePlannerData();
            if (typeof renderTasks === 'function') renderTasks();
            if (typeof renderAllTasks === 'function') renderAllTasks();
            if (typeof renderCalendar === 'function') renderCalendar();
        }
    };

    const originalToggle = window.toggleTask;
    window.toggleTask = function (id) {
        const task = plannerData?.tasks?.find(t => String(t.id) === String(id));
        const wasIncomplete = task && !task.completed;
        if (typeof originalToggle === 'function') originalToggle.apply(this, arguments);
        if (wasIncomplete && task?.recurrence) makeNextOccurrence(task);
        if (typeof renderTasks === 'function') renderTasks();
        if (typeof renderAllTasks === 'function') renderAllTasks();
        if (typeof renderCalendar === 'function') renderCalendar();
    };

    document.addEventListener('DOMContentLoaded', () => addRecurrenceField());
    window.addEventListener('planner:edit-task-opened', event => {
        addRecurrenceField();
        setRecurrence(event.detail?.task || null);
    });

    // Expose helpers for the existing edit-modal integration.
    window.addRecurrenceField = addRecurrenceField;
    window.setRecurrence = setRecurrence;
    window.makeNextOccurrence = makeNextOccurrence;
})();
