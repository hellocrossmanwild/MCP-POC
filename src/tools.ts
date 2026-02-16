/**
 * @file MCP tool implementations for the contractor management platform.
 *
 * Each exported function maps 1-to-1 to an MCP tool exposed by the server in
 * `index.ts`. Functions build parameterised SQL queries against the PostgreSQL
 * database (via `pool` from `db.ts`) and return plain objects that the MCP
 * transport layer serialises as JSON.
 *
 * Numeric columns (day_rate, years_experience, rating, review_count,
 * placement_count) are explicitly parsed from strings to numbers because the
 * `pg` driver returns PostgreSQL numeric/integer values as strings.
 */

import { pool } from "./db.js";
import type { ContractorRow, JobRow } from "./types.js";

/**
 * Parameters for {@link searchContractors}.
 *
 * Every field is optional — omitting all fields returns the first `limit`
 * contractors ordered by rating.
 */
interface SearchParams {
  /** Free-text search across name, title, bio, and skills (uses LIKE with wildcards). */
  query?: string;
  /** Exact (case-insensitive) location filter. */
  location?: string;
  /** Availability status. The value `"any"` is treated as no filter. */
  availability?: string;
  /** Overlap filter — matches contractors whose certifications array intersects. */
  certifications?: string[];
  /** Upper bound (inclusive) on `day_rate`. */
  max_rate?: number;
  /** Exact match against any entry in the contractor's `sectors` array. */
  sector?: string;
  /** Overlap filter — matches contractors whose skills array intersects. */
  skills?: string[];
  /** Lower bound (inclusive) on `years_experience`. */
  min_experience?: number;
  /** Exact match on `security_clearance`. */
  clearance?: string;
  /** Maximum number of contractors to return. Defaults to 10. */
  limit?: number;
}

/**
 * Search contractors with up to 9 optional filters built into a dynamic WHERE clause.
 *
 * @param params - See {@link SearchParams}. All fields optional.
 * @returns `{ total_matches, showing, contractors[] }` where `total_matches` is
 *   the unscoped count of matching rows and `showing` is the number returned
 *   after the LIMIT.
 *
 * @example
 * // { total_matches: 42, showing: 10, contractors: [{ id, name, … }] }
 *
 * @remarks
 * - `availability: "any"` is explicitly ignored so callers can pass it without effect.
 * - The `query` param wraps the value in `%…%` and LIKEs across name, title,
 *   bio, and each element of the skills array.
 * - `limit` defaults to 10 when omitted.
 * - Numeric fields (`day_rate`, `years_experience`, `rating`, `review_count`,
 *   `placement_count`) are parsed from string to number.
 */
export async function searchContractors(params: SearchParams) {
  const conditions: string[] = [];
  const values: (string | number | string[])[] = [];
  let paramIndex = 1;

  if (params.location) {
    conditions.push(`LOWER(location) = LOWER($${paramIndex})`);
    values.push(params.location);
    paramIndex++;
  }

  if (params.availability && params.availability !== "any") {
    conditions.push(`availability = $${paramIndex}`);
    values.push(params.availability);
    paramIndex++;
  }

  if (params.certifications && params.certifications.length > 0) {
    conditions.push(`certifications && $${paramIndex}`);
    values.push(params.certifications);
    paramIndex++;
  }

  if (params.skills && params.skills.length > 0) {
    conditions.push(`skills && $${paramIndex}`);
    values.push(params.skills);
    paramIndex++;
  }

  if (params.max_rate) {
    conditions.push(`day_rate <= $${paramIndex}`);
    values.push(params.max_rate);
    paramIndex++;
  }

  if (params.sector) {
    conditions.push(`$${paramIndex} = ANY(sectors)`);
    values.push(params.sector);
    paramIndex++;
  }

  if (params.min_experience) {
    conditions.push(`years_experience >= $${paramIndex}`);
    values.push(params.min_experience);
    paramIndex++;
  }

  if (params.clearance) {
    conditions.push(`security_clearance = $${paramIndex}`);
    values.push(params.clearance);
    paramIndex++;
  }

  if (params.query) {
    conditions.push(`(
      LOWER(name) LIKE LOWER($${paramIndex}) OR
      LOWER(title) LIKE LOWER($${paramIndex}) OR
      LOWER(COALESCE(bio, '')) LIKE LOWER($${paramIndex}) OR
      EXISTS (SELECT 1 FROM unnest(skills) s WHERE LOWER(s) LIKE LOWER($${paramIndex}))
    )`);
    values.push(`%${params.query}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 10;

  const countQuery = `SELECT COUNT(*) as total FROM contractors ${whereClause}`;
  const countResult = await pool.query(countQuery, values);
  const totalMatches = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT id, name, initials, title, bio, location, day_rate, years_experience,
           availability, available_from, certifications, sectors, skills,
           rating, review_count, placement_count, security_clearance, email, linkedin_url
    FROM contractors
    ${whereClause}
    ORDER BY rating DESC NULLS LAST, review_count DESC
    LIMIT $${paramIndex}
  `;
  values.push(limit);

  const dataResult = await pool.query(dataQuery, values);

  return {
    total_matches: totalMatches,
    showing: dataResult.rows.length,
    contractors: dataResult.rows.map((row: ContractorRow) => ({
      ...row,
      day_rate: parseInt(String(row.day_rate), 10),
      years_experience: parseInt(String(row.years_experience), 10),
      rating: row.rating ? parseFloat(String(row.rating)) : null,
      review_count: parseInt(String(row.review_count), 10),
      placement_count: parseInt(String(row.placement_count), 10),
    })),
  };
}

/**
 * Fetch a single contractor's profile by UUID.
 *
 * @param id - Contractor UUID.
 * @returns The contractor object with parsed numeric fields, or `null` if not found.
 *
 * @example
 * // { id: "abc-123", name: "Jane Doe", day_rate: 650, … } | null
 */
export async function getContractor(id: string) {
  const result = await pool.query(
    `SELECT id, name, initials, title, bio, location, day_rate, years_experience,
            availability, available_from, certifications, sectors, skills,
            rating, review_count, placement_count, security_clearance, created_at,
            email, phone, linkedin_url
     FROM contractors WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const row: ContractorRow = result.rows[0];
  return {
    ...row,
    day_rate: parseInt(String(row.day_rate), 10),
    years_experience: parseInt(String(row.years_experience), 10),
    rating: row.rating ? parseFloat(String(row.rating)) : null,
    review_count: parseInt(String(row.review_count), 10),
    placement_count: parseInt(String(row.placement_count), 10),
  };
}

/**
 * Fetch a contractor's full CV including education, work history, notable
 * projects, and languages.
 *
 * @param id - Contractor UUID.
 * @returns The contractor object with CV-specific fields, or `null` if not found.
 *
 * @example
 * // { id: "abc-123", name: "Jane Doe", education: [...], work_history: [...], … } | null
 */
export async function getContractorCV(id: string) {
  const result = await pool.query(
    `SELECT id, name, initials, title, bio, location, day_rate, years_experience,
            availability, certifications, sectors, skills,
            rating, review_count, placement_count, security_clearance,
            email, phone, linkedin_url,
            education, work_history, notable_projects, languages
     FROM contractors WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const row: ContractorRow = result.rows[0];
  return {
    ...row,
    day_rate: parseInt(String(row.day_rate), 10),
    years_experience: parseInt(String(row.years_experience), 10),
    rating: row.rating ? parseFloat(String(row.rating)) : null,
    review_count: parseInt(String(row.review_count), 10),
    placement_count: parseInt(String(row.placement_count), 10),
  };
}

/**
 * Parameters for {@link listJobs}.
 *
 * All fields optional — omitting all returns the first `limit` jobs ordered by
 * urgency then creation date.
 */
interface ListJobsParams {
  /** Filter by job status (e.g. `"open"`, `"filled"`). */
  status?: string;
  /** Case-insensitive sector filter. */
  sector?: string;
  /** Urgency level: `"critical"`, `"urgent"`, `"normal"`, or `"low"`. */
  urgency?: string;
  /** Case-insensitive location filter. */
  location?: string;
  /** Maximum number of jobs to return. Defaults to 20. */
  limit?: number;
}

/**
 * List jobs with optional filters, ordered by urgency (critical → low) then
 * creation date descending.
 *
 * @param params - See {@link ListJobsParams}.
 * @returns `{ total, jobs[] }` where `total` is the count of returned rows.
 *
 * @example
 * // { total: 5, jobs: [{ id, title, urgency: "critical", … }] }
 */
export async function listJobs(params: ListJobsParams) {
  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (params.status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(params.status);
    paramIndex++;
  }

  if (params.sector) {
    conditions.push(`LOWER(sector) = LOWER($${paramIndex})`);
    values.push(params.sector);
    paramIndex++;
  }

  if (params.urgency) {
    conditions.push(`urgency = $${paramIndex}`);
    values.push(params.urgency);
    paramIndex++;
  }

  if (params.location) {
    conditions.push(`LOWER(location) = LOWER($${paramIndex})`);
    values.push(params.location);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit || 20;

  const result = await pool.query(
    `SELECT * FROM jobs ${whereClause} ORDER BY
      CASE urgency WHEN 'critical' THEN 1 WHEN 'urgent' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END,
      created_at DESC
     LIMIT $${paramIndex}`,
    [...values, limit]
  );

  return {
    total: result.rows.length,
    jobs: result.rows as JobRow[],
  };
}

/**
 * Fetch a single job by UUID.
 *
 * @param id - Job UUID.
 * @returns The job row, or `null` if not found.
 */
export async function getJob(id: string) {
  const result = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as JobRow;
}

/**
 * Auto-match contractors to a job's requirements and return compatibility details.
 *
 * Filters contractors by the job's required certifications, skills, clearance,
 * and minimum experience. Always excludes contractors with `availability = 'unavailable'`.
 * Results are sorted by location match, then rating, then experience.
 *
 * @param jobId - UUID of the job to match against.
 * @param limit - Maximum matches to return. Defaults to 10.
 * @returns `{ job, total_matches, contractors[] }` where each contractor includes
 *   `matching_certifications`, `matching_skills`, `location_match`, and
 *   `within_budget` flags — or `{ error }` if the job is not found.
 *
 * @example
 * // { job: { id, title, … }, total_matches: 3, contractors: [{ …, location_match: true, within_budget: true }] }
 * // { error: "Job not found" }
 */
export async function findMatchingContractors(jobId: string, limit?: number) {
  const job = await getJob(jobId);
  if (!job) return { error: "Job not found" };

  const conditions: string[] = [];
  const values: (string | number | string[])[] = [];
  let paramIndex = 1;

  if (job.required_certifications && job.required_certifications.length > 0) {
    conditions.push(`certifications && $${paramIndex}`);
    values.push(job.required_certifications);
    paramIndex++;
  }

  if (job.required_skills && job.required_skills.length > 0) {
    conditions.push(`skills && $${paramIndex}`);
    values.push(job.required_skills);
    paramIndex++;
  }

  if (job.required_clearance) {
    conditions.push(`security_clearance = $${paramIndex}`);
    values.push(job.required_clearance);
    paramIndex++;
  }

  if (job.experience_min) {
    conditions.push(`years_experience >= $${paramIndex}`);
    values.push(job.experience_min);
    paramIndex++;
  }

  conditions.push(`availability != 'unavailable'`);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const maxResults = limit || 10;

  const result = await pool.query(
    `SELECT id, name, title, location, day_rate, years_experience, availability,
            certifications, skills, rating, review_count, security_clearance, email
     FROM contractors
     ${whereClause}
     ORDER BY
       CASE WHEN LOWER(location) = LOWER($${paramIndex}) THEN 0 ELSE 1 END,
       rating DESC NULLS LAST,
       years_experience DESC
     LIMIT $${paramIndex + 1}`,
    [...values, job.location, maxResults]
  );

  const contractors = result.rows.map((row: ContractorRow) => {
    const certMatch = job.required_certifications?.filter((c: string) => row.certifications?.includes(c)) || [];
    const skillMatch = job.required_skills?.filter((s: string) => row.skills?.includes(s)) || [];
    return {
      ...row,
      day_rate: parseInt(String(row.day_rate), 10),
      years_experience: parseInt(String(row.years_experience), 10),
      rating: row.rating ? parseFloat(String(row.rating)) : null,
      matching_certifications: certMatch,
      matching_skills: skillMatch,
      location_match: row.location.toLowerCase() === job.location.toLowerCase(),
      within_budget: parseInt(String(row.day_rate), 10) <= (job.day_rate_max || Infinity),
    };
  });

  return {
    job: { id: job.id, title: job.title, client_name: job.client_name, location: job.location },
    total_matches: contractors.length,
    contractors,
  };
}

/** Parameters for {@link createShortlist}. */
interface CreateShortlistParams {
  /** Display name for the shortlist. */
  name: string;
  /** Optional description of the shortlist's purpose. */
  description?: string;
  /** Role title the shortlist targets. */
  role_title?: string;
  /** Client the shortlist is prepared for. */
  client_name?: string;
}

/**
 * Create a new shortlist.
 *
 * @param params - See {@link CreateShortlistParams}. Only `name` is required.
 * @returns The newly inserted shortlist row (all columns via `RETURNING *`).
 *
 * @example
 * // { id: "sl-123", name: "Q1 DevOps", status: "active", … }
 */
export async function createShortlist(params: CreateShortlistParams) {
  const result = await pool.query(
    `INSERT INTO shortlists (name, description, role_title, client_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.name, params.description || null, params.role_title || null, params.client_name || null]
  );
  return result.rows[0];
}

/**
 * Parameters for {@link addToShortlist}.
 *
 * Uses `ON CONFLICT (shortlist_id, contractor_id)` for upsert — re-adding a
 * contractor that already exists on the shortlist will update `notes` and
 * `updated_at` instead of failing.
 */
interface AddToShortlistParams {
  /** UUID of the target shortlist. */
  shortlist_id: string;
  /** UUID of the contractor to add. */
  contractor_id: string;
  /** Optional notes about why this contractor was shortlisted. */
  notes?: string;
}

/**
 * Add a contractor to a shortlist (upsert).
 *
 * Validates the contractor exists before inserting. If the contractor is already
 * on the shortlist, the existing row's `notes` and `updated_at` are updated.
 *
 * @param params - See {@link AddToShortlistParams}.
 * @returns The upserted row plus `contractor_name` and `contractor_title`,
 *   or `{ error: "Contractor not found" }`.
 *
 * @example
 * // { id: "si-1", shortlist_id: "sl-1", contractor_name: "Jane", … }
 * // { error: "Contractor not found" }
 */
export async function addToShortlist(params: AddToShortlistParams) {
  const contractor = await pool.query(`SELECT name, title FROM contractors WHERE id = $1`, [params.contractor_id]);
  if (contractor.rows.length === 0) return { error: "Contractor not found" };

  const result = await pool.query(
    `INSERT INTO shortlist_items (shortlist_id, contractor_id, notes)
     VALUES ($1, $2, $3)
     ON CONFLICT (shortlist_id, contractor_id) DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
     RETURNING *`,
    [params.shortlist_id, params.contractor_id, params.notes || null]
  );

  return {
    ...result.rows[0],
    contractor_name: contractor.rows[0].name,
    contractor_title: contractor.rows[0].title,
  };
}

/**
 * Fetch a shortlist by UUID including all candidate details via JOIN.
 *
 * @param id - Shortlist UUID.
 * @returns The shortlist object with a `candidates[]` array (each with parsed
 *   numeric fields), or `null` if the shortlist does not exist.
 *
 * @example
 * // { id: "sl-1", name: "DevOps Q1", candidates: [{ name: "Jane", day_rate: 650, … }] }
 * // null
 */
export async function getShortlist(id: string) {
  const shortlist = await pool.query(`SELECT * FROM shortlists WHERE id = $1`, [id]);
  if (shortlist.rows.length === 0) return null;

  const items = await pool.query(
    `SELECT si.*, c.name, c.title, c.location, c.day_rate, c.availability, c.rating, c.email, c.certifications, c.skills
     FROM shortlist_items si
     JOIN contractors c ON si.contractor_id = c.id
     WHERE si.shortlist_id = $1
     ORDER BY si.added_at`,
    [id]
  );

  return {
    ...shortlist.rows[0],
    candidates: items.rows.map((row: ContractorRow & ShortlistItemRow) => ({
      ...row,
      day_rate: parseInt(String(row.day_rate), 10),
      rating: row.rating ? parseFloat(String(row.rating)) : null,
    })),
  };
}

type ShortlistItemRow = { status: string; notes: string | null; added_at: string; updated_at: string };

/**
 * List all shortlists, optionally filtered by status.
 *
 * Each row includes a `candidate_count` derived from a LEFT JOIN on
 * `shortlist_items`, so shortlists with no candidates show `0`.
 *
 * @param status - Optional status filter (e.g. `"active"`, `"closed"`).
 * @returns Array of shortlist rows with `candidate_count`.
 *
 * @example
 * // [{ id: "sl-1", name: "DevOps Q1", candidate_count: "3", … }]
 */
export async function listShortlists(status?: string) {
  const query = status
    ? `SELECT s.*, COUNT(si.id) as candidate_count FROM shortlists s LEFT JOIN shortlist_items si ON s.id = si.shortlist_id WHERE s.status = $1 GROUP BY s.id ORDER BY s.created_at DESC`
    : `SELECT s.*, COUNT(si.id) as candidate_count FROM shortlists s LEFT JOIN shortlist_items si ON s.id = si.shortlist_id GROUP BY s.id ORDER BY s.created_at DESC`;

  const result = status ? await pool.query(query, [status]) : await pool.query(query);
  return result.rows;
}

/**
 * Parameters for {@link updateShortlistItemStatus}.
 */
interface UpdateShortlistItemStatusParams {
  /** UUID of the shortlist containing the item. */
  shortlist_id: string;
  /** UUID of the contractor whose status is being changed. */
  contractor_id: string;
  /** New status value (e.g. `"accepted"`, `"rejected"`, `"pending"`). */
  status: string;
}

/**
 * Update the status of a contractor on a shortlist.
 *
 * @param params - See {@link UpdateShortlistItemStatusParams}.
 * @returns The updated row (via `RETURNING *`), or `{ error: "Shortlist item not found" }`.
 *
 * @example
 * // { id: "si-1", status: "accepted", updated_at: "…", … }
 * // { error: "Shortlist item not found" }
 */
export async function updateShortlistItemStatus(params: UpdateShortlistItemStatusParams) {
  const result = await pool.query(
    `UPDATE shortlist_items SET status = $1, updated_at = NOW()
     WHERE shortlist_id = $2 AND contractor_id = $3
     RETURNING *`,
    [params.status, params.shortlist_id, params.contractor_id]
  );
  if (result.rows.length === 0) return { error: "Shortlist item not found" };
  return result.rows[0];
}

/**
 * Parameters for {@link draftOutreach}.
 */
interface DraftOutreachParams {
  /** UUID of the contractor to contact. */
  contractor_id: string;
  /** Optional shortlist this outreach relates to. */
  shortlist_id?: string;
  /** Email subject line. */
  subject: string;
  /** Email body content. */
  body: string;
}

/**
 * Create an outreach draft for a contractor.
 *
 * Validates the contractor exists before inserting.
 *
 * @param params - See {@link DraftOutreachParams}.
 * @returns The inserted draft row plus `contractor_name` and `contractor_email`,
 *   or `{ error: "Contractor not found" }`.
 *
 * @example
 * // { id: "od-1", subject: "Opportunity", contractor_name: "Jane", contractor_email: "jane@…", … }
 * // { error: "Contractor not found" }
 */
export async function draftOutreach(params: DraftOutreachParams) {
  const contractor = await pool.query(`SELECT name, email FROM contractors WHERE id = $1`, [params.contractor_id]);
  if (contractor.rows.length === 0) return { error: "Contractor not found" };

  const result = await pool.query(
    `INSERT INTO outreach_drafts (contractor_id, shortlist_id, subject, body)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.contractor_id, params.shortlist_id || null, params.subject, params.body]
  );

  return {
    ...result.rows[0],
    contractor_name: contractor.rows[0].name,
    contractor_email: contractor.rows[0].email,
  };
}

/**
 * Parameters for {@link listOutreach}.
 */
interface ListOutreachParams {
  /** Filter drafts by contractor UUID. */
  contractor_id?: string;
  /** Filter by draft status (e.g. `"draft"`, `"sent"`). */
  status?: string;
}

/**
 * List outreach drafts with optional filters, joined with contractor details.
 *
 * @param params - See {@link ListOutreachParams}. Both fields optional.
 * @returns Array of outreach rows, each including `contractor_name` and
 *   `contractor_email`, ordered by creation date descending.
 *
 * @example
 * // [{ id: "od-1", subject: "…", contractor_name: "Jane", status: "draft", … }]
 */
export async function listOutreach(params?: ListOutreachParams) {
  const conditions: string[] = [];
  const values: string[] = [];
  let paramIndex = 1;

  if (params?.contractor_id) {
    conditions.push(`od.contractor_id = $${paramIndex}`);
    values.push(params.contractor_id);
    paramIndex++;
  }

  if (params?.status) {
    conditions.push(`od.status = $${paramIndex}`);
    values.push(params.status);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT od.*, c.name as contractor_name, c.email as contractor_email
     FROM outreach_drafts od
     JOIN contractors c ON od.contractor_id = c.id
     ${whereClause}
     ORDER BY od.created_at DESC`,
    values
  );

  return result.rows;
}

/**
 * Parameters for {@link bookContractor}.
 */
interface BookContractorParams {
  /** UUID of the contractor to book. */
  contractor_id: string;
  /** Title of the role the contractor is being booked for. */
  role_title: string;
  /** Client the engagement is with. */
  client_name?: string;
  /** Shortlist this booking originated from. If provided, the corresponding shortlist item is marked `"accepted"`. */
  shortlist_id?: string;
  /** Engagement start date (ISO 8601 string). */
  start_date?: string;
  /** Engagement end date (ISO 8601 string). */
  end_date?: string;
  /** Agreed daily rate for the engagement. */
  agreed_rate?: number;
  /** Free-text notes about the engagement. */
  notes?: string;
}

/**
 * Book a contractor by creating an engagement and updating related records.
 *
 * **Side-effects:**
 * 1. Sets the contractor's `availability` to `"unavailable"`.
 * 2. If `shortlist_id` is provided, marks the matching `shortlist_item` as `"accepted"`.
 *
 * @param params - See {@link BookContractorParams}.
 * @returns `{ engagement, contractor_name, contractor_email, message }`,
 *   or `{ error: "Contractor not found" }`.
 *
 * @example
 * // { engagement: { id: "eng-1", status: "confirmed", … }, contractor_name: "Jane", message: "Jane has been booked…" }
 * // { error: "Contractor not found" }
 */
export async function bookContractor(params: BookContractorParams) {
  const contractor = await pool.query(`SELECT name, title, email FROM contractors WHERE id = $1`, [params.contractor_id]);
  if (contractor.rows.length === 0) return { error: "Contractor not found" };

  const engagement = await pool.query(
    `INSERT INTO engagements (contractor_id, shortlist_id, role_title, client_name, start_date, end_date, agreed_rate, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8)
     RETURNING *`,
    [
      params.contractor_id, params.shortlist_id || null, params.role_title,
      params.client_name || null, params.start_date || null, params.end_date || null,
      params.agreed_rate || null, params.notes || null,
    ]
  );

  await pool.query(
    `UPDATE contractors SET availability = 'unavailable' WHERE id = $1`,
    [params.contractor_id]
  );

  if (params.shortlist_id) {
    await pool.query(
      `UPDATE shortlist_items SET status = 'accepted', updated_at = NOW()
       WHERE shortlist_id = $1 AND contractor_id = $2`,
      [params.shortlist_id, params.contractor_id]
    );
  }

  return {
    engagement: engagement.rows[0],
    contractor_name: contractor.rows[0].name,
    contractor_email: contractor.rows[0].email,
    message: `${contractor.rows[0].name} has been booked for ${params.role_title}. Their availability has been updated to unavailable.`,
  };
}

/**
 * Aggregate a pipeline overview across open jobs, active shortlists,
 * engagements, and pending outreach.
 *
 * @returns `{ open_jobs[], active_shortlists[], active_engagements[], pending_outreach[], summary }`.
 *   `summary` contains integer counts for each category.
 *
 * @example
 * // { open_jobs: [...], summary: { open_jobs_count: 4, active_shortlists_count: 2, … } }
 */
export async function getPipeline() {
  const openJobs = await pool.query(
    `SELECT id, title, client_name, status, urgency, location, start_date
     FROM jobs WHERE status NOT IN ('filled', 'cancelled')
     ORDER BY CASE urgency WHEN 'critical' THEN 1 WHEN 'urgent' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END`
  );

  const activeShortlists = await pool.query(
    `SELECT s.id, s.name, s.role_title, s.client_name, s.status, COUNT(si.id) as candidate_count
     FROM shortlists s
     LEFT JOIN shortlist_items si ON s.id = si.shortlist_id
     WHERE s.status = 'active'
     GROUP BY s.id
     ORDER BY s.created_at DESC`
  );

  const activeEngagements = await pool.query(
    `SELECT e.*, c.name as contractor_name
     FROM engagements e
     JOIN contractors c ON e.contractor_id = c.id
     WHERE e.status IN ('pending', 'confirmed', 'active')
     ORDER BY e.start_date`
  );

  const pendingOutreach = await pool.query(
    `SELECT od.id, od.subject, od.status, c.name as contractor_name
     FROM outreach_drafts od
     JOIN contractors c ON od.contractor_id = c.id
     WHERE od.status = 'draft'
     ORDER BY od.created_at DESC`
  );

  return {
    open_jobs: openJobs.rows,
    active_shortlists: activeShortlists.rows,
    active_engagements: activeEngagements.rows,
    pending_outreach: pendingOutreach.rows,
    summary: {
      open_jobs_count: openJobs.rows.length,
      active_shortlists_count: activeShortlists.rows.length,
      active_engagements_count: activeEngagements.rows.length,
      pending_outreach_count: pendingOutreach.rows.length,
    },
  };
}

/**
 * Update a job's status.
 *
 * @param id - Job UUID.
 * @param status - New status value (e.g. `"open"`, `"filled"`, `"cancelled"`).
 * @returns The updated job row (via `RETURNING *`), or `{ error: "Job not found" }`.
 *
 * @example
 * // { id: "job-1", status: "filled", updated_at: "…", … }
 * // { error: "Job not found" }
 */
export async function updateJobStatus(id: string, status: string) {
  const result = await pool.query(
    `UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (result.rows.length === 0) return { error: "Job not found" };
  return result.rows[0];
}
