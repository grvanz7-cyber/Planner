// ========================================
// TASK VALIDATION
// ========================================
// Keeps task creation forgiving, but prevents malformed task records.

(function installTaskValidation(){
    function el(id){ return document.getElementById(id); }

    function removeError(input){
        if(!input) return;
        input.classList.remove('validation-error');
        const message = input.parentElement && input.parentElement.querySelector('.validation-message');
        if(message) message.remove();
    }

    function setError(input, message){
        if(!input) return;
        removeError(input);
        input.classList.add('validation-error');
        const p = document.createElement('div');
        p.className = 'validation-message';
        p.textContent = message;
        input.parentElement.appendChild(p);
    }

    function clearErrors(){
        document.querySelectorAll('.validation-error').forEach(x => x.classList.remove('validation-error'));
        document.querySelectorAll('.validation-message').forEach(x => x.remove());
    }

    function validate(){
        clearErrors();
        let valid = true;

        const name = el('taskName');
        const subject = el('taskSubject');
        const type = el('taskType');
        const dueDate = el('taskDueDate');
        const priority = el('taskPriority');

        if(!name || !name.value.trim()){
            setError(name, 'Please enter a task name.');
            valid = false;
        }

        if(!type || !type.value){
            setError(type, 'Please choose a task type.');
            valid = false;
        }else if(typeof plannerData !== 'undefined' && plannerData.settings && Array.isArray(plannerData.settings.types)){
            const allowed = plannerData.settings.types.map(t => String(t.name));
            if(!allowed.includes(String(type.value))){
                setError(type, 'Please choose a valid task type.');
                valid = false;
            }
        }

        if(subject && subject.value && typeof plannerData !== 'undefined' && plannerData.settings && Array.isArray(plannerData.settings.subjects)){
            const allowed = plannerData.settings.subjects.filter(s => s.active).map(s => String(s.name));
            if(!allowed.includes(String(subject.value))){
                setError(subject, 'Please choose a valid active subject.');
                valid = false;
            }
        }

        if(priority && !['Low','Normal','High'].includes(String(priority.value))){
            setError(priority, 'Please choose Low, Normal, or High priority.');
            valid = false;
        }

        if(dueDate && dueDate.value){
            const parsed = new Date(dueDate.value + 'T00:00:00');
            if(Number.isNaN(parsed.getTime())){
                setError(dueDate, 'Please enter a valid date.');
                valid = false;
            }
        }

        return valid;
    }

    function normalizeTags(){
        const input = el('taskTags');
        if(!input) return;
        const tags = input.value
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
            .map(t => t.startsWith('#') ? t : '#' + t)
            .filter((t,i,a) => a.indexOf(t) === i);
        input.value = tags.join(', ');
    }

    function focusFirstError(){
        const first = document.querySelector('#taskModal .validation-error');
        if(first) first.focus();
    }

    function install(){
        if(typeof window.createTask !== 'function' || window.__taskValidationInstalled) return;
        const originalCreateTask = window.createTask;
        window.createTask = function(){
            if(!validate()){
                focusFirstError();
                return;
            }
            normalizeTags();
            originalCreateTask();
        };
        window.__taskValidationInstalled = true;

        ['taskName','taskSubject','taskType','taskDueDate','taskPriority','taskTags'].forEach(id => {
            const input = el(id);
            if(input){
                input.addEventListener('input', () => removeError(input));
                input.addEventListener('change', () => removeError(input));
            }
        });
    }

    const style = document.createElement('style');
    style.textContent = `
        #taskModal .validation-error {
            border-color: #dc2626 !important;
            box-shadow: 0 0 0 2px rgba(220,38,38,.12) !important;
        }
        #taskModal .validation-message {
            color: #dc2626;
            font-size: .82rem;
            margin-top: 5px;
        }
    `;
    document.head.appendChild(style);

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', install, {once:true});
    }else{
        install();
    }
})();
