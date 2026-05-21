import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createAIOpsCoordinatorAgent } from "../../infrastructure/adk/aiops-coordinator";
import { zodToJsonSchema } from "zod-to-json-schema";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");
config({ path: resolve(rootDir, ".env.local") });
config({ path: resolve(rootDir, ".env") });

const agent = createAIOpsCoordinatorAgent();

const server = new Server(
  {
    name: "aiops-prime-copilot",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: agent.tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.parameters),
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = agent.tools.find((t: any) => t.name === request.params.name);
  if (!tool) {
    throw new Error(`Tool not found: ${request.params.name}`);
  }

  try {
    const result = await (tool as any).execute(request.params.arguments);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AIOps MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
