(() => {
  const views = ['today', 'calendar', 'tasks', 'school', 'more'];
  const buttons = document.querySelectorAll('.bottom button');

  function render(view) {
    if (window.PlannerAppNavigation?.render) window.PlannerAppNavigation.render(view);
    const content = document.getElementById('content');
    if (!content) return;
    if (view === 'today' && window.PlannerMobileUI) window.PlannerMobileUI.renderToday(content);
    else if (view === 'tasks' && window.PlannerMobileUI) window.PlannerMobileUI.renderTasks(content);
    else if (view === 'more' && window.PlannerMobileUI) window.PlannerMobileUI.renderMore(content);
    else if (view === 'school' && window.PlannerAppSchool) window.PlannerAppSchool.render(content);
    else if (view === 'calendar' && window.PlannerAppCalendar) window.PlannerAppCalendar.render(content);
  }

  buttons.forEach((button, i) => {
    button.dataset.view = views[i];
    button.onclick = () => render(views[i]);
  });
  if (window.PlannerAppSettings) window.PlannerAppSettings.apply();
  render('today');

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
})();
