import { pool } from "./db.js";

interface SearchParams {
  query?: string;
  location?: string;
  availability?: string;
  certifications?: string[];
  max_rate?: number;
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

  if (params.max_rate) {
    conditions.push(`day_rate <= $${paramIndex}`);
    values.push(params.max_rate);
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
  const limit = params.limit || 5;

  const countQuery = `SELECT COUNT(*) as total FROM contractors ${whereClause}`;
  const countResult = await pool.query(countQuery, values);
  const totalMatches = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT id, name, initials, title, bio, location, day_rate, years_experience,
           availability, available_from, certifications, sectors, skills,
           rating, review_count, placement_count, security_clearance
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
            rating, review_count, placement_count, security_clearance, created_at
     FROM contractors WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

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
