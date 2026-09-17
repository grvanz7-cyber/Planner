# Planner v2 — Data Foundation

Stage 2 establishes the single source of truth for planner data.

## Collections

- subjects
- units
- assignments
- tasks
- studyPlans
- studySessions
- events
- grades
- notifications

## Rules

- Every stored object has a stable `id`.
- `createdAt` and `updatedAt` are recorded automatically.
- Data is stored locally in the browser for now.
- UI pages should read from `PlannerData` rather than maintaining duplicate data.
- The schema has a version so it can be migrated later.
- This stage does not add assignment creation or other user-facing data entry yet.

The next stage can build Subjects on top of this foundation.
