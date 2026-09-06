// ========================================
// GRADES ↔ PLANNER SCHOOLWORK LINKING
// ========================================
(function(){
  window.__gradesLinkingLoaded=true;

  function tasks(){
    if(!window.plannerData)return [];
    const main=Array.isArray(plannerData.tasks)?plannerData.tasks:[];
    const extra=[];
    ['assignments','assessments','schoolwork'].forEach(k=>{
      if(Array.isArray(plannerData[k]))extra.push(...plannerData[k]);
    });
    const map=new Map();
    [...main,...extra].forEach(t=>{if(t&&t.id!=null)map.set(String(t.id),t);});
    return [...map.values()];
  }

  function isSchoolwork(t){
    const type=String(t.type||'').toLowerCase();
    const tags=Array.isArray(t.tags)?t.tags.map(x=>String(x).toLowerCase()):[];
    return ['assignment','quiz','test','exam','lab','project','presentation','essay','report','assessment'].includes(type)
      || tags.includes('#school') || tags.includes('school');
  }

  function populate(){
    const select=document.getElementById('gradeTask');
    if(!select)return;
    const current=select.value;
    const list=tasks().filter(isSchoolwork).sort((a,b)=>{
      const ad=String(a.dueDate||a.date||a.createdAt||'9999');
      const bd=String(b.dueDate||b.date||b.createdAt||'9999');
      return bd.localeCompare(ad);
    });
    const options=[['','New / not linked to schoolwork']];
    list.forEach(t=>options.push([String(t.id),`${t.subject||'No subject'} — ${t.name||'Untitled'} (${t.type||'Task'})`,t.name||'',t.subject||'',t.type||'']));
    const signature=options.map(o=>o.slice(0,2).join('|')).join('||');
    if(select.dataset.gradesLinkSignature!==signature){
      select.innerHTML='';
      options.forEach(o=>{const option=document.createElement('option');option.value=o[0];option.textContent=o[1];if(o[0]){option.dataset.name=o[2];option.dataset.subject=o[3];option.dataset.type=o[4];}select.appendChild(option);});
      select.dataset.gradesLinkSignature=signature;
    }
    if([...select.options].some(o=>o.value===current))select.value=current;
  }

  function link(){
    const option=document.getElementById('gradeTask')?.selectedOptions?.[0];
    if(!option?.value)return;
    const name=document.getElementById('gradeName');
    const subject=document.getElementById('gradeSubject');
    const type=document.getElementById('gradeType');
    if(name)name.value=option.dataset.name||'';
    if(subject){const wanted=option.dataset.subject||'';const match=[...subject.options].find(o=>o.value===wanted||o.textContent.trim().endsWith(wanted));if(match)subject.value=match.value;}
    if(type){const wanted=String(option.dataset.type||'').toLowerCase();const match=[...type.options].find(o=>String(o.value).toLowerCase()===wanted);if(match)type.value=match.value;}
  }

  function openForTask(id){
    if(typeof window.openGradeModal!=='function')return;
    window.openGradeModal();
    const select=document.getElementById('gradeTask');
    if(select){select.value=String(id);link();}
  }

  function addRecordButtons(){
    document.querySelectorAll('.assignment-row,.assessment-row').forEach(row=>{
      if(row.querySelector('.record-grade-button'))return;
      const idMatch=row.onclick?.toString().match(/openEditTaskModal\(([^)]+)\)/);
      if(!idMatch)return;
      const id=idMatch[1];
      const button=document.createElement('button');button.type='button';button.className='record-grade-button';button.textContent='Record Grade';
      button.style.cssText='margin-left:auto;padding:7px 11px;border:1px solid var(--border-color,#ddd);border-radius:9px;background:var(--card-bg,#fff);cursor:pointer;font:inherit;font-size:12px;white-space:nowrap;';
      button.onclick=e=>{e.stopPropagation();openForTask(id);};row.appendChild(button);
    });
  }

  function patch(){populate();addRecordButtons();}
  window.refreshGradeLinks=patch;

  function install(){
    patch();
    const select=document.getElementById('gradeTask');
    if(select&&!select.dataset.gradesLinkingBound){select.dataset.gradesLinkingBound='true';select.addEventListener('change',link);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',install);
})();
