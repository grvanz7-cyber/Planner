// ========================================
// PLANNER DATA
// ========================================

let tasks = JSON.parse(localStorage.getItem("plannerTasks")) || [];


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

    const modal = document.querySelector("#taskModal");

    modal.classList.add("open");

    document.querySelector("#taskName").focus();

}


// ========================================
// CLOSE TASK MODAL
// ========================================

function closeTaskModal() {

    const modal = document.querySelector("#taskModal");

    modal.classList.remove("open");

    clearTaskForm();

}


// ========================================
// QUICK ADD
// ========================================

function addTask() {

    const input =
        document.querySelector(".quick-add input");

    const name = input.value.trim();


    if (name === "") {

        openTaskModal();

        return;

    }


    document.querySelector("#taskName").value = name;

    input.value = "";

    openTaskModal();

}


// ========================================
// CREATE TASK
// ========================================

function createTask() {

    const name =
        document.querySelector("#taskName").value.trim();


    if (name === "") {

        alert("Please enter a task name.");

        return;

    }


    const subject =
        document.querySelector("#taskSubject").value;

    const type =
        document.querySelector("#taskType").value;

    const dueDate =
        document.querySelector("#taskDueDate").value;

    const priority =
        document.querySelector("#taskPriority").value;

    const tagText =
        document.querySelector("#taskTags").value;


    const tags = tagText
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag !== "");


    const task = {

        id: Date.now(),

        name: name,

        subject: subject,

        type: type,

        priority: priority,

        dueDate: dueDate || null,

        tags: tags,

        completed: false,

        createdAt: new Date().toISOString()

    };


    tasks.push(task);

    saveTasks();

    closeTaskModal();

    renderTasks();

}


// ========================================
// CLEAR FORM
// ========================================

function clearTaskForm() {

    document.querySelector("#taskName").value = "";

    document.querySelector("#taskSubject").value = "";

    document.querySelector("#taskType").value = "Task";

    document.querySelector("#taskDueDate").value = "";

    document.querySelector("#taskPriority").value = "Normal";

    document.querySelector("#taskTags").value = "";

}


// ========================================
// COMPLETE TASK
// ========================================

function toggleTask(id) {

    const task =
        tasks.find(task => task.id === id);


    if (!task) {

        return;

    }


    task.completed = !task.completed;

    saveTasks();

    renderTasks();

}


// ========================================
// DISPLAY TASKS
// ========================================

function renderTasks() {

    const container =
        document.querySelector(".today-tasks");


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const activeTasks =
        tasks.filter(task => !task.completed);


    if (activeTasks.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                Nothing here yet!
            </p>
        `;

        return;

    }


    activeTasks.forEach(task => {

        const taskElement =
            document.createElement("div");


        taskElement.className = "task";


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
                    ${escapeHTML(task.subject || task.type)}
                </div>

            </div>

            <span class="priority">
                ${escapeHTML(task.priority)}
            </span>

        `;


        container.appendChild(taskElement);

    });

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
            document.querySelector(".quick-add input");


        input.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    addTask();

                }

            }
        );


        renderTasks();

    }
);
