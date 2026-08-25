// ========================================
// PLANNER DATA
// ========================================

let plannerData =
    JSON.parse(
        localStorage.getItem("plannerData")
    );


// ========================================
// DEFAULT SETTINGS
// ========================================

const defaultSettings = {

    subjects: [
        {
            name: "English",
            emoji: "📖",
            active: true
        },

        {
            name: "Math",
            emoji: "🧮",
            active: true
        },

        {
            name: "Physics",
            emoji: "⚛️",
            active: true
        },

        {
            name: "Chemistry",
            emoji: "🧪",
            active: true
        },

        {
            name: "Biology",
            emoji: "🧬",
            active: true
        }
    ],


    types: [
        {
            name: "Task",
            emoji: "✓"
        },

        {
            name: "Homework",
            emoji: "📚"
        },

        {
            name: "Assignment",
            emoji: "📝"
        },

        {
            name: "Quiz",
            emoji: "❓"
        },

        {
            name: "Test",
            emoji: "🧪"
        },

        {
            name: "Exam",
            emoji: "🎓"
        }
    ]

};


// ========================================
// INITIALIZE PLANNER DATA
// ========================================

function initializePlannerData() {

    // If this is the first time using
    // the new data system...

    if (!plannerData) {

        const oldTasks =
            JSON.parse(
                localStorage.getItem(
                    "plannerTasks"
                )
            ) || [];


        plannerData = {

            settings:
                defaultSettings,

            tasks:
                oldTasks

        };


        savePlannerData();

    }


    // Make sure settings exist.

    if (!plannerData.settings) {

        plannerData.settings =
            defaultSettings;

    }


    // Make sure tasks exist.

    if (!plannerData.tasks) {

        plannerData.tasks = [];

    }


    savePlannerData();

}


// ========================================
// SAVE PLANNER DATA
// ========================================

function savePlannerData() {

    localStorage.setItem(
        "plannerData",
        JSON.stringify(
            plannerData
        )
    );


    // Keep the old task storage updated
    // temporarily for compatibility.

    localStorage.setItem(
        "plannerTasks",
        JSON.stringify(
            plannerData.tasks
        )
    );

}


// ========================================
// TASKS
// ========================================

function getTasks() {

    return plannerData.tasks;

}


function saveTasks() {

    savePlannerData();

}



// ========================================
// DATE HELPERS
// ========================================

function getToday() {

    const today =
        new Date();

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
            dateString +
            "T00:00:00"
        );


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;

}


function isToday(task) {

    if (!task.dueDate) {

        return false;

    }


    const taskDate =
        getDateOnly(
            task.dueDate
        );


    const today =
        getToday();


    return (
        taskDate.getTime() ===
        today.getTime()
    );

}


function isOverdue(task) {

    if (!task.dueDate) {

        return false;

    }


    const taskDate =
        getDateOnly(
            task.dueDate
        );


    const today =
        getToday();


    return taskDate < today;

}


function isUpcoming(task) {

    if (!task.dueDate) {

        return false;

    }


    const taskDate =
        getDateOnly(
            task.dueDate
        );


    const today =
        getToday();


    return taskDate > today;

}



// ========================================
// TASK MODAL
// ========================================

function openTaskModal() {

    populateTaskOptions();


    const modal =
        document.querySelector(
            "#taskModal"
        );


    modal.classList.add(
        "open"
    );


    document
        .querySelector(
            "#taskName"
        )
        .focus();

}


function closeTaskModal() {

    const modal =
        document.querySelector(
            "#taskModal"
        );


    modal.classList.remove(
        "open"
    );


    clearTaskForm();

}



// ========================================
// POPULATE TASK OPTIONS
// ========================================

function populateTaskOptions() {

    const subjectSelect =
        document.querySelector(
            "#taskSubject"
        );


    const typeSelect =
        document.querySelector(
            "#taskType"
        );


    subjectSelect.innerHTML = "";

    typeSelect.innerHTML = "";



    // NONE OPTION

    const noneOption =
        document.createElement(
            "option"
        );


    noneOption.value = "";

    noneOption.textContent =
        "None";


    subjectSelect.appendChild(
        noneOption
    );



    // SUBJECTS

    plannerData.settings.subjects
        .filter(
            subject =>
                subject.active
        )
        .forEach(
            subject => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    subject.name;


                option.textContent =
                    `${subject.emoji} ${subject.name}`;


                subjectSelect.appendChild(
                    option
                );

            }
        );



    // TYPES

    plannerData.settings.types
        .forEach(
            type => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    type.name;


                option.textContent =
                    `${type.emoji} ${type.name}`;


                typeSelect.appendChild(
                    option
                );

            }
        );

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
        .querySelector(
            "#taskName"
        )
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
            .querySelector(
                "#taskName"
            )
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
            .querySelector(
                "#taskSubject"
            )
            .value;


    const type =
        document
            .querySelector(
                "#taskType"
            )
            .value;


    const dueDate =
        document
            .querySelector(
                "#taskDueDate"
            )
            .value;


    const priority =
        document
            .querySelector(
                "#taskPriority"
            )
            .value;


    const tagText =
        document
            .querySelector(
                "#taskTags"
            )
            .value;


    const tags =
        tagText
            .split(",")
            .map(
                tag =>
                    tag.trim()
            )
            .filter(
                tag =>
                    tag !== ""
            );


    const task = {

        id: Date.now(),

        name: name,

        subject: subject,

        type: type,

        priority: priority,

        dueDate:
            dueDate ||
            null,

        tags: tags,

        completed: false,

        createdAt:
            new Date()
                .toISOString()

    };


    plannerData.tasks.push(
        task
    );


    savePlannerData();

    closeTaskModal();

    renderTasks();

}



// ========================================
// CLEAR TASK FORM
// ========================================

function clearTaskForm() {

    document
        .querySelector(
            "#taskName"
        )
        .value = "";


    document
        .querySelector(
            "#taskSubject"
        )
        .value = "";


    document
        .querySelector(
            "#taskType"
        )
        .value =
            plannerData
                .settings
                .types[0]
                .name;


    document
        .querySelector(
            "#taskDueDate"
        )
        .value = "";


    document
        .querySelector(
            "#taskPriority"
        )
        .value =
            "Normal";


    document
        .querySelector(
            "#taskTags"
        )
        .value = "";

}



// ========================================
// COMPLETE TASK
// ========================================

function toggleTask(id) {

    const task =
        plannerData.tasks.find(
            task =>
                task.id === id
        );


    if (!task) {

        return;

    }


    task.completed =
        !task.completed;


    savePlannerData();

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


    todayContainer.innerHTML =
        "";


    upcomingContainer.innerHTML =
        "";


    const activeTasks =
        plannerData.tasks.filter(
            task =>
                !task.completed
        );



    // ====================================
    // TODAY
    // ====================================

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
                    createTaskElement(
                        task
                    )
                );

            }
        );

    }



    // ====================================
    // UPCOMING
    // ====================================

    const upcomingTasks =
        activeTasks
            .filter(
                task =>
                    isUpcoming(task)
            )
            .sort(
                (a, b) =>
                    getDateOnly(
                        a.dueDate
                    ) -
                    getDateOnly(
                        b.dueDate
                    )
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
                    createUpcomingElement(
                        task
                    )
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
        document.createElement(
            "div"
        );


    taskElement.className =
        "task";


    const subjectText =
        task.subject
            ? `${task.subject} · ${task.type}`
            : task.type;


    let dateText = "";


    if (
        isOverdue(task)
    ) {

        dateText =
            " · Overdue";

    }

    else if (
        isToday(task)
    ) {

        dateText =
            " · Today";

    }


    taskElement.innerHTML = `

        <input
            type="checkbox"
            onchange="toggleTask(${task.id})"
        >

        <div class="task-info">

            <div class="task-name">
                ${escapeHTML(
                    task.name
                )}
            </div>

            <div class="task-meta">
                ${escapeHTML(
                    subjectText +
                    dateText
                )}
            </div>

        </div>

        <span class="priority">
            ${escapeHTML(
                task.priority
            )}
        </span>

    `;


    return taskElement;

}



// ========================================
// CREATE UPCOMING TASK
// ========================================

function createUpcomingElement(task) {

    const taskElement =
        document.createElement(
            "div"
        );


    taskElement.className =
        "task";


    taskElement.innerHTML = `

        <div class="task-info">

            <div class="task-name">
                ${escapeHTML(
                    task.name
                )}
            </div>

            <div class="task-meta">
                Due ${escapeHTML(
                    formatDate(
                        task.dueDate
                    )
                )}
            </div>

        </div>

        <span class="priority">
            ${escapeHTML(
                task.priority
            )}
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
        getDateOnly(
            dateString
        );


    return date.toLocaleDateString(
        undefined,
        {
            weekday:
                "short",

            month:
                "short",

            day:
                "numeric"
        }
    );

}



// ========================================
// SETTINGS — SUBJECTS
// ========================================

function renderSubjects() {

    const container =
        document.querySelector(
            "#subjectsList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    plannerData
        .settings
        .subjects
        .forEach(
            (subject, index) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "settings-row";


                row.innerHTML = `

                    <span class="settings-icon">
                        ${escapeHTML(
                            subject.emoji
                        )}
                    </span>

                    <span class="settings-name">
                        ${escapeHTML(
                            subject.name
                        )}
                    </span>

                    <span class="settings-status">
                        ${
                            subject.active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                    <button
                        class="small-button"
                        onclick="toggleSubject(${index})"
                    >
                        ${
                            subject.active
                                ? "Disable"
                                : "Enable"
                        }
                    </button>

                `;


                container.appendChild(
                    row
                );

            }
        );

}



// ========================================
// SETTINGS — TYPES
// ========================================

function renderTaskTypes() {

    const container =
        document.querySelector(
            "#typesList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    plannerData
        .settings
        .types
        .forEach(
            (type, index) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "settings-row";


                row.innerHTML = `

                    <span class="settings-icon">
                        ${escapeHTML(
                            type.emoji
                        )}
                    </span>

                    <span class="settings-name">
                        ${escapeHTML(
                            type.name
                        )}
                    </span>

                    <button
                        class="small-button danger-button"
                        onclick="removeTaskType(${index})"
                    >
                        Remove
                    </button>

                `;


                container.appendChild(
                    row
                );

            }
        );

}



// ========================================
// ADD SUBJECT
// ========================================

function addSubject() {

    const name =
        prompt(
            "What should the subject be called?"
        );


    if (!name) {

        return;

    }


    const emoji =
        prompt(
            "Choose an emoji for this subject:",
            "📚"
        );


    plannerData
        .settings
        .subjects
        .push({

            name:
                name.trim(),

            emoji:
                emoji || "📚",

            active:
                true

        });


    savePlannerData();

    renderSubjects();

    populateTaskOptions();

}



// ========================================
// TOGGLE SUBJECT
// ========================================

function toggleSubject(index) {

    const subject =
        plannerData
            .settings
            .subjects[index];


    subject.active =
        !subject.active;


    savePlannerData();

    renderSubjects();

    populateTaskOptions();

}



// ========================================
// ADD TASK TYPE
// ========================================

function addTaskType() {

    const name =
        prompt(
            "What should the task type be called?"
        );


    if (!name) {

        return;

    }


    const emoji =
        prompt(
            "Choose an emoji for this type:",
            "✓"
        );


    plannerData
        .settings
        .types
        .push({

            name:
                name.trim(),

            emoji:
                emoji || "✓"

        });


    savePlannerData();

    renderTaskTypes();

    populateTaskOptions();

}



// ========================================
// REMOVE TASK TYPE
// ========================================

function removeTaskType(index) {

    const type =
        plannerData
            .settings
            .types[index];


    const confirmed =
        confirm(
            `Remove "${type.name}"?`
        );


    if (!confirmed) {

        return;

    }


    plannerData
        .settings
        .types
        .splice(
            index,
            1
        );


    savePlannerData();

    renderTaskTypes();

    populateTaskOptions();

}



// ========================================
// PAGE NAVIGATION
// ========================================

function showPage(page) {

    const dashboard =
        document.querySelector(
            "#dashboardPage"
        );


    const settings =
        document.querySelector(
            "#settingsPage"
        );


    dashboard.classList.add(
        "page-hidden"
    );


    settings.classList.add(
        "page-hidden"
    );


    if (
        page === "dashboard"
    ) {

        dashboard.classList.remove(
            "page-hidden"
        );

    }


    if (
        page === "settings"
    ) {

        settings.classList.remove(
            "page-hidden"
        );


        renderSubjects();

        renderTaskTypes();

    }

}



// ========================================
// BASIC HTML SAFETY
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}



// ========================================
// START PLANNER
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializePlannerData();


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


        const dateElement =
            document.querySelector(
                "#currentDate"
            );


        if (dateElement) {

            dateElement.textContent =
                new Date()
                    .toLocaleDateString(
                        undefined,
                        {
                            weekday:
                                "long",

                            month:
                                "long",

                            day:
                                "numeric"
                        }
                    );

        }

    }
);
