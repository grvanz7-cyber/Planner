// ========================================
// DASHBOARD WIDGET SYSTEM
// ========================================
(function installDashboardWidgets(){
    const STORAGE_KEY='plannerDashboardWidgets';
    const DEFAULTS=[
        {id:'today',label:'Today',visible:true,size:'normal'},
        {id:'upcoming',label:'Upcoming',visible:true,size:'normal'},
        {id:'stats',label:'Overview',visible:true,size:'normal'},
        {id:'school',label:'School Overview',visible:true,size:'wide'},
        {id:'subjects',label:'Subject Snapshot',visible:true,size:'wide'},
        {id:'study-load',label:'Study Load',visible:true,size:'wide'}
    ];
    const SIZES=['normal','wide','tall','large'];

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
        if(!node)return;
        SIZES.forEach(s=>node.classList.remove('dashboard-widget-size-'+s));
        node.classList.add('dashboard-widget-size-'+(SIZES.includes(size)?size:'normal'));
    }

    function addDashboardDragHandle(node,id){
        if(!node||node.querySelector(':scope > .dashboard-widget-drag-handle'))return;
        const handle=document.createElement('button');
        handle.type='button';
        handle.className='dashboard-widget-drag-handle';
        handle.dataset.widgetDrag=id;
        handle.draggable=true;
        handle.title='Drag to move this widget';
        handle.setAttribute('aria-label','Drag to move widget');
        handle.textContent='⋮⋮';
        node.appendChild(handle);
    }

    function addResizeHandle(node,id){
        if(!node||node.querySelector(':scope > .dashboard-widget-resize-handle'))return;
        const handle=document.createElement('span');
        handle.className='dashboard-widget-resize-handle';
        handle.dataset.widgetResize=id;
        handle.title='Drag to resize';
        handle.setAttribute('aria-label','Resize widget');
        node.appendChild(handle);
    }

    function applyLayout(){
        const config=getConfig(),elements=widgetElements(),grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid)return;
        config.forEach(item=>{
            const node=elements[item.id];
            if(!node)return;
            node.classList.toggle('dashboard-widget-hidden',!item.visible);
            applySize(node,item.size);
            addDashboardDragHandle(node,item.id);
            addResizeHandle(node,item.id);
        });
        config.forEach(item=>{
            const node=elements[item.id];
            if(node)grid.appendChild(node);
        });
        installDashboardDrag(grid);
        installResize(grid);
    }

    function installDashboardDrag(grid){
        if(grid.__widgetDragInstalled)return;
        grid.__widgetDragInstalled=true;
        let dragged=null;
        grid.addEventListener('dragstart',event=>{
            const handle=event.target.closest('.dashboard-widget-drag-handle');
            if(!handle)return;
            dragged=handle.closest('.card');
            if(!dragged)return;
            event.dataTransfer.effectAllowed='move';
            event.dataTransfer.setData('text/plain',handle.dataset.widgetDrag||'');
            dragged.classList.add('dashboard-widget-dragging');
        });
        grid.addEventListener('dragover',event=>{
            if(!dragged)return;
            event.preventDefault();
            const target=event.target.closest('.card');
            if(!target||target===dragged||!grid.contains(target))return;
            const rect=target.getBoundingClientRect();
            grid.insertBefore(dragged,event.clientY>rect.top+rect.height/2?target.nextSibling:target);
        });
        grid.addEventListener('dragend',()=>{
            if(!dragged)return;
            dragged.classList.remove('dashboard-widget-dragging');
            dragged=null;
            saveCurrentLayout();
        });
    }

    function installResize(grid){
        if(grid.__widgetResizeInstalled)return;
        grid.__widgetResizeInstalled=true;
        let state=null;
        grid.addEventListener('pointerdown',event=>{
            const handle=event.target.closest('.dashboard-widget-resize-handle');
            if(!handle)return;
            const node=handle.closest('.card');
            if(!node)return;
            event.preventDefault();
            const rect=node.getBoundingClientRect();
            state={node,startX:event.clientX,startY:event.clientY,startWidth:rect.width,startHeight:rect.height};
            handle.setPointerCapture?.(event.pointerId);
            node.classList.add('dashboard-widget-resizing');
        });
        grid.addEventListener('pointermove',event=>{
            if(!state)return;
            const dx=event.clientX-state.startX,dy=event.clientY-state.startY;
            const width=state.startWidth+dx,height=state.startHeight+dy;
            const gridWidth=grid.getBoundingClientRect().width;
            const gap=parseFloat(getComputedStyle(grid).gap)||12;
            const columnWidth=Math.max(120,(gridWidth-gap)/2);
            let size='normal';
            if(width>columnWidth*1.55)size='wide';
            if(height>260)size='tall';
            if(width>columnWidth*1.55&&height>260)size='large';
            applySize(state.node,size);
        });
        grid.addEventListener('pointerup',finishResize);
        grid.addEventListener('pointercancel',finishResize);
        function finishResize(){
            if(!state)return;
            state.node.classList.remove('dashboard-widget-resizing');
            saveCurrentLayout();
            state=null;
        }
    }

    function saveCurrentLayout(){
        const elements=widgetElements(),config=getConfig(),byId=new Map(config.map(x=>[x.id,x]));
        const grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid)return;
        const ordered=[];
        [...grid.children].forEach(node=>{
            const entry=[...byId.values()].find(item=>elements[item.id]===node);
            if(entry){
                const size=SIZES.find(s=>node.classList.contains('dashboard-widget-size-'+s))||entry.size||'normal';
                ordered.push({...entry,size});
            }
        });
        if(ordered.length)saveConfig(ordered);
    }

    function openCustomizer(){
        let modal=document.querySelector('#dashboardWidgetModal');
        if(!modal){
            modal=document.createElement('div');
            modal.className='modal-overlay';
            modal.id='dashboardWidgetModal';
            modal.innerHTML='<div class="modal dashboard-widget-modal"><div class="modal-header"><h2>Customize Dashboard</h2><button type="button" class="close-button" id="closeDashboardWidgetModal">×</button></div><p class="widget-modal-help">Show, hide, reorder, and resize your widgets. You can also drag widgets directly on the dashboard.</p><div id="dashboardWidgetOptions" class="dashboard-widget-options"></div><div class="modal-actions"><button type="button" class="cancel-button" id="resetDashboardWidgets">Reset</button><button type="button" class="save-button" id="saveDashboardWidgets">Done</button></div></div>';
            document.body.appendChild(modal);
            modal.querySelector('#closeDashboardWidgetModal').onclick=()=>modal.classList.remove('open');
            modal.querySelector('#saveDashboardWidgets').onclick=()=>{saveConfig(readOptions());applyLayout();modal.classList.remove('open');};
            modal.querySelector('#resetDashboardWidgets').onclick=()=>{saveConfig(DEFAULTS.map(x=>({...x})));buildOptions();applyLayout();};
            modal.addEventListener('click',event=>{if(event.target===modal)modal.classList.remove('open');});
        }
        buildOptions();
        modal.classList.add('open');
    }

    function buildOptions(){
        const container=document.querySelector('#dashboardWidgetOptions');
        if(!container)return;
        container.innerHTML='';
        getConfig().forEach(item=>{
            const row=document.createElement('div');
            row.className='dashboard-widget-option';
            row.draggable=true;
            row.dataset.widgetId=item.id;
            row.innerHTML=`<span class="widget-drag-handle" aria-hidden="true">☷</span><label><input type="checkbox" data-widget-visible="${item.id}" ${item.visible?'checked':''}><span>${item.label}</span></label><select class="widget-size-select" data-widget-size="${item.id}" aria-label="${item.label} size"><option value="normal" ${item.size==='normal'?'selected':''}>Normal</option><option value="wide" ${item.size==='wide'?'selected':''}>Wide</option><option value="tall" ${item.size==='tall'?'selected':''}>Tall</option><option value="large" ${item.size==='large'?'selected':''}>Large</option></select>`;
            container.appendChild(row);
        });
        let dragged=null;
        container.querySelectorAll('.dashboard-widget-option').forEach(row=>{
            row.addEventListener('dragstart',()=>{dragged=row;row.classList.add('dragging');});
            row.addEventListener('dragend',()=>{row.classList.remove('dragging');dragged=null;});
            row.addEventListener('dragover',event=>{event.preventDefault();if(!dragged||dragged===row)return;const rect=row.getBoundingClientRect();container.insertBefore(dragged,event.clientY>rect.top+rect.height/2?row.nextSibling:row);});
        });
    }

    function readOptions(){
        return[...document.querySelectorAll('#dashboardWidgetOptions .dashboard-widget-option')].map(row=>{
            const id=row.dataset.widgetId,original=DEFAULTS.find(x=>x.id===id);
            return{id,label:original?original.label:id,visible:row.querySelector('input')?.checked!==false,size:row.querySelector('.widget-size-select')?.value||original?.size||'normal'};
        });
    }

    function addButton(){
        const header=document.querySelector('#dashboardPage .header');
        if(!header||document.querySelector('#customizeDashboardButton'))return;
        const button=document.createElement('button');
        button.type='button';button.className='dashboard-customize-button';button.id='customizeDashboardButton';button.textContent='⚙ Customize';button.title='Customize dashboard widgets';button.onclick=openCustomizer;header.appendChild(button);
    }

    function boot(){addButton();applyLayout();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});
    window.addEventListener('load',boot,{once:true});
    document.addEventListener('planner-data-changed',applyLayout);
    document.addEventListener('dashboard-widget-added',applyLayout);
})();
