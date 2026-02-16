import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { initDatabase } from "./db.js";
import { authMiddleware } from "./auth.js";
import {
  searchContractors, getContractor, getContractorCV,
  listJobs, getJob, findMatchingContractors,
  createShortlist, addToShortlist, getShortlist, listShortlists, updateShortlistItemStatus,
  draftOutreach, listOutreach,
  bookContractor, getPipeline, updateJobStatus,
} from "./tools.js";
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
    version: "2.0.0",
  });

  server.tool(
    "search_contractors",
    "Search for contractors by location, availability, certifications, sectors, skills, clearance level, or free text. Returns matching contractors with profile summaries.",
    {
      query: z.string().optional().describe("Free text search across name, title, bio, skills"),
      location: z.string().optional().describe("Filter by location e.g. 'London', 'Manchester'"),
      availability: z.enum(["available", "within_30", "any"]).optional().describe("Filter by availability"),
      certifications: z.array(z.string()).optional().describe("Required certifications e.g. ['ISO 27001']"),
      skills: z.array(z.string()).optional().describe("Required skills e.g. ['Penetration Testing', 'SIEM']"),
      sector: z.string().optional().describe("Filter by sector e.g. 'Banking', 'NHS', 'Technology'"),
      max_rate: z.number().optional().describe("Maximum day rate in GBP"),
      min_experience: z.number().optional().describe("Minimum years of experience"),
      clearance: z.string().optional().describe("Required security clearance e.g. 'SC Cleared', 'DV Cleared'"),
      limit: z.number().optional().describe("Results to return. Default 10."),
    },
    async (params) => {
      const result = await searchContractors(params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_contractor",
    "Get full profile for a specific contractor by ID, including contact details.",
    { id: z.string().describe("Contractor UUID") },
    async ({ id }) => {
      const contractor = await getContractor(id);
      if (!contractor) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Contractor not found" }) }], isError: true };
      return { content: [{ type: "text" as const, text: JSON.stringify(contractor, null, 2) }] };
    }
  );

  server.tool(
    "get_contractor_cv",
    "Get complete CV for a contractor including work history, education, notable projects, languages, and full contact details.",
    { id: z.string().describe("Contractor UUID") },
    async ({ id }) => {
      const cv = await getContractorCV(id);
      if (!cv) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Contractor not found" }) }], isError: true };
      return { content: [{ type: "text" as const, text: JSON.stringify(cv, null, 2) }] };
    }
  );

  server.tool(
    "list_jobs",
    "List open jobs/roles that need filling. Filter by status, sector, urgency, or location.",
    {
      status: z.enum(["open", "shortlisting", "interviewing", "offered", "filled", "cancelled"]).optional().describe("Filter by job status. Default shows all."),
      sector: z.string().optional().describe("Filter by sector e.g. 'Banking', 'NHS', 'Technology'"),
      urgency: z.enum(["low", "normal", "urgent", "critical"]).optional().describe("Filter by urgency level"),
      location: z.string().optional().describe("Filter by location"),
      limit: z.number().optional().describe("Max results. Default 20."),
    },
    async (params) => {
      const result = await listJobs(params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_job",
    "Get full details for a specific job by ID.",
    { id: z.string().describe("Job UUID") },
    async ({ id }) => {
      const job = await getJob(id);
      if (!job) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Job not found" }) }], isError: true };
      return { content: [{ type: "text" as const, text: JSON.stringify(job, null, 2) }] };
    }
  );

  server.tool(
    "find_matching_contractors",
    "Find contractors that best match a specific job's requirements (certifications, skills, clearance, experience, location). Returns ranked matches with compatibility details.",
    {
      job_id: z.string().describe("Job UUID to match against"),
      limit: z.number().optional().describe("Max results. Default 10."),
    },
    async ({ job_id, limit }) => {
      const result = await findMatchingContractors(job_id, limit);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_shortlist",
    "Create a new shortlist for a role or project to track candidate contractors.",
    {
      name: z.string().describe("Shortlist name e.g. 'ISO 27001 Auditor - Meridian Bank'"),
      description: z.string().optional().describe("Description of what you're looking for"),
      role_title: z.string().optional().describe("The role title"),
      client_name: z.string().optional().describe("Client name"),
    },
    async (params) => {
      const result = await createShortlist(params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_to_shortlist",
    "Add a contractor to a shortlist with optional notes.",
    {
      shortlist_id: z.string().describe("Shortlist UUID"),
      contractor_id: z.string().describe("Contractor UUID"),
      notes: z.string().optional().describe("Notes about why this contractor is a good fit"),
    },
    async (params) => {
      const result = await addToShortlist(params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_shortlist",
    "Get a shortlist with all its candidate contractors and their status.",
    { id: z.string().describe("Shortlist UUID") },
    async ({ id }) => {
      const result = await getShortlist(id);
      if (!result) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Shortlist not found" }) }], isError: true };
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_shortlists",
    "List all shortlists, optionally filtered by status.",
    { status: z.enum(["active", "closed", "filled"]).optional().describe("Filter by status") },
    async ({ status }) => {
      const result = await listShortlists(status);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_candidate_status",
    "Update the status of a contractor on a shortlist (e.g. from shortlisted to contacted, interviewing, offered, accepted, declined).",
    {
      shortlist_id: z.string().describe("Shortlist UUID"),
      contractor_id: z.string().describe("Contractor UUID"),
      status: z.enum(["shortlisted", "contacted", "interviewing", "offered", "accepted", "declined", "withdrawn"]).describe("New status"),
    },
    async (params) => {
      const result = await updateShortlistItemStatus(params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "draft_outreach",
    "Save a draft outreach email for a contractor. Use this after composing a personalised message based on their CV and the job requirements.",
    {
      contractor_id: z.string().describe("Contractor UUID"),
      shortlist_id: z.string().optional().describe("Associated shortlist UUID"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body text"),
    },
    async (params) => {
      const result = await draftOutreach(params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_outreach",
    "List outreach drafts, optionally filtered by contractor or status.",
    {
      contractor_id: z.string().optional().describe("Filter by contractor UUID"),
      status: z.enum(["draft", "sent", "replied"]).optional().describe("Filter by status"),
    },
    async (params) => {
      const result = await listOutreach(params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "book_contractor",
    "Book a contractor for a role. This creates an engagement record and marks the contractor as unavailable.",
    {
      contractor_id: z.string().describe("Contractor UUID"),
      role_title: z.string().describe("The role/job title they're being booked for"),
      client_name: z.string().optional().describe("Client name"),
      shortlist_id: z.string().optional().describe("Associated shortlist UUID"),
      start_date: z.string().optional().describe("Engagement start date (YYYY-MM-DD)"),
      end_date: z.string().optional().describe("Engagement end date (YYYY-MM-DD)"),
      agreed_rate: z.number().optional().describe("Agreed day rate in GBP"),
      notes: z.string().optional().describe("Booking notes"),
    },
    async (params) => {
      const result = await bookContractor(params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_pipeline",
    "Get a complete overview of the recruitment pipeline: open jobs, active shortlists, engagements, and pending outreach.",
    {},
    async () => {
      const result = await getPipeline();
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_job_status",
    "Update the status of a job (e.g. from open to shortlisting, interviewing, offered, filled, or cancelled).",
    {
      id: z.string().describe("Job UUID"),
      status: z.enum(["open", "shortlisting", "interviewing", "offered", "filled", "cancelled"]).describe("New status"),
    },
    async ({ id, status }) => {
      const result = await updateJobStatus(id, status);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", name: "contractor-search", version: "2.0.0" });
});

app.get("/", (_req, res) => {
  res.json({
    name: "contractor-search",
    version: "2.0.0",
    description: "MCP server for contractor search, shortlisting, outreach, and booking. Connect via Claude Desktop using the /sse or /mcp endpoints.",
    tools: [
      "search_contractors", "get_contractor", "get_contractor_cv",
      "list_jobs", "get_job", "find_matching_contractors",
      "create_shortlist", "add_to_shortlist", "get_shortlist", "list_shortlists", "update_candidate_status",
      "draft_outreach", "list_outreach",
      "book_contractor", "get_pipeline", "update_job_status",
    ],
    endpoints: {
      sse: "/sse",
      streamable_http: "/mcp",
      health: "/health",
    },
  });
});

const PORT = parseInt(process.env.PORT || "5000", 10);

async function main() {
  await initDatabase();
  await seedIfEmpty();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MCP Server v2.0.0 running on http://0.0.0.0:${PORT}`);
    console.log(`Base URL: ${getBaseUrl()}`);
    console.log(`16 MCP tools registered`);
    console.log(`SSE endpoint: /sse`);
    console.log(`Streamable HTTP endpoint: /mcp`);
  });
}

main().catch(console.error);
