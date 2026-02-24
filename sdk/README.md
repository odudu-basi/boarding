# Noboarding - React Native SDK

React Native SDK for rendering server-driven onboarding flows. Integrate once, then update your onboarding screens remotely from the dashboard — no App Store reviews needed.

## Installation

```bash
npm install noboarding
# or
yarn add noboarding
```

**📚 Complete Setup Guides:**
- **[AI Setup](./SETUP_GUIDE.md#ai-setup)** - Copy/paste instructions for your AI coding assistant (Claude Code, Cursor, etc.)
- **[Manual Setup](./SETUP_GUIDE.md#normal-setup)** - Step-by-step instructions
- **[RevenueCat Integration](./REVENUECAT_SETUP.md)** - Detailed RevenueCat paywall guide
- **[AI Custom Screen Guide](./AI_CUSTOM_SCREEN_GUIDE.md)** - Complete guide for building custom screens with data flow (for AI assistants)

## Quick Start

```typescript
import { OnboardingFlow } from 'noboarding';

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

### Custom Screen (AI-generated)

Screens built with the composable primitive system. The `ElementRenderer` recursively maps a JSON element tree to native React Native components (`View`, `Text`, `Image`, `ScrollView`, `TextInput`, `TouchableOpacity`).

```typescript
// A custom screen in your config looks like:
{
  "id": "welcome",
  "type": "custom_screen",
  "props": {},
  "elements": [
    {
      "id": "root",
      "type": "vstack",
      "style": { "width": "100%", "height": "100%", "padding": 24 },
      "children": [
        { "id": "title", "type": "text", "props": { "text": "Welcome!" }, "style": { "fontSize": 32, "fontWeight": "700" } },
        { "id": "spacer", "type": "spacer" },
        {
          "id": "cta",
          "type": "hstack",
          "style": { "backgroundColor": "#000", "borderRadius": 12, "padding": 16, "justifyContent": "center" },
          "children": [
            { "id": "cta_text", "type": "text", "props": { "text": "Get Started" }, "style": { "color": "#fff", "fontSize": 16 } }
          ],
          "action": { "type": "navigate", "destination": "next" }
        }
      ]
    }
  ]
}
```

### Pre-built Components

- **WelcomeScreen** — Image + title + subtitle + CTA button
- **TextInput** — Form for collecting user data (name, email, etc.)
- **SocialLogin** — Apple/Google/Facebook authentication buttons

## Composable Primitives

The element tree uses these building blocks:

**Containers** (have `children` array):
- `vstack` — vertical flex column
- `hstack` — horizontal flex row
- `zstack` — layered/overlapping elements
- `scrollview` — scrollable container

**Content** (leaf elements with `props`):
- `text` — text content (`props.text`)
- `image` — image (`props.url`, `props.slotNumber`)
- `video` — video placeholder (`props.url`)
- `lottie` — Lottie animation (`props.url`)
- `icon` — emoji (`props.emoji`) or named icon (`props.name`, `props.library`)
- `input` — text field (`props.placeholder`, `props.type`)
- `spacer` — flexible empty space
- `divider` — horizontal line

## Actions

Any container can have an `action` to make it interactive:

```typescript
action: {
  type: 'tap' | 'navigate' | 'link' | 'toggle' | 'dismiss',
  destination?: string  // URL for link, screen ID for navigate
}
```

| Action | Behavior |
|--------|----------|
| `tap` | Generic tap handler |
| `navigate` | Go to `"next"`, `"previous"`, or a specific screen ID |
| `link` | Open URL via `Linking.openURL` |
| `toggle` | Toggle selected/unselected state (visual border change) |
| `dismiss` | Dismiss current screen or flow |

## Custom Screens (Developer-Registered Components)

For advanced use cases requiring native features (camera, payments, biometrics) or third-party SDKs, you can create custom React Native components and register them with the SDK.

### Creating a Custom Screen

1. **Create your component** with the required props:

```typescript
// screens/PaywallScreen.tsx
import React, { useEffect } from 'react';
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
  useEffect(() => {
    analytics.track('paywall_viewed', {
      screen_id: 'paywall',
    });
  }, []);

  const handlePurchase = () => {
    analytics.track('paywall_conversion', {
      package: 'premium_monthly',
    });

    onDataUpdate?.({
      premium: true,
      purchase_date: new Date().toISOString(),
    });

    onNext();
  };

  // Preview mode for dashboard
  if (preview) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 64 }}>💎</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginVertical: 20 }}>
          Paywall Preview
        </Text>
        <Text style={{ color: '#666', marginBottom: 20 }}>
          (Real paywall only works in app)
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
      <Button title="Subscribe - $9.99/month" onPress={handlePurchase} />
      {onSkip && (
        <Button title="Maybe Later" onPress={onSkip} color="#666" />
      )}
    </View>
  );
};
```

2. **Register the component** in your app:

```typescript
import { OnboardingFlow } from 'noboarding';
import { PaywallScreen } from './screens/PaywallScreen';

function App() {
  return (
    <OnboardingFlow
      apiKey="sk_live_your_api_key_here"
      customComponents={{
        PaywallScreen: PaywallScreen,  // Register here
      }}
      onComplete={(userData) => {
        console.log('User data:', userData);
        // userData includes data from custom screens
      }}
    />
  );
}
```

3. **Add to your flow** in the dashboard:
   - Click "Add Custom Screen"
   - Enter component name: `PaywallScreen`
   - Position in flow

### CustomScreenProps Interface

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

### RevenueCat Integration Example

Here's a complete example integrating RevenueCat paywalls:

```typescript
// screens/RevenueCatPaywall.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import type { CustomScreenProps } from 'noboarding';

export const RevenueCatPaywall: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  onSkip,
  preview,
  onDataUpdate,
}) => {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analytics.track('paywall_viewed');
    loadOffering();
  }, []);

  const loadOffering = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current);

      analytics.track('paywall_loaded', {
        offering_id: offerings.current?.identifier,
        packages_count: offerings.current?.availablePackages.length,
      });
    } catch (error: any) {
      analytics.track('paywall_error', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      analytics.track('paywall_purchase_started', { package: packageId });

      const pkg = offering?.availablePackages.find(p => p.identifier === packageId);
      if (!pkg) return;

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

      if (isPremium) {
        analytics.track('paywall_conversion', {
          package: packageId,
          price: pkg.product.priceString,
        });

        onDataUpdate?.({
          premium: true,
          package: packageId,
          purchase_timestamp: new Date().toISOString(),
        });

        Alert.alert('Welcome to Premium!', '', [
          { text: 'Continue', onPress: onNext }
        ]);
      }
    } catch (error: any) {
      const cancelled = error.userCancelled;

      analytics.track('paywall_purchase_failed', {
        package: packageId,
        cancelled,
      });

      if (!cancelled) {
        Alert.alert('Purchase Failed', 'Please try again.');
      }
    }
  };

  const handleSkip = () => {
    analytics.track('paywall_dismissed');
    onSkip?.() || onNext();
  };

  // Preview mode
  if (preview) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 64, marginBottom: 20 }}>💎</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          RevenueCat Paywall
        </Text>
        <Text style={{ color: '#999', marginTop: 8 }}>
          (Preview - real paywall in app)
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>
        Unlock Premium
      </Text>

      {offering?.availablePackages.map(pkg => (
        <TouchableOpacity
          key={pkg.identifier}
          onPress={() => handlePurchase(pkg.identifier)}
          style={{
            backgroundColor: '#007AFF',
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>
            {pkg.product.title} - {pkg.product.priceString}
          </Text>
        </TouchableOpacity>
      ))}

      <Button title="Maybe Later" onPress={handleSkip} color="#666" />
    </View>
  );
};
```

**Setup:**

1. Install RevenueCat:
```bash
npm install react-native-purchases
```

2. Configure RevenueCat in your app initialization:
```typescript
// App.tsx
import Purchases from 'react-native-purchases';

useEffect(() => {
  Purchases.configure({
    apiKey: Platform.OS === 'ios'
      ? 'appl_YOUR_KEY'
      : 'goog_YOUR_KEY',
  });
}, []);
```

3. Register and use in onboarding:
```typescript
<OnboardingFlow
  customComponents={{
    RevenueCatPaywall: RevenueCatPaywall,
  }}
/>
```

4. Set up webhooks (see below) to track conversions server-side

### Best Practices

- ✅ Always implement `preview` mode for dashboard compatibility
- ✅ Track key events with `analytics.track()`
- ✅ Use `onDataUpdate()` to save data from custom screens
- ✅ Handle errors gracefully with user-friendly messages
- ✅ Call `onNext()` when screen is complete

For more details, see [AI Custom Screen Guide](./AI_CUSTOM_SCREEN_GUIDE.md).

## API

### OnboardingFlow Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your API key from the dashboard |
| `onComplete` | `(data?) => void` | Yes | Called when user completes onboarding |
| `onSkip` | `() => void` | No | Called when user skips onboarding |
| `baseUrl` | `string` | No | Custom API base URL |
| `customComponents` | `Record<string, Component>` | No | Developer-registered custom screen components |
| `initialVariables` | `Record<string, any>` | No | Initial values for the variable store |
| `onUserIdGenerated` | `(userId: string) => void` | No | Called when SDK generates user ID (use to sync with RevenueCat, analytics, etc.) |

### ElementRenderer Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `elements` | `ElementNode[]` | Yes | The element tree to render |
| `analytics` | `AnalyticsManager` | Yes | Analytics manager for tracking |
| `screenId` | `string` | Yes | Current screen ID for analytics |
| `onNavigate` | `(destination: string) => void` | Yes | Navigation handler |
| `onDismiss` | `() => void` | Yes | Dismiss handler |

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
} from 'noboarding';

// Utilities
import { API, AnalyticsManager } from 'noboarding';
```

## Development

### Building the SDK

The TestApp imports the SDK from the compiled `lib/` directory (`"main": "lib/index.js"`), not from `src/` directly. After making any changes to files in `sdk/src/`, you must rebuild before testing:

```bash
cd sdk
npm run build
```

Then restart the TestApp. If you skip this step, the TestApp will still be running the old compiled code and your changes won't take effect.

### Dashboard Preview Integration

The dashboard uses **local copies** of SDK source files for the preview feature. When you modify SDK source files, they need to be synced to the dashboard.

**Why copies?** Next.js/Turbopack doesn't support importing from external directories with the react-native-web setup, so the dashboard maintains local copies in `dashboard/lib/sdk/`.

#### Files That Need Syncing

When you modify these SDK files:
- `src/types.ts` → Auto-synced to `dashboard/lib/sdk/types.ts`
- `src/variableUtils.ts` → Auto-synced to `dashboard/lib/sdk/variableUtils.ts`
- `src/components/ElementRenderer.tsx` → ⚠️ **NOT auto-synced** (dashboard has web-specific modifications)

**ElementRenderer Special Case:**

The dashboard copy of `ElementRenderer.tsx` has web-specific modifications for icon support:
- Uses `react-icons` instead of `@expo/vector-icons`
- Renders real icons in preview (Feather, Material, Ionicons, FontAwesome)
- Gradients fall back to solid colors

**If you modify ElementRenderer.tsx significantly:**
1. Run `npm run sync:full` from project root to copy it
2. Manually re-add web icon imports and logic (check git diff to see what changed)

#### Syncing Methods

**Manual sync (run when needed):**
```bash
# From project root
npm run sync
```

**Auto-sync during development:**
```bash
# From project root
npm run sync:watch
```

This watches SDK files and automatically copies changes to the dashboard when you save.

**Full development mode:**
```bash
# From project root - starts dashboard + auto-sync
npm run dev
```

This command:
1. Syncs SDK files to dashboard
2. Starts file watcher for auto-sync
3. Starts dashboard dev server

#### Important Notes

- ⚠️ **Dashboard preview uses copies** - Changes to SDK files won't appear in dashboard preview until synced
- ✅ **Mobile app uses npm package** - TestApp uses the built SDK from `lib/`, requires `npm run build`
- 🔄 **Keep in sync** - Run `npm run sync:watch` while developing SDK to keep dashboard preview accurate

## Requirements

- React Native >= 0.60.0
- React >= 16.8.0

## License

MIT
