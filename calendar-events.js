// ========================================
// CALENDAR EVENTS
// ========================================
(function(){
  let editingEventId=null;
  function ensure(){if(!plannerData.events)plannerData.events=[];}
  function el(id){return document.getElementById(id);}
  function ensureModal(){
    if(el('eventModal'))return;
    const wrap=document.createElement('div');wrap.className='modal-overlay';wrap.id='eventModal';
    wrap.innerHTML=`<div class="modal"><div class="modal-header"><h2 id="eventModalTitle">New Event</h2><button class="close-button" type="button" id="eventClose">×</button></div><div class="form-group"><label for="eventName">Event name</label><input id="eventName" type="text" placeholder="e.g. Doctor's appointment"></div><div class="form-row"><div class="form-group"><label for="eventDate">Start date</label><input id="eventDate" type="date"></div><div class="form-group"><label for="eventEndDate">End date</label><input id="eventEndDate" type="date"></div></div><div class="form-group"><label for="eventTime">Time</label><input id="eventTime" type="time"></div><div class="form-group"><label for="eventNotes">Notes</label><textarea id="eventNotes" rows="3" placeholder="Optional notes..."></textarea></div><div class="form-group"><label for="eventColour">Colour</label><input id="eventColour" type="color" value="#7c3aed"></div><div class="modal-actions"><button class="cancel-button" type="button" id="eventCancel">Cancel</button><button class="cancel-button" type="button" id="eventDelete" style="display:none">Delete</button><button class="save-button" type="button" id="eventSave">Save Event</button></div></div>`;
    document.body.appendChild(wrap);
    el('eventClose').onclick=close;el('eventCancel').onclick=close;el('eventSave').onclick=save;el('eventDelete').onclick=remove;
    el('eventDate').addEventListener('change',()=>{const end=el('eventEndDate');if(end&&!end.value)end.value=el('eventDate').value;});
    wrap.addEventListener('click',e=>{if(e.target===wrap)close();});
  }
  function open(eventId=null,date=null){
    ensure();ensureModal();editingEventId=eventId;
    const event=eventId?plannerData.events.find(e=>String(e.id)===String(eventId)):null;
    el('eventModalTitle').textContent=event?'Edit Event':'New Event';el('eventName').value=event?.name||'';el('eventDate').value=event?.date||date||'';el('eventEndDate').value=event?.endDate||event?.date||date||'';el('eventTime').value=event?.time||'';el('eventNotes').value=event?.notes||'';el('eventColour').value=event?.colour||'#7c3aed';el('eventDelete').style.display=event?'':'none';el('eventModal').classList.add('open');el('eventName').focus();
  }
  function close(){if(el('eventModal'))el('eventModal').classList.remove('open');editingEventId=null;}
  function save(){
    const name=el('eventName').value.trim(),date=el('eventDate').value,endDate=el('eventEndDate').value||date;
    if(!name){alert('Please enter an event name.');el('eventName').focus();return;}if(!date){alert('Please choose a start date.');return;}if(endDate<date){alert('End date cannot be before the start date.');return;}
    ensure();const data={name,date,endDate,time:el('eventTime').value||'',notes:el('eventNotes').value.trim(),colour:el('eventColour').value||'#7c3aed'};
    if(editingEventId){const e=plannerData.events.find(x=>String(x.id)===String(editingEventId));if(e)Object.assign(e,data);}else plannerData.events.push({id:'E-'+Date.now(),...data,createdAt:new Date().toISOString()});
    savePlannerData();close();renderCalendar();
  }
  function remove(){if(!editingEventId)return;if(!confirm('Delete this event?'))return;plannerData.events=plannerData.events.filter(e=>String(e.id)!==String(editingEventId));savePlannerData();close();renderCalendar();}
  function install(){
    ensure();ensureModal();
    if(!document.querySelector('#calendarAddEvent')){const bar=document.querySelector('.calendar-month-bar');if(bar){const b=document.createElement('button');b.id='calendarAddEvent';b.className='save-button';b.textContent='+ Add Event';b.onclick=()=>{const y=calendarDate.getFullYear(),m=String(calendarDate.getMonth()+1).padStart(2,'0');open(null,`${y}-${m}-01`);};bar.appendChild(b);}}
  }
  window.openEventModal=open;window.closeEventModal=close;window.saveEvent=save;window.deleteEvent=remove;
  document.addEventListener('DOMContentLoaded',install);window.addEventListener('load',install);setInterval(install,500);
})();
