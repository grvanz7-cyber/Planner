// ========================================
// PLANNER DATA LAYER
// ========================================
// One shared interface for planner data. The current storage backend is
// localStorage, but pages/widgets should use PlannerDB instead of inventing
// their own data sources. This makes the storage backend replaceable later.
(function installPlannerDataLayer(){
    const STORAGE_KEY='plannerData';
    const CHANGE_EVENT='planner-data-changed';

    function ensureSchema(){
        if(typeof window.plannerData!=='object' || !window.plannerData || Array.isArray(window.plannerData)){
            window.plannerData={};
        }

        if(!window.plannerData.settings || typeof window.plannerData.settings!=='object' || Array.isArray(window.plannerData.settings)){
            window.plannerData.settings={};
        }

        if(!Array.isArray(window.plannerData.settings.subjects))window.plannerData.settings.subjects=[];
        if(!Array.isArray(window.plannerData.settings.types))window.plannerData.settings.types=[];
        if(!Array.isArray(window.plannerData.tasks))window.plannerData.tasks=[];
        if(!Array.isArray(window.plannerData.grades))window.plannerData.grades=[];
        if(!Array.isArray(window.plannerData.gradeAssessments))window.plannerData.gradeAssessments=[];
        if(!window.plannerData.gradeSettings || typeof window.plannerData.gradeSettings!=='object' || Array.isArray(window.plannerData.gradeSettings))window.plannerData.gradeSettings={};

        return window.plannerData;
    }

    function emit(reason){
        try{
            document.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{reason:reason||'changed',timestamp:Date.now()}}));
        }catch(e){
            document.dispatchEvent(new Event(CHANGE_EVENT));
        }
    }

    function save(reason){
        ensureSchema();
        if(typeof window.savePlannerData==='function'){
            window.savePlannerData();
        }else{
            localStorage.setItem(STORAGE_KEY,JSON.stringify(window.plannerData));
            localStorage.setItem('plannerTasks',JSON.stringify(window.plannerData.tasks));
        }
        emit(reason||'save');
    }

    const PlannerDB={
        version:1,
        events:{changed:CHANGE_EVENT},

        getData(){return ensureSchema();},
        getTasks(){return ensureSchema().tasks;},
        getSubjects(options={}){
            const subjects=ensureSchema().settings.subjects;
            return options.activeOnly ? subjects.filter(s=>s&&s.active!==false) : subjects;
        },
        getTask(id){return this.getTasks().find(t=>String(t?.id)===String(id))||null;},
        getSchoolwork(){
            const schoolTypes=['assignment','quiz','test','exam','lab','project','presentation','essay','report','assessment'];
            return this.getTasks().filter(t=>{
                const type=String(t?.type||'').toLowerCase();
                const tags=Array.isArray(t?.tags)?t.tags.map(String):[];
                return tags.some(tag=>tag.toLowerCase()==='#school') || schoolTypes.includes(type);
            });
        },
        getAssignments(){return this.getTasks().filter(t=>String(t?.type||'').toLowerCase()==='assignment');},
        getAssessments(){return this.getTasks().filter(t=>['quiz','test','exam'].includes(String(t?.type||'').toLowerCase()));},
        getGrades(){return ensureSchema().grades;},
        getGradeAssessments(){return ensureSchema().gradeAssessments;},
        getGradeSettings(){return ensureSchema().gradeSettings;},
        save,
        notify(reason){emit(reason||'changed');}
    };

    ensureSchema();
    window.PlannerDB=PlannerDB;

    // Existing pages currently call savePlannerData() directly. Wrap it once
    // so every existing mutation also becomes a data-layer change event.
    if(typeof window.savePlannerData==='function' && !window.savePlannerData.__plannerDataLayerWrapped){
        const originalSave=window.savePlannerData;
        const wrappedSave=function(){
            const result=originalSave.apply(this,arguments);
            emit('savePlannerData');
            return result;
        };
        wrappedSave.__plannerDataLayerWrapped=true;
        wrappedSave.__original=originalSave;
        window.savePlannerData=wrappedSave;
    }

    // Keep another browser tab/window in sync when localStorage changes.
    window.addEventListener('storage',event=>{
        if(event.key===STORAGE_KEY){
            try{
                const parsed=event.newValue?JSON.parse(event.newValue):null;
                if(parsed && typeof parsed==='object')window.plannerData=parsed;
                ensureSchema();
                emit('storage');
            }catch(e){}
        }
    });
})();
