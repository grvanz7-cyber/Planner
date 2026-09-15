(() => {
  const pages = {
    dashboard: { title: "Dashboard", subtitle: "What matters today, what is coming up, and what you can do next.", cards: [["Quick Capture", "Add something from anywhere using the field above."], ["Today", "Your actual planner items will appear here once the data layer is added."]] },
    calendar: { title: "Calendar", subtitle: "A calendar view of your planner items.", cards: [["Calendar foundation", "Day, week, month, filters, and scheduling will be added in a later stage."]] },
    subjects: { title: "Subjects", subtitle: "Your courses, units, grades, and academic progress.", cards: [["Subjects foundation", "Subjects and units are connected to the planner data model."]] },
    study: { title: "Study", subtitle: "Study plans, sessions, and focused work.", cards: [["Study foundation", "Study plans and sessions will be added after the academic data foundation is stable."]] },
    grades: { title: "Grades", subtitle: "Understand your current grades and how they are calculated.", cards: [["Grades foundation", "Grade storage and calculations will be introduced in a later stage."]] },
    search: { title: "Search", subtitle: "Find existing planner information quickly.", cards: [["Search foundation", "Search will work against the single planner data source once that source exists."]] },
    settings: { title: "Settings", subtitle: "Configure Planner to work the way you want.", cards: [["Settings foundation", "Configuration will be connected to real planner data later. Nothing is being hardcoded into the core logic."]] }
  };
  const pageElement=document.getElementById("page"),notificationButton=document.getElementById("notificationButton"),notificationPanel=document.getElementById("notificationPanel"),notificationBadge=document.getElementById("notificationBadge"),notificationCount=document.getElementById("notificationCount"),quickCapture=document.getElementById("quickCapture");
  function getPageFromHash(){const value=window.location.hash.replace(/^#/,"");return pages[value]?value:"dashboard";}
  function renderPage(pageName){const page=pages[pageName]||pages.dashboard;pageElement.innerHTML=`<div class="page-header"><h1>${page.title}</h1><p>${page.subtitle}</p></div><div class="placeholder-grid">${page.cards.map(([title,text])=>`<article class="placeholder-card"><h2>${title}</h2><p>${text}</p></article>`).join("")}</div>`;document.querySelectorAll(".nav-item").forEach(button=>button.classList.toggle("active",button.dataset.page===pageName));}
  function navigate(pageName){if(!pages[pageName])return;if(getPageFromHash()===pageName)renderPage(pageName);else window.location.hash=pageName;}
  document.querySelectorAll(".nav-item").forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.page)));
  window.addEventListener("hashchange",()=>renderPage(getPageFromHash()));
  notificationButton.addEventListener("click",event=>{event.stopPropagation();const isOpen=!notificationPanel.classList.contains("hidden");notificationPanel.classList.toggle("hidden",isOpen);notificationButton.setAttribute("aria-expanded",String(!isOpen));});
  notificationPanel.addEventListener("click",event=>event.stopPropagation());document.addEventListener("click",()=>{notificationPanel.classList.add("hidden");notificationButton.setAttribute("aria-expanded","false");});
  quickCapture.addEventListener("keydown",event=>{if(event.key!=="Enter")return;event.preventDefault();const value=quickCapture.value.trim();if(!value)return;quickCapture.value="";if(window.PlannerAssignments)window.PlannerAssignments.showAddAssignment(value);else{quickCapture.placeholder=`Ready to capture: ${value}`;window.setTimeout(()=>{quickCapture.placeholder="What do you need to add?";},1800);}});
  function setNotificationCount(count){notificationCount.textContent=String(count);notificationBadge.textContent=String(count);notificationBadge.classList.toggle("hidden",count===0);}
  setNotificationCount(0);renderPage(getPageFromHash());
})();
