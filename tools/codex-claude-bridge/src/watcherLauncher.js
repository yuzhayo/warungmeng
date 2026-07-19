import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";

function quoteBatch(value) {
  return `"${value.replaceAll("%", "%%").replaceAll('"', '""')}"`;
}

export async function launchWatcherTerminal(projectRoot, runId) {
  if (
    process.platform !== "win32" ||
    process.env.CLAUDE_BRIDGE_AUTO_WATCHER?.toLowerCase() === "false"
  ) {
    return false;
  }

  const watcherScript = path.join(projectRoot, "tools", "codex-claude-bridge", "src", "watch.js");
  const commandFile = path.join(projectRoot, ".codex-claude-bridge", "runs", runId, "watch.cmd");
  await writeFile(
    commandFile,
    [
      "@echo off",
      `title Claude bridge - ${runId.slice(0, 8)}`,
      `cd /d ${quoteBatch(projectRoot)}`,
      `${quoteBatch(process.execPath)} ${quoteBatch(watcherScript)} ${quoteBatch(runId)}`,
      "echo.",
      "pause",
      "",
    ].join("\r\n"),
    "utf8",
  );

  const child = spawn("explorer.exe", [commandFile], {
    cwd: projectRoot,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return true;
}
