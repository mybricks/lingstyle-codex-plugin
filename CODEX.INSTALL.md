# 安装 Lingstyle Codex 插件

安装需要 Node.js 18 或更高版本和 Codex CLI。发布仓库包含运行所需的 `dist/` 和 `skills/` 产物。

## 让 Codex 自动安装

把下面的内容发给 Codex：

```text
请通过 Lingstyle 仓库自带的 Git marketplace 安装 Codex 插件。
先运行 codex plugin marketplace add mybricks/lingstyle-codex-plugin，
再运行 codex plugin add lingstyle@lingstyle-git，并用 codex plugin list 确认插件已启用。
发布包包含 MCP 和画布构建产物，无需在插件缓存或 marketplace 快照中执行 npm install，也不要将仓库克隆到 personal marketplace。
安装完成后提醒我完全退出并重新启动 Codex。同时告知这个插件包含的功能，以及使用方式。
```

## 手动安装和更新

```bash
codex plugin marketplace add mybricks/lingstyle-codex-plugin
codex plugin add lingstyle@lingstyle-git
codex plugin list
```

如已注册 `lingstyle-git`，可跳过第一条命令。更新时运行 `codex plugin marketplace upgrade lingstyle-git`。安装或更新后完全退出并重新启动 Codex，以加载 skill 和 MCP。以上命令使用远端默认分支；如需指定发布分支，可在 `marketplace add` 命令后添加 `--ref <分支名>`。

## 功能与使用

- `task-first` skill：在项目对话中让 Codex 使用 task-first 工作流，维护任务文档、任务进度和任务总览。
- 任务画布：让 Codex 调用 `lingstyle` MCP 的 `open_task_canvas`，并提供项目的绝对路径，即可在 Codex 中查看项目任务和总览。
- 浏览器访问：在画布工具栏点击“复制浏览器地址”，将地址粘贴到本机浏览器打开同一项目的任务视图。浏览器中的任务消息可以复制后粘贴到对话。

MCP 和画布功能是否可用取决于当前宿主。
