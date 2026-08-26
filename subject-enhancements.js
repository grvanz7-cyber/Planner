// ========================================
// SUBJECT ICON PICKER + DELETE
// ========================================

let subjectEditorOpen = false;

function renderCompactIconPicker() {
    const picker = document.querySelector("#iconPicker");
    const selectedButton = document.querySelector("#selectedIconButton");

    if (!picker) return;

    picker.innerHTML = "";

    if (selectedButton) {
        selectedButton.innerHTML = `${selectedSubjectIcon}<span>▾</span>`;
    }

    iconOptions.forEach(icon => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "icon-option";
        button.textContent = icon;

        if (icon === selectedSubjectIcon) {
            button.classList.add("selected");
        }

        button.onclick = () => {
            selectedSubjectIcon = icon;
            renderCompactIconPicker();
            hideIconPicker();
        };

        picker.appendChild(button);
    });
}

function toggleIconPicker() {
    const picker = document.querySelector("#iconPicker");
    if (!picker) return;
    picker.classList.toggle("hidden");
}

function hideIconPicker() {
    const picker = document.querySelector("#iconPicker");
    if (!picker) return;
    picker.classList.add("hidden");
}

// Replace the original picker renderer with the compact version.
renderIconPicker = renderCompactIconPicker;

// Replace Add Subject so the picker starts closed.
const originalOpenSubjectModal = openSubjectModal;
openSubjectModal = function () {
    originalOpenSubjectModal();
    renderCompactIconPicker();
    hideIconPicker();
};

// Replace Edit Subject so the picker starts closed.
const originalEditSubject = editSubject;
editSubject = function (index) {
    originalEditSubject(index);
    renderCompactIconPicker();
    hideIconPicker();
};

function deleteSubject(index) {
    const subject = plannerData.settings.subjects[index];

    if (!subject) return;

    const confirmed = confirm(
        `Delete "${subject.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    plannerData.settings.subjects.splice(index, 1);

    savePlannerData();
    renderSubjects();
    populateTaskOptions();
}

// Add Delete buttons to the existing subject rows without replacing
// the original rendering logic.
const originalRenderSubjects = renderSubjects;
renderSubjects = function () {
    originalRenderSubjects();

    const rows = document.querySelectorAll("#subjectsList .settings-row");

    rows.forEach((row, index) => {
        if (row.querySelector(".delete-subject-button")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "small-button danger-button delete-subject-button";
        button.textContent = "Delete";
        button.onclick = () => deleteSubject(index);

        row.appendChild(button);
    });
};

// Close the icon picker when clicking elsewhere in the document.
document.addEventListener("click", event => {
    const selector = document.querySelector(".icon-selector");

    if (
        selector &&
        !selector.contains(event.target)
    ) {
        hideIconPicker();
    }
});
