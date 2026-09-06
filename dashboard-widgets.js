// ========================================
// DASHBOARD WIDGET SYSTEM
// ========================================
(function installDashboardWidgets(){
    const STORAGE_KEY='plannerDashboardWidgets';
    const DEFAULTS=[
        {id:'today',label:'Today',visible:true,size:'medium'},
        {id:'upcoming',label:'Upcoming',visible:true,size:'medium'},
        {id:'stats',label:'Overview',visible:true,size:'small'},
        {id:'school',label:'School Overview',visible:true,size:'medium'},
        {id:'subjects',label:'Subject Snapshot',visible:true,size:'medium'},
        {id:'study-load',label:'Study Load',visible:true,size:'medium'}
    ];
    const SIZES=['small','medium','large'];
    let moveMode=false;
    let dragged=null;
    let placeholder=null;
    let dragPointer=null;

    function getConfig(){
        try{
            const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
            if(!Array.isArray(saved))return DEFAULTS.map(x=>({...x}));
            return DEFAULTS.map(def=>{
                const found=saved.find(x=>x&&x.id===def.id);
                return found?{...def,visible:found.visible!==false,size:SIZES.includes(found.size)?found.size:def.size}:{...def};
            }).sort((a,b)=>{
                const ai=saved.findIndex(x=>x&&x.id===a.id),bi=saved.findIndex(x=>x&&x.id===b.id);
                return(ai<0?999:ai)-(bi<0?999:bi);
            });
        }catch(e){return DEFAULTS.map(x=>({...x}));}
    }
    function saveConfig(config){localStorage.setItem(STORAGE_KEY,JSON.stringify(config));}
    function widgetElements(){
        const dashboard=document.querySelector('#dashboardPage');if(!dashboard)return{};
        return{today:dashboard.querySelector('.today-tasks')?.closest('.card'),upcoming:dashboard.querySelector('.upcoming-tasks')?.closest('.card'),stats:dashboard.querySelector('#dashboardStatsCard'),school:dashboard.querySelector('#dashboardSchoolWidget'),subjects:dashboard.querySelector('#dashboardSubjectSnapshotWidget'),'study-load':dashboard.querySelector('#dashboardStudyLoadWidget')};
    }
    function applySize(node,size){
        const value=SIZES.includes(size)?size:'medium';
        node.dataset.widgetSize=value;
        node.classList.remove('dashboard-widget-small','dashboard-widget-medium','dashboard-widget-large');
        node.classList.add('dashboard-widget-'+value);
    }
    function ensureWidgetControls(node,item){
        let del=node.querySelector(':scope > .dashboard-widget-delete');
        if(!del){
            del=document.createElement('button');del.type='button';del.className='dashboard-widget-delete';del.textContent='×';del.title='Remove widget';del.setAttribute('aria-label','Remove '+item.label+' widget');
            del.addEventListener('pointerdown',e=>e.stopPropagation());del.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();removeWidget(item.id);});node.appendChild(del);
        }
        let handle=node.querySelector(':scope > .dashboard-widget-resize-handle');
        if(!handle){
            handle=document.createElement('div');handle.className='dashboard-widget-resize-handle';handle.title='Drag to resize';handle.setAttribute('aria-label','Resize '+item.label+' widget');node.appendChild(handle);installResizeHandle(handle,node,item.id);
        }
        del.style.display=moveMode?'flex':'none';handle.style.display=moveMode?'block':'none';
    }
    function applyLayout(){
        const config=getConfig(),elements=widgetElements(),grid=document.querySelector('#dashboardPage .dashboard-grid');if(!grid)return;
        config.forEach(item=>{const node=elements[item.id];if(!node)return;node.classList.toggle('dashboard-widget-hidden',!item.visible);node.dataset.widgetId=item.id;node.classList.toggle('dashboard-widget-editing',moveMode);applySize(node,item.size);ensureWidgetControls(node,item);});
        if(!dragged)config.forEach(item=>{const node=elements[item.id];if(node)grid.appendChild(node);});
        updateMoveButton();updateAddButton();
    }
    function removeWidget(id){const config=getConfig(),item=config.find(x=>x.id===id);if(!item)return;item.visible=false;saveConfig(config);applyLayout();}
    function addWidget(id){const config=getConfig(),item=config.find(x=>x.id===id);if(!item)return;item.visible=true;saveConfig(config);applyLayout();}
    function updateMoveButton(){const b=document.querySelector('#dashboardMoveToggle');if(!b)return;b.classList.toggle('active',moveMode);b.setAttribute('aria-pressed',String(moveMode));const t=b.querySelector('.dashboard-toggle-text');if(t)t.textContent=moveMode?'Done moving':'Move widgets';}
    function updateAddButton(){
        const b=document.querySelector('#dashboardAddWidgetButton'),p=document.querySelector('#dashboardAddWidgetPopover');if(!b||!p)return;const hidden=getConfig().filter(x=>!x.visible);b.disabled=!hidden.length;p.innerHTML='';
        if(!hidden.length){const e=document.createElement('div');e.className='dashboard-add-empty';e.textContent='All widgets are already on your dashboard.';p.appendChild(e);return;}
        hidden.forEach(item=>{const o=document.createElement('button');o.type='button';o.className='dashboard-add-option';o.textContent='+ '+item.label;o.addEventListener('click',()=>{addWidget(item.id);p.classList.remove('open');});p.appendChild(o);});
    }
    function addButton(){
        const header=document.querySelector('#dashboardPage .header');if(!header||document.querySelector('#dashboardWidgetControls'))return;
        const controls=document.createElement('div');controls.id='dashboardWidgetControls';controls.className='dashboard-widget-controls';controls.innerHTML='<div class="dashboard-add-widget-wrap"><button type="button" id="dashboardAddWidgetButton" class="dashboard-widget-action">+ Add</button><div id="dashboardAddWidgetPopover" class="dashboard-add-widget-popover" role="menu"></div></div><button type="button" id="dashboardMoveToggle" class="dashboard-move-toggle" aria-pressed="false"><span class="dashboard-toggle-track"><span class="dashboard-toggle-thumb"></span></span><span class="dashboard-toggle-text">Move widgets</span></button>';header.appendChild(controls);
        controls.querySelector('#dashboardMoveToggle').addEventListener('click',()=>{moveMode=!moveMode;cancelDrag();applyLayout();});
        const add=controls.querySelector('#dashboardAddWidgetButton'),pop=controls.querySelector('#dashboardAddWidgetPopover');
        add.addEventListener('click',e=>{e.stopPropagation();updateAddButton();if(!add.disabled)pop.classList.toggle('open');});
        document.addEventListener('click',e=>{if(!e.target.closest('.dashboard-add-widget-wrap'))pop.classList.remove('open');});
    }
    function setWidgetSize(id,size){if(!SIZES.includes(size))return;const config=getConfig(),item=config.find(x=>x.id===id);if(!item)return;item.size=size;saveConfig(config);const node=widgetElements()[id];if(node)applySize(node,size);}
    function installResizeHandle(handle,node,id){
        let startX=0,startY=0,startIndex=1,resizing=false;
        const move=e=>{if(!resizing)return;const distance=Math.max(e.clientX-startX,e.clientY-startY);let i=startIndex;if(distance>45)i=Math.min(2,startIndex+1);else if(distance<-45)i=Math.max(0,startIndex-1);node.dataset.previewSize=SIZES[i];applySize(node,SIZES[i]);};
        const finish=()=>{if(!resizing)return;resizing=false;node.classList.remove('dashboard-widget-resizing');setWidgetSize(id,node.dataset.previewSize||SIZES[startIndex]);delete node.dataset.previewSize;window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish);};
        handle.addEventListener('pointerdown',e=>{if(!moveMode)return;e.preventDefault();e.stopPropagation();const current=getConfig().find(x=>x.id===id)?.size||'medium';startIndex=Math.max(0,SIZES.indexOf(current));startX=e.clientX;startY=e.clientY;resizing=true;node.classList.add('dashboard-widget-resizing');window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);});
    }
    function installDirectDrag(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');if(!grid||grid.__widgetPointerDragInstalled)return;grid.__widgetPointerDragInstalled=true;
        grid.addEventListener('pointerdown',event=>{
            if(!moveMode||event.button!==0)return;const node=event.target.closest('[data-widget-id]');if(!node||!grid.contains(node)||event.target.closest('button,input,select,a,.dashboard-widget-resize-handle'))return;
            dragged=node;dragPointer={x:event.clientX,y:event.clientY,offsetX:event.clientX-node.getBoundingClientRect().left,offsetY:event.clientY-node.getBoundingClientRect().top,moved:false};
            const rect=node.getBoundingClientRect();placeholder=document.createElement('div');placeholder.className='dashboard-widget-placeholder';placeholder.style.height=rect.height+'px';placeholder.style.gridColumn=getComputedStyle(node).gridColumn;node.parentNode.insertBefore(placeholder,node);node.classList.add('dashboard-widget-dragging');event.preventDefault();
            const move=e=>{if(!dragged)return;const dx=e.clientX-dragPointer.x,dy=e.clientY-dragPointer.y;if(!dragPointer.moved&&Math.abs(dx)+Math.abs(dy)<6)return;dragPointer.moved=true;dragged.style.position='fixed';dragged.style.width=rect.width+'px';dragged.style.left=(e.clientX-dragPointer.offsetX)+'px';dragged.style.top=(e.clientY-dragPointer.offsetY)+'px';dragged.style.zIndex='1000';dragged.style.pointerEvents='none';const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-widget-id]');if(!target||target===dragged||target.classList.contains('dashboard-widget-hidden'))return;const r=target.getBoundingClientRect();if(e.clientY<r.top+r.height/2){if(placeholder.nextSibling!==target)grid.insertBefore(placeholder,target);}else if(target.nextSibling!==placeholder)grid.insertBefore(placeholder,target.nextSibling);};
            const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(!dragged)return;if(placeholder?.parentNode)placeholder.parentNode.insertBefore(dragged,placeholder);dragged.style.position='';dragged.style.width='';dragged.style.left='';dragged.style.top='';dragged.style.zIndex='';dragged.style.pointerEvents='';dragged.classList.remove('dashboard-widget-dragging');if(placeholder?.parentNode)placeholder.parentNode.removeChild(placeholder);placeholder=null;if(dragPointer.moved){const order=[...grid.querySelectorAll('[data-widget-id]')].map(n=>n.dataset.widgetId),config=getConfig();config.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));saveConfig(config);}dragged=null;dragPointer=null;applyLayout();};
            window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
        });
    }
    function cancelDrag(){if(dragged){if(placeholder?.parentNode)placeholder.parentNode.insertBefore(dragged,placeholder);dragged.style.position='';dragged.style.width='';dragged.style.left='';dragged.style.top='';dragged.style.zIndex='';dragged.style.pointerEvents='';dragged.classList.remove('dashboard-widget-dragging');}if(placeholder?.parentNode)placeholder.parentNode.removeChild(placeholder);dragged=null;placeholder=null;dragPointer=null;}
    function boot(){addButton();applyLayout();installDirectDrag();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});window.addEventListener('load',boot,{once:true});document.addEventListener('planner-data-changed',applyLayout);document.addEventListener('dashboard-widget-added',()=>{applyLayout();installDirectDrag();});
})();
