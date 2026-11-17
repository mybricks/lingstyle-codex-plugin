# 安装 Lingstyle Codex 插件

安装需要 Node.js 18 或更高版本和 Codex CLI。发布仓库包含运行所需的 `dist/` 和 `skills/` 产物。

## 让 Codex 自动安装

把下面的内容发给 Codex：

```text
请通过 Lingstyle 仓库自带的 Git marketplace 安装 Codex 插件。
先运行 codex plugin marketplace add mybricks/lingstyle-codex-plugin，
再运行 codex plugin add lingstyle@lingstyle-git，并用 codex plugin list 确认插件已启用。
发布包包含 MCP 和画布构建产物，无需在插件缓存或 marketplace 快照中执行 npm install，也不要将仓库克隆到 personal marketplace。
安装完成后请提醒我完全退出并重新启动 Codex。
```

## 手动安装和更新

```bash
codex plugin marketplace add mybricks/lingstyle-codex-plugin
codex plugin add lingstyle@lingstyle-git
codex plugin list
```

如已注册 `lingstyle-git`，可跳过第一条命令。更新时运行 `codex plugin marketplace upgrade lingstyle-git`。安装或更新后完全退出并重新启动 Codex，以加载 skill 和 MCP。以上命令使用远端默认分支；如需指定发布分支，可在 `marketplace add` 命令后添加 `--ref <分支名>`。

在项目对话中使用 `task-first` skill；它通过 `lingstyle` MCP 的 `open_task_canvas` 打开任务画布。工具是否可用取决于当前宿主。
