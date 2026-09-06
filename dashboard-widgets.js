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
        });
        config.forEach(item=>{const node=elements[item.id];if(node)grid.appendChild(node);});
    }

    function openCustomizer(){
        let modal=document.querySelector('#dashboardWidgetModal');
        if(!modal){
            modal=document.createElement('div');
            modal.className='modal-overlay';
            modal.id='dashboardWidgetModal';
            modal.innerHTML='<div class="modal dashboard-widget-modal"><div class="modal-header"><h2>Customize Dashboard</h2><button type="button" class="close-button" id="closeDashboardWidgetModal">×</button></div><p class="widget-modal-help">Choose what appears, pick a widget size, and drag widgets to change their order.</p><div id="dashboardWidgetOptions" class="dashboard-widget-options"></div><div class="modal-actions"><button type="button" class="cancel-button" id="resetDashboardWidgets">Reset</button><button type="button" class="save-button" id="saveDashboardWidgets">Done</button></div></div>';
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
            row.innerHTML=`<span class="widget-drag-handle" aria-hidden="true">☷</span><label><input type="checkbox" data-widget-visible="${item.id}" ${item.visible?'checked':''}><span>${item.label}</span></label><select class="widget-size-select" data-widget-size="${item.id}" aria-label="${item.label} size"><option value="small" ${item.size==='small'?'selected':''}>Small</option><option value="medium" ${item.size==='medium'?'selected':''}>Medium</option><option value="large" ${item.size==='large'?'selected':''}>Large</option></select>`;
            container.appendChild(row);
        });
        let dragged=null;
        container.querySelectorAll('.dashboard-widget-option').forEach(row=>{
            row.addEventListener('dragstart',()=>{dragged=row;row.classList.add('dragging');});
            row.addEventListener('dragend',()=>{row.classList.remove('dragging');dragged=null;});
            row.addEventListener('dragover',event=>{
                event.preventDefault();
                if(!dragged||dragged===row)return;
                const rect=row.getBoundingClientRect();
                container.insertBefore(dragged,event.clientY>rect.top+rect.height/2?row.nextSibling:row);
            });
        });
    }

    function readOptions(){
        return[...document.querySelectorAll('#dashboardWidgetOptions .dashboard-widget-option')].map(row=>{
            const id=row.dataset.widgetId,original=DEFAULTS.find(x=>x.id===id);
            return{id,label:original?original.label:id,visible:row.querySelector('input')?.checked!==false,size:SIZES.includes(row.querySelector('.widget-size-select')?.value)?row.querySelector('.widget-size-select').value:(original?.size||'medium')};
        });
    }

    function addButton(){
        const header=document.querySelector('#dashboardPage .header');
        if(!header||document.querySelector('#customizeDashboardButton'))return;
        const button=document.createElement('button');
        button.type='button';
        button.className='dashboard-customize-button';
        button.id='customizeDashboardButton';
        button.textContent='⚙ Customize';
        button.title='Customize dashboard widgets';
        button.onclick=openCustomizer;
        header.appendChild(button);
    }

    function installDirectDrag(){
        const grid=document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid||grid.__widgetDragInstalled)return;
        grid.__widgetDragInstalled=true;
        let dragged=null;
        grid.addEventListener('dragstart',event=>{
            const node=event.target.closest('[data-widget-id]');
            if(!node||event.target.closest('button,input,select,a'))return;
            dragged=node;
            node.classList.add('dashboard-widget-dragging');
            event.dataTransfer.effectAllowed='move';
        });
        grid.addEventListener('dragover',event=>{
            if(!dragged)return;
            event.preventDefault();
            const target=event.target.closest('[data-widget-id]');
            if(!target||target===dragged)return;
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
        });
    }

    function makeWidgetsDraggable(){
        const elements=widgetElements();
        Object.values(elements).forEach(node=>{if(node){node.draggable=true;}});
        installDirectDrag();
    }

    function boot(){addButton();applyLayout();makeWidgetsDraggable();}
    document.addEventListener('DOMContentLoaded',boot,{once:true});
    window.addEventListener('load',boot,{once:true});
    document.addEventListener('planner-data-changed',applyLayout);
    document.addEventListener('dashboard-widget-added',()=>{applyLayout();makeWidgetsDraggable();});
})();
