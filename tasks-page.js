// ========================================
// TASKS PAGE
// ========================================

function renderAllTasks() {
    const list = document.querySelector('#allTasksList');
    if (!list) return;

    const tasks = Array.isArray(window.plannerData?.tasks) ? window.plannerData.tasks.slice() : [];
    const subjects = Array.isArray(window.plannerData?.settings?.subjects) ? window.plannerData.settings.subjects : [];
    const types = Array.isArray(window.plannerData?.settings?.types) ? window.plannerData.settings.types : [];

    const search = (document.querySelector('#taskSearch')?.value || '').toLowerCase().trim();
    const subjectFilter = document.querySelector('#taskSubjectFilter')?.value || '';
    const typeFilter = document.querySelector('#taskTypeFilter')?.value || '';
    const statusFilter = document.querySelector('#taskStatusFilter')?.value || '';
    const sort = document.querySelector('#taskSort')?.value || 'due';

    const subjectSelect = document.querySelector('#taskSubjectFilter');
    const currentSubject = subjectSelect?.value || '';
    if (subjectSelect) {
        subjectSelect.innerHTML = '<option value="">All subjects</option>';
        subjects.filter(s => s && s.active !== false).forEach(s => {
            const o = document.createElement('option'); o.value = s.name || ''; o.textContent = `${s.emoji || '📚'} ${s.name || ''}`; subjectSelect.appendChild(o);
        });
        subjectSelect.value = currentSubject;
    }
    const typeSelect = document.querySelector('#taskTypeFilter');
    const currentType = typeSelect?.value || '';
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="">All types</option>';
        types.forEach(t => { const o = document.createElement('option'); o.value = t.name || ''; o.textContent = `${t.emoji || '✓'} ${t.name || ''}`; typeSelect.appendChild(o); });
        typeSelect.value = currentType;
    }

    let filtered = tasks.filter(task => {
        const haystack = `${task.name || ''} ${task.subject || ''} ${task.type || ''}`.toLowerCase();
        return (!search || haystack.includes(search)) &&
               (!subjectFilter || task.subject === subjectFilter) &&
               (!typeFilter || task.type === typeFilter) &&
               (!statusFilter || (task.completed ? 'Completed' : (task.status || 'Not Started')) === statusFilter);
    });

    if (sort === 'priority') {
        const order = { High: 0, Normal: 1, Low: 2 }; filtered.sort((a,b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
    } else if (sort === 'added') {
        filtered.sort((a,b) => String(b.createdAt || b.id || '').localeCompare(String(a.createdAt || a.id || '')));
    } else {
        filtered.sort((a,b) => String(a.dueDate || '9999-12-31').localeCompare(String(b.dueDate || '9999-12-31')));
    }

    list.innerHTML = '';
    if (!filtered.length) { list.innerHTML = '<div class="empty-tasks">No tasks match your filters.</div>'; return; }

    filtered.forEach(task => {
        const subject = subjects.find(s => s.name === task.subject);
        const type = types.find(t => t.name === task.type);
        const row = document.createElement('button'); row.type = 'button'; row.className = 'all-task-row';
        if (task.completed) row.classList.add('completed');
        if (subject?.colour) row.style.setProperty('--task-color', subject.colour);
        row.innerHTML = `<span class="all-task-icon">${subject?.emoji || type?.emoji || '✓'}</span><span class="all-task-main"><strong></strong><small></small></span><span class="all-task-meta"><span></span><span></span></span>`;
        row.querySelector('strong').textContent = task.name || 'Untitled task';
        row.querySelector('small').textContent = `${task.subject || 'No subject'}${task.type ? ' · ' + task.type : ''}`;
        row.querySelector('.all-task-meta span:first-child').textContent = task.dueDate || 'No due date';
        row.querySelector('.all-task-meta span:last-child').textContent = task.completed ? 'Completed' : (task.status || 'Not Started');
        row.onclick = () => { if (typeof openEditTaskModal === 'function') openEditTaskModal(task.id); };
        list.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    ['taskSearch','taskSubjectFilter','taskTypeFilter','taskStatusFilter','taskSort'].forEach(id => document.querySelector('#' + id)?.addEventListener('input', renderAllTasks));
});
