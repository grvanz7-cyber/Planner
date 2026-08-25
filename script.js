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
// TASK ELEMENT
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


    let dateText =
        "";


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
// UPCOMING ELEMENT
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
// SUBJECT SETTINGS
// ========================================

function renderSubjects() {

    const container =
        document.querySelector(
            "#subjectsList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


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

                    <span
                        class="settings-icon"
                        style="color: ${subject.colour}"
                    >
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

                    <button
                        class="small-button"
                        onclick="editSubject(${index})"
                    >
                        Edit
                    </button>

                `;


                container.appendChild(
                    row
                );

            }
        );

}



// ========================================
// ICON PICKER
// ========================================

function renderIconPicker() {

    const picker =
        document.querySelector(
            "#iconPicker"
        );


    if (!picker) {

        return;

    }


    picker.innerHTML =
        "";


    iconOptions.forEach(
        icon => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "icon-option";


            if (
                icon ===
                selectedSubjectIcon
            ) {

                button.classList.add(
                    "selected"
                );

            }


            button.textContent =
                icon;


            button.onclick =
                () => {

                    selectedSubjectIcon =
                        icon;


                    renderIconPicker();

                };


            picker.appendChild(
                button
            );

        }
    );

}



// ========================================
// OPEN ADD SUBJECT MODAL
// ========================================

function openSubjectModal() {

    editingSubjectIndex =
        null;


    selectedSubjectIcon =
        "📚";


    document
        .querySelector(
            "#subjectModalTitle"
        )
        .textContent =
            "Add Subject";


    document
        .querySelector(
            "#subjectName"
        )
        .value =
            "";


    document
        .querySelector(
            "#subjectColour"
        )
        .value =
            "#304b8a";


    document
        .querySelector(
            "#subjectActive"
        )
        .checked =
            true;


    renderIconPicker();


    document
        .querySelector(
            "#subjectModal"
        )
        .classList.add(
            "open"
        );


    document
        .querySelector(
            "#subjectName"
        )
        .focus();

}



// ========================================
// EDIT SUBJECT
// ========================================

function editSubject(index) {

    const subject =
        plannerData
            .settings
            .subjects[index];


    if (!subject) {

        return;

    }


    editingSubjectIndex =
        index;


    selectedSubjectIcon =
        subject.emoji;


    document
        .querySelector(
            "#subjectModalTitle"
        )
        .textContent =
            "Edit Subject";


    document
        .querySelector(
            "#subjectName"
        )
        .value =
            subject.name;


    document
        .querySelector(
            "#subjectColour"
        )
        .value =
            subject.colour ||
            "#304b8a";


    document
        .querySelector(
            "#subjectActive"
        )
        .checked =
            subject.active;


    renderIconPicker();


    document
        .querySelector(
            "#subjectModal"
        )
        .classList.add(
            "open"
        );

}



// ========================================
// SAVE SUBJECT
// ========================================

function saveSubject() {

    const name =
        document
            .querySelector(
                "#subjectName"
            )
            .value
            .trim();


    if (!name) {

        alert(
            "Please enter a subject name."
        );

        return;

    }


    const colour =
        document
            .querySelector(
                "#subjectColour"
            )
            .value;


    const active =
        document
            .querySelector(
                "#subjectActive"
            )
            .checked;


    const subject = {

        name:
            name,

        emoji:
            selectedSubjectIcon,

        colour:
            colour,

        active:
            active

    };


    if (
        editingSubjectIndex ===
        null
    ) {

        plannerData
            .settings
            .subjects
            .push(
                subject
            );

    }
    else {

        plannerData
            .settings
            .subjects[
                editingSubjectIndex
            ] =
                subject;

    }


    savePlannerData();

    renderSubjects();

    populateTaskOptions();

    closeSubjectModal();

}



// ========================================
// CLOSE SUBJECT MODAL
// ========================================

function closeSubjectModal() {

    document
        .querySelector(
            "#subjectModal"
        )
        .classList.remove(
            "open"
        );


    editingSubjectIndex =
        null;

}



// ========================================
// TOGGLE SUBJECT
// ========================================

function toggleSubject(index) {

    const subject =
        plannerData
            .settings
            .subjects[index];


    if (!subject) {

        return;

    }


    subject.active =
        !subject.active;


    savePlannerData();

    renderSubjects();

    populateTaskOptions();

}



// ========================================
// TASK TYPES
// ========================================

function renderTaskTypes() {

    const container =
        document.querySelector(
            "#typesList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


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
                emoji ||
                "✓"

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


    if (!type) {

        return;

    }


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
        page ===
        "dashboard"
    ) {

        dashboard.classList.remove(
            "page-hidden"
        );

    }


    if (
        page ===
        "settings"
    ) {

        settings.classList.remove(
            "page-hidden"
        );


        renderSubjects();

        renderTaskTypes();

    }

}



// ========================================
// ESCAPE HTML
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
// START
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializePlannerData();


        const input =
            document.querySelector(
                ".quick-add input"
            );


        if (input) {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        addTask();

                    }

                }
            );

        }


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
