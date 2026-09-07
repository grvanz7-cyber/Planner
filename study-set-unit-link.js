// ========================================
// STUDY SET UNIT LINKING
// Enhances the stable New Study Set modal without replacing its save/button logic.
// ========================================
(function(){
  function data(){return (typeof plannerData!=='undefined'&&plannerData)||window.plannerData||{};}
  function el(id){return document.getElementById(id);}

  function getUnits(subject){
    if(!subject)return [];
    if(window.SubjectRoadmap&&typeof window.SubjectRoadmap.get==='function'){
      const units=window.SubjectRoadmap.get(subject);
      if(Array.isArray(units))return units;
    }
    const s=(data().settings?.subjects||[]).find(x=>String(x?.name).toLowerCase()===String(subject).toLowerCase());
    return Array.isArray(s?.roadmap)?s.roadmap:[];
  }

  function enhance(){
    const subject=el('studyFixSubject');
    const unit=el('studyFixUnit');
    if(!subject||!unit)return false;

    if(unit.tagName!=='SELECT'){
      const select=document.createElement('select');
      select.id='studyFixUnit';
      select.name=unit.name||'';
      select.className=unit.className||'';
      unit.replaceWith(select);
    }

    const select=el('studyFixUnit');
    const current=select.value;
    const units=getUnits(subject.value);
    select.innerHTML='<option value="">No unit / topic</option>';
    units.forEach((u,index)=>{
      if(!u)return;
      const option=document.createElement('option');
      option.value=String(u.name||'').trim();
      option.textContent=`Unit ${index+1} · ${u.name||'Untitled unit'}`;
      select.appendChild(option);
    });
    if(current&&[...select.options].some(o=>o.value===current))select.value=current;
    else select.value='';

    if(!subject.dataset.studyUnitLinked){
      subject.dataset.studyUnitLinked='true';
      subject.addEventListener('change',()=>enhance());
    }
    return true;
  }

  function wire(){
    const button=el('studyAddButton');
    if(!button||button.dataset.studyUnitLinkListener)return;
    button.dataset.studyUnitLinkListener='true';
    button.addEventListener('click',()=>setTimeout(enhance,0));
  }

  function init(){wire();setTimeout(wire,250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
  window.addEventListener('load',init);
})();
