document.getElementById('openPlanner').onclick=()=>chrome.tabs.create({url:'https://grvanz7-cyber.github.io/Planner/'});
document.getElementById('focus').onclick=()=>{document.getElementById('status').textContent='Open the Planner Focus Space to start a full session.';chrome.tabs.create({url:'https://grvanz7-cyber.github.io/Planner/?v=20260907#focus'});};
