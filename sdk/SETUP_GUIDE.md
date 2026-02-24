# Noboarding SDK - Complete Setup Guide

Choose your setup method:

- **[AI Setup](#ai-setup)** - Copy/paste instructions for your AI coding assistant
- **[Normal Setup](#normal-setup)** - Step-by-step manual instructions

---

## AI Setup

> **For developers using AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.)**

Copy the instructions below and paste them into your AI coding assistant to automatically set up Noboarding SDK with RevenueCat integration.

### Prerequisites Checklist

Before giving these instructions to your AI assistant, ensure you have:

- ✅ RevenueCat account already configured
- ✅ Products/subscriptions set up in RevenueCat
- ✅ RevenueCat API keys (iOS + Android)
- ✅ Noboarding account and API key
- ✅ React Native app project ready

---

### Instructions for AI Assistant

**Copy everything below this line and paste it to your AI coding assistant:**

---

```
I need you to integrate the Noboarding SDK into my React Native app with RevenueCat paywall support. Here are the requirements:

## Context
- I already have RevenueCat configured in my app with API keys
- I have a Noboarding account with API key: [PASTE_YOUR_NOBOARDING_API_KEY_HERE]
- My RevenueCat iOS key: [PASTE_YOUR_IOS_KEY_HERE]
- My RevenueCat Android key: [PASTE_YOUR_ANDROID_KEY_HERE]

## Task 1: Install Noboarding SDK

1. Install the Noboarding SDK package:
   ```bash
   npm install noboarding
   # or
   yarn add noboarding
   ```

2. Install peer dependencies if not already installed:
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

## Task 2: Create RevenueCat Paywall Screen

Create a new file at `src/screens/PaywallScreen.tsx` with the following implementation:

Requirements for the PaywallScreen component:
- Import CustomScreenProps from 'noboarding'
- Import necessary RevenueCat types (PurchasesOffering, PurchasesPackage)
- Use analytics.track() for these events:
  - paywall_viewed (on mount)
  - paywall_loaded (when offerings load)
  - paywall_purchase_started
  - paywall_conversion (on successful purchase)
  - paywall_purchase_failed
  - paywall_dismissed (when user skips)
- Implement preview mode that shows a placeholder UI when preview={true}
- Load offerings from RevenueCat using Purchases.getOfferings()
- Handle purchase with Purchases.purchasePackage()
- Check for premium entitlement after purchase
- Call onDataUpdate() with purchase info on successful purchase
- Call onNext() to continue after purchase
- Call onSkip() or onNext() when user dismisses

The component should:
- Show loading state while fetching offerings
- Display all available packages from the current offering
- Show package title, price, and any intro pricing
- Have a "Restore Purchases" button
- Have a skip/dismiss button (conditionally shown if onSkip is provided)
- Use Alert.alert() to show success/error messages
- Style it nicely with a modern, clean UI

## Task 3: Integrate SDK in App.tsx

Update the main App.tsx file:

1. Import OnboardingFlow from 'noboarding'
2. Import the PaywallScreen component
3. Import Purchases from 'react-native-purchases'
4. Add state to manage onboarding visibility: useState(true)
5. In useEffect, configure RevenueCat with the API keys I provided above
6. Render OnboardingFlow component with:
   - apiKey prop set to my Noboarding API key
   - customComponents={{ PaywallScreen: PaywallScreen }}
   - onUserIdGenerated callback that calls Purchases.logIn(userId) - CRITICAL for attribution
   - onComplete callback that logs userData and hides onboarding
   - onSkip callback (optional)
7. Show main app content when onboarding is complete

## Task 4: Configure RevenueCat Webhook

After you complete the code changes, provide me with instructions to configure the RevenueCat webhook. The webhook should point to:

**Webhook URL:** https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1/revenuecat-webhook
**Authorization Header:** Bearer c3373PFzv9wPpISOu5XFz22zABeLjpzYwGqmclXR60o=

Tell me:
1. Where to find the webhook settings in RevenueCat dashboard
2. Which events to select (minimum: INITIAL_PURCHASE, RENEWAL, CANCELLATION)
3. How to test the webhook

## Task 5: Usage Instructions

After completing the integration, provide me with:
1. How to add the PaywallScreen to my onboarding flow in the Noboarding dashboard
2. How to test the integration locally
3. What analytics events I can expect to see
4. How conversions will be tracked

## Important Notes
- Use TypeScript for all files
- Follow React Native best practices
- Add proper error handling
- Include loading states
- Make the UI accessible
- Add comments explaining critical parts (especially the onUserIdGenerated callback)

Please implement all of this and let me know when you're done. If you need any clarification on my existing code structure, ask me first before making assumptions.
```

---

**After your AI assistant completes the setup:**

1. **Add PaywallScreen to Dashboard:**
   - Log in to your Noboarding dashboard
   - Go to your onboarding flow
   - Click "Add Custom Screen"
   - Enter component name: `PaywallScreen`
   - Position it in your flow
   - Save and publish

2. **Configure RevenueCat Webhook:**
   - Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
   - Navigate to: Integrations → Webhooks
   - Click "Add New Webhook"
   - URL: `https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization: `Bearer c3373PFzv9wPpISOu5XFz22zABeLjpzYwGqmclXR60o=`
   - Events: Select INITIAL_PURCHASE, RENEWAL, CANCELLATION
   - Save and test

3. **Test Your Integration:**
   ```bash
   npm start
   # Test in development with sandbox purchases
   ```

4. **Deploy to Production:**
   - Build your app
   - Submit to App Store / Google Play
   - After approval, publish your onboarding flow in the dashboard

---

## Normal Setup

> **For developers who prefer step-by-step manual instructions**

### Table of Contents

1. [Installation](#installation)
2. [Basic Integration](#basic-integration)
3. [RevenueCat Paywall Integration](#revenuecat-paywall-integration)
4. [Webhook Configuration](#webhook-configuration)
5. [Dashboard Setup](#dashboard-setup)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

### Installation

Install the Noboarding SDK:

```bash
npm install noboarding
# or
yarn add noboarding
```

Install peer dependencies:

```bash
npm install @react-native-async-storage/async-storage
```

For RevenueCat integration, also install:

```bash
npm install react-native-purchases
```

**iOS Setup:**
```bash
cd ios && pod install
```

---

### Basic Integration

#### Step 1: Import and Configure

In your `App.tsx`:

```typescript
import React, { useState } from 'react';
import { OnboardingFlow } from 'noboarding';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <OnboardingFlow
        apiKey="sk_live_your_api_key_here"
        onComplete={(userData) => {
          console.log('Onboarding complete:', userData);
          setShowOnboarding(false);
        }}
        onSkip={() => {
          setShowOnboarding(false);
        }}
      />
    );
  }

  return <YourMainApp />;
}
```

#### Step 2: Get Your API Key

1. Log in to your [Noboarding Dashboard](https://dashboard.noboarding.com)
2. Go to Settings → API Keys
3. Copy your API key (starts with `sk_live_`)
4. Replace `sk_live_your_api_key_here` in the code above

---

### RevenueCat Paywall Integration

#### Step 1: Configure RevenueCat

In your `App.tsx`, initialize RevenueCat:

```typescript
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export default function App() {
  useEffect(() => {
    // Configure RevenueCat with your API keys
    Purchases.configure({
      apiKey: Platform.OS === 'ios'
        ? 'appl_YOUR_IOS_KEY'
        : 'goog_YOUR_ANDROID_KEY',
    });
  }, []);

  // Rest of your app...
}
```

**Where to find RevenueCat API keys:**
- Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
- Select your project
- Go to Settings → API Keys
- Copy iOS and Android keys

#### Step 2: Create Paywall Screen Component

Create a new file `src/screens/PaywallScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import type { CustomScreenProps } from 'noboarding';

export const PaywallScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  onSkip,
  preview,
  onDataUpdate,
}) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

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

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setPurchasing(true);

      analytics.track('paywall_purchase_started', {
        package_id: pkg.identifier,
      });

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

      if (isPremium) {
        analytics.track('paywall_conversion', {
          package_id: pkg.identifier,
          price: pkg.product.priceString,
        });

        onDataUpdate?.({
          premium: true,
          package_id: pkg.identifier,
          purchase_timestamp: new Date().toISOString(),
        });

        Alert.alert('Welcome to Premium!', '', [
          { text: 'Continue', onPress: onNext }
        ]);
      }
    } catch (error: any) {
      const cancelled = error.userCancelled;

      analytics.track('paywall_purchase_failed', {
        package_id: pkg.identifier,
        cancelled,
      });

      if (!cancelled) {
        Alert.alert('Purchase Failed', 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleSkip = () => {
    analytics.track('paywall_dismissed');
    onSkip?.() || onNext();
  };

  const handleRestorePurchases = async () => {
    try {
      setPurchasing(true);
      const { customerInfo } = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

      if (isPremium) {
        Alert.alert('Purchases Restored', 'Your premium access has been restored!', [
          { text: 'Continue', onPress: onNext }
        ]);
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  // PREVIEW MODE (for dashboard)
  if (preview) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewEmoji}>💎</Text>
        <Text style={styles.previewTitle}>Paywall Preview</Text>
        <Text style={styles.previewNote}>(Real paywall in app)</Text>
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock Premium</Text>
      <Text style={styles.subtitle}>Get full access to all features</Text>

      {offering?.availablePackages.map((pkg) => (
        <TouchableOpacity
          key={pkg.identifier}
          style={styles.packageCard}
          onPress={() => handlePurchase(pkg)}
          disabled={purchasing}
        >
          <Text style={styles.packageTitle}>
            {pkg.product.title?.replace(/\(.*?\)/, '').trim()}
          </Text>
          <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
        </TouchableOpacity>
      ))}

      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.purchasingText}>Processing...</Text>
        </View>
      )}

      <TouchableOpacity onPress={handleRestorePurchases} style={styles.restoreButton}>
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Maybe Later</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  previewEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewNote: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  packageCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 16,
    color: '#007AFF',
  },
  skipButton: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  purchasingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
});
```

#### Step 3: Register Paywall Screen

Update your `App.tsx` to register the custom screen:

```typescript
import { OnboardingFlow } from 'noboarding';
import Purchases from 'react-native-purchases';
import { PaywallScreen } from './src/screens/PaywallScreen';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Configure RevenueCat
    Purchases.configure({
      apiKey: Platform.OS === 'ios'
        ? 'appl_YOUR_IOS_KEY'
        : 'goog_YOUR_ANDROID_KEY',
    });
  }, []);

  if (showOnboarding) {
    return (
      <OnboardingFlow
        apiKey="sk_live_your_api_key"
        customComponents={{
          PaywallScreen: PaywallScreen,  // Register custom screen
        }}
        // CRITICAL: Sync user ID with RevenueCat for proper attribution
        onUserIdGenerated={(userId) => {
          Purchases.logIn(userId);
        }}
        onComplete={(userData) => {
          console.log('Onboarding complete:', userData);
          // userData.premium will be true if they purchased
          setShowOnboarding(false);
        }}
      />
    );
  }

  return <YourMainApp />;
}
```

**⚠️ Critical: User ID Sync**

The `onUserIdGenerated` callback is **essential** for tracking conversions:
- The SDK generates a unique user ID for analytics
- You must use the **same ID** in RevenueCat
- This allows the webhook to attribute purchases to onboarding sessions
- Without this, A/B test conversion metrics won't work

---

### Webhook Configuration

#### Step 1: Configure RevenueCat Webhook

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Navigate to **Integrations → Webhooks**
3. Click **"Add New Webhook"**
4. Enter the following:

   **Webhook URL:**
   ```
   https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1/revenuecat-webhook
   ```

   **Authorization Header:**
   ```
   Bearer c3373PFzv9wPpISOu5XFz22zABeLjpzYwGqmclXR60o=
   ```

5. Select events to send (minimum):
   - ✅ INITIAL_PURCHASE
   - ✅ RENEWAL
   - ✅ CANCELLATION
   - ✅ BILLING_ISSUE (optional but recommended)

6. Click **"Save"**

#### Step 2: Test the Webhook

RevenueCat provides a test button. Click it to verify the webhook is working.

You can also test manually:

```bash
curl -X POST https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1/revenuecat-webhook \
  -H "Authorization: Bearer c3373PFzv9wPpISOu5XFz22zABeLjpzYwGqmclXR60o=" \
  -H "Content-Type: application/json" \
  -d '{
    "api_version":"1.0",
    "event":{
      "id":"test_123",
      "type":"TEST",
      "app_user_id":"test_user",
      "product_id":"test",
      "transaction_id":"txn_123",
      "original_transaction_id":"txn_123",
      "purchased_at_ms":1707584400000,
      "is_family_share":false,
      "country_code":"US",
      "store":"APP_STORE",
      "environment":"SANDBOX"
    }
  }'
```

Expected response: `{"success":true}`

---

### Dashboard Setup

#### Step 1: Add Custom Screen to Flow

1. Log in to your [Noboarding Dashboard](https://dashboard.noboarding.com)
2. Go to **Flows** and select or create a flow
3. Click **"Add Custom Screen"**
4. Enter:
   - **Component Name:** `PaywallScreen` (must match exactly)
   - **Description:** "Premium subscription paywall"
5. **Drag to position** the screen where you want it in the flow
6. Click **"Save Draft"**

**Example flow order:**
```
1. Welcome Screen (SDK)
2. Feature Tour (SDK)
3. PaywallScreen (Custom)  ← Your paywall
4. Setup Complete (SDK)
```

#### Step 2: Publish Flow

**Important:** Only publish after your app with the custom screen is live in app stores.

1. Review your flow
2. Click **"Publish"**
3. Users will now see the paywall in their onboarding

---

### Testing

#### Local Testing (Development)

1. **Start your app:**
   ```bash
   npm start
   # or
   yarn start
   ```

2. **Use sandbox mode:**
   - iOS: Use a sandbox Apple ID for testing
   - Android: Use a test Google Play account

3. **Test the flow:**
   - Complete onboarding
   - Navigate to paywall screen
   - Make a test purchase
   - Verify analytics events in dashboard

#### Verify Analytics

Check your Noboarding dashboard for these events:
- ✅ `paywall_viewed`
- ✅ `paywall_loaded`
- ✅ `paywall_purchase_started`
- ✅ `paywall_conversion`
- ✅ `onboarding_completed`

#### Check Revenue Tracking

Go to **Analytics → Paywall Performance** to see:
- Paywall views
- Conversions
- Conversion rate
- Total revenue

---

### Deployment

#### Step 1: Build Your App

**iOS:**
```bash
cd ios
pod install
cd ..
npx react-native run-ios --configuration Release
```

**Android:**
```bash
npx react-native run-android --variant=release
```

#### Step 2: Submit to App Stores

1. Build production app bundle
2. Submit to App Store Connect / Google Play Console
3. Wait for review and approval (typically 1-3 days)

#### Step 3: Publish Onboarding Flow

**After your app is approved and live:**

1. Go to your Noboarding dashboard
2. Click **"Publish"** on your flow
3. Users downloading the new version will see the paywall

---

### Analytics & A/B Testing

Once deployed, you can:

#### Track Conversion Metrics
- View paywall conversion rates
- See revenue by variant
- Compare different paywall placements
- Analyze drop-off points

#### Run A/B Tests
1. Create multiple variants with different paywall positions
2. Set traffic allocation
3. Select primary metric: `paywall_conversion`
4. Run experiment
5. View results in dashboard

**Example A/B test:**
- **Variant A:** Paywall after welcome screen
- **Variant B:** Paywall after feature tour
- **Metric:** Conversion rate + Revenue per user

---

### Troubleshooting

#### Paywall Not Showing

**Check:**
- Component registered: `customComponents={{ PaywallScreen }}`
- Name matches exactly (case-sensitive)
- App includes the custom screen code
- Dashboard flow is published

**Debug:**
```typescript
console.log('Registered components:', Object.keys(customComponents));
```

#### No Conversions Tracked

**Check:**
- User ID synced with RevenueCat via `onUserIdGenerated`
- Webhook configured correctly in RevenueCat
- Authorization header is correct
- Events selected in RevenueCat webhook settings

**Debug:**
```sql
-- Check analytics events
SELECT * FROM analytics_events
WHERE user_id = 'your_user_id'
ORDER BY timestamp DESC;

-- Check RevenueCat events
SELECT * FROM revenuecat_events
WHERE app_user_id = 'your_user_id'
ORDER BY purchased_at DESC;
```

#### Revenue Not Showing

**Check:**
- `price` and `currency` in webhook payload
- Event type is `INITIAL_PURCHASE`
- Migration created `revenuecat_events` table

---

### Next Steps

- 📖 Read [Custom Screens Guide](./cusomte_screens.md) for advanced customization
- 🎨 Customize your paywall UI
- 📊 Set up A/B tests in dashboard
- 💡 Experiment with paywall placement and messaging

**Need Help?**
- Documentation: https://docs.noboarding.com
- Support: support@noboarding.com
- Community: [Discord](#)

---

**Happy building! 🚀**
