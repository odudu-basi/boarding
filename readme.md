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
│       ├── types.ts               # Shared type definitions
│       └── sdk/                   # Local SDK copies for preview
├── sdk/                # React Native SDK
│   └── src/
│       ├── OnboardingFlow.tsx     # Main SDK entry component
│       ├── components/
│       │   └── ElementRenderer.tsx # Native element tree renderer
│       ├── types.ts
│       ├── api.ts
│       └── analytics.ts
├── supabase/           # Supabase edge functions & migrations
└── TestApp/            # React Native test application
```

## Key Concepts

### Server-Driven UI

Screens are defined as JSON element trees that are fetched at runtime by the SDK. This enables over-the-air UI updates without App Store reviews.

### Two Screen Types

**1. Noboard Screen (AI-Generated)**
- Built with composable primitives
- Fully updateable over-the-air (JSON element trees)
- Created via AI Chat Builder in dashboard
- No code compilation required

**2. Custom Screen (Developer-Registered)**
- React Native components you write
- For native features (camera, payments, biometrics, etc.)
- Code NOT updateable OTA (requires app update)
- Flow control updateable (add/remove/reorder via dashboard)

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

Any container can have an `action` or `actions` array to make it interactive:

- `tap` — generic tap handler
- `navigate` — go to next/previous/specific screen
- `link` — open external URL
- `toggle` — toggle selected/unselected state
- `dismiss` — dismiss the current screen or flow
- `set_variable` — store value in variable store
- `trigger_native` — call native handler registered in SDK

### Native Handlers (trigger_native)

**The killer feature:** Noboard screens (AI-generated, fully updateable UI) can trigger native code (compiled into app).

**Use cases:**
- Notification permissions
- Apple/Google Sign-In
- App Store ratings
- Camera access
- Biometric authentication
- Any native SDK or API

**How it works:**
1. Write native handler function once (e.g., `requestNotificationPermission`)
2. Register it with `OnboardingFlow` via `nativeHandlers` prop
3. AI generates button UI in dashboard that triggers the handler
4. Update button UI remotely without app updates

**What's updateable:**
- ✅ Button text, colors, position, styling
- ✅ Screen order and flow logic
- ✅ When the button appears
- ❌ The native code implementation (compiled in app)

### AI Chat Builder

The dashboard includes a conversational AI interface powered by Claude Sonnet. Users can:

1. Describe a screen in natural language or upload a screenshot
2. Iterate with follow-up messages ("make the heading red", "add a button at the bottom")
3. The AI modifies only what's requested, preserving the rest of the element tree
4. Image slots are automatically numbered for easy filling via upload or generation

Chat history persists per-screen across tab switches.

### Image Slots

When the AI creates a screen with images, each image is assigned a sequential `slotNumber`. The dashboard sidebar shows all image slots with options to upload or generate images.

### Variables & Conditional Logic

- Store data from inputs and selections in a variable store
- Use variables in text templates: `"Welcome, {user_name}!"`
- Conditional navigation based on variable values
- Conditional visibility for elements
- Variables passed to `onComplete` callback

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

## Example: Native Handler Integration

### 1. Create Native Handlers

```typescript
// nativeHandlers.ts
import * as Notifications from 'expo-notifications';
import * as StoreReview from 'expo-store-review';
import * as AppleAuthentication from 'expo-apple-authentication';

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return { granted: status === 'granted', status };
};

export const requestAppRating = async () => {
  const isAvailable = await StoreReview.isAvailableAsync();
  if (isAvailable) {
    await StoreReview.requestReview();
    return { prompted: true };
  }
  return { prompted: false };
};

export const signInWithApple = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  return {
    success: true,
    userId: credential.user,
    email: credential.email,
  };
};
```

### 2. Register with SDK

```typescript
import { OnboardingFlow } from 'noboarding';
import {
  requestNotificationPermission,
  requestAppRating,
  signInWithApple,
} from './nativeHandlers';

<OnboardingFlow
  testKey="nb_test_..."
  productionKey="nb_live_..."
  nativeHandlers={{
    requestNotifications: requestNotificationPermission,
    requestAppRating: requestAppRating,
    signInWithApple: signInWithApple,
  }}
  onComplete={(userData) => {
    console.log('Onboarding complete:', userData);
  }}
/>
```

### 3. AI Generates Button in Dashboard

In dashboard AI Chat: "Create a button that says 'Enable Notifications' and triggers the `requestNotifications` handler, then navigates to the next screen"

AI generates this element tree:

```json
{
  "type": "hstack",
  "style": { "backgroundColor": "#007AFF", "padding": 16, "borderRadius": 12 },
  "children": [
    { "type": "text", "props": { "text": "Enable Notifications" } }
  ],
  "actions": [
    { "type": "trigger_native", "handlerName": "requestNotifications" },
    { "type": "navigate", "destination": "next" }
  ]
}
```

### 4. Update Button UI Over-the-Air

Change button text, colors, position in dashboard → No app update needed!

## Features

### For Developers
- ✅ Integrate SDK once, update flows remotely forever
- ✅ A/B test different onboarding flows
- ✅ No App Store review wait for UI changes
- ✅ Native handler system for platform features
- ✅ Analytics auto-tracked
- ✅ Variable system for data collection
- ✅ Conditional logic and navigation

### For Product Teams
- ✅ AI-powered screen builder (describe in natural language)
- ✅ Visual flow editor with live preview
- ✅ Upload screenshots, AI recreates them
- ✅ Image upload and AI generation
- ✅ Real-time preview on iPhone/Android frames
- ✅ Analytics dashboard

## Documentation

- **[SDK README](./sdk/README.md)** - Complete SDK documentation
- **[Dashboard README](./dashboard/README.md)** - Dashboard development guide

## License

MIT
