# Codex host guide

For task-related development work, keep the current project's task canvas available in Codex. Reuse an already open canvas for the same project and task document when it is usable. Do not open duplicates on every turn or switch projects without a request.

When a canvas is missing, call the installed `lingstyle` MCP tool `open_task_canvas` with the absolute `projectDir`. The daemon resolves the current branch's `.lingchuang` task document. Pass the project-relative `taskPath` only when the user explicitly chose another path. The MCP App displays the canvas and sends user-requested node messages through `ui/message`; the daemon remains responsible for project data.

If the MCP tool is unavailable, report that the plugin's MCP server has not loaded in the current chat. Do not run the CLI, start a daemon through a shell, or open the ordinary browser page as a substitute. Continue task and source work that does not require the canvas. After the plugin configuration is repaired, a new Codex chat or restart may be needed for the tool to appear; do not assert that a restart will fix a server startup error without evidence.

If the MCP tool returns an error, report its actual message rather than retrying via CLI. The fullscreen App and message delivery depend on host support and must not be claimed successful until observed.
