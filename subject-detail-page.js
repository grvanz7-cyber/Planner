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
    function gradeNumber(v){const n=parseFloat(String(v??'').replace('%',''));return Number.isFinite(n)?n:null;}
    const levelPercent={'1-':40,'1':45,'1+':50,'2-':55,'2':60,'2+':65,'3-':70,'3':75,'3+':80,'4-':85,'4':90,'4+':95,'4++':100};
    function markPercent(mark){
        if(mark==null)return null;
        const raw=String(mark).trim();
        if(levelPercent[raw]!=null)return levelPercent[raw];
        const m=raw.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
        if(m&&Number(m[2])>0)return Math.max(0,Math.min(100,Number(m[1])/Number(m[2])*100));
        return gradeNumber(raw);
    }
    function assessmentPercent(a){
        const cats=Array.isArray(a.categories)?a.categories:[];
        if(!cats.length)return null;
        const vals=cats.map(c=>c.percent!=null?Number(c.percent):markPercent(c.display)).filter(Number.isFinite);
        return vals.length?vals.reduce((x,y)=>x+y,0)/vals.length:null;
    }
    function subjectGrades(subject){
        const all=[];
        (Array.isArray(data()?.gradeAssessments)?data().gradeAssessments:[]).filter(a=>String(a?.subject||'').toLowerCase()===String(subject.name).toLowerCase()).forEach(a=>{
            const n=assessmentPercent(a);if(n!=null)all.push({name:a.name||'Grade',grade:n,type:a.type||'Assessment',weight:a.weight,createdAt:a.createdAt,taskId:a.taskId});
        });
        return all.sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
    }
    function renderGradeGraph(box,grades){
        const graph=box.querySelector('#subjectGradeGraph');if(!graph)return;
        if(grades.length<2){graph.innerHTML=grades.length?'<div class="subject-grade-graph-empty">Add one more grade to see your trend.</div>':'';return;}
        const width=Math.max(560,grades.length*100),height=230,pad={l:42,r:18,t:18,b:54};
        const plotW=width-pad.l-pad.r,plotH=height-pad.t-pad.b;
        const x=i=>pad.l+(i/(grades.length-1))*plotW;
        const y=v=>pad.t+(100-v)/100*plotH;
        const points=grades.map((g,i)=>`${x(i).toFixed(1)},${y(g.grade).toFixed(1)}`).join(' ');
        const grid=[0,25,50,75,100].map(v=>`<line x1="${pad.l}" y1="${y(v)}" x2="${width-pad.r}" y2="${y(v)}" class="grade-graph-grid"/><text x="${pad.l-9}" y="${y(v)+4}" text-anchor="end" class="grade-graph-axis">${v}%</text>`).join('');
        const labels=grades.map((g,i)=>{const label=(g.name||'Grade').length>13?(g.name||'Grade').slice(0,12)+'…':(g.name||'Grade');return `<text x="${x(i)}" y="${height-25}" text-anchor="middle" class="grade-graph-label">${esc(label)}</text>`;}).join('');
        const dots=grades.map((g,i)=>`<circle cx="${x(i)}" cy="${y(g.grade)}" r="4" class="grade-graph-dot"><title>${esc(g.name)} — ${g.grade.toFixed(1)}%</title></circle>`).join('');
        graph.innerHTML=`<div class="subject-grade-graph-scroll"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Grade trend"><g>${grid}</g><polyline points="${points}" class="grade-graph-line" fill="none"/>${dots}${labels}</svg></div>`;
    }
    function renderGrades(page,s){
        const box=page.querySelector('#subjectDetailGrades');if(!box)return;
        const grades=subjectGrades(s);
        if(!grades.length){box.innerHTML='<div class="subject-detail-empty">No grades recorded for this subject yet.</div>';return;}
        const average=grades.reduce((sum,x)=>sum+x.grade,0)/grades.length;
        box.innerHTML=`<div class="subject-grade-summary"><div><strong>${average.toFixed(1)}%</strong><small>Current average</small></div><div><strong>${grades.length}</strong><small>Grades recorded</small></div></div><div id="subjectGradeGraph" class="subject-grade-graph"></div><div class="subject-grade-list"></div>`;
        renderGradeGraph(box,grades);
        const list=box.querySelector('.subject-grade-list');
        grades.slice().reverse().slice(0,8).forEach(g=>{const row=document.createElement('div');row.className='subject-grade-row';row.innerHTML='<div><strong></strong><small></small></div><b></b>';row.querySelector('strong').textContent=g.name;row.querySelector('small').textContent=g.type+(g.weight!=null?' · '+g.weight+'% weight':'');row.querySelector('b').textContent=g.grade.toFixed(1)+'%';list.appendChild(row);});
    }
    function ensurePage(){
        let page=document.getElementById('subjectDetailPage');if(page)return page;
        page=document.createElement('div');page.id='subjectDetailPage';page.className='page-hidden';
        page.innerHTML=`<header class="header subject-detail-header"><button class="subject-back-button" id="subjectDetailBack">← Subjects</button><div class="subject-detail-title"><div class="subject-detail-icon" id="subjectDetailIcon"></div><div><h1 id="subjectDetailName"></h1><p id="subjectDetailMeta"></p></div></div><button class="save-button" id="subjectDetailEdit">Edit Subject</button></header><div class="subject-detail-grid"><section class="card subject-detail-roadmap"><div class="subject-section-heading"><div><h2>Roadmap</h2><p>Units and lessons for this subject.</p></div><button class="small-button" id="subjectDetailRoadmap">Manage</button></div><div id="subjectDetailUnits"></div></section><section class="card subject-detail-grades"><div class="subject-section-heading"><div><h2>Grades</h2><p>Your current performance and grade trend.</p></div></div><div id="subjectDetailGrades"></div></section><section class="card"><div class="subject-section-heading"><div><h2>Upcoming</h2><p>What is coming up next.</p></div></div><div id="subjectDetailUpcoming"></div></section><section class="card"><div class="subject-section-heading"><div><h2>Active Work</h2><p>Everything currently in progress.</p></div></div><div id="subjectDetailActive"></div></section><section class="card"><div class="subject-section-heading"><div><h2>Completed</h2><p>Recently finished work.</p></div></div><div id="subjectDetailCompleted"></div></section></div>`;
        const main=document.querySelector('main.main')||document.querySelector('.main');main.appendChild(page);
        page.querySelector('#subjectDetailBack').onclick=()=>{hideOtherPages();page.classList.add('page-hidden');page.style.setProperty('display','none','important');const sp=document.getElementById('subjectsPage');if(sp){sp.classList.remove('page-hidden');sp.style.removeProperty('display');}if(typeof setActiveNav==='function')setActiveNav('subjects');history.replaceState(null,'','#subjects');};
        page.querySelector('#subjectDetailRoadmap').onclick=()=>{const s=page.dataset.subject;if(typeof openSubjectRoadmap==='function')openSubjectRoadmap(s);};
        page.querySelector('#subjectDetailEdit').onclick=()=>{const s=subjectByName(page.dataset.subject);if(!s)return;const i=subjects().indexOf(s);if(typeof editSubject==='function')editSubject(i);};
        return page;
    }
    function hideOtherPages(){
        ['dashboardPage','calendarPage','tasksPage','subjectsPage','assignmentsPage','testsExamsPage','gradesPage','settingsPage'].forEach(id=>{const el=document.getElementById(id);if(el){el.classList.add('page-hidden');el.style.setProperty('display','none','important');}});
    }
    function renderRoadmap(page,s){
        const units=page.querySelector('#subjectDetailUnits');if(!units)return;
        const roadmap=Array.isArray(s.roadmap)?s.roadmap:[];units.innerHTML='';
        if(!roadmap.length){units.innerHTML='<div class="subject-detail-empty">No units yet. Use Manage to build this subject’s roadmap.</div>';return;}
        roadmap.forEach((u,i)=>{
            const lessons=Array.isArray(u.lessons)?u.lessons:[],done=lessons.filter(l=>l.completed).length,percent=lessons.length?Math.round(done/lessons.length*100):0;
            const box=document.createElement('div');box.className='subject-detail-roadmap-unit';
            box.innerHTML=`<div class="subject-roadmap-unit-top"><div class="subject-roadmap-unit-title"><span>Unit ${i+1}</span><strong></strong></div><small></small></div><div class="subject-roadmap-progress"><div></div></div><div class="subject-roadmap-lessons"></div>`;
            box.querySelector('.subject-roadmap-unit-title strong').textContent=u.name||'Untitled unit';box.querySelector('.subject-roadmap-unit-top small').textContent=lessons.length?`${done}/${lessons.length} complete`:'No lessons yet';box.querySelector('.subject-roadmap-progress div').style.width=percent+'%';
            const lessonBox=box.querySelector('.subject-roadmap-lessons');
            if(!lessons.length)lessonBox.innerHTML='<span class="subject-roadmap-no-lessons">No lessons in this unit yet.</span>';
            lessons.forEach(l=>{
                const row=document.createElement('div');row.className='subject-roadmap-lesson'+(l.completed?' completed':'');
                row.innerHTML='<label><input type="checkbox"><span></span></label><button type="button" class="small-button subject-roadmap-study">Study</button>';
                row.querySelector('input').checked=!!l.completed;row.querySelector('span').textContent=l.name||'Untitled lesson';
                row.querySelector('input').onchange=()=>{if(window.SubjectRoadmap?.toggleLesson)window.SubjectRoadmap.toggleLesson(s.name,u.id,l.id);};
                row.querySelector('input').addEventListener('change',()=>row.classList.toggle('completed',row.querySelector('input').checked));
                row.querySelector('.subject-roadmap-study').onclick=()=>{const task=window.SubjectRoadmap?.startLesson?.(s.name,u.id,l.id);if(task&&typeof openEditTaskModal==='function')openEditTaskModal(task.id);};
                lessonBox.appendChild(row);
            });
            units.appendChild(box);
        });
    }
    function list(container,items,empty){container.innerHTML='';if(!items.length){container.innerHTML=`<div class="subject-detail-empty">${empty}</div>`;return;}items.forEach(t=>{const row=document.createElement('div');row.className='subject-detail-task';row.innerHTML=`<div class="subject-detail-task-type">${esc(t.type||'Task')}</div><div class="subject-detail-task-main"><strong>${esc(t.name||'Untitled task')}</strong><small>${esc(formatDue(t.dueDate))}${t.priority&&t.priority!=='Normal'?' · '+esc(t.priority):''}</small></div>`;row.onclick=()=>{if(typeof openEditTaskModal==='function')openEditTaskModal(t.id);};container.appendChild(row);});}
    function render(name,updateHistory=true){
        const s=subjectByName(name);if(!s)return;
        const page=ensurePage();hideOtherPages();
        page.dataset.subject=s.name;page.classList.remove('page-hidden');page.style.setProperty('display','block','important');
        if(typeof setActiveNav==='function')setActiveNav('subjects');
        if(updateHistory!==false)history.replaceState(null,'',`#subject/${encodeURIComponent(s.name)}`);
        else if(!window.location.hash.toLowerCase().startsWith('subject/'))history.replaceState(null,'',`#subject/${encodeURIComponent(s.name)}`);
        page.querySelector('#subjectDetailIcon').textContent=s.emoji||'📚';page.querySelector('#subjectDetailName').textContent=s.name;page.querySelector('#subjectDetailMeta').textContent=`${s.studyMode||'Study'} · ${s.active===false?'Inactive':'Active'}`;
        renderRoadmap(page,s);
        const st=tasks().filter(t=>String(t.subject||'').toLowerCase()===String(s.name).toLowerCase());const active=st.filter(t=>!t.completed);const upcoming=active.filter(t=>t.dueDate).sort((a,b)=>String(a.dueDate).localeCompare(String(b.dueDate))).slice(0,6);const completed=st.filter(t=>t.completed).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,6);
        list(page.querySelector('#subjectDetailUpcoming'),upcoming,'Nothing due yet 🎉');list(page.querySelector('#subjectDetailActive'),active.filter(t=>!upcoming.includes(t)).slice(0,8),'No other active work.');list(page.querySelector('#subjectDetailCompleted'),completed,'Nothing completed yet.');
        renderGrades(page,s);
    }
    window.openSubjectPage=render;
    document.addEventListener('planner-data-changed',()=>{const p=document.getElementById('subjectDetailPage');if(p&&!p.classList.contains('page-hidden'))render(p.dataset.subject,false);});
})();
