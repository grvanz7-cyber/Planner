// ========================================
// PLANNER ROADMAP — FULL FEATURE LAYER
// Additive foundations for focus, companion, habits, goals, profiles,
// friends, integrations, smart planning, and productivity intelligence.
// ========================================
(function(){
  const KEY='plannerData';
  const read=()=>window.plannerData||JSON.parse(localStorage.getItem(KEY)||'{}');
  const arr=(o,k)=>Array.isArray(o&&o[k])?o[k]:[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const save=d=>{window.plannerData=d;localStorage.setItem(KEY,JSON.stringify(d));document.dispatchEvent(new CustomEvent('planner-data-changed'));};
  const id=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const activeTasks=d=>arr(d,'tasks').filter(t=>t.status!=='Completed'&&!t.completed).concat(arr(d,'assignments').filter(t=>t.status!=='Completed'&&!t.completed));

  function initData(){
    const d=read();
    d.goals=arr(d,'goals'); d.habits=arr(d,'habits'); d.focusSessions=arr(d,'focusSessions');
    d.pet=d.pet||{name:'Sprout',emoji:'🌱',happiness:70,xp:0,coins:0,level:1};
    d.profile=d.profile||{displayName:'',avatar:'🌿',theme:'Cozy'};
    d.friends=arr(d,'friends'); d.sharedProjects=arr(d,'sharedProjects');
    d.integrations=d.integrations||{googleCalendar:false,edsby:false};
    d.achievements=arr(d,'achievements'); d.dailyQuests=arr(d,'dailyQuests');
    d.rewardLog=arr(d,'rewardLog'); d.smartPlans=arr(d,'smartPlans');
    save(d); return d;
  }

  function focusPage(){return document.getElementById('focusPage')||document.getElementById('focusSpacePage');}
  function addFullScreenButton(){
    const page=focusPage(); if(!page||page.querySelector('#focusFullscreen'))return;
    const b=document.createElement('button');b.id='focusFullscreen';b.className='focus-fullscreen-button secondary-button';b.textContent='⛶ Full-screen focus';
    b.onclick=()=>{document.body.classList.toggle('focus-distraction-free');b.textContent=document.body.classList.contains('focus-distraction-free')?'✕ Exit full-screen':'⛶ Full-screen focus';};
    page.prepend(b);
  }

  function renderGoals(){
    const p=document.getElementById('goalsPage'); if(!p)return;
    let s=p.querySelector('#roadmapGoalsLayer');if(!s){s=document.createElement('section');s.id='roadmapGoalsLayer';s.className='roadmap-feature-section';p.appendChild(s);}
    const d=read(),goals=arr(d,'goals');
    s.innerHTML=`<div class="feature-heading"><div><h2>Goals</h2><p>Keep bigger plans connected to everyday work.</p></div><button class="save-button" id="addRoadmapGoal">+ Goal</button></div><div class="roadmap-feature-grid">${goals.length?goals.map(g=>{const pct=Math.max(0,Math.min(100,Number(g.progress||0)));return `<article class="roadmap-feature-card"><div class="feature-card-top"><span class="feature-icon">${esc(g.emoji||'🎯')}</span><strong>${esc(g.name||'Goal')}</strong></div><p>${esc(g.description||'')}</p><div class="feature-progress"><span style="width:${pct}%"></span></div><small>${pct}% complete${g.targetDate?' · '+esc(g.targetDate):''}</small></article>`}).join(''):'<div class="roadmap-empty">No goals yet.</div>'}</div>`;
    s.querySelector('#addRoadmapGoal').onclick=()=>{const name=prompt('Goal name');if(!name)return;d.goals.push({id:id('G'),name,emoji:'🎯',progress:0,description:'',createdAt:new Date().toISOString()});save(d);renderGoals();};
  }

  function renderHabits(){
    const p=document.getElementById('habitsPage');if(!p)return;
    let s=p.querySelector('#roadmapHabitsLayer');if(!s){s=document.createElement('section');s.id='roadmapHabitsLayer';s.className='roadmap-feature-section';p.appendChild(s);}
    const d=read(),habits=arr(d,'habits');
    s.innerHTML=`<div class="feature-heading"><div><h2>Habit tracker</h2><p>Small actions, tracked without turning them into pressure.</p></div><button class="save-button" id="addRoadmapHabit">+ Habit</button></div><div class="roadmap-feature-grid">${habits.length?habits.map(h=>`<article class="roadmap-feature-card"><div class="feature-card-top"><span class="feature-icon">${esc(h.emoji||'✓')}</span><strong>${esc(h.name||h.habit||'Habit')}</strong></div><p>${esc(h.goal||'Daily habit')}</p><button class="secondary-button habit-check" data-id="${esc(h.id||h.name)}">Mark today</button></article>`).join(''):'<div class="roadmap-empty">No habits yet.</div>'}</div>`;
    s.querySelector('#addRoadmapHabit').onclick=()=>{const name=prompt('Habit name');if(!name)return;d.habits.push({id:id('H'),name,emoji:'✓',goal:'Daily',streak:0,history:[]});save(d);renderHabits();};
    s.querySelectorAll('.habit-check').forEach(b=>b.onclick=()=>{const h=habits.find(x=>String(x.id)===String(b.dataset.id));if(!h)return;const today=new Date().toISOString().slice(0,10);h.history=arr(h,'history');if(!h.history.includes(today)){h.history.push(today);h.streak=Number(h.streak||0)+1;}save(d);renderHabits();});
  }

  function renderProfile(){
    const p=document.getElementById('profilePage');if(!p)return;
    let s=p.querySelector('#roadmapProfileLayer');if(!s){s=document.createElement('section');s.id='roadmapProfileLayer';s.className='roadmap-feature-section';p.appendChild(s);}
    const d=read();s.innerHTML=`<div class="feature-heading"><div><h2>Profile</h2><p>Your planner identity and preferences.</p></div></div><div class="profile-feature"><div class="profile-feature-avatar">${esc(d.profile.avatar||'🌿')}</div><div><strong>${esc(d.profile.displayName||'Your planner')}</strong><p>Theme: ${esc(d.profile.theme||'Cozy')}</p></div></div><div class="roadmap-form-grid"><label>Display name<input id="profileName" value="${esc(d.profile.displayName||'')}"></label><label>Avatar<input id="profileAvatar" value="${esc(d.profile.avatar||'🌿')}"></label></div><button class="save-button" id="saveRoadmapProfile">Save profile</button>`;
    s.querySelector('#saveRoadmapProfile').onclick=()=>{d.profile.displayName=s.querySelector('#profileName').value.trim();d.profile.avatar=s.querySelector('#profileAvatar').value.trim()||'🌿';save(d);renderProfile();};
  }

  function renderFriends(){
    const p=document.getElementById('friendsPage');if(!p)return;
    let s=p.querySelector('#roadmapFriendsLayer');if(!s){s=document.createElement('section');s.id='roadmapFriendsLayer';s.className='roadmap-feature-section';p.appendChild(s);}
    const d=read(),friends=arr(d,'friends');s.innerHTML=`<div class="feature-heading"><div><h2>Friends</h2><p>Foundation for sharing selected planner items.</p></div><button class="save-button" id="addFriend">+ Friend</button></div><div class="roadmap-feature-grid">${friends.length?friends.map(f=>`<article class="roadmap-feature-card"><div class="feature-card-top"><span class="feature-icon">👤</span><strong>${esc(f.name||f.username||'Friend')}</strong></div><small>${esc(f.status||'Connected')}</small></article>`).join(''):'<div class="roadmap-empty">No friends connected yet.</div>'}</div>`;
    s.querySelector('#addFriend').onclick=()=>{const name=prompt('Friend display name');if(!name)return;d.friends.push({id:id('F'),name,status:'Connected',createdAt:new Date().toISOString()});save(d);renderFriends();};
  }

  function renderIntegrations(){
    const p=document.getElementById('integrationsPage');if(!p)return;
    let s=p.querySelector('#roadmapIntegrationsLayer');if(!s){s=document.createElement('section');s.id='roadmapIntegrationsLayer';s.className='roadmap-feature-section';p.appendChild(s);}
    const d=read();s.innerHTML=`<div class="feature-heading"><div><h2>Integrations</h2><p>Connection settings are ready for future provider sync.</p></div></div><div class="roadmap-feature-grid"><article class="roadmap-feature-card"><div class="feature-card-top"><span class="feature-icon">📅</span><strong>Google Calendar</strong></div><p>Import and export events when connected.</p><button class="secondary-button" id="googleIntegration">${d.integrations.googleCalendar?'Connected':'Connect'}</button></article><article class="roadmap-feature-card"><div class="feature-card-top"><span class="feature-icon">🏫</span><strong>Edsby</strong></div><p>Prepare for schoolwork import and matching.</p><button class="secondary-button" id="edsbyIntegration">${d.integrations.edsby?'Connected':'Prepare connection'}</button></article></div>`;
    s.querySelector('#googleIntegration').onclick=()=>{d.integrations.googleCalendar=!d.integrations.googleCalendar;save(d);renderIntegrations();};
    s.querySelector('#edsbyIntegration').onclick=()=>{d.integrations.edsby=!d.integrations.edsby;save(d);renderIntegrations();};
  }

  function renderCompanion(){
    const p=document.getElementById('companionPage');if(!p)return;
    let s=p.querySelector('#roadmapCompanionLayer');if(!s){s=document.createElement('section');s.id='roadmapCompanionLayer';s.className='roadmap-feature-section';p.appendChild(s);}
    const d=read(),pet=d.pet||{};const xp=Number(pet.xp||0),level=Math.max(1,Number(pet.level||1)),need=level*100,pct=Math.min(100,Math.round((xp%need)/need*100));
    s.innerHTML=`<div class="companion-feature"><div class="companion-pet">${esc(pet.emoji||'🌱')}</div><h2>${esc(pet.name||'Sprout')}</h2><p>Level ${level} · ${xp} XP · ${Number(pet.coins||0)} coins</p><div class="feature-progress"><span style="width:${pct}%"></span></div><div class="companion-feature-actions"><button class="save-button" id="feedPet">🌾 Feed</button><button class="secondary-button" id="playPet">🎾 Play</button><button class="secondary-button" id="restPet">🌙 Rest</button></div></div>`;
    const reward=(kind,amount)=>{pet.xp=Number(pet.xp||0)+(kind==='xp'?amount:0);pet.coins=Number(pet.coins||0)+(kind==='coins'?amount:0);while(pet.xp>=Number(pet.level||1)*100){pet.xp-=Number(pet.level||1)*100;pet.level=Number(pet.level||1)+1;}pet.happiness=Math.max(0,Math.min(100,Number(pet.happiness||70)+5));d.pet=pet;save(d);renderCompanion();};
    s.querySelector('#feedPet').onclick=()=>reward('xp',10);s.querySelector('#playPet').onclick=()=>reward('coins',5);s.querySelector('#restPet').onclick=()=>{pet.happiness=Math.min(100,Number(pet.happiness||70)+8);d.pet=pet;save(d);renderCompanion();};
  }

  function renderSmart(){
    const p=document.getElementById('smartPage');if(!p)return;
    let s=p.querySelector('#roadmapSmartLayer');if(!s){s=document.createElement('section');s.id='roadmapSmartLayer';s.className='roadmap-feature-section';p.appendChild(s);}
    const d=read(),tasks=activeTasks(d),now=Date.now();
    const scored=tasks.map(t=>{const due=t.dueDate?new Date(t.dueDate).getTime():Infinity;let score=0;if(due<now)score+=100;if(due-now<86400000)score+=40;score+=(t.priority==='High'?25:t.priority==='Urgent'?45:0);return {...t,smartScore:score};}).sort((a,b)=>b.smartScore-a.smartScore).slice(0,6);
    s.innerHTML=`<div class="feature-heading"><div><h2>Smart planning</h2><p>Turn your current workload into a simple next-action list.</p></div><button class="save-button" id="refreshSmartLayer">Refresh</button></div><div class="roadmap-feature-grid">${scored.length?scored.map(t=>`<article class="roadmap-feature-card"><div class="feature-card-top"><span class="feature-icon">${t.type==='study'?'📚':'✓'}</span><strong>${esc(t.name||t.title||'Task')}</strong></div><small>${esc(t.subject||'General')}${t.dueDate?' · due '+esc(t.dueDate):''}</small><button class="secondary-button smart-open" data-id="${esc(t.id)}">Open tasks</button></article>`).join(''):'<div class="roadmap-empty">Nothing urgent right now.</div>'}</div>`;
    s.querySelector('#refreshSmartLayer').onclick=renderSmart;s.querySelectorAll('.smart-open').forEach(b=>b.onclick=()=>{location.hash='#tasks';});
  }

  function render(){initData();addFullScreenButton();renderGoals();renderHabits();renderProfile();renderFriends();renderIntegrations();renderCompanion();renderSmart();}
  window.PlannerRoadmapBatch={render,initData};
  const boot=()=>render();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  document.addEventListener('planner-data-changed',()=>setTimeout(render,0));
  window.addEventListener('hashchange',()=>setTimeout(render,0));
})();
