function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export function parseClaudeResult(output) {
  const events = output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseJsonLine)
    .filter(Boolean);
  const result = events.findLast((event) => event.type === "result");
  if (result) {
    return {
      resultText: typeof result.result === "string" ? result.result : "",
      sessionId: result.session_id ?? null,
    };
  }

  const single = events.length === 1 ? events[0] : null;
  return {
    resultText: typeof single?.result === "string" ? single.result : output.trim(),
    sessionId: single?.session_id ?? null,
  };
}

function summarizeToolInput(input) {
  if (!input || typeof input !== "object") {
    return "";
  }
  const value =
    input.file_path ??
    input.path ??
    input.pattern ??
    input.query ??
    input.command ??
    input.description ??
    "";
  return typeof value === "string" ? value.replace(/\s+/gu, " ").slice(0, 160) : "";
}

export function formatClaudeEvent(event) {
  if (!event || typeof event !== "object") {
    return [];
  }
  if (event.type === "system" && event.subtype === "init") {
    return [`[Claude] Session started · model ${event.model ?? "unknown"}`];
  }
  if (event.type === "assistant" && Array.isArray(event.message?.content)) {
    return event.message.content.flatMap((content) => {
      if (content.type === "text" && content.text?.trim()) {
        return [content.text.trim()];
      }
      if (content.type === "tool_use") {
        const summary = summarizeToolInput(content.input);
        return [`[Tool] ${content.name}${summary ? ` · ${summary}` : ""}`];
      }
      return [];
    });
  }
  if (event.type === "user" && Array.isArray(event.message?.content)) {
    const toolResults = event.message.content.filter((content) => content.type === "tool_result");
    return toolResults.length > 0 ? [`[Tool] ${toolResults.length} result received`] : [];
  }
  if (event.type === "result") {
    return [`[Claude] Finished · ${event.subtype ?? "unknown"}`];
  }
  return [];
}
