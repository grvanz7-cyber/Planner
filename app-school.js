(() => {
  const subjects = [
    {name:'English', emoji:'📖'},
    {name:'Physics', emoji:'⚛️'},
    {name:'Chemistry', emoji:'🧪'},
    {name:'Math', emoji:'📐'}
  ];

  function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function tasks(){return window.PlannerAppData ? window.PlannerAppData.getTasks() : [];}

  window.PlannerAppSchool = {
    render(container){
      const all=tasks();
      const school=all.filter(t=>t.subject || ['assignment','quiz','test','exam'].includes(String(t.type||'').toLowerCase()));
      container.innerHTML=`<div class="greeting"><h1>School</h1><p>Your schoolwork at a glance.</p></div>
      <section class="card"><div class="head"><h2>Subjects</h2></div><div class="subjectGrid">${subjects.map(s=>`<button class="subjectCard" data-subject="${esc(s.name)}"><span>${s.emoji}</span><strong>${esc(s.name)}</strong></button>`).join('')}</div></section>
      <section class="card"><div class="head"><h2>Schoolwork</h2><span class="count">${school.length}</span></div><div id="schoolWorkList"></div></section>`;
      const list=container.querySelector('#schoolWorkList');
      list.innerHTML=school.length?school.sort((a,b)=>String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999'))).map(t=>`<div class="task"><div class="check"></div><div><div class="taskName">${esc(t.name)}</div><div class="taskMeta">${esc(t.subject||'School')} · ${esc(t.type||'Task')}${t.dueDate?' · '+esc(t.dueDate):''}</div></div></div>`).join(''):'<div class="empty">No schoolwork yet.</div>';
      container.querySelectorAll('.subjectCard').forEach(b=>b.onclick=()=>this.showSubject(b.dataset.subject));
    },
    showSubject(subject){
      const matching=tasks().filter(t=>String(t.subject||'').toLowerCase()===subject.toLowerCase());
      const backdrop=document.createElement('div'); backdrop.className='sheetBackdrop';
      backdrop.innerHTML=`<div class="sheet"><button class="sheetClose">×</button><h2>${esc(subject)}</h2><p>${matching.length} task${matching.length===1?'':'s'}</p><div>${matching.length?matching.map(t=>`<div class="task"><div class="check"></div><div><div class="taskName">${esc(t.name)}</div><div class="taskMeta">${esc(t.dueDate||'No due date')} · ${esc(t.type||'Task')}</div></div></div>`).join(''):'<div class="empty">No tasks for this subject.</div>'}</div></div>`;
      document.body.appendChild(backdrop);
      backdrop.onclick=e=>{if(e.target===backdrop||e.target.classList.contains('sheetClose'))backdrop.remove();};
    }
  };
})();
