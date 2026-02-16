import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { initDatabase } from "./db.js";
import { authMiddleware } from "./auth.js";
import { searchContractors, getContractor } from "./tools.js";
import { seedIfEmpty } from "./seed.js";

const app = express();
app.use(express.json());

function getBaseUrl(req?: express.Request): string {
  if (req?.headers.host) {
    const proto = req.headers["x-forwarded-proto"] || "https";
    return `${proto}://${req.headers.host}`;
  }
  if (process.env.REPLIT_DEPLOYMENT_URL) {
    return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return `http://localhost:${process.env.PORT || 5000}`;
}

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path} [${req.headers.authorization ? "auth" : "no-auth"}]`);
  next();
});

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "contractor-search",
    version: "1.0.0",
  });

  server.tool(
    "search_contractors",
    "Search for contractors by location, availability, certifications, sectors, or free text. Returns matching contractors with full profile data.",
    {
      query: z.string().optional().describe("Free text search across name, title, bio, skills"),
      location: z.string().optional().describe("Filter by location e.g. 'London', 'Manchester'"),
      availability: z.enum(["available", "within_30", "any"]).optional().describe("Filter by availability"),
      certifications: z.array(z.string()).optional().describe("Required certifications e.g. ['ISO 27001']"),
      max_rate: z.number().optional().describe("Maximum day rate in GBP"),
      limit: z.number().optional().describe("Results to return. Default 5."),
    },
    async (params) => {
      const result = await searchContractors(params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_contractor",
    "Get full profile for a specific contractor by ID.",
    {
      id: z.string().describe("Contractor UUID"),
    },
    async ({ id }) => {
      const contractor = await getContractor(id);
      if (!contractor) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Contractor not found" }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(contractor, null, 2) }],
      };
    }
  );

  return server;
}

const sseTransports: Record<string, SSEServerTransport> = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  const sessionId = transport.sessionId;
  sseTransports[sessionId] = transport;

  const server = createMcpServer();
  await server.connect(transport);

  res.on("close", () => {
    delete sseTransports[sessionId];
  });
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = sseTransports[sessionId];
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  await transport.handlePostMessage(req, res, req.body);
});

app.post("/mcp", async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
    });

    const server = createMcpServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// OAuth endpoints commented out for testing -- re-enable when auth is needed
// app.get("/.well-known/oauth-protected-resource", ...)
// app.get("/.well-known/oauth-authorization-server", ...)
// app.post("/oauth/register", ...)

app.get("/health", (_req, res) => {
  res.json({ status: "ok", name: "contractor-search", version: "1.0.0" });
});

app.get("/", (_req, res) => {
  res.json({
    name: "contractor-search",
    version: "1.0.0",
    description: "MCP server for searching contractor profiles. Connect via Claude Desktop using the /sse or /mcp endpoints.",
    endpoints: {
      sse: "/sse",
      streamable_http: "/mcp",
      health: "/health",
      oauth_metadata: "/.well-known/oauth-authorization-server",
      protected_resource: "/.well-known/oauth-protected-resource",
    },
  });
});

const PORT = parseInt(process.env.PORT || "5000", 10);

async function main() {
  await initDatabase();
  await seedIfEmpty();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MCP Server running on http://0.0.0.0:${PORT}`);
    console.log(`Base URL: ${getBaseUrl()}`);
    console.log(`SSE endpoint: /sse`);
    console.log(`Streamable HTTP endpoint: /mcp`);
    console.log(`Health check: /health`);
  });
}

main().catch(console.error);
