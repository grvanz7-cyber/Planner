// ========================================
// QUICK ADD
// Natural-language task entry from the dashboard.
// ========================================
(function installQuickAdd(){
    const DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];

    function data(){return typeof plannerData!=='undefined'&&plannerData?plannerData:null;}
    function activeSubjects(){return data()?.settings?.subjects?.filter(s=>s&&s.active!==false)||[];}
    function taskTypes(){return data()?.settings?.types||[];}
    function esc(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
    function today(){const d=new Date();d.setHours(0,0,0,0);return d;}
    function iso(d){return d.toISOString().slice(0,10);}

    function parseDate(text){
        const lower=text.toLowerCase();
        const base=today();
        if(/\b(today)\b/.test(lower))return iso(base);
        if(/\b(tomorrow)\b/.test(lower)){base.setDate(base.getDate()+1);return iso(base);}
        if(/\b(day after tomorrow)\b/.test(lower)){base.setDate(base.getDate()+2);return iso(base);}
        const dayMatch=lower.match(new RegExp('\\b('+DAYS.join('|')+')\\b'));
        if(dayMatch){
            const target=DAYS.indexOf(dayMatch[1]);
            let add=(target-base.getDay()+7)%7;
            if(add===0)add=7;
            base.setDate(base.getDate()+add);
            return iso(base);
        }
        const numeric=lower.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
        if(numeric){const d=new Date(+numeric[1],+numeric[2]-1,+numeric[3]);return Number.isNaN(d.getTime())?null:iso(d);}
        const month=lower.match(new RegExp('\\b('+MONTHS.join('|')+')\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(20\\d{2}))?\\b'));
        if(month){let year=month[3]?+month[3]:base.getFullYear();const mi=MONTHS.indexOf(month[1]),day=+month[2];let d=new Date(year,mi,day);if(!month[3]&&d<base)d=new Date(year+1,mi,day);return Number.isNaN(d.getTime())?null:iso(d);}
        return null;
    }

    function findSubject(text){
        const lower=text.toLowerCase();
        return activeSubjects().slice().sort((a,b)=>String(b.name).length-String(a.name).length).find(s=>lower.includes(String(s.name).toLowerCase()))||null;
    }

    function findType(text){
        const lower=text.toLowerCase();
        const aliases={quiz:['quiz','quizzes'],test:['test','tests','unit test'],exam:['exam','exams','final exam','midterm'],assignment:['assignment','assignments'],homework:['homework','hw'],task:['task','todo','to-do']};
        for(const type of taskTypes()){
            const name=String(type.name||'');
            const words=aliases[name.toLowerCase()]||[name.toLowerCase()];
            if(words.some(w=>new RegExp('\\b'+esc(w)+'\\b','i').test(lower)))return name;
        }
        for(const key of Object.keys(aliases))if(aliases[key].some(w=>new RegExp('\\b'+esc(w)+'\\b','i').test(lower)))return key.charAt(0).toUpperCase()+key.slice(1);
        return taskTypes().find(t=>String(t.name).toLowerCase()==='task')?.name||'Task';
    }

    function parsePriority(text){
        if(/\b(high|urgent|important|asap)\b/i.test(text))return'High';
        if(/\b(low|whenever|not urgent)\b/i.test(text))return'Low';
        return'Normal';
    }

    function cleanName(text,subject,type,date){
        let name=text.trim();
        const remove=[...DAYS,...MONTHS,'today','tomorrow','day after tomorrow','high','urgent','important','asap','low','whenever','not urgent'];
        if(subject)name=name.replace(new RegExp('\\b'+esc(subject.name)+'\\b','ig'),'');
        if(type)name=name.replace(new RegExp('\\b'+esc(type)+'\\b','ig'),'');
        remove.forEach(w=>{name=name.replace(new RegExp('\\b'+esc(w)+'\\b','ig'),'');});
        name=name.replace(/\b20\d{2}[-\/.]\d{1,2}[-\/.]\d{1,2}\b/g,'').replace(/\b(?:due|on|by)\s*(?=\b)/ig,'').replace(/\s+/g,' ').replace(/^[\s,;:-]+|[\s,;:-]+$/g,'');
        return name||text.trim();
    }

    function parse(text){
        const subject=findSubject(text),type=findType(text),dueDate=parseDate(text),priority=parsePriority(text);
        let name=cleanName(text,subject,type,dueDate);
        if(!name)name=text.trim();
        const lower=text.toLowerCase();
        const school=subject||['Assignment','Quiz','Test','Exam'].some(t=>type.toLowerCase()===t.toLowerCase());
        return {name,subject:subject?.name||'',type,priority,dueDate,tags:school?['#School']:[]};
    }

    function openQuickReview(parsed,original){
        let modal=document.getElementById('quickAddReviewModal');
        if(!modal){
            modal=document.createElement('div');modal.id='quickAddReviewModal';modal.className='modal-overlay';
            modal.innerHTML='<div class="modal"><div class="modal-header"><h2>Quick Add</h2><button class="close-button" type="button" id="quickAddReviewClose">×</button></div><p class="quick-add-review-hint">I understood this as:</p><div class="quick-add-preview" id="quickAddPreview"></div><div class="quick-add-review-actions"><button class="cancel-button" type="button" id="quickAddReviewEdit">Edit</button><button class="save-button" type="button" id="quickAddReviewSave">Add Task</button></div></div>';
            document.body.appendChild(modal);
            document.getElementById('quickAddReviewClose').onclick=()=>modal.classList.remove('open');
        }
        const preview=document.getElementById('quickAddPreview');
        const rows=[['Name',parsed.name],['Subject',parsed.subject||'None'],['Type',parsed.type],['Due',parsed.dueDate||'No due date'],['Priority',parsed.priority]];
        preview.innerHTML=rows.map(r=>`<div class="quick-add-preview-row"><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join('');
        modal.classList.add('open');
        document.getElementById('quickAddReviewEdit').onclick=()=>{modal.classList.remove('open');openTaskModal();document.getElementById('taskName').value=parsed.name;document.getElementById('taskSubject').value=parsed.subject;document.getElementById('taskType').value=parsed.type;document.getElementById('taskDueDate').value=parsed.dueDate||'';document.getElementById('taskPriority').value=parsed.priority;document.getElementById('taskTags').value=parsed.tags.join(', ');};
        document.getElementById('quickAddReviewSave').onclick=()=>{modal.classList.remove('open');createQuickTask(parsed);};
    }

    function createQuickTask(p){
        const d=data();if(!d)return;
        if(!Array.isArray(d.tasks))d.tasks=[];
        const task={id:Date.now(),name:p.name,subject:p.subject,type:p.type,priority:p.priority,dueDate:p.dueDate||null,tags:p.tags,completed:false,createdAt:new Date().toISOString()};
        d.tasks.push(task);
        if(typeof savePlannerData==='function')savePlannerData();
        if(typeof renderTasks==='function')renderTasks();
        if(typeof renderAllTasks==='function')renderAllTasks();
        if(typeof renderCalendar==='function')renderCalendar();
        if(typeof renderAssignments==='function')renderAssignments();
        if(typeof renderAssessments==='function')renderAssessments();
        document.dispatchEvent(new CustomEvent('planner-data-changed',{detail:{reason:'quick-add',task}}));
    }

    function handle(){
        const input=document.querySelector('.quick-add input');if(!input)return;
        const text=input.value.trim();if(!text){if(typeof openTaskModal==='function')openTaskModal();return;}
        const parsed=parse(text);input.value='';openQuickReview(parsed,text);
    }

    function install(){
        const button=document.querySelector('.quick-add button');
        if(!button||button.__quickAddInstalled)return;
        button.__quickAddInstalled=true;button.onclick=handle;
        const input=document.querySelector('.quick-add input');
        if(input){input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handle();}});}
        const style=document.createElement('style');style.textContent=`
            .quick-add-review-hint{margin:0 0 14px;color:var(--muted-text,#777);font-size:13px}
            .quick-add-preview{display:flex;flex-direction:column;border:1px solid var(--border-color,#ddd);border-radius:12px;overflow:hidden}
            .quick-add-preview-row{display:flex;justify-content:space-between;gap:16px;padding:10px 12px;border-bottom:1px solid var(--border-color,#eee);font-size:13px}
            .quick-add-preview-row:last-child{border-bottom:0}.quick-add-preview-row span{opacity:.65}.quick-add-review-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
        `;document.head.appendChild(style);
    }
    document.addEventListener('DOMContentLoaded',install,{once:true});
    window.addEventListener('load',install,{once:true});
})();
