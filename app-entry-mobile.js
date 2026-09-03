(() => {
  const views = ['today', 'calendar', 'tasks', 'school', 'more'];
  const buttons = document.querySelectorAll('.bottom button');

  function render(view) {
    if (window.PlannerAppNavigation?.render) window.PlannerAppNavigation.render(view);
    const c = document.getElementById('content');
    if (!c) return;
    if (view === 'today' && window.PlannerMobileUI) window.PlannerMobileUI.renderToday(c);
    else if (view === 'tasks' && window.PlannerMobileUI) window.PlannerMobileUI.renderTasks(c);
    else if (view === 'more' && window.PlannerMobileUI) window.PlannerMobileUI.renderMore(c);
    else if (view === 'school' && window.PlannerAppSchool) window.PlannerAppSchool.render(c);
    else if (view === 'calendar' && window.PlannerAppCalendar) window.PlannerAppCalendar.render(c);
  }

  buttons.forEach((button, i) => {
    button.dataset.view = views[i];
    button.onclick = () => render(views[i]);
  });
  if (window.PlannerAppSettings) window.PlannerAppSettings.apply();
  render('today');
})();
