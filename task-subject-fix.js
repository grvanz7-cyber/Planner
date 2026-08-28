// ========================================
// TASK SUBJECT + CALENDAR COLOUR FIX
// ========================================

function getActivePlannerSubjects() {
    if (typeof plannerData === 'undefined' || !plannerData.settings) return [];
    const subjects = plannerData.settings.subjects;
    if (!Array.isArray(subjects)) return [];
    return subjects.filter(subject => subject && subject.active !== false);
}

function refreshTaskSubjectOptions(selectedValue = '') {
    const select = document.querySelector('#taskSubject');
    if (!select) return;
    select.innerHTML = '<option value="">None</option>';
    getActivePlannerSubjects().forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name || '';
        option.textContent = `${subject.emoji || '📚'} ${subject.name || ''}`;
        select.appendChild(option);
    });
    select.value = selectedValue || '';
}

const originalOpenTaskModalForSubjectFix = window.openTaskModal;
window.openTaskModal = function () {
    if (typeof originalOpenTaskModalForSubjectFix === 'function') originalOpenTaskModalForSubjectFix();
    refreshTaskSubjectOptions('');
};

window.openEditTaskModal = function (taskId) {
    const tasks = typeof plannerData !== 'undefined' && Array.isArray(plannerData.tasks) ? plannerData.tasks : [];
    const task = tasks.find(t => String(t.id) === String(taskId));
    const modal = document.querySelector('#taskModal');
    if (!task || !modal) return;

    refreshTaskSubjectOptions(task.subject || '');

    const typeSelect = document.querySelector('#taskType');
    if (typeSelect) {
        if (typeof populateTaskOptions === 'function') {
            try { populateTaskOptions(); } catch (e) {}
        }
        if (task.type) typeSelect.value = task.type;
    }

    const values = {
        '#taskName': task.name || '',
        '#taskSubject': task.subject || '',
        '#taskDueDate': task.dueDate || '',
        '#taskPriority': task.priority || 'Normal',
        '#taskTags': Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || '')
    };
    Object.entries(values).forEach(([selector, value]) => {
        const field = document.querySelector(selector);
        if (field) field.value = value;
    });

    modal.dataset.editingTaskId = String(task.id);
    modal.dataset.taskId = String(task.id);
    modal.classList.add('open');
    const title = modal.querySelector('.modal-header h2');
    if (title) title.textContent = 'Edit Task';

    const saveButton = modal.querySelector('.save-button');
    if (saveButton) {
        saveButton.textContent = 'Save Changes';
        saveButton.onclick = () => saveEditedPlannerTask(task.id);
    }

    addDeleteButtonToTaskModal(task.id);
};

function saveEditedPlannerTask(taskId) {
    const tasks = plannerData.tasks || [];
    const task = tasks.find(t => String(t.id) === String(taskId));
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
    if (modal) {
        modal.classList.remove('open');
        delete modal.dataset.editingTaskId;
        delete modal.dataset.taskId;
    }
    const title = modal?.querySelector('.modal-header h2');
    if (title) title.textContent = 'New Task';
    const saveButton = modal?.querySelector('.save-button');
    if (saveButton) {
        saveButton.textContent = 'Add Task';
        saveButton.onclick = () => createTask();
    }

    if (typeof renderTasks === 'function') renderTasks();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderAllTasks === 'function') renderAllTasks();
    if (typeof renderAssignments === 'function') renderAssignments();
}

// ========================================
// TASK DELETION
// ========================================

function addDeleteButtonToTaskModal(taskId) {
    const modal = document.querySelector('#taskModal');
    const actions = modal?.querySelector('.modal-actions');
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

        const task = plannerData.tasks?.find(t => String(t.id) === String(taskId));
        if (!task) return;

        if (!window.confirm(`Delete “${task.name || 'this task'}”?\n\nThis cannot be undone.`)) return;

        plannerData.tasks = plannerData.tasks.filter(t => String(t.id) !== String(taskId));
        savePlannerData();

        if (modal) {
            modal.classList.remove('open');
            delete modal.dataset.editingTaskId;
            delete modal.dataset.taskId;
        }

        if (typeof renderTasks === 'function') renderTasks();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderAllTasks === 'function') renderAllTasks();
        if (typeof renderAssignments === 'function') renderAssignments();
    };
}

window.addDeleteButtonToTaskModal = addDeleteButtonToTaskModal;
