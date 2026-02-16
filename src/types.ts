/**
 * @file Shared TypeScript types and constants used across the MCP server.
 * Defines the data shapes for all PostgreSQL tables and utility functions
 * shared by tools, PDF generators, auth, and the Express server.
 */

import type { Request } from "express";

/** MCP server identifier used in protocol handshakes and health checks. */
export const SERVER_NAME = "contractor-search";

/** Semver version exposed via MCP protocol and /health endpoint. */
export const SERVER_VERSION = "2.0.0";

/**
 * Express Request extended by {@link authMiddleware} in auth.ts.
 * After successful authentication, `userEmail` is set to the verified
 * Google email or `"api-key-user"` for API key auth.
 */
export interface AuthenticatedRequest extends Request {
  userEmail?: string;
}

/**
 * Full contractor record as returned by PostgreSQL.
 *
 * **Caveat:** `day_rate`, `years_experience`, `rating`, `review_count`,
 * and `placement_count` come back as strings from the pg driver and
 * must be parsed with `parseInt`/`parseFloat` before arithmetic.
 */
export interface ContractorRow {
  id: string;
  name: string;
  initials: string;
  title: string;
  bio: string | null;
  location: string;
  day_rate: string | number;
  years_experience: string | number;
  availability: string;
  available_from: string | null;
  certifications: string[];
  sectors: string[];
  skills: string[];
  rating: string | null;
  review_count: string | number;
  placement_count: string | number;
  security_clearance: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  profile_photo_url: string | null;
  education: EducationEntry[];
  work_history: WorkHistoryEntry[];
  notable_projects: ProjectEntry[];
  languages: string[];
  created_at: string;
}

/** JSONB sub-object stored in the `contractors.education` column. */
export interface EducationEntry {
  institution: string;
  degree: string;
  year?: number;
}

/** JSONB sub-object stored in the `contractors.work_history` column. */
export interface WorkHistoryEntry {
  company: string;
  role: string;
  period: string;
  description: string;
}

/** JSONB sub-object stored in the `contractors.notable_projects` column. */
export interface ProjectEntry {
  name: string;
  description: string;
  client?: string;
}

/** Full job/role record from the `jobs` table. */
export interface JobRow {
  id: string;
  title: string;
  client_name: string;
  description: string;
  location: string;
  remote_option: string;
  day_rate_min: number | null;
  day_rate_max: number | null;
  duration_weeks: number | null;
  start_date: string | null;
  required_certifications: string[];
  required_skills: string[];
  required_clearance: string | null;
  sector: string | null;
  experience_min: number | null;
  status: string;
  urgency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Row from the `shortlists` table — a named collection of candidate contractors. */
export interface ShortlistRow {
  id: string;
  name: string;
  description: string | null;
  role_title: string | null;
  client_name: string | null;
  created_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Junction record linking a contractor to a shortlist, with per-candidate status and notes. */
export interface ShortlistItemRow {
  id: string;
  shortlist_id: string;
  contractor_id: string;
  notes: string | null;
  status: string;
  added_at: string;
  updated_at: string;
}

/** Draft or sent outreach email stored in `outreach_drafts`. */
export interface OutreachRow {
  id: string;
  contractor_id: string;
  shortlist_id: string | null;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

/** Engagement (booking) record tracking a contractor's placement on a role. */
export interface EngagementRow {
  id: string;
  contractor_id: string;
  shortlist_id: string | null;
  role_title: string;
  client_name: string | null;
  start_date: string | null;
  end_date: string | null;
  agreed_rate: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Resolves the server's public URL for generating PDF download links and OAuth redirects.
 *
 * Resolution priority:
 * 1. Request `Host` header (with `x-forwarded-proto` for scheme)
 * 2. `REPLIT_DEPLOYMENT_URL` env var (production deployments)
 * 3. `REPLIT_DEV_DOMAIN` env var (development previews)
 * 4. `http://localhost:{PORT}` fallback
 *
 * @param req - Optional Express request; when provided, the Host header takes priority.
 * @returns Fully-qualified base URL with no trailing slash.
 */
export function getBaseUrl(req?: Request): string {
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
