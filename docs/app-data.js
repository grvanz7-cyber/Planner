window.PlannerData = window.PlannerData || (() => {
  const STORAGE_KEY = "planner-v2-data";
  const VERSION = 1;
  const defaults = { version: VERSION, settings: {}, subjects: [], units: [], assignments: [], tasks: [], studyPlans: [], studySessions: [], events: [], grades: [], notifications: [] };
  function now(){return new Date().toISOString();}
  function id(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36);}
  function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return structuredClone(defaults);const parsed=JSON.parse(raw);return {...structuredClone(defaults),...parsed};}catch(e){return structuredClone(defaults);}}
  let store=load();
  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(store));window.dispatchEvent(new CustomEvent("planner:data-changed"));}
  function create(type,value={}){const item={id:id(),createdAt:now(),updatedAt:now(),...value};if(!Array.isArray(store[type]))store[type]=[];store[type].push(item);save();return item;}
  function update(type,itemId,changes){const list=store[type];if(!Array.isArray(list))return null;const item=list.find(x=>x.id===itemId);if(!item)return null;Object.assign(item,changes,{updatedAt:now()});save();return item;}
  function remove(type,itemId){const list=store[type];if(!Array.isArray(list))return false;const i=list.findIndex(x=>x.id===itemId);if(i<0)return false;list.splice(i,1);save();return true;}
  function find(type,itemId){return Array.isArray(store[type])?store[type].find(x=>x.id===itemId)||null:null;}
  return {version:VERSION,storageKey:STORAGE_KEY,getData:()=>store,create,update,remove,find,save,reset:()=>{store=structuredClone(defaults);save();}};
})();
