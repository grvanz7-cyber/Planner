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

function renderCalendar() {
    const title = document.querySelector('#calendarMonthTitle');
    const grid = document.querySelector('#calendarGrid');
    if (!title || !grid) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    title.textContent = calendarDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
    });

    grid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day calendar-day-empty';
        grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            cell.classList.add('calendar-day-today');
        }

        const number = document.createElement('div');
        number.className = 'calendar-day-number';
        number.textContent = day;
        cell.appendChild(number);

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const tasks = (window.plannerData?.tasks || []).filter(task => task.dueDate === dateString);

        tasks.slice(0, 4).forEach(task => {
            const item = document.createElement('div');
            item.className = 'calendar-task';
            if (task.completed) item.classList.add('calendar-task-completed');

            const subject = (window.plannerData?.settings?.subjects || []).find(s => s.name === task.subject);
            if (subject?.colour) item.style.setProperty('--subject-colour', subject.colour);

            item.textContent = `${subject?.emoji || ''} ${task.name}`.trim();
            item.title = task.name;
            cell.appendChild(item);
        });

        if (tasks.length > 4) {
            const more = document.createElement('div');
            more.className = 'calendar-more';
            more.textContent = `+${tasks.length - 4} more`;
            cell.appendChild(more);
        }

        grid.appendChild(cell);
    }
}
