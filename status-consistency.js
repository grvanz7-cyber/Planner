// ========================================
// TASK STATUS CONSISTENCY
// ========================================
// Keeps the three status values consistent across the dashboard, task list,
// calendar and edit modal without creating duplicate wrappers.

(function installStatusConsistency(){
    const STATUSES = ['Not Started', 'In Progress', 'Completed'];

    function normalizeTask(task){
        if(!task) return;
        if(task.status === 'Completed' || task.completed === true){
            task.status = 'Completed';
            task.completed = true;
        }else if(STATUSES.includes(task.status)){
            task.completed = false;
        }else{
            task.status = 'Not Started';
            task.completed = false;
        }
    }

    function normalizeAll(){
        if(typeof plannerData === 'undefined' || !Array.isArray(plannerData.tasks)) return;
        let changed = false;
        plannerData.tasks.forEach(task => {
            const beforeStatus = task.status;
            const beforeCompleted = task.completed;
            normalizeTask(task);
            if(beforeStatus !== task.status || beforeCompleted !== task.completed) changed = true;
        });
        if(changed && typeof savePlannerData === 'function') savePlannerData();
    }

    function addStatusField(){
        const modal = document.querySelector('#taskModal .modal');
        if(!modal || document.querySelector('#taskStatusGroup')) return;

        const group = document.createElement('div');
        group.className = 'form-group';
        group.id = 'taskStatusGroup';
        group.innerHTML = `
            <label for="taskStatus">Status</label>
            <select id="taskStatus">
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
            </select>
        `;

        const recurrence = document.querySelector('#taskRecurrenceGroup');
        if(recurrence) recurrence.before(group);
        else modal.querySelector('.modal-actions')?.before(group);
    }

    function setStatusFromTask(task){
        normalizeTask(task);
        const select = document.querySelector('#taskStatus');
        if(select) select.value = task?.status || 'Not Started';
    }

    function validateEdit(){
        const name = document.querySelector('#taskName')?.value.trim() || '';
        if(!name){
            alert('Please enter a task name.');
            document.querySelector('#taskName')?.focus();
            return false;
        }

        if(name.length > 200){
            alert('Task names can be up to 200 characters.');
            document.querySelector('#taskName')?.focus();
            return false;
        }

        const status = document.querySelector('#taskStatus')?.value || 'Not Started';
        if(!STATUSES.includes(status)){
            alert('Please choose a valid status.');
            return false;
        }
        return true;
    }

    function patchCreate(){
        if(typeof window.createTask !== 'function' || window.createTask.__statusPatched) return;
        const original = window.createTask;

        window.createTask = function(){
            const beforeIds = new Set((plannerData?.tasks || []).map(t => String(t.id)));
            const result = original.apply(this, arguments);
            const created = (plannerData?.tasks || []).find(t => !beforeIds.has(String(t.id)));
            if(created){
                const selected = document.querySelector('#taskStatus')?.value || 'Not Started';
                created.status = STATUSES.includes(selected) ? selected : 'Not Started';
                created.completed = created.status === 'Completed';
                savePlannerData();
                if(typeof renderTasks === 'function') renderTasks();
            }
            normalizeAll();
            return result;
        };
        window.createTask.__statusPatched = true;
    }

    function patchOpen(){
        if(typeof window.openTaskModal === 'function' && !window.openTaskModal.__statusPatched){
            const original = window.openTaskModal;
            window.openTaskModal = function(){
                const result = original.apply(this, arguments);
                addStatusField();
                const select = document.querySelector('#taskStatus');
                if(select) select.value = 'Not Started';
                return result;
            };
            window.openTaskModal.__statusPatched = true;
        }

        if(typeof window.openEditTaskModal === 'function' && !window.openEditTaskModal.__statusPatched){
            const original = window.openEditTaskModal;
            window.openEditTaskModal = function(taskId){
                const result = original.apply(this, arguments);
                addStatusField();
                const task = plannerData?.tasks?.find(t => String(t.id) === String(taskId));
                setStatusFromTask(task);
                return result;
            };
            window.openEditTaskModal.__statusPatched = true;
        }
    }

    function patchSaveEdit(){
        if(typeof window.saveEditedPlannerTask !== 'function' || window.saveEditedPlannerTask.__statusPatched) return;
        const original = window.saveEditedPlannerTask;

        window.saveEditedPlannerTask = function(taskId){
            if(!validateEdit()) return false;

            const task = plannerData?.tasks?.find(t => String(t.id) === String(taskId));
            if(task){
                const status = document.querySelector('#taskStatus')?.value || 'Not Started';
                task.status = status;
                task.completed = status === 'Completed';
                savePlannerData();
            }

            const result = original.apply(this, arguments);
            normalizeAll();
            return result;
        };
        window.saveEditedPlannerTask.__statusPatched = true;
    }

    function patchToggle(){
        if(typeof window.toggleTask !== 'function' || window.toggleTask.__statusPatched) return;
        const original = window.toggleTask;

        window.toggleTask = function(id){
            const result = original.apply(this, arguments);
            const task = plannerData?.tasks?.find(t => String(t.id) === String(id));
            if(task){
                task.completed = !!task.completed;
                task.status = task.completed ? 'Completed' : 'Not Started';
                savePlannerData();
            }
            normalizeAll();
            return result;
        };
        window.toggleTask.__statusPatched = true;
    }

    function boot(){
        normalizeAll();
        addStatusField();
        patchCreate();
        patchOpen();
        patchSaveEdit();
        patchToggle();
    }

    // All regular scripts are loaded before DOMContentLoaded, so this avoids
    // the race where edit functions did not exist yet during initial parsing.
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', boot, {once:true});
    }else{
        boot();
    }
})();
