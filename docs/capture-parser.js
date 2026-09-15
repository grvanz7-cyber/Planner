(() => {
  const aliases = {
    physics: ["physics", "phys", "sph4u"],
    chemistry: ["chemistry", "chem", "sch4u"],
    biology: ["biology", "bio", "sbi4u"],
    english: ["english", "eng"],
    mathematics: ["mathematics", "math", "maths", "mcr3u"]
  };

  // Generic names are still meaningful, but read more naturally with the
  // subject attached when they are the entire captured name.
  const genericNames = new Set([
    "test", "tests", "quiz", "quizzes", "exam", "exams", "assessment", "assessments",
    "essay", "essays", "lab", "labs", "assignment", "assignments", "worksheet", "worksheets",
    "project", "projects", "presentation", "presentations", "report", "reports"
  ]);

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function tokenRegex(token) {
    return new RegExp(`(^|\\s)${escapeRegExp(token)}(?=\\s|$)`, "i");
  }

  function removeToken(text, token) {
    return text.replace(tokenRegex(token), " ");
  }

  function parse(text) {
    let remaining = text.trim();
    const subjects = window.PlannerData.getData().subjects || [];
    let subject = null;

    // Prefer the actual subject names, then fall back to the common aliases.
    const actual = subjects
      .map(s => ({ subject: s, token: s.name }))
      .sort((a, b) => b.token.length - a.token.length);
    for (const item of actual) {
      if (tokenRegex(item.token).test(remaining)) {
        subject = item.subject;
        remaining = removeToken(remaining, item.token);
        break;
      }
    }

    if (!subject) {
      const aliasList = Object.entries(aliases)
        .flatMap(([name, words]) => words.map(word => ({ name, word })))
        .sort((a, b) => b.word.length - a.word.length);
      for (const item of aliasList) {
        if (tokenRegex(item.word).test(remaining)) {
          subject = subjects.find(s => s.name.toLowerCase() === item.name.toLowerCase()) || null;
          if (subject) remaining = removeToken(remaining, item.word);
          break;
        }
      }
    }

    let unitNumber = null;
    remaining = remaining.replace(/\bunit\s*(\d+)\b/i, (_, n) => {
      unitNumber = Number(n);
      return " ";
    });

    let dueDate = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekdays = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };

    remaining = remaining.replace(/\b(today|tomorrow)\b/i, word => {
      const date = new Date(today);
      if (word.toLowerCase() === "tomorrow") date.setDate(date.getDate() + 1);
      dueDate = localDateString(date);
      return " ";
    });

    if (!dueDate) {
      remaining = remaining.replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i, word => {
        const date = new Date(today);
        const target = weekdays[word.toLowerCase()];
        let difference = (target - date.getDay() + 7) % 7;
        if (difference === 0) difference = 7;
        date.setDate(date.getDate() + difference);
        dueDate = localDateString(date);
        return " ";
      });
    }

    let estimatedWorkload = null;
    remaining = remaining.replace(/\b(1h30|2h|1h|15m|30m|45m)\b/i, value => {
      estimatedWorkload = value.toLowerCase();
      return " ";
    });
    remaining = remaining.replace(/\b(15|30|45)\s*minutes?\b/i, (_, n) => {
      estimatedWorkload = `${n}m`;
      return " ";
    });
    remaining = remaining.replace(/\b1\s*hour\s*30\s*minutes?\b/i, () => {
      estimatedWorkload = "1h30";
      return " ";
    });
    remaining = remaining.replace(/\b(1|2)\s*hours?\b/i, (_, n) => {
      estimatedWorkload = `${n}h`;
      return " ";
    });

    let type = "Assignment";
    if (/\b(test|tests|quiz|quizzes|exam|assessment)\b/i.test(remaining)) type = "Assessment";
    else if (/\b(culminating|culminating task|final project)\b/i.test(remaining)) type = "Culminating";

    let priority = null;
    if (/\bhigh priority\b/i.test(remaining)) {
      priority = "High";
      remaining = remaining.replace(/\bhigh priority\b/i, " ");
    } else if (/\blow priority\b/i.test(remaining)) {
      priority = "Low";
      remaining = remaining.replace(/\blow priority\b/i, " ");
    }

    let status = null;
    const statuses = ["in progress", "not started", "finished", "submitted", "graded"];
    for (const value of statuses) {
      if (new RegExp(`\\b${escapeRegExp(value)}\\b`, "i").test(remaining)) {
        status = value.replace(/^./, c => c.toUpperCase());
        remaining = remaining.replace(new RegExp(`\\b${escapeRegExp(value)}\\b`, "i"), " ");
        break;
      }
    }

    let name = remaining.replace(/\s+/g, " ").trim() || text.trim();

    // If the whole meaningful name is generic, include the actual subject name.
    // This gives "chem test" -> "Chemistry test" while keeping
    // "chem momentum lab" -> "Momentum lab".
    if (subject && genericNames.has(name.toLowerCase())) {
      name = `${subject.name} ${name}`;
    }

    return {
      name,
      subjectId: subject ? subject.id : null,
      unitNumber,
      dueDate,
      estimatedWorkload,
      type,
      priority,
      status
    };
  }

  function localDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const original = window.PlannerAssignments && window.PlannerAssignments.showAddAssignment;
  if (!original) return;

  window.PlannerAssignments.openSmartCapture = text => {
    const parsed = parse(text);
    original(parsed.name);

    // The existing assignment modal remains responsible for creation and persistence.
    // This layer only pre-fills fields after the modal has been rendered.
    requestAnimationFrame(() => {
      const modal = document.querySelector(".assignment-feature-modal-backdrop");
      if (!modal) return;

      const subject = modal.querySelector("#assignmentSubject");
      const type = modal.querySelector("#assignmentType");
      const unit = modal.querySelector("#assignmentUnit");
      const due = modal.querySelector("#assignmentDue");
      const workload = modal.querySelector("#assignmentWorkload");
      const status = modal.querySelector("#assignmentStatus");
      const priorityButtons = modal.querySelectorAll("#assignmentPriority [data-value]");

      if (parsed.subjectId && subject) {
        subject.value = parsed.subjectId;
        subject.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (parsed.type && type) type.value = parsed.type;
      if (parsed.dueDate && due) due.value = parsed.dueDate;
      if (parsed.estimatedWorkload && workload) workload.value = parsed.estimatedWorkload;
      if (parsed.status && status) status.value = parsed.status;

      if (parsed.priority && priorityButtons.length) {
        priorityButtons.forEach(button => {
          const selected = button.dataset.value === parsed.priority;
          button.classList.toggle("selected", selected);
          if (selected) button.click();
        });
      }

      if (parsed.unitNumber != null && unit) {
        const option = [...unit.options].find(option => {
          const match = option.textContent.match(/Unit\s+(\d+)/i);
          return match && Number(match[1]) === parsed.unitNumber;
        });
        if (option) unit.value = option.value;
      }
    });
  };
})();