import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contractors (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      title TEXT NOT NULL,
      bio TEXT,
      location TEXT NOT NULL,
      day_rate INTEGER NOT NULL,
      years_experience INTEGER NOT NULL,
      availability TEXT NOT NULL CHECK (availability IN ('available', 'within_30', 'unavailable')),
      available_from DATE,
      certifications TEXT[] NOT NULL DEFAULT '{}',
      sectors TEXT[] NOT NULL DEFAULT '{}',
      skills TEXT[] NOT NULL DEFAULT '{}',
      rating NUMERIC(2,1),
      review_count INTEGER DEFAULT 0,
      placement_count INTEGER DEFAULT 0,
      security_clearance TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS allowed_users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contractors_location ON contractors (location);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contractors_availability ON contractors (availability);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contractors_certifications ON contractors USING GIN (certifications);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contractors_sectors ON contractors USING GIN (sectors);`);

  console.log("Database tables initialized.");
}
