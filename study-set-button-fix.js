(()=>{
  function openStudySet(){
    if(typeof window.openStudySetModal==='function'){
      window.openStudySetModal();
      return true;
    }
    return false;
  }

  function bind(){
    const button=document.getElementById('studyAddButton');
    if(!button)return;
    button.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      openStudySet();
      return false;
    };
  }

  bind();
  window.addEventListener('load',bind);
  window.addEventListener('hashchange',bind);
  window.addEventListener('planner-data-changed',bind);

  document.addEventListener('click',function(e){
    const button=e.target?.closest?.('#studyAddButton');
    if(!button)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openStudySet();
  },true);
})();
