-- Add last_published_at timestamp to onboarding_configs
ALTER TABLE onboarding_configs
  ADD COLUMN IF NOT EXISTS last_published_at TIMESTAMPTZ;

-- Create trigger to update last_published_at when is_published becomes true
CREATE OR REPLACE FUNCTION update_last_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    NEW.last_published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_last_published_at
  BEFORE UPDATE ON onboarding_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_last_published_at();
