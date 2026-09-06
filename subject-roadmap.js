// ========================================
// SUBJECT ROADMAPS
// Adds roadmap/unit data to subjects without changing the existing data schema.
// ========================================
(function installSubjectRoadmaps(){
    function data(){return typeof plannerData!=='undefined'&&plannerData?plannerData:null;}
    function ensure(){
        const d=data();
        if(!d)return null;
        if(!d.settings)d.settings={};
        if(!Array.isArray(d.settings.subjects))d.settings.subjects=[];
        d.settings.subjects.forEach(s=>{
            if(s&&!Array.isArray(s.roadmap))s.roadmap=[];
        });
        return d;
    }
    function save(){
        if(typeof savePlannerData==='function')savePlannerData();
        document.dispatchEvent(new CustomEvent('planner-data-changed',{detail:{reason:'subject-roadmap'}}));
    }
    function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}

    window.SubjectRoadmap={
        get(subject){
            const d=ensure();
            const s=d?.settings?.subjects?.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
            return s?.roadmap||[];
        },
        addUnit(subject,unit){
            const d=ensure(); if(!d)return;
            const s=d.settings.subjects.find(x=>x===subject||String(x?.name).toLowerCase()===String(subject).toLowerCase());
            if(!s)return;
            s.roadmap=s.roadmap||[];
            s.roadmap.push({...unit,id:Date.now()+Math.random(),lessons:Array.isArray(unit.lessons)?unit.lessons:[]});
            save();
        },
        updateUnit(subject,id,patch){
            const d=ensure(); if(!d)return;
            const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
            const u=s?.roadmap?.find(x=>String(x.id)===String(id));
            if(!u)return;
            Object.assign(u,patch); save();
        },
        removeUnit(subject,id){
            const d=ensure(); if(!d)return;
            const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
            if(!s)return;
            s.roadmap=(s.roadmap||[]).filter(x=>String(x.id)!==String(id)); save();
        },
        addLesson(subject,unitId,name){
            const d=ensure(); if(!d)return;
            const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
            const u=s?.roadmap?.find(x=>String(x.id)===String(unitId));
            if(!u)return;
            u.lessons=u.lessons||[];
            u.lessons.push({id:Date.now()+Math.random(),name:String(name||'').trim(),completed:false});
            save();
        },
        toggleLesson(subject,unitId,lessonId){
            const d=ensure(); if(!d)return;
            const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
            const u=s?.roadmap?.find(x=>String(x.id)===String(unitId));
            const l=u?.lessons?.find(x=>String(x.id)===String(lessonId));
            if(!l)return;
            l.completed=!l.completed; save();
        }
    };

    function renderDetail(subject){
        const d=ensure(); if(!d)return;
        const s=d.settings.subjects.find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
        if(!s)return;
        let modal=document.getElementById('subjectRoadmapModal');
        if(!modal){
            modal=document.createElement('div');
            modal.id='subjectRoadmapModal'; modal.className='modal-overlay subject-roadmap-modal';
            modal.innerHTML='<div class="modal subject-roadmap-detail"><div class="modal-header"><div><h2 id="roadmapTitle"></h2><p id="roadmapSubtitle">Subject roadmap</p></div><button class="close-button" type="button" id="roadmapClose">×</button></div><div id="roadmapUnits"></div><div class="modal-actions"><button class="cancel-button" type="button" id="roadmapAddUnit">+ Add Unit</button><button class="save-button" type="button" id="roadmapDone">Done</button></div></div>';
            document.body.appendChild(modal);
            modal.querySelector('#roadmapClose').onclick=()=>modal.classList.remove('open');
            modal.querySelector('#roadmapDone').onclick=()=>modal.classList.remove('open');
        }
        modal.querySelector('#roadmapTitle').textContent=`${s.emoji||'📚'} ${s.name}`;
        const units=modal.querySelector('#roadmapUnits'); units.innerHTML='';
        (s.roadmap||[]).forEach((u,i)=>{
            const box=document.createElement('section'); box.className='roadmap-unit';
            const lessons=u.lessons||[]; const done=lessons.filter(l=>l.completed).length;
            box.innerHTML=`<div class="roadmap-unit-head"><div><span class="roadmap-unit-number">Unit ${i+1}</span><h3>${esc(u.name||'Untitled unit')}</h3><small>${done}/${lessons.length} lessons complete</small></div><button class="small-button roadmap-delete" type="button">Delete</button></div><div class="roadmap-lessons"></div><div class="roadmap-add-lesson"><input type="text" placeholder="Add lesson..."><button class="small-button" type="button">Add</button></div>`;
            const list=box.querySelector('.roadmap-lessons');
            lessons.forEach(l=>{const row=document.createElement('label');row.className='roadmap-lesson';row.innerHTML=`<input type="checkbox" ${l.completed?'checked':''}><span>${esc(l.name)}</span>`;row.querySelector('input').onchange=()=>window.SubjectRoadmap.toggleLesson(s.name,u.id,l.id);list.appendChild(row);});
            box.querySelector('.roadmap-delete').onclick=()=>{if(confirm(`Delete ${u.name||'this unit'}?`)){window.SubjectRoadmap.removeUnit(s.name,u.id);renderDetail(s.name);}};
            const inp=box.querySelector('input[type="text"]'); box.querySelector('.roadmap-add-lesson button').onclick=()=>{if(inp.value.trim()){window.SubjectRoadmap.addLesson(s.name,u.id,inp.value);renderDetail(s.name);}};
            units.appendChild(box);
        });
        if(!(s.roadmap||[]).length)units.innerHTML='<div class="roadmap-empty">No units yet. Add your first unit to start building the roadmap.</div>';
        modal.querySelector('#roadmapAddUnit').onclick=()=>{
            const name=prompt('Unit name:'); if(!name?.trim())return;
            window.SubjectRoadmap.addUnit(s,{name:name.trim(),lessons:[]}); renderDetail(s.name);
        };
        modal.classList.add('open');
    }
    window.openSubjectRoadmap=renderDetail;
    ensure();
})();
