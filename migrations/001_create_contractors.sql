-- 001: Create contractors table
-- Core entity for security contractor profiles

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

CREATE INDEX IF NOT EXISTS idx_contractors_location ON contractors (location);
CREATE INDEX IF NOT EXISTS idx_contractors_availability ON contractors (availability);
CREATE INDEX IF NOT EXISTS idx_contractors_certifications ON contractors USING GIN (certifications);
CREATE INDEX IF NOT EXISTS idx_contractors_sectors ON contractors USING GIN (sectors);
