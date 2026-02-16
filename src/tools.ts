import { pool } from "./db.js";

interface SearchParams {
  query?: string;
  location?: string;
  availability?: string;
  certifications?: string[];
  max_rate?: number;
  sector?: string;
  skills?: string[];
  min_experience?: number;
  clearance?: string;
  limit?: number;
}

export async function searchContractors(params: SearchParams) {
  const conditions: string[] = [];
  const values: any[] = [];
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
    contractors: dataResult.rows.map(row => ({
      ...row,
      day_rate: parseInt(row.day_rate, 10),
      years_experience: parseInt(row.years_experience, 10),
      rating: row.rating ? parseFloat(row.rating) : null,
      review_count: parseInt(row.review_count, 10),
      placement_count: parseInt(row.placement_count, 10),
    })),
  };
}

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

  const row = result.rows[0];
  return {
    ...row,
    day_rate: parseInt(row.day_rate, 10),
    years_experience: parseInt(row.years_experience, 10),
    rating: row.rating ? parseFloat(row.rating) : null,
    review_count: parseInt(row.review_count, 10),
    placement_count: parseInt(row.placement_count, 10),
  };
}

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

  const row = result.rows[0];
  return {
    ...row,
    day_rate: parseInt(row.day_rate, 10),
    years_experience: parseInt(row.years_experience, 10),
    rating: row.rating ? parseFloat(row.rating) : null,
    review_count: parseInt(row.review_count, 10),
    placement_count: parseInt(row.placement_count, 10),
  };
}

export async function listJobs(params: { status?: string; sector?: string; urgency?: string; location?: string; limit?: number }) {
  const conditions: string[] = [];
  const values: any[] = [];
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
    jobs: result.rows,
  };
}

export async function getJob(id: string) {
  const result = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function findMatchingContractors(jobId: string, limit?: number) {
  const job = await getJob(jobId);
  if (!job) return { error: "Job not found" };

  const conditions: string[] = [];
  const values: any[] = [];
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

  const contractors = result.rows.map(row => {
    const certMatch = job.required_certifications?.filter((c: string) => row.certifications?.includes(c)) || [];
    const skillMatch = job.required_skills?.filter((s: string) => row.skills?.includes(s)) || [];
    return {
      ...row,
      day_rate: parseInt(row.day_rate, 10),
      years_experience: parseInt(row.years_experience, 10),
      rating: row.rating ? parseFloat(row.rating) : null,
      matching_certifications: certMatch,
      matching_skills: skillMatch,
      location_match: row.location.toLowerCase() === job.location.toLowerCase(),
      within_budget: row.day_rate <= (job.day_rate_max || Infinity),
    };
  });

  return {
    job: { id: job.id, title: job.title, client_name: job.client_name, location: job.location },
    total_matches: contractors.length,
    contractors,
  };
}

export async function createShortlist(params: { name: string; description?: string; role_title?: string; client_name?: string; job_id?: string }) {
  const result = await pool.query(
    `INSERT INTO shortlists (name, description, role_title, client_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.name, params.description || null, params.role_title || null, params.client_name || null]
  );
  return result.rows[0];
}

export async function addToShortlist(params: { shortlist_id: string; contractor_id: string; notes?: string }) {
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
    candidates: items.rows.map(row => ({
      ...row,
      day_rate: parseInt(row.day_rate, 10),
      rating: row.rating ? parseFloat(row.rating) : null,
    })),
  };
}

export async function listShortlists(status?: string) {
  const query = status
    ? `SELECT s.*, COUNT(si.id) as candidate_count FROM shortlists s LEFT JOIN shortlist_items si ON s.id = si.shortlist_id WHERE s.status = $1 GROUP BY s.id ORDER BY s.created_at DESC`
    : `SELECT s.*, COUNT(si.id) as candidate_count FROM shortlists s LEFT JOIN shortlist_items si ON s.id = si.shortlist_id GROUP BY s.id ORDER BY s.created_at DESC`;

  const result = status ? await pool.query(query, [status]) : await pool.query(query);
  return result.rows;
}

export async function updateShortlistItemStatus(params: { shortlist_id: string; contractor_id: string; status: string }) {
  const result = await pool.query(
    `UPDATE shortlist_items SET status = $1, updated_at = NOW()
     WHERE shortlist_id = $2 AND contractor_id = $3
     RETURNING *`,
    [params.status, params.shortlist_id, params.contractor_id]
  );
  if (result.rows.length === 0) return { error: "Shortlist item not found" };
  return result.rows[0];
}

export async function draftOutreach(params: { contractor_id: string; job_id?: string; shortlist_id?: string; subject: string; body: string }) {
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

export async function listOutreach(params?: { contractor_id?: string; status?: string }) {
  const conditions: string[] = [];
  const values: any[] = [];
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

export async function bookContractor(params: {
  contractor_id: string;
  role_title: string;
  client_name?: string;
  shortlist_id?: string;
  start_date?: string;
  end_date?: string;
  agreed_rate?: number;
  notes?: string;
}) {
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

export async function updateJobStatus(id: string, status: string) {
  const result = await pool.query(
    `UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (result.rows.length === 0) return { error: "Job not found" };
  return result.rows[0];
}
