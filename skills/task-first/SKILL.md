---
name: task-first
description: 使用 Lingstyle 工作流在开发过程中维护项目的任务文档与总览，并维护项目任务画布。
---

# Lingstyle task-first

在开发过程中使用本 skill：让任务文档和总览中的改动点始终跟随你已经写下的代码。要审查已完成的改动并生成分析，改用 `code-review` skill。

以项目任务文档作为任务进度的事实来源。除非用户明确指定其他路径，使用相对项目根目录的 `.lingchuang/<branchDir>/tasks/TASKS.md`，`overview.yaml` 与它放在同一目录。在该项目中用 `git branch --show-current` 获取当前分支；把除 ASCII 字母和数字之外的每个字符替换为 `_` 得到 `branchDir`（例如 `feature/task-1` 变成 `feature_task_1`）。分支为空或无法确定时，使用 `.lingchuang/tasks/TASKS.md`。打开新画布或在切换分支后开始工作时，重新解析分支。不要读写其他分支的任务文件。

## 参考文档

所有路径均相对本 skill 目录。

| 文档 | 路径 | 何时读取 |
| --- | --- | --- |
| 任务优先工作流 | `references/tasks/task-first-workflow.md` | 始终读取：需求评估、开发测试与状态回写。 |
| 任务文档 | `references/tasks/task-document.md` | 始终读取：任务状态机、任务粒度，以及 `TASKS.md` 的字段与格式。 |
| 总览工作流 | `references/tasks/task-overview-workflow.md` | 始终读取：`overview.yaml` 结构与改动点维护，保持与相关任务和源码改动一致。 |

## 适用范围

- 让 `TASKS.md` 和 `overview.yaml` 跟随你已经在做的工作：新增或更新任务，为你实际修改的代码补充改动点，并更新它们的描述。
- 每个改动点必须描述你改动的代码。不要为了让层级看起来完整而补充仅被间接影响的页面或组件。
- 这里不做影响面分析。当用户要求审查或分析改动时，使用 `code-review` skill，`analysis` 的写入规则也都在那个 skill 里。

## 多仓库

当一次请求改动了多个仓库（例如一个前端仓库和一个后端仓库）时，把每个仓库的工作记录到该仓库自己的文档中：

- 对每个有代码改动的仓库，使用 `<repoRoot>/.lingchuang/<branchDir>/tasks/TASKS.md` 及其旁边的 `overview.yaml`，其中 `branchDir` 由该仓库自己的当前分支得到（在该仓库根目录执行 `git branch --show-current`）。各仓库可能处于不同分支。
- 不要把另一个仓库的任务写进当前仓库的文档，也不要为仅被读取过的仓库创建文档。
- 任务 ID 只在一个 `TASKS.md` 内唯一。引用其他仓库的任务时，在摘要或交接原因中写作 `<repoName> T-xxx`。
- 「不读写其他分支任务文件」的规则按仓库生效：每个仓库只读它自己当前分支的文件。
- 打开任务画布时，把所有涉及的仓库绝对路径传给同一个 `open_task_canvas` 调用，让一个画布展示全部仓库。不要为每个仓库各开一个画布。
- 画布打开后，它会向模型上下文注入一条说明，列出它覆盖的仓库并要求你不要再开新的画布。仅当本次工作新增了尚未覆盖的仓库，或用户明确要求时，才再次调用 `open_task_canvas`；此时把已打开的仓库和新仓库一起传入。

这些参考工作流源自 MyBricks。请用当前宿主实际提供的工具落实其中的任务语义：MyBricks 专属的 hooks、`ask_questions`、`task://` 链接、自动状态流转和子 agent 都不由本插件提供。不要声称它们已经运行。用户的指令和宿主规则优先于参考文档，包括其中的确认要求。把 `<taskPath>` 和 `<overviewPath>` 替换为实际的项目相对路径。在没有专门集成能力时，直接维护文件。

For Codex canvas setup and host communication, read the [host guide](references/host.md).
