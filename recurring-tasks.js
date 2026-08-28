// ========================================
// RECURRING TASKS
// ========================================
(function () {
    const RECURRENCE_OPTIONS = [
        ['', 'Does not repeat'], ['daily', 'Every day'], ['weekday', 'Every weekday'],
        ['weekly', 'Every week'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Every month'], ['custom', 'Custom']
    ];
    const DAYS = [['0','Sunday'],['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday']];

    function ensureRecurrenceControls() {
        const group = document.querySelector('#taskRecurrenceGroup');
        const select = document.querySelector('#taskRecurrence');
        if (!group || !select) return;

        // The controls are now part of the main task modal, so don't recreate them.
        if (!select.options.length) {
            RECURRENCE_OPTIONS.forEach(([value, label]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = label;
                select.appendChild(option);
            });
        }

        const day = document.querySelector('#taskRecurrenceDay');
        if (day && !day.options.length) {
            DAYS.forEach(([value, label]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = label;
                day.appendChild(option);
            });
        }

        if (!select.dataset.recurrenceBound) {
            select.addEventListener('change', updateRecurrenceVisibility);
            select.dataset.recurrenceBound = 'true';
        }
        updateRecurrenceVisibility();
    }

    function updateRecurrenceVisibility() {
        const recurrence = document.querySelector('#taskRecurrence')?.value || '';
        const weekly = document.querySelector('#weeklyRecurrenceOptions');
        const monthly = document.querySelector('#monthlyRecurrenceOptions');
        const custom = document.querySelector('#customRecurrenceOptions');
        const dateLabel = document.querySelector('#taskDateLabel');

        if (weekly) weekly.style.display = (recurrence === 'weekly' || recurrence === 'biweekly') ? 'block' : 'none';
        if (monthly) monthly.style.display = recurrence === 'monthly' ? 'block' : 'none';
        if (custom) custom.style.display = recurrence === 'custom' ? 'flex' : 'none';

        // A recurring task needs a starting date, not a one-off due date.
        if (dateLabel) dateLabel.textContent = recurrence ? 'Starts on' : 'Due date';
    }

    function setRecurrence(task) {
        ensureRecurrenceControls();
        const select = document.querySelector('#taskRecurrence');
        if (!select) return;
        select.value = task?.recurrence || '';

        const day = document.querySelector('#taskRecurrenceDay');
        if (day) day.value = String(task?.recurrenceDay ?? (task?.dueDate ? new Date(`${task.dueDate}T00:00:00`).getDay() : 1));

        const monthDay = document.querySelector('#taskRecurrenceMonthDay');
        if (monthDay) monthDay.value = task?.recurrenceMonthDay || (task?.dueDate ? Number(String(task.dueDate).slice(8, 10)) : 1);

        const interval = document.querySelector('#taskRecurrenceInterval');
        const unit = document.querySelector('#taskRecurrenceUnit');
        if (interval) interval.value = task?.recurrenceInterval || 1;
        if (unit) unit.value = task?.recurrenceUnit || 'days';
        updateRecurrenceVisibility();
    }

    function nextDate(dateString, recurrence, interval = 1, unit = 'days', day = null, monthDay = null) {
        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return null;

        if (recurrence === 'daily') {
            date.setDate(date.getDate() + 1);
        } else if (recurrence === 'weekday') {
            do { date.setDate(date.getDate() + 1); } while (date.getDay() === 0 || date.getDay() === 6);
        } else if (recurrence === 'weekly' || recurrence === 'biweekly') {
            const step = recurrence === 'weekly' ? 7 : 14;
            date.setDate(date.getDate() + step);
            if (day !== null) {
                const target = Number(day);
                date.setDate(date.getDate() + ((target - date.getDay() + 7) % 7));
            }
        } else if (recurrence === 'monthly') {
            date.setMonth(date.getMonth() + 1);
            const target = Math.min(31, Math.max(1, Number(monthDay) || date.getDate()));
            date.setDate(1);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            date.setDate(Math.min(target, lastDay));
        } else if (recurrence === 'custom') {
            const amount = Math.max(1, Number(interval) || 1);
            if (unit === 'weeks') date.setDate(date.getDate() + amount * 7);
            else if (unit === 'months') date.setMonth(date.getMonth() + amount);
            else date.setDate(date.getDate() + amount);
        } else return null;

        return date.toISOString().slice(0, 10);
    }

    function makeNextOccurrence(task) {
        if (!task?.recurrence || !task.dueDate) return;
        const next = nextDate(task.dueDate, task.recurrence, task.recurrenceInterval, task.recurrenceUnit, task.recurrenceDay, task.recurrenceMonthDay);
        if (!next) return;
        const parent = task.recurrenceParentId || task.id;
        if (plannerData.tasks.some(t => (t.recurrenceParentId === parent || t.id === parent) && t.dueDate === next && !t.completed)) return;

        plannerData.tasks.push({
            ...task,
            id: Date.now() + Math.floor(Math.random() * 1000),
            dueDate: next,
            completed: false,
            status: 'Not Started',
            createdAt: new Date().toISOString(),
            recurrenceParentId: parent
        });
        savePlannerData();
    }

    function getRecurrenceValues() {
        const recurrence = document.querySelector('#taskRecurrence')?.value || '';
        return {
            recurrence,
            recurrenceInterval: recurrence === 'custom' ? Math.max(1, Number(document.querySelector('#taskRecurrenceInterval')?.value) || 1) : null,
            recurrenceUnit: recurrence === 'custom' ? (document.querySelector('#taskRecurrenceUnit')?.value || 'days') : null,
            recurrenceDay: (recurrence === 'weekly' || recurrence === 'biweekly') ? Number(document.querySelector('#taskRecurrenceDay')?.value) : null,
            recurrenceMonthDay: recurrence === 'monthly' ? Math.min(31, Math.max(1, Number(document.querySelector('#taskRecurrenceMonthDay')?.value) || 1)) : null
        };
    }

    window.applyRecurrenceToTask = function (task) {
        if (task) Object.assign(task, getRecurrenceValues());
    };

    const originalOpen = window.openTaskModal;
    window.openTaskModal = function () {
        if (typeof originalOpen === 'function') originalOpen.apply(this, arguments);
        ensureRecurrenceControls();
        setRecurrence(null);
    };

    const originalCreate = window.createTask;
    window.createTask = function () {
        ensureRecurrenceControls();
        const values = getRecurrenceValues();
        if (typeof originalCreate === 'function') originalCreate.apply(this, arguments);
        const tasks = plannerData?.tasks;
        if (Array.isArray(tasks) && tasks.length) {
            Object.assign(tasks[tasks.length - 1], values);
            savePlannerData();
            if (typeof renderTasks === 'function') renderTasks();
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderDashboard === 'function') renderDashboard();
        }
    };

    const originalToggle = window.toggleTask;
    window.toggleTask = function (id) {
        const task = plannerData?.tasks?.find(t => String(t.id) === String(id));
        const wasIncomplete = task && !task.completed;
        if (typeof originalToggle === 'function') originalToggle.apply(this, arguments);
        if (wasIncomplete && task?.recurrence) makeNextOccurrence(task);
    };

    document.addEventListener('DOMContentLoaded', ensureRecurrenceControls);
    window.addRecurrenceField = ensureRecurrenceControls;
    window.setRecurrence = setRecurrence;
    window.makeNextOccurrence = makeNextOccurrence;
})();
