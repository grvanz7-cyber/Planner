// ========================================
// TASK TYPE MODAL + ICON PICKER
// ========================================

let editingTaskTypeIndex = null;
let selectedTaskTypeIcon = "✓";

function openTaskTypeModal(index = null) {
    editingTaskTypeIndex = index;

    const modal = document.querySelector("#taskTypeModal");
    const title = document.querySelector("#taskTypeModalTitle");
    const nameInput = document.querySelector("#taskTypeName");

    if (!modal || !title || !nameInput) return;

    if (index === null) {
        title.textContent = "Add Task Type";
        nameInput.value = "";
        selectedTaskTypeIcon = "✓";
    } else {
        const type = plannerData.settings.types[index];
        if (!type) return;
        title.textContent = "Edit Task Type";
        nameInput.value = type.name;
        selectedTaskTypeIcon = type.emoji || "✓";
    }

    renderTaskTypeIconPicker();
    hideTaskTypeIconPicker();
    modal.classList.add("open");
    nameInput.focus();
}

function closeTaskTypeModal() {
    const modal = document.querySelector("#taskTypeModal");
    if (modal) modal.classList.remove("open");
    editingTaskTypeIndex = null;
    hideTaskTypeIconPicker();
}

function renderTaskTypeIconPicker() {
    const picker = document.querySelector("#taskTypeIconPicker");
    const selectedButton = document.querySelector("#selectedTaskTypeIconButton");
    if (!picker) return;

    picker.innerHTML = "";

    if (selectedButton) {
        selectedButton.innerHTML = `${selectedTaskTypeIcon}<span>▾</span>`;
    }

    iconOptions.forEach(icon => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "icon-option";
        button.textContent = icon;

        if (icon === selectedTaskTypeIcon) {
            button.classList.add("selected");
        }

        button.onclick = () => {
            selectedTaskTypeIcon = icon;
            renderTaskTypeIconPicker();
            hideTaskTypeIconPicker();
        };

        picker.appendChild(button);
    });
}

function toggleTaskTypeIconPicker() {
    const picker = document.querySelector("#taskTypeIconPicker");
    if (picker) picker.classList.toggle("hidden");
}

function hideTaskTypeIconPicker() {
    const picker = document.querySelector("#taskTypeIconPicker");
    if (picker) picker.classList.add("hidden");
}

function saveTaskType() {
    const nameInput = document.querySelector("#taskTypeName");
    if (!nameInput) return;

    const name = nameInput.value.trim();

    if (!name) {
        alert("Please enter a task type name.");
        nameInput.focus();
        return;
    }

    const duplicate = plannerData.settings.types.some((type, index) =>
        type.name.toLowerCase() === name.toLowerCase() &&
        index !== editingTaskTypeIndex
    );

    if (duplicate) {
        alert("A task type with that name already exists.");
        nameInput.focus();
        return;
    }

    const type = {
        name,
        emoji: selectedTaskTypeIcon
    };

    if (editingTaskTypeIndex === null) {
        plannerData.settings.types.push(type);
    } else {
        plannerData.settings.types[editingTaskTypeIndex] = type;
    }

    savePlannerData();
    renderTaskTypes();
    populateTaskOptions();
    closeTaskTypeModal();
}

function deleteTaskType(index) {
    const type = plannerData.settings.types[index];
    if (!type) return;

    if (plannerData.settings.types.length <= 1) {
        alert("You need to keep at least one task type.");
        return;
    }

    if (!confirm(`Delete "${type.name}"? This cannot be undone.`)) return;

    plannerData.settings.types.splice(index, 1);
    savePlannerData();
    renderTaskTypes();
    populateTaskOptions();
}

// Replace the old prompt-based type creation.
addTaskType = function () {
    openTaskTypeModal();
};

// Replace the type list with the same Edit/Delete pattern as Subjects.
renderTaskTypes = function () {
    const container = document.querySelector("#typesList");
    if (!container) return;

    container.innerHTML = "";

    plannerData.settings.types.forEach((type, index) => {
        const row = document.createElement("div");
        row.className = "settings-row";

        row.innerHTML = `
            <span class="settings-icon">${escapeHTML(type.emoji || "✓")}</span>
            <span class="settings-name">${escapeHTML(type.name)}</span>
            <button class="small-button" type="button" onclick="openTaskTypeModal(${index})">Edit</button>
            <button class="small-button danger-button" type="button" onclick="deleteTaskType(${index})">Delete</button>
        `;

        container.appendChild(row);
    });
};

document.addEventListener("click", event => {
    const selector = document.querySelector(".task-type-icon-selector");
    if (selector && !selector.contains(event.target)) {
        hideTaskTypeIconPicker();
    }
});
