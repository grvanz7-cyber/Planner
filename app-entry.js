(() => {
  const navItems = document.querySelectorAll('.bottom button');
  const views = ['today', 'calendar', 'tasks', 'school', 'more'];

  function render(view) {
    if (window.PlannerAppNavigation && typeof window.PlannerAppNavigation.render === 'function') {
      window.PlannerAppNavigation.render(view);
    }

    if (view === 'more' && window.PlannerAppSettings) {
      const content = document.getElementById('content');
      if (content) window.PlannerAppSettings.render(content);
    }

    if (view === 'school' && window.PlannerAppSchool) {
      const content = document.getElementById('content');
      if (content) window.PlannerAppSchool.render(content);
    }

    if (view === 'tasks' && window.PlannerAppTasks) {
      const content = document.getElementById('content');
      if (content) window.PlannerAppTasks.render(content);
    }

    if (view === 'calendar' && window.PlannerAppCalendar) {
      const content = document.getElementById('content');
      if (content) window.PlannerAppCalendar.render(content);
    }
  }

  navItems.forEach((button, index) => {
    button.dataset.view = views[index];
    button.addEventListener('click', () => render(views[index]));
  });

  if (window.PlannerAppSettings) window.PlannerAppSettings.apply();
  render('today');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
})();
