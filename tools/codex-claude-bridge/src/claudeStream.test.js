import { describe, expect, it } from "vitest";
import { formatClaudeEvent, parseClaudeResult } from "./claudeStream.js";

describe("Claude stream parser", () => {
  it("extracts the final result from stream-json output", () => {
    const output = [
      JSON.stringify({ type: "system", subtype: "init", session_id: "session-1" }),
      JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "Done" }] } }),
      JSON.stringify({
        type: "result",
        subtype: "success",
        result: "Final report",
        session_id: "session-1",
      }),
    ].join("\n");

    expect(parseClaudeResult(output)).toEqual({
      resultText: "Final report",
      sessionId: "session-1",
    });
  });

  it("formats assistant text and tool use without dumping full input", () => {
    expect(
      formatClaudeEvent({
        type: "assistant",
        message: {
          content: [
            { type: "text", text: "Inspecting the file." },
            {
              type: "tool_use",
              name: "Read",
              input: { file_path: "apps/admin/src/App.tsx", extra: "ignored" },
            },
          ],
        },
      }),
    ).toEqual(["Inspecting the file.", "[Tool] Read · apps/admin/src/App.tsx"]);
  });
});
