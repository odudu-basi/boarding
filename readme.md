# Noboarding - Onboarding-as-a-Service Platform

A SaaS platform where mobile app developers integrate a React Native SDK once, then remotely create, update, and A/B test their onboarding flows through a web dashboard — no App Store reviews needed.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Native   │────▶│     Supabase      │◀────│   Dashboard     │
│      SDK         │     │   (PostgreSQL +   │     │   (Next.js)     │
│                  │     │  Edge Functions)   │     │                 │
│  ElementRenderer │     └──────────────────┘     │  AI Chat Builder│
│  OnboardingFlow  │                               │  Flow Builder   │
└─────────────────┘                               └─────────────────┘
```

## Project Structure

```
Boarding/
├── dashboard/          # Next.js web dashboard
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-screen/   # AI screen generation endpoint
│   │   │   └── generate-image/    # AI image generation endpoint
│   │   └── flows/[id]/            # Flow builder page
│   ├── components/
│   │   └── CustomScreenRenderer.tsx  # Web preview renderer
│   └── lib/
│       └── types.ts               # Shared type definitions
├── sdk/                # React Native SDK
│   └── src/
│       ├── OnboardingFlow.tsx     # Main SDK entry component
│       ├── components/
│       │   ├── ElementRenderer.tsx # Native element tree renderer
│       │   ├── WelcomeScreen.tsx
│       │   ├── TextInput.tsx
│       │   └── SocialLogin.tsx
│       ├── types.ts
│       ├── api.ts
│       └── analytics.ts
├── supabase/           # Supabase edge functions & migrations
└── TestApp/            # React Native test application
```

## Key Concepts

### Server-Driven UI

Screens are defined as JSON element trees that are fetched at runtime by the SDK. This enables over-the-air UI updates without App Store reviews.

### Composable Primitives

All UI is built from a small set of primitives:

| Type | Category | Description |
|------|----------|-------------|
| `vstack` | Container | Vertical flex column |
| `hstack` | Container | Horizontal flex row |
| `zstack` | Container | Layered/overlapping elements |
| `scrollview` | Container | Scrollable container |
| `text` | Content | Text content |
| `image` | Content | Image with slot numbering |
| `video` | Content | Video placeholder |
| `lottie` | Content | Lottie animation |
| `icon` | Content | Named icon or emoji |
| `input` | Content | Text input field |
| `spacer` | Content | Flexible empty space |
| `divider` | Content | Horizontal line |

There are no dedicated `button`, `checkbox`, or `card` elements. Complex components are composed from stacks with **actions** attached:

```json
{
  "id": "get_started_btn",
  "type": "hstack",
  "style": { "backgroundColor": "#000", "borderRadius": 12, "padding": 16 },
  "children": [
    { "id": "btn_text", "type": "text", "props": { "text": "Get Started" } }
  ],
  "action": { "type": "navigate", "destination": "next" }
}
```

### Actions

Any container can have an `action` to make it interactive:

- `tap` — generic tap handler
- `navigate` — go to next/previous/specific screen
- `link` — open external URL
- `toggle` — toggle selected/unselected state
- `dismiss` — dismiss the current screen or flow

### AI Chat Builder

The dashboard includes a conversational AI interface powered by Claude Sonnet. Users can:

1. Describe a screen in natural language or upload a screenshot
2. Iterate with follow-up messages ("make the heading red", "add a button at the bottom")
3. The AI modifies only what's requested, preserving the rest of the element tree
4. Image slots are automatically numbered for easy filling via upload or generation

Chat history persists per-screen across tab switches.

### Image Slots

When the AI creates a screen with images, each image is assigned a sequential `slotNumber`. The dashboard sidebar shows all image slots with options to upload or generate images.

## Tech Stack

- **SDK**: React Native, TypeScript, AsyncStorage
- **Dashboard**: Next.js 14 (App Router), TypeScript, Supabase Auth
- **Backend**: Supabase (PostgreSQL, Edge Functions, Storage)
- **AI**: Anthropic Claude API (screen generation + screenshot recreation)
- **Payments**: Stripe

## Getting Started

### Prerequisites

Install dependencies from the root directory:

```bash
npm install
```

This installs `nodemon` and `concurrently` for SDK-to-Dashboard file syncing.

### Dashboard Development

**Option 1: Full Development Mode (with auto-sync)**

Run from the root directory for automatic SDK syncing:

```bash
npm run dev
```

This command:
1. Syncs SDK files to dashboard
2. Starts file watcher for auto-sync
3. Starts dashboard dev server

**Option 2: Dashboard Only**

If you don't need SDK changes:

```bash
cd dashboard
npm install
cp .env.example .env.local  # Add your Supabase + Anthropic keys
npm run dev
```

### SDK Development

**Important: SDK-Dashboard Sync**

The dashboard preview uses a **local copy** of SDK files in `dashboard/lib/sdk/`. When you modify SDK source files, you must sync them:

**Manual sync (when needed):**
```bash
npm run sync
```

**Auto-sync (during development):**
```bash
npm run sync:watch
```

This watches SDK files and auto-copies changes to the dashboard.

**Files synced:**
- `sdk/src/types.ts` → `dashboard/lib/sdk/types.ts`
- `sdk/src/variableUtils.ts` → `dashboard/lib/sdk/variableUtils.ts`
- ⚠️ `ElementRenderer.tsx` is **NOT auto-synced** (has web-specific icon modifications)

**ElementRenderer Web Modifications:**

The dashboard copy of `ElementRenderer.tsx` has been modified to support web icons using `react-icons`:
- Real icons render in preview (Feather, Material, Ionicons, FontAwesome)
- Same icon names work as in mobile app
- Gradients fall back to solid colors (accepted limitation)

If you make significant changes to the SDK's `ElementRenderer.tsx` and need to update the dashboard:
```bash
npm run sync:full  # Syncs all files including ElementRenderer
# Then manually re-add web icon support (imports and icon case)
```

**Why:** The dashboard needs local copies because Next.js/Turbopack doesn't support importing from external directories with the react-native-web setup.

### SDK Build (for npm publish)

```bash
cd sdk
npm install
npm run build
```

### Test App

```bash
cd TestApp
npm install
npx react-native run-ios  # or run-android
```

## Environment Variables

### Dashboard (`dashboard/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## License

MIT
