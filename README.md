# MCP Recruitment Pipeline — Proof of Concept

An MCP server that turns a recruitment database into an AI-queryable pipeline. Instead of clicking through dashboards and writing filters, you ask Claude plain-English questions and it searches contractors, builds shortlists, drafts outreach, and books engagements — all through structured tool calls against a live PostgreSQL database. Built to demonstrate how service businesses can make their methodology accessible through Claude. Built by [HelloCrossman](https://hellocrossman.com).

## What It Does

19 MCP tools that cover the full contractor recruitment lifecycle. Connect Claude to your database and ask:

- *"Show me available contractors in London with ISO 27001 under £600/day"*
- *"What open jobs do we have that are marked as urgent?"*
- *"Find matching contractors for the FinConnect pen testing role"*
- *"Create a shortlist for the Meridian Bank compliance audit"*
- *"Draft outreach for the top candidates — mention their PCI DSS experience"*
- *"Book Sarah Chen for the senior auditor role at £575/day"*
- *"Give me a full pipeline overview"*
- *"Generate a PDF comparison of these three candidates"*

Claude calls the right tools, chains them together, and handles the workflow end-to-end.

## Screenshots

See the [`/screenshots`](./screenshots) directory for examples of Claude Desktop interacting with the server.

## Architecture

```
Claude Desktop / Claude.ai
        │
        ▼
  MCP Server (Express.js)
  ├── Streamable HTTP  POST /mcp
  └── SSE              GET  /sse
        │
        ▼
  PostgreSQL
  ├── contractors  (50 enriched profiles)
  ├── jobs         (10 open roles)
  ├── shortlists + shortlist_items
  ├── engagements
  └── outreach_drafts
```

**Stack:** TypeScript · Node.js 20 · `@modelcontextprotocol/sdk` · Express · PostgreSQL · PDFKit · Google OAuth 2.1 · Vitest

## MCP Tools

| Tool | What it does | Key parameters |
|------|-------------|----------------|
| `search_contractors` | Search by location, skills, certs, rate, clearance, free text | `query`, `location`, `availability`, `certifications`, `skills`, `sector`, `max_rate`, `min_experience`, `clearance`, `limit` |
| `get_contractor` | Full profile by ID | `id` |
| `get_contractor_cv` | Complete CV: work history, education, projects, languages | `id` |
| `list_jobs` | List open roles with filters | `status`, `sector`, `urgency`, `location`, `limit` |
| `get_job` | Full job details by ID | `id` |
| `find_matching_contractors` | Auto-match contractors to a job's requirements | `job_id`, `limit` |
| `update_job_status` | Move job through pipeline stages | `id`, `status` |
| `create_shortlist` | Create a named shortlist for a role | `name`, `description`, `role_title`, `client_name` |
| `add_to_shortlist` | Add contractor to shortlist with notes | `shortlist_id`, `contractor_id`, `notes` |
| `get_shortlist` | View shortlist with all candidates | `id` |
| `list_shortlists` | List all shortlists | `status` |
| `update_candidate_status` | Track candidate through pipeline | `shortlist_id`, `contractor_id`, `status` |
| `draft_outreach` | Save a personalised outreach email | `contractor_id`, `shortlist_id`, `subject`, `body` |
| `list_outreach` | View outreach drafts | `contractor_id`, `status` |
| `book_contractor` | Book contractor for a role | `contractor_id`, `role_title`, `client_name`, `start_date`, `end_date`, `agreed_rate` |
| `get_pipeline` | Full recruitment pipeline overview | — |
| `generate_contractor_pdf` | PDF report with full contractor CV | `contractor_id` |
| `generate_shortlist_pdf` | PDF report of a shortlist | `shortlist_id` |
| `generate_comparison_pdf` | Side-by-side PDF comparing 2–10 contractors | `contractor_ids` |

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/hellocrossman/mcp-recruitment-pipeline.git
cd mcp-recruitment-pipeline

# 2. Install dependencies
npm install

# 3. Set up PostgreSQL
#    Create a database and note the connection string.
#    On Replit, this is handled automatically.

# 4. Configure environment variables
cp .env.example .env
#    Edit .env with your DATABASE_URL and auth settings

# 5. Run database migrations
npm run migrate

# 6. Seed the database with sample data
npm run seed

# 7. Start the server
npm run dev
```

The server starts on port 5000 with 50 contractor profiles and 10 open roles.

## Connect to Claude

### Claude Desktop (SSE)

Add to your Claude Desktop MCP config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "recruitment": {
      "url": "https://your-deployment-url/sse",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY"
      }
    }
  }
}
```

### Claude.ai (Streamable HTTP)

In Claude.ai settings, add a custom MCP connector:

- **URL:** `https://your-deployment-url/mcp`
- **Auth:** Bearer token (your `MCP_API_KEY`)

## Make It Your Own

This is a proof of concept — the structure is designed to be forked and adapted to any service domain. Key steps:

1. **Define your data model.** Replace `contractors` with your domain entities (candidates, properties, products, inventory). Update the migration files in `migrations/` and the schema in `src/db.ts`.

2. **Update the seed data.** Edit `src/seed.ts` with realistic records for your domain. The current 50 contractor profiles show the level of enrichment that makes AI interactions useful.

3. **Modify the tool handlers.** Each function in `src/tools.ts` maps to one MCP tool. Rename them, change the query logic, add new tools. The pattern is always: validate input → build parameterised query → return structured result.

4. **Deploy.** Push to Replit, Railway, Fly.io, or any Node.js host with PostgreSQL access.

## Project Structure

```
src/
  index.ts        Entry point — Express server, 19 MCP tool registrations
  types.ts        Shared TypeScript interfaces and constants
  db.ts           Database pool and schema initialization
  auth.ts         Google OAuth + API key middleware
  tools.ts        Query builders for all 16 data tools
  pdf.ts          PDF report generators (contractor CV, shortlist, comparison)
  seed.ts         50 contractor profiles + 10 sample jobs

migrations/       Numbered SQL migration files
scripts/          Utility scripts (migrate runner)
__tests__/        111 tests (unit + integration)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (default: `5000`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID for token verification |
| `MCP_API_KEY` | No | API key for direct access without OAuth |

At least one auth method (`GOOGLE_CLIENT_ID` or `MCP_API_KEY`) is recommended for production.

## Running Tests

```bash
npm test              # Run all 111 tests
npm run test:coverage # Run with coverage report
npm run test:watch    # Watch mode during development
npm run lint          # Type-check without emitting
```

**Coverage:** 100% on tool handlers, 90%+ on auth, 95%+ on database layer. Tests include unit tests with mocked DB, integration tests against real PostgreSQL, and edge cases for invalid inputs and SQL injection attempts.

## License

MIT — see [LICENSE](./LICENSE).

## Built By

**[HelloCrossman](https://hellocrossman.com)** — We turn service businesses into agentic software.
