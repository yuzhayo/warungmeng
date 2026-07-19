import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatClaudeEvent } from "./claudeStream.js";

const TERMINAL_STATUSES = new Set([
  "REVIEW_READY",
  "FIX_REQUIRED",
  "FAILED",
  "BLOCKED",
  "CANCELLED",
]);
const runId = process.argv[2];
const projectRoot = process.env.CLAUDE_BRIDGE_PROJECT_ROOT || process.cwd();

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(runId)) {
  console.error("Usage: npm run bridge:watch -- <run-id>");
  process.exitCode = 1;
} else {
  await watchRun();
}

async function optionalRead(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function printNewJsonLines(content, cursor) {
  const completeLength = content.lastIndexOf("\n") + 1;
  if (completeLength <= cursor) {
    return cursor;
  }
  for (const line of content.slice(cursor, completeLength).split(/\r?\n/u)) {
    if (!line.trim()) {
      continue;
    }
    try {
      for (const message of formatClaudeEvent(JSON.parse(line))) {
        console.log(message);
      }
    } catch {
      console.log(line);
    }
  }
  return completeLength;
}

async function waitForState(statePath) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const content = await optionalRead(statePath);
    if (content) {
      return JSON.parse(content);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Run ${runId} was not found`);
}

async function watchRun() {
  const directory = path.join(projectRoot, ".codex-claude-bridge", "runs", runId);
  const statePath = path.join(directory, "run.json");
  let state = await waitForState(statePath);
  let lastStatus = null;
  let lastAttempt = null;
  let stdoutCursor = 0;
  let stderrCursor = 0;

  process.title = `Claude bridge · ${runId.slice(0, 8)}`;
  console.log("Codex → Claude live worker");
  console.log(`Run: ${runId}`);
  console.log(`Project: ${projectRoot}`);
  console.log("─".repeat(72));

  while (true) {
    const stateContent = await optionalRead(statePath);
    if (stateContent) {
      state = JSON.parse(stateContent);
    }
    if (state.attempt !== lastAttempt) {
      lastAttempt = state.attempt;
      stdoutCursor = 0;
      stderrCursor = 0;
      console.log(`\n[Bridge] Attempt ${state.attempt}/${state.maxAttempts}`);
    }
    if (state.status !== lastStatus) {
      lastStatus = state.status;
      console.log(`[Bridge] ${state.status}`);
    }

    const stdout = await optionalRead(path.join(directory, `stdout-${state.attempt}.log`));
    if (stdout !== null) {
      stdoutCursor = printNewJsonLines(stdout, stdoutCursor);
    }
    const stderr = await optionalRead(path.join(directory, `stderr-${state.attempt}.log`));
    if (stderr !== null && stderr.length > stderrCursor) {
      const next = stderr.slice(stderrCursor);
      stderrCursor = stderr.length;
      if (next.trim()) {
        console.error(next.trimEnd());
      }
    }

    if (TERMINAL_STATUSES.has(state.status)) {
      console.log("─".repeat(72));
      if (Array.isArray(state.validations) && state.validations.length > 0) {
        for (const validation of state.validations) {
          console.log(
            `[Validation] ${validation.passed ? "PASS" : "FAIL"} · ${validation.command}`,
          );
        }
      }
      console.log(`[Bridge] Final status: ${state.status}`);
      console.log("You may close this terminal.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}
