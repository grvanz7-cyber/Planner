// Grades linking helper
(function(){
  function taskOptions(){return (plannerData.tasks||[]).filter(t=>['assignment','quiz','test','exam','lab'].includes(String(t.type||'').toLowerCase())||((t.tags||[]).some(x=>String(x).toLowerCase()==='#school')));}
  window.populateGradeTaskLinks=function(select){if(!select)return;select.innerHTML='<option value="">New / not linked to schoolwork</option>';taskOptions().forEach(t=>{const o=document.createElement('option');o.value=String(t.id);o.textContent=`${t.subject||'No subject'} — ${t.name||'Untitled'} (${t.type||'Task'})`;o.dataset.name=t.name||'';o.dataset.subject=t.subject||'';o.dataset.type=t.type||'';select.appendChild(o);});};
})();