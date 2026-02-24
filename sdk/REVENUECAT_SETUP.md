# RevenueCat Integration Guide

Complete guide to integrating RevenueCat paywalls with Noboarding for seamless paywall analytics and A/B testing.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Install RevenueCat SDK](#step-1-install-revenuecat-sdk)
4. [Step 2: Create Custom Paywall Screen](#step-2-create-custom-paywall-screen)
5. [Step 3: Register Custom Screen](#step-3-register-custom-screen)
6. [Step 4: Configure Webhooks](#step-4-configure-webhooks)
7. [Step 5: Add to Dashboard Flow](#step-5-add-to-dashboard-flow)
8. [Step 6: Test & Deploy](#step-6-test--deploy)
9. [Analytics & Metrics](#analytics--metrics)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This integration allows you to:
- 🎯 **A/B test paywall placement** in your onboarding flow
- 📊 **Track conversion rates** automatically
- 💰 **Measure revenue** attributed to onboarding sessions
- 🔄 **Update flows remotely** without app updates

**Architecture:**
```
Mobile App (Custom Screen)
    ↓ (presents paywall)
RevenueCat SDK
    ↓ (purchase event)
RevenueCat Backend
    ↓ (webhook)
Supabase Edge Function
    ↓ (stores & attributes)
Dashboard Analytics
```

---

## Prerequisites

Before starting, ensure you have:
- ✅ RevenueCat account ([sign up](https://www.revenuecat.com/))
- ✅ Products configured in App Store Connect / Google Play Console
- ✅ Products configured in RevenueCat dashboard
- ✅ Noboarding SDK installed and configured
- ✅ Supabase project set up

---

## Step 1: Install RevenueCat SDK

### Install the package

```bash
npm install react-native-purchases
# or
yarn add react-native-purchases
```

### iOS Setup

Add to your `Podfile`:
```ruby
pod 'RevenueCat'
```

Then run:
```bash
cd ios && pod install
```

### Android Setup

No additional setup needed for Android.

### Initialize RevenueCat

In your app's root component (usually `App.tsx`):

```typescript
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export default function App() {
  useEffect(() => {
    // Configure RevenueCat
    Purchases.configure({
      apiKey: Platform.OS === 'ios'
        ? 'appl_YOUR_IOS_KEY'  // Get from RevenueCat dashboard
        : 'goog_YOUR_ANDROID_KEY',
    });
  }, []);

  // Rest of your app...
}
```

**Where to find API keys:**
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Select your project
3. Go to Settings → API Keys
4. Copy iOS and Android keys

### ⚠️ Critical: Sync User IDs

**IMPORTANT**: You must use the **same user ID** in both Noboarding SDK and RevenueCat for proper attribution.

The Noboarding SDK auto-generates a user ID for analytics. Use the `onUserIdGenerated` callback to sync it with RevenueCat:

```typescript
import { OnboardingFlow } from 'noboarding';
import Purchases from 'react-native-purchases';
import { PaywallScreen } from './screens/PaywallScreen';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <OnboardingFlow
        apiKey="sk_live_your_api_key"
        customComponents={{
          PaywallScreen: PaywallScreen,
        }}
        // CRITICAL: Sync user ID with RevenueCat
        onUserIdGenerated={(userId) => {
          console.log('SDK User ID:', userId);
          // Use the SAME ID in RevenueCat
          Purchases.logIn(userId);
        }}
        onComplete={(userData) => {
          console.log('Onboarding complete:', userData);
          setShowOnboarding(false);
        }}
      />
    );
  }

  return <YourMainApp />;
}
```

**Why this matters:**
- When a user purchases, RevenueCat sends `app_user_id` in the webhook
- Your backend looks up analytics events by `user_id`
- If the IDs don't match, conversions can't be attributed to onboarding sessions
- A/B test metrics will be incomplete

---

## Step 2: Create Custom Paywall Screen

Create a new file `screens/PaywallScreen.tsx`:

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
  skipButton: {
    marginTop: 16,
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

---

## Step 3: Register Custom Screen

In your app's `App.tsx`, register the paywall screen:

```typescript
import { OnboardingFlow } from 'noboarding';
import { PaywallScreen } from './screens/PaywallScreen';
import Purchases from 'react-native-purchases';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <OnboardingFlow
        apiKey="sk_live_your_api_key"
        customComponents={{
          PaywallScreen: PaywallScreen,  // Register here
        }}
        // CRITICAL: Sync user ID with RevenueCat
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

---

## Step 4: Configure Webhooks

### 4.1 Deploy Supabase Migration

Run the migration to create the `revenuecat_events` table:

```bash
cd supabase
supabase db push
```

This creates the table defined in `migrations/20260219100000_add_revenuecat_events.sql`.

### 4.2 Deploy Edge Function

Deploy the webhook handler:

```bash
supabase functions deploy revenuecat-webhook
```

### 4.3 Set Webhook Secret

```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET=your_random_secret_here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 4.4 Configure RevenueCat Webhook

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Navigate to **Integrations → Webhooks**
3. Click **Add New Webhook**
4. Configure:
   - **URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/revenuecat-webhook`
   - **Authorization Header:** `Bearer your_random_secret_here`
   - **Events to send:** Select at minimum:
     - ✅ INITIAL_PURCHASE
     - ✅ RENEWAL
     - ✅ CANCELLATION
     - ✅ BILLING_ISSUE
5. Click **Save**

### 4.5 Test Webhook

RevenueCat provides a test button. Click it to send a test event. Check your Supabase logs:

```bash
supabase functions logs revenuecat-webhook --tail
```

You should see:
```
Received RevenueCat event: { type: 'TEST', app_user_id: '...', ... }
```

---

## Step 5: Add to Dashboard Flow

1. **Log into your dashboard**
2. **Go to Flows** and select or create a flow
3. **Click "Add Custom Screen"**
4. **Enter details:**
   - **Component Name:** `PaywallScreen` (must match exactly)
   - **Description:** "Premium subscription paywall"
5. **Position the screen** where you want it in the flow
6. **Save Draft**

**Example flow:**
```
1. Welcome Screen (SDK)
2. Feature Tour (SDK)
3. PaywallScreen (Custom)  ← Your paywall
4. Setup Complete (SDK)
```

---

## Step 6: Test & Deploy

### Local Testing

1. **Test in your app:**
```bash
npm start
# or
yarn start
```

2. **Navigate to paywall screen**
3. **Use RevenueCat sandbox mode** for testing:
   - iOS: Use sandbox Apple ID
   - Android: Use test Google account

### Production Deployment

1. **Build your app:**
```bash
# iOS
npx react-native run-ios --configuration Release

# Android
npx react-native run-android --variant=release
```

2. **Submit to app stores**
3. **Wait for approval** (1-3 days typically)
4. **Publish your flow** in the dashboard after app is live

---

## Analytics & Metrics

Once configured, you'll automatically track:

### Client-Side Events (from SDK)
- `paywall_viewed` - User saw the paywall
- `paywall_loaded` - Offerings loaded successfully
- `paywall_purchase_started` - User tapped purchase
- `paywall_conversion` - Purchase completed
- `paywall_purchase_failed` - Purchase failed
- `paywall_dismissed` - User skipped paywall

### Server-Side Events (from webhook)
- `paywall_conversion` - Verified purchase from RevenueCat
- Includes: `product_id`, `price`, `currency`, `transaction_id`

### Dashboard Metrics

**Analytics Page:**
- 💎 Paywall Views
- 💳 Conversions
- 📊 Conversion Rate
- 💰 Total Revenue

**A/B Tests:**
- Compare paywall placement
- Test different offerings
- Measure impact on conversion

### Example Query

Get conversion rate by variant:

```sql
SELECT
  variant_id,
  COUNT(DISTINCT CASE WHEN event_name = 'paywall_viewed' THEN user_id END) as views,
  COUNT(DISTINCT CASE WHEN event_name = 'paywall_conversion' THEN user_id END) as conversions,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_name = 'paywall_conversion' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_name = 'paywall_viewed' THEN user_id END), 0),
    2
  ) as conversion_rate
FROM analytics_events
WHERE experiment_id = 'your_experiment_id'
GROUP BY variant_id;
```

---

## Troubleshooting

### Paywall not showing

**Check:**
1. Component is registered in `customComponents`
2. Name matches exactly (case-sensitive): `PaywallScreen`
3. App version includes the custom screen
4. Dashboard flow is published

**Debug:**
```typescript
customComponents={{
  PaywallScreen: PaywallScreen,
}}

console.log('Registered:', Object.keys(customComponents));
```

### No products available

**Check:**
1. Products configured in App Store Connect / Google Play
2. Products added to RevenueCat dashboard
3. Products added to an offering
4. Using correct entitlement ID

**Debug:**
```typescript
const offerings = await Purchases.getOfferings();
console.log('Current offering:', offerings.current);
console.log('Packages:', offerings.current?.availablePackages);
```

### Webhook not receiving events

**Check:**
1. URL is correct: `https://YOUR_PROJECT.supabase.co/functions/v1/revenuecat-webhook`
2. Authorization header is set
3. Events are selected in RevenueCat
4. Function is deployed: `supabase functions list`

**Debug:**
```bash
# View function logs
supabase functions logs revenuecat-webhook --tail

# Test webhook manually
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/revenuecat-webhook \
  -H "Authorization: Bearer your_secret" \
  -H "Content-Type: application/json" \
  -d '{"api_version":"1.0","event":{"id":"test","type":"TEST","app_user_id":"test_user","product_id":"test"}}'
```

### Conversions not attributed to sessions

**Check:**
1. `app_user_id` in RevenueCat matches `user_id` in analytics events
2. Purchase happens within 24 hours of onboarding session
3. Webhook secret is correct

**Debug:**
```sql
-- Check if user has analytics events
SELECT * FROM analytics_events
WHERE user_id = 'your_app_user_id'
ORDER BY timestamp DESC;

-- Check if purchase was recorded
SELECT * FROM revenuecat_events
WHERE app_user_id = 'your_app_user_id'
ORDER BY purchased_at DESC;
```

### Revenue not showing

**Check:**
1. `price` and `currency` fields are present in webhook payload
2. Event type is `INITIAL_PURCHASE`
3. Migration created `revenuecat_events` table

**Debug:**
```sql
-- Check raw webhook data
SELECT
  event_type,
  product_id,
  price,
  currency,
  raw_payload
FROM revenuecat_events
ORDER BY purchased_at DESC
LIMIT 10;
```

---

## Best Practices

### 1. Set User IDs Consistently

Ensure the same user ID is used for both:
- RevenueCat: `Purchases.logIn(userId)`
- Noboarding analytics: Automatically uses device ID

### 2. Handle Edge Cases

- Network failures
- Purchase cancellations
- Restore purchases flow
- Family sharing

### 3. Test Thoroughly

- Test sandbox purchases
- Test webhook delivery
- Test analytics attribution
- Test A/B experiments

### 4. Monitor Performance

- Track conversion rates
- Monitor drop-off points
- A/B test paywall placement
- Measure revenue impact

---

## Next Steps

- 📖 Read the [Custom Screens Guide](./cusomte_screens.md)
- 🎨 Customize your paywall UI
- 📊 Set up A/B tests in the dashboard
- 💡 Experiment with paywall placement

**Need help?**
- RevenueCat Docs: https://www.revenuecat.com/docs
- Noboarding Support: support@noboarding.com
- Discord Community: [Join here](#)

---

**Happy building! 🚀**
