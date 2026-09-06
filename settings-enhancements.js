// ========================================
// SETTINGS CUSTOMIZATION
// ========================================

(function installSettingsCustomization(){
    const DEFAULT_UI = {
        font: 'system',
        fontSize: 'medium',
        accent: '#304b8a',
        compact: false
    };

    const FONTS = {
        system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        sans: 'Arial, Helvetica, sans-serif',
        serif: 'Georgia, "Times New Roman", serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    };

    function getUI(){
        if(typeof plannerData === 'undefined') return {...DEFAULT_UI};
        if(!plannerData.settings || typeof plannerData.settings !== 'object') plannerData.settings = {};
        if(!plannerData.settings.ui || typeof plannerData.settings.ui !== 'object') plannerData.settings.ui = {...DEFAULT_UI};
        const ui = plannerData.settings.ui;
        Object.keys(DEFAULT_UI).forEach(key => {
            if(ui[key] === undefined) ui[key] = DEFAULT_UI[key];
        });
        return ui;
    }

    function saveUI(){
        if(typeof savePlannerData === 'function') savePlannerData();
    }

    function applyUI(){
        const ui = getUI();
        const root = document.documentElement;
        root.style.setProperty('--planner-font', FONTS[ui.font] || FONTS.system);
        root.style.setProperty('--planner-accent', ui.accent || DEFAULT_UI.accent);
        root.style.setProperty('--planner-accent-soft', `${ui.accent || DEFAULT_UI.accent}1f`);

        const sizes = {small:'0.92', medium:'1', large:'1.08'};
        root.style.setProperty('--planner-font-scale', sizes[ui.fontSize] || '1');
        document.body.classList.toggle('planner-compact', !!ui.compact);
    }

    function ensureStyle(){
        if(document.getElementById('settingsCustomizationStyle')) return;
        const style = document.createElement('style');
        style.id = 'settingsCustomizationStyle';
        style.textContent = `
            :root { --planner-font: system-ui, sans-serif; --planner-accent: #304b8a; --planner-accent-soft: rgba(48,75,138,.12); --planner-font-scale: 1; }
            body { font-family: var(--planner-font) !important; }
            body .sidebar, body .sidebar * { font-family: var(--planner-font) !important; }
            body .main { font-size: calc(1rem * var(--planner-font-scale)); }
            body .save-button, body .calendar-today-button { border-color: var(--planner-accent); }
            body .nav-item.active { color: var(--planner-accent) !important; background: var(--planner-accent-soft) !important; }
            body .calendar-day.today { box-shadow: inset 0 3px 0 var(--planner-accent) !important; }
            body .planner-compact .card { padding-top: 14px; padding-bottom: 14px; }
            body .planner-compact .all-tasks-list > *, body .planner-compact .assignments-list > *, body .planner-compact .settings-list > * { margin-bottom: 5px !important; }
            .appearance-settings { margin-top: 4px; }
            .appearance-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
            .appearance-setting { display:flex; flex-direction:column; gap:6px; }
            .appearance-setting label { font-weight:600; font-size:13px; }
            .appearance-setting select, .appearance-setting input[type="color"] { min-height:38px; }
            .appearance-colour { display:flex; align-items:center; gap:10px; }
            .appearance-colour input[type="color"] { width:52px; padding:3px; }
            .appearance-actions { display:flex; justify-content:flex-end; margin-top:14px; }
            .appearance-reset { border:1px solid #ddd; background:#fff; border-radius:8px; padding:8px 12px; cursor:pointer; }
            @media(max-width:700px){ .appearance-grid { grid-template-columns:1fr; } }
        `;
        document.head.appendChild(style);
    }

    function ensureAppearanceCard(){
        const page = document.querySelector('#settingsPage');
        if(!page || document.querySelector('#appearanceSettingsCard')) return;

        const card = document.createElement('section');
        card.className = 'card settings-card appearance-settings';
        card.id = 'appearanceSettingsCard';
        card.innerHTML = `
            <div class="settings-heading">
                <div>
                    <h2>Appearance</h2>
                    <p>Adjust the planner to feel more like your own.</p>
                </div>
            </div>
            <div class="appearance-grid">
                <div class="appearance-setting">
                    <label for="plannerFontSetting">Font</label>
                    <select id="plannerFontSetting">
                        <option value="system">System</option>
                        <option value="sans">Arial</option>
                        <option value="serif">Georgia</option>
                        <option value="mono">Monospace</option>
                    </select>
                </div>
                <div class="appearance-setting">
                    <label for="plannerFontSizeSetting">Text size</label>
                    <select id="plannerFontSizeSetting">
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
                <div class="appearance-setting">
                    <label for="plannerAccentSetting">Accent colour</label>
                    <div class="appearance-colour">
                        <input id="plannerAccentSetting" type="color">
                        <span id="plannerAccentValue"></span>
                    </div>
                </div>
                <div class="appearance-setting">
                    <label for="plannerCompactSetting">Layout</label>
                    <select id="plannerCompactSetting">
                        <option value="false">Comfortable</option>
                        <option value="true">Compact</option>
                    </select>
                </div>
            </div>
            <div class="appearance-actions">
                <button type="button" class="appearance-reset" id="plannerAppearanceReset">Reset appearance</button>
            </div>
        `;
        page.appendChild(card);

        const ui = getUI();
        document.querySelector('#plannerFontSetting').value = ui.font;
        document.querySelector('#plannerFontSizeSetting').value = ui.fontSize;
        document.querySelector('#plannerAccentSetting').value = ui.accent;
        document.querySelector('#plannerCompactSetting').value = String(!!ui.compact);
        document.querySelector('#plannerAccentValue').textContent = ui.accent;

        document.querySelector('#plannerFontSetting').addEventListener('change', event => {
            ui.font = event.target.value;
            applyUI(); saveUI();
        });
        document.querySelector('#plannerFontSizeSetting').addEventListener('change', event => {
            ui.fontSize = event.target.value;
            applyUI(); saveUI();
        });
        document.querySelector('#plannerAccentSetting').addEventListener('input', event => {
            ui.accent = event.target.value;
            document.querySelector('#plannerAccentValue').textContent = ui.accent;
            applyUI(); saveUI();
        });
        document.querySelector('#plannerCompactSetting').addEventListener('change', event => {
            ui.compact = event.target.value === 'true';
            applyUI(); saveUI();
        });
        document.querySelector('#plannerAppearanceReset').addEventListener('click', () => {
            Object.assign(ui, DEFAULT_UI);
            document.querySelector('#plannerFontSetting').value = ui.font;
            document.querySelector('#plannerFontSizeSetting').value = ui.fontSize;
            document.querySelector('#plannerAccentSetting').value = ui.accent;
            document.querySelector('#plannerCompactSetting').value = 'false';
            document.querySelector('#plannerAccentValue').textContent = ui.accent;
            applyUI(); saveUI();
        });
    }

    function install(){
        if(typeof plannerData === 'undefined') return false;
        ensureStyle();
        applyUI();
        ensureAppearanceCard();
        return true;
    }

    document.addEventListener('DOMContentLoaded', install, {once:true});
    window.addEventListener('load', install, {once:true});
    window.addEventListener('hashchange', () => {
        if(window.location.hash.toLowerCase() === '#settings'){
            ensureAppearanceCard();
            applyUI();
        }
    });
})();
