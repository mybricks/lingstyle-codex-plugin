---
name: code-review
description: 审查项目中的一次 diff 或代码范围，一次性创建、回填或刷新对应的任务、改动点与智能分析。
---

# Lingstyle code review

用本 skill 对已完成的代码做一次审查：读懂 diff，然后一次性把项目的任务、改动点和分析更新到最新。

除非用户明确指定其他路径，文档为相对项目根目录的 `.lingchuang/<branchDir>/tasks/TASKS.md` 及其旁边的 `overview.yaml`。在该项目中用 `git branch --show-current` 获取当前分支；把除 ASCII 字母和数字之外的每个字符替换为 `_` 得到 `branchDir`（例如 `feature/task-1` 变成 `feature_task_1`）。分支为空或无法确定时，使用 `.lingchuang/tasks/TASKS.md`。不要读写其他分支的任务文件。

## 参考文档

所有路径均相对本 skill 目录。

| 文档 | 路径 | 何时读取 |
| --- | --- | --- |
| 改动点分析 | `references/change-analysis.md` | 始终读取：`overview.yaml` 第 3 版结构、`impacts` / `checks` 的字段、严重等级与写法。 |
| 内置审查规则 | `references/rules-core.md` | 始终读取：审查时看什么，五个审查维度与下结论的前提。 |
| 任务文档 | `task-first` skill 的 `references/tasks/task-document.md` | 审查需要创建或更新 `TASKS.md` 中的任务时读取：状态机、任务粒度与格式。 |

## 审查范围

1. 优先使用用户指定的范围。否则审查工作区改动加上尚未进入上游分支的提交，并在写入前说明解析出的范围。
2. 读真实 diff，不只看文件名。只有确实被修改的代码才成为改动点；绝不要为了让层级看起来完整而补充仅被间接影响的页面或组件。
3. 按修改单元把 diff 归并成改动点：一个组件、函数、接口、配置或数据结构各算一个。同一单元已存在时复用稳定的 `defs` id。

## 一次性产出

在同一轮里产出以下全部内容：

- **任务**：为文档尚未覆盖的工作创建任务，更新已有的任务，并根据 diff 中的证据记录状态与验证条件。
- **改动点**：新增或更新 `changes` 条目，写事实性的 `desc`，并把每条关联到它的任务 ID。
- **分析**：为范围内每个改动点写入 `impacts` 与 `checks`，检查项的字段、严重等级与写法见 [改动点分析](references/change-analysis.md)，审查维度见 [内置审查规则](references/rules-core.md)。代码在分析之后又发生改动时，刷新这两个字段。

沿用分析文档中的写入边界：只动目标改动点的 `impacts` / `checks`，确有需要时才新增 `defs`，绝不改写无关条目。

## 画布展示
改完之后，使用 `open_task_canvas`，展示任务画布，点开任务即可看见改动点和影响。
- 打开任务画布时，把所有涉及的仓库绝对路径传给同一个 `open_task_canvas` 调用，让一个画布展示全部仓库。不要为每个仓库各开一个画布。
- 画布打开后，它会向模型上下文注入一条说明，列出它覆盖的仓库并要求你不要再开新的画布。仅当本次工作新增了尚未覆盖的仓库，或用户明确要求时，才再次调用 `open_task_canvas`；此时把已打开的仓库和新仓库一起传入。

For Codex canvas setup and host communication, read the [host guide](references/host.md).
