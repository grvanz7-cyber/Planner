(() => {
  const STORAGE = 'planner-app-settings';
  const defaults = { theme: 'system', compact: false, weekStarts: 'sunday' };
  function load(){ try { return {...defaults, ...JSON.parse(localStorage.getItem(STORAGE)||'{}')}; } catch(e){ return {...defaults}; } }
  function save(s){ localStorage.setItem(STORAGE, JSON.stringify(s)); }
  function esc(v){ return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  window.PlannerAppSettings = {
    render(container){
      const s=load();
      container.innerHTML=`<div class="greeting"><h1>More</h1><p>Settings and planner tools.</p></div>
      <section class="card"><div class="head"><h2>Appearance</h2></div>
        <label class="setting"><span><strong>Theme</strong><small>Choose how Planner looks</small></span><select id="theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        <label class="setting"><span><strong>Compact mode</strong><small>Fit more information on screen</small></span><input id="compact" type="checkbox"></label>
      </section>
      <section class="card"><div class="head"><h2>Calendar</h2></div>
        <label class="setting"><span><strong>Week starts</strong><small>First day shown in weekly views</small></span><select id="weekStarts"><option value="sunday">Sunday</option><option value="monday">Monday</option></select></label>
      </section>
      <section class="card"><div class="head"><h2>Planner</h2></div>
        <div class="quick"><div class="quick-icon">📊</div><div class="quick-main"><div class="quick-title">Stats</div><div class="quick-sub">Progress and activity</div></div></div>
        <div class="quick"><div class="quick-icon">⚙️</div><div class="quick-main"><div class="quick-title">Setup</div><div class="quick-sub">Subjects, habits and categories</div></div></div>
      </section>`;
      container.querySelector('#theme').value=s.theme;
      container.querySelector('#compact').checked=s.compact;
      container.querySelector('#weekStarts').value=s.weekStarts;
      container.querySelector('#theme').onchange=e=>{const x=load();x.theme=e.target.value;save(x);this.apply(x);};
      container.querySelector('#compact').onchange=e=>{const x=load();x.compact=e.target.checked;save(x);this.apply(x);};
      container.querySelector('#weekStarts').onchange=e=>{const x=load();x.weekStarts=e.target.value;save(x);};
      this.apply(s);
    },
    apply(s=load()){
      document.documentElement.dataset.theme=s.theme;
      document.documentElement.classList.toggle('compact',!!s.compact);
    }
  };
})();
