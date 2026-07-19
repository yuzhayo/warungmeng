import { exec, execFile, spawn } from "node:child_process";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  findScopeViolations,
  isAllowedValidationCommand,
  normalizeAllowedPaths,
} from "./policy.js";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const activeRuns = new Map();
const MAX_CAPTURE = 1_000_000;

function now() {
  return new Date().toISOString();
}

function runtimePath(projectRoot) {
  return path.join(projectRoot, ".codex-claude-bridge");
}

function runPath(projectRoot, runId) {
  return path.join(runtimePath(projectRoot), "runs", runId);
}

function resolveClaudeCommand() {
  if (process.env.CLAUDE_BRIDGE_COMMAND) {
    return process.env.CLAUDE_BRIDGE_COMMAND;
  }
  if (process.platform === "win32" && process.env.APPDATA) {
    const executable = path.join(
      process.env.APPDATA,
      "npm",
      "node_modules",
      "@anthropic-ai",
      "claude-code",
      "bin",
      "claude.exe",
    );
    if (existsSync(executable)) {
      return executable;
    }
  }
  return "claude";
}

async function writeJson(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function recordEvent(projectRoot, runId, type, details = {}) {
  await appendFile(
    path.join(runPath(projectRoot, runId), "events.jsonl"),
    `${JSON.stringify({ timestamp: now(), type, ...details })}\n`,
    "utf8",
  );
}

async function saveState(projectRoot, state, patch = {}) {
  const next = { ...state, ...patch, updatedAt: now() };
  await writeJson(path.join(runPath(projectRoot, state.runId), "run.json"), next);
  return next;
}

async function git(projectRoot, args) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 10_000_000,
  });
  return stdout.trim();
}

async function getChangedFiles(projectRoot) {
  const [unstaged, staged, untracked] = await Promise.all([
    git(projectRoot, ["diff", "--name-only"]),
    git(projectRoot, ["diff", "--cached", "--name-only"]),
    git(projectRoot, ["ls-files", "--others", "--exclude-standard"]),
  ]);
  return [
    ...new Set(
      [unstaged, staged, untracked]
        .flatMap((value) => value.split(/\r?\n/u))
        .map((value) => value.trim().replaceAll("\\", "/"))
        .filter(Boolean),
    ),
  ].sort();
}

function isProcessRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireLock(projectRoot, runId, staleLockRetried = false) {
  const lockPath = path.join(runtimePath(projectRoot), "lock");
  await mkdir(runtimePath(projectRoot), { recursive: true });
  try {
    await mkdir(lockPath);
  } catch (error) {
    if (error?.code === "EEXIST") {
      let owner = "another run";
      let ownerMetadata = null;
      try {
        ownerMetadata = await readJson(path.join(lockPath, "owner.json"));
        owner = ownerMetadata.runId ?? owner;
      } catch {
        // Keep the generic owner when the lock metadata cannot be read.
      }
      if (
        !staleLockRetried &&
        ownerMetadata?.serverPid &&
        !isProcessRunning(ownerMetadata.serverPid)
      ) {
        await rm(lockPath, { recursive: true, force: true });
        return acquireLock(projectRoot, runId, true);
      }
      throw new Error(`Claude bridge is locked by ${owner}`, { cause: error });
    }
    throw error;
  }
  await writeJson(path.join(lockPath, "owner.json"), {
    runId,
    serverPid: process.pid,
    createdAt: now(),
  });
}

async function releaseLock(projectRoot, runId) {
  const lockPath = path.join(runtimePath(projectRoot), "lock");
  try {
    const owner = await readJson(path.join(lockPath, "owner.json"));
    if (owner.runId === runId) {
      await rm(lockPath, { recursive: true, force: true });
    }
  } catch {
    // A missing lock is already released.
  }
}

function buildWorkerPrompt(state, task, feedback) {
  const scope = state.allowedPaths.map((entry) => `- ${entry}`).join("\n");
  const validations = state.validationCommands.map((entry) => `- ${entry}`).join("\n");
  return `You are a bounded implementation worker supervised by Codex.

Project root: ${state.projectRoot}
Mode: ${state.mode}
Attempt: ${state.attempt}/${state.maxAttempts}

Allowed file scope:
${scope || "- Read-only; do not modify files"}

Validation commands will be run by the bridge after you finish:
${validations || "- None"}

Rules:
- Read CLAUDE.md and the nearest applicable AGENTS.md before acting.
- Do not touch files outside the allowed scope.
- Do not commit, push, merge, deploy, install dependencies, or run destructive Git commands.
- Do not modify bridge runtime files or logs.
- In read-only mode, inspect and report only; do not edit.
- Keep changes surgical and preserve unrelated work.
- Finish with a concise report: outcome, files touched, validations not run, and unresolved issues.

Task:
${task}
${feedback ? `\nSupervisor feedback for this attempt:\n${feedback}\n` : ""}`;
}

async function runValidation(projectRoot, runId, command, index) {
  const logPath = path.join(runPath(projectRoot, runId), `validation-${index + 1}.log`);
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 10_000_000,
      timeout: 300_000,
    });
    await writeFile(logPath, `${stdout}${stderr}`, "utf8");
    return { command, exitCode: 0, passed: true };
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : String(error.message);
    await writeFile(logPath, `${stdout}${stderr}`, "utf8");
    return {
      command,
      exitCode: typeof error.code === "number" ? error.code : 1,
      passed: false,
    };
  }
}

async function finalizeRun(projectRoot, state, exitCode, stdout, stderr) {
  try {
    const current = await loadRun(projectRoot, state.runId);
    if (current.status === "CANCELLING") {
      await saveState(projectRoot, current, { exitCode, status: "CANCELLED" });
      await recordEvent(projectRoot, state.runId, "cancelled", { exitCode });
      return;
    }

    let parsedOutput = null;
    try {
      parsedOutput = JSON.parse(stdout);
    } catch {
      // Preserve raw output when Claude did not return a JSON envelope.
    }
    const resultText =
      typeof parsedOutput?.result === "string" ? parsedOutput.result : stdout.trim();
    const changedFiles = await getChangedFiles(projectRoot);
    const scopeViolations =
      state.mode === "write" ? findScopeViolations(changedFiles, state.allowedPaths) : [];
    const diff = await git(projectRoot, ["diff", "--no-ext-diff"]);

    await writeFile(path.join(runPath(projectRoot, state.runId), "diff.patch"), diff, "utf8");
    await writeJson(path.join(runPath(projectRoot, state.runId), "result.json"), {
      exitCode,
      resultText,
      sessionId: parsedOutput?.session_id ?? null,
      changedFiles,
      scopeViolations,
    });

    let next = await saveState(projectRoot, current, {
      changedFiles,
      exitCode,
      scopeViolations,
      status: exitCode !== 0 ? "FAILED" : scopeViolations.length > 0 ? "BLOCKED" : "VALIDATING",
    });

    if (next.status === "VALIDATING") {
      const validations = [];
      for (const [index, command] of state.validationCommands.entries()) {
        validations.push(await runValidation(projectRoot, state.runId, command, index));
      }
      const validationFailed = validations.some((result) => !result.passed);
      next = await saveState(projectRoot, next, {
        validations,
        status: validationFailed ? "FIX_REQUIRED" : "REVIEW_READY",
      });
    }

    await recordEvent(projectRoot, state.runId, "worker_finished", {
      exitCode,
      status: next.status,
    });
  } catch (error) {
    const current = await loadRun(projectRoot, state.runId);
    await saveState(projectRoot, current, {
      error: error instanceof Error ? error.message : String(error),
      status: "FAILED",
    });
  } finally {
    activeRuns.delete(state.runId);
    await releaseLock(projectRoot, state.runId);
    if (stderr.trim()) {
      await recordEvent(projectRoot, state.runId, "worker_stderr", {
        bytes: Buffer.byteLength(stderr),
      });
    }
  }
}

async function launchClaude(projectRoot, state, prompt) {
  const directory = runPath(projectRoot, state.runId);
  const promptPath = path.join(directory, `prompt-${state.attempt}.md`);
  const stdoutPath = path.join(directory, `stdout-${state.attempt}.log`);
  const stderrPath = path.join(directory, `stderr-${state.attempt}.log`);
  await writeFile(promptPath, prompt, "utf8");
  await writeFile(stdoutPath, "", "utf8");
  await writeFile(stderrPath, "", "utf8");

  const args = [
    "--print",
    "--output-format",
    "json",
    "--no-session-persistence",
    "--permission-mode",
    state.mode === "write" ? "acceptEdits" : "plan",
    "--effort",
    state.effort,
    "--model",
    state.model,
    "--tools",
    state.mode === "write" ? "Read,Glob,Grep,Edit,Write" : "Read,Glob,Grep",
  ];
  const child = spawn(resolveClaudeCommand(), args, {
    cwd: projectRoot,
    env: process.env,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  activeRuns.set(state.runId, child);
  let stdout = "";
  let stderr = "";
  let timeout;
  let setupFailed = false;
  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    stdout = `${stdout}${text}`.slice(-MAX_CAPTURE);
    void appendFile(stdoutPath, text, "utf8");
  });
  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    stderr = `${stderr}${text}`.slice(-MAX_CAPTURE);
    void appendFile(stderrPath, text, "utf8");
  });
  child.on("error", (error) => {
    stderr = `${stderr}\n${error.message}`.slice(-MAX_CAPTURE);
  });
  child.on("close", (code) => {
    clearTimeout(timeout);
    if (!setupFailed) {
      void finalizeRun(projectRoot, state, code ?? 1, stdout, stderr);
    }
  });

  try {
    state = await saveState(projectRoot, state, { pid: child.pid, status: "WORKER_RUNNING" });
    await recordEvent(projectRoot, state.runId, "worker_started", { pid: child.pid });
    child.stdin.end(prompt);
    timeout = setTimeout(() => {
      void saveState(projectRoot, state, { status: "CANCELLING", error: "Worker timed out" });
      child.kill();
    }, state.timeoutSeconds * 1_000);
    timeout.unref();
  } catch (error) {
    setupFailed = true;
    activeRuns.delete(state.runId);
    child.kill();
    throw error;
  }
}

export async function loadRun(projectRoot, runId) {
  return readJson(path.join(runPath(projectRoot, runId), "run.json"));
}

export async function startRun(projectRoot, input) {
  const runId = crypto.randomUUID();
  const mode = input.mode ?? "read-only";
  const allowedPaths = normalizeAllowedPaths(input.allowedPaths ?? []);
  const validationCommands = input.validationCommands ?? [];
  if (mode === "write" && allowedPaths.length === 0) {
    throw new Error("Write mode requires at least one allowed path");
  }
  const invalidCommand = validationCommands.find((command) => !isAllowedValidationCommand(command));
  if (invalidCommand) {
    throw new Error(`Validation command is not allowed: ${invalidCommand}`);
  }
  if (mode === "write" && (await getChangedFiles(projectRoot)).length > 0) {
    throw new Error("Write mode requires a clean working tree");
  }

  await acquireLock(projectRoot, runId);
  try {
    const directory = runPath(projectRoot, runId);
    await mkdir(directory, { recursive: true });
    let state = {
      runId,
      status: "CREATED",
      createdAt: now(),
      updatedAt: now(),
      projectRoot,
      baseCommit: await git(projectRoot, ["rev-parse", "HEAD"]),
      mode,
      model: input.model ?? "sonnet",
      effort: input.effort ?? "high",
      attempt: 1,
      maxAttempts: input.maxAttempts ?? 3,
      timeoutSeconds: input.timeoutSeconds ?? 1_800,
      allowedPaths,
      validationCommands,
      changedFiles: [],
      validations: [],
    };
    await writeJson(path.join(directory, "run.json"), state);
    await writeFile(path.join(directory, "task.md"), input.task, "utf8");
    await writeFile(path.join(directory, "events.jsonl"), "", "utf8");
    await recordEvent(projectRoot, runId, "run_created");
    const prompt = buildWorkerPrompt(state, input.task, null);
    await launchClaude(projectRoot, state, prompt);
    state = await loadRun(projectRoot, runId);
    return state;
  } catch (error) {
    await releaseLock(projectRoot, runId);
    throw error;
  }
}

export async function fixRun(projectRoot, runId, feedback) {
  let state = await loadRun(projectRoot, runId);
  if (!["FAILED", "FIX_REQUIRED", "REVIEW_READY"].includes(state.status)) {
    throw new Error(`Run ${runId} cannot be fixed from status ${state.status}`);
  }
  if (state.attempt >= state.maxAttempts) {
    throw new Error(`Run ${runId} reached its maximum attempts`);
  }
  if ((await git(projectRoot, ["rev-parse", "HEAD"])) !== state.baseCommit) {
    throw new Error("Repository HEAD changed after the run started");
  }
  const changedFiles = await getChangedFiles(projectRoot);
  const violations =
    state.mode === "write" ? findScopeViolations(changedFiles, state.allowedPaths) : [];
  if (violations.length > 0) {
    throw new Error(`Current changes exceed the allowlist: ${violations.join(", ")}`);
  }

  await acquireLock(projectRoot, runId);
  try {
    state = await saveState(projectRoot, state, {
      attempt: state.attempt + 1,
      error: null,
      status: "CREATED",
    });
    const originalTask = await readFile(path.join(runPath(projectRoot, runId), "task.md"), "utf8");
    const prompt = buildWorkerPrompt(state, originalTask, feedback);
    await recordEvent(projectRoot, runId, "fix_requested", { attempt: state.attempt });
    await launchClaude(projectRoot, state, prompt);
    return loadRun(projectRoot, runId);
  } catch (error) {
    await releaseLock(projectRoot, runId);
    throw error;
  }
}

export async function interruptRun(projectRoot, runId) {
  const state = await loadRun(projectRoot, runId);
  if (!["CREATED", "WORKER_RUNNING", "VALIDATING"].includes(state.status)) {
    return state;
  }
  const next = await saveState(projectRoot, state, { status: "CANCELLING" });
  const child = activeRuns.get(runId);
  if (child) {
    child.kill();
  } else if (state.pid) {
    if (process.platform === "win32") {
      await execFileAsync("taskkill", ["/PID", String(state.pid), "/T", "/F"]).catch(() => {});
    } else {
      process.kill(state.pid, "SIGTERM");
    }
  }
  await recordEvent(projectRoot, runId, "interrupt_requested");
  return next;
}

export async function getRunResult(projectRoot, runId) {
  const state = await loadRun(projectRoot, runId);
  const directory = runPath(projectRoot, runId);
  const optionalRead = async (name) => {
    try {
      return await readFile(path.join(directory, name), "utf8");
    } catch {
      return null;
    }
  };
  const result = await optionalRead("result.json");
  const diff = await optionalRead("diff.patch");
  return {
    state,
    result: result ? JSON.parse(result) : null,
    diff,
  };
}
