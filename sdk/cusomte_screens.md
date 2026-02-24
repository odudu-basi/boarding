# Custom Screens - Complete Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [How Custom Screens Work](#how-custom-screens-work)
3. [Quick Start](#quick-start)
4. [Component API Reference](#component-api-reference)
5. [Preview Mode](#preview-mode)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Version Management](#version-management)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Topics](#advanced-topics)

---

## Overview

Custom screens let you integrate your own React Native components into onboarding flows managed by our platform. You get complete control over complex features while still benefiting from our analytics, A/B testing, and flow management.

### When to Use Custom Screens

**✅ Perfect for:**
- Native device features (camera, biometrics, location, Face ID)
- Third-party SDK integrations (Stripe, Plaid, Auth0)
- Complex business logic unique to your app
- Existing screens you want to keep (gradual migration)
- Features requiring real-time API calls
- Advanced animations or custom interactions

**❌ Not recommended for:**
- Simple text and images (use SDK Text/Image components instead)
- Basic forms (use SDK TextInput component)
- Standard authentication (use SDK SocialLogin component)
- Features that can be built with SDK components

### Key Benefits

- ✅ **Full control** - Write any React Native code you want
- ✅ **Native access** - Use camera, location, biometrics, etc.
- ✅ **Your APIs** - Call your own backend services
- ✅ **Analytics included** - Automatic tracking of views, completions, drop-offs
- ✅ **A/B testable** - Test different positions in flow
- ✅ **No MAU charges** - Custom screens don't count toward your usage limits

---

## How Custom Screens Work

### Architecture

Custom screens are React Native components that **live in your app code**, not on our servers. The platform simply tells the SDK when to render them.
```
┌─────────────────────────┐         ┌──────────────────────┐
│   Your App (Local)      │         │  Platform (Remote)   │
├─────────────────────────┤         ├──────────────────────┤
│                         │         │                      │
│  MealTrackerScreen.tsx  │  ←───→  │  Dashboard Config:   │
│  - Component code       │         │  {                   │
│  - UI rendering         │         │   "type": "custom",  │
│  - API calls            │         │   "name": "Meal..."  │
│  - Business logic       │         │  }                   │
│                         │         │                      │
└─────────────────────────┘         └──────────────────────┘
```

**At runtime:**
```
User starts onboarding
  ↓
SDK fetches config from platform
  ↓
Config says: "Screen 3 = custom: MealTrackerScreen"
  ↓
SDK looks for MealTrackerScreen in customComponents
  ↓
SDK renders YOUR component
  ↓
Your component executes (calls your APIs, handles logic)
  ↓
User completes screen
  ↓
SDK continues to next screen
```

---

### What's Remotely Editable vs. What Requires App Updates

| Action | Requires App Update? | Update Time |
|--------|---------------------|-------------|
| **Reorder custom screen in flow** | ❌ No | Instant |
| **Remove custom screen from flow** | ❌ No | Instant |
| **Show/hide custom screen conditionally** | ❌ No | Instant |
| **Change SDK component properties** | ❌ No | Instant |
| **Edit custom screen code/UI** | ✅ Yes | 1-3 days (App Store review) |
| **Add new custom screen** | ✅ Yes | 1-3 days (App Store review) |
| **Fix bugs in custom screen** | ✅ Yes | 1-3 days (App Store review) |

**Example:**
```json
// ✅ This can change instantly (no app update):
{
  "screens": [
    {"type": "welcome_screen"},
    {"type": "custom", "name": "MealTrackerScreen"},  // ← Can reorder
    {"type": "goal_selector"}
  ],
  "conditions": {
    "show_meal_tracker": {
      "if": {"variable": "wants_nutrition", "equals": true}  // ← Can change
    }
  }
}
```
```typescript
// ❌ This requires App Store submission:
export const MealTrackerScreen = () => {
  // ANY changes to this code require app update
  const [calories, setCalories] = useState(null);
  
  return (
    <View>
      <Camera />  // ← Can't change this remotely
      <Text>Calories: {calories}</Text>  // ← Can't change this remotely
    </View>
  );
};
```

---

## Quick Start

### Step 1: Create the Component

Create your custom screen file:
```typescript
// screens/MealTrackerScreen.tsx

import React, { useState, useRef } from 'react';
import { View, Text, Button, Image, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';

export const MealTrackerScreen = ({ 
  analytics,    // Track events
  onNext,       // Go to next screen
  onSkip,       // Skip this screen (optional)
  preview,      // True when in dashboard preview
  data,         // Previously collected user data (optional)
  onDataUpdate  // Update collected data (optional)
}) => {
  const [photo, setPhoto] = useState(null);
  const [calories, setCalories] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);
  
  // Track screen view on mount
  React.useEffect(() => {
    analytics.track('screen_viewed', {
      screen_id: 'meal_tracker',
      screen_type: 'custom'
    });
  }, []);
  
  // Handle photo capture
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    analytics.track('photo_taken');
    
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
      base64: true
    });
    
    setPhoto(photo);
    await analyzePhoto(photo);
  };
  
  // Analyze photo with YOUR API
  const analyzePhoto = async (photo) => {
    setLoading(true);
    analytics.track('analysis_started');
    
    try {
      const response = await fetch('https://your-backend.com/api/analyze-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_API_KEY}`
        },
        body: JSON.stringify({
          image: photo.base64,
          userId: data?.userId // Use collected data if needed
        })
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const result = await response.json();
      setCalories(result.calories);
      
      // Update collected data
      onDataUpdate?.({
        meal_calories: result.calories,
        meal_timestamp: new Date().toISOString()
      });
      
      analytics.track('analysis_completed', {
        calories: result.calories
      });
    } catch (error) {
      analytics.track('analysis_failed', {
        error: error.message
      });
      alert('Failed to analyze meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle continue
  const handleContinue = () => {
    analytics.track('screen_completed', {
      calories: calories
    });
    onNext();
  };
  
  // PREVIEW MODE (for dashboard)
  if (preview) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <View style={{
          width: 300,
          height: 300,
          backgroundColor: '#f5f5f5',
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <Text style={{ fontSize: 64 }}>📸</Text>
          <Text style={{ marginTop: 12, fontSize: 16, color: '#666' }}>
            Camera Preview
          </Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            (Only works in real app)
          </Text>
        </View>
        
        <View style={{
          padding: 16,
          backgroundColor: '#fff',
          borderRadius: 12,
          width: '100%',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#e0e0e0'
        }}>
          <Text style={{ fontSize: 20, fontWeight: '600' }}>
            Estimated Calories: 450
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
            Mock data for preview
          </Text>
        </View>
        
        <Button title="Continue" onPress={onNext} />
      </View>
    );
  }
  
  // REAL IMPLEMENTATION
  
  // Before taking photo
  if (!photo) {
    return (
      <View style={{ flex: 1 }}>
        <Camera 
          ref={cameraRef} 
          style={{ flex: 1 }}
          type={Camera.Constants.Type.back}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'flex-end',
            padding: 20
          }}>
            <Button title="Take Photo" onPress={takePicture} />
            {onSkip && (
              <Button title="Skip" onPress={onSkip} color="#666" />
            )}
          </View>
        </Camera>
      </View>
    );
  }
  
  // After taking photo
  return (
    <View style={{ flex: 1, padding: 20, alignItems: 'center' }}>
      <Image 
        source={{ uri: photo.uri }} 
        style={{ width: 300, height: 300, borderRadius: 16 }}
      />
      
      {loading ? (
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={{ marginTop: 12, fontSize: 16 }}>
            Analyzing your meal...
          </Text>
        </View>
      ) : calories ? (
        <View style={{ marginTop: 32, alignItems: 'center', width: '100%' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold' }}>
            Estimated Calories: {calories}
          </Text>
          <View style={{ marginTop: 24, width: '100%', gap: 12 }}>
            <Button title="Continue" onPress={handleContinue} />
            <Button 
              title="Retake Photo" 
              onPress={() => setPhoto(null)} 
              color="#666"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};
```

---

### Step 2: Register the Component

Register your custom screen with the SDK:
```typescript
// App.tsx

import React, { useState } from 'react';
import { OnboardingFlow } from '@yourplatform/sdk';
import { MealTrackerScreen } from './screens/MealTrackerScreen';
import { WorkoutLogScreen } from './screens/WorkoutLogScreen';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  
  if (showOnboarding) {
    return (
      <OnboardingFlow
        apiKey="sk_live_abc123..."
        
        // Register custom screens here
        customComponents={{
          MealTrackerScreen: MealTrackerScreen,
          WorkoutLogScreen: WorkoutLogScreen,
          // Add more custom screens as needed
        }}
        
        onComplete={(userData) => {
          // userData contains both SDK and custom screen data
          console.log('Onboarding completed:', userData);
          
          // Save to your database
          await saveUserProfile(userData);
          
          // Hide onboarding
          setShowOnboarding(false);
        }}
        
        onSkip={() => {
          setShowOnboarding(false);
        }}
      />
    );
  }
  
  return <MainApp />;
}
```

---

### Step 3: Add to Dashboard Flow

1. **Go to Flow Builder** in the dashboard
2. **Click "🛠️ Add Custom Screen"**
3. **Enter details:**
   - **Component Name:** `MealTrackerScreen` (must match exactly)
   - **Description:** "Takes photo of meal and estimates calories"
   - **Minimum App Version (optional):** `1.1.0`
4. **Position the screen** in your flow by dragging
5. **Click "Save Draft"**

**Dashboard will show:**
```
┌────────────────────────────────────────────────┐
│  Onboarding Flow                                │
├────────────────────────────────────────────────┤
│  1. Welcome Screen (SDK) ✓                     │
│     [Edit] [Delete] [↑] [↓]                    │
│                                                 │
│  2. Meal Tracker 🔒 (Custom)                   │
│     Component: MealTrackerScreen               │
│     [View Only] [Delete] [↑] [↓]               │
│                                                 │
│     ⚠️ This screen requires app v1.1.0+        │
│     Custom screens require App Store approval  │
│     to modify. You can reorder or remove.      │
│                                                 │
│  3. Goal Selector (SDK) ✓                      │
│     [Edit] [Delete] [↑] [↓]                    │
└────────────────────────────────────────────────┘
```

---

### Step 4: Deploy Your App

1. **Test locally** first with Expo Go or development build
2. **Build production app** with the custom screen included
3. **Submit to App Store / Google Play**
4. **Wait for approval** (typically 1-3 days)

---

### Step 5: Publish the Flow

**After your app is approved and live:**

1. Go back to dashboard
2. Click **"Publish"**
3. Users will now see the custom screen in their onboarding

**⚠️ Important:** Don't publish the flow until your app with the custom screen is live in the stores. Otherwise users will encounter errors.

---

## Component API Reference

### Props Interface
```typescript
interface CustomScreenProps {
  /**
   * Analytics tracking object
   * Use to track events, errors, and user behavior
   */
  analytics: {
    track: (eventName: string, properties?: Record<string, any>) => void;
  };
  
  /**
   * Navigate to the next screen in the flow
   * REQUIRED: Call this when user completes your screen
   */
  onNext: () => void;
  
  /**
   * Skip this screen (optional)
   * Only provided if screen is configured as skippable
   */
  onSkip?: () => void;
  
  /**
   * Preview mode flag
   * True when rendering in dashboard preview
   * Use to show placeholder UI instead of real functionality
   */
  preview?: boolean;
  
  /**
   * Previously collected user data (optional)
   * Contains data from SDK components and other custom screens
   */
  data?: Record<string, any>;
  
  /**
   * Update the collected user data (optional)
   * Merge new data that will be passed to onComplete
   */
  onDataUpdate?: (newData: Record<string, any>) => void;
}
```

---

### Analytics Tracking

Track events to understand user behavior and debug issues:
```typescript
// ✅ Always track screen view on mount
useEffect(() => {
  analytics.track('screen_viewed', {
    screen_id: 'meal_tracker',
    screen_type: 'custom'
  });
}, []);

// ✅ Track user actions
analytics.track('button_clicked', {
  button_name: 'take_photo'
});

analytics.track('photo_captured', {
  quality: 0.7,
  timestamp: Date.now()
});

// ✅ Track completion
analytics.track('screen_completed', {
  screen_id: 'meal_tracker',
  calories_analyzed: 450,
  time_spent_seconds: 45
});

// ✅ Track skip
analytics.track('screen_skipped', {
  screen_id: 'meal_tracker',
  reason: 'user_declined'
});

// ✅ Track errors
analytics.track('error_occurred', {
  error_type: 'api_failure',
  error_message: 'Network timeout',
  endpoint: '/api/analyze-meal'
});

// ✅ Track API calls
analytics.track('api_request_started', {
  endpoint: '/analyze-meal'
});

analytics.track('api_request_completed', {
  endpoint: '/analyze-meal',
  duration_ms: 2340,
  status_code: 200
});
```

**These events appear in your dashboard analytics:**

- Filter by screen_id
- See conversion funnels
- Compare custom vs SDK screen performance
- A/B test custom screen positioning

---

### Navigation

**Always call `onNext()` when complete:**
```typescript
const handleContinue = () => {
  // Track completion first
  analytics.track('screen_completed', {
    screen_id: 'meal_tracker',
    data_collected: true
  });
  
  // Then navigate
  onNext();
};
```

**Call `onSkip()` if user skips (if provided):**
```typescript
const handleSkip = () => {
  analytics.track('screen_skipped', {
    screen_id: 'meal_tracker'
  });
  
  // Safe call - onSkip might be undefined
  onSkip?.();
};

// Or with button
{onSkip && (
  <Button title="Skip" onPress={handleSkip} />
)}
```

---

### Data Collection

Custom screens can contribute to the final `userData` object:
```typescript
export const GoalSelectionScreen = ({ 
  analytics, 
  onNext, 
  data,
  onDataUpdate 
}) => {
  const [selectedGoals, setSelectedGoals] = useState([]);
  
  const handleContinue = () => {
    // Add to collected data
    onDataUpdate?.({
      fitness_goals: selectedGoals,
      goals_count: selectedGoals.length,
      goals_timestamp: new Date().toISOString()
    });
    
    analytics.track('goals_selected', {
      count: selectedGoals.length,
      goals: selectedGoals
    });
    
    onNext();
  };
  
  return (
    <View>
      <CheckboxGroup
        options={['Lose Weight', 'Build Muscle', 'Improve Endurance']}
        selected={selectedGoals}
        onChange={setSelectedGoals}
      />
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
};
```

**The final `userData` merges SDK and custom screen data:**
```typescript
<OnboardingFlow
  customComponents={{ GoalSelectionScreen }}
  onComplete={(userData) => {
    // Contains data from both SDK and custom screens:
    console.log(userData);
    // {
    //   name: "John",                    // From SDK TextInput
    //   age: 25,                         // From SDK TextInput
    //   email: "john@example.com",       // From SDK TextInput
    //   fitness_goals: ["Build Muscle"], // From custom screen
    //   goals_count: 1,                  // From custom screen
    //   goals_timestamp: "2025-02-17..." // From custom screen
    // }
  }}
/>
```

---

### Accessing Previous Data

Use the `data` prop to access previously collected information:
```typescript
export const SummaryScreen = ({ analytics, onNext, data }) => {
  return (
    <View>
      <Text>Welcome, {data?.name}!</Text>
      <Text>Age: {data?.age}</Text>
      <Text>Goals: {data?.fitness_goals?.join(', ')}</Text>
      
      <Button title="Confirm" onPress={onNext} />
    </View>
  );
};
```

---

## Preview Mode

### Why Preview Mode is Critical

Custom screens often use native features that **don't work in the browser**:

- ❌ Camera
- ❌ Location/GPS
- ❌ Biometrics (Face ID, Touch ID)
- ❌ Bluetooth
- ❌ Push notifications
- ❌ Native modules

**Preview mode lets you show a placeholder in the dashboard** while providing full functionality in the real app.

---

### Implementing Preview Mode

<!-- **Always check the `preview` prop:**
```typescript
export const CameraScreen = ({ analytics, onNext, preview }) => {
  // PREVIEW MODE (dashboard - no camera access)
  if (preview) {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.mockCamera}>
          <Text style={styles.cameraIcon}>📸</Text>
          <Text style={styles.previewLabel}>Camera Preview</Text>
          <Text style={styles.previewNote}>
            (Real camera only works in app)
          </Text>
        </View>
        
        <View style={styles.mockResult}>
          <Text style={styles.resultText}>
            Result: Success (mock data)
          </Text>
        </View>
        
        <Button title="Continue" onPress={onNext} />
      </View>
    );
  } -->
  
  // REAL IMPLEMENTATION (mobile app - full camera access)
  return (
    <Camera>
      {/* Real camera implementation */}
    </Camera>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mockCamera: {
    width: 300,
    height: 400,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  cameraIcon: {
    fontSize: 64
  },
  previewLabel: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  previewNote: {
    marginTop: 8,
    fontSize: 14,
    color: '#999'
  },
  mockResult: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500'
  }
});
```

---

### Preview Best Practices

**✅ DO:**

- Show a visual placeholder that represents the screen's purpose
- Use icons/emojis to indicate functionality (📸 for camera, 📍 for location)
- Display mock data to demonstrate the UI flow
- Keep the same layout structure as the real screen
- Include Continue/Skip buttons so preview flow continues
- Show helpful text like "(Only works in real app)"

**❌ DON'T:**

- Return `null` or empty view (breaks preview flow)
- Show error messages or warnings
- Try to access native APIs in preview mode
- Make preview UI completely different from real UI
- Forget to handle the preview prop

---

### Preview Examples

**Location Request:**
```typescript
if (preview) {
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>📍</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
        Location Access
      </Text>
      <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
        This screen requests location permission
      </Text>
      <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
        (Preview mode - permission not actually requested)
      </Text>
      <View style={{ marginTop: 32, width: '100%' }}>
        <Button title="Grant Permission (Mock)" onPress={onNext} />
        <Button title="Skip" onPress={onSkip} color="#666" />
      </View>
    </View>
  );
}
```

**Payment/Checkout:**
```typescript
if (preview) {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Complete Purchase
      </Text>
      
      <View style={{
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 24
      }}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          💳 Payment Form (Mock)
        </Text>
        <Text style={{ color: '#666' }}>
          Card Number: •••• •••• •••• 1234
        </Text>
        <Text style={{ color: '#666' }}>
          Expiry: 12/25
        </Text>
      </View>
      
      <View style={{
        padding: 16,
        backgroundColor: '#e8f5e9',
        borderRadius: 12,
        marginBottom: 24
      }}>
        <Text style={{ color: '#2e7d32', fontWeight: '600' }}>
          ✓ Payment Successful (Mock)
        </Text>
      </View>
      
      <Button title="Continue" onPress={onNext} />
    </View>
  );
}
```

---

## Best Practices

### 1. File Organization

**Simple screens (one file):**
```
/src
  /screens
    /custom
      MealTrackerScreen.tsx
      BiometricAuthScreen.tsx
      LocationPermissionScreen.tsx
```

**Complex screens (folder structure):**
```
/src
  /screens
    /custom
      /meal-tracker
        index.tsx              ← Export main component
        MealTrackerScreen.tsx  ← Main component
        CameraView.tsx         ← Sub-component
        ResultView.tsx         ← Sub-component
        api.ts                 ← API calls
        hooks.ts               ← Custom hooks
        utils.ts               ← Helper functions
```

**Main export (index.tsx):**
```typescript
export { MealTrackerScreen } from './MealTrackerScreen';
```

---

### 2. Error Handling

**Always handle errors gracefully:**
```typescript
const analyzePhoto = async (photo) => {
  setLoading(true);
  
  try {
    const response = await fetch('https://your-api.com/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ image: photo.base64 }),
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.calories) {
      throw new Error('Invalid response from server');
    }
    
    setCalories(data.calories);
    
    analytics.track('analysis_completed', {
      calories: data.calories,
      duration_ms: Date.now() - startTime
    });
    
  } catch (error) {
    // Track error
    analytics.track('analysis_failed', {
      error_type: error.name,
      error_message: error.message,
      stack_trace: error.stack
    });
    
    // Show user-friendly message
    Alert.alert(
      'Analysis Failed',
      'We couldn\'t analyze your meal. Please try again or skip this step.',
      [
        { text: 'Retry', onPress: () => analyzePhoto(photo) },
        { text: 'Skip', onPress: onSkip, style: 'cancel' }
      ]
    );
  } finally {
    setLoading(false);
  }
};
```

---

### 3. Loading States

**Show clear, informative loading states:**
```typescript
const [loading, setLoading] = useState(false);
const [loadingMessage, setLoadingMessage] = useState('');

if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6B6B" />
      
      <Text style={styles.loadingTitle}>
        {loadingMessage || 'Please wait...'}
      </Text>
      
      <Text style={styles.loadingSubtitle}>
        This may take a few seconds
      </Text>
      
      {/* Optional: Progress indicator */}
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

// When calling API
setLoading(true);
setLoadingMessage('Analyzing your meal...');
await analyzePhoto(photo);
setLoading(false);
```

---

### 4. Accessibility

**Make custom screens accessible:**
```typescript
import { AccessibilityInfo } from 'react-native';

export const MealTrackerScreen = ({ analytics, onNext }) => {
  useEffect(() => {
    // Announce screen to screen readers
    AccessibilityInfo.announceForAccessibility(
      'Meal tracker screen. Take a photo of your meal to estimate calories.'
    );
  }, []);
  
  return (
    <View>
      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Take photo of meal"
        accessibilityHint="Opens camera to capture an image of your meal"
        onPress={takePicture}
      >
        <Text>Take Photo</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Skip meal tracking"
        accessibilityHint="Continues to next screen without taking photo"
        onPress={onSkip}
      >
        <Text>Skip</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

### 5. Performance

**Optimize for performance:**
```typescript
// ✅ Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);

// ✅ Debounce API calls
const debouncedSearch = useMemo(
  () => debounce((query) => searchAPI(query), 500),
  []
);

// ✅ Cancel pending requests on unmount
useEffect(() => {
  const controller = new AbortController();
  
  fetch('https://api.example.com/data', {
    signal: controller.signal
  });
  
  return () => controller.abort();
}, []);

// ✅ Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ✅ Use React.memo for expensive renders
export const ExpensiveComponent = React.memo(({ data }) => {
  // Complex rendering logic
});
```

---

### 6. Track Everything

**Comprehensive analytics tracking:**
```typescript
// Screen lifecycle
useEffect(() => {
  const startTime = Date.now();
  
  analytics.track('screen_viewed', {
    screen_id: 'meal_tracker',
    screen_type: 'custom',
    timestamp: startTime
  });
  
  return () => {
    analytics.track('screen_exited', {
      screen_id: 'meal_tracker',
      time_spent_ms: Date.now() - startTime
    });
  };
}, []);

// User interactions
analytics.track('camera_opened');
analytics.track('photo_captured', { quality: 0.7 });
analytics.track('photo_retaken');
analytics.track('analysis_requested');
analytics.track('analysis_completed', { calories: 450, confidence: 0.92 });
analytics.track('result_viewed');
analytics.track('screen_completed');
analytics.track('screen_skipped', { reason: 'user_declined' });

// Errors
analytics.track('camera_permission_denied');
analytics.track('camera_error', { error: error.message });
analytics.track('api_error', { endpoint: '/analyze', status: 500 });
analytics.track('network_timeout');

// Performance
analytics.track('api_latency', {
  endpoint: '/analyze',
  duration_ms: 2341,
  success: true
});
```

---

## Common Patterns

### Pattern 1: Permission Request
```typescript
export const PermissionScreen = ({ 
  analytics, 
  onNext, 
  onSkip,
  preview 
}) => {
  const [permissionStatus, setPermissionStatus] = useState(null);
  
  useEffect(() => {
    analytics.track('screen_viewed', {
      screen_id: 'location_permission'
    });
  }, []);
  
  // Preview mode
  if (preview) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 64, marginBottom: 20 }}>📍</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>
          Location Access
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
          We use your location to find nearby gyms and track outdoor workouts
        </Text>
        <Text style={{ fontSize: 14, color: '#999', marginTop: 12 }}>
          (Preview mode - no actual permission request)
        </Text>
        <View style={{ marginTop: 32, width: '100%', gap: 12 }}>
          <Button title="Allow (Mock)" onPress={onNext} />
          <Button title="Don't Allow (Mock)" onPress={onSkip} color="#666" />
        </View>
      </View>
    );
  }
  
  // Real implementation
  const requestPermission = async () => {
    analytics.track('permission_requested', { type: 'location' });
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      setPermissionStatus(status);
      
      if (status === 'granted') {
        analytics.track('permission_granted', { type: 'location' });
        onNext();
      } else {
        analytics.track('permission_denied', { type: 'location' });
        // Show explanation or allow skip
      }
    } catch (error) {
      analytics.track('permission_error', {
        type: 'location',
        error: error.message
      });
    }
  };
  
  if (permissionStatus === 'denied') {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
          Location Access Denied
        </Text>
        <Text style={{ marginBottom: 20, color: '#666' }}>
          You can enable location access later in Settings to use location features.
        </Text>
        <Button title="Continue Anyway" onPress={onNext} />
      </View>
    );
  }
  
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontSize: 64, marginBottom: 20 }}>📍</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>
        Enable Location
      </Text>
      <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 }}>
        We use your location to find nearby gyms and track outdoor workouts
      </Text>
      <Button title="Enable Location" onPress={requestPermission} />
      {onSkip && (
        <Button title="Skip for Now" onPress={onSkip} color="#666" />
      )}
    </View>
  );
};
```

---

### Pattern 2: Multi-Step Process
```typescript
export const MultiStepScreen = ({ analytics, onNext, preview }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  
  useEffect(() => {
    analytics.track('screen_viewed', {
      screen_id: 'multi_step',
      initial_step: 1
    });
  }, []);
  
  useEffect(() => {
    analytics.track('step_viewed', {
      screen_id: 'multi_step',
      step: step
    });
  }, [step]);
  
  const handleStep1Complete = (stepData) => {
    setData({ ...data, ...stepData });
    analytics.track('step_completed', { step: 1 });
    setStep(2);
  };
  
  const handleStep2Complete = (stepData) => {
    setData({ ...data, ...stepData });
    analytics.track('step_completed', { step: 2 });
    setStep(3);
  };
  
  const handleFinalComplete = (stepData) => {
    const finalData = { ...data, ...stepData };
    analytics.track('screen_completed', {
      screen_id: 'multi_step',
      total_steps: 3
    });
    onNext();
  };
  
  return (
    <View style={{ flex: 1 }}>
      {/* Progress indicator */}
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${(step / 3) * 100}%` }]} />
      </View>
      
      {/* Step content */}
      {step === 1 && <Step1 onComplete={handleStep1Complete} />}
      {step === 2 && <Step2 onComplete={handleStep2Complete} onBack={() => setStep(1)} />}
      {step === 3 && <Step3 onComplete={handleFinalComplete} onBack={() => setStep(2)} />}
    </View>
  );
};
```

---

### Pattern 3: API Integration with Retry
```typescript
export const APIIntegrationScreen = ({ analytics, onNext, preview }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    analytics.track('api_request_started', {
      attempt: retryCount + 1,
      max_attempts: maxRetries
    });
    
    try {
      const response = await fetch('https://your-api.com/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* data */ }),
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      analytics.track('api_request_completed', {
        attempt: retryCount + 1,
        success: true
      });
      
      // Success - move to next screen
      onNext();
      
    } catch (error) {
      analytics.track('api_request_failed', {
        attempt: retryCount + 1,
        error: error.message,
        will_retry: retryCount < maxRetries
      });
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          fetchData();
        }, delay);
      } else {
        // Max retries reached
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (error) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 64, marginBottom: 20 }}>⚠️</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
          Connection Failed
        </Text>
        <Text style={{ color: '#666', marginBottom: 32, textAlign: 'center' }}>
          We couldn't connect to the server. Please check your internet connection and try again.
        </Text>
        <Button 
          title="Try Again" 
          onPress={() => {
            setRetryCount(0);
            fetchData();
          }} 
        />
        <Button title="Skip for Now" onPress={onSkip} color="#666" />
      </View>
    );
  }
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 20 }}>
          {retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Connecting...'}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Sync Your Data
      </Text>
      <Button title="Connect" onPress={fetchData} />
    </View>
  );
};
```

---

### Pattern 4: Form with Validation
```typescript
export const FormScreen = ({ analytics, onNext, onDataUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.phone.match(/^\d{10}$/)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    analytics.track('form_submitted', {
      screen_id: 'contact_form'
    });
    
    if (validate()) {
      analytics.track('form_valid', {
        fields_filled: Object.keys(formData).length
      });
      
      onDataUpdate?.(formData);
      onNext();
    } else {
      analytics.track('form_invalid', {
        errors: Object.keys(errors)
      });
    }
  };
  
  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Name"
        value={formData.name}
        onChangeText={(name) => setFormData({ ...formData, name })}
      />
      {errors.name && <Text style={styles.error}>{errors.name}</Text>}
      
      <TextInput
        placeholder="Email"
        value={formData.email}
        keyboardType="email-address"
        onChangeText={(email) => setFormData({ ...formData, email })}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}
      
      <TextInput
        placeholder="Phone"
        value={formData.phone}
        keyboardType="phone-pad"
        onChangeText={(phone) => setFormData({ ...formData, phone })}
      />
      {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
      
      <Button title="Continue" onPress={handleSubmit} />
    </View>
  );
};
```

---

## Version Management

### Understanding Version Requirements

Custom screens exist **in your app code**. If you add a new custom screen or update an existing one, you need an App Store update.

**Timeline:**
```
Day 1: Add MealTrackerScreen to app v1.1.0, submit to App Store
Day 3: App Store approves v1.1.0
Day 5: 30% of users updated to v1.1.0
Day 7: 60% of users updated to v1.1.0
Day 14: 90% of users updated to v1.1.0
```

**Problem:** What happens if you publish the config with MealTrackerScreen on Day 4, when only 30% of users have the new app?

**Answer:** 70% of users will encounter an error (component not found).

---

### Solution: Minimum Version Requirements

Set a minimum app version in the dashboard:
```json
{
  "id": "meal_tracker",
  "type": "custom",
  "custom_component_name": "MealTrackerScreen",
  "min_app_version": "1.1.0"
}
```

**SDK behavior:**
```typescript
// SDK checks version before rendering
import { getVersion } from 'react-native-device-info';

const currentVersion = getVersion(); // e.g., "1.0.5"

if (screenConfig.min_app_version) {
  if (!meetsMinVersion(currentVersion, screenConfig.min_app_version)) {
    // Skip this screen for users on old app version
    analytics.track('screen_skipped_version_mismatch', {
      screen_id: screenConfig.id,
      current_version: currentVersion,
      required_version: screenConfig.min_app_version
    });
    
    // Move to next screen
    return null;
  }
}

// Render screen for users on new version
return <CustomComponent />;
```

---

### Dashboard Version Check

The dashboard shows version distribution:
```
┌────────────────────────────────────────────────┐
│  App Version Distribution                       │
├────────────────────────────────────────────────┤
│                                                 │
│  v1.1.0: ████████████████████░░ 90% (9,000)   │
│  v1.0.5: ████░░░░░░░░░░░░░░░░░░  8% (800)     │
│  v1.0.0: ░░░░░░░░░░░░░░░░░░░░░░  2% (200)     │
│                                                 │
│  Custom Screen: MealTrackerScreen              │
│  Requires: v1.1.0+                             │
│  Coverage: 90% of users can see this screen    │
│                                                 │
│  ✅ Safe to publish (high coverage)            │
│                                                 │
│  [Publish Now] [Wait for 95% Coverage]        │
└────────────────────────────────────────────────┘
```

---

### Gradual Rollout Strategy

**Recommended workflow:**

1. **Add custom screen to app** (v1.1.0)
2. **Submit to App Store**
3. **Wait for approval**
4. **Monitor adoption** (check dashboard version analytics)
5. **Wait until 90%+ users on v1.1.0**
6. **Then publish config** with min_app_version set

**This ensures:**
- Minimal user disruption
- High success rate
- Good user experience

---

### Handling Missing Components

**If user is on old app without the component:**
```typescript
// SDK gracefully handles missing components
const CustomComponent = customComponents[screenConfig.custom_component_name];

if (!CustomComponent) {
  analytics.track('custom_component_missing', {
    component_name: screenConfig.custom_component_name,
    app_version: getVersion()
  });
  
  // Show update prompt
  return (
    <View style={styles.updatePrompt}>
      <Text style={styles.updateTitle}>Update Required</Text>
      <Text style={styles.updateMessage}>
        This feature requires the latest version of the app.
        Please update to continue.
      </Text>
      <Button 
        title="Update Now" 
        onPress={() => Linking.openURL('app-store-link')} 
      />
      <Button 
        title="Skip for Now" 
        onPress={onSkip} 
        color="#666"
      />
    </View>
  );
}

return <CustomComponent {...props} />;
```

---

## Troubleshooting

### Component Not Rendering

**Problem:** Custom screen doesn't appear in the app.

**Checklist:**

1. **Is the component registered?**
```typescript
   <OnboardingFlow
     customComponents={{
       MealTrackerScreen: MealTrackerScreen  // ← Must be here
     }}
   />
```

2. **Does the name match exactly?**
```typescript
   // Dashboard config
   "custom_component_name": "MealTrackerScreen"
   
   // Component registration
   customComponents={{
     MealTrackerScreen: MealTrackerScreen  // ← Must match exactly (case-sensitive)
   }}
```

3. **Is the component exported?**
```typescript
   // ✅ Correct
   export const MealTrackerScreen = ({ ... }) => { ... };
   
   // ❌ Wrong (default export)
   export default MealTrackerScreen;
   
   // ❌ Wrong (not exported)
   const MealTrackerScreen = ({ ... }) => { ... };
```

4. **Is the app version sufficient?**
   - Check if `min_app_version` is set
   - Verify user's app meets minimum version

5. **Check console for errors:**
```
   - "CustomComponent not found: MealTrackerScreen"
   - Import errors
   - Syntax errors in component
```

---

### Preview Not Showing

**Problem:** Preview shows blank/error in dashboard.

**Solutions:**

1. **Implement preview mode:**
```typescript
   if (preview) {
     return <PreviewPlaceholder />;
   }
```

2. **Check for native API calls:**
   - Camera, Location, Biometrics won't work in browser
   - Always check `preview` prop before using native features

3. **Test in browser console:**
   - Open browser dev tools
   - Look for errors
   - Check network requests

---

### Analytics Not Tracking

**Problem:** Events from custom screen not appearing in dashboard.

**Solutions:**

1. **Verify analytics calls:**
```typescript
   // ✅ Correct
   analytics.track('screen_viewed', { ... });
   
   // ❌ Wrong
   Analytics.track('screen_viewed', { ... });  // Wrong import
   this.analytics.track('screen_viewed', { ... });  // Wrong usage
```

2. **Check prop is passed:**
```typescript
   export const MyScreen = ({ analytics }) => {
     console.log('Analytics:', analytics);  // Should not be undefined
```

3. **Track on mount:**
```typescript
   useEffect(() => {
     analytics.track('screen_viewed', { ... });
   }, []);  // Empty dependency array
```

---

### onNext Not Working

**Problem:** Clicking continue button doesn't navigate.

**Solutions:**

1. **Verify onNext is called:**
```typescript
   const handleContinue = () => {
     console.log('Continue clicked');  // Debug log
     analytics.track('screen_completed');
     onNext();  // ← Make sure this is called
   };
   
   <Button title="Continue" onPress={handleContinue} />
```

2. **Check for async issues:**
```typescript
   // ❌ Wrong (onNext not awaited)
   const handleContinue = async () => {
     await saveData();
     onNext();  // Might not execute if error above
   };
   
   // ✅ Correct (use try/finally)
   const handleContinue = async () => {
     try {
       await saveData();
     } finally {
       onNext();  // Always executes
     }
   };
```

---

## Advanced Topics

### Conditional Display

Use platform config to show/hide custom screens based on user data:
```json
{
  "screens": [
    {
      "id": "welcome",
      "type": "welcome_screen"
    },
    {
      "id": "meal_tracker",
      "type": "custom",
      "custom_component_name": "MealTrackerScreen",
      "conditions": {
        "show_if": {
          "all": [
            {"variable": "interested_in_nutrition", "equals": true},
            {"variable": "has_camera_permission", "equals": true}
          ]
        }
      }
    }
  ]
}
```

---

### Data Persistence

Custom screens can use AsyncStorage for local persistence:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DataCollectionScreen = ({ analytics, onNext, onDataUpdate }) => {
  const [data, setData] = useState({});
  
  // Load persisted data on mount
  useEffect(() => {
    const loadData = async () => {
      const saved = await AsyncStorage.getItem('custom_screen_data');
      if (saved) {
        setData(JSON.parse(saved));
      }
    };
    loadData();
  }, []);
  
  // Save data on change
  const updateData = async (newData) => {
    setData(newData);
    await AsyncStorage.setItem('custom_screen_data', JSON.stringify(newData));
    onDataUpdate?.(newData);
  };
  
  // Clear on complete
  const handleComplete = async () => {
    await AsyncStorage.removeItem('custom_screen_data');
    onNext();
  };
  
  return (
    <View>
      {/* Form fields */}
      <Button title="Continue" onPress={handleComplete} />
    </View>
  );
};
```

---

### Deep Linking

Handle deep links within custom screens:
```typescript
import { Linking } from 'react-native';

export const AuthScreen = ({ analytics, onNext }) => {
  useEffect(() => {
    const handleDeepLink = (event) => {
      const { url } = event;
      
      // Parse auth callback
      if (url.includes('/auth/callback')) {
        const token = extractTokenFromUrl(url);
        
        analytics.track('auth_completed', {
          method: 'oauth',
          provider: 'google'
        });
        
        // Save token and continue
        saveAuthToken(token);
        onNext();
      }
    };
    
    Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);
  
  const initiateOAuth = async () => {
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';
    await Linking.openURL(authUrl);
  };
  
  return (
    <View>
      <Button title="Sign in with Google" onPress={initiateOAuth} />
    </View>
  );
};
```

---

### Using Context

Share data across multiple custom screens:
```typescript
// OnboardingContext.tsx
import React, { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {
  const [sharedData, setSharedData] = useState({});
  
  return (
    <OnboardingContext.Provider value={{ sharedData, setSharedData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);

// App.tsx
<OnboardingProvider>
  <OnboardingFlow
    customComponents={{ Screen1, Screen2 }}
  />
</OnboardingProvider>

// Screen1.tsx
export const Screen1 = ({ onNext }) => {
  const { sharedData, setSharedData } = useOnboarding();
  
  const handleContinue = () => {
    setSharedData({ ...sharedData, step1Complete: true });
    onNext();
  };
  
  return <View>...</View>;
};

// Screen2.tsx
export const Screen2 = ({ onNext }) => {
  const { sharedData } = useOnboarding();
  
  // Access data from Screen1
  console.log(sharedData.step1Complete);  // true
  
  return <View>...</View>;
};
```

---

## Summary

Custom screens give you the flexibility to build complex, native-integrated onboarding experiences while still benefiting from our platform's analytics, A/B testing, and flow management.

**Key takeaways:**

1. ✅ Custom screens live in YOUR app code
2. ✅ Changes require App Store approval
3. ✅ Always implement preview mode for dashboard
4. ✅ Track events comprehensively with analytics
5. ✅ Handle errors gracefully
6. ✅ Use min_app_version for gradual rollout
7. ✅ Custom screens don't count toward MAU limits

**Next steps:**

- Create your first custom screen using the Quick Start guide
- Test locally with preview mode
- Deploy to App Store
- Monitor analytics in dashboard
- Iterate based on user behavior

**Need help?**
- 📖 Full documentation: https://docs.yourplatform.com
- 💬 Discord community: https://discord.gg/yourplatform
- ✉️ Support: support@yourplatform.com

---

**Happy building! 🚀**