-- 003: Create shortlists and shortlist_items tables
-- Named candidate lists for tracking contractors against roles

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

CREATE INDEX IF NOT EXISTS idx_shortlist_items_shortlist ON shortlist_items (shortlist_id);
