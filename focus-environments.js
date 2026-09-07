// ========================================
// Focus Space environments
// ========================================
(function(){
  const KEY='plannerData';
  const read=()=>window.plannerData||JSON.parse(localStorage.getItem(KEY)||'{}');
  const save=d=>{window.plannerData=d;localStorage.setItem(KEY,JSON.stringify(d));};
  const envs=[
    {id:'cozy',name:'Cozy desk',emoji:'🕯️',class:'focus-env-cozy',desc:'Warm, quiet and comfortable.'},
    {id:'nature',name:'Forest',emoji:'🌿',class:'focus-env-nature',desc:'A calm natural atmosphere.'},
    {id:'night',name:'Night study',emoji:'🌙',class:'focus-env-night',desc:'Quiet late-night concentration.'},
    {id:'cafe',name:'Café',emoji:'☕',class:'focus-env-cafe',desc:'Gentle café energy.'},
    {id:'minimal',name:'Minimal',emoji:'▫️',class:'focus-env-minimal',desc:'Clean and distraction-light.'}
  ];
  function render(){
    const page=document.getElementById('focusPage')||document.getElementById('focusSpacePage'); if(!page)return;
    const host=document.getElementById('focusEnvironmentControls')||document.createElement('section');
    host.id='focusEnvironmentControls';host.className='focus-environment-controls';
    if(!host.parentNode)page.appendChild(host);
    const d=read();d.focusSettings=d.focusSettings||{};const selected=d.focusSettings.environment||'cozy';
    host.innerHTML=`<div><h3>Choose your environment</h3><p>Set the atmosphere before you begin.</p></div><div class="focus-environment-grid">${envs.map(e=>`<button class="focus-environment-card ${selected===e.id?'selected':''}" data-env="${e.id}"><span class="focus-environment-icon">${e.emoji}</span><span><strong>${e.name}</strong><small>${e.desc}</small></span></button>`).join('')}</div>`;
    host.querySelectorAll('[data-env]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.env;const x=read();x.focusSettings=x.focusSettings||{};x.focusSettings.environment=id;save(x);apply(id);render();}));
    apply(selected);
  }
  function apply(id){
    const e=envs.find(x=>x.id===id)||envs[0];
    document.documentElement.dataset.focusEnvironment=e.id;
  }
  window.FocusEnvironments={render,apply,list:()=>envs.slice()};
  document.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#focus')render();});
  window.addEventListener('hashchange',()=>{if(location.hash==='#focus')render();});
})();
