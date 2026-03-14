-- 002_schema_sync.sql
-- Sync SQL schema with TypeScript types, add missing columns and new tables

-- =============================================================================
-- 1. Fix project_status enum
-- =============================================================================

-- PostgreSQL 10+ supports RENAME VALUE
ALTER TYPE project_status RENAME VALUE 'draft' TO 'lead';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'awaiting_feedback' AFTER 'initial_draft';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'awaiting_payment' AFTER 'revisions';

-- =============================================================================
-- 2. Create templates table (before adding FK on projects)
-- =============================================================================

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  storage_path TEXT NOT NULL,
  category TEXT,
  framework TEXT NOT NULL DEFAULT 'nextjs',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 3. Add missing columns to projects
-- =============================================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AUD';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deploy_provider TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS netlify_project_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pipeline_status TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pipeline_error TEXT;

-- =============================================================================
-- 4. Create settings table (key/value for integration credentials)
-- =============================================================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 5. Create costs table
-- =============================================================================

CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  type TEXT NOT NULL DEFAULT 'one_off',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. Create financial_targets table
-- =============================================================================

CREATE TABLE financial_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL,
  monthly_mrr_target NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_one_off_target NUMERIC(10,2) NOT NULL DEFAULT 0,
  label TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_financial_targets_updated_at
  BEFORE UPDATE ON financial_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 7. Create templates storage bucket
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', FALSE)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. RLS for new tables
-- =============================================================================

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_targets ENABLE ROW LEVEL SECURITY;

-- Templates: all authenticated can read, admins can manage
CREATE POLICY "Authenticated users can view templates" ON templates
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can insert templates" ON templates
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update templates" ON templates
  FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins can delete templates" ON templates
  FOR DELETE TO authenticated USING (is_admin());

-- Settings: only admins
CREATE POLICY "Admins can view settings" ON settings
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert settings" ON settings
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins can delete settings" ON settings
  FOR DELETE TO authenticated USING (is_admin());

-- Costs: all authenticated can read and create, admins can delete
CREATE POLICY "Authenticated users can view costs" ON costs
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create costs" ON costs
  FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update costs" ON costs
  FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Admins can delete costs" ON costs
  FOR DELETE TO authenticated USING (is_admin());

-- Financial targets: all authenticated can read, admins can manage
CREATE POLICY "Authenticated users can view targets" ON financial_targets
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can insert targets" ON financial_targets
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update targets" ON financial_targets
  FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins can delete targets" ON financial_targets
  FOR DELETE TO authenticated USING (is_admin());

-- Storage policies for templates bucket
CREATE POLICY "Authenticated users can view templates files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'templates');
CREATE POLICY "Admins can upload template files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'templates');
CREATE POLICY "Admins can delete template files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'templates');

-- =============================================================================
-- 9. Indexes for new tables
-- =============================================================================

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_costs_project_id ON costs(project_id);
CREATE INDEX idx_costs_date ON costs(date);
CREATE INDEX idx_costs_currency ON costs(currency);
CREATE INDEX idx_financial_targets_currency ON financial_targets(currency);
CREATE INDEX idx_projects_template_id ON projects(template_id);
CREATE INDEX idx_projects_pipeline_status ON projects(pipeline_status);
CREATE INDEX idx_settings_key ON settings(key);
