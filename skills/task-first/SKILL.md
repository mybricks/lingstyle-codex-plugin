---
name: task-first
description: Use the Lingstyle workflow to maintain a project's task document and overview during development, and maintain a project task canvas.
---

# Lingstyle

Use the project task document as the source of truth for task progress. Unless the user explicitly chooses another path, use `.lingchuang/<branchDir>/tasks/TASKS.md` relative to the project root, with `overview.yaml` alongside it. Determine the current branch with `git branch --show-current` in that project; replace every character other than ASCII letters and digits with `_` to obtain `branchDir` (for example, `feature/task-1` becomes `feature_task_1`). If the branch is empty or cannot be determined, use `.lingchuang/tasks/TASKS.md`. Resolve the branch again when opening a new canvas or starting work after a branch change. Do not read or write another branch's task files.

- For task classification, development and status updates, read [task-first workflow](references/tasks/task-first-workflow.md).
- For the task overview schema and maintenance, read [overview workflow](references/tasks/task-overview-workflow.md). Keep the overview consistent with relevant task and source changes.
- When the work spans backend services, APIs or data changes, read the full-stack additions: [full-stack task-first](references/tasks/task-first-fullstack-workflow.md) and [full-stack overview](references/tasks/task-overview-fullstack-workflow.md). They extend the two workflows above without changing them.

The reference workflows originated in MyBricks. Apply their task semantics using the actual tools available in the current host: MyBricks-specific hooks, `ask_questions`, `task://` links, automatic state transitions and subagents are not provided by this plugin. Do not claim they ran. The user's instructions and host rules take precedence over the references, including their confirmation instructions. Replace `<taskPath>` and `<overviewPath>` with the actual project-relative paths. Maintain the files directly when no dedicated integration is available.

For Codex canvas setup and host communication, read the [host guide](references/host.md).
