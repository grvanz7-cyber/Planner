(() => {
  const STORAGE='planner-app-settings';
  const defaults={theme:'system',compact:false,weekStarts:'sunday'};
  const load=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch(e){return {...defaults}}};
  const save=s=>localStorage.setItem(STORAGE,JSON.stringify(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function apply(s=load()){
    document.documentElement.dataset.theme=s.theme;
    document.documentElement.classList.toggle('compact',!!s.compact);
  }

  function render(container){
    const s=load();
    const all=window.PlannerAppData?.getTasks?.()||[];
    const completed=all.filter(t=>t.completed||String(t.status||'').toLowerCase()==='completed').length;
    const active=all.length-completed;
    container.innerHTML=`
      <style>
        .more-menu{display:flex;flex-direction:column;gap:10px}.more-button{width:100%;border:1px solid var(--border);background:var(--bg);color:var(--text);border-radius:16px;padding:14px;text-align:left;display:flex;align-items:center;gap:13px;cursor:pointer}.more-button:active{transform:scale(.985)}.more-button-icon{width:38px;height:38px;border-radius:12px;background:var(--soft);display:grid;place-items:center;font-size:20px}.more-button-main{flex:1}.more-button-main strong{display:block;font-size:14px}.more-button-main small{display:block;color:var(--muted);font-size:11px;margin-top:3px}.more-arrow{color:var(--muted);font-size:20px}.more-summary{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.more-stat{background:var(--bg);border-radius:14px;padding:13px;text-align:center}.more-stat strong{display:block;font-size:21px}.more-stat span{font-size:11px;color:var(--muted)}.about{text-align:center;color:var(--muted);font-size:11px;line-height:1.5}
      </style>
      <div class="greeting"><h1>More</h1><p>Settings, tools, and planner information.</p></div>
      <section class="card"><div class="head"><h2>Overview</h2></div><div class="more-summary"><div class="more-stat"><strong>${active}</strong><span>Active tasks</span></div><div class="more-stat"><strong>${completed}</strong><span>Completed</span></div></div></section>
      <section class="card"><div class="head"><h2>Settings</h2></div><div class="more-menu">
        <button class="more-button" data-action="appearance"><span class="more-button-icon">🎨</span><span class="more-button-main"><strong>Appearance</strong><small>Theme and display options</small></span><span class="more-arrow">›</span></button>
        <button class="more-button" data-action="calendar"><span class="more-button-icon">📅</span><span class="more-button-main"><strong>Calendar</strong><small>Choose the start of your week</small></span><span class="more-arrow">›</span></button>
      </div></section>
      <section class="card"><div class="head"><h2>Planner tools</h2></div><div class="more-menu">
        <button class="more-button" data-action="stats"><span class="more-button-icon">📊</span><span class="more-button-main"><strong>Stats</strong><small>See your planner activity</small></span><span class="more-arrow">›</span></button>
        <button class="more-button" data-action="setup"><span class="more-button-icon">⚙️</span><span class="more-button-main"><strong>Setup</strong><small>Subjects, habits, categories and settings</small></span><span class="more-arrow">›</span></button>
      </div></section>
      <section class="card"><div class="about">Planner · App version 1.0<br>Data is stored locally on this device.</div></section>`;

    container.querySelector('[data-action="appearance"]').onclick=()=>settingsSheet('Appearance');
    container.querySelector('[data-action="calendar"]').onclick=()=>settingsSheet('Calendar');
    container.querySelector('[data-action="stats"]').onclick=()=>alert('Stats is coming next.');
    container.querySelector('[data-action="setup"]').onclick=()=>alert('Setup integration is coming next.');
  }

  function settingsSheet(section){
    const s=load();
    const backdrop=document.createElement('div');backdrop.className='school-sheet-backdrop';
    let body='';
    if(section==='Appearance') body=`<label class="setting"><span><strong>Theme</strong><small>Choose how Planner looks</small></span><select id="moreTheme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label class="setting"><span><strong>Compact mode</strong><small>Fit more information on screen</small></span><input id="moreCompact" type="checkbox"></label>`;
    else body=`<label class="setting"><span><strong>Week starts</strong><small>First day shown in weekly views</small></span><select id="moreWeek"><option value="sunday">Sunday</option><option value="monday">Monday</option></select></label>`;
    backdrop.innerHTML=`<section class="school-sheet" role="dialog" aria-modal="true"><div class="school-grab"></div><div class="school-sheet-head"><h2>${esc(section)}</h2><button class="school-sheet-close">×</button></div><div style="margin-top:12px">${body}</div></section>`;
    document.body.appendChild(backdrop);
    if(section==='Appearance'){const theme=backdrop.querySelector('#moreTheme');theme.value=s.theme;const compact=backdrop.querySelector('#moreCompact');compact.checked=s.compact;theme.onchange=e=>{const x=load();x.theme=e.target.value;save(x);apply(x)};compact.onchange=e=>{const x=load();x.compact=e.target.checked;save(x);apply(x)}}
    else {const week=backdrop.querySelector('#moreWeek');week.value=s.weekStarts;week.onchange=e=>{const x=load();x.weekStarts=e.target.value;save(x)}}
    backdrop.onclick=e=>{if(e.target===backdrop||e.target.closest('.school-sheet-close'))backdrop.remove()};
  }

  window.PlannerAppSettings={render,apply};
})();