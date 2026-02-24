-- Fix RLS policies: use a SECURITY DEFINER function to avoid infinite recursion
-- when the users table policies reference the users table itself.

-- ============================================
-- Step 1: Create helper function (bypasses RLS)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ============================================
-- Step 2: Drop ALL old broken policies
-- ============================================

-- organizations
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON organizations;

-- users (both from initial migration and second migration)
DROP POLICY IF EXISTS "Users can view members in their organization" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Users can read own user records" ON users;

-- onboarding_configs
DROP POLICY IF EXISTS "Users can view configs in their organization" ON onboarding_configs;
DROP POLICY IF EXISTS "Users can manage configs in their organization" ON onboarding_configs;

-- experiments
DROP POLICY IF EXISTS "Users can view experiments in their organization" ON experiments;
DROP POLICY IF EXISTS "Users can manage experiments in their organization" ON experiments;

-- variant_assignments
DROP POLICY IF EXISTS "Users can view variant assignments for their experiments" ON variant_assignments;

-- analytics_events
DROP POLICY IF EXISTS "Users can view analytics for their organization" ON analytics_events;

-- ============================================
-- Step 3: Recreate policies using the helper function
-- ============================================

-- organizations
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

CREATE POLICY "Users can update their own organization"
    ON organizations FOR UPDATE
    USING (id = get_user_organization_id());

-- users (no self-reference needed — function bypasses RLS)
CREATE POLICY "Users can view members in their organization"
    ON users FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage their own record"
    ON users FOR ALL
    USING (auth_user_id = auth.uid());

-- onboarding_configs
CREATE POLICY "Users can view configs in their organization"
    ON onboarding_configs FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage configs in their organization"
    ON onboarding_configs FOR ALL
    USING (organization_id = get_user_organization_id());

-- experiments
CREATE POLICY "Users can view experiments in their organization"
    ON experiments FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage experiments in their organization"
    ON experiments FOR ALL
    USING (organization_id = get_user_organization_id());

-- variant_assignments
CREATE POLICY "Users can view variant assignments for their experiments"
    ON variant_assignments FOR SELECT
    USING (experiment_id IN (
        SELECT id FROM experiments WHERE organization_id = get_user_organization_id()
    ));

-- analytics_events
CREATE POLICY "Users can view analytics for their organization"
    ON analytics_events FOR SELECT
    USING (organization_id = get_user_organization_id());
