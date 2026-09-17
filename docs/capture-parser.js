(() => {
  const aliases={physics:["physics","phys","sph4u"],chemistry:["chemistry","chem","sch4u"],biology:["biology","bio","sbi4u"],english:["english","eng"],mathematics:["mathematics","math","maths","mcr3u"]};
  const genericNames=new Set(["test","tests","quiz","quizzes","exam","exams","assessment","assessments","essay","essays","lab","labs","assignment","assignments","worksheet","worksheets","project","projects","presentation","presentations","report","reports"]);
  function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
  function tokenRegex(token){return new RegExp(`(^|\\s)${escapeRegExp(token)}(?=\\s|$)`,"i");}
  function localDateString(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
  function parse(text){
    let remaining=text.trim();const subjects=window.PlannerData.getData().subjects||[];let subject=null;
    const actual=subjects.map(s=>({subject:s,token:s.name})).sort((a,b)=>b.token.length-a.token.length);
    for(const item of actual){if(tokenRegex(item.token).test(remaining)){subject=item.subject;remaining=remaining.replace(tokenRegex(item.token)," ");break;}}
    if(!subject){const aliasList=Object.entries(aliases).flatMap(([name,words])=>words.map(word=>({name,word}))).sort((a,b)=>b.word.length-a.word.length);for(const item of aliasList){if(tokenRegex(item.word).test(remaining)){subject=subjects.find(s=>s.name.toLowerCase()===item.name.toLowerCase())||null;if(subject)remaining=remaining.replace(tokenRegex(item.word)," ");break;}}}
    let unitNumber=null;remaining=remaining.replace(/\bunit\s*(\d+)\b/i,(_,n)=>{unitNumber=Number(n);return " ";});
    let dueDate=null;const today=new Date();today.setHours(0,0,0,0);const weekdays={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
    remaining=remaining.replace(/\b(today|tomorrow)\b/i,word=>{const date=new Date(today);if(word.toLowerCase()==="tomorrow")date.setDate(date.getDate()+1);dueDate=localDateString(date);return " ";});
    if(!dueDate)remaining=remaining.replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,word=>{const date=new Date(today);const target=weekdays[word.toLowerCase()];let difference=(target-date.getDay()+7)%7;if(difference===0)difference=7;date.setDate(date.getDate()+difference);dueDate=localDateString(date);return " ";});
    let estimatedWorkload=null;remaining=remaining.replace(/\b(1h30|2h|1h|15m|30m|45m)\b/i,value=>{estimatedWorkload=value.toLowerCase();return " ";});remaining=remaining.replace(/\b(15|30|45)\s*minutes?\b/i,(_,n)=>{estimatedWorkload=`${n}m`;return " ";});remaining=remaining.replace(/\b1\s*hour\s*30\s*minutes?\b/i,()=>{estimatedWorkload="1h30";return " ";});remaining=remaining.replace(/\b(1|2)\s*hours?\b/i,(_,n)=>{estimatedWorkload=`${n}h`;return " ";});
    let type="Assignment";if(/\b(test|tests|quiz|quizzes|exam|assessment)\b/i.test(remaining))type="Assessment";else if(/\b(culminating|culminating task|final project)\b/i.test(remaining))type="Culminating";
    let priority=null;if(/\bhigh priority\b/i.test(remaining)){priority="High";remaining=remaining.replace(/\bhigh priority\b/i," ");}else if(/\blow priority\b/i.test(remaining)){priority="Low";remaining=remaining.replace(/\blow priority\b/i," ");}
    let status=null;const statuses=["in progress","not started","finished","submitted","graded"];for(const value of statuses){const re=new RegExp(`\\b${escapeRegExp(value)}\\b`,"i");if(re.test(remaining)){status=value.replace(/^./,c=>c.toUpperCase());remaining=remaining.replace(re," ");break;}}
    let name=remaining.replace(/\s+/g," ").trim()||text.trim();if(subject&&genericNames.has(name.toLowerCase()))name=`${subject.name} ${name}`;name=name.charAt(0).toUpperCase()+name.slice(1);
    return {name,subjectId:subject?subject.id:null,unitNumber,dueDate,estimatedWorkload,type,priority,status};
  }
  function findUnit(subject,unitNumber){if(!subject||unitNumber==null)return null;return (window.PlannerData.getData().units||[]).filter(u=>u.subjectId===subject.id).find(u=>Number(u.number)===Number(unitNumber))||null;}
  function createFromCapture(text){
    const parsed=parse(text);const data=window.PlannerData.getData();const subject=parsed.subjectId?(data.subjects||[]).find(s=>s.id===parsed.subjectId):null;const unit=findUnit(subject,parsed.unitNumber);
    const assignment=window.PlannerData.create("assignments",{name:parsed.name,subjectId:parsed.subjectId,type:parsed.type,unitId:unit?unit.id:null,dueDate:parsed.dueDate,dueTime:null,dueTimeMode:"No time specified",priority:parsed.priority||"Normal",estimatedWorkload:parsed.estimatedWorkload,status:parsed.status||"Not started",notes:"",resources:[],grade:null,tasks:[],studyPlanId:null});
    if(!parsed.subjectId)addCaptureNotification(`Could not identify a subject for “${text}”.`,assignment.id);
    if(parsed.unitNumber!=null&&!unit)addCaptureNotification(`${assignment.name} needs Unit ${parsed.unitNumber} to be checked.`,assignment.id);
    window.dispatchEvent(new CustomEvent("planner:assignment-created",{detail:assignment}));return assignment;
  }
  function addCaptureNotification(message,itemId){const data=window.PlannerData.getData();if(!Array.isArray(data.notifications))data.notifications=[];data.notifications.push({id:`notif_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,type:"Confirmation",title:"Quick Capture needs attention",message,itemType:"assignment",itemId,read:false,resolved:false,createdAt:new Date().toISOString()});window.PlannerData.save();window.dispatchEvent(new CustomEvent("planner:notifications-changed"));}
  const original=window.PlannerAssignments&&window.PlannerAssignments.showAddAssignment;if(!original)return;window.PlannerAssignments.openSmartCapture=text=>createFromCapture(text);
})();