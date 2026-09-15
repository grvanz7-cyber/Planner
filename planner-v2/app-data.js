/*
 * Planner v2 — data foundation
 *
 * One source of truth for planner data. UI code should read/write through
 * this module rather than keeping separate copies of the same information.
 */
(() => {
  const STORAGE_KEY = "planner-v2-data";
  const VERSION = 1;

  const emptyData = () => ({
    version: VERSION,
    settings: {
      defaults: {
        assignmentPriority: "Normal",
        assignmentStatus: "Not started",
        assignmentDueTime: "No time specified",
        taskPriority: "Normal",
        studySessionMinutes: 30
      }
    },
    subjects: [],
    units: [],
    assignments: [],
    tasks: [],
    studyPlans: [],
    studySessions: [],
    events: [],
    grades: [],
    notifications: []
  });

  function makeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return emptyData();
      const parsed = JSON.parse(saved);
      return normalize(parsed);
    } catch (error) {
      console.warn("Planner data could not be loaded; starting with empty data.", error);
      return emptyData();
    }
  }

  function normalize(data) {
    const base = emptyData();
    const source = data && typeof data === "object" ? data : {};

    return {
      ...base,
      ...source,
      version: VERSION,
      settings: {
        ...base.settings,
        ...(source.settings || {}),
        defaults: {
          ...base.settings.defaults,
          ...((source.settings || {}).defaults || {})
        }
      },
      subjects: Array.isArray(source.subjects) ? source.subjects : [],
      units: Array.isArray(source.units) ? source.units : [],
      assignments: Array.isArray(source.assignments) ? source.assignments : [],
      tasks: Array.isArray(source.tasks) ? source.tasks : [],
      studyPlans: Array.isArray(source.studyPlans) ? source.studyPlans : [],
      studySessions: Array.isArray(source.studySessions) ? source.studySessions : [],
      events: Array.isArray(source.events) ? source.events : [],
      grades: Array.isArray(source.grades) ? source.grades : [],
      notifications: Array.isArray(source.notifications) ? source.notifications : []
    };
  }

  let data = load();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("planner:data-changed"));
  }

  function getData() {
    return data;
  }

  function create(type, value) {
    const collection = data[type];
    if (!Array.isArray(collection)) throw new Error(`Unknown data collection: ${type}`);

    const item = {
      id: value?.id || makeId(type.slice(0, -1)),
      createdAt: value?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...value
    };

    collection.push(item);
    save();
    return item;
  }

  function update(type, id, changes) {
    const collection = data[type];
    if (!Array.isArray(collection)) throw new Error(`Unknown data collection: ${type}`);

    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return null;

    collection[index] = {
      ...collection[index],
      ...changes,
      id: collection[index].id,
      updatedAt: new Date().toISOString()
    };
    save();
    return collection[index];
  }

  function remove(type, id) {
    const collection = data[type];
    if (!Array.isArray(collection)) throw new Error(`Unknown data collection: ${type}`);

    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return false;

    collection.splice(index, 1);
    save();
    return true;
  }

  function find(type, id) {
    const collection = data[type];
    if (!Array.isArray(collection)) return null;
    return collection.find(item => item.id === id) || null;
  }

  function reset() {
    data = emptyData();
    save();
  }

  window.PlannerData = Object.freeze({
    getData,
    create,
    update,
    remove,
    find,
    reset,
    save,
    get storageKey() { return STORAGE_KEY; },
    get version() { return VERSION; }
  });
})();
