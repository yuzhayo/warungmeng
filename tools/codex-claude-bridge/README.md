# Codex-Claude Bridge

Project-local MCP server that lets Codex delegate one bounded task to Claude CLI while Codex remains the supervisor.

## Safety model

- Read-only is the default mode.
- Write mode requires a clean Git working tree and repository-relative allowed paths.
- Only one bridge run may write at a time.
- Validation commands are restricted to known read-only lint, typecheck, test, build, formatting-check, Ant Design lint, and Git inspection commands.
- A run has at most three attempts.
- The bridge never commits, pushes, merges, deploys, installs dependencies, or discards changes.
- Runtime prompts, logs, status, and diffs are stored in the ignored `.codex-claude-bridge/` directory.

## Project configuration

Add this server to `.codex/config.toml`:

```toml
[mcp_servers.claude_bridge]
command = "node"
args = ["tools/codex-claude-bridge/src/index.js"]
cwd = "C:\\VSCODE\\AntD\\warungmeng"
startup_timeout_sec = 30
tool_timeout_sec = 60
default_tools_approval_mode = "writes"
enabled = true
```

Restart Codex after changing MCP configuration. The project-local delegation workflow is in `.agents/skills/delegate-claude/`.

## Tools

- `claude_start`: start a read-only or bounded write run.
- `claude_status`: poll run state.
- `claude_result`: read the report, validation results, changed files, and diff.
- `claude_fix`: request one bounded correction using the same scope.
- `claude_interrupt`: stop an active worker.

Run the server directly with `npm run bridge:start`.
