// ========================================
// TASK SUBJECT + CALENDAR COLOUR FIX
// ========================================

function getActivePlannerSubjects() {
    if (typeof plannerData === 'undefined' || !plannerData.settings) return [];
    if (!Array.isArray(plannerData.settings.subjects)) return [];
    return plannerData.settings.subjects.filter(subject => subject.active !== false);
}

function refreshTaskSubjectOptions(selectedValue = '') {
    const select = document.querySelector('#taskSubject');
    if (!select) return;

    select.innerHTML = '';

    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'None';
    select.appendChild(none);

    getActivePlannerSubjects().forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name;
        option.textContent = `${subject.emoji || '📚'} ${subject.name}`;
        select.appendChild(option);
    });

    select.value = selectedValue || '';
}

// Keep subject options current whenever the task modal opens.
const plannerOriginalOpenTaskModal = window.openTaskModal;
window.openTaskModal = function () {
    if (typeof plannerOriginalOpenTaskModal === 'function') {
        plannerOriginalOpenTaskModal();
    }
    refreshTaskSubjectOptions();
};

// Ensure newly created tasks always receive the selected subject.
const plannerOriginalCreateTask = window.createTask;
window.createTask = function () {
    if (typeof plannerOriginalCreateTask === 'function') {
        plannerOriginalCreateTask();
    }
};

// Provide a reliable editor for calendar tasks using the existing modal.
window.openEditTaskModal = function (taskId) {
    const task = typeof plannerData !== 'undefined'
        ? plannerData.tasks.find(t => String(t.id) === String(taskId))
        : null;

    if (!task) return;

    const modal = document.querySelector('#taskModal');
    if (!modal) return;

    refreshTaskSubjectOptions(task.subject || '');

    const fields = {
        '#taskName': task.name || '',
        '#taskSubject': task.subject || '',
        '#taskType': task.type || '',
        '#taskDueDate': task.dueDate || '',
        '#taskPriority': task.priority || 'Normal',
        '#taskTags': Array.isArray(task.tags) ? task.tags.join(', ') : ''
    };

    Object.entries(fields).forEach(([selector, value]) => {
        const field = document.querySelector(selector);
        if (field) field.value = value;
    });

    modal.classList.add('open');

    const saveButton = modal.querySelector('.save-button');
    if (saveButton) {
        saveButton.textContent = 'Save Changes';
        saveButton.onclick = () => saveEditedPlannerTask(task.id);
    }

    const title = modal.querySelector('.modal-header h2');
    if (title) title.textContent = 'Edit Task';
};

function saveEditedPlannerTask(taskId) {
    const task = plannerData.tasks.find(t => String(t.id) === String(taskId));
    if (!task) return;

    task.name = document.querySelector('#taskName')?.value.trim() || task.name;
    task.subject = document.querySelector('#taskSubject')?.value || '';
    task.type = document.querySelector('#taskType')?.value || '';
    task.dueDate = document.querySelector('#taskDueDate')?.value || null;
    task.priority = document.querySelector('#taskPriority')?.value || 'Normal';

    const tags = document.querySelector('#taskTags')?.value || '';
    task.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    savePlannerData();

    const modal = document.querySelector('#taskModal');
    if (modal) modal.classList.remove('open');

    const title = modal?.querySelector('.modal-header h2');
    if (title) title.textContent = 'New Task';

    const saveButton = modal?.querySelector('.save-button');
    if (saveButton) {
        saveButton.textContent = 'Add Task';
        saveButton.onclick = () => createTask();
    }

    if (typeof renderTasks === 'function') renderTasks();
    if (typeof renderCalendar === 'function') renderCalendar();
}

// Re-render the calendar whenever a subject is changed in Settings.
const plannerOriginalRenderSubjects = window.renderSubjects;
if (typeof plannerOriginalRenderSubjects === 'function') {
    window.renderSubjects = function () {
        plannerOriginalRenderSubjects();
        if (typeof renderCalendar === 'function') renderCalendar();
    };
}
