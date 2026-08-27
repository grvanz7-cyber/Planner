// ========================================
// ASSIGNMENTS PAGE
// ========================================

function getAssignmentData() {
    return {
        tasks: Array.isArray(plannerData?.tasks) ? plannerData.tasks : [],
        subjects: Array.isArray(plannerData?.settings?.subjects) ? plannerData.settings.subjects : []
    };
}

function openAssignmentModal() {
    const modal = document.querySelector('#assignmentModal');
    if (!modal) return;
    const { subjects } = getAssignmentData();
    const select = document.querySelector('#assignmentSubject');
    if (select) {
        select.innerHTML = '<option value="">Choose a subject</option>';
        subjects.filter(s => s && s.active !== false).forEach(s => {
            const option = document.createElement('option');
            option.value = s.name || '';
            option.textContent = `${s.emoji || '📚'} ${s.name || ''}`;
            select.appendChild(option);
        });
    }
    document.querySelector('#assignmentName').value = '';
    document.querySelector('#assignmentDueDate').value = '';
    document.querySelector('#assignmentPriority').value = 'Normal';
    document.querySelector('#assignmentWeight').value = '';
    document.querySelector('#assignmentNotes').value = '';
    modal.classList.add('open');
    document.querySelector('#assignmentName')?.focus();
}

function closeAssignmentModal() {
    document.querySelector('#assignmentModal')?.classList.remove('open');
}

function createAssignment() {
    const name = document.querySelector('#assignmentName')?.value.trim();
    if (!name) {
        alert('Please enter an assignment name.');
        return;
    }
    const task = {
        id: Date.now(),
        name,
        subject: document.querySelector('#assignmentSubject')?.value || '',
        type: 'Assignment',
        priority: document.querySelector('#assignmentPriority')?.value || 'Normal',
        dueDate: document.querySelector('#assignmentDueDate')?.value || null,
        tags: ['#School'],
        notes: document.querySelector('#assignmentNotes')?.value.trim() || '',
        weight: document.querySelector('#assignmentWeight')?.value || '',
        completed: false,
        createdAt: new Date().toISOString()
    };

    plannerData.tasks.push(task);
    savePlannerData();
    closeAssignmentModal();
    renderAssignments();
    if (typeof renderTasks === 'function') renderTasks();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderAllTasks === 'function') renderAllTasks();
}

function renderAssignments() {
    const list = document.querySelector('#assignmentsList');
    if (!list) return;
    const { tasks, subjects } = getAssignmentData();
    const assignments = tasks.filter(t => String(t.type || '').toLowerCase() === 'assignment');
    const today = new Date(); today.setHours(0,0,0,0);
    const subjectFilter = document.querySelector('#assignmentSubjectFilter')?.value || '';
    const statusFilter = document.querySelector('#assignmentStatusFilter')?.value || '';

    const subjectSelect = document.querySelector('#assignmentSubjectFilter');
    const current = subjectSelect?.value || '';
    if (subjectSelect) {
        subjectSelect.innerHTML = '<option value="">All subjects</option>';
        subjects.filter(s => s && s.active !== false).forEach(s => {
            const o=document.createElement('option'); o.value=s.name||''; o.textContent=`${s.emoji||'📚'} ${s.name||''}`; subjectSelect.appendChild(o);
        });
        subjectSelect.value=current;
    }

    const isCompleted = t => !!t.completed || String(t.status || '').toLowerCase() === 'completed';
    const isOverdue = t => !isCompleted(t) && t.dueDate && new Date(`${String(t.dueDate).slice(0,10)}T00:00:00`) < today;
    const filtered = assignments.filter(t => {
        const state = isCompleted(t) ? 'completed' : (isOverdue(t) ? 'overdue' : 'upcoming');
        return (!subjectFilter || t.subject === subjectFilter) && (!statusFilter || state === statusFilter);
    }).sort((a,b) => String(a.dueDate || '9999-12-31').localeCompare(String(b.dueDate || '9999-12-31')));

    document.querySelector('#assignmentUpcomingCount').textContent = assignments.filter(t => !isCompleted(t) && !isOverdue(t)).length;
    document.querySelector('#assignmentOverdueCount').textContent = assignments.filter(isOverdue).length;
    document.querySelector('#assignmentCompletedCount').textContent = assignments.filter(isCompleted).length;

    list.innerHTML = '';
    if (!filtered.length) { list.innerHTML = '<div class="empty-assignments">No assignments match your filters.</div>'; return; }
    filtered.forEach(task => {
        const subject = subjects.find(s => s.name === task.subject);
        const row = document.createElement('button'); row.type='button'; row.className='assignment-row';
        if(subject?.colour) row.style.setProperty('--assignment-color', subject.colour);
        if(isCompleted(task)) row.classList.add('completed');
        row.innerHTML='<span class="assignment-icon"></span><span class="assignment-main"><strong></strong><small></small></span><span class="assignment-due"></span>';
        row.querySelector('.assignment-icon').textContent=subject?.emoji||'📝';
        row.querySelector('strong').textContent=task.name||'Untitled assignment';
        row.querySelector('small').textContent=task.subject||'No subject';
        row.querySelector('.assignment-due').textContent=task.dueDate||'No due date';
        row.onclick=()=>{if(typeof openEditTaskModal==='function')openEditTaskModal(task.id);};
        list.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded',()=>{
    document.querySelector('#assignmentSubjectFilter')?.addEventListener('change',renderAssignments);
    document.querySelector('#assignmentStatusFilter')?.addEventListener('change',renderAssignments);
});
