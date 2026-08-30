// ========================================
// CALENDAR EVENTS
// ========================================
(function(){
  let editingEventId=null;
  function ensure(){
    if(!plannerData.events) plannerData.events=[];
  }
  function el(id){return document.getElementById(id);}
  function open(eventId=null,date=null){
    ensure(); editingEventId=eventId;
    const event=eventId?plannerData.events.find(e=>String(e.id)===String(eventId)):null;
    el('eventModalTitle').textContent=event?'Edit Event':'New Event';
    el('eventName').value=event?.name||'';
    el('eventDate').value=event?.date||date||'';
    el('eventTime').value=event?.time||'';
    el('eventNotes').value=event?.notes||'';
    el('eventColour').value=event?.colour||'#7c3aed';
    el('eventDelete').style.display=event?'':'none';
    el('eventModal').classList.add('open');
    el('eventName').focus();
  }
  function close(){el('eventModal').classList.remove('open');editingEventId=null;}
  function save(){
    const name=el('eventName').value.trim(),date=el('eventDate').value;
    if(!name){alert('Please enter an event name.');el('eventName').focus();return;}
    if(!date){alert('Please choose a date.');return;}
    ensure();
    const data={name,date,time:el('eventTime').value||'',notes:el('eventNotes').value.trim(),colour:el('eventColour').value||'#7c3aed'};
    if(editingEventId){const e=plannerData.events.find(x=>String(x.id)===String(editingEventId));if(e)Object.assign(e,data);}
    else plannerData.events.push({id:'E-'+Date.now(),...data,createdAt:new Date().toISOString()});
    savePlannerData();close();renderCalendar();
  }
  function remove(){if(!editingEventId)return;if(!confirm('Delete this event?'))return;plannerData.events=plannerData.events.filter(e=>String(e.id)!==String(editingEventId));savePlannerData();close();renderCalendar();}
  function install(){
    ensure();
    if(!document.querySelector('#calendarAddEvent')){
      const bar=document.querySelector('.calendar-month-bar');
      if(bar){const b=document.createElement('button');b.id='calendarAddEvent';b.className='save-button';b.textContent='+ Add Event';b.onclick=()=>open(null,calendarDate.toISOString().slice(0,10));bar.appendChild(b);}
    }
  }
  window.openEventModal=open;window.closeEventModal=close;window.saveEvent=save;window.deleteEvent=remove;
  document.addEventListener('DOMContentLoaded',install);window.addEventListener('load',install);setInterval(install,500);
})();
