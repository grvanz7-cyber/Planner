// ========================================
// TASKS PAGE
// ========================================

function renderAllTasks() {
    const list = document.querySelector('#allTasksList');
    if (!list || typeof plannerData === 'undefined') return;

    const tasks = Array.isArray(plannerData.tasks) ? plannerData.tasks.slice() : [];
    const subjects = Array.isArray(plannerData.settings?.subjects) ? plannerData.settings.subjects : [];
    const types = Array.isArray(plannerData.settings?.types) ? plannerData.settings.types : [];

    const search = (document.querySelector('#taskSearch')?.value || '').toLowerCase().trim();
    const subjectFilter = document.querySelector('#taskSubjectFilter')?.value || '';
    const typeFilter = document.querySelector('#taskTypeFilter')?.value || '';
    const statusFilter = document.querySelector('#taskStatusFilter')?.value || '';
    const sort = document.querySelector('#taskSort')?.value || 'due';

    const subjectSelect = document.querySelector('#taskSubjectFilter');
    const typeSelect = document.querySelector('#taskTypeFilter');

    if (subjectSelect) {
        const current = subjectSelect.value;
        subjectSelect.innerHTML = '<option value="">All subjects</option>';
        subjects.filter(s => s && s.active !== false).forEach(s => {
            const option = document.createElement('option');
            option.value = s.name || '';
            option.textContent = `${s.emoji || '📚'} ${s.name || ''}`;
            subjectSelect.appendChild(option);
        });
        if ([...subjectSelect.options].some(o => o.value === current)) subjectSelect.value = current;
    }

    if (typeSelect) {
        const current = typeSelect.value;
        typeSelect.innerHTML = '<option value="">All types</option>';
        types.forEach(t => {
            const option = document.createElement('option');
            option.value = t.name || '';
            option.textContent = `${t.emoji || '✓'} ${t.name || ''}`;
            typeSelect.appendChild(option);
        });
        if ([...typeSelect.options].some(o => o.value === current)) typeSelect.value = current;
    }

    let filtered = tasks.filter(task => {
        const tagText = Array.isArray(task.tags) ? task.tags.join(' ') : (task.tags || '');
        const haystack = [task.name, task.subject, task.type, task.description, task.notes, task.details, tagText]
            .filter(Boolean).join(' ').toLowerCase();
        const status = task.completed ? 'Completed' : (task.status || 'Not Started');
        return (!search || haystack.includes(search)) &&
               (!subjectFilter || task.subject === subjectFilter) &&
               (!typeFilter || task.type === typeFilter) &&
               (!statusFilter || status === statusFilter);
    });

    if (sort === 'priority') {
        const order = { High: 0, Normal: 1, Low: 2 };
        filtered.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
    } else if (sort === 'added') {
        filtered.sort((a, b) => String(b.createdAt || b.id || '').localeCompare(String(a.createdAt || a.id || '')));
    } else {
        filtered.sort((a, b) => String(a.dueDate || '9999-12-31').localeCompare(String(b.dueDate || '9999-12-31')));
    }

    list.innerHTML = '';
    if (!filtered.length) {
        list.innerHTML = '<div class="empty-tasks">No tasks match your filters.</div>';
        return;
    }

    filtered.forEach(task => {
        const subject = subjects.find(s => s.name === task.subject);
        const type = types.find(t => t.name === task.type);
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'all-task-row';
        if (task.completed) row.classList.add('completed');
        if (subject?.colour) row.style.setProperty('--task-color', subject.colour);

        const icon = document.createElement('span');
        icon.className = 'all-task-icon';
        icon.textContent = subject?.emoji || type?.emoji || '✓';
        const main = document.createElement('span');
        main.className = 'all-task-main';
        const strong = document.createElement('strong');
        strong.textContent = task.name || 'Untitled task';
        const small = document.createElement('small');
        small.textContent = `${task.subject || 'No subject'}${task.type ? ' · ' + task.type : ''}`;
        main.append(strong, small);
        const meta = document.createElement('span');
        meta.className = 'all-task-meta';
        const due = document.createElement('span');
        due.textContent = task.dueDate || 'No due date';
        const status = document.createElement('span');
        status.textContent = task.completed ? 'Completed' : (task.status || 'Not Started');
        meta.append(due, status);
        row.append(icon, main, meta);
        row.onclick = () => { if (typeof openEditTaskModal === 'function') openEditTaskModal(task.id); };
        list.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    ['taskSearch','taskSubjectFilter','taskTypeFilter','taskStatusFilter','taskSort'].forEach(id => {
        document.querySelector('#' + id)?.addEventListener('input', renderAllTasks);
        document.querySelector('#' + id)?.addEventListener('change', renderAllTasks);
    });
});
