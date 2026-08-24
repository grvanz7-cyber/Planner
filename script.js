// ========================================
// PLANNER DATA
// ========================================

let tasks = JSON.parse(localStorage.getItem("plannerTasks")) || [];


// ========================================
// SAVE TASKS
// ========================================

function saveTasks() {
    localStorage.setItem("plannerTasks", JSON.stringify(tasks));
}


// ========================================
// ADD TASK
// ========================================

function addTask() {

    const input = document.querySelector(".quick-add input");

    const name = input.value.trim();

    if (name === "") {
        return;
    }

    const task = {
        id: Date.now(),
        name: name,
        subject: "",
        type: "Task",
        priority: "Normal",
        dueDate: null,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);

    saveTasks();

    input.value = "";

    renderTasks();
}


// ========================================
// COMPLETE TASK
// ========================================

function toggleTask(id) {

    const task = tasks.find(task => task.id === id);

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

    const container = document.querySelector(".today-tasks");

    container.innerHTML = "";

    const activeTasks = tasks.filter(task => !task.completed);

    if (activeTasks.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                Nothing here yet!
            </p>
        `;

        return;
    }


    activeTasks.forEach(task => {

        const taskElement = document.createElement("div");

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
                    ${task.type}
                </div>

            </div>

            <span class="priority">
                ${task.priority}
            </span>

        `;

        container.appendChild(taskElement);

    });
}


// ========================================
// BASIC HTML SAFETY
// ========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ========================================
// START PLANNER
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    const button = document.querySelector(".quick-add button");

    const input = document.querySelector(".quick-add input");


    button.addEventListener("click", addTask);


    input.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            addTask();

        }

    });


    renderTasks();

});
