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
        if (!Array.isArray(subject.roadmap)) subject.roadmap = [];
        const subjectTasks = tasks.filter(t => t.subject === subject.name && !t.completed);
        const upcoming = subjectTasks.filter(t => t.dueDate).sort((a,b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0,3);
        const lessonCount = subject.roadmap.reduce((n,u)=>n+(Array.isArray(u.lessons)?u.lessons.length:0),0);
        const completedLessons = subject.roadmap.reduce((n,u)=>n+(Array.isArray(u.lessons)?u.lessons.filter(l=>l.completed).length:0),0);
        const card = document.createElement('section');
        card.className = 'subject-card';
        card.style.setProperty('--subject-color', subject.colour || '#687b5e');
        card.innerHTML = '<div class="subject-card-top"><div class="subject-icon"></div><div class="subject-card-actions"><button class="small-button roadmap-button" type="button">Roadmap</button><button class="small-button edit-subject-button" type="button">Edit</button></div></div><h2></h2><div class="subject-count"></div><div class="subject-roadmap-summary"></div><div class="subject-upcoming"></div>';
        card.querySelector('.subject-icon').textContent = subject.emoji || '📚';
        card.querySelector('h2').textContent = subject.name || 'Untitled subject';
        card.querySelector('.subject-count').textContent = `${subjectTasks.length} active task${subjectTasks.length === 1 ? '' : 's'}`;
        card.querySelector('.subject-roadmap-summary').textContent = subject.roadmap.length ? `${subject.roadmap.length} unit${subject.roadmap.length===1?'':'s'} · ${completedLessons}/${lessonCount} lessons complete` : 'No roadmap yet';
        const box = card.querySelector('.subject-upcoming');
        if (upcoming.length) {
            box.innerHTML = '<h3>Coming up</h3>';
            upcoming.forEach(task => { const row = document.createElement('div'); row.className='subject-task'; row.innerHTML='<span></span><div><strong></strong><small></small></div>'; row.querySelector('strong').textContent=task.name||'Untitled task'; row.querySelector('small').textContent=task.dueDate; row.querySelector('span').textContent=task.type||'Task'; row.onclick=()=>{if(typeof openEditTaskModal==='function')openEditTaskModal(task.id)}; box.appendChild(row); });
        } else box.innerHTML = '<p class="subject-none">Nothing coming up 🎉</p>';
        card.querySelector('.roadmap-button').onclick = () => { if(typeof openSubjectRoadmap==='function') openSubjectRoadmap(subject.name); };
        card.querySelector('.edit-subject-button').onclick = () => { if(typeof editSubject==='function') editSubject(realIndex); };
        grid.appendChild(card);
    });
}
