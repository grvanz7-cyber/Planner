(() => {
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function save(task){
    const list=window.PlannerAppData?.getTasks?.()||[];
    list.push(task);
    localStorage.setItem('plannerTasks',JSON.stringify(list));
    try{const d=JSON.parse(localStorage.getItem('plannerData')||'null');if(d&&typeof d==='object'){d.tasks=list;localStorage.setItem('plannerData',JSON.stringify(d));}}catch(e){}
    window.PlannerAppData?.refresh?.();
  }
  function open(){
    if(document.getElementById('addSheet'))return;
    const today=new Date().toISOString().slice(0,10);
    const sheet=document.createElement('div'); sheet.id='addSheet'; sheet.className='add-sheet';
    sheet.innerHTML=`<div class="add-backdrop"></div><section class="add-panel" role="dialog" aria-modal="true" aria-label="Add item">
      <div class="add-grab"></div><div class="add-head"><h2>Add to Planner</h2><button class="add-close" aria-label="Close">×</button></div>
      <div class="add-type"><button class="selected" data-type="task">Task</button><button data-type="event">Event</button><button data-type="note">Note</button></div>
      <label class="add-field"><span>Name</span><input id="addName" placeholder="What do you need to add?" autocomplete="off"></label>
      <label class="add-field"><span>Date</span><input id="addDate" type="date" value="${today}"></label>
      <label class="add-field"><span>Priority</span><select id="addPriority"><option>Normal</option><option>Low</option><option>High</option></select></label>
      <button class="add-save">Add item</button>
    </section>`;
    document.body.appendChild(sheet);
    let type='task';
    sheet.querySelectorAll('.add-type button').forEach(b=>b.onclick=()=>{type=b.dataset.type;sheet.querySelectorAll('.add-type button').forEach(x=>x.classList.toggle('selected',x===b));});
    const close=()=>sheet.remove(); sheet.querySelector('.add-close').onclick=close; sheet.querySelector('.add-backdrop').onclick=close;
    sheet.querySelector('.add-save').onclick=()=>{
      const name=sheet.querySelector('#addName').value.trim(); if(!name){sheet.querySelector('#addName').focus();return;}
      const task={id:'T-'+Date.now(),name,type,dueDate:sheet.querySelector('#addDate').value,priority:sheet.querySelector('#addPriority').value,completed:false,status:'Not Started',source:'App'};
      save(task); close();
      const active=document.querySelector('.bottom button.active')?.dataset.view||'today';
      window.PlannerAppNavigation?.render?.(active);
      if(window.PlannerMobileUI){const c=document.getElementById('content');if(active==='today')window.PlannerMobileUI.renderToday(c);if(active==='tasks')window.PlannerMobileUI.renderTasks(c);}
    };
    setTimeout(()=>sheet.querySelector('#addName').focus(),50);
  }
  window.PlannerAppAdd={open};
})();
