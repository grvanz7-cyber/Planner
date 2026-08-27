function openCalendarTask(taskId) {
    const task = (window.plannerData?.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task) return;
    populateTaskOptions();
    const modal = document.querySelector('#calendarTaskModal');
    if (!modal) return;
    document.querySelector('#calendarEditTaskId').value = task.id;
    document.querySelector('#calendarEditTaskName').value = task.name || '';
    document.querySelector('#calendarEditTaskSubject').value = task.subject || '';
    document.querySelector('#calendarEditTaskType').value = task.type || '';
    document.querySelector('#calendarEditTaskDueDate').value = task.dueDate || '';
    document.querySelector('#calendarEditTaskPriority').value = task.priority || 'Normal';
    document.querySelector('#calendarEditTaskTags').value = (task.tags || []).join(', ');
    document.querySelector('#calendarEditTaskCompleted').checked = !!task.completed;
    modal.classList.add('open');
    document.querySelector('#calendarEditTaskName').focus();
}

function closeCalendarTaskModal() {
    const modal = document.querySelector('#calendarTaskModal');
    if (modal) modal.classList.remove('open');
}

function saveCalendarTask() {
    const id = document.querySelector('#calendarEditTaskId').value;
    const task = (window.plannerData?.tasks || []).find(t => String(t.id) === String(id));
    if (!task) return;
    const name = document.querySelector('#calendarEditTaskName').value.trim();
    if (!name) { alert('Please enter a task name.'); return; }
    task.name = name;
    task.subject = document.querySelector('#calendarEditTaskSubject').value;
    task.type = document.querySelector('#calendarEditTaskType').value;
    task.dueDate = document.querySelector('#calendarEditTaskDueDate').value || null;
    task.priority = document.querySelector('#calendarEditTaskPriority').value;
    task.tags = document.querySelector('#calendarEditTaskTags').value.split(',').map(tag => tag.trim()).filter(Boolean);
    task.completed = document.querySelector('#calendarEditTaskCompleted').checked;
    savePlannerData();
    renderTasks();
    renderCalendar();
    closeCalendarTaskModal();
}

function deleteCalendarTask() {
    const id = document.querySelector('#calendarEditTaskId').value;
    const task = (window.plannerData?.tasks || []).find(t => String(t.id) === String(id));
    if (!task) return;
    if (!confirm(`Delete "${task.name}"? This cannot be undone.`)) return;
    plannerData.tasks = plannerData.tasks.filter(t => String(t.id) !== String(id));
    savePlannerData();
    renderTasks();
    renderCalendar();
    closeCalendarTaskModal();
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'calendarTaskModal';
    modal.innerHTML = `
        <div class="modal calendar-edit-modal">
            <div class="modal-header"><h2>Edit Task</h2><button class="close-button" onclick="closeCalendarTaskModal()">×</button></div>
            <input id="calendarEditTaskId" type="hidden">
            <div class="form-group"><label for="calendarEditTaskName">Name</label><input id="calendarEditTaskName" type="text" placeholder="Task name"></div>
            <div class="form-row"><div class="form-group"><label for="calendarEditTaskSubject">Subject</label><select id="calendarEditTaskSubject"></select></div><div class="form-group"><label for="calendarEditTaskType">Type</label><select id="calendarEditTaskType"></select></div></div>
            <div class="form-row"><div class="form-group"><label for="calendarEditTaskDueDate">Due date</label><input id="calendarEditTaskDueDate" type="date"></div><div class="form-group"><label for="calendarEditTaskPriority">Priority</label><select id="calendarEditTaskPriority"><option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option></select></div></div>
            <div class="form-group"><label for="calendarEditTaskTags">Tags</label><input id="calendarEditTaskTags" type="text" placeholder="#School, #Important"></div>
            <div class="checkbox-row"><input id="calendarEditTaskCompleted" type="checkbox"><label for="calendarEditTaskCompleted">Completed</label></div>
            <div class="modal-actions calendar-edit-actions"><button class="cancel-button danger-text-button" onclick="deleteCalendarTask()">Delete</button><span></span><button class="cancel-button" onclick="closeCalendarTaskModal()">Cancel</button><button class="save-button" onclick="saveCalendarTask()">Save Changes</button></div>
        </div>`;
    document.body.appendChild(modal);
});
