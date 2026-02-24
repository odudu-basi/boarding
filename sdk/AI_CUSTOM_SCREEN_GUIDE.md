# AI Assistant Guide: Building Custom Screens for Noboarding SDK

> **Purpose:** Copy this entire guide and paste it to your AI coding assistant (Claude Code, Cursor, GitHub Copilot, etc.) when you need to build a custom screen for the Noboarding SDK.

---

## Instructions for AI Assistant

I need you to help me build a custom screen component for the Noboarding SDK. This guide explains how to structure the code, handle data flow between screens, and set up the screen in the dashboard.

---

## Context: How Custom Screens Work

Custom screens are React Native components that integrate into remotely-managed onboarding flows. They:
- Live in the app code (not on servers)
- Collect user data during onboarding
- Pass data to subsequent screens
- Can access data from previous screens
- Are positioned in flows via the dashboard

**Data Flow:**
```
Screen 1 (SDK or Custom) → collects data → passes to Screen 2
Screen 2 (Custom) → receives data from Screen 1 → adds more data → passes to Screen 3
Screen 3 (SDK or Custom) → receives all previous data → continues...
```

---

## Part 1: Custom Screen Component Structure

### Required Imports

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import type { CustomScreenProps } from 'noboarding';
```

### Component Props Interface

Every custom screen receives these props from the SDK:

```typescript
interface CustomScreenProps {
  // Analytics tracking
  analytics: {
    track: (event: string, properties?: Record<string, any>) => void;
  };

  // Navigation
  onNext: () => void;           // Move to next screen
  onBack?: () => void;          // Move to previous screen (undefined on first screen)
  onSkip?: () => void;          // Skip this screen (optional)

  // Data flow
  data?: Record<string, any>;   // Data from PREVIOUS screens (read-only)
  onDataUpdate?: (newData: Record<string, any>) => void;  // Add YOUR data

  // Preview mode
  preview?: boolean;            // True when rendering in dashboard
}
```

### Basic Component Template

```typescript
export const MyCustomScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  onSkip,
  preview,
  data,           // Data from previous screens
  onDataUpdate,   // Function to add your data
}) => {
  // 1. Local state for THIS screen's data
  const [myData, setMyData] = useState({
    // Initialize with default values
  });

  // 2. Track screen view on mount
  useEffect(() => {
    analytics.track('screen_viewed', {
      screen_id: 'my_custom_screen',
      screen_type: 'custom'
    });
  }, []);

  // 3. Handle continue/next
  const handleContinue = () => {
    // Update collected data with THIS screen's data
    onDataUpdate?.({
      // Add your screen's data here
      ...myData,
    });

    // Track completion
    analytics.track('screen_completed', {
      screen_id: 'my_custom_screen',
    });

    // Navigate to next screen
    onNext();
  };

  // 4. Preview mode (for dashboard)
  if (preview) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewText}>Preview: My Custom Screen</Text>
        <Button title="Continue" onPress={onNext} />
      </View>
    );
  }

  // 5. Real implementation
  return (
    <View style={styles.container}>
      {/* Access data from PREVIOUS screens */}
      {data?.userName && (
        <Text>Welcome back, {data.userName}!</Text>
      )}

      {/* Your screen UI here */}

      <Button title="Continue" onPress={handleContinue} />
      {onSkip && (
        <Button title="Skip" onPress={onSkip} color="#666" />
      )}
    </View>
  );
};
```

---

## Part 2: Data Flow Between Screens

### Example: Multi-Screen Data Collection

**Screen 1: Name Collection (Custom)**

```typescript
export const NameScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  data,
  onDataUpdate,
}) => {
  const [name, setName] = useState('');

  const handleContinue = () => {
    // Add THIS screen's data
    onDataUpdate?.({
      userName: name,
      nameCollectedAt: new Date().toISOString(),
    });

    analytics.track('name_collected', { name });
    onNext();
  };

  return (
    <View>
      <TextInput
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
};
```

**Screen 2: Age Collection (Custom)**

```typescript
export const AgeScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  data,           // Contains: { userName, nameCollectedAt }
  onDataUpdate,
}) => {
  const [age, setAge] = useState('');

  const handleContinue = () => {
    // Add THIS screen's data
    onDataUpdate?.({
      userAge: parseInt(age),
      ageCollectedAt: new Date().toISOString(),
    });

    analytics.track('age_collected', { age });
    onNext();
  };

  return (
    <View>
      {/* Access data from previous screen */}
      <Text>Hi {data?.userName}! What's your age?</Text>

      <TextInput
        placeholder="Enter your age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
};
```

**Screen 3: Summary (Custom)**

```typescript
export const SummaryScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  data,  // Contains: { userName, nameCollectedAt, userAge, ageCollectedAt }
}) => {
  return (
    <View>
      <Text>Summary:</Text>
      <Text>Name: {data?.userName}</Text>
      <Text>Age: {data?.userAge}</Text>

      <Button title="Confirm" onPress={onNext} />
    </View>
  );
};
```

**Final onComplete Handler (in App.tsx)**

```typescript
<OnboardingFlow
  // Dual API keys for automatic environment detection
  testKey="nb_test_..."
  productionKey="nb_live_..."
  // SDK auto-detects __DEV__ and uses appropriate key

  customComponents={{
    NameScreen,
    AgeScreen,
    SummaryScreen,
  }}
  onComplete={(userData) => {
    // userData contains ALL collected data:
    console.log(userData);
    // {
    //   userName: "John",
    //   nameCollectedAt: "2025-02-20...",
    //   userAge: 25,
    //   ageCollectedAt: "2025-02-20...",
    //   _variables: { ... }
    // }
  }}
/>
```

---

## Part 3: Common Patterns

### Pattern 1: Form with Validation

```typescript
export const FormScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  onDataUpdate,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email';
    }

    if (!formData.phone.match(/^\d{10}$/)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onDataUpdate?.(formData);
      analytics.track('form_submitted', { valid: true });
      onNext();
    } else {
      analytics.track('form_validation_failed', { errors: Object.keys(errors) });
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={formData.email}
        onChangeText={(email) => setFormData({ ...formData, email })}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <TextInput
        placeholder="Phone"
        value={formData.phone}
        onChangeText={(phone) => setFormData({ ...formData, phone })}
      />
      {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

      <Button title="Continue" onPress={handleSubmit} />
    </View>
  );
};
```

### Pattern 2: Multi-Select Options

```typescript
export const PreferencesScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  data,
  onDataUpdate,
}) => {
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const options = ['Option A', 'Option B', 'Option C', 'Option D'];

  const togglePreference = (option: string) => {
    if (selectedPreferences.includes(option)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== option));
    } else {
      setSelectedPreferences([...selectedPreferences, option]);
    }
  };

  const handleContinue = () => {
    onDataUpdate?.({
      preferences: selectedPreferences,
      preferencesCount: selectedPreferences.length,
    });

    analytics.track('preferences_selected', {
      count: selectedPreferences.length,
      selections: selectedPreferences,
    });

    onNext();
  };

  return (
    <View>
      <Text>Select your preferences:</Text>

      {options.map(option => (
        <TouchableOpacity
          key={option}
          onPress={() => togglePreference(option)}
          style={[
            styles.option,
            selectedPreferences.includes(option) && styles.optionSelected
          ]}
        >
          <Text>{option}</Text>
          {selectedPreferences.includes(option) && <Text>✓</Text>}
        </TouchableOpacity>
      ))}

      <Button
        title="Continue"
        onPress={handleContinue}
        disabled={selectedPreferences.length === 0}
      />
    </View>
  );
};
```

### Pattern 3: API Call with Data from Previous Screen

```typescript
export const ProfileSetupScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  data,  // Data from previous screens
  onDataUpdate,
}) => {
  const [loading, setLoading] = useState(false);

  const createProfile = async () => {
    setLoading(true);
    analytics.track('profile_creation_started');

    try {
      // Use data from previous screens
      const response = await fetch('https://your-api.com/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data?.userName,
          age: data?.userAge,
          email: data?.email,
          preferences: data?.preferences,
        }),
      });

      const result = await response.json();

      // Add API response to collected data
      onDataUpdate?.({
        profileId: result.id,
        profileCreated: true,
        profileCreatedAt: new Date().toISOString(),
      });

      analytics.track('profile_created', { profileId: result.id });
      onNext();
    } catch (error: any) {
      analytics.track('profile_creation_failed', { error: error.message });
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>Creating profile for {data?.userName}...</Text>
      <Button
        title="Create Profile"
        onPress={createProfile}
        disabled={loading}
      />
      {loading && <ActivityIndicator />}
    </View>
  );
};
```

### Pattern 4: Conditional Logic Based on Previous Data

```typescript
export const ConditionalScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  data,
  onDataUpdate,
}) => {
  // Show different UI based on previous data
  const isPremiumUser = data?.userAge && data.userAge > 25;

  if (isPremiumUser) {
    return (
      <View>
        <Text>Premium Experience</Text>
        <Text>Welcome {data?.userName}! You qualify for premium features.</Text>
        <Button
          title="Continue"
          onPress={() => {
            onDataUpdate?.({ userTier: 'premium' });
            onNext();
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <Text>Standard Experience</Text>
      <Text>Welcome {data?.userName}!</Text>
      <Button
        title="Continue"
        onPress={() => {
          onDataUpdate?.({ userTier: 'standard' });
          onNext();
        }}
      />
    </View>
  );
};
```

---

## Part 4: Analytics Best Practices

### Track All Key Events

```typescript
// Screen lifecycle
useEffect(() => {
  analytics.track('screen_viewed', {
    screen_id: 'my_screen',
    screen_type: 'custom',
  });

  return () => {
    analytics.track('screen_exited', {
      screen_id: 'my_screen',
    });
  };
}, []);

// User interactions
analytics.track('button_clicked', { button: 'submit' });
analytics.track('input_focused', { field: 'email' });
analytics.track('option_selected', { option: 'premium' });

// Completion
analytics.track('screen_completed', {
  screen_id: 'my_screen',
  data_collected: true,
});

// Errors
analytics.track('error_occurred', {
  error_type: 'validation',
  error_message: 'Invalid email',
});
```

---

## Part 5: Setting Up Custom Screens in Dashboard

### Step 1: Register Component in App

```typescript
// App.tsx
import { OnboardingFlow } from 'noboarding';
import { NameScreen } from './screens/NameScreen';
import { AgeScreen } from './screens/AgeScreen';
import { PreferencesScreen } from './screens/PreferencesScreen';

<OnboardingFlow
  // Use dual API keys for automatic environment detection
  testKey="nb_test_your_test_key"
  productionKey="nb_live_your_production_key"
  // The SDK automatically uses testKey when __DEV__ is true
  // and productionKey in production builds

  customComponents={{
    NameScreen: NameScreen,           // Component name MUST match exactly
    AgeScreen: AgeScreen,             // Case-sensitive!
    PreferencesScreen: PreferencesScreen,
  }}
  onComplete={(userData) => {
    console.log('All collected data:', userData);
  }}
/>
```

### Step 2: Add to Dashboard Flow

1. **Log in to Noboarding Dashboard**
2. **Go to Flows** and select or create a flow
3. **Click "Add Custom Screen"**
4. **Enter Component Name:** (must match EXACTLY what you registered)
   - Example: `NameScreen`
   - ❌ Wrong: `nameScreen`, `name_screen`, `NameScreenComponent`
   - ✅ Correct: `NameScreen`
5. **Add Description:** "Collects user's name"
6. **Position in Flow:** Drag to desired position
7. **Save Draft**

### Step 3: Flow Order Example

```
Dashboard Flow Builder:
┌─────────────────────────────────────┐
│ 1. Welcome Screen (SDK)             │
│ 2. NameScreen (Custom)              │ ← Your custom screen
│ 3. AgeScreen (Custom)               │ ← Your custom screen
│ 4. Feature Tour (SDK)               │
│ 5. PreferencesScreen (Custom)       │ ← Your custom screen
│ 6. Complete (SDK)                   │
└─────────────────────────────────────┘
```

### Step 4: Test Locally

```bash
npm start
# Test in development mode
# Navigate through onboarding
# Check console for collected data
```

### Step 5: Deploy & Publish

1. Test locally with Test API Key (development mode)
2. In dashboard: **Publish → Publish for Testing**
3. Build production app
4. Submit to App Store / Google Play
5. **WAIT for approval**
6. **After app is live:** In dashboard, **Publish → Publish to Production**

**Note:** Test and Production environments are separate. You can safely test changes using the Test API Key before rolling them out to production users with the Production API Key.

---

## Part 6: Complete Example - Multi-Step Form

Here's a complete example showing data flow across 3 custom screens:

```typescript
// screens/Step1EmailScreen.tsx
export const Step1EmailScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  preview,
  onDataUpdate,
}) => {
  const [email, setEmail] = useState('');

  useEffect(() => {
    analytics.track('screen_viewed', { screen_id: 'step1_email' });
  }, []);

  const handleContinue = () => {
    onDataUpdate?.({
      email: email,
      emailCollectedAt: new Date().toISOString(),
    });
    analytics.track('email_collected');
    onNext();
  };

  if (preview) {
    return (
      <View style={styles.preview}>
        <Text>📧 Email Collection Screen</Text>
        <Button title="Continue" onPress={onNext} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your email?</Text>
      <TextInput
        style={styles.input}
        placeholder="email@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        title="Continue"
        onPress={handleContinue}
        disabled={!email}
      />
    </View>
  );
};

// screens/Step2GoalsScreen.tsx
export const Step2GoalsScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  data,  // Contains: { email, emailCollectedAt }
  preview,
  onDataUpdate,
}) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    analytics.track('screen_viewed', {
      screen_id: 'step2_goals',
      user_email: data?.email
    });
  }, []);

  const goals = ['Fitness', 'Nutrition', 'Sleep', 'Mindfulness'];

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleContinue = () => {
    onDataUpdate?.({
      goals: selectedGoals,
      goalsCount: selectedGoals.length,
    });
    analytics.track('goals_selected', { count: selectedGoals.length });
    onNext();
  };

  if (preview) {
    return (
      <View style={styles.preview}>
        <Text>🎯 Goals Selection Screen</Text>
        <Button title="Continue" onPress={onNext} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Hi {data?.email?.split('@')[0]}! What are your goals?
      </Text>

      {goals.map(goal => (
        <TouchableOpacity
          key={goal}
          onPress={() => toggleGoal(goal)}
          style={[
            styles.goalOption,
            selectedGoals.includes(goal) && styles.goalSelected
          ]}
        >
          <Text>{goal}</Text>
          {selectedGoals.includes(goal) && <Text>✓</Text>}
        </TouchableOpacity>
      ))}

      <Button
        title="Continue"
        onPress={handleContinue}
        disabled={selectedGoals.length === 0}
      />
    </View>
  );
};

// screens/Step3SummaryScreen.tsx
export const Step3SummaryScreen: React.FC<CustomScreenProps> = ({
  analytics,
  onNext,
  data,  // Contains: { email, emailCollectedAt, goals, goalsCount }
  preview,
}) => {
  useEffect(() => {
    analytics.track('screen_viewed', { screen_id: 'step3_summary' });
  }, []);

  if (preview) {
    return (
      <View style={styles.preview}>
        <Text>📋 Summary Screen</Text>
        <Button title="Continue" onPress={onNext} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summary</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{data?.email}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.label}>Goals ({data?.goalsCount}):</Text>
        {data?.goals?.map((goal: string) => (
          <Text key={goal} style={styles.value}>• {goal}</Text>
        ))}
      </View>

      <Button title="Complete Setup" onPress={onNext} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  goalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
  },
  goalSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  summaryCard: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
});
```

**Register in App.tsx:**

```typescript
<OnboardingFlow
  // Dual API keys - SDK auto-detects environment
  testKey="nb_test_..."
  productionKey="nb_live_..."

  customComponents={{
    Step1EmailScreen,
    Step2GoalsScreen,
    Step3SummaryScreen,
  }}
  onComplete={(userData) => {
    console.log(userData);
    // {
    //   email: "john@example.com",
    //   emailCollectedAt: "2025-02-20...",
    //   goals: ["Fitness", "Nutrition"],
    //   goalsCount: 2,
    //   _variables: { ... }
    // }
  }}
/>
```

---

## Summary Checklist

When building a custom screen, ensure you:

- [ ] Import `CustomScreenProps` from 'noboarding'
- [ ] Use all required props: `analytics`, `onNext`, `data`, `onDataUpdate`
- [ ] Track `screen_viewed` on mount
- [ ] Implement `preview` mode for dashboard
- [ ] Call `onDataUpdate()` to add your data before `onNext()`
- [ ] Track `screen_completed` before navigating
- [ ] Access previous data via `data` prop
- [ ] Register component in `customComponents` with EXACT name
- [ ] Add to dashboard with matching component name
- [ ] Test data flow across multiple screens

---

**Now you're ready to build custom screens!** Ask me any questions if you need clarification on any part of this guide.
