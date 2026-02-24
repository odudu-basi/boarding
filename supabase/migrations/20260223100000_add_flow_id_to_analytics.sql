-- Add flow_id to analytics_events to track which onboarding config was active
ALTER TABLE analytics_events
ADD COLUMN flow_id UUID REFERENCES onboarding_configs(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_analytics_events_flow_id ON analytics_events(flow_id);

-- Create index for user_id + timestamp for user session queries
CREATE INDEX idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);
