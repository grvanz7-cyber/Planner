// ========================================
// SUBJECT ROADMAPS
// Adds roadmap/unit data and lesson details to subjects.
// ========================================
(function installSubjectRoadmaps(){
    function data(){return typeof plannerData!=='undefined'&&plannerData?plannerData:null;}
    function ensure(){
        const d=data();
        if(!d)return null;
        if(!d.settings)d.settings={};
        if(!Array.isArray(d.settings.subjects))d.settings.subjects=[];
        if(!Array.isArray(d.tasks))d.tasks=[];
        d.settings.subjects.forEach(s=>{if(s&&!Array.isArray(s.roadmap))s.roadmap=[];});
        return d;
    }
    function save(){
        if(typeof savePlannerData==='function')savePlannerData();
        document.dispatchEvent(new CustomEvent('planner-data-changed',{detail:{reason:'subject-roadmap'}}));
    }
    function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
    function findLesson(subject,unitId,lessonId){
        const d=ensure();
        const s=d?.settings?.subjects?.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
        const u=s?.roadmap?.find(x=>String(x.id)===String(unitId));
        const l=u?.lessons?.find(x=>String(x.id)===String(lessonId));
        return s&&u&&l?{d,s,u,l}:null;
    }

    window.SubjectRoadmap={
        get(subject){const d=ensure();const s=d?.settings?.subjects?.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());return s?.roadmap||[];},
        addUnit(subject,unit){const d=ensure();if(!d)return;const s=d.settings.subjects.find(x=>x===subject||String(x?.name).toLowerCase()===String(subject).toLowerCase());if(!s)return;s.roadmap=s.roadmap||[];s.roadmap.push({...unit,id:Date.now()+Math.random(),lessons:Array.isArray(unit.lessons)?unit.lessons:[]});save();},
        updateUnit(subject,id,patch){const d=ensure();if(!d)return;const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());const u=s?.roadmap?.find(x=>String(x.id)===String(id));if(!u)return;Object.assign(u,patch);save();},
        removeUnit(subject,id){const d=ensure();if(!d)return;const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());if(!s)return;s.roadmap=(s.roadmap||[]).filter(x=>String(x.id)!==String(id));save();},
        addLesson(subject,unitId,name){const d=ensure();if(!d)return;const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());const u=s?.roadmap?.find(x=>String(x.id)===String(unitId));if(!u)return;u.lessons=u.lessons||[];u.lessons.push({id:Date.now()+Math.random(),name:String(name||'').trim(),status:'Not started',completed:false,notes:'',resources:'',startedAt:null,completedAt:null});save();},
        updateLesson(subject,unitId,lessonId,patch){const found=findLesson(subject,unitId,lessonId);if(!found)return;Object.assign(found.l,patch);if(found.l.status==='Completed'){found.l.completed=true;found.l.completedAt=found.l.completedAt||new Date().toISOString();}else{found.l.completed=false;if(found.l.status==='In progress')found.l.startedAt=found.l.startedAt||new Date().toISOString();if(found.l.status==='Not started')found.l.startedAt=null;}save();},
        toggleLesson(subject,unitId,lessonId){const found=findLesson(subject,unitId,lessonId);if(!found)return;const now=new Date().toISOString();if(found.l.completed||found.l.status==='Completed'){found.l.completed=false;found.l.status='In progress';found.l.completedAt=null;found.l.startedAt=found.l.startedAt||now;}else{found.l.completed=true;found.l.status='Completed';found.l.completedAt=now;found.l.startedAt=found.l.startedAt||now;}save();},
        startLesson(subject,unitId,lessonId){const found=findLesson(subject,unitId,lessonId);if(!found)return null;found.l.status='In progress';found.l.completed=false;found.l.startedAt=found.l.startedAt||new Date().toISOString();save();const existing=found.d.tasks.find(t=>String(t?.roadmapLessonId)===String(lessonId)&&!t.completed);if(existing)return existing;const task={id:Date.now()+Math.random(),name:found.l.name,subject:found.s.name,type:'Task',priority:'Normal',dueDate:null,tags:['#School'],completed:false,createdAt:new Date().toISOString(),roadmapUnitId:found.u.id,roadmapLessonId:found.l.id,roadmapUnit:found.u.name,roadmapLesson:found.l.name};found.d.tasks.push(task);save();return task;},
        assignTaskToUnit(subject,unitId,taskId){const d=ensure();if(!d)return null;const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());const u=s?.roadmap?.find(x=>String(x.id)===String(unitId));const task=d.tasks.find(t=>String(t?.id)===String(taskId));if(!s||!u||!task)return null;if(String(task.subject||'').toLowerCase()!==String(s.name||'').toLowerCase())return null;task.roadmapUnitId=u.id;task.roadmapUnit=u.name||'';task.roadmapLessonId=null;task.roadmapLesson=null;save();return task;}
    };

    function closeLessonModal(){const modal=document.getElementById('lessonDetailModal');if(modal)modal.classList.remove('open');}
    function openLessonDetails(subject,unitId,lessonId){
        const found=findLesson(subject,unitId,lessonId);if(!found)return;
        let modal=document.getElementById('lessonDetailModal');
        if(!modal){
            modal=document.createElement('div');modal.id='lessonDetailModal';modal.className='modal-overlay lesson-detail-modal';
            modal.innerHTML='<div class="modal lesson-detail"><div class="modal-header"><div><span class="lesson-detail-kicker" id="lessonDetailUnit"></span><h2 id="lessonDetailTitle"></h2><p id="lessonDetailSubject"></p></div><button class="close-button" type="button" id="lessonDetailClose">×</button></div><div class="lesson-detail-body"><label class="lesson-detail-field"><span>Status</span><select id="lessonDetailStatus"><option>Not started</option><option>In progress</option><option>Completed</option></select></label><div class="lesson-detail-dates" id="lessonDetailDates"></div><label class="lesson-detail-field"><span>Notes</span><textarea id="lessonDetailNotes" rows="5" placeholder="Add notes about this lesson..."></textarea></label><label class="lesson-detail-field"><span>Resources</span><textarea id="lessonDetailResources" rows="3" placeholder="Links, textbook pages, files, or other resources..."></textarea></label></div><div class="modal-actions"><button class="cancel-button" type="button" id="lessonDetailStudy">Study</button><button class="save-button" type="button" id="lessonDetailSave">Save</button></div></div>';
            document.body.appendChild(modal);
            modal.querySelector('#lessonDetailClose').onclick=closeLessonModal;
            modal.addEventListener('click',e=>{if(e.target===modal)closeLessonModal();});
        }
        modal.dataset.subject=subject;modal.dataset.unitId=unitId;modal.dataset.lessonId=lessonId;
        modal.querySelector('#lessonDetailUnit').textContent=found.u.name||'Unit';
        modal.querySelector('#lessonDetailTitle').textContent=found.l.name||'Lesson';
        modal.querySelector('#lessonDetailSubject').textContent=`${found.s.emoji||'📚'} ${found.s.name}`;
        modal.querySelector('#lessonDetailStatus').value=found.l.status||(found.l.completed?'Completed':'Not started');
        modal.querySelector('#lessonDetailNotes').value=found.l.notes||'';
        modal.querySelector('#lessonDetailResources').value=found.l.resources||'';
        const dates=modal.querySelector('#lessonDetailDates');
        const fmt=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';
        dates.innerHTML=`<div><small>Started</small><strong>${fmt(found.l.startedAt)}</strong></div><div><small>Completed</small><strong>${fmt(found.l.completedAt)}</strong></div>`;
        modal.querySelector('#lessonDetailSave').onclick=()=>{const status=modal.querySelector('#lessonDetailStatus').value;window.SubjectRoadmap.updateLesson(subject,unitId,lessonId,{status,notes:modal.querySelector('#lessonDetailNotes').value.trim(),resources:modal.querySelector('#lessonDetailResources').value.trim()});closeLessonModal();renderDetail(subject);};
        modal.querySelector('#lessonDetailStudy').onclick=()=>{const task=window.SubjectRoadmap.startLesson(subject,unitId,lessonId);if(task&&typeof openEditTaskModal==='function')openEditTaskModal(task.id);};
        modal.classList.add('open');
    }

    function closeAssignTasksModal(){const modal=document.getElementById('assignTasksModal');if(modal)modal.classList.remove('open');}
    function openAssignTasks(subject,unitId){
        const d=ensure();if(!d)return;
        const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
        const u=s?.roadmap?.find(x=>String(x.id)===String(unitId));
        if(!s||!u)return;
        let modal=document.getElementById('assignTasksModal');
        if(!modal){
            modal=document.createElement('div');modal.id='assignTasksModal';modal.className='modal-overlay roadmap-assign-modal';
            modal.innerHTML='<div class="modal roadmap-assign"><div class="modal-header"><div><span class="lesson-detail-kicker">Assign existing work</span><h2 id="assignTasksTitle"></h2><p id="assignTasksSubtitle"></p></div><button class="close-button" type="button" id="assignTasksClose">×</button></div><div id="assignTasksList" class="roadmap-assign-list"></div></div>';
            document.body.appendChild(modal);
            modal.querySelector('#assignTasksClose').onclick=closeAssignTasksModal;
            modal.addEventListener('click',e=>{if(e.target===modal)closeAssignTasksModal();});
        }
        modal.querySelector('#assignTasksTitle').textContent=u.name||'Unit';
        modal.querySelector('#assignTasksSubtitle').textContent=`Choose existing work from ${s.name} to place in this unit.`;
        const list=modal.querySelector('#assignTasksList');
        const tasks=d.tasks.filter(t=>String(t?.subject||'').toLowerCase()===String(s.name||'').toLowerCase());
        list.innerHTML='';
        if(!tasks.length){list.innerHTML='<div class="roadmap-assign-empty">No existing work for this subject yet.</div>';modal.classList.add('open');return;}
        tasks.sort((a,b)=>String(a?.dueDate||'9999-12-31').localeCompare(String(b?.dueDate||'9999-12-31'))||String(a?.name||'').localeCompare(String(b?.name||'')));
        tasks.forEach(task=>{
            const row=document.createElement('div');row.className='roadmap-assign-row';
            const currentUnit=s.roadmap.find(x=>String(x.id)===String(task.roadmapUnitId));
            const same=currentUnit&&String(currentUnit.id)===String(u.id);
            const status=task.completed||String(task.status||'').toLowerCase()==='completed'?'Completed':task.dueDate?`Due ${task.dueDate}`:'No due date';
            row.innerHTML=`<div class="roadmap-assign-main"><strong>${esc(task.name||'Untitled')}</strong><small>${esc(task.type||'Task')} · ${esc(status)}${currentUnit?` · ${esc(currentUnit.name||'Unit')}`:''}</small></div><button type="button" class="small-button roadmap-assign-button">${same?'Assigned':currentUnit?'Move here':'Assign'}</button>`;
            const button=row.querySelector('.roadmap-assign-button');button.disabled=same;button.onclick=()=>{window.SubjectRoadmap.assignTaskToUnit(s.name,u.id,task.id);closeAssignTasksModal();renderDetail(s.name);};list.appendChild(row);
        });
        modal.classList.add('open');
    }

    function renderDetail(subject){
        const d=ensure();if(!d)return;const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());if(!s)return;
        let modal=document.getElementById('subjectRoadmapModal');
        if(!modal){modal=document.createElement('div');modal.id='subjectRoadmapModal';modal.className='modal-overlay subject-roadmap-modal';modal.innerHTML='<div class="modal subject-roadmap-detail"><div class="modal-header"><div><h2 id="roadmapTitle"></h2><p id="roadmapSubtitle">Subject roadmap</p></div><button class="close-button" type="button" id="roadmapClose">×</button></div><div id="roadmapUnits"></div><div class="modal-actions"><button class="cancel-button" type="button" id="roadmapAddUnit">+ Add Unit</button><button class="save-button" type="button" id="roadmapDone">Done</button></div></div>';document.body.appendChild(modal);modal.querySelector('#roadmapClose').onclick=()=>modal.classList.remove('open');modal.querySelector('#roadmapDone').onclick=()=>modal.classList.remove('open');}
        modal.querySelector('#roadmapTitle').textContent=`${s.emoji||'📚'} ${s.name}`;
        const units=modal.querySelector('#roadmapUnits');units.innerHTML='';
        (s.roadmap||[]).forEach((u,i)=>{const box=document.createElement('section');box.className='roadmap-unit';const lessons=u.lessons||[];const done=lessons.filter(l=>l.completed||l.status==='Completed').length;const assigned=d.tasks.filter(t=>String(t?.roadmapUnitId)===String(u.id)&&String(t?.subject||'').toLowerCase()===String(s.name||'').toLowerCase());box.innerHTML=`<div class="roadmap-unit-head"><div><span class="roadmap-unit-number">Unit ${i+1}</span><h3>${esc(u.name||'Untitled unit')}</h3><small>${done}/${lessons.length} lessons complete${assigned.length?` · ${assigned.length} item${assigned.length===1?'':'s'} assigned`:''}</small></div><div class="roadmap-unit-actions"><button class="small-button roadmap-assign-existing" type="button">Assign Existing</button><button class="small-button roadmap-delete" type="button">Delete</button></div></div><div class="roadmap-lessons"></div><div class="roadmap-add-lesson"><input type="text" placeholder="Add lesson..."><button class="small-button" type="button">Add</button></div>`;
            const list=box.querySelector('.roadmap-lessons');lessons.forEach(l=>{const row=document.createElement('div');row.className='roadmap-lesson';const status=l.status||(l.completed?'Completed':'Not started');row.innerHTML=`<label><input type="checkbox" ${l.completed?'checked':''}><span>${esc(l.name)}</span></label><span class="roadmap-lesson-status roadmap-status-${status.toLowerCase().replace(/\s+/g,'-')}">${esc(status)}</span><button class="small-button roadmap-study" type="button">Study</button>`;row.querySelector('label').onclick=e=>e.stopPropagation();row.onclick=()=>openLessonDetails(s.name,u.id,l.id);row.querySelector('input').onchange=()=>{window.SubjectRoadmap.toggleLesson(s.name,u.id,l.id);renderDetail(s.name);};row.querySelector('.roadmap-study').onclick=e=>{e.stopPropagation();const task=window.SubjectRoadmap.startLesson(s.name,u.id,l.id);if(task&&typeof openEditTaskModal==='function')openEditTaskModal(task.id);};list.appendChild(row);});
            box.querySelector('.roadmap-assign-existing').onclick=()=>openAssignTasks(s.name,u.id);
            box.querySelector('.roadmap-delete').onclick=()=>{if(confirm(`Delete ${u.name||'this unit'}?`)){window.SubjectRoadmap.removeUnit(s.name,u.id);renderDetail(s.name);}};const inp=box.querySelector('input[type="text"]');const addLesson=()=>{const name=inp.value.trim();if(!name)return;window.SubjectRoadmap.addLesson(s.name,u.id,name);renderDetail(s.name);};inp.dataset.unitId=u.id;inp.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addLesson();}});box.querySelector('.roadmap-add-lesson button').onclick=addLesson;units.appendChild(box);});
        if(!(s.roadmap||[]).length)units.innerHTML='<div class="roadmap-empty">No units yet. Add your first unit to start building the roadmap.</div>';
        modal.querySelector('#roadmapAddUnit').onclick=()=>{if(modal.querySelector('.roadmap-unit-add-form'))return;const form=document.createElement('div');form.className='roadmap-unit-add-form';form.innerHTML='<input type="text" placeholder="Unit name..."><button class="save-button" type="button">Add Unit</button><button class="cancel-button" type="button">Cancel</button>';modal.querySelector('#roadmapUnits').prepend(form);const input=form.querySelector('input');input.focus();const cancel=()=>form.remove();const submit=()=>{const name=input.value.trim();if(!name){input.focus();return;}window.SubjectRoadmap.addUnit(s,{name,lessons:[]});renderDetail(s.name);};form.querySelector('.save-button').onclick=submit;form.querySelector('.cancel-button').onclick=cancel;input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit();}if(event.key==='Escape'){event.preventDefault();cancel();}});};
        modal.classList.add('open');
    }
    window.openSubjectRoadmap=renderDetail;
    ensure();
})();