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
// OPEN TASK MODAL
// ========================================

function openTaskModal() {

    const modal =
        document.querySelector("#taskModal");

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
        document.querySelector("#taskModal");

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
    // TODAY
    // ========================================

    if (
        activeTasks.length === 0
    ) {

        todayContainer.innerHTML = `
            <p class="empty-message">
                Nothing here yet!
            </p>
        `;

    }

    else {

        activeTasks.forEach(
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
        activeTasks.filter(
            task => task.dueDate
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
// CREATE TODAY TASK ELEMENT
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
                ${escapeHTML(subjectText)}
            </div>

        </div>

        <span class="priority">
            ${escapeHTML(task.priority)}
        </span>

    `;


    return taskElement;

}



// ========================================
// CREATE UPCOMING TASK ELEMENT
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
                Due ${escapeHTML(
                    formatDate(task.dueDate)
                )}
            </div>

        </div>

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
        new Date(
            dateString + "T00:00:00"
        );


    return date.toLocaleDateString(
        undefined,
        {
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
