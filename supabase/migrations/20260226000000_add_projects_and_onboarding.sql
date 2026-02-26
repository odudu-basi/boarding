-- ============================================
-- Add Projects table and Organization Onboarding
-- ============================================

-- 1. Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'cross_platform' CHECK (platform IN ('ios', 'android', 'cross_platform')),
    bundle_id TEXT,
    test_api_key TEXT NOT NULL UNIQUE DEFAULT generate_api_key('nb_test_'),
    production_api_key TEXT NOT NULL UNIQUE DEFAULT generate_api_key('nb_live_'),
    revenuecat_api_key TEXT,
    superwall_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_org ON projects(organization_id);

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Add project_id to existing tables
ALTER TABLE onboarding_configs ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE experiments ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE analytics_events ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX idx_onboarding_configs_project ON onboarding_configs(project_id);
CREATE INDEX idx_experiments_project ON experiments(project_id);
CREATE INDEX idx_analytics_events_project ON analytics_events(project_id);

-- 3. Add onboarding and referral fields to organizations
ALTER TABLE organizations ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN company_size TEXT;
ALTER TABLE organizations ADD COLUMN user_role TEXT;
ALTER TABLE organizations ADD COLUMN referral_source TEXT;

-- 4. Data migration: create a default project for each existing organization
INSERT INTO projects (organization_id, name, test_api_key, production_api_key, revenuecat_api_key, superwall_api_key)
SELECT id, name || ' App', test_api_key, production_api_key, revenuecat_api_key, superwall_api_key
FROM organizations;

-- 5. Backfill project_id on existing rows
UPDATE onboarding_configs oc SET project_id = (
    SELECT p.id FROM projects p WHERE p.organization_id = oc.organization_id LIMIT 1
);
UPDATE experiments e SET project_id = (
    SELECT p.id FROM projects p WHERE p.organization_id = e.organization_id LIMIT 1
);
UPDATE analytics_events ae SET project_id = (
    SELECT p.id FROM projects p WHERE p.organization_id = ae.organization_id LIMIT 1
);

-- 6. Mark existing organizations as onboarding complete
UPDATE organizations SET onboarding_completed = true;

-- 7. RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their organization"
    ON projects FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage projects in their organization"
    ON projects FOR ALL
    USING (organization_id = get_user_organization_id());
