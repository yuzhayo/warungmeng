import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fixRun, getRunResult, interruptRun, loadRun, startRun } from "./bridgeRuntime.js";

function toolResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

export function createBridgeServer(projectRoot = process.cwd()) {
  const server = new McpServer(
    { name: "codex-claude-bridge", version: "0.1.0" },
    {
      instructions:
        "Delegate bounded tasks to Claude only when the user asks. Never run Codex and Claude as concurrent writers. Use claude_start, poll claude_status, inspect claude_result and the actual diff, then request at most the configured fix attempts. Write mode requires a clean tree and an explicit path allowlist. Never auto-commit, push, merge, or deploy.",
    },
  );

  server.registerTool(
    "claude_start",
    {
      title: "Start Claude worker",
      description:
        "Start a bounded Claude CLI run and return a run ID immediately. Use read-only for analysis and write only with a clean tree and explicit allowed paths.",
      inputSchema: {
        task: z.string().min(1),
        mode: z.enum(["read-only", "write"]).default("read-only"),
        allowedPaths: z.array(z.string()).default([]),
        validationCommands: z.array(z.string()).default([]),
        model: z.string().default("sonnet"),
        effort: z.enum(["low", "medium", "high", "xhigh", "max"]).default("high"),
        timeoutSeconds: z.number().int().min(30).max(3_600).default(1_800),
        maxAttempts: z.number().int().min(1).max(3).default(3),
        openWatcher: z.boolean().default(true),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input) => toolResult(await startRun(projectRoot, input)),
  );

  server.registerTool(
    "claude_status",
    {
      title: "Read Claude worker status",
      description: "Read the latest state for a Claude bridge run.",
      inputSchema: { runId: z.string().uuid() },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ runId }) => toolResult(await loadRun(projectRoot, runId)),
  );

  server.registerTool(
    "claude_result",
    {
      title: "Read Claude worker result",
      description:
        "Read the worker report, changed-file list, validation results, and captured Git diff. Codex must still inspect the live source before approval.",
      inputSchema: { runId: z.string().uuid() },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ runId }) => toolResult(await getRunResult(projectRoot, runId)),
  );

  server.registerTool(
    "claude_fix",
    {
      title: "Request a Claude worker fix",
      description:
        "Send bounded supervisor feedback for another attempt on the same run. The original allowlist and maximum-attempt limit remain enforced.",
      inputSchema: {
        runId: z.string().uuid(),
        feedback: z.string().min(1),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ runId, feedback }) => toolResult(await fixRun(projectRoot, runId, feedback)),
  );

  server.registerTool(
    "claude_interrupt",
    {
      title: "Interrupt Claude worker",
      description: "Stop an active Claude bridge run and mark it cancelled.",
      inputSchema: { runId: z.string().uuid() },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ runId }) => toolResult(await interruptRun(projectRoot, runId)),
  );

  return server;
}
