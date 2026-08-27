// ========================================
// CALENDAR
// ========================================

let calendarDate = new Date();

function calendarPreviousMonth() {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
    renderCalendar();
}

function calendarNextMonth() {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    renderCalendar();
}

function calendarGoToToday() {
    calendarDate = new Date();
    renderCalendar();
}

function getPlannerTasksForCalendar() {
    if (typeof plannerData !== 'undefined' && Array.isArray(plannerData.tasks)) return plannerData.tasks;
    return [];
}

function getCalendarSubjects() {
    if (typeof plannerData !== 'undefined' && plannerData.settings?.subjects) return plannerData.settings.subjects;
    return [];
}

function openCalendarTask(taskId) {
    if (typeof openEditTaskModal === 'function') {
        openEditTaskModal(taskId);
        return;
    }

    const task = getPlannerTasksForCalendar().find(t => String(t.id) === String(taskId));
    if (!task || typeof openTaskModal !== 'function') return;

    openTaskModal();
    const values = {
        '#taskName': task.name || '',
        '#taskSubject': task.subject || '',
        '#taskType': task.type || '',
        '#taskDueDate': task.dueDate || '',
        '#taskPriority': task.priority || 'Normal',
        '#taskTags': Array.isArray(task.tags) ? task.tags.join(', ') : ''
    };
    Object.entries(values).forEach(([selector, value]) => {
        const field = document.querySelector(selector);
        if (field) field.value = value;
    });
}

function renderCalendar() {
    const title = document.querySelector('#calendarMonthTitle');
    const grid = document.querySelector('#calendarGrid');
    if (!title || !grid) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const tasks = getPlannerTasksForCalendar();
    const subjects = getCalendarSubjects();

    title.textContent = calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    grid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day calendar-day-empty';
        grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) cell.classList.add('today');

        const number = document.createElement('div');
        number.className = 'calendar-day-number';
        const numberSpan = document.createElement('span');
        numberSpan.textContent = day;
        number.appendChild(numberSpan);
        cell.appendChild(number);

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(task => task.dueDate && String(task.dueDate).slice(0, 10) === dateString);

        dayTasks.slice(0, 4).forEach(task => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'calendar-task';
            if (task.completed) item.classList.add('completed');

            const subject = subjects.find(s => s.name === task.subject);
            if (subject?.colour) item.style.borderLeftColor = subject.colour;

            const icon = document.createElement('span');
            icon.className = 'calendar-task-icon';
            icon.textContent = subject?.emoji || '';

            const name = document.createElement('span');
            name.className = 'calendar-task-name';
            name.textContent = task.name || 'Untitled task';

            item.append(icon, name);
            item.title = `Edit: ${task.name || 'Untitled task'}`;
            item.onclick = () => openCalendarTask(task.id);
            cell.appendChild(item);
        });

        if (dayTasks.length > 4) {
            const more = document.createElement('div');
            more.className = 'calendar-more';
            more.textContent = `+${dayTasks.length - 4} more`;
            cell.appendChild(more);
        }

        grid.appendChild(cell);
    }
}
