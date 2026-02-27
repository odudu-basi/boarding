-- Credit system for AI prompt usage tracking
-- Each credit allows:
-- - 50,000 input tokens OR 5,000 output tokens
-- (Updated from original 10,000/1,000 — see 20260227100000_update_credit_ratio.sql)

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_remaining DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_credits_purchased DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Credit purchases table (track when users buy credits)
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_amount DECIMAL(10, 2) NOT NULL,
    price_paid DECIMAL(10, 2) NOT NULL,
    payment_provider TEXT, -- 'stripe', 'manual', etc.
    payment_id TEXT, -- Stripe payment intent ID or similar
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit usage log (track each AI prompt usage)
CREATE TABLE IF NOT EXISTS credit_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES onboarding_configs(id) ON DELETE SET NULL,
    screen_id TEXT,
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('generation', 'edit')),

    -- Token usage
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,

    -- Cost calculation
    input_cost DECIMAL(10, 6) NOT NULL, -- Cost in dollars for input tokens
    output_cost DECIMAL(10, 6) NOT NULL, -- Cost in dollars for output tokens
    total_cost DECIMAL(10, 6) NOT NULL, -- Total cost in dollars

    -- Credits deducted
    credits_deducted DECIMAL(10, 2) NOT NULL,
    credits_remaining_after DECIMAL(10, 2) NOT NULL,

    -- Metadata
    model_name TEXT DEFAULT 'claude-sonnet-4.5',
    conversation_turn INTEGER DEFAULT 1, -- Track multi-turn conversations

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX idx_credit_usage_log_user_id ON credit_usage_log(user_id);
CREATE INDEX idx_credit_usage_log_flow_id ON credit_usage_log(flow_id);
CREATE INDEX idx_credit_usage_log_created_at ON credit_usage_log(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_purchases_updated_at
    BEFORE UPDATE ON credit_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
    ON user_credits FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own credits"
    ON user_credits FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own credits record"
    ON user_credits FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for credit_purchases
CREATE POLICY "Users can view their own purchases"
    ON credit_purchases FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own purchases"
    ON credit_purchases FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for credit_usage_log
CREATE POLICY "Users can view their own usage log"
    ON credit_usage_log FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage log"
    ON credit_usage_log FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Function to calculate credits needed based on token usage
-- 1 credit = 10,000 input tokens + 1,000 output tokens
-- Formula: credits = (input_tokens / 10000) + (output_tokens / 1000)
CREATE OR REPLACE FUNCTION calculate_credits_needed(
    input_tokens INTEGER,
    output_tokens INTEGER
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    credits_needed DECIMAL(10, 2);
BEGIN
    -- Calculate credits based on token usage
    -- Each credit allows 10,000 input + 1,000 output
    credits_needed := (input_tokens::DECIMAL / 10000.0) + (output_tokens::DECIMAL / 1000.0);

    -- Round up to 2 decimal places
    credits_needed := CEIL(credits_needed * 100) / 100;

    RETURN credits_needed;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct credits from user
CREATE OR REPLACE FUNCTION deduct_user_credits(
    p_user_id UUID,
    p_flow_id UUID,
    p_screen_id TEXT,
    p_prompt_type TEXT,
    p_input_tokens INTEGER,
    p_output_tokens INTEGER,
    p_model_name TEXT DEFAULT 'claude-sonnet-4.5',
    p_conversation_turn INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    v_credits_needed DECIMAL(10, 2);
    v_current_credits DECIMAL(10, 2);
    v_input_cost DECIMAL(10, 6);
    v_output_cost DECIMAL(10, 6);
    v_total_cost DECIMAL(10, 6);
    v_new_credits DECIMAL(10, 2);
BEGIN
    -- Calculate costs (Claude Sonnet 4.5 pricing: $3/1M input, $15/1M output)
    v_input_cost := (p_input_tokens::DECIMAL / 1000000.0) * 3.0;
    v_output_cost := (p_output_tokens::DECIMAL / 1000000.0) * 15.0;
    v_total_cost := v_input_cost + v_output_cost;

    -- Calculate credits needed
    v_credits_needed := calculate_credits_needed(p_input_tokens, p_output_tokens);

    -- Get current credits (or create record if doesn't exist)
    SELECT credits_remaining INTO v_current_credits
    FROM user_credits
    WHERE user_id = p_user_id;

    IF v_current_credits IS NULL THEN
        -- Create new record with 0 credits
        INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased)
        VALUES (p_user_id, 0, 0);
        v_current_credits := 0;
    END IF;

    -- Check if user has enough credits
    IF v_current_credits < v_credits_needed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_credits',
            'credits_needed', v_credits_needed,
            'credits_available', v_current_credits,
            'credits_short', v_credits_needed - v_current_credits
        );
    END IF;

    -- Deduct credits
    v_new_credits := v_current_credits - v_credits_needed;

    UPDATE user_credits
    SET credits_remaining = v_new_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log the usage
    INSERT INTO credit_usage_log (
        user_id,
        flow_id,
        screen_id,
        prompt_type,
        input_tokens,
        output_tokens,
        input_cost,
        output_cost,
        total_cost,
        credits_deducted,
        credits_remaining_after,
        model_name,
        conversation_turn
    ) VALUES (
        p_user_id,
        p_flow_id,
        p_screen_id,
        p_prompt_type,
        p_input_tokens,
        p_output_tokens,
        v_input_cost,
        v_output_cost,
        v_total_cost,
        v_credits_needed,
        v_new_credits,
        p_model_name,
        p_conversation_turn
    );

    RETURN jsonb_build_object(
        'success', true,
        'credits_deducted', v_credits_needed,
        'credits_remaining', v_new_credits,
        'cost', v_total_cost,
        'input_tokens', p_input_tokens,
        'output_tokens', p_output_tokens
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to user (for purchases)
CREATE OR REPLACE FUNCTION add_user_credits(
    p_user_id UUID,
    p_credits_amount DECIMAL(10, 2),
    p_price_paid DECIMAL(10, 2),
    p_payment_provider TEXT DEFAULT 'manual',
    p_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_credits DECIMAL(10, 2);
    v_new_credits DECIMAL(10, 2);
    v_purchase_id UUID;
BEGIN
    -- Get or create user credits record
    SELECT credits_remaining INTO v_current_credits
    FROM user_credits
    WHERE user_id = p_user_id;

    IF v_current_credits IS NULL THEN
        INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased)
        VALUES (p_user_id, p_credits_amount, p_credits_amount)
        RETURNING credits_remaining INTO v_new_credits;
    ELSE
        v_new_credits := v_current_credits + p_credits_amount;
        UPDATE user_credits
        SET credits_remaining = v_new_credits,
            total_credits_purchased = total_credits_purchased + p_credits_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    -- Record the purchase
    INSERT INTO credit_purchases (
        user_id,
        credits_amount,
        price_paid,
        payment_provider,
        payment_id,
        status
    ) VALUES (
        p_user_id,
        p_credits_amount,
        p_price_paid,
        p_payment_provider,
        p_payment_id,
        'completed'
    ) RETURNING id INTO v_purchase_id;

    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', v_purchase_id,
        'credits_added', p_credits_amount,
        'credits_total', v_new_credits
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_credits_needed TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits TO authenticated;
