import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from './api';
import { AnalyticsManager } from './analytics';
import { OnboardingFlowProps, ScreenConfig, ConditionalDestination, ConditionalRoutes } from './types';
import { resolveDestination } from './variableUtils';
import { ElementRenderer } from './components/ElementRenderer';

const USER_ID_STORAGE_KEY = '@noboarding_user_id';

// Get or create persistent user ID
const getPersistentUserId = async (): Promise<string> => {
  try {
    // Try to get existing user ID from storage
    const existingUserId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);

    if (existingUserId) {
      return existingUserId;
    }

    // Generate new user ID if none exists
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(USER_ID_STORAGE_KEY, newUserId);
    return newUserId;
  } catch (error) {
    console.error('Failed to get/set user ID from storage:', error);
    // Fallback to generating a non-persistent ID
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Generate session ID (always new per session)
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Detect environment: true in dev/Expo, false in production builds
const detectEnvironment = (): 'test' | 'production' => {
  if (__DEV__) return 'test';
  return 'production';
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  apiKey,
  testKey,
  productionKey,
  onComplete,
  onSkip,
  baseUrl,
  initialVariables,
  customComponents,
  onUserIdGenerated,
}) => {
  // Determine which API key to use
  const getApiKey = (): string => {
    // If dual keys provided, use environment detection
    if (testKey && productionKey) {
      const env = detectEnvironment();
      return env === 'test' ? testKey : productionKey;
    }

    // If only one dual key provided, use it
    if (testKey) return testKey;
    if (productionKey) return productionKey;

    // Fallback to legacy single key
    if (apiKey) return apiKey;

    throw new Error('Noboarding SDK: No API key provided. Please provide either apiKey, or both testKey and productionKey.');
  };

  const activeApiKey = getApiKey();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [variables, setVariables] = useState<Record<string, any>>(initialVariables || {});

  const apiRef = useRef<API | null>(null);
  const analyticsRef = useRef<AnalyticsManager | null>(null);
  const userIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const flowIdRef = useRef<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      // Get or create persistent user ID
      const userId = await getPersistentUserId();
      userIdRef.current = userId;

      // Notify parent of the user ID
      if (onUserIdGenerated) {
        onUserIdGenerated(userId);
      }

      // Initialize the flow
      await initializeFlow();
    };

    initialize();

    return () => {
      // Cleanup: flush remaining analytics
      if (analyticsRef.current) {
        analyticsRef.current.destroy();
      }
    };
  }, []);

  // Track screen views whenever user navigates to a different screen
  useEffect(() => {
    if (screens.length > 0 && analyticsRef.current && currentIndex > 0) {
      const currentScreen = screens[currentIndex];
      analyticsRef.current.track('screen_viewed', {
        flow_id: flowIdRef.current,
        screen_id: currentScreen.id,
        screen_index: currentIndex,
      });
    }
  }, [currentIndex, screens]);

  const initializeFlow = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure user ID is set
      if (!userIdRef.current) {
        throw new Error('User ID not initialized');
      }

      // Initialize API client with detected API key
      const api = new API(activeApiKey, baseUrl);
      apiRef.current = api;

      // Initialize analytics
      const analytics = new AnalyticsManager(
        api,
        userIdRef.current,
        sessionIdRef.current
      );
      analyticsRef.current = analytics;

      // Fetch configuration
      const configResponse = await api.getConfig();

      // Store flow_id for analytics
      flowIdRef.current = configResponse.config_id;

      // Handle A/B test experiment assignment
      let screensToUse = configResponse.config.screens;

      if (configResponse.experiments && configResponse.experiments.length > 0) {
        // Assign user to the first active experiment
        const experiment = configResponse.experiments[0];
        try {
          const assignment = await api.assignVariant(
            experiment.id,
            userIdRef.current!
          );

          console.log('🧪 A/B Test Assignment:', {
            experiment_id: experiment.id,
            experiment_name: experiment.name,
            variant_id: assignment.variant_id,
            has_variant_screens: assignment.variant_config?.screens?.length > 0,
            variant_screen_count: assignment.variant_config?.screens?.length || 0,
            cached: assignment.cached,
          });

          // Set experiment context so all events get tagged
          analytics.setExperimentContext(experiment.id, assignment.variant_id);

          // Use variant screens if available
          if (assignment.variant_config?.screens?.length > 0) {
            screensToUse = assignment.variant_config.screens;
            console.log('📱 Using variant screens:', assignment.variant_config.screens.length, 'screens');
          } else {
            console.log('📱 Using base flow screens (variant has no screens defined)');
          }
        } catch (err) {
          console.warn('Failed to assign experiment variant, using default flow:', err);
        }
      }

      // Backward compatibility: normalize legacy 'custom_screen' (with elements) to 'noboard_screen'
      const normalizedScreens = screensToUse
        .map(s => ({
          ...s,
          type: (s.type === ('custom_screen' as any) && s.elements) ? 'noboard_screen' as ScreenConfig['type'] : s.type,
        }))
        // Filter out hidden screens (dashboard show/hide feature)
        .filter(s => !s.hidden);
      setScreens(normalizedScreens);

      // Track onboarding start with first screen
      analytics.track('onboarding_started', {
        flow_id: flowIdRef.current,
        screen_id: normalizedScreens[0]?.id,
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize onboarding flow:', err);
      setError('Failed to load onboarding. Please try again.');
      setLoading(false);
    }
  };

  const handleNext = (data?: Record<string, any>) => {
    // Collect data from this screen
    if (data) {
      setCollectedData((prev) => ({ ...prev, ...data }));
    }

    // Check if this is the last screen
    if (currentIndex >= screens.length - 1) {
      handleComplete(data);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    // Navigate to previous screen (only if not on first screen)
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSkipScreen = () => {
    // Move to next screen or complete
    if (currentIndex >= screens.length - 1) {
      handleComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSetVariable = useCallback((name: string, value: any) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleComplete = async (lastScreenData?: Record<string, any>) => {
    const finalData = {
      ...collectedData,
      ...(lastScreenData || {}),
      _variables: variables,
    };

    // Track completion
    if (analyticsRef.current) {
      analyticsRef.current.track('onboarding_completed', {
        flow_id: flowIdRef.current,
        screen_id: screens[currentIndex]?.id,
      });
      await analyticsRef.current.flush();
    }

    // Call developer's completion callback with collected data
    onComplete(finalData);
  };

  const handleSkipAll = async () => {
    if (analyticsRef.current) {
      analyticsRef.current.track('onboarding_abandoned', {
        flow_id: flowIdRef.current,
        screen_id: screens[currentIndex]?.id,
        current_screen_index: currentIndex,
      });
      await analyticsRef.current.flush();
    }

    if (onSkip) {
      onSkip();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (screens.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No onboarding screens configured</Text>
      </View>
    );
  }

  const currentScreen = screens[currentIndex];

  // Handle noboard_screen type — render with ElementRenderer
  if (currentScreen.type === 'noboard_screen' && currentScreen.elements) {
    // Merge collectedData (from custom screens) + variables (from noboard screens)
    // This allows noboard screens to reference custom screen data in templates like {height_cm}
    const allVariables = { ...collectedData, ...variables };

    // Warn about conflicts (same key in both sources)
    if (__DEV__) {
      Object.keys(collectedData).forEach(key => {
        if (variables[key] !== undefined) {
          console.warn(
            `[Noboarding] Variable conflict: "${key}" exists in both custom screen data and noboard variables. Using noboard value.`
          );
        }
      });
    }

    const handleElementNavigate = (destination: string | ConditionalDestination | ConditionalRoutes) => {
      const resolved = resolveDestination(destination, allVariables);
      if (!resolved) return;

      if (resolved === 'next') {
        handleNext();
      } else if (resolved === 'previous') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else {
        // Navigate to specific screen by ID
        const targetIndex = screens.findIndex((s) => s.id === resolved);
        if (targetIndex >= 0) {
          setCurrentIndex(targetIndex);
        } else {
          handleNext();
        }
      }
    };

    return (
      <View style={styles.container}>
        <ElementRenderer
          elements={currentScreen.elements}
          analytics={analyticsRef.current!}
          screenId={currentScreen.id}
          onNavigate={handleElementNavigate}
          onDismiss={onSkip ? handleSkipAll : handleNext}
          variables={allVariables}
          onSetVariable={handleSetVariable}
        />
      </View>
    );
  }

  // Handle custom_screen type — developer-registered React Native components
  if (currentScreen.type === 'custom_screen') {
    const componentName = currentScreen.custom_component_name;
    const CustomComponent = customComponents?.[componentName || ''];

    if (!CustomComponent) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Component "{componentName}" not found.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 16, padding: 12 }}
            onPress={() => handleNext()}
          >
            <Text style={{ color: '#007AFF', fontSize: 16 }}>Skip</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CustomComponent
          analytics={analyticsRef.current!}
          onNext={() => handleNext()}
          onBack={currentIndex > 0 ? handleBack : undefined}
          onSkip={onSkip ? handleSkipAll : undefined}
          data={collectedData}
          onDataUpdate={(newData) => setCollectedData(prev => ({ ...prev, ...newData }))}
        />
      </View>
    );
  }

  // Unknown screen type fallback
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>
        Unknown screen type: "{currentScreen.type}"
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000000',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
