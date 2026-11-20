import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);

// packages/codex-plugin/src/mcp/index.mjs
import { createInterface } from "node:readline";
import { readFile as readFile2 } from "node:fs/promises";
import path2 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// packages/core/src/cli/daemon-client.mjs
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
var stateDir = process.env.TASK_FIRST_STATE_DIR || path.join(
  os.tmpdir(),
  `task-first-${process.getuid?.() ?? os.userInfo().username}`
);
var stateFile = path.join(stateDir, "daemon.json");
var lock = path.join(stateDir, "start.lock");
var pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function discover() {
  try {
    const state = JSON.parse(await readFile(stateFile, "utf8"));
    if (state.version !== 5 || !/^http:\/\/127\.0\.0\.1:\d+$/.test(state.origin) || !/^[0-9a-f]{64}$/.test(state.secret))
      return null;
    const result = await fetch(`${state.origin}/health`, {
      headers: { authorization: `Bearer ${state.secret}` },
      signal: AbortSignal.timeout(1e3)
    });
    const health = await result.json();
    return result.ok && health.name === "task-first-daemon" && health.version === 5 ? state : null;
  } catch {
    return null;
  }
}
async function ensureDaemon() {
  await mkdir(stateDir, { recursive: true, mode: 448 });
  const existing = await discover();
  if (existing)
    return existing;
  const deadline = Date.now() + 15e3;
  while (Date.now() < deadline) {
    try {
      await mkdir(lock, { mode: 448 });
      try {
        const running = await discover();
        if (running)
          return running;
        const child = spawn(
          process.execPath,
          [fileURLToPath(new URL("./daemon.mjs", import.meta.url))],
          {
            detached: true,
            stdio: ["ignore", "ignore", "pipe"],
            env: process.env
          }
        );
        let startupError = "";
        let exited = false;
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk) => {
          startupError = (startupError + chunk).slice(-4e3);
        });
        child.on("error", (error) => {
          startupError = error.message;
          exited = true;
        });
        child.on("exit", () => {
          exited = true;
        });
        child.unref();
        for (let i = 0; i < 100; i++) {
          await pause(100);
          const started = await discover();
          if (started) {
            child.stderr.destroy();
            return started;
          }
          if (exited)
            break;
        }
        child.stderr.destroy();
        const detail = startupError.match(/^Error(?: \[[^\]]+\])?: .+$/m)?.[0] || startupError.trim();
        throw Error(
          `Task First daemon failed to start${detail ? `: ${detail}` : ": no response before timeout"}`
        );
      } finally {
        await rm(lock, { recursive: true, force: true });
      }
    } catch (error) {
      if (error.code !== "EEXIST")
        throw error;
      const running = await discover();
      if (running)
        return running;
      try {
        if (Date.now() - (await stat(lock)).mtimeMs > 3e4)
          await rm(lock, { recursive: true, force: true });
      } catch (e) {
        if (e.code !== "ENOENT")
          throw e;
      }
      await pause(100);
    }
  }
  throw Error("Timed out waiting for Task First daemon");
}
async function loadCanvasData(state, args) {
  const result = await fetch(`${state.origin}/canvas-data`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${state.secret}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(5e3)
  });
  const data = await result.json();
  if (!result.ok)
    throw Error(data.error || "Unable to load task canvas");
  if (typeof data.canvasUrl !== "string" || !data.canvasUrl.startsWith(`${state.origin}/canvas?`)) {
    throw Error(
      "Daemon returned an incompatible canvas address. Stop the existing Task First daemon and retry."
    );
  }
  return data;
}

// packages/codex-plugin/src/mcp/index.mjs
var uri = "ui://lingstyle/canvas";
var html = await readFile2(
  fileURLToPath2(new URL("./widget.html", import.meta.url)),
  "utf8"
);
var tools = [
  {
    name: "open_task_canvas",
    description: "Open the task canvas fullscreen inside Codex for one or more repositories. Supply the absolute project directories of every repository whose tasks you will read or change, in a single call. Each repository's taskPath defaults to its current branch's .lingchuang task document.",
    inputSchema: {
      type: "object",
      properties: {
        projectDirs: { type: "array", items: { type: "string" }, minItems: 1 }
      },
      required: ["projectDirs"],
      additionalProperties: false
    },
    _meta: {
      ui: { resourceUri: uri, visibility: ["model", "app"] },
      "ui/resourceUri": uri,
      "openai/outputTemplate": uri,
      "openai/widgetAccessible": true
    }
  },
  {
    name: "read_task_canvas",
    description: "Read current task canvas data for one or more repositories.",
    inputSchema: {
      type: "object",
      properties: {
        projectDirs: { type: "array", items: { type: "string" }, minItems: 1 }
      },
      required: ["projectDirs"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true },
    _meta: { ui: { visibility: ["app"] }, "openai/widgetAccessible": true }
  },
  {
    name: "update_task_statuses",
    description: "\u5728\u672C\u5730\u4EFB\u52A1\u6587\u6863\u4E2D\u66F4\u65B0\u9A8C\u8BC1\u5B8C\u6210\u72B6\u6001\uFF0C\u4E0D\u53D1\u9001 AI \u6D88\u606F\u3002",
    inputSchema: {
      type: "object",
      properties: {
        projectDir: { type: "string" },
        taskPath: { type: "string" },
        expectedContent: { type: "string" },
        transitions: { type: "array", minItems: 1, maxItems: 1e3, items: {
          type: "object",
          properties: { taskId: { type: "string", pattern: "^T-\\d+$" }, status: { enum: ["\u5DF2\u5B8C\u6210", "\u5F85\u4EA4\u63A5"] } },
          required: ["taskId", "status"],
          additionalProperties: false
        } }
      },
      required: ["projectDir", "taskPath", "expectedContent", "transitions"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    _meta: { ui: { visibility: ["app"] }, "openai/widgetAccessible": true }
  }
];
async function readCanvas(args) {
  const dirs = args.projectDirs;
  if (!Array.isArray(dirs) || !dirs.length)
    throw Error("\u7F3A\u5C11 projectDirs");
  if (dirs.some((dir) => typeof dir !== "string" || !path2.isAbsolute(dir)))
    throw Error("projectDirs \u5FC5\u987B\u662F\u7EDD\u5BF9\u8DEF\u5F84\u6570\u7EC4");
  return loadCanvasData(await ensureDaemon(), { projectDirs: dirs.map((projectDir) => ({ projectDir })) });
}
async function canvasUrlFor(projectDir, taskPath) {
  if (typeof projectDir !== "string" || !path2.isAbsolute(projectDir))
    throw Error("projectDir \u5FC5\u987B\u662F\u7EDD\u5BF9\u8DEF\u5F84");
  const { canvasUrl } = await loadCanvasData(await ensureDaemon(), {
    projectDirs: [{ projectDir, taskPath }]
  });
  return canvasUrl;
}
async function handle(message) {
  switch (message.method) {
    case "initialize":
      return {
        protocolVersion: message.params?.protocolVersion || "2025-03-26",
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: "lingstyle", version: "0.1.0" }
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools };
    case "resources/list":
      return {
        resources: [
          {
            uri,
            name: "\u4EFB\u52A1\u89C6\u56FE",
            mimeType: "text/html;profile=mcp-app",
            _meta: {
              "openai/ui": {
                preferredDisplayMode: "fullscreen",
                availableDisplayModes: ["fullscreen"]
              }
            }
          }
        ]
      };
    case "resources/read": {
      if (message.params?.uri !== uri)
        throw Error("Unknown resource");
      const { origin } = await ensureDaemon();
      return {
        contents: [
          {
            uri,
            mimeType: "text/html;profile=mcp-app",
            text: html,
            _meta: {
              ui: { csp: { connectDomains: [origin] } },
              "openai/widgetCSP": { connect_domains: [origin] },
              "openai/widgetPrefersBorder": false,
              "openai/ui": {
                preferredDisplayMode: "fullscreen",
                availableDisplayModes: ["fullscreen"]
              }
            }
          }
        ]
      };
    }
    case "tools/call": {
      try {
        const name = message.params?.name;
        const args = message.params.arguments || {};
        if (name === "update_task_statuses") {
          const canvasUrl = await canvasUrlFor(args.projectDir, args.taskPath);
          const url = new URL(canvasUrl);
          url.pathname = "/api/tasks";
          const response = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json", "x-task-canvas": "1" },
            body: JSON.stringify({
              projectDir: args.projectDir,
              taskPath: args.taskPath,
              expectedContent: args.expectedContent,
              transitions: args.transitions
            }),
            signal: AbortSignal.timeout(5e3)
          });
          const updated = await response.json();
          if (!response.ok)
            throw Error(updated.error || "\u4EFB\u52A1\u72B6\u6001\u66F4\u65B0\u5931\u8D25");
          return { content: [{ type: "text", text: "\u4EFB\u52A1\u72B6\u6001\u5DF2\u5728\u672C\u5730\u66F4\u65B0" }], structuredContent: updated };
        }
        if (name === "read_task_canvas") {
          const taskData2 = await readCanvas(args);
          return {
            content: [{ type: "text", text: "\u4EFB\u52A1\u6570\u636E\u5DF2\u66F4\u65B0" }],
            structuredContent: taskData2
          };
        }
        if (name !== "open_task_canvas")
          throw Error("Unknown tool");
        const taskData = await readCanvas(args);
        const widgetData = {
          ...taskData,
          preferredDisplayMode: "fullscreen"
        };
        const label = taskData.repos.map((r) => r.projectDir.split("/").filter(Boolean).pop() || r.projectDir).join("\u3001");
        return {
          content: [{ type: "text", text: `\u4EFB\u52A1\u753B\u5E03\uFF1A${label}` }],
          structuredContent: widgetData,
          _meta: { "openai/outputTemplate": uri, widgetData }
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error.message }]
        };
      }
    }
    default:
      throw Error("Method not found");
  }
}
var input = createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on("line", async (line) => {
  let message;
  try {
    message = JSON.parse(line);
    if (message.id === void 0)
      return;
    const result = await handle(message);
    process.stdout.write(
      JSON.stringify({ jsonrpc: "2.0", id: message.id, result }) + "\n"
    );
  } catch (error) {
    if (message?.id !== void 0)
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32603, message: error.message }
        }) + "\n"
      );
  }
});
