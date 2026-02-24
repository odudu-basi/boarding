-- Add test and production API keys to organizations
-- Rename existing api_key to test_api_key and generate production_api_key

-- Add new columns
ALTER TABLE organizations
  ADD COLUMN test_api_key TEXT,
  ADD COLUMN production_api_key TEXT;

-- Migrate existing api_key to test_api_key with nb_test_ prefix
UPDATE organizations
SET test_api_key = 'nb_test_' || encode(gen_random_bytes(32), 'hex')
WHERE test_api_key IS NULL;

-- Generate production_api_key with nb_live_ prefix
UPDATE organizations
SET production_api_key = 'nb_live_' || encode(gen_random_bytes(32), 'hex')
WHERE production_api_key IS NULL;

-- Make both keys required and unique
ALTER TABLE organizations
  ALTER COLUMN test_api_key SET NOT NULL,
  ALTER COLUMN production_api_key SET NOT NULL,
  ADD CONSTRAINT test_api_key_unique UNIQUE (test_api_key),
  ADD CONSTRAINT production_api_key_unique UNIQUE (production_api_key);

-- Drop old api_key column
ALTER TABLE organizations
  DROP COLUMN IF EXISTS api_key;

-- Add environment field to onboarding_configs
ALTER TABLE onboarding_configs
  ADD COLUMN environment TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'production'));

-- Create index for faster lookups
CREATE INDEX idx_onboarding_configs_environment ON onboarding_configs(organization_id, environment, is_published);

-- Update generate_api_key function to support prefixes
CREATE OR REPLACE FUNCTION generate_api_key(prefix TEXT DEFAULT 'nb_test_')
RETURNS TEXT AS $$
DECLARE
    key TEXT;
BEGIN
    key := prefix || encode(gen_random_bytes(32), 'hex');
    RETURN key;
END;
$$ LANGUAGE plpgsql;
