-- RevenueCat webhook events table
-- Stores all webhook events received from RevenueCat for tracking purchases and subscriptions
CREATE TABLE revenuecat_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE, -- RevenueCat's unique event ID
    event_type TEXT NOT NULL, -- INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.
    app_user_id TEXT NOT NULL, -- RevenueCat app_user_id (matches SDK user_id)
    product_id TEXT NOT NULL, -- The product/subscription purchased
    transaction_id TEXT NOT NULL, -- Store transaction ID
    original_transaction_id TEXT NOT NULL, -- Original store transaction ID
    purchased_at TIMESTAMPTZ NOT NULL, -- When the purchase occurred
    expiration_at TIMESTAMPTZ, -- When the subscription expires (null for non-subscription)
    price DECIMAL(10,2), -- Price paid
    currency TEXT, -- Currency code (USD, EUR, etc.)
    country_code TEXT, -- User's country
    store TEXT NOT NULL, -- APP_STORE, PLAY_STORE, etc.
    environment TEXT NOT NULL, -- PRODUCTION or SANDBOX
    offering_id TEXT, -- RevenueCat offering ID presented
    entitlement_ids JSONB, -- Array of entitlement IDs granted
    subscriber_attributes JSONB, -- Custom attributes set on the subscriber
    raw_payload JSONB NOT NULL, -- Full webhook payload for debugging
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_revenuecat_events_app_user ON revenuecat_events(app_user_id);
CREATE INDEX idx_revenuecat_events_event_type ON revenuecat_events(event_type);
CREATE INDEX idx_revenuecat_events_purchased_at ON revenuecat_events(purchased_at DESC);
CREATE INDEX idx_revenuecat_events_product_id ON revenuecat_events(product_id);
CREATE INDEX idx_revenuecat_events_transaction_id ON revenuecat_events(transaction_id);

-- Enable RLS (RevenueCat webhook will use service role to bypass)
ALTER TABLE revenuecat_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view events for their organization's users
-- This requires joining with analytics_events to find organization_id from app_user_id
CREATE POLICY "Users can view RevenueCat events for their organization"
    ON revenuecat_events FOR SELECT
    USING (
        app_user_id IN (
            SELECT DISTINCT user_id
            FROM analytics_events
            WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Add comment for documentation
COMMENT ON TABLE revenuecat_events IS 'Stores webhook events from RevenueCat for purchase tracking and analytics';
COMMENT ON COLUMN revenuecat_events.event_id IS 'Unique event ID from RevenueCat';
COMMENT ON COLUMN revenuecat_events.app_user_id IS 'RevenueCat app_user_id, should match user_id in analytics_events';
COMMENT ON COLUMN revenuecat_events.event_type IS 'Type of event: INITIAL_PURCHASE, RENEWAL, CANCELLATION, BILLING_ISSUE, etc.';
COMMENT ON COLUMN revenuecat_events.offering_id IS 'The offering ID that was presented to the user (useful for A/B testing)';
