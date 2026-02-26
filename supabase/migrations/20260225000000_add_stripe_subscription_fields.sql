-- Add Stripe subscription tracking fields to organizations
-- Plans/billing are per-organization

-- Expand plan options to support all pricing tiers
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'scale', 'enterprise'));

-- Add subscription tracking columns
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'unpaid', 'trialing'));
