# Codex host guide

For task-related development work, keep the current project's task canvas available in Codex. Reuse an already open canvas for the same project and task document when it is usable. Do not open duplicates on every turn or switch projects without a request.

When a canvas is missing, call the installed `lingstyle` MCP tool `open_task_canvas` with the absolute `projectDir`. The daemon resolves the current branch's `.lingchuang` task document. Pass the project-relative `taskPath` only when the user explicitly chose another path. The MCP App displays the canvas and sends user-requested node messages through `ui/message`; the daemon remains responsible for project data.

When the work spans several repositories, pass every repository's absolute directory to the same `open_task_canvas` call instead of opening one canvas per repository. Include every repository that this work will read or change; leave out repositories that are only glanced at. The daemon resolves each repository's own branch and task document, so repositories may sit on different branches.

Once a canvas is open, it reports the repositories it is showing and asks you not to open another one. Only call `open_task_canvas` a second time when this work adds a repository the open canvas does not cover, or when the user explicitly asks for it, and then pass the already-open repositories together with the new one.

If the MCP tool is unavailable, report that the plugin's MCP server has not loaded in the current chat. Do not run the CLI, start a daemon through a shell, or open the ordinary browser page as a substitute. Continue task and source work that does not require the canvas. After the plugin configuration is repaired, a new Codex chat or restart may be needed for the tool to appear; do not assert that a restart will fix a server startup error without evidence.

If the MCP tool returns an error, report its actual message rather than retrying via CLI. The fullscreen App and message delivery depend on host support and must not be claimed successful until observed.
