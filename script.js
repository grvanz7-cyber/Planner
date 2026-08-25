// ========================================
// PLANNER DATA
// ========================================

let tasks =
    JSON.parse(
        localStorage.getItem("plannerTasks")
    ) || [];



// ========================================
// SAVE TASKS
// ========================================

function saveTasks() {

    localStorage.setItem(
        "plannerTasks",
        JSON.stringify(tasks)
    );

}



// ========================================
// DATE HELPERS
// ========================================

function getToday() {

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    return today;

}


function getDateOnly(dateString) {

    if (!dateString) {

        return null;

    }

    const date =
        new Date(
            dateString + "T00:00:00"
        );

    date.setHours(
        0,
        0,
        0,
        0
    );

    return date;

}



// ========================================
// CHECK IF TASK IS TODAY
// ========================================

function isToday(task) {

    if (!task.dueDate) {

        return false;

    }

    const taskDate =
        getDateOnly(task.dueDate);

    const today =
        getToday();


    return (
        taskDate.getTime() ===
        today.getTime()
    );

}



// ========================================
// CHECK IF TASK IS OVERDUE
// ========================================

function isOverdue(task) {

    if (!task.dueDate) {

        return false;

    }

    const taskDate =
        getDateOnly(task.dueDate);

    const today =
        getToday();


    return taskDate < today;

}



// ========================================
// CHECK IF TASK IS UPCOMING
// ========================================

function isUpcoming(task) {

    if (!task.dueDate) {

        return false;

    }

    const taskDate =
        getDateOnly(task.dueDate);

    const today =
        getToday();


    return taskDate > today;

}



// ========================================
// OPEN TASK MODAL
// ========================================

function openTaskModal() {

    const modal =
        document.querySelector(
            "#taskModal"
        );

    modal.classList.add("open");

    document
        .querySelector("#taskName")
        .focus();

}



// ========================================
// CLOSE TASK MODAL
// ========================================

function closeTaskModal() {

    const modal =
        document.querySelector(
            "#taskModal"
        );

    modal.classList.remove("open");

    clearTaskForm();

}



// ========================================
// QUICK ADD
// ========================================

function addTask() {

    const input =
        document.querySelector(
            ".quick-add input"
        );

    const name =
        input.value.trim();


    if (name === "") {

        openTaskModal();

        return;

    }


    document
        .querySelector("#taskName")
        .value = name;

    input.value = "";

    openTaskModal();

}



// ========================================
// CREATE TASK
// ========================================

function createTask() {

    const name =
        document
            .querySelector("#taskName")
            .value
            .trim();


    if (name === "") {

        alert(
            "Please enter a task name."
        );

        return;

    }


    const subject =
        document
            .querySelector("#taskSubject")
            .value;


    const type =
        document
            .querySelector("#taskType")
            .value;


    const dueDate =
        document
            .querySelector("#taskDueDate")
            .value;


    const priority =
        document
            .querySelector("#taskPriority")
            .value;


    const tagText =
        document
            .querySelector("#taskTags")
            .value;


    const tags =
        tagText
            .split(",")
            .map(
                tag => tag.trim()
            )
            .filter(
                tag => tag !== ""
            );


    const task = {

        id: Date.now(),

        name: name,

        subject: subject,

        type: type,

        priority: priority,

        dueDate:
            dueDate || null,

        tags: tags,

        completed: false,

        createdAt:
            new Date().toISOString()

    };


    tasks.push(task);

    saveTasks();

    closeTaskModal();

    renderTasks();

}



// ========================================
// CLEAR TASK FORM
// ========================================

function clearTaskForm() {

    document
        .querySelector("#taskName")
        .value = "";


    document
        .querySelector("#taskSubject")
        .value = "";


    document
        .querySelector("#taskType")
        .value = "Task";


    document
        .querySelector("#taskDueDate")
        .value = "";


    document
        .querySelector("#taskPriority")
        .value = "Normal";


    document
        .querySelector("#taskTags")
        .value = "";

}



// ========================================
// COMPLETE TASK
// ========================================

function toggleTask(id) {

    const task =
        tasks.find(
            task => task.id === id
        );


    if (!task) {

        return;

    }


    task.completed =
        !task.completed;


    saveTasks();

    renderTasks();

}



// ========================================
// DISPLAY TASKS
// ========================================

function renderTasks() {

    const todayContainer =
        document.querySelector(
            ".today-tasks"
        );


    const upcomingContainer =
        document.querySelector(
            ".upcoming-tasks"
        );


    if (
        !todayContainer ||
        !upcomingContainer
    ) {

        return;

    }


    todayContainer.innerHTML = "";

    upcomingContainer.innerHTML = "";


    const activeTasks =
        tasks.filter(
            task => !task.completed
        );



    // ========================================
    // TODAY + OVERDUE
    // ========================================

    const todayTasks =
        activeTasks.filter(
            task =>
                !task.dueDate ||
                isToday(task) ||
                isOverdue(task)
        );


    if (
        todayTasks.length === 0
    ) {

        todayContainer.innerHTML = `
            <p class="empty-message">
                Nothing here yet!
            </p>
        `;

    }

    else {

        todayTasks.forEach(
            task => {

                todayContainer.appendChild(
                    createTaskElement(task)
                );

            }
        );

    }



    // ========================================
    // UPCOMING
    // ========================================

    const upcomingTasks =
        activeTasks
            .filter(
                task => isUpcoming(task)
            )
            .sort(
                (a, b) =>
                    getDateOnly(a.dueDate) -
                    getDateOnly(b.dueDate)
            );


    if (
        upcomingTasks.length === 0
    ) {

        upcomingContainer.innerHTML = `
            <p class="empty-message">
                Nothing upcoming!
            </p>
        `;

    }

    else {

        upcomingTasks.forEach(
            task => {

                upcomingContainer.appendChild(
                    createUpcomingElement(task)
                );

            }
        );

    }

}



// ========================================
// CREATE TODAY TASK
// ========================================

function createTaskElement(task) {

    const taskElement =
        document.createElement("div");


    taskElement.className =
        "task";


    const subjectText =
        task.subject
            ? `${task.subject} · ${task.type}`
            : task.type;


    let dateText = "";


    if (isOverdue(task)) {

        dateText = "Overdue";

    }

    else if (isToday(task)) {

        dateText = "Today";

    }


    if (dateText !== "") {

        dateText =
            ` · ${dateText}`;

    }


    taskElement.innerHTML = `

        <input
            type="checkbox"
            onchange="toggleTask(${task.id})"
        >

        <div class="task-info">

            <div class="task-name">
                ${escapeHTML(task.name)}
            </div>

            <div class="task-meta">
                ${escapeHTML(
                    subjectText + dateText
                )}
            </div>

        </div>

        <span class="priority">
            ${escapeHTML(task.priority)}
        </span>

    `;


    return taskElement;

}



// ========================================
// CREATE UPCOMING TASK
// ========================================

function createUpcomingElement(task) {

    const taskElement =
        document.createElement("div");


    taskElement.className =
        "task";


    taskElement.innerHTML = `

        <div class="task-info">

            <div class="task-name">
                ${escapeHTML(task.name)}
            </div>

            <div class="task-meta">
                ${escapeHTML(
                    formatDate(task.dueDate)
                )}
            </div>

        </div>

        <span class="priority">
            ${escapeHTML(task.priority)}
        </span>

    `;


    return taskElement;

}



// ========================================
// FORMAT DATE
// ========================================

function formatDate(dateString) {

    if (!dateString) {

        return "";

    }


    const date =
        getDateOnly(dateString);


    return date.toLocaleDateString(
        undefined,
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    );

}



// ========================================
// BASIC HTML SAFETY
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent = text;


    return div.innerHTML;

}



// ========================================
// START PLANNER
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const input =
            document.querySelector(
                ".quick-add input"
            );


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    addTask();

                }

            }
        );


        renderTasks();

    }
);
