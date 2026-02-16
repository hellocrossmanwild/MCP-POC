-- 004: Create engagements table
-- Booked contractor placements with dates, rates, and status tracking

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

CREATE INDEX IF NOT EXISTS idx_engagements_contractor ON engagements (contractor_id);
