// ========================================
// PLANNER DATA
// ========================================

var plannerData =
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
            colour: "#7c3aed",
            active: true
        },

        {
            name: "Math",
            emoji: "🧮",
            colour: "#2563eb",
            active: true
        },

        {
            name: "Physics",
            emoji: "⚛️",
            colour: "#0891b2",
            active: true
        },

        {
            name: "Chemistry",
            emoji: "🧪",
            colour: "#059669",
            active: true
        },

        {
            name: "Biology",
            emoji: "🧬",
            colour: "#65a30d",
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
// ICON OPTIONS
// ========================================

const iconOptions = [

    "📖",
    "📚",
    "📝",
    "📓",
    "📒",
    "📕",

    "🧮",
    "📐",
    "📏",
    "🔢",

    "⚛️",
    "🔬",
    "🧪",
    "🧬",
    "🌡️",

    "💻",
    "⌨️",
    "🖥️",
    "💾",

    "🎨",
    "🎭",
    "🎵",
    "🎼",
    "🎬",

    "🌱",
    "🌿",
    "🌎",
    "🌍",

    "🏃",
    "🏆",
    "⚽",
    "🏀",

    "🏠",
    "🧹",
    "🍳",
    "🍎",

    "⭐",
    "💡",
    "🎯",
    "📌",
    "📅",
    "⏰",
    "✓",
    "❗"

];


// Currently edited subject.
// null = creating a new subject.

let editingSubjectIndex = null;

let selectedSubjectIcon = "📚";



// ========================================
// INITIALIZE
// ========================================

function initializePlannerData() {

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


    if (!plannerData.settings) {

        plannerData.settings =
            defaultSettings;

    }


    if (!plannerData.settings.subjects) {

        plannerData.settings.subjects =
            defaultSettings.subjects;

    }


    if (!plannerData.settings.types) {

        plannerData.settings.types =
            defaultSettings.types;

    }


    if (!plannerData.tasks) {

        plannerData.tasks = [];

    }


    // Add missing colour values to
    // subjects created before colours
    // existed.

    plannerData
        .settings
        .subjects
        .forEach(
            subject => {

                if (!subject.colour) {

                    subject.colour =
                        "#304b8a";

                }

            }
        );


    savePlannerData();

}



// ========================================
// SAVE DATA
// ========================================

function savePlannerData() {

    localStorage.setItem(
        "plannerData",
        JSON.stringify(
            plannerData
        )
    );


    // Temporary compatibility with
    // the old task storage.

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
// TASK OPTIONS
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


    if (
        !subjectSelect ||
        !typeSelect
    ) {

        return;

    }


    subjectSelect.innerHTML =
        "";

    typeSelect.innerHTML =
        "";



    // None

    const noneOption =
        document.createElement(
            "option"
        );


    noneOption.value =
        "";


    noneOption.textContent =
        "None";


    subjectSelect.appendChild(
        noneOption
    );



    // Subjects

    plannerData
        .settings
        .subjects
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



    // Types

    plannerData
        .settings
        .types
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
        .value =
            name;


    input.value =
        "";


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

        id:
            Date.now(),

        name:
            name,

        subject:
            subject,

        type:
            type,

        priority:
            priority,

        dueDate:
            dueDate ||
            null,

        tags:
            tags,

        completed:
            false,

        createdAt:
            new Date()
                .toISOString()

    };


    plannerData
        .tasks
        .push(
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

    const name =
        document.querySelector(
            "#taskName"
        );


    if (name) {

        name.value =
            "";

    }


    const subject =
        document.querySelector(
            "#taskSubject"
        );


    if (subject) {

        subject.value =
            "";

    }


    const type =
        document.querySelector(
            "#taskType"
        );


    if (
        type &&
        plannerData
            .settings
            .types
            .length
    ) {

        type.value =
            plannerData
                .settings
                .types[0]
                .name;

    }


    const dueDate =
        document.querySelector(
            "#taskDueDate"
        );


    if (dueDate) {

        dueDate.value =
            "";

    }


    const priority =
        document.querySelector(
            "#taskPriority"
        );


    if (priority) {

        priority.value =
            "Normal";

    }


    const tags =
        document.querySelector(
            "#taskTags"
        );


    if (tags) {

        tags.value =
            "";

    }

}



// ========================================
// COMPLETE TASK
// ========================================

function toggleTask(id) {

    const task =
        plannerData
            .tasks
            .find(
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
// RENDER TASKS
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
        plannerData
            .tasks
            .filter(
                task =>
                    !task.completed
            );



    // TODAY

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



    // UPCOMING

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
// TASK ELEMENTS
// ========================================

function createTaskElement(task) {

    const div =
        document.createElement("div");

    div.className = "task";


    const checkbox =
        document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.checked =
        task.completed;

    checkbox.onchange = () =>
        toggleTask(task.id);


    const content =
        document.createElement("div");

    content.className =
        "task-content";


    const name =
        document.createElement("span");

    name.textContent =
        task.name;


    const meta =
        document.createElement("small");

    meta.textContent =
        `${task.subject || ""}`;


    content.appendChild(
        name
    );

    content.appendChild(
        meta
    );


    div.appendChild(
        checkbox
    );

    div.appendChild(
        content
    );


    return div;

}


function createUpcomingElement(task) {

    const div =
        document.createElement("div");

    div.className = "task";


    const content =
        document.createElement("div");

    content.className =
        "task-content";


    const name =
        document.createElement("span");

    name.textContent =
        task.name;


    const meta =
        document.createElement("small");

    meta.textContent =
        `${task.subject || ""} · ${task.dueDate}`;


    content.appendChild(
        name
    );

    content.appendChild(
        meta
    );


    div.appendChild(
        content
    );


    return div;

}



// ========================================
// STARTUP
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializePlannerData();

        renderTasks();

    }
);
