// ========================================
// SUBJECTS PAGE
// ========================================

function renderSubjectsPage() {
    const grid = document.querySelector('#subjectsGrid');
    if (!grid) return;
    const subjects = Array.isArray(plannerData?.settings?.subjects) ? plannerData.settings.subjects : [];
    const tasks = Array.isArray(plannerData?.tasks) ? plannerData.tasks : [];
    grid.innerHTML = '';
    const activeSubjects = subjects.filter(s => s && s.active !== false);
    if (!activeSubjects.length) { grid.innerHTML = '<div class="empty-message">No subjects yet. Add one to get started!</div>'; return; }
    activeSubjects.forEach(subject => {
        const realIndex = subjects.indexOf(subject);
        const subjectTasks = tasks.filter(t => t.subject === subject.name && !t.completed);
        const upcoming = subjectTasks.filter(t => t.dueDate).sort((a,b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0,3);
        const card = document.createElement('section'); card.className = 'subject-card'; card.style.setProperty('--subject-color', subject.colour || '#687b5e');
        card.innerHTML = '<div class="subject-card-top"><div class="subject-icon"></div><button class="small-button" type="button">Edit</button></div><h2></h2><div class="subject-count"></div><div class="subject-upcoming"></div>';
        card.querySelector('.subject-icon').textContent = subject.emoji || '📚';
        card.querySelector('h2').textContent = subject.name || 'Untitled subject';
        card.querySelector('.subject-count').textContent = `${subjectTasks.length} active task${subjectTasks.length === 1 ? '' : 's'}`;
        const box = card.querySelector('.subject-upcoming');
        if (upcoming.length) {
            box.innerHTML = '<h3>Coming up</h3>';
            upcoming.forEach(task => { const row = document.createElement('div'); row.className='subject-task'; row.innerHTML='<span></span><div><strong></strong><small></small></div>'; row.querySelector('strong').textContent=task.name||'Untitled task'; row.querySelector('small').textContent=task.dueDate; row.querySelector('span').textContent=task.type||'Task'; row.onclick=()=>{if(typeof openEditTaskModal==='function')openEditTaskModal(task.id)}; box.appendChild(row); });
        } else box.innerHTML = '<p class="subject-none">Nothing coming up 🎉</p>';
        card.querySelector('button').onclick = () => { if(typeof editSubject==='function') editSubject(realIndex); };
        grid.appendChild(card);
    });
}
