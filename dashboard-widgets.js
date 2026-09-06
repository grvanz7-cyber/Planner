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

    function applyLayout(){
        const config=getConfig(),elements=widgetElements(),grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid)return;
        config.forEach(item=>{
            const node=elements[item.id];
            if(!node)return;
            node.classList.toggle('dashboard-widget-hidden',!item.visible);
            node.dataset.widgetSize=item.size||'medium';
            node.classList.remove('dashboard-widget-small','dashboard-widget-medium','dashboard-widget-large');
            node.classList.add('dashboard-widget-'+(item.size||'medium'));
            node.dataset.widgetId=item.id;
            node.classList.toggle('dashboard-widget-editing',moveMode);
            node.draggable=moveMode;
            ensureWidgetControls(node,item);
        });
        config.forEach(item=>{
            const node=elements[item.id];
            if(node)grid.appendChild(node);
        });
        updateMoveButton();
        updateAddButton();
    }

    function ensureWidgetControls(node,item){
        let deleteButton=node.querySelector('.dashboard-widget-delete');
        let resizeHandle=node.querySelector('.dashboard-widget-resize-handle');
        if(!deleteButton){
            deleteButton=document.createElement('button');
            deleteButton.type='button';
            deleteButton.className='dashboard-widget-delete';
            deleteButton.textContent='×';
            deleteButton.title='Remove widget';
            deleteButton.setAttribute('aria-label','Remove '+item.label+' widget');
            deleteButton.addEventListener('click',event=>{
                event.preventDefault();
                event.stopPropagation();
                removeWidget(item.id);
            });
            node.appendChild(deleteButton);
        }
        if(!resizeHandle){
            resizeHandle=document.createElement('div');
            resizeHandle.className='dashboard-widget-resize-handle';
            resizeHandle.title='Drag to change size';
            resizeHandle.setAttribute('aria-label','Resize '+item.label+' widget');
            node.appendChild(resizeHandle);
            installResizeHandle(resizeHandle,node,item.id);
        }
        deleteButton.hidden=!moveMode;
        resizeHandle.hidden=!moveMode;
    }

    function removeWidget(id){
        const config=getConfig();
        const item=config.find(x=>x.id===id);
        if(!item)return;
        item.visible=false;
        saveConfig(config);
        applyLayout();
    }

    function addWidget(id){
        const config=getConfig();
        const item=config.find(x=>x.id===id);
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
        if(text)text.textContent=moveMode?'Moving enabled':'Move widgets';
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
        if(!header)return;
        if(document.querySelector('#dashboardWidgetControls'))return;

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
        const config=getConfig();
        const item=config.find(x=>x.id===id);
        if(!item)return;
        if(item.size===size)return;
        item.size=size;
        saveConfig(config);
        applyLayout();
    }

    function installResizeHandle(handle,node,id){
        let startX=0,startY=0,startSize='medium';
        const onMove=event=>{
            if(!node.classList.contains('dashboard-widget-resizing'))return;
            const dx=event.clientX-startX;
            const dy=event.clientY-startY;
            const distance=Math.max(dx,dy);
            let size=startSize;
            if(distance>=150)size='large';
            else if(distance<=-60)size='small';
            else size='medium';
            node.dataset.previewSize=size;
            node.classList.remove('dashboard-widget-small','dashboard-widget-medium','dashboard-widget-large');
            node.classList.add('dashboard-widget-'+size);
        };
        const onUp=()=>{
            if(!node.classList.contains('dashboard-widget-resizing'))return;
            node.classList.remove('dashboard-widget-resizing');
            const size=node.dataset.previewSize||startSize;
            delete node.dataset.previewSize;
            setWidgetSize(id,size);
            window.removeEventListener('pointermove',onMove);
            window.removeEventListener('pointerup',onUp);
        };
        handle.addEventListener('pointerdown',event=>{
            if(!moveMode)return;
            event.preventDefault();
            event.stopPropagation();
            startX=event.clientX;
            startY=event.clientY;
            startSize=getConfig().find(x=>x.id===id)?.size||'medium';
            node.classList.add('dashboard-widget-resizing');
            window.addEventListener('pointermove',onMove);
            window.addEventListener('pointerup',onUp,{once:true});
        });
    }

    function installDirectDrag(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid||grid.__widgetDragInstalled)return;
        grid.__widgetDragInstalled=true;
        let dragged=null;
        grid.addEventListener('dragstart',event=>{
            if(!moveMode)return;
            const node=event.target.closest('[data-widget-id]');
            if(!node||event.target.closest('button,input,select,a,.dashboard-widget-resize-handle'))return;
            dragged=node;
            node.classList.add('dashboard-widget-dragging');
            event.dataTransfer.effectAllowed='move';
        });
        grid.addEventListener('dragover',event=>{
            if(!moveMode||!dragged)return;
            event.preventDefault();
            const target=event.target.closest('[data-widget-id]');
            if(!target||target===dragged||target.classList.contains('dashboard-widget-hidden'))return;
            const rect=target.getBoundingClientRect();
            grid.insertBefore(dragged,event.clientY>rect.top+rect.height/2?target.nextSibling:target);
        });
        grid.addEventListener('dragend',()=>{
            if(!dragged)return;
            dragged.classList.remove('dashboard-widget-dragging');
            const elements=widgetElements();
            const config=getConfig();
            const order=[...grid.querySelectorAll('[data-widget-id]')].map(node=>node.dataset.widgetId);
            config.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
            saveConfig(config);
            dragged=null;
            applyLayout();
        });
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
