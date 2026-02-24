-- Test Data for Noboarding SDK Testing
-- Run this in Supabase Studio: https://supabase.com/dashboard/project/hhmmzmrsptegprfztqtq/editor

-- 1. Create a test organization with API key
INSERT INTO organizations (id, name, api_key, plan, screenshot_analyses_limit)
VALUES (
  gen_random_uuid(),
  'Test Organization',
  'sk_test_' || encode(gen_random_bytes(32), 'hex'),
  'free',
  5
)
RETURNING id, name, api_key;

-- After running the above, copy the api_key that's returned!
-- Then use it in the onboarding config below

-- 2. Create a test onboarding configuration
INSERT INTO onboarding_configs (organization_id, name, version, is_published, config)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1),
  'My First Onboarding Flow',
  '1.0.0',
  true,
  '{
    "version": "1.0.0",
    "screens": [
      {
        "id": "welcome",
        "type": "welcome_screen",
        "props": {
          "title": "Welcome to My App!",
          "subtitle": "Get started in just a few steps",
          "image_url": "https://via.placeholder.com/300/4A90E2/FFFFFF?text=Welcome",
          "cta_text": "Get Started",
          "background_color": "#FFFFFF",
          "text_color": "#000000"
        }
      },
      {
        "id": "user_info",
        "type": "text_input",
        "props": {
          "fields": [
            {
              "id": "name",
              "label": "What is your name?",
              "type": "text",
              "required": true,
              "placeholder": "Enter your name"
            },
            {
              "id": "email",
              "label": "Your email address",
              "type": "email",
              "required": true,
              "placeholder": "you@example.com"
            },
            {
              "id": "age",
              "label": "How old are you?",
              "type": "number",
              "required": false,
              "placeholder": "25"
            }
          ]
        }
      },
      {
        "id": "social_login",
        "type": "social_login",
        "props": {
          "providers": ["apple", "google", "facebook"],
          "title": "Sign in to continue",
          "subtitle": "Choose your preferred sign-in method"
        }
      }
    ]
  }'::jsonb
)
RETURNING id, name, version;

-- 3. Verify your data was created
SELECT
  o.name as org_name,
  o.api_key,
  o.plan,
  oc.name as config_name,
  oc.version,
  oc.is_published
FROM organizations o
LEFT JOIN onboarding_configs oc ON oc.organization_id = o.id
WHERE o.name = 'Test Organization';
