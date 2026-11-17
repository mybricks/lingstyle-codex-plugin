import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);

// packages/core/src/cli/index.mjs
import path2 from "node:path";

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
async function loadCanvasData(state, args2) {
  const result = await fetch(`${state.origin}/canvas-data`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${state.secret}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(args2),
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

// packages/core/src/cli/index.mjs
var help = `Usage: node packages/core/dist/cli.mjs open --project <absolute-directory> [--task <relative-file>]

Starts or reuses the local daemon and prints the browser URL.`;
var args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(help);
  process.exit(0);
}
try {
  if (args.shift() !== "open")
    throw new Error(help);
  let projectDir, taskPath;
  while (args.length) {
    const flag = args.shift();
    if (flag === "--project" || flag === "--task") {
      const value = args.shift();
      if (!value || value.startsWith("--"))
        throw new Error(`Missing value for ${flag}`);
      if (flag === "--project")
        projectDir = value;
      else
        taskPath = value;
    } else
      throw new Error(`Unknown option: ${flag}`);
  }
  if (!projectDir || !path2.isAbsolute(projectDir) || taskPath && path2.isAbsolute(taskPath))
    throw new Error(
      "--project must be absolute and --task, if provided, must be project-relative"
    );
  const state = await ensureDaemon();
  const { canvasUrl } = await loadCanvasData(state, { projectDir, taskPath });
  console.log(canvasUrl);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
