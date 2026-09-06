// ========================================
// DASHBOARD WIDGET SYSTEM
// ========================================
// Lets the user choose which dashboard widgets are visible and drag them
// into the order they prefer. The layout is saved locally with the planner.

(function installDashboardWidgets(){
    const STORAGE_KEY = 'plannerDashboardWidgets';
    const DEFAULTS = [
        { id: 'today', label: 'Today', visible: true },
        { id: 'upcoming', label: 'Upcoming', visible: true },
        { id: 'stats', label: 'Overview', visible: true }
    ];

    function getConfig(){
        try{
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if(!Array.isArray(saved)) return DEFAULTS.map(x => ({...x}));
            return DEFAULTS.map(def => {
                const found = saved.find(x => x && x.id === def.id);
                return found ? {...def, visible: found.visible !== false} : {...def};
            }).sort((a,b) => {
                const ai = saved.findIndex(x => x && x.id === a.id);
                const bi = saved.findIndex(x => x && x.id === b.id);
                return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
            });
        }catch(e){
            return DEFAULTS.map(x => ({...x}));
        }
    }

    function saveConfig(config){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    function widgetElements(){
        const dashboard = document.querySelector('#dashboardPage');
        if(!dashboard) return {};
        return {
            today: dashboard.querySelector('.today-tasks')?.closest('.card'),
            upcoming: dashboard.querySelector('.upcoming-tasks')?.closest('.card'),
            stats: dashboard.querySelector('#dashboardStatsCard')
        };
    }

    function applyLayout(){
        const config = getConfig();
        const elements = widgetElements();
        const grid = document.querySelector('#dashboardPage .dashboard-grid');
        if(!grid) return;

        config.forEach(item => {
            const node = elements[item.id];
            if(node) node.classList.toggle('dashboard-widget-hidden', !item.visible);
        });

        config.forEach(item => {
            const node = elements[item.id];
            if(node) grid.appendChild(node);
        });
    }

    function openCustomizer(){
        let modal = document.querySelector('#dashboardWidgetModal');
        if(!modal){
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'dashboardWidgetModal';
            modal.innerHTML = `
                <div class="modal dashboard-widget-modal">
                    <div class="modal-header">
                        <h2>Customize Dashboard</h2>
                        <button type="button" class="close-button" id="closeDashboardWidgetModal">×</button>
                    </div>
                    <p class="widget-modal-help">Choose the widgets you want to see. Drag them to change their order.</p>
                    <div id="dashboardWidgetOptions" class="dashboard-widget-options"></div>
                    <div class="modal-actions">
                        <button type="button" class="cancel-button" id="resetDashboardWidgets">Reset</button>
                        <button type="button" class="save-button" id="saveDashboardWidgets">Done</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#closeDashboardWidgetModal').onclick = () => modal.classList.remove('open');
            modal.querySelector('#saveDashboardWidgets').onclick = () => {
                const config = readOptions();
                saveConfig(config);
                applyLayout();
                modal.classList.remove('open');
            };
            modal.querySelector('#resetDashboardWidgets').onclick = () => {
                saveConfig(DEFAULTS.map(x => ({...x})));
                buildOptions();
                applyLayout();
            };
            modal.addEventListener('click', event => {
                if(event.target === modal) modal.classList.remove('open');
            });
        }
        buildOptions();
        modal.classList.add('open');
    }

    function buildOptions(){
        const container = document.querySelector('#dashboardWidgetOptions');
        if(!container) return;
        container.innerHTML = '';

        getConfig().forEach(item => {
            const row = document.createElement('div');
            row.className = 'dashboard-widget-option';
            row.draggable = true;
            row.dataset.widgetId = item.id;
            row.innerHTML = `
                <span class="widget-drag-handle" aria-hidden="true">☷</span>
                <label>
                    <input type="checkbox" data-widget-visible="${item.id}" ${item.visible ? 'checked' : ''}>
                    <span>${item.label}</span>
                </label>
            `;
            container.appendChild(row);
        });

        let dragged = null;
        container.querySelectorAll('.dashboard-widget-option').forEach(row => {
            row.addEventListener('dragstart', () => {
                dragged = row;
                row.classList.add('dragging');
            });
            row.addEventListener('dragend', () => {
                row.classList.remove('dragging');
                dragged = null;
            });
            row.addEventListener('dragover', event => {
                event.preventDefault();
                if(!dragged || dragged === row) return;
                const rect = row.getBoundingClientRect();
                const after = event.clientY > rect.top + rect.height / 2;
                container.insertBefore(dragged, after ? row.nextSibling : row);
            });
        });
    }

    function readOptions(){
        const rows = [...document.querySelectorAll('#dashboardWidgetOptions .dashboard-widget-option')];
        return rows.map(row => {
            const id = row.dataset.widgetId;
            const original = DEFAULTS.find(x => x.id === id);
            return {
                id,
                label: original ? original.label : id,
                visible: row.querySelector('input')?.checked !== false
            };
        });
    }

    function addButton(){
        const header = document.querySelector('#dashboardPage .header');
        if(!header || document.querySelector('#customizeDashboardButton')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dashboard-customize-button';
        button.id = 'customizeDashboardButton';
        button.textContent = '⚙ Customize';
        button.title = 'Customize dashboard widgets';
        button.onclick = openCustomizer;
        header.appendChild(button);
    }

    function boot(){
        addButton();
        applyLayout();
    }

    document.addEventListener('DOMContentLoaded', boot, {once:true});
    window.addEventListener('load', boot, {once:true});

    // The statistics widget is created after some dashboard renders, so make
    // sure the saved layout is reapplied after those renders.
    document.addEventListener('click', () => setTimeout(applyLayout, 0));
    document.addEventListener('change', () => setTimeout(applyLayout, 0));
})();
