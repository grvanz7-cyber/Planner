// ========================================
// QUICK ADD FIX / PARSER V2
// Loaded after quick-add.js so this is the active Quick Add implementation.
// ========================================
(function(){
    const DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
    const EVENT_WORDS=['event','meeting','appointment','birthday','practice','practise','rehearsal','trip','concert'];
    const EVENT_PATTERNS=['meet','meeting','appointment','dentist','doctor','birthday','party','practice','practise','rehearsal','concert','trip','event'];
    const TYPE_ALIASES={quiz:['quiz','quizzes'],test:['test','tests','unit test'],exam:['exam','exams','final exam','midterm'],assignment:['assignment','assignments'],homework:['homework','hw'],task:['task','tasks','todo','to-do'],event:['event','events'],meeting:['meeting','meetings'],appointment:['appointment','appointments'],birthday:['birthday','birthdays'],practice:['practice','practise'],rehearsal:['rehearsal','rehearsals']};
    const EVENT_TYPES=['Event','Meeting','Appointment','Birthday','Practice','Rehearsal'];

    function data(){try{return typeof plannerData!=='undefined'&&plannerData?plannerData:null;}catch(e){return null;}}
    function subjects(){return data()?.settings?.subjects||[];}
    function types(){return data()?.settings?.types||[];}
    function activeSubjects(){return subjects().filter(s=>s&&s.active!==false);}
    function today(){const d=new Date();d.setHours(0,0,0,0);return d;}
    function iso(d){return d.toISOString().slice(0,10);}
    function re(word){return new RegExp('\\b'+String(word).replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\b','i');}

    function parseDate(text){
        const lower=text.toLowerCase(),base=today();
        if(/\bday after tomorrow\b/.test(lower)){base.setDate(base.getDate()+2);return iso(base);}
        if(/\btomorrow\b/.test(lower)){base.setDate(base.getDate()+1);return iso(base);}
        if(/\btoday\b|\btonight\b/.test(lower))return iso(base);
        const nextDay=lower.match(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
        if(nextDay){const target=DAYS.indexOf(nextDay[1]);let add=(target-base.getDay()+7)%7;if(add===0)add=7;add+=7;base.setDate(base.getDate()+add);return iso(base);}
        const dayMatch=lower.match(new RegExp('\\b('+DAYS.join('|')+')\\b'));
        if(dayMatch){const target=DAYS.indexOf(dayMatch[1]);let add=(target-base.getDay()+7)%7;if(add===0)add=7;base.setDate(base.getDate()+add);return iso(base);}
        const numeric=lower.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
        if(numeric){const d=new Date(+numeric[1],+numeric[2]-1,+numeric[3]);if(d.getFullYear()===+numeric[1]&&d.getMonth()===+numeric[2]-1&&d.getDate()===+numeric[3])return iso(d);}
        const month=lower.match(new RegExp('\\b('+MONTHS.join('|')+')\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(20\\d{2}))?\\b'));
        if(month){let year=month[3]?+month[3]:base.getFullYear();const mi=MONTHS.indexOf(month[1]),day=+month[2];let d=new Date(year,mi,day);if(!month[3]&&d<base)d=new Date(year+1,mi,day);if(d.getMonth()===mi&&d.getDate()===day)return iso(d);}
        return null;
    }

    function findSubject(text){
        const lower=text.toLowerCase();
        return activeSubjects().slice().sort((a,b)=>String(b.name||'').length-String(a.name||'').length).find(s=>s.name&&lower.includes(String(s.name).toLowerCase()))||null;
    }

    function findUnit(subject,text){
        if(!subject||!Array.isArray(subject.roadmap))return null;
        const lower=text.toLowerCase();
        return subject.roadmap.slice().sort((a,b)=>String(b.name||'').length-String(a.name||'').length).find(u=>u&&u.name&&lower.includes(String(u.name).toLowerCase()))||null;
    }

    function findType(text,subject){
        const lower=text.toLowerCase();
        // Explicit event language is checked first, even without a subject.
        for(const key of EVENT_TYPES){
            const configured=types().find(t=>String(t.name||'').toLowerCase()===key.toLowerCase());
            if(configured && re(key).test(text))return configured.name;
        }
        if(EVENT_WORDS.some(w=>re(w).test(text))){
            const configured=types().find(t=>String(t.name||'').toLowerCase()==='event');
            return configured?.name||'Event';
        }
        // A few natural phrases strongly imply an event.
        if(!subject && EVENT_PATTERNS.some(w=>lower.includes(w))){
            const configured=types().find(t=>String(t.name||'').toLowerCase()==='event');
            if(configured)return configured.name;
        }
        // School assessment/task types are retained in the name when relevant.
        for(const key of ['quiz','test','exam','assignment','homework','task']){
            if(TYPE_ALIASES[key].some(w=>re(w).test(text))){
                const configured=types().find(t=>String(t.name||'').toLowerCase()===key);
                return configured?.name||key[0].toUpperCase()+key.slice(1);
            }
        }
        return types().find(t=>String(t.name||'').toLowerCase()==='task')?.name||'Task';
    }

    function parsePriority(text){
        if(/\b(high|urgent|important|asap)\b/i.test(text))return'High';
        if(/\b(low|whenever|not urgent)\b/i.test(text))return'Low';
        return'Normal';
    }

    function removeScheduling(name){
        [...DAYS,...MONTHS,'today','tomorrow','tonight','day after tomorrow','next sunday','next monday','next tuesday','next wednesday','next thursday','next friday','next saturday','high','urgent','important','asap','low','whenever','not urgent'].forEach(w=>name=name.replace(new RegExp('\\b'+w.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\b','ig'),' '));
        name=name.replace(/\b20\d{2}[-\/.]\d{1,2}[-\/.]\d{1,2}\b/g,' ');
        name=name.replace(/\b(?:due|by|on)\s*$/i,'');
        return name.replace(/\s+/g,' ').replace(/^[\s,;:-]+|[\s,;:-]+$/g,'');
    }

    function cleanName(text,subject,school){
        let name=removeScheduling(text.trim());
        if(school && subject){
            // Subject is metadata. Type is intentionally NOT removed: e.g.
            // "english test tomorrow high" -> "test", while
            // "english novel test next thursday" -> "novel test".
            name=name.replace(new RegExp(String(subject.name).replace(/[.*+?^${}()|[\\]\\]/g,'\\$&'),'ig'),' ');
        }
        return name.replace(/\s+/g,' ').replace(/^[\s,;:-]+|[\s,;:-]+$/g,'')||text.trim();
    }

    function parse(text){
        const subject=findSubject(text);
        const unit=findUnit(subject,text);
        const type=findType(text,subject);
        const dueDate=parseDate(text);
        const priority=parsePriority(text);
        const school=!!subject||['assignment','quiz','test','exam','homework'].includes(String(type).toLowerCase());
        const name=cleanName(text,subject,school);
        const tags=school?['#School']:[];
        return {name,subject:subject?.name||'',type,priority,dueDate,tags,unit:unit?.name||'',unitId:unit?.id||null};
    }

    function hideOldModals(){
        document.querySelectorAll('.modal-overlay').forEach(el=>{
            if(el.id!=='quickAddReviewModal'){
                el.classList.remove('open');
                el.style.setProperty('display','none','important');
                el.style.setProperty('visibility','hidden','important');
                el.style.setProperty('opacity','0','important');
                el.style.setProperty('z-index','-1','important');
            }
        });
    }
    function restoreOldModals(){
        document.querySelectorAll('.modal-overlay').forEach(el=>{
            if(el.id!=='quickAddReviewModal'){
                el.style.removeProperty('display');el.style.removeProperty('visibility');el.style.removeProperty('opacity');el.style.removeProperty('z-index');
            }
        });
    }

    function review(parsed){
        hideOldModals();
        let modal=document.getElementById('quickAddReviewModal');
        if(!modal){
            modal=document.createElement('div');modal.id='quickAddReviewModal';modal.className='modal-overlay';
            modal.innerHTML='<div class="modal"><div class="modal-header"><h2>Quick Add</h2><button class="close-button" type="button">×</button></div><p class="quick-add-review-hint">I understood this as:</p><div class="quick-add-preview"></div><div class="modal-actions"><button class="cancel-button" type="button">Edit</button><button class="save-button" type="button">Add Task</button></div></div>';
            document.body.appendChild(modal);
        }else document.body.appendChild(modal);
        modal.style.setProperty('display','flex','important');modal.style.setProperty('visibility','visible','important');modal.style.setProperty('opacity','1','important');modal.style.setProperty('z-index','2147483647','important');modal.classList.add('open');
        const rows=[['Name',parsed.name],['Subject',parsed.subject||'None'],['Type',parsed.type],['Unit',parsed.unit||'None'],['Due',parsed.dueDate||'No due date'],['Priority',parsed.priority]];
        modal.querySelector('.quick-add-preview').innerHTML=rows.map(r=>`<div class="quick-add-preview-row"><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join('');
        modal.querySelector('.close-button').onclick=()=>{modal.classList.remove('open');restoreOldModals();};
        modal.querySelector('.cancel-button').onclick=()=>{
            modal.classList.remove('open');restoreOldModals();
            if(typeof openTaskModal==='function')openTaskModal();
            setTimeout(()=>{
                const values={taskName:parsed.name,taskSubject:parsed.subject,taskType:parsed.type,taskDueDate:parsed.dueDate||'',taskPriority:parsed.priority,taskTags:parsed.tags.join(', ')};
                Object.entries(values).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v;});
            },0);
        };
        modal.querySelector('.save-button').onclick=()=>{modal.classList.remove('open');restoreOldModals();create(parsed);};
    }

    function create(p){
        const d=data();if(!d)return;if(!Array.isArray(d.tasks))d.tasks=[];
        d.tasks.push({id:Date.now(),name:p.name,subject:p.subject,type:p.type,priority:p.priority,dueDate:p.dueDate||null,tags:p.tags,unit:p.unit||'',unitId:p.unitId||null,completed:false,createdAt:new Date().toISOString()});
        if(typeof savePlannerData==='function')savePlannerData();
        ['renderTasks','renderAllTasks','renderCalendar','renderAssignments','renderAssessments','renderSubjectsPage'].forEach(fn=>{if(typeof window[fn]==='function'){try{window[fn]();}catch(e){}}});
        document.dispatchEvent(new CustomEvent('planner-data-changed',{detail:{reason:'quick-add-v2'}}));
    }

    function handle(){
        const input=document.querySelector('.quick-add input');if(!input)return;
        const text=input.value.trim();if(!text){if(typeof openTaskModal==='function')openTaskModal();return;}
        input.value='';review(parse(text));
    }
    window.quickAdd=handle;window.addTask=handle;
    if(!document.getElementById('quickAddV2Styles')){
        const style=document.createElement('style');style.id='quickAddV2Styles';style.textContent='.quick-add-review-hint{margin:0 0 14px;color:var(--muted-text,#777);font-size:13px}.quick-add-preview{display:flex;flex-direction:column;border:1px solid var(--border-color,#ddd);border-radius:12px;overflow:hidden}.quick-add-preview-row{display:flex;justify-content:space-between;gap:16px;padding:10px 12px;border-bottom:1px solid var(--border-color,#eee);font-size:13px}.quick-add-preview-row:last-child{border-bottom:0}.quick-add-preview-row span{opacity:.65}.quick-add-review-modal{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important}.quick-add-review-modal .modal{position:relative!important;z-index:2147483647!important}#quickAddReviewModal{position:fixed!important;inset:0!important;z-index:2147483647!important}#quickAddReviewModal .modal{z-index:2147483647!important}';document.head.appendChild(style);
    }
    const input=document.querySelector('.quick-add input'),button=document.querySelector('.quick-add button');
    if(input&&button){button.onclick=handle;if(!input.__quickAddV2Key){input.__quickAddV2Key=true;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handle();}});}}
})();
