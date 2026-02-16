# Contractor Search MCP Server

## Overview
A full-lifecycle MCP (Model Context Protocol) server for managing security contractor recruitment. Supports search, shortlisting, outreach drafting, and booking -- all accessible through Claude Desktop. Backed by PostgreSQL with 50 enriched contractor profiles and 10 sample jobs.

## Architecture
- **Runtime:** Node.js 20 + TypeScript (strict mode)
- **MCP SDK:** @modelcontextprotocol/sdk (Streamable HTTP + SSE transports)
- **Database:** Replit PostgreSQL (all queries parameterised)
- **Auth:** Google OAuth 2.1 + email allowlist + API key auth
- **Server:** Express.js on port 5000

## Project Structure
```
src/
  index.ts    - Express server, 19 MCP tool registrations, SSE + Streamable HTTP transports
  types.ts    - Shared TypeScript interfaces, constants (SERVER_NAME, SERVER_VERSION), getBaseUrl utility
  db.ts       - Database pool + table initialization (contractors, jobs, shortlists, engagements, outreach)
  auth.ts     - Google OAuth token verification + allowlist check middleware (uses AuthenticatedRequest type)
  tools.ts    - All tool query logic (search, CV, jobs, shortlists, outreach, booking, pipeline)
  pdf.ts      - PDF report generation (contractor CV, shortlist, comparison)
  seed.ts     - Seeds 50 enriched contractors + 10 sample jobs, auto-seeds on startup if empty

__tests__/
  setup.ts              - Test environment setup (env vars)
  fixtures.ts           - 6 test contractors, 3 test jobs, helper factories
  unit/
    tools.test.ts       - 65 unit tests for all 16 tool functions (mocked DB)
    auth.test.ts        - 16 unit tests for auth middleware and OAuth flow
  integration/
    database.test.ts    - 30 integration tests against real PostgreSQL
```

## Database Tables
- **contractors** - 50 enriched records with CVs, work history, education, contact info across Financial Services (20), Healthcare/Public Sector (15), Technology (15)
- **jobs** - 10 sample open roles across sectors with requirements, rates, urgency levels
- **shortlists** - Named shortlists for tracking candidate groups per role
- **shortlist_items** - Individual contractor entries on shortlists with status tracking
- **engagements** - Booked contractor engagements with dates, rates, status
- **outreach_drafts** - Saved email drafts for contractor outreach
- **allowed_users** - Email allowlist for access control

## MCP Endpoints
- `POST /mcp` - Streamable HTTP transport (modern clients)
- `GET /sse` - SSE transport (Claude Desktop)
- `POST /messages` - SSE message handler
- `GET /health` - Health check
- `GET /` - Server info with tool listing

## MCP Tools (19 total)

### Search & Discovery
1. **search_contractors** - Search by location, availability, certifications, skills, sector, max rate, clearance, experience, free text
2. **get_contractor** - Get profile with contact details by UUID
3. **get_contractor_cv** - Get full CV: work history, education, notable projects, languages, contact info

### Jobs
4. **list_jobs** - List open roles, filter by status/sector/urgency/location
5. **get_job** - Full job details by UUID
6. **find_matching_contractors** - Auto-match contractors to a job's requirements with compatibility scoring
7. **update_job_status** - Change job status (open → shortlisting → interviewing → offered → filled)

### Shortlisting
8. **create_shortlist** - Create a named shortlist for a role
9. **add_to_shortlist** - Add contractor to shortlist with notes
10. **get_shortlist** - View shortlist with all candidates and status
11. **list_shortlists** - List all shortlists
12. **update_candidate_status** - Track candidate through pipeline (shortlisted → contacted → interviewing → offered → accepted)

### Outreach
13. **draft_outreach** - Save personalized outreach email draft
14. **list_outreach** - View outreach drafts by contractor or status

### Booking & Pipeline
15. **book_contractor** - Book contractor for role (creates engagement, marks as unavailable)
16. **get_pipeline** - Full recruitment pipeline overview: open jobs, active shortlists, engagements, pending outreach

### PDF Reports
17. **generate_contractor_pdf** - Generate downloadable PDF with full contractor CV, work history, education, contact details
18. **generate_shortlist_pdf** - Generate downloadable PDF report of a shortlist with all candidates and status
19. **generate_comparison_pdf** - Generate downloadable PDF comparing 2-10 contractors side-by-side (rates, skills, certs, ratings)

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional, for OAuth auth)
- `MCP_API_KEY` - API key for direct access (stored as secret)
- `PORT` - Server port (defaults to 5000)

## Testing
- **Framework:** Vitest with v8 coverage
- **Run tests:** `npm test` (or `npm run test:coverage` for coverage report)
- **111 total tests:** 65 unit (tools.ts), 16 unit (auth.ts), 30 integration (database)
- **Coverage:** 100% statements/lines on tools.ts, 90%+ on auth.ts, 95%+ on db.ts
- **Strategy:** Unit tests mock the database pool; integration tests use real PostgreSQL with fixture data and table truncation between tests
- **Edge cases covered:** Empty results, invalid UUIDs, malformed inputs, SQL injection attempts, null fields, combined filters

## Recent Changes
- 2026-02-16: Comprehensive test suite — 111 tests (Vitest), 100% coverage on tools.ts, unit + integration tests with fixtures, edge cases, SQL injection verification
- 2026-02-16: Code quality audit — eliminated all `any` types, added TypeScript interfaces (types.ts), consolidated duplicate `getBaseUrl`, removed dead code, added try/catch error handling to all 19 tool handlers, created `.env.example`, improved `.gitignore`
- 2026-02-16: v2.1 - Added PDF report generation: contractor CVs, shortlist reports, comparison documents (19 tools)
- 2026-02-16: v2.0 - Full lifecycle: enriched CVs, jobs, shortlists, outreach, booking, pipeline (16 tools)
- 2026-02-16: Auto-seed on startup for production deployment
- 2026-02-15: Initial build - database schema, seed data, MCP server with auth
