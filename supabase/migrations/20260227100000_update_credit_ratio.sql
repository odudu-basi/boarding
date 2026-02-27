-- Update credit ratio to be more generous
-- Old: 1 credit = 10,000 input tokens OR 1,000 output tokens (~4 credits per generation)
-- New: 1 credit = 50,000 input tokens OR 5,000 output tokens (~1 credit per generation)
-- This aligns with the pricing page promise of "1 credit ≈ 1 AI generation"

CREATE OR REPLACE FUNCTION calculate_credits_needed(
    input_tokens INTEGER,
    output_tokens INTEGER
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    credits_needed DECIMAL(10, 2);
BEGIN
    -- Calculate credits based on token usage
    -- Each credit allows 50,000 input + 5,000 output tokens
    credits_needed := (input_tokens::DECIMAL / 50000.0) + (output_tokens::DECIMAL / 5000.0);

    -- Round up to 2 decimal places
    credits_needed := CEIL(credits_needed * 100) / 100;

    RETURN credits_needed;
END;
$$ LANGUAGE plpgsql;
