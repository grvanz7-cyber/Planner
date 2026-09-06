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
    let dragFrame=null;

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

    function applySize(node,size){
        const value=SIZES.includes(size)?size:'medium';
        node.dataset.widgetSize=value;
        node.classList.remove('dashboard-widget-small','dashboard-widget-medium','dashboard-widget-large');
        node.classList.add('dashboard-widget-'+value);
    }

    function applyLayout(){
        const config=getConfig(),elements=widgetElements(),grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid)return;
        config.forEach(item=>{
            const node=elements[item.id];
            if(!node)return;
            node.classList.toggle('dashboard-widget-hidden',!item.visible);
            node.dataset.widgetId=item.id;
            node.classList.toggle('dashboard-widget-editing',moveMode);
            node.draggable=moveMode;
            applySize(node,item.size);
            ensureWidgetControls(node,item);
        });
        config.forEach(item=>{
            const node=elements[item.id];
            if(node&&!dragged)grid.appendChild(node);
        });
        updateMoveButton();
        updateAddButton();
    }

    function ensureWidgetControls(node,item){
        // Controls are direct children of each widget, so every widget gets its own controls.
        let deleteButton=node.querySelector(':scope > .dashboard-widget-delete');
        if(!deleteButton){
            deleteButton=document.createElement('button');
            deleteButton.type='button';
            deleteButton.className='dashboard-widget-delete';
            deleteButton.textContent='×';
            deleteButton.title='Remove widget';
            deleteButton.setAttribute('aria-label','Remove '+item.label+' widget');
            node.appendChild(deleteButton);
            deleteButton.addEventListener('click',event=>{
                event.preventDefault();
                event.stopPropagation();
                removeWidget(item.id);
            });
        }

        let resizeHandle=node.querySelector(':scope > .dashboard-widget-resize-handle');
        if(!resizeHandle){
            resizeHandle=document.createElement('div');
            resizeHandle.className='dashboard-widget-resize-handle';
            resizeHandle.title='Drag to resize';
            resizeHandle.setAttribute('aria-label','Resize '+item.label+' widget');
            node.appendChild(resizeHandle);
            installResizeHandle(resizeHandle,node,item.id);
        }
        deleteButton.hidden=!moveMode;
        resizeHandle.hidden=!moveMode;
    }

    function removeWidget(id){
        const config=getConfig(),item=config.find(x=>x.id===id);
        if(!item)return;
        item.visible=false;
        saveConfig(config);
        applyLayout();
    }

    function addWidget(id){
        const config=getConfig(),item=config.find(x=>x.id===id);
        if(!item)return;
        item.visible=true;
        saveConfig(config);
        applyLayout();
    }

    function updateMoveButton(){
        const button=document.querySelector('#dashboardMoveToggle');
        if(!button)return;
        button.classList.toggle('active',moveMode);
        button.setAttribute('aria-pressed',moveMode?'true':'false');
        const text=button.querySelector('.dashboard-toggle-text');
        if(text)text.textContent=moveMode?'Done moving':'Move widgets';
    }

    function updateAddButton(){
        const button=document.querySelector('#dashboardAddWidgetButton');
        const popover=document.querySelector('#dashboardAddWidgetPopover');
        if(!button||!popover)return;
        const hidden=getConfig().filter(x=>!x.visible);
        button.disabled=hidden.length===0;
        popover.innerHTML='';
        if(!hidden.length){
            const empty=document.createElement('div');
            empty.className='dashboard-add-empty';
            empty.textContent='All widgets are already on your dashboard.';
            popover.appendChild(empty);
            return;
        }
        hidden.forEach(item=>{
            const option=document.createElement('button');
            option.type='button';
            option.className='dashboard-add-option';
            option.textContent='+ '+item.label;
            option.addEventListener('click',()=>{
                addWidget(item.id);
                popover.classList.remove('open');
            });
            popover.appendChild(option);
        });
    }

    function addButton(){
        const header=document.querySelector('#dashboardPage .header');
        if(!header||document.querySelector('#dashboardWidgetControls'))return;
        const controls=document.createElement('div');
        controls.id='dashboardWidgetControls';
        controls.className='dashboard-widget-controls';
        controls.innerHTML=`
            <div class="dashboard-add-widget-wrap">
                <button type="button" id="dashboardAddWidgetButton" class="dashboard-widget-action">+ Add</button>
                <div id="dashboardAddWidgetPopover" class="dashboard-add-widget-popover" role="menu"></div>
            </div>
            <button type="button" id="dashboardMoveToggle" class="dashboard-move-toggle" aria-pressed="false">
                <span class="dashboard-toggle-track"><span class="dashboard-toggle-thumb"></span></span>
                <span class="dashboard-toggle-text">Move widgets</span>
            </button>`;
        header.appendChild(controls);

        controls.querySelector('#dashboardMoveToggle').addEventListener('click',()=>{
            moveMode=!moveMode;
            if(!moveMode)cancelDrag();
            applyLayout();
        });
        const add=controls.querySelector('#dashboardAddWidgetButton');
        const popover=controls.querySelector('#dashboardAddWidgetPopover');
        add.addEventListener('click',event=>{
            event.stopPropagation();
            updateAddButton();
            if(!add.disabled)popover.classList.toggle('open');
        });
        document.addEventListener('click',event=>{
            if(!event.target.closest('.dashboard-add-widget-wrap'))popover.classList.remove('open');
        });
    }

    function setWidgetSize(id,size){
        if(!SIZES.includes(size))return;
        const config=getConfig(),item=config.find(x=>x.id===id);
        if(!item||item.size===size)return;
        item.size=size;
        saveConfig(config);
        const node=widgetElements()[id];
        if(node)applySize(node,size);
    }

    function installResizeHandle(handle,node,id){
        let startX=0,startY=0,startSizeIndex=1;
        let resizing=false;

        const finish=()=>{
            if(!resizing)return;
            resizing=false;
            node.classList.remove('dashboard-widget-resizing');
            const size=node.dataset.previewSize||SIZES[startSizeIndex];
            delete node.dataset.previewSize;
            setWidgetSize(id,size);
            window.removeEventListener('pointermove',move);
            window.removeEventListener('pointerup',finish);
            window.removeEventListener('pointercancel',finish);
        };

        const move=event=>{
            if(!resizing)return;
            const dx=event.clientX-startX;
            const dy=event.clientY-startY;
            // Resize is based on horizontal drag distance, with vertical movement also helping.
            const distance=(dx+dy)/2;
            let index=startSizeIndex;
            if(distance>75)index=Math.min(2,startSizeIndex+1);
            if(distance<-75)index=Math.max(0,startSizeIndex-1);
            const size=SIZES[index];
            node.dataset.previewSize=size;
            applySize(node,size);
        };

        handle.addEventListener('pointerdown',event=>{
            if(!moveMode)return;
            event.preventDefault();
            event.stopPropagation();
            const current=getConfig().find(x=>x.id===id)?.size||'medium';
            startSizeIndex=Math.max(0,SIZES.indexOf(current));
            startX=event.clientX;
            startY=event.clientY;
            resizing=true;
            node.classList.add('dashboard-widget-resizing');
            window.addEventListener('pointermove',move);
            window.addEventListener('pointerup',finish);
            window.addEventListener('pointercancel',finish);
        });
    }

    function installDirectDrag(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid||grid.__widgetDragInstalled)return;
        grid.__widgetDragInstalled=true;

        grid.addEventListener('dragstart',event=>{
            if(!moveMode)return;
            const node=event.target.closest('[data-widget-id]');
            if(!node||event.target.closest('button,input,select,a,.dashboard-widget-resize-handle'))return;
            dragged=node;
            node.classList.add('dashboard-widget-dragging');
            placeholder=document.createElement('div');
            placeholder.className='dashboard-widget-placeholder';
            placeholder.style.height=node.getBoundingClientRect().height+'px';
            placeholder.dataset.widgetPlaceholder='true';
            node.parentNode.insertBefore(placeholder,node);
            event.dataTransfer.effectAllowed='move';
            event.dataTransfer.setData('text/plain',node.dataset.widgetId||'widget');
            requestAnimationFrame(()=>{if(dragged)dragged.style.opacity='.45';});
        });

        grid.addEventListener('dragover',event=>{
            if(!moveMode||!dragged||!placeholder)return;
            event.preventDefault();
            if(dragFrame)return;
            dragFrame=requestAnimationFrame(()=>{
                dragFrame=null;
                const target=event.target.closest('[data-widget-id]');
                if(!target||target===dragged||target.classList.contains('dashboard-widget-hidden'))return;
                const rect=target.getBoundingClientRect();
                const before=event.clientY<rect.top+rect.height/2;
                if(before)grid.insertBefore(placeholder,target);
                else if(target.nextSibling!==placeholder)grid.insertBefore(placeholder,target.nextSibling);
            });
        });

        grid.addEventListener('drop',event=>{
            if(!moveMode||!dragged)return;
            event.preventDefault();
        });

        grid.addEventListener('dragend',()=>finishDrag(grid));
    }

    function finishDrag(grid){
        if(!dragged)return;
        if(placeholder&&placeholder.parentNode)placeholder.parentNode.insertBefore(dragged,placeholder);
        dragged.style.opacity='';
        dragged.classList.remove('dashboard-widget-dragging');
        if(placeholder&&placeholder.parentNode)placeholder.parentNode.removeChild(placeholder);
        placeholder=null;
        const order=[...grid.querySelectorAll('[data-widget-id]')].map(node=>node.dataset.widgetId);
        const config=getConfig();
        config.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
        saveConfig(config);
        dragged=null;
        applyLayout();
    }

    function cancelDrag(){
        if(dragged){
            dragged.style.opacity='';
            dragged.classList.remove('dashboard-widget-dragging');
        }
        if(placeholder?.parentNode)placeholder.parentNode.removeChild(placeholder);
        dragged=null;
        placeholder=null;
    }

    function makeWidgetsDraggable(){
        const elements=widgetElements();
        Object.values(elements).forEach(node=>{if(node)node.draggable=moveMode;});
        installDirectDrag();
    }

    function boot(){
        addButton();
        applyLayout();
        makeWidgetsDraggable();
    }

    document.addEventListener('DOMContentLoaded',boot,{once:true});
    window.addEventListener('load',boot,{once:true});
    document.addEventListener('planner-data-changed',applyLayout);
    document.addEventListener('dashboard-widget-added',()=>{applyLayout();makeWidgetsDraggable();});
})();
