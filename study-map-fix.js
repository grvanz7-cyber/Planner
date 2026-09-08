// ========================================
// STUDY MAP NAVIGATION FIX
// ========================================
(function(){
  function openStudyMap(){
    const page=document.getElementById('study-mapPage');
    if(!page){
      if(typeof window.renderRoadmapCore==='function'){
        try{window.renderRoadmapCore();}catch(error){console.error('Study Map setup error:',error);}
      }
    }

    const target=document.getElementById('study-mapPage');
    if(!target)return false;

    document.querySelectorAll('.main > div').forEach(el=>{
      el.classList.add('page-hidden');
      el.style.display='none';
    });

    target.classList.remove('page-hidden');
    target.style.display='';

    document.querySelectorAll('.nav-item').forEach(item=>{
      item.classList.toggle('active',item.dataset.page==='study-map');
    });

    if(typeof window.renderStudyMap==='function'){
      try{window.renderStudyMap();}catch(error){console.error('Study Map render error:',error);}
    }

    history.replaceState(null,'','#study-map');
    return false;
  }

  window.openStudyMap=openStudyMap;

  function wire(){
    document.querySelectorAll('.sidebar .nav-item[data-page="study-map"]').forEach(item=>{
      item.onclick=function(event){
        event.preventDefault();
        event.stopPropagation();
        return openStudyMap();
      };
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);
  else wire();
})();
