import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { createBridgeServer } from "./server.js";

const openConnections = [];

afterEach(async () => {
  await Promise.all(openConnections.splice(0).map((connection) => connection.close()));
});

describe("Codex-Claude MCP bridge", () => {
  it("advertises the five bounded bridge tools", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createBridgeServer(process.cwd());
    const client = new Client({ name: "bridge-test-client", version: "0.1.0" });
    openConnections.push(client, server);

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const response = await client.listTools();

    expect(response.tools.map((tool) => tool.name)).toEqual([
      "claude_start",
      "claude_status",
      "claude_result",
      "claude_fix",
      "claude_interrupt",
    ]);
  });
});
