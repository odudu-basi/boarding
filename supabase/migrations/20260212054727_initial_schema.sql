-- Organizations (developer accounts)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    screenshot_analyses_this_month INTEGER DEFAULT 0,
    screenshot_analyses_limit INTEGER NOT NULL DEFAULT 5,
    revenuecat_api_key TEXT, -- encrypted, optional
    superwall_api_key TEXT, -- encrypted, optional
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding configurations
CREATE TABLE onboarding_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B Test experiments
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    traffic_allocation INTEGER DEFAULT 100 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
    variants JSONB NOT NULL,
    primary_metric TEXT NOT NULL,
    secondary_metrics JSONB,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variant assignments (which user saw which variant)
CREATE TABLE variant_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- end user's device ID
    variant_id TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(experiment_id, user_id)
);

-- Analytics events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    user_id TEXT NOT NULL, -- end user's device ID
    session_id TEXT NOT NULL,
    experiment_id UUID REFERENCES experiments(id) ON DELETE SET NULL,
    variant_id TEXT,
    screen_id TEXT,
    properties JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_org_timestamp ON analytics_events(organization_id, timestamp DESC);
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_experiment ON analytics_events(experiment_id);
CREATE INDEX idx_variant_assignments_exp ON variant_assignments(experiment_id);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_onboarding_configs_org ON onboarding_configs(organization_id);
CREATE INDEX idx_experiments_org ON experiments(organization_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_configs_updated_at BEFORE UPDATE ON onboarding_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate API keys
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    key TEXT;
BEGIN
    key := 'sk_' || encode(gen_random_bytes(32), 'hex');
    RETURN key;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own organization"
    ON organizations FOR UPDATE
    USING (id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- RLS Policies for users
CREATE POLICY "Users can view members in their organization"
    ON users FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage users in their organization"
    ON users FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- RLS Policies for onboarding_configs
CREATE POLICY "Users can view configs in their organization"
    ON onboarding_configs FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage configs in their organization"
    ON onboarding_configs FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for experiments
CREATE POLICY "Users can view experiments in their organization"
    ON experiments FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage experiments in their organization"
    ON experiments FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for variant_assignments
CREATE POLICY "Users can view variant assignments for their experiments"
    ON variant_assignments FOR SELECT
    USING (experiment_id IN (
        SELECT id FROM experiments WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

-- RLS Policies for analytics_events
CREATE POLICY "Users can view analytics for their organization"
    ON analytics_events FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Edge Functions (API endpoints) will bypass RLS using service role key
