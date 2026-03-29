-- Redirect plans: stores crawl data + redirect mappings for site migrations
CREATE TABLE IF NOT EXISTS redirect_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_url TEXT NOT NULL,
  new_url TEXT NOT NULL,
  comments TEXT,
  original_pages JSONB DEFAULT '[]'::jsonb,
  new_pages JSONB DEFAULT '[]'::jsonb,
  original_urls TEXT[] DEFAULT '{}',
  new_urls TEXT[] DEFAULT '{}',
  redirects JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE redirect_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redirect plans"
  ON redirect_plans FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own redirect plans"
  ON redirect_plans FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own redirect plans"
  ON redirect_plans FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own redirect plans"
  ON redirect_plans FOR DELETE
  USING (auth.uid() = created_by);
