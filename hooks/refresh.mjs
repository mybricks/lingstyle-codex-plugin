import { appendFile, mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const stateDir = process.env.TASK_FIRST_STATE_DIR || path.join(os.tmpdir(), `task-first-${process.getuid?.() ?? os.userInfo().username}`);
const hook = ["PostToolUse", "Stop"].includes(process.argv[2]) ? process.argv[2] : "unknown";
async function record(stage, detail = "") {
  try {
    await mkdir(stateDir, { recursive: true, mode: 0o700 });
    await appendFile(path.join(stateDir, "hooks.jsonl"), JSON.stringify({ at: new Date().toISOString(), hook, stage, detail }) + "\n", { mode: 0o600 });
  } catch {}
}
// Record entry before attempting to notify; never interrupt the agent's work.
await record("已启动");
try {
  const state = JSON.parse(await readFile(path.join(stateDir, "daemon.json"), "utf8"));
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(state.origin) || !/^[0-9a-f]{64}$/.test(state.secret)) throw Error("daemon 状态无效");
  const response = await fetch(`${state.origin}/refresh`, {
    method: "POST",
    headers: { authorization: `Bearer ${state.secret}`, "content-type": "application/json" },
    body: JSON.stringify({ hook }),
    signal: AbortSignal.timeout(1000),
  });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  await record("通知成功", `HTTP ${response.status}`);
} catch (error) {
  await record("通知失败", error.code === "ENOENT" ? "daemon 未运行或状态文件不存在" : (error.name === "TimeoutError" ? "请求超时" : error.message));
}
