-- 005: Create outreach_drafts table
-- Saved email drafts for contractor outreach

CREATE TABLE IF NOT EXISTS outreach_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  shortlist_id UUID REFERENCES shortlists(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
