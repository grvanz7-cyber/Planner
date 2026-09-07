// ========================================
// STUDY UNIT LINKING
// Adds roadmap-linked unit choices to the existing Study Set modal.
// Does not replace or modify the New Study Set button or save handler.
// ========================================
(function(){
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function subjects(){return (data().settings?.subjects||[]).filter(s=>s&&s.active!==false);}
  function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
  function getUnits(subject){
    try{
      if(window.SubjectRoadmap&&typeof window.SubjectRoadmap.get==='function'){
        const units=window.SubjectRoadmap.get(subject);
        if(Array.isArray(units))return units;
      }
    }catch(e){}
    const s=subjects().find(x=>String(x.name)===String(subject));
    return Array.isArray(s?.units)?s.units:[];
  }
  function enhance(){
    const modal=document.getElementById('studySetModal');
    const subject=document.getElementById('studySetSubject');
    const old=document.getElementById('studySetUnit');
    if(!modal||!subject||!old)return;
    let select=old;
    if(old.tagName!=='SELECT'){
      select=document.createElement('select');
      select.id='studySetUnit';
      old.replaceWith(select);
      const label=select.parentElement?.querySelector('label');
      if(label)label.innerHTML='Unit / topic <span class="field-hint">optional</span>';
    }
    function populate(){
      const current=select.value;
      const units=getUnits(subject.value);
      select.innerHTML='<option value="">No unit / topic</option>'+units.map(u=>{
        const name=typeof u==='string'?u:(u?.name||'');
        return name?`<option value="${esc(name)}">${esc(name)}</option>`:'';
      }).join('');
      if(current && [...select.options].some(o=>o.value===current))select.value=current;
    }
    if(!select.dataset.studyUnitLinked){
      subject.addEventListener('change',populate);
      select.dataset.studyUnitLinked='true';
    }
    populate();
  }
  function watchForModal(e){
    if(e.target?.closest?.('#studyAddButton'))setTimeout(enhance,0);
  }
  document.addEventListener('click',watchForModal);
  document.addEventListener('DOMContentLoaded',enhance);
  window.addEventListener('load',enhance);
  window.addEventListener('planner-data-changed',enhance);
})();
