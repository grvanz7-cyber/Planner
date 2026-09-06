// ========================================
// PLANNER DATA LAYER
// ========================================
// Shared interface over the planner's EXISTING global plannerData object.
(function installPlannerDataLayer(){
    const STORAGE_KEY='plannerData';
    const CHANGE_EVENT='planner-data-changed';

    function getData(){
        try{
            if(typeof plannerData!=='undefined' && plannerData && typeof plannerData==='object') return plannerData;
        }catch(e){}
        return null;
    }

    function ensureSchema(){
        const data=getData();
        if(!data) return null;
        if(!data.settings || typeof data.settings!=='object' || Array.isArray(data.settings)) data.settings={};
        if(!Array.isArray(data.settings.subjects)) data.settings.subjects=[];
        if(!Array.isArray(data.settings.types)) data.settings.types=[];
        if(!Array.isArray(data.tasks)) data.tasks=[];
        if(!Array.isArray(data.grades)) data.grades=[];
        if(!Array.isArray(data.gradeAssessments)) data.gradeAssessments=[];
        if(!data.gradeSettings || typeof data.gradeSettings!=='object' || Array.isArray(data.gradeSettings)) data.gradeSettings={};
        return data;
    }

    function emit(reason){
        try{document.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{reason:reason||'changed',timestamp:Date.now()}}));}
        catch(e){document.dispatchEvent(new Event(CHANGE_EVENT));}
    }

    function save(reason){
        const data=ensureSchema();
        if(!data)return;
        if(typeof window.savePlannerData==='function') window.savePlannerData();
        else{
            localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
            localStorage.setItem('plannerTasks',JSON.stringify(data.tasks));
        }
        emit(reason||'save');
    }

    const PlannerDB={
        version:2,
        events:{changed:CHANGE_EVENT},
        getData(){return ensureSchema();},
        getTasks(){return ensureSchema()?.tasks||[];},
        getSubjects(options={}){
            const subjects=ensureSchema()?.settings?.subjects||[];
            return options.activeOnly?subjects.filter(s=>s&&s.active!==false):subjects;
        },
        getTask(id){return this.getTasks().find(t=>String(t?.id)===String(id))||null;},
        getSchoolwork(){
            const schoolTypes=['assignment','quiz','test','exam','lab','project','presentation','essay','report','assessment'];
            return this.getTasks().filter(t=>{
                const type=String(t?.type||'').toLowerCase();
                const tags=Array.isArray(t?.tags)?t.tags.map(String):[];
                return tags.some(tag=>tag.toLowerCase()==='#school')||schoolTypes.includes(type);
            });
        },
        getAssignments(){return this.getTasks().filter(t=>String(t?.type||'').toLowerCase()==='assignment');},
        getAssessments(){return this.getTasks().filter(t=>['quiz','test','exam'].includes(String(t?.type||'').toLowerCase()));},
        getGrades(){return ensureSchema()?.grades||[];},
        getGradeAssessments(){return ensureSchema()?.gradeAssessments||[];},
        getGradeSettings(){return ensureSchema()?.gradeSettings||{};},
        save,
        notify(reason){emit(reason||'changed');}
    };

    window.PlannerDB=PlannerDB;

    if(typeof window.savePlannerData==='function'&&!window.savePlannerData.__plannerDataLayerWrapped){
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

    window.addEventListener('storage',event=>{
        if(event.key!==STORAGE_KEY && event.key!=='plannerTasks')return;
        emit('storage');
    });
})();
