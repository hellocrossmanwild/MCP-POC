-- 002: Create jobs table
-- Open roles/positions that need filling with contractors

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

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_sector ON jobs (sector);
