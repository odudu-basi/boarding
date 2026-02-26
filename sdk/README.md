# Noboarding - React Native SDK

React Native SDK for rendering server-driven onboarding flows. Integrate once, then update your onboarding screens remotely from the dashboard — no App Store reviews needed.

## Installation

```bash
npm install noboarding
# or
yarn add noboarding
```

## Quick Start

```typescript
import { OnboardingFlow } from 'noboarding';
import { requestNotificationPermission, requestAppRating, signInWithApple } from './nativeHandlers';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <OnboardingFlow
        // Recommended: Use dual keys for automatic environment detection
        testKey="nb_test_your_test_key_here"
        productionKey="nb_live_your_production_key_here"
        // The SDK automatically uses testKey in __DEV__ and productionKey in production

        // Alternative: Legacy single key (still supported)
        // apiKey="nb_test_your_api_key_here"

        onComplete={(userData) => {
          console.log('Collected data:', userData);
          setShowOnboarding(false);
        }}
        onSkip={() => {
          setShowOnboarding(false);
        }}

        // Optional: Get the generated user ID to sync with other services
        onUserIdGenerated={(userId) => {
          console.log('User ID:', userId);
          // Use this to sync with RevenueCat, analytics, etc.
        }}

        // Optional: Register native handlers for trigger_native actions
        nativeHandlers={{
          requestNotifications: requestNotificationPermission,
          requestAppRating: requestAppRating,
          signInWithApple: signInWithApple,
        }}
      />
    );
  }

  return <YourMainApp />;
}
```

### API Keys

You'll find two API keys in your dashboard:
- **Test Key** (`nb_test_...`) - Used for development and testing
- **Production Key** (`nb_live_...`) - Used for production builds

The SDK automatically detects your environment using React Native's `__DEV__` flag and uses the appropriate key.

## How It Works

1. The SDK fetches your onboarding configuration from Supabase at runtime
2. Screens defined as JSON element trees are rendered natively using `ElementRenderer`
3. You update screens in the dashboard, publish, and the SDK picks up changes automatically
4. No app binary changes required — everything is data-driven

## Screen Types

There are **two screen types** in Noboarding:

### 1. Noboard Screen (AI-Generated)

Screens built with the **composable primitive system**. The AI generates these screens in the dashboard, and the `ElementRenderer` recursively maps the JSON element tree to native React Native components (`View`, `Text`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`).

**✅ Fully updateable over-the-air** — change UI, text, colors, layout without app updates.

```json
{
  "id": "welcome",
  "type": "noboard_screen",
  "elements": [
    {
      "id": "root",
      "type": "vstack",
      "style": { "width": "100%", "height": "100%", "padding": 24 },
      "children": [
        {
          "id": "title",
          "type": "text",
          "props": { "text": "Welcome!" },
          "style": { "fontSize": 32, "fontWeight": "700" }
        },
        { "id": "spacer", "type": "spacer" },
        {
          "id": "cta",
          "type": "hstack",
          "style": {
            "backgroundColor": "#000",
            "borderRadius": 12,
            "padding": 16,
            "justifyContent": "center"
          },
          "children": [
            {
              "id": "cta_text",
              "type": "text",
              "props": { "text": "Get Started" },
              "style": { "color": "#fff", "fontSize": 16 }
            }
          ],
          "action": { "type": "navigate", "destination": "next" }
        }
      ]
    }
  ]
}
```

### 2. Custom Screen (Developer-Registered Components)

React Native components you write and register with the SDK. Used for advanced native features that can't be represented as JSON element trees (camera, biometrics, complex native SDKs, custom animations).

**❌ Code NOT updateable over-the-air** — requires app update to change component logic.
**✅ Flow control updateable** — can add/remove/reorder these screens in dashboard without app updates.

```typescript
// screens/PaywallScreen.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import type { CustomScreenProps } from 'noboarding';

export const PaywallScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  onSkip,
  preview,
  data,
  onDataUpdate,
}) => {
  // Preview mode for dashboard
  if (preview) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 64 }}>💎</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginVertical: 20 }}>
          Paywall Preview
        </Text>
        <Button title="Continue" onPress={onNext} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20 }}>
        Unlock Premium
      </Text>
      <Button title="Subscribe - $9.99/month" onPress={() => {
        analytics.track('paywall_conversion');
        onDataUpdate?.({ premium: true });
        onNext();
      }} />
      {onSkip && <Button title="Maybe Later" onPress={onSkip} color="#666" />}
    </View>
  );
};

// Register in your app
<OnboardingFlow
  customComponents={{
    PaywallScreen: PaywallScreen,
  }}
  ...
/>
```

Then add to your flow in the dashboard by clicking "Add Custom Screen" and entering the component name `PaywallScreen`.

## Composable Primitives

Noboard screens are built from a small set of building blocks:

### Containers (have `children` array)
- `vstack` — vertical flex column
- `hstack` — horizontal flex row
- `zstack` — layered/overlapping elements
- `scrollview` — scrollable container

### Content (leaf elements with `props`)
- `text` — text content (`props.text`)
- `image` — image (`props.url`, `props.imageDescription`)
- `video` — video placeholder (`props.videoDescription`)
- `lottie` — Lottie animation (`props.animationDescription`)
- `icon` — emoji (`props.emoji`) or named icon (`props.name`, `props.library`)
- `input` — text field (`props.placeholder`, `props.type`, `props.variable`)
- `spacer` — flexible empty space
- `divider` — horizontal line

**Note:** There are no dedicated `button`, `checkbox`, or `card` elements. Complex components are composed from stacks with actions attached.

## Actions

Any container can have an `action` or `actions` array to make it interactive:

```typescript
action: {
  type: 'tap' | 'navigate' | 'link' | 'toggle' | 'dismiss' | 'set_variable' | 'trigger_native',
  destination?: string,  // For navigate/link
  variable?: string,     // For set_variable
  value?: any,           // For set_variable
  handlerName?: string,  // For trigger_native
  handlerParams?: Record<string, any>  // For trigger_native
}
```

### Action Types

| Action | Behavior | Use Case |
|--------|----------|----------|
| `tap` | Generic tap handler | Analytics tracking |
| `navigate` | Go to `"next"`, `"previous"`, or a specific screen ID | Flow navigation |
| `link` | Open URL via `Linking.openURL` | External links |
| `toggle` | Toggle selected/unselected state (visual border change) | Single/multi-select options |
| `dismiss` | Dismiss current screen or flow | Exit/skip |
| `set_variable` | Store a value in the variable store | Save form data, selections |
| `trigger_native` | **NEW:** Call registered native handler | Permissions, auth, ratings, native features |

### Multiple Actions

Elements can have multiple actions that execute in sequence:

```json
{
  "type": "hstack",
  "actions": [
    { "type": "set_variable", "variable": "selected_plan", "value": "premium" },
    { "type": "navigate", "destination": "next" }
  ]
}
```

## Native Handlers (trigger_native Action)

**The best of both worlds:** Over-the-air updateable UI that triggers native code compiled into your app.

### Why Use trigger_native?

For native features like notifications, authentication, app ratings, camera access, or biometrics:
- ✅ **UI fully updateable** — Change button text, colors, position via dashboard
- ✅ **Native code stays in app** — Logic never changes, no app updates needed
- ✅ **Flow control updateable** — Add/remove/reorder via dashboard
- ✅ **Works for all native features** — Any native API or SDK

### How It Works

1. **Write native handler functions** in your app (one-time setup)
2. **Register handlers** with `OnboardingFlow`
3. **AI generates buttons** in dashboard that trigger these handlers
4. **Update button UI remotely** without app updates

### Example: Notification Permissions

**Step 1:** Create the native handler

```typescript
// nativeHandlers.ts
import * as Notifications from 'expo-notifications';

export const requestNotificationPermission = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    return { granted: status === 'granted', status };
  }

  return { granted: true, status: existingStatus };
};
```

**Step 2:** Register with SDK

```typescript
import { OnboardingFlow } from 'noboarding';
import { requestNotificationPermission } from './nativeHandlers';

<OnboardingFlow
  testKey="nb_test_..."
  nativeHandlers={{
    requestNotifications: requestNotificationPermission,
  }}
  onComplete={(data) => console.log(data)}
/>
```

**Step 3:** AI generates the button in dashboard

In the dashboard AI Chat, say: "Create a button that says 'Enable Notifications' and triggers the `requestNotifications` handler"

The AI generates:

```json
{
  "type": "hstack",
  "style": { "backgroundColor": "#007AFF", "padding": 16, "borderRadius": 12 },
  "children": [
    {
      "type": "text",
      "props": { "text": "Enable Notifications" },
      "style": { "color": "#fff", "fontSize": 16, "fontWeight": "600" }
    }
  ],
  "actions": [
    {
      "type": "trigger_native",
      "handlerName": "requestNotifications",
      "variable": "notification_result"
    },
    { "type": "navigate", "destination": "next" }
  ]
}
```

**Step 4:** Update button UI remotely

Change the button text, colors, position in the dashboard — no app update needed!

### More Examples

#### App Store Rating

```typescript
// nativeHandlers.ts
import * as StoreReview from 'expo-store-review';

export const requestAppRating = async () => {
  const isAvailable = await StoreReview.isAvailableAsync();
  if (isAvailable) {
    await StoreReview.requestReview();
    return { prompted: true };
  }
  return { prompted: false, reason: 'not_available' };
};
```

```typescript
<OnboardingFlow
  nativeHandlers={{
    requestAppRating: requestAppRating,
  }}
/>
```

#### Apple Sign-In

```typescript
// nativeHandlers.ts
import * as AppleAuthentication from 'expo-apple-authentication';

export const signInWithApple = async () => {
  try {
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
      fullName: credential.fullName,
    };
  } catch (error) {
    return { success: false, error: error.code };
  }
};
```

```typescript
<OnboardingFlow
  nativeHandlers={{
    signInWithApple: signInWithApple,
  }}
/>
```

### Handler Return Values

Handlers can return data that gets saved to the variable store:

```json
{
  "type": "trigger_native",
  "handlerName": "requestNotifications",
  "variable": "notification_result"
}
```

The returned value is automatically stored in `variables.notification_result` and can be:
- Used in conditional navigation
- Referenced in text templates: `{notification_result.status}`
- Passed to `onComplete` callback

### Passing Parameters

Send configuration to handlers:

```json
{
  "type": "trigger_native",
  "handlerName": "trackEvent",
  "handlerParams": {
    "eventName": "button_clicked",
    "category": "onboarding"
  }
}
```

```typescript
export const trackEvent = async (params) => {
  await analytics.track(params.eventName, { category: params.category });
};
```

## CustomScreenProps Interface

For developer-registered custom screens:

```typescript
interface CustomScreenProps {
  analytics: {
    track: (event: string, properties?: Record<string, any>) => void;
  };
  onNext: () => void;
  onBack?: () => void;  // Navigate to previous screen (undefined on first screen)
  onSkip?: () => void;
  preview?: boolean;  // True when rendering in dashboard preview
  data?: Record<string, any>;  // Previously collected user data
  onDataUpdate?: (data: Record<string, any>) => void;  // Update collected data
}
```

## OnboardingFlow Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `testKey` | `string` | No* | Test API key (`nb_test_...`) for development |
| `productionKey` | `string` | No* | Production API key (`nb_live_...`) for production |
| `apiKey` | `string` | No* | Legacy single key (backwards compatible) |
| `onComplete` | `(data?) => void` | Yes | Called when user completes onboarding |
| `onSkip` | `() => void` | No | Called when user skips onboarding |
| `baseUrl` | `string` | No | Custom API base URL |
| `customComponents` | `Record<string, Component>` | No | Developer-registered custom screen components |
| `nativeHandlers` | `Record<string, Function>` | No | Native handler functions for `trigger_native` actions |
| `initialVariables` | `Record<string, any>` | No | Initial values for the variable store |
| `onUserIdGenerated` | `(userId: string) => void` | No | Called when SDK generates user ID |

*At least one key is required: either `apiKey`, or both `testKey` and `productionKey`

## Auto-Tracked Events

The SDK automatically tracks:

- `onboarding_started`
- `screen_viewed`
- `screen_completed`
- `screen_skipped`
- `time_on_screen`
- `button_clicked`
- `input_focused`
- `input_completed`
- `onboarding_completed`
- `onboarding_abandoned`
- `element_action` — tracks every action with element ID, action type, and screen ID

## Variables & Templating

Variables store data collected during onboarding:

### Setting Variables

```json
{
  "type": "input",
  "props": { "placeholder": "Enter your name", "variable": "user_name" }
}
```

```json
{
  "type": "hstack",
  "action": {
    "type": "set_variable",
    "variable": "selected_plan",
    "value": "premium"
  }
}
```

### Using Variables in Text

```json
{
  "type": "text",
  "props": { "text": "Welcome back, {user_name}!" }
}
```

### Conditional Navigation

```json
{
  "type": "navigate",
  "destination": {
    "if": { "variable": "selected_plan", "operator": "equals", "value": "premium" },
    "then": "payment_screen",
    "else": "free_trial_screen"
  }
}
```

### Conditional Visibility

```json
{
  "type": "text",
  "props": { "text": "Premium features unlocked!" },
  "conditions": {
    "show_if": { "variable": "premium", "operator": "equals", "value": true }
  }
}
```

## Exports

```typescript
// Main component
import { OnboardingFlow } from 'noboarding';

// Element renderer (for custom usage)
import { ElementRenderer } from 'noboarding';

// Types
import type {
  OnboardingFlowProps,
  ScreenConfig,
  OnboardingConfig,
  ElementNode,
  ElementType,
  ElementAction,
  ElementStyle,
  ElementPosition,
  AnalyticsEvent,
  CustomScreenProps,
} from 'noboarding';

// Utilities
import { API, AnalyticsManager } from 'noboarding';
```

## Development

### Building the SDK

The TestApp imports the SDK from the compiled `lib/` directory, not from `src/` directly. After making changes to `sdk/src/`, you must rebuild:

```bash
cd sdk
npm run build
```

Then restart the TestApp.

### Dashboard Preview Integration

The dashboard uses **local copies** of SDK source files for the preview feature. When you modify SDK source files, sync them to the dashboard:

**Manual sync:**
```bash
# From project root
npm run sync
```

**Auto-sync during development:**
```bash
# From project root
npm run sync:watch
```

**Full development mode:**
```bash
# From project root
npm run dev
```

This command:
1. Syncs SDK files to dashboard
2. Starts file watcher for auto-sync
3. Starts dashboard dev server

#### Files That Need Syncing

- `src/types.ts` → Auto-synced to `dashboard/lib/sdk/types.ts`
- `src/variableUtils.ts` → Auto-synced to `dashboard/lib/sdk/variableUtils.ts`
- `src/components/ElementRenderer.tsx` → ⚠️ **NOT auto-synced** (dashboard has web-specific modifications)

## Requirements

- React Native >= 0.60.0
- React >= 16.8.0

## License

MIT
