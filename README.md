# Lingstyle Codex 插件

Lingstyle 为 Codex 提供 task-first 工作流和任务画布。插件包含 MCP、预构建画布与 Skill，安装时无需运行 `npm install`。

## 安装

请阅读 [Codex 安装指南](CODEX.INSTALL.md)，其中包含可以直接交给 Codex 执行的安装指令和手动安装方式。

## 使用

在项目对话中使用 `task-first` skill，通过 `lingstyle` MCP 的 `open_task_canvas` 打开任务画布。画布工具栏支持复制地址，在本机浏览器打开相同的任务视图。

插件提供 `PostToolUse` 和 `Stop` hooks，通知已打开的画布刷新。首次安装或更新后，请在 Codex 的“Review hooks”或“Settings > Hooks”中审核并信任；hooks 未启用时画布仍会定期刷新。升级已有插件后，若本地 daemon 仍在运行，需先重启该 daemon 才能启用推送。

本仓库包含从 Lingstyle 源码构建的 Codex 发布产物。
