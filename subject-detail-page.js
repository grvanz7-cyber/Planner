// ========================================
// SUBJECT DETAIL PAGES
// ========================================
(function installSubjectDetailPage(){
    const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
    const data=()=>typeof plannerData!=='undefined'&&plannerData?plannerData:null;
    const subjects=()=>data()?.settings?.subjects||[];
    const tasks=()=>Array.isArray(data()?.tasks)?data().tasks:[];
    function subjectByName(name){return subjects().find(s=>String(s?.name).toLowerCase()===String(name).toLowerCase());}
    function formatDue(v){if(!v)return 'No due date';const d=new Date(v+'T00:00:00');return Number.isNaN(d.getTime())?v:d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});}
    function ensurePage(){
        let page=document.getElementById('subjectDetailPage');
        if(page)return page;
        page=document.createElement('div');page.id='subjectDetailPage';page.className='page-hidden';
        page.innerHTML=`<header class="header subject-detail-header"><button class="subject-back-button" id="subjectDetailBack">← Subjects</button><div class="subject-detail-title"><div class="subject-detail-icon" id="subjectDetailIcon"></div><div><h1 id="subjectDetailName"></h1><p id="subjectDetailMeta"></p></div></div><button class="save-button" id="subjectDetailEdit">Edit Subject</button></header><div class="subject-detail-grid"><section class="card subject-detail-roadmap"><div class="subject-section-heading"><div><h2>Roadmap</h2><p>Units and lessons for this subject.</p></div><button class="small-button" id="subjectDetailRoadmap">Manage</button></div><div id="subjectDetailUnits"></div></section><section class="card"><div class="subject-section-heading"><div><h2>Upcoming</h2><p>What is coming up next.</p></div></div><div id="subjectDetailUpcoming"></div></section><section class="card"><div class="subject-section-heading"><div><h2>Active Work</h2><p>Everything currently in progress.</p></div></div><div id="subjectDetailActive"></div></section><section class="card"><div class="subject-section-heading"><div><h2>Completed</h2><p>Recently finished work.</p></div></div><div id="subjectDetailCompleted"></div></section></div>`;
        const main=document.querySelector('main.main')||document.querySelector('.main');main.appendChild(page);
        page.querySelector('#subjectDetailBack').onclick=()=>{page.classList.add('page-hidden');const sp=document.getElementById('subjectsPage');if(sp)sp.classList.remove('page-hidden');};
        page.querySelector('#subjectDetailRoadmap').onclick=()=>{const s=page.dataset.subject;if(typeof openSubjectRoadmap==='function')openSubjectRoadmap(s);};
        page.querySelector('#subjectDetailEdit').onclick=()=>{const s=subjectByName(page.dataset.subject);if(!s)return;const i=subjects().indexOf(s);if(typeof editSubject==='function')editSubject(i);};
        return page;
    }
    function list(container,items,empty){container.innerHTML='';if(!items.length){container.innerHTML=`<div class="subject-detail-empty">${empty}</div>`;return;}items.forEach(t=>{const row=document.createElement('div');row.className='subject-detail-task';row.innerHTML=`<div class="subject-detail-task-type">${esc(t.type||'Task')}</div><div class="subject-detail-task-main"><strong>${esc(t.name||'Untitled task')}</strong><small>${esc(formatDue(t.dueDate))}${t.priority&&t.priority!=='Normal'?' · '+esc(t.priority):''}</small></div>`;row.onclick=()=>{if(typeof openEditTaskModal==='function')openEditTaskModal(t.id);};container.appendChild(row);});}
    function render(name){
        const s=subjectByName(name);if(!s)return;
        const page=ensurePage();page.dataset.subject=s.name;page.classList.remove('page-hidden');
        const sp=document.getElementById('subjectsPage');if(sp)sp.classList.add('page-hidden');
        page.querySelector('#subjectDetailIcon').textContent=s.emoji||'📚';page.querySelector('#subjectDetailName').textContent=s.name;page.querySelector('#subjectDetailMeta').textContent=`${s.studyMode||'Study'} · ${s.active===false?'Inactive':'Active'}`;
        const roadmap=Array.isArray(s.roadmap)?s.roadmap:[];const units=page.querySelector('#subjectDetailUnits');units.innerHTML='';
        if(!roadmap.length)units.innerHTML='<div class="subject-detail-empty">No units yet. Use Manage to build this subject’s roadmap.</div>';
        roadmap.forEach((u,i)=>{const lessons=Array.isArray(u.lessons)?u.lessons:[];const done=lessons.filter(l=>l.completed).length;const box=document.createElement('div');box.className='subject-detail-unit';box.innerHTML=`<div><span>Unit ${i+1}</span><strong>${esc(u.name||'Untitled unit')}</strong></div><small>${done}/${lessons.length} lessons</small>`;units.appendChild(box);});
        const st=tasks().filter(t=>String(t.subject||'').toLowerCase()===String(s.name).toLowerCase());const active=st.filter(t=>!t.completed);const upcoming=active.filter(t=>t.dueDate).sort((a,b)=>String(a.dueDate).localeCompare(String(b.dueDate))).slice(0,6);const completed=st.filter(t=>t.completed).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,6);
        list(page.querySelector('#subjectDetailUpcoming'),upcoming,'Nothing due yet 🎉');list(page.querySelector('#subjectDetailActive'),active.filter(t=>!upcoming.includes(t)).slice(0,8),'No other active work.');list(page.querySelector('#subjectDetailCompleted'),completed,'Nothing completed yet.');
    }
    window.openSubjectPage=render;
    document.addEventListener('planner-data-changed',()=>{const p=document.getElementById('subjectDetailPage');if(p&&!p.classList.contains('page-hidden'))render(p.dataset.subject);});
})();
