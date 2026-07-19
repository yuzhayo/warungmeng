import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createBridgeServer } from "./server.js";

const projectRoot = process.env.CLAUDE_BRIDGE_PROJECT_ROOT || process.cwd();
const server = createBridgeServer(projectRoot);
const transport = new StdioServerTransport();

await server.connect(transport);
