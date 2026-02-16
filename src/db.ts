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
      email TEXT,
      phone TEXT,
      linkedin_url TEXT,
      profile_photo_url TEXT,
      education JSONB DEFAULT '[]',
      work_history JSONB DEFAULT '[]',
      notable_projects JSONB DEFAULT '[]',
      languages TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`DO $$ BEGIN
    ALTER TABLE contractors ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE contractors ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE contractors ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
    ALTER TABLE contractors ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
    ALTER TABLE contractors ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';
    ALTER TABLE contractors ADD COLUMN IF NOT EXISTS work_history JSONB DEFAULT '[]';
    ALTER TABLE contractors ADD COLUMN IF NOT EXISTS notable_projects JSONB DEFAULT '[]';
    ALTER TABLE contractors ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
  END $$;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS allowed_users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shortlists (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      role_title TEXT,
      client_name TEXT,
      created_by TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'filled')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shortlist_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      shortlist_id UUID NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
      contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'shortlisted' CHECK (status IN ('shortlisted', 'contacted', 'interviewing', 'offered', 'accepted', 'declined', 'withdrawn')),
      added_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(shortlist_id, contractor_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS engagements (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
      shortlist_id UUID REFERENCES shortlists(id),
      role_title TEXT NOT NULL,
      client_name TEXT,
      start_date DATE,
      end_date DATE,
      agreed_rate INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS outreach_drafts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
      shortlist_id UUID REFERENCES shortlists(id),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'replied')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      client_name TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      remote_option TEXT DEFAULT 'hybrid' CHECK (remote_option IN ('onsite', 'hybrid', 'remote')),
      day_rate_min INTEGER,
      day_rate_max INTEGER,
      duration_weeks INTEGER,
      start_date DATE,
      required_certifications TEXT[] DEFAULT '{}',
      required_skills TEXT[] DEFAULT '{}',
      required_clearance TEXT,
      sector TEXT,
      experience_min INTEGER,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'shortlisting', 'interviewing', 'offered', 'filled', 'cancelled')),
      urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'urgent', 'critical')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contractors_location ON contractors (location);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contractors_availability ON contractors (availability);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contractors_certifications ON contractors USING GIN (certifications);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contractors_sectors ON contractors USING GIN (sectors);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_shortlist_items_shortlist ON shortlist_items (shortlist_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_engagements_contractor ON engagements (contractor_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_jobs_sector ON jobs (sector);`);

  console.log("Database tables initialized.");
}
