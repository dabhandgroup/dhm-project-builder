-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE project_status AS ENUM ('draft', 'initial_draft', 'revisions', 'complete');
CREATE TYPE image_type AS ENUM ('square', 'landscape');
CREATE TYPE audit_status AS ENUM ('pending', 'running_before', 'running_after', 'complete', 'failed');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  domain_name TEXT,
  is_rebuild BOOLEAN NOT NULL DEFAULT FALSE,
  status project_status NOT NULL DEFAULT 'draft',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  favicon_url TEXT,
  logo_url TEXT,
  alt_logo_url TEXT,
  pages_required TEXT,
  brief TEXT,
  brief_summary TEXT,
  contact_info JSONB,
  google_maps_embed TEXT,
  additional_notes TEXT,
  sitemap_url TEXT,
  target_locations TEXT[],
  ai_model TEXT,
  one_off_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  recurring_revenue NUMERIC(10,2) NOT NULL DEFAULT 199,
  preview_url TEXT,
  deploy_subdomain TEXT,
  vercel_project_id TEXT,
  kanban_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project images
CREATE TABLE project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type image_type NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voice memos
CREATE TABLE voice_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  source_field TEXT,
  audio_url TEXT,
  transcription TEXT NOT NULL,
  summary TEXT,
  duration_seconds INTEGER,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audits
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_url TEXT NOT NULL,
  new_url TEXT NOT NULL,
  gtmetrix_before JSONB,
  gtmetrix_after JSONB,
  pagespeed_before JSONB,
  pagespeed_after JSONB,
  status audit_status NOT NULL DEFAULT 'pending',
  report_pdf_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Content plans
CREATE TABLE content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  google_sheet_url TEXT,
  google_doc_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_content_plans_updated_at
  BEFORE UPDATE ON content_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies: All authenticated users can read, only creators can modify (admins can do everything)
-- Profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE TO authenticated USING (is_admin());

-- Clients
CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create clients" ON clients FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update clients" ON clients FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Admins can delete clients" ON clients FOR DELETE TO authenticated USING (is_admin());

-- Projects
CREATE POLICY "Authenticated users can view projects" ON projects FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create projects" ON projects FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update projects" ON projects FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE TO authenticated USING (is_admin());

-- Project images
CREATE POLICY "Authenticated users can view project images" ON project_images FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create project images" ON project_images FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can delete project images" ON project_images FOR DELETE TO authenticated USING (TRUE);

-- Voice memos
CREATE POLICY "Users can view own memos" ON voice_memos FOR SELECT TO authenticated USING (created_by = auth.uid() OR is_admin());
CREATE POLICY "Users can create memos" ON voice_memos FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Users can delete own memos" ON voice_memos FOR DELETE TO authenticated USING (created_by = auth.uid() OR is_admin());

-- Audits
CREATE POLICY "Authenticated users can view audits" ON audits FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create audits" ON audits FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update audits" ON audits FOR UPDATE TO authenticated USING (TRUE);

-- Content plans
CREATE POLICY "Authenticated users can view content plans" ON content_plans FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can create content plans" ON content_plans FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update content plans" ON content_plans FOR UPDATE TO authenticated USING (TRUE);

-- Storage buckets (run in Supabase dashboard or via SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('project-assets', 'project-assets', TRUE);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE);
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', FALSE);
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', FALSE);

-- Storage policies
CREATE POLICY "Authenticated users can upload project assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-assets');
CREATE POLICY "Anyone can view project assets" ON storage.objects FOR SELECT USING (bucket_id = 'project-assets');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio');
CREATE POLICY "Users can access own audio" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'audio');
CREATE POLICY "Authenticated users can upload reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports');
CREATE POLICY "Authenticated users can view reports" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'reports');

-- Indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_project_images_project_id ON project_images(project_id);
CREATE INDEX idx_voice_memos_created_by ON voice_memos(created_by);
CREATE INDEX idx_voice_memos_project_id ON voice_memos(project_id);
CREATE INDEX idx_content_plans_project_id ON content_plans(project_id);
