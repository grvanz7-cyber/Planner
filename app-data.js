// Shared read-only data adapter for the mobile app shell.
// It intentionally uses the same localStorage keys as the existing planner.
(function () {
  const raw = localStorage.getItem('plannerData');
  let data = null;

  try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = null; }

  if (!data) {
    try {
      data = {
        tasks: JSON.parse(localStorage.getItem('plannerTasks') || '[]') || [],
        settings: {}
      };
    } catch (_) {
      data = { tasks: [], settings: {} };
    }
  }

  window.PlannerAppData = {
    getTasks() {
      return Array.isArray(data.tasks) ? data.tasks : [];
    },
    refresh() {
      try {
        const latest = JSON.parse(localStorage.getItem('plannerData') || 'null');
        if (latest) data = latest;
      } catch (_) {}
      return this.getTasks();
    }
  };
})();
