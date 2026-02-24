# Logic System - Building Intelligent, Personalized Onboarding

## Overview

The Logic System transforms your onboarding platform from static screens into an intelligent, adaptive experience. Build conditional flows, personalized content, and AI-powered recommendations that respond to each user's unique answers.

**What you can build:**
- Show different content based on user selections
- Skip screens intelligently based on user profile
- Generate personalized AI recommendations
- Create dynamic text that adapts to each user
- Build complex decision trees without code

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Variables System](#variables-system)
3. [Conditional Display](#conditional-display)
4. [Conditional Navigation](#conditional-navigation)
5. [Dynamic Text & Templates](#dynamic-text--templates)
6. [Computed Variables](#computed-variables)
7. [AI-Generated Content](#ai-generated-content)
8. [Actions System](#actions-system)
9. [Logic Operators](#logic-operators)
10. [Dashboard: Visual Logic Builder](#dashboard-visual-logic-builder)
11. [Examples & Use Cases](#examples--use-cases)
12. [Best Practices](#best-practices)

---

## Core Concepts

### How It Works

**Traditional onboarding (static):**
```
Screen 1 → Screen 2 → Screen 3 → Screen 4
(same flow for everyone)
```

**Logic-powered onboarding (dynamic):**
```
Screen 1: User picks "workout 3x/week"
  ↓
Screen 2: User picks "poor sleep"
  ↓
Screen 3: User picks "male"
  ↓
Screen 4: Shows personalized content based on ALL previous answers
  "As a male working out 3x/week with poor sleep, 
   you need 8-9 hours of sleep for muscle recovery"
```

**Every user sees a different Screen 4 based on their unique combination of answers.**

---

### The Four Building Blocks

#### 1. Variables
Store user data as they progress through onboarding.
```json
{
  "workout_frequency": "3-4",
  "sleep_quality": "poor",
  "gender": "male",
  "age": 28
}
```

#### 2. Conditions
Show/hide content based on variable values.
```json
{
  "show_if": {
    "variable": "workout_frequency",
    "equals": "3-4"
  }
}
```

#### 3. Actions
Do something when user interacts (set variables, navigate, track events).
```json
{
  "onTap": {
    "action": "set_variable",
    "variable": "workout_frequency",
    "value": "3-4"
  }
}
```

#### 4. Templates
Inject variables into text dynamically.
```json
{
  "content": "Welcome, {user.name}! You selected {workout_frequency} workouts."
}
```

---

## Variables System

### What Are Variables?

Variables store data collected during onboarding. Think of them as containers that hold user information.

**Types of variables:**
- **User Input**: Data collected from user selections/inputs
- **Computed**: Calculated from other variables
- **System**: Built-in variables (user.name, device.platform, etc.)

---

### Creating Variables

Variables are created automatically when you add input elements or explicitly define them.

#### Automatic Creation (Recommended)

**When user taps an option:**
```json
{
  "type": "hstack",
  "onTap": {
    "action": "set_variable",
    "variable": "workout_frequency",
    "value": "3-4"
  },
  "elements": [
    {"type": "text", "content": "3-4 times per week"}
  ]
}
```

**This creates a variable called `workout_frequency` with value `"3-4"`.**

---

#### Explicit Definition

**Define variables upfront in screen config:**
```json
{
  "variables": {
    "workout_frequency": {
      "type": "string",
      "default": null,
      "possible_values": ["1-2", "3-4", "5+"]
    },
    "age": {
      "type": "number",
      "default": 0,
      "min": 13,
      "max": 120
    },
    "fitness_goals": {
      "type": "array",
      "default": [],
      "possible_values": ["lose_weight", "build_muscle", "endurance", "flexibility"]
    },
    "has_wearable": {
      "type": "boolean",
      "default": false
    }
  }
}
```

---

### Variable Types

| Type | Description | Example Values |
|------|-------------|----------------|
| **string** | Text value | "3-4", "male", "beginner" |
| **number** | Numeric value | 28, 180, 75.5 |
| **boolean** | True/false | true, false |
| **array** | List of values | ["muscle", "cardio"], [1, 2, 3] |
| **object** | Nested data | {"name": "John", "age": 28} |

---

### System Variables

**Built-in variables available everywhere:**

| Variable | Description | Example |
|----------|-------------|---------|
| `user.name` | User's name (if collected) | "John Smith" |
| `user.email` | User's email | "john@example.com" |
| `user.id` | Unique user ID | "user_abc123" |
| `device.platform` | iOS or Android | "iOS" |
| `device.version` | OS version | "17.2" |
| `app.version` | Your app version | "1.2.0" |
| `app.name` | Your app name | "BodyMax" |
| `current_screen` | Current screen ID | "screen_3" |
| `total_screens` | Total screens in flow | 5 |
| `screen_index` | Current position (0-based) | 2 |

---

### Variable Scope

**Variables persist throughout the entire onboarding flow:**
```
Screen 1: Set workout_frequency = "3-4"
  ↓
Screen 2: workout_frequency still = "3-4"
  ↓
Screen 3: workout_frequency still = "3-4"
  ↓
Screen 4: Use workout_frequency in logic
```

**Variables are passed to `onComplete` callback:**
```typescript
<OnboardingFlow
  onComplete={(data) => {
    // data contains ALL collected variables:
    // {
    //   workout_frequency: "3-4",
    //   sleep_quality: "poor",
    //   gender: "male",
    //   age: 28
    // }
  }}
/>
```

---

## Conditional Display

### Show/Hide Elements Based on Conditions

Make elements appear only when certain conditions are met.

### Basic Example

**Show text only for users who selected "5+" workouts:**
```json
{
  "type": "text",
  "content": "You're a dedicated athlete! Here's an advanced plan.",
  "conditions": {
    "show_if": {
      "variable": "workout_frequency",
      "equals": "5+"
    }
  }
}
```

**Result:**
- User selected "5+" → Text shows
- User selected "3-4" or "1-2" → Text hidden

---

### Multiple Conditions (AND Logic)

**Show only if ALL conditions are true:**
```json
{
  "type": "text",
  "content": "As a male working out 5+ times per week, consider these supplements...",
  "conditions": {
    "show_if": {
      "all": [
        {"variable": "workout_frequency", "equals": "5+"},
        {"variable": "gender", "equals": "male"}
      ]
    }
  }
}
```

**Result:** Only shows if BOTH conditions are true.

---

### Any Condition (OR Logic)

**Show if ANY condition is true:**
```json
{
  "type": "text",
  "content": "You might benefit from recovery supplements.",
  "conditions": {
    "show_if": {
      "any": [
        {"variable": "workout_frequency", "equals": "5+"},
        {"variable": "sleep_quality", "equals": "poor"},
        {"variable": "age", "greater_than": 40}
      ]
    }
  }
}
```

**Result:** Shows if user works out 5+ times OR has poor sleep OR is over 40.

---

### Negation (NOT Logic)

**Show if condition is NOT true:**
```json
{
  "type": "text",
  "content": "Consider getting a fitness tracker to optimize your training.",
  "conditions": {
    "show_if": {
      "not": {
        "variable": "has_wearable",
        "equals": true
      }
    }
  }
}
```

**Result:** Only shows if user does NOT have a wearable.

---

### Complex Nested Logic

**Combine all logic types:**
```json
{
  "type": "text",
  "content": "High-intensity recovery plan recommended",
  "conditions": {
    "show_if": {
      "all": [
        {
          "any": [
            {"variable": "workout_frequency", "equals": "5+"},
            {"variable": "fitness_level", "equals": "advanced"}
          ]
        },
        {"variable": "sleep_quality", "equals": "poor"},
        {
          "not": {
            "variable": "has_injury",
            "equals": true
          }
        }
      ]
    }
  }
}
```

**Translation:**
```
Show if:
  (workout_frequency is "5+" OR fitness_level is "advanced")
  AND sleep_quality is "poor"
  AND user does NOT have an injury
```

---

### Hiding Entire Sections

**Conditional VStack (hide entire groups):**
```json
{
  "type": "vstack",
  "conditions": {
    "show_if": {
      "variable": "has_wearable",
      "equals": true
    }
  },
  "elements": [
    {"type": "text", "content": "Wearable Settings"},
    {"type": "text", "content": "Sync your device..."},
    {"type": "button", "text": "Connect Wearable"}
  ]
}
```

**Result:** Entire section hidden if user doesn't have wearable.

---

## Conditional Navigation

### Skip Screens Based on Logic

Send users to different screens based on their answers.

### Basic Conditional Navigation

**Skip to different screens based on one variable:**
```json
{
  "type": "button",
  "text": "Continue",
  "onTap": {
    "action": "navigate",
    "next_screen": {
      "if": {
        "variable": "has_wearable",
        "equals": true
      },
      "then": "wearable_sync_screen",
      "else": "goal_selection_screen"
    }
  }
}
```

**Flow:**
```
User has wearable: → wearable_sync_screen
User no wearable:  → goal_selection_screen
```

---

### Multi-Condition Navigation

**Route based on multiple conditions:**
```json
{
  "type": "button",
  "text": "Continue",
  "onTap": {
    "action": "navigate",
    "next_screen": {
      "if": {
        "all": [
          {"variable": "age", "less_than": 18},
          {"variable": "has_parent_consent", "equals": false}
        ]
      },
      "then": "parent_consent_screen",
      "else": "main_onboarding"
    }
  }
}
```

---

### Complex Routing (Multiple Paths)

**Route to different screens based on multiple conditions:**
```json
{
  "type": "button",
  "text": "Continue",
  "onTap": {
    "action": "navigate_conditional",
    "routes": [
      {
        "if": {
          "all": [
            {"variable": "fitness_level", "equals": "beginner"},
            {"variable": "has_injury", "equals": true}
          ]
        },
        "then": "beginner_injury_plan"
      },
      {
        "if": {
          "variable": "fitness_level",
          "equals": "beginner"
        },
        "then": "beginner_plan"
      },
      {
        "if": {
          "variable": "fitness_level",
          "equals": "advanced"
        },
        "then": "advanced_plan"
      }
    ],
    "default": "intermediate_plan"
  }
}
```

**Logic:**
```
1. Check: beginner + injury → beginner_injury_plan
2. Else check: beginner → beginner_plan
3. Else check: advanced → advanced_plan
4. Else (default): intermediate_plan
```

---

### Skip Multiple Screens

**Jump ahead based on user profile:**
```json
{
  "type": "button",
  "text": "Continue",
  "onTap": {
    "action": "navigate",
    "next_screen": {
      "if": {
        "variable": "is_returning_user",
        "equals": true
      },
      "then": "welcome_back_screen",
      "else": "tutorial_screen_1"
    }
  }
}
```

**Result:**
- New users: See all 5 tutorial screens
- Returning users: Skip tutorials, go straight to welcome back

---

## Dynamic Text & Templates

### Inject Variables into Text

Make text personalize based on user data.

### Basic Template Variables

**Syntax:** `{variable_name}`
```json
{
  "type": "text",
  "content": "Welcome, {user.name}!"
}
```

**Result:**
- If user.name = "John" → "Welcome, John!"
- If user.name = "Sarah" → "Welcome, Sarah!"

---

### Multiple Variables in One String
```json
{
  "type": "text",
  "content": "Based on working out {workout_frequency} times per week and {sleep_quality} sleep, we recommend..."
}
```

**Result:**
```
"Based on working out 3-4 times per week and poor sleep, we recommend..."
```

---

### System Variables
```json
{
  "type": "text",
  "content": "You're on screen {screen_index} of {total_screens}"
}
```

**Result:**
```
"You're on screen 2 of 5"
```

---

### Conditional Text (Ternary)

**Show different text based on condition:**
```json
{
  "type": "text",
  "content": "{workout_frequency == '5+' ? 'You're an athlete!' : 'You're building a habit!'}"
}
```

**Result:**
- If workout_frequency is "5+" → "You're an athlete!"
- Otherwise → "You're building a habit!"

---

### Computed Text

**Calculate values in templates:**
```json
{
  "type": "text",
  "content": "Your BMI is {weight_kg / (height_m * height_m)}"
}
```

---

## Computed Variables

### Variables That Calculate Automatically

Computed variables derive their value from other variables.

### Simple Formula

**Define in screen config:**
```json
{
  "computed_variables": {
    "bmi": {
      "type": "formula",
      "formula": "weight_kg / (height_m * height_m)"
    }
  }
}
```

**Use anywhere:**
```json
{
  "type": "text",
  "content": "Your BMI: {bmi}"
}
```

**Auto-updates when weight_kg or height_m changes.**

---

### Conditional Formula (IF/THEN)
```json
{
  "computed_variables": {
    "sleep_recommendation": {
      "type": "formula",
      "formula": "workout_frequency == '5+' ? 9 : (workout_frequency == '3-4' ? 8 : 7)"
    }
  }
}
```

**Logic:**
```
If workout 5+ times: recommend 9 hours
Else if workout 3-4 times: recommend 8 hours
Else: recommend 7 hours
```

---

### Lookup Tables

**Map combinations to values:**
```json
{
  "computed_variables": {
    "fitness_level": {
      "type": "lookup",
      "inputs": ["workout_frequency", "sleep_quality"],
      "lookup_table": {
        "5+_good": "Advanced",
        "5+_poor": "Intermediate",
        "3-4_good": "Intermediate",
        "3-4_poor": "Beginner",
        "1-2_good": "Beginner",
        "1-2_poor": "Beginner"
      },
      "default": "Beginner"
    }
  }
}
```

**How it works:**
```
User: workout_frequency = "5+", sleep_quality = "good"
Lookup key: "5+_good"
Result: fitness_level = "Advanced"
```

---

### Array Operations

**Count, filter, map arrays:**
```json
{
  "computed_variables": {
    "goals_count": {
      "type": "formula",
      "formula": "fitness_goals.length"
    },
    "is_focused": {
      "type": "formula",
      "formula": "fitness_goals.length <= 2"
    }
  }
}
```

---

### String Operations
```json
{
  "computed_variables": {
    "first_name": {
      "type": "formula",
      "formula": "user.name.split(' ')[0]"
    },
    "name_uppercase": {
      "type": "formula",
      "formula": "user.name.toUpperCase()"
    }
  }
}
```

---

## AI-Generated Content

### Personalized Content Powered by AI

Generate unique, personalized text for each user based on their answers.

### Basic AI Text Element
```json
{
  "type": "ai_generated_text",
  "prompt": "Generate a personalized fitness recommendation for someone who works out {workout_frequency} times per week, has {sleep_quality} sleep quality, and wants to {fitness_goal}. Keep it under 100 words and actionable.",
  "model": "gpt-4-turbo",
  "cache": true,
  "loading_text": "Creating your personalized plan...",
  "fallback_text": "Based on your goals, we recommend starting with a balanced routine."
}
```

---

### How It Works

**When user reaches this screen:**

1. **SDK detects** `ai_generated_text` element
2. **Replaces variables** in prompt with actual values
3. **Checks cache**: Has this exact prompt been generated before?
4. **If cached**: Return instantly (no API call)
5. **If not cached**:
   - Send to your backend
   - Backend calls OpenAI/Claude API
   - Cache result for 7 days
   - Return to user
6. **Shows result** to user

---

### Example Workflow

**User answers:**
```
workout_frequency: "3-4"
sleep_quality: "poor"
fitness_goal: "build muscle"
```

**Prompt sent to AI:**
```
"Generate a personalized fitness recommendation for someone who 
works out 3-4 times per week, has poor sleep quality, and wants 
to build muscle. Keep it under 100 words and actionable."
```

**AI generates:**
```
"As someone training 3-4 times per week with poor sleep, your 
muscle recovery is compromised. Prioritize 8-9 hours of sleep 
nightly—this is when muscle repair happens. Consider a magnesium 
supplement 30 minutes before bed. Reduce your training intensity 
by 20% until sleep improves to avoid overtraining. Track your 
recovery: if you're consistently sore for 48+ hours, you need 
more rest. Once sleep stabilizes, gradually increase volume."
```

**User sees personalized recommendation instantly.**

---

### AI Element Configuration
```json
{
  "type": "ai_generated_text",
  "prompt": "Your prompt template with {variables}",
  "model": "gpt-4-turbo",           // or "claude-3-sonnet", "gpt-3.5-turbo"
  "max_length": 100,                // words
  "cache": true,                    // Cache results to save API costs
  "cache_duration": 7,              // days
  "temperature": 0.7,               // Creativity (0-1)
  "loading_text": "Generating...",
  "fallback_text": "Generic recommendation if API fails",
  "style": "friendly",              // Optional: friendly, professional, casual
  "tone": "motivational"            // Optional: motivational, informative, empathetic
}
```

---

### Multi-Variable AI Generation

**Use multiple variables in prompt:**
```json
{
  "type": "ai_generated_text",
  "prompt": "Create a {workout_type} workout plan for a {age}-year-old {gender} who is {fitness_level} level, works out {workout_frequency} times per week, has {equipment_available} equipment, and wants to {fitness_goal}. Include specific exercises and rep ranges. Keep under 150 words.",
  "model": "gpt-4-turbo"
}
```

**Extremely personalized output for every user combination.**

---

### Caching Strategy

**Why caching matters:**

Without caching:
```
1,000 users × $0.008 per generation = $8.00/day
30 days = $240/month cost
```

With caching (7-day cache):
```
Unique combinations: ~50-100
Cost: 100 × $0.008 = $0.80 one-time
Serves all 1,000 users for 7 days
Monthly cost: ~$3-5
```

**Caching saves 98%+ on AI costs.**

---

### AI for Different Use Cases

**Fitness App:**
```json
{
  "prompt": "Create a {workout_duration}-minute {workout_type} workout..."
}
```

**Finance App:**
```json
{
  "prompt": "Recommend an investment strategy for someone with {risk_tolerance} risk tolerance, ${income} annual income, and {investment_goal} as their goal..."
}
```

**Health App:**
```json
{
  "prompt": "Provide health recommendations for someone experiencing {symptoms}, aged {age}, with {medical_conditions}. Recommend when to see a doctor if necessary..."
}
```

**Dating App:**
```json
{
  "prompt": "Generate profile tips for someone interested in {interests}, looking for {relationship_type}, with personality type {personality}..."
}
```

---

## Actions System

### Do Things When Users Interact

Actions trigger when users tap, swipe, or interact with elements.

### Action Types

#### 1. Set Variable

**Set a single variable:**
```json
{
  "onTap": {
    "action": "set_variable",
    "variable": "workout_frequency",
    "value": "3-4"
  }
}
```

---

#### 2. Set Multiple Variables

**Set several variables at once:**
```json
{
  "onTap": {
    "action": "set_variables",
    "variables": {
      "workout_frequency": "3-4",
      "fitness_level": "intermediate",
      "needs_guidance": true
    }
  }
}
```

---

#### 3. Navigate

**Go to specific screen:**
```json
{
  "onTap": {
    "action": "navigate",
    "next_screen": "screen_5"
  }
}
```

---

#### 4. Navigate Conditionally

**Go to different screens based on logic:**
```json
{
  "onTap": {
    "action": "navigate",
    "next_screen": {
      "if": {"variable": "has_wearable", "equals": true},
      "then": "wearable_sync_screen",
      "else": "goals_screen"
    }
  }
}
```

---

#### 5. Increment/Decrement

**Increase or decrease number:**
```json
{
  "onTap": {
    "action": "increment",
    "variable": "screens_completed",
    "amount": 1
  }
}
```
```json
{
  "onTap": {
    "action": "decrement",
    "variable": "days_remaining",
    "amount": 1
  }
}
```

---

#### 6. Toggle Boolean

**Flip true/false:**
```json
{
  "onTap": {
    "action": "toggle",
    "variable": "show_advanced_options"
  }
}
```

---

#### 7. Append to Array

**Add item to array:**
```json
{
  "onTap": {
    "action": "append",
    "variable": "fitness_goals",
    "value": "build_muscle"
  }
}
```

---

#### 8. Remove from Array

**Remove item from array:**
```json
{
  "onTap": {
    "action": "remove",
    "variable": "fitness_goals",
    "value": "lose_weight"
  }
}
```

---

#### 9. Track Event

**Send analytics event:**
```json
{
  "onTap": {
    "action": "track_event",
    "event_name": "selected_workout_frequency",
    "properties": {
      "frequency": "{workout_frequency}",
      "screen": "{current_screen}",
      "user_type": "{fitness_level}"
    }
  }
}
```

---

#### 10. Multiple Actions

**Execute several actions in sequence:**
```json
{
  "onTap": {
    "actions": [
      {
        "action": "set_variable",
        "variable": "workout_frequency",
        "value": "3-4"
      },
      {
        "action": "track_event",
        "event_name": "workout_frequency_selected"
      },
      {
        "action": "navigate",
        "next_screen": "sleep_quality_screen"
      }
    ]
  }
}
```

---

### Complete Example: Multi-Select with Actions
```json
{
  "type": "vstack",
  "spacing": 12,
  "elements": [
    {
      "type": "text",
      "content": "What are your fitness goals? (Select all that apply)"
    },
    {
      "type": "hstack",
      "id": "goal_lose_weight",
      "background": "{fitness_goals.includes('lose_weight') ? '#FF6B6B' : '#F5F5F5'}",
      "padding": 16,
      "borderRadius": 8,
      "onTap": {
        "actions": [
          {
            "action": "conditional",
            "if": {
              "variable": "fitness_goals",
              "contains": "lose_weight"
            },
            "then": {
              "action": "remove",
              "variable": "fitness_goals",
              "value": "lose_weight"
            },
            "else": {
              "action": "append",
              "variable": "fitness_goals",
              "value": "lose_weight"
            }
          },
          {
            "action": "track_event",
            "event_name": "goal_toggled",
            "properties": {
              "goal": "lose_weight"
            }
          }
        ]
      },
      "elements": [
        {"type": "text", "content": "Lose Weight"}
      ]
    }
  ]
}
```

**How it works:**
1. User taps "Lose Weight" option
2. If already selected → Remove from array (deselect)
3. If not selected → Add to array (select)
4. Track analytics event
5. Background color changes based on selection state

---

## Logic Operators

### All Available Operators

#### Comparison Operators
```json
// Equals
{"variable": "age", "operator": "equals", "value": 25}
{"variable": "age", "equals": 25}  // Shorthand

// Not Equals
{"variable": "gender", "not_equals": "other"}

// Greater Than
{"variable": "age", "greater_than": 18}

// Less Than
{"variable": "age", "less_than": 65}

// Greater Than or Equal
{"variable": "workout_frequency_num", "greater_than_or_equal": 3}

// Less Than or Equal
{"variable": "bmi", "less_than_or_equal": 25}
```

---

#### String Operators
```json
// Contains (substring)
{"variable": "name", "contains": "John"}

// Not Contains
{"variable": "name", "not_contains": "Admin"}

// Starts With
{"variable": "email", "starts_with": "admin@"}

// Ends With
{"variable": "email", "ends_with": "@company.com"}

// Matches Regex
{"variable": "phone", "matches": "^\\+1[0-9]{10}$"}
```

---

#### Array Operators
```json
// In Array
{"variable": "selected_goal", "in": ["lose_weight", "build_muscle"]}

// Not In Array
{"variable": "country", "not_in": ["US", "CA", "UK"]}

// Array Contains (value in array variable)
{"variable": "fitness_goals", "contains": "lose_weight"}

// Array Length
{"variable": "fitness_goals", "length_equals": 2}
{"variable": "fitness_goals", "length_greater_than": 0}
```

---

#### Existence Operators
```json
// Is Empty (null, undefined, "", [], {})
{"variable": "user_name", "is_empty": true}

// Is Not Empty
{"variable": "user_name", "is_not_empty": true}

// Exists (variable is defined)
{"variable": "custom_field", "exists": true}
```

---

#### Boolean Logic
```json
// AND - All conditions must be true
{
  "all": [
    {"variable": "age", "greater_than": 18},
    {"variable": "country", "equals": "US"},
    {"variable": "accepted_terms", "equals": true}
  ]
}

// OR - Any condition must be true
{
  "any": [
    {"variable": "is_premium", "equals": true},
    {"variable": "referral_code", "exists": true},
    {"variable": "beta_tester", "equals": true}
  ]
}

// NOT - Negate condition
{
  "not": {
    "variable": "has_subscription",
    "equals": true
  }
}

// Nested Logic
{
  "all": [
    {
      "any": [
        {"variable": "age", "greater_than": 21},
        {"variable": "parent_consent", "equals": true}
      ]
    },
    {"variable": "country", "equals": "US"},
    {
      "not": {
        "variable": "banned",
        "equals": true
      }
    }
  ]
}
```

---

## Dashboard: Visual Logic Builder

### Variable Manager

**Access:** right sidebar → Variables tab, the images entry we made before can also be here. 
```
┌────────────────────────────────┐
│  VARIABLES                      │
├────────────────────────────────┤
│  📊 User Input Variables        │
│  ├─ workout_frequency (string)  │
│  │   Values: "1-2", "3-4", "5+"│
│  │   [Edit] [Delete]            │
│  │                              │
│  ├─ sleep_quality (string)      │
│  │   Values: "good", "poor"     │
│  │   [Edit] [Delete]            │
│  │                              │
│  ├─ age (number)                │
│  │   Range: 13-120              │
│  │   [Edit] [Delete]            │
│  │                              │
│  └─ fitness_goals (array)       │
│      Values: ["lose_weight",    │
│               "build_muscle"]   │
│      [Edit] [Delete]            │
│                                 │
│  🧮 Computed Variables          │
│  ├─ bmi (number)                │
│  │   Formula: weight / height²  │
│  │   [Edit] [Delete]            │
│  │                              │
│  └─ sleep_recommendation (num)  │
│      Formula: IF(workout...)    │
│      [Edit] [Delete]            │
│                                 │
│  [+ Add Variable]               │
│                                 │
│  ℹ️ System Variables            │
│  • user.name                    │
│  • user.email                   │
│  • device.platform              │
│  • current_screen               │
│  • total_screens                │
└────────────────────────────────┘
```

---

### Condition Builder

**When editing element, click "Add Condition":**
```
┌─────────────────────────────────────────────┐
│  Element Visibility Conditions               │
├─────────────────────────────────────────────┤
│                                              │
│  Show this element when:                     │
│                                              │
│  ● Always show                               │
│  ○ Only if conditions are met                │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │ Match: ● ALL  ○ ANY  of these:       │  │
│  │                                        │  │
│  │ Condition 1:                           │  │
│  │ [workout_frequency ▼]                  │  │
│  │ [equals ▼]                             │  │
│  │ ["3-4"________________]                │  │
│  │ [× Remove]                             │  │
│  │                                        │  │
│  │ Condition 2:                           │  │
│  │ [sleep_quality ▼]                      │  │
│  │ [equals ▼]                             │  │
│  │ ["poor"________________]               │  │
│  │ [× Remove]                             │  │
│  │                                        │  │
│  │ [+ Add Condition]                      │  │
│  │                                        │  │
│  │ [Advanced: Nested Logic]               │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Preview:                                    │
│  "This will show for users who selected     │
│   '3-4' workouts AND 'poor' sleep quality"  │
│                                              │
│  Estimated reach: ~23% of users              │
│                                              │
│  [Cancel]  [Save Conditions]                │
└─────────────────────────────────────────────┘
```

---

### Action Builder

**When editing button/tappable element:**
```
┌─────────────────────────────────────────────┐
│  On Tap Actions                              │
├─────────────────────────────────────────────┤
│                                              │
│  When user taps this element:                │
│                                              │
│  Action 1: [Set Variable ▼]                 │
│  ┌───────────────────────────────────────┐  │
│  │ Variable: [workout_frequency ▼]       │  │
│  │ Value: ["3-4"________________]        │  │
│  └───────────────────────────────────────┘  │
│  [× Remove] [↑] [↓]                         │
│                                              │
│  Action 2: [Track Event ▼]                  │
│  ┌───────────────────────────────────────┐  │
│  │ Event Name: [workout_selected______]  │  │
│  │ Properties:                            │  │
│  │   frequency: {workout_frequency}       │  │
│  │   screen: {current_screen}             │  │
│  └───────────────────────────────────────┘  │
│  [× Remove] [↑] [↓]                         │
│                                              │
│  Action 3: [Navigate ▼]                     │
│  ┌───────────────────────────────────────┐  │
│  │ ○ Simple: Go to [screen_3 ▼]         │  │
│  │ ● Conditional Navigation               │  │
│  │   If: [has_wearable ▼] [= ▼] [true]  │  │
│  │   Then: [wearable_sync ▼]             │  │
│  │   Else: [goals_screen ▼]              │  │
│  └───────────────────────────────────────┘  │
│  [× Remove] [↑] [↓]                         │
│                                              │
│  [+ Add Action]                              │
│                                              │
│  [Cancel]  [Save Actions]                   │
└─────────────────────────────────────────────┘
```

---

### AI Content Builder

**Add AI-generated text element:**
```
┌─────────────────────────────────────────────┐
│  AI-Generated Content                        │
├─────────────────────────────────────────────┤
│                                              │
│  Prompt Template:                            │
│  ┌───────────────────────────────────────┐  │
│  │ Generate a personalized fitness       │  │
│  │ recommendation for someone who:       │  │
│  │                                        │  │
│  │ - Works out {workout_frequency}       │  │
│  │   times per week                       │  │
│  │ - Has {sleep_quality} sleep quality   │  │
│  │ - Is {gender}                         │  │
│  │ - Wants to {fitness_goal}             │  │
│  │                                        │  │
│  │ Keep it under 100 words, actionable,  │  │
│  │ and motivational.                      │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Insert Variable: [Select variable ▼]       │
│                                              │
│  AI Model: [GPT-4 Turbo ▼]                  │
│  ○ GPT-4 Turbo ($0.008/gen)                 │
│  ○ Claude 3 Sonnet ($0.004/gen)             │
│  ○ GPT-3.5 Turbo ($0.001/gen)               │
│                                              │
│  Settings:                                   │
│  Max Length: [100] words                     │
│  Temperature: [0.7] (creativity)             │
│  Cache Results: ☑ Yes (save 98% cost)       │
│  Cache Duration: [7] days                    │
│                                              │
│  Loading State:                              │
│  ┌───────────────────────────────────────┐  │
│  │ 💭 Creating your personalized plan... │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Fallback (if API fails):                   │
│  ┌───────────────────────────────────────┐  │
│  │ Based on your goals, we recommend     │  │
│  │ starting with a balanced routine.     │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  [Preview with Test Data]                   │
│  [Save]                                      │
└─────────────────────────────────────────────┘
```

---

### Test Data Preview

**Click "Preview with Test Data":**
```
┌─────────────────────────────────────────────┐
│  Test AI-Generated Content                  │
├─────────────────────────────────────────────┤
│                                              │
│  Set test values for variables:              │
│                                              │
│  workout_frequency: ["3-4" ▼]               │
│  sleep_quality: ["poor" ▼]                  │
│  gender: ["male" ▼]                         │
│  fitness_goal: [build muscle____________]   │
│                                              │
│  [Generate Preview] (uses real AI API)      │
│                                              │
│  ✨ Generated Result:                        │
│  ┌───────────────────────────────────────┐  │
│  │ As someone training 3-4 times per     │  │
│  │ week with poor sleep, your muscle     │  │
│  │ recovery is compromised. Prioritize   │  │
│  │ 8-9 hours of sleep nightly—this is    │  │
│  │ when muscle repair happens. Consider  │  │
│  │ a magnesium supplement 30 minutes     │  │
│  │ before bed. Reduce training intensity │  │
│  │ by 20% until sleep improves to avoid  │  │
│  │ overtraining. Track your recovery:    │  │
│  │ if you're sore 48+ hours, you need    │  │
│  │ more rest.                             │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Cost: $0.008  |  Cached for 7 days          │
│  Estimated monthly cost (1,000 users): $5   │
│                                              │
│  [Try Different Values]  [Use This Content] │
└─────────────────────────────────────────────┘
```

---

### Flow Debugger

**View variable values in real-time:**
```
┌─────────────────────────────────────────────┐
│  Flow Debugger                               │
├─────────────────────────────────────────────┤
│                                              │
│  Current Screen: screen_4 (Recommendations)  │
│                                              │
│  📊 Variable Values:                         │
│  ├─ workout_frequency: "3-4"                │
│  ├─ sleep_quality: "poor"                   │
│  ├─ gender: "male"                          │
│  ├─ age: 28                                 │
│  ├─ fitness_goals: ["build_muscle"]         │
│  ├─ has_wearable: false                     │
│  └─ bmi: 24.2 (computed)                    │
│                                              │
│  🎯 Active Conditions:                       │
│  ├─ ✅ Showing: "Advanced recommendation"   │
│  │   Condition: workout_frequency = "3-4"   │
│  │              AND sleep_quality = "poor"  │
│  │                                          │
│  ├─ ❌ Hidden: "Beginner recommendation"    │
│  │   Condition: workout_frequency = "1-2"   │
│  │              (not met)                   │
│  │                                          │
│  └─ ✅ Showing: AI-generated content        │
│      Cached result (generated 2 days ago)   │
│                                              │
│  🔄 Recent Actions:                          │
│  1. Set workout_frequency = "3-4"           │
│  2. Tracked event: workout_selected          │
│  3. Set sleep_quality = "poor"              │
│  4. Navigated to screen_4                   │
│                                              │
│  [Reset Variables] [Step Back] [Export Log] │
└─────────────────────────────────────────────┘
```

---

## Examples & Use Cases

### Example 1: Fitness App Onboarding

**Goal:** Personalized workout plan based on user profile

**Screen 1: Workout Frequency**
```json
{
  "type": "vstack",
  "spacing": 16,
  "elements": [
    {
      "type": "text",
      "content": "How often do you work out?",
      "fontSize": 24,
      "fontWeight": "bold"
    },
    {
      "type": "hstack",
      "background": "#F5F5F5",
      "padding": 16,
      "borderRadius": 8,
      "onTap": {
        "actions": [
          {"action": "set_variable", "variable": "workout_frequency", "value": "1-2"},
          {"action": "navigate", "next_screen": "sleep_screen"}
        ]
      },
      "elements": [
        {"type": "text", "content": "1-2 times per week"}
      ]
    },
    {
      "type": "hstack",
      "background": "#F5F5F5",
      "padding": 16,
      "borderRadius": 8,
      "onTap": {
        "actions": [
          {"action": "set_variable", "variable": "workout_frequency", "value": "3-4"},
          {"action": "navigate", "next_screen": "sleep_screen"}
        ]
      },
      "elements": [
        {"type": "text", "content": "3-4 times per week"}
      ]
    },
    {
      "type": "hstack",
      "background": "#F5F5F5",
      "padding": 16,
      "borderRadius": 8,
      "onTap": {
        "actions": [
          {"action": "set_variable", "variable": "workout_frequency", "value": "5+"},
          {"action": "navigate", "next_screen": "sleep_screen"}
        ]
      },
      "elements": [
        {"type": "text", "content": "5+ times per week"}
      ]
    }
  ]
}
```

**Screen 2: Sleep Quality**
```json
{
  "type": "vstack",
  "spacing": 16,
  "elements": [
    {
      "type": "text",
      "content": "How's your sleep quality?",
      "fontSize": 24
    },
    {
      "type": "hstack",
      "onTap": {
        "actions": [
          {"action": "set_variable", "variable": "sleep_quality", "value": "good"},
          {"action": "navigate", "next_screen": "recommendations"}
        ]
      },
      "elements": [{"type": "text", "content": "Good (7-9 hours)"}]
    },
    {
      "type": "hstack",
      "onTap": {
        "actions": [
          {"action": "set_variable", "variable": "sleep_quality", "value": "poor"},
          {"action": "navigate", "next_screen": "recommendations"}
        ]
      },
      "elements": [{"type": "text", "content": "Poor (< 7 hours)"}]
    }
  ]
}
```

**Screen 3: AI-Powered Recommendations**
```json
{
  "type": "vstack",
  "spacing": 24,
  "padding": 20,
  "elements": [
    {
      "type": "text",
      "content": "Your Personalized Plan",
      "fontSize": 28,
      "fontWeight": "bold"
    },
    {
      "type": "ai_generated_text",
      "prompt": "Generate a personalized fitness recommendation for someone who works out {workout_frequency} times per week and has {sleep_quality} sleep quality. Include specific sleep recommendations, recovery tips, and workout intensity guidance. Keep it under 100 words and actionable.",
      "model": "gpt-4-turbo",
      "cache": true,
      "loading_text": "Creating your personalized plan...",
      "fallback_text": "Based on your activity level and sleep patterns, focus on balanced training and prioritize 7-9 hours of sleep for optimal recovery."
    },
    {
      "type": "button",
      "text": "Start Your Journey",
      "onTap": {"action": "navigate", "next_screen": "complete"}
    }
  ]
}
```

---

### Example 2: E-commerce Product Recommendations

**Screen 1: Style Preference**
```json
{
  "type": "vstack",
  "elements": [
    {
      "type": "text",
      "content": "What's your style?",
      "fontSize": 24
    },
    {
      "type": "hstack",
      "onTap": {
        "action": "set_variable",
        "variable": "style_preference",
        "value": "minimalist"
      },
      "elements": [{"type": "text", "content": "Minimalist"}]
    },
    {
      "type": "hstack",
      "onTap": {
        "action": "set_variable",
        "variable": "style_preference",
        "value": "bold"
      },
      "elements": [{"type": "text", "content": "Bold & Colorful"}]
    }
  ]
}
```

**Screen 2: Conditional Product Display**
```json
{
  "type": "vstack",
  "elements": [
    {
      "type": "text",
      "content": "Recommended for You"
    },
    {
      "type": "vstack",
      "conditions": {
        "show_if": {
          "variable": "style_preference",
          "equals": "minimalist"
        }
      },
      "elements": [
        {"type": "image", "source": "minimalist_product_1.jpg"},
        {"type": "text", "content": "Clean Lines Tee - $29"}
      ]
    },
    {
      "type": "vstack",
      "conditions": {
        "show_if": {
          "variable": "style_preference",
          "equals": "bold"
        }
      },
      "elements": [
        {"type": "image", "source": "bold_product_1.jpg"},
        {"type": "text", "content": "Vibrant Pattern Tee - $35"}
      ]
    }
  ]
}
```

---

### Example 3: Conditional Screen Skip

**Skip wearable sync if user doesn't have one:**
```json
{
  "type": "vstack",
  "elements": [
    {
      "type": "text",
      "content": "Do you have a fitness tracker?"
    },
    {
      "type": "hstack",
      "onTap": {
        "actions": [
          {"action": "set_variable", "variable": "has_wearable", "value": true},
          {"action": "navigate", "next_screen": "wearable_sync"}
        ]
      },
      "elements": [{"type": "text", "content": "Yes"}]
    },
    {
      "type": "hstack",
      "onTap": {
        "actions": [
          {"action": "set_variable", "variable": "has_wearable", "value": false},
          {"action": "navigate", "next_screen": "goals_screen"}
        ]
      },
      "elements": [{"type": "text", "content": "No"}]
    }
  ]
}
```

**Result:**
- User has wearable → Goes to wearable_sync screen
- User doesn't have wearable → Skips wearable_sync, goes straight to goals

---

### Example 4: Multi-Select with Array Variables
```json
{
  "type": "vstack",
  "elements": [
    {
      "type": "text",
      "content": "Select all that apply:"
    },
    {
      "type": "hstack",
      "background": "{fitness_goals.includes('lose_weight') ? '#FF6B6B' : '#F5F5F5'}",
      "onTap": {
        "action": "conditional",
        "if": {
          "variable": "fitness_goals",
          "contains": "lose_weight"
        },
        "then": {
          "action": "remove",
          "variable": "fitness_goals",
          "value": "lose_weight"
        },
        "else": {
          "action": "append",
          "variable": "fitness_goals",
          "value": "lose_weight"
        }
      },
      "elements": [
        {"type": "text", "content": "Lose Weight"}
      ]
    },
    {
      "type": "hstack",
      "background": "{fitness_goals.includes('build_muscle') ? '#FF6B6B' : '#F5F5F5'}",
      "onTap": {
        "action": "conditional",
        "if": {
          "variable": "fitness_goals",
          "contains": "build_muscle"
        },
        "then": {
          "action": "remove",
          "variable": "fitness_goals",
          "value": "build_muscle"
        },
        "else": {
          "action": "append",
          "variable": "fitness_goals",
          "value": "build_muscle"
        }
      },
      "elements": [
        {"type": "text", "content": "Build Muscle"}
      ]
    }
  ]
}
```

---

## Best Practices

### 1. Keep Logic Simple

❌ **Don't:**
```json
{
  "all": [
    {
      "any": [
        {"variable": "a", "equals": 1},
        {
          "all": [
            {"variable": "b", "equals": 2},
            {"variable": "c", "equals": 3}
          ]
        }
      ]
    },
    {
      "not": {
        "any": [
          {"variable": "d", "equals": 4},
          {"variable": "e", "equals": 5}
        ]
      }
    }
  ]
}
```
**Too complex. Hard to debug.**

✅ **Do:**
```json
{
  "all": [
    {"variable": "workout_frequency", "equals": "3-4"},
    {"variable": "sleep_quality", "equals": "poor"}
  ]
}
```
**Simple, clear, easy to understand.**

---

### 2. Use Computed Variables for Complex Logic

❌ **Don't:**
Repeat complex formulas everywhere:
```json
{
  "content": "Your BMI is {weight_kg / (height_m * height_m)}"
}
```

✅ **Do:**
Define computed variable once:
```json
{
  "computed_variables": {
    "bmi": {
      "type": "formula",
      "formula": "weight_kg / (height_m * height_m)"
    }
  }
}
```
Then use everywhere:
```json
{
  "content": "Your BMI is {bmi}"
}
```

---



---

### 4. Cache AI Content

❌ **Don't:**
```json
{
  "type": "ai_generated_text",
  "cache": false
}
```
**Costs $0.008 per user. 1,000 users = $8/day = $240/month**

✅ **Do:**
```json
{
  "type": "ai_generated_text",
  "cache": true,
  "cache_duration": 7
}
```
**Costs $0.008 × 50 unique combinations = $0.40 total**

---

### 5. Use Meaningful Variable Names

❌ **Don't:**
```json
{
  "variable": "var1",
  "value": "val1"
}
```

✅ **Do:**
```json
{
  "variable": "workout_frequency",
  "value": "3-4"
}
```

---

### 6. Test All Paths

**Use the Flow Debugger to test:**
- All combinations of user selections
- Edge cases (empty arrays, null values)
- Conditional navigation paths
- AI content generation with different variables

---

### 7. Track Analytics for Logic Paths
```json
{
  "onTap": {
    "actions": [
      {"action": "set_variable", "variable": "choice", "value": "A"},
      {
        "action": "track_event",
        "event_name": "logic_path_taken",
        "properties": {
          "choice": "A",
          "screen": "{current_screen}"
        }
      }
    ]
  }
}
```

**Then analyze which paths users take most often.**

---

### 8. Progressive Disclosure

Don't overwhelm users with too many choices upfront.

❌ **Don't:**
```
Screen 1: 10 questions all at once
```

✅ **Do:**
```
Screen 1: Basic info (2-3 questions)
Screen 2: More details (conditional based on Screen 1)
Screen 3: Advanced (only if needed)
```

---

### 9. Validate User Input
```json
{
  "type": "button",
  "text": "Continue",
  "onTap": {
    "action": "conditional",
    "if": {
      "variable": "fitness_goals",
      "is_empty": true
    },
    "then": {
      "action": "show_error",
      "message": "Please select at least one goal"
    },
    "else": {
      "action": "navigate",
      "next_screen": "next"
    }
  }
}
```

---

### 10. Document Your Logic

**Add comments in JSON (for your reference in dashboard):**
```json
{
  "_comment": "This screen shows different content for beginners vs advanced users based on workout_frequency and fitness_level variables",
  "type": "vstack",
  "elements": [...]
}
```

---



---

## Support & Resources

<!-- ### Documentation
- [Variable System Guide](./variables-guide.md)
- [Conditional Logic Cookbook](./logic-cookbook.md)
- [AI Content Best Practices](./ai-content-guide.md)
- [Formula Reference](./formula-reference.md)

### Examples
- [Fitness App Logic Flow](./examples/fitness-app.md)
- [E-commerce Personalization](./examples/ecommerce.md)
- [Healthcare Recommendations](./examples/healthcare.md)

### Community
- Discord: chat.yourplatform.com/#logic
- Gallery: gallery.yourplatform.com/logic
- Blog: blog.yourplatform.com/logic-systems -->

---

**The Logic System transforms your onboarding from static to intelligent. Build flows that adapt to each user, generate personalized content with AI, and create experiences that convert.**

🚀 **Start building intelligent onboarding today.**