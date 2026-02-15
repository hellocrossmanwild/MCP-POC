# Contractor Search MCP Server

## Overview
An MCP (Model Context Protocol) server that queries a PostgreSQL database of security contractors and returns structured data to Claude Desktop. Access is restricted to Google-authenticated users on an email allowlist.

## Architecture
- **Runtime:** Node.js 20 + TypeScript
- **MCP SDK:** @modelcontextprotocol/sdk (Streamable HTTP + SSE transports)
- **Database:** Replit PostgreSQL
- **Auth:** Google OAuth 2.1 + email allowlist in `allowed_users` table
- **Server:** Express.js on port 5000

## Project Structure
```
src/
  index.ts    - Express server, MCP tool registration, OAuth metadata endpoints
  db.ts       - Database pool + table initialization
  auth.ts     - Google OAuth token verification + allowlist check middleware
  tools.ts    - search_contractors and get_contractor query logic
  seed.ts     - Seeds 50 contractors across 3 sectors
```

## Database Tables
- **contractors** - 50 seed records across Financial Services (20), Healthcare/Public Sector (15), Technology (15)
- **allowed_users** - Email allowlist for access control

## MCP Endpoints
- `POST /mcp` - Streamable HTTP transport (modern clients)
- `GET /sse` - SSE transport (Claude Desktop)
- `POST /messages` - SSE message handler
- `GET /.well-known/oauth-authorization-server` - OAuth metadata
- `POST /oauth/register` - Dynamic client registration
- `GET /health` - Health check
- `GET /` - Server info

## MCP Tools
1. **search_contractors** - Search by location, availability, certifications, max rate, free text
2. **get_contractor** - Get full profile by UUID

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## Recent Changes
- 2026-02-15: Initial build - database schema, seed data, MCP server with auth
