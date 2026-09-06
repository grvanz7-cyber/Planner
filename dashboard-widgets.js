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
    let dragMoveHandler=null;
    let dragUpHandler=null;

    function getConfig(){
        try{
            const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
            if(!Array.isArray(saved))return DEFAULTS.map(x=>({...x}));
            return DEFAULTS.map(def=>{
                const found=saved.find(x=>x&&x.id===def.id);
                return found?{...def,visible:found.visible!==false,size:SIZES.includes(found.size)?found.size:def.size,orientation:found.orientation==='vertical'?'vertical':'horizontal'}:{...def};
            }).sort((a,b)=>{
                const ai=saved.findIndex(x=>x&&x.id===a.id),bi=saved.findIndex(x=>x&&x.id===b.id);
                return(ai<0?999:ai)-(bi<0?999:bi);
            });
        }catch(e){return DEFAULTS.map(x=>({...x}));}
    }

    function saveConfig(config){localStorage.setItem(STORAGE_KEY,JSON.stringify(config));}

    function widgetElements(){
        const dashboard=document.querySelector('#dashboardPage');
        if(!dashboard)return{};
        return{
            today:dashboard.querySelector('.today-tasks')?.closest('.card'),
            upcoming:dashboard.querySelector('.upcoming-tasks')?.closest('.card'),
            stats:dashboard.querySelector('#dashboardStatsCard'),
            school:dashboard.querySelector('#dashboardSchoolWidget'),
            subjects:dashboard.querySelector('#dashboardSubjectSnapshotWidget'),
            'study-load':dashboard.querySelector('#dashboardStudyLoadWidget')
        };
    }

    function applySize(node,size,orientation){
        const value=SIZES.includes(size)?size:'medium';
        node.dataset.widgetSize=value;
        node.classList.remove('dashboard-widget-small','dashboard-widget-medium','dashboard-widget-medium-vertical','dashboard-widget-large');
        if(value==='medium'&&orientation==='vertical')node.classList.add('dashboard-widget-medium-vertical');
        else node.classList.add('dashboard-widget-'+value);
    }

    function ensureWidgetControls(node,item){
        node.style.position='relative';

        let del=[...node.children].find(child=>child.dataset&&child.dataset.widgetDelete==='true');
        if(!del){
            del=document.createElement('button');
            del.type='button';
            del.className='dashboard-widget-delete';
            del.dataset.widgetDelete='true';
            del.textContent='×';
            del.title='Remove widget';
            del.setAttribute('aria-label','Remove '+item.label+' widget');
            del.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();});
            del.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();removeWidget(item.id);});
            node.appendChild(del);
        }

        let handle=[...node.children].find(child=>child.dataset&&child.dataset.widgetResize==='true');
        if(!handle){
            handle=document.createElement('div');
            handle.className='dashboard-widget-resize-handle';
            handle.dataset.widgetResize='true';
            handle.title='Drag to resize';
            handle.setAttribute('aria-label','Resize '+item.label+' widget');
            node.appendChild(handle);
            installResizeHandle(handle,node,item.id);
        }
        del.hidden=!moveMode;
        handle.hidden=!moveMode;
    }

    function applyLayout(){
        const config=getConfig();
        const elements=widgetElements();
        const grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid)return;
        config.forEach(item=>{
            const node=elements[item.id];
            if(!node)return;
            node.dataset.widgetId=item.id;
            node.classList.toggle('dashboard-widget-hidden',!item.visible);
            node.classList.toggle('dashboard-widget-editing',moveMode);
            applySize(node,item.size,item.orientation);
            ensureWidgetControls(node,item);
        });
        if(!dragged){
            config.forEach(item=>{const node=elements[item.id];if(node)grid.appendChild(node);});
        }
        updateMoveButton();
        updateAddButton();
    }

    function removeWidget(id){const config=getConfig(),item=config.find(x=>x.id===id);if(!item)return;item.visible=false;saveConfig(config);applyLayout();}
    function addWidget(id){const config=getConfig(),item=config.find(x=>x.id===id);if(!item)return;item.visible=true;saveConfig(config);applyLayout();}

    function updateMoveButton(){
        const button=document.querySelector('#dashboardMoveToggle');if(!button)return;
        button.classList.toggle('active',moveMode);button.setAttribute('aria-pressed',String(moveMode));
        const text=button.querySelector('.dashboard-toggle-text');if(text)text.textContent=moveMode?'Done moving':'Move widgets';
    }

    function updateAddButton(){
        const button=document.querySelector('#dashboardAddWidgetButton'),popover=document.querySelector('#dashboardAddWidgetPopover');
        if(!button||!popover)return;
        const hidden=getConfig().filter(x=>!x.visible);button.disabled=!hidden.length;popover.innerHTML='';
        if(!hidden.length){const empty=document.createElement('div');empty.className='dashboard-add-empty';empty.textContent='All widgets are already on your dashboard.';popover.appendChild(empty);return;}
        hidden.forEach(item=>{const option=document.createElement('button');option.type='button';option.className='dashboard-add-option';option.textContent='+ '+item.label;option.addEventListener('click',()=>{addWidget(item.id);popover.classList.remove('open');});popover.appendChild(option);});
    }

    function addButton(){
        const header=document.querySelector('#dashboardPage .header');if(!header||document.querySelector('#dashboardWidgetControls'))return;
        const controls=document.createElement('div');controls.id='dashboardWidgetControls';controls.className='dashboard-widget-controls';
        controls.innerHTML=`<div class="dashboard-add-widget-wrap"><button type="button" id="dashboardAddWidgetButton" class="dashboard-widget-action">+ Add</button><div id="dashboardAddWidgetPopover" class="dashboard-add-widget-popover" role="menu"></div></div><button type="button" id="dashboardMoveToggle" class="dashboard-move-toggle" aria-pressed="false"><span class="dashboard-toggle-track"><span class="dashboard-toggle-thumb"></span></span><span class="dashboard-toggle-text">Move widgets</span></button>`;
        header.appendChild(controls);
        controls.querySelector('#dashboardMoveToggle').addEventListener('click',()=>{moveMode=!moveMode;cancelDrag();applyLayout();});
        const add=controls.querySelector('#dashboardAddWidgetButton'),pop=controls.querySelector('#dashboardAddWidgetPopover');
        add.addEventListener('click',event=>{event.stopPropagation();updateAddButton();if(!add.disabled)pop.classList.toggle('open');});
        document.addEventListener('click',event=>{if(!event.target.closest('.dashboard-add-widget-wrap'))pop.classList.remove('open');});
    }

    function setWidgetSize(id,size,orientation){
        if(!SIZES.includes(size))return;
        const config=getConfig(),item=config.find(x=>x.id===id);if(!item)return;
        item.size=size;
        if(size==='medium')item.orientation=orientation==='vertical'?'vertical':'horizontal';
        else item.orientation='horizontal';
        saveConfig(config);
        const node=widgetElements()[id];if(node)applySize(node,item.size,item.orientation);
    }

    function installResizeHandle(handle,node,id){
        let startX=0,startY=0,startIndex=1,startOrientation='horizontal',resizing=false,previewIndex=1,previewOrientation='horizontal';
        const finish=event=>{
            if(!resizing)return;if(event)event.stopPropagation();resizing=false;
            node.classList.remove('dashboard-widget-resizing');
            setWidgetSize(id,SIZES[previewIndex],previewOrientation);
            delete node.dataset.previewSize;delete node.dataset.previewOrientation;
            window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish);
        };
        const move=event=>{
            if(!resizing)return;
            const dx=event.clientX-startX,dy=event.clientY-startY;
            // Use the dominant drag axis. Horizontal movement controls width;
            // vertical movement controls height/orientation. The invisible
            // dashboard is treated as a 2x2 space.
            const dominant=Math.abs(dx)>=Math.abs(dy)?dx:dy;
            const steps=dominant>=0?Math.floor(dominant/70):-Math.floor(Math.abs(dominant)/70);
            let nextIndex=startIndex+steps;
            nextIndex=Math.max(0,Math.min(2,nextIndex));
            let orientation=startOrientation;
            // Medium has two forms. From a small widget, dragging mostly
            // downward creates a vertical medium; dragging right creates a
            // horizontal medium. From medium, continuing in the same axis
            // reaches large.
            if(nextIndex===1&&Math.abs(dy)>Math.abs(dx)+25)orientation='vertical';
            else if(nextIndex===1&&Math.abs(dx)>Math.abs(dy)+25)orientation='horizontal';
            else if(startIndex===1&&nextIndex===1)orientation=startOrientation;
            if(nextIndex===2)orientation='horizontal';
            previewIndex=nextIndex;previewOrientation=orientation;
            const size=SIZES[previewIndex];
            if(node.dataset.previewSize!==size||node.dataset.previewOrientation!==orientation){
                node.dataset.previewSize=size;node.dataset.previewOrientation=orientation;applySize(node,size,orientation);
            }
        };
        handle.addEventListener('pointerdown',event=>{
            if(!moveMode||event.button!==0)return;
            event.preventDefault();event.stopPropagation();
            const current=getConfig().find(x=>x.id===id)||{};
            startIndex=Math.max(0,SIZES.indexOf(current.size||'medium'));
            startOrientation=current.orientation==='vertical'?'vertical':'horizontal';
            previewIndex=startIndex;previewOrientation=startOrientation;startX=event.clientX;startY=event.clientY;resizing=true;
            node.classList.add('dashboard-widget-resizing');
            if(handle.setPointerCapture){try{handle.setPointerCapture(event.pointerId);}catch(e){}}
            window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
        });
    }

    function installDirectDrag(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');if(!grid||grid.__widgetPointerDragInstalled)return;grid.__widgetPointerDragInstalled=true;
        grid.addEventListener('pointerdown',event=>{
            if(!moveMode||event.button!==0||dragged)return;
            const node=event.target.closest('[data-widget-id]');if(!node||!grid.contains(node))return;
            if(event.target.closest('button,input,select,textarea,a,.dashboard-widget-resize-handle'))return;
            const rect=node.getBoundingClientRect();
            dragPointer={startX:event.clientX,startY:event.clientY,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,moved:false};
            dragMoveHandler=moveEvent=>{
                if(!dragPointer||!node)return;const dx=moveEvent.clientX-dragPointer.startX,dy=moveEvent.clientY-dragPointer.startY;
                if(!dragPointer.moved){if(Math.hypot(dx,dy)<6)return;dragPointer.moved=true;dragged=node;placeholder=document.createElement('div');placeholder.className='dashboard-widget-placeholder';placeholder.style.height=rect.height+'px';placeholder.style.minHeight=rect.height+'px';placeholder.style.gridColumn=getComputedStyle(node).gridColumn;placeholder.style.gridRow=getComputedStyle(node).gridRow;node.parentNode.insertBefore(placeholder,node);node.classList.add('dashboard-widget-dragging');}
                node.style.position='fixed';node.style.width=rect.width+'px';node.style.left=(moveEvent.clientX-dragPointer.offsetX)+'px';node.style.top=(moveEvent.clientY-dragPointer.offsetY)+'px';node.style.zIndex='1000';node.style.pointerEvents='none';
                const target=document.elementFromPoint(moveEvent.clientX,moveEvent.clientY)?.closest('[data-widget-id]');if(!target||target===node||target.classList.contains('dashboard-widget-hidden')||!grid.contains(target))return;
                const targetRect=target.getBoundingClientRect();
                if(moveEvent.clientY<targetRect.top+targetRect.height/2){if(placeholder.nextSibling!==target)grid.insertBefore(placeholder,target);}else if(target.nextSibling!==placeholder)grid.insertBefore(placeholder,target.nextSibling);
            };
            dragUpHandler=()=>{
                window.removeEventListener('pointermove',dragMoveHandler);window.removeEventListener('pointerup',dragUpHandler);window.removeEventListener('pointercancel',dragUpHandler);if(!dragPointer)return;
                const didMove=dragPointer.moved;
                if(dragged){if(placeholder?.parentNode)placeholder.parentNode.insertBefore(dragged,placeholder);dragged.style.position='';dragged.style.width='';dragged.style.left='';dragged.style.top='';dragged.style.zIndex='';dragged.style.pointerEvents='';dragged.classList.remove('dashboard-widget-dragging');}
                if(placeholder?.parentNode)placeholder.parentNode.removeChild(placeholder);placeholder=null;
                if(didMove){const order=[...grid.querySelectorAll('[data-widget-id]')].map(n=>n.dataset.widgetId),config=getConfig();config.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));saveConfig(config);}
                dragged=null;dragPointer=null;dragMoveHandler=null;dragUpHandler=null;applyLayout();
            };
            window.addEventListener('pointermove',dragMoveHandler);window.addEventListener('pointerup',dragUpHandler);window.addEventListener('pointercancel',dragUpHandler);
        });
    }

    function cancelDrag(){
        if(dragMoveHandler)window.removeEventListener('pointermove',dragMoveHandler);if(dragUpHandler)window.removeEventListener('pointerup',dragUpHandler);window.removeEventListener('pointercancel',dragUpHandler);
        if(dragged){if(placeholder?.parentNode)placeholder.parentNode.insertBefore(dragged,placeholder);dragged.style.position='';dragged.style.width='';dragged.style.left='';dragged.style.top='';dragged.style.zIndex='';dragged.style.pointerEvents='';dragged.classList.remove('dashboard-widget-dragging');}
        if(placeholder?.parentNode)placeholder.parentNode.removeChild(placeholder);dragged=null;placeholder=null;dragPointer=null;dragMoveHandler=null;dragUpHandler=null;
    }

    function boot(){addButton();applyLayout();installDirectDrag();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});window.addEventListener('load',boot,{once:true});document.addEventListener('planner-data-changed',applyLayout);document.addEventListener('dashboard-widget-added',()=>{applyLayout();installDirectDrag();});
})();
