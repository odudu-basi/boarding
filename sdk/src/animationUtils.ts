import { Animated, Easing } from 'react-native';
import type {
  EntranceAnimation,
  InteractiveAnimation,
  TextAnimation,
  HapticType
} from './types';

// Lazy load haptics to avoid errors if not installed
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  console.warn('expo-haptics not installed, haptic feedback will be disabled');
}

// ─── Haptic Feedback Helper ───

export const triggerHaptic = (type: HapticType = 'light') => {
  if (!Haptics) {
    // Silently skip if expo-haptics not available
    return;
  }

  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
};

// ─── Easing Function Mapper ───

export const getEasing = (easingType?: string) => {
  switch (easingType) {
    case 'linear':
      return Easing.linear;
    case 'ease-in':
      return Easing.in(Easing.ease);
    case 'ease-out':
      return Easing.out(Easing.ease);
    case 'ease-in-out':
      return Easing.inOut(Easing.ease);
    case 'spring':
      return Easing.elastic(1);
    default:
      return Easing.inOut(Easing.ease);
  }
};

// ─── Entrance Animations ───

export interface EntranceAnimationValues {
  opacity: Animated.Value;
  translateY: Animated.Value;
  translateX: Animated.Value;
  scale: Animated.Value;
}

export const createEntranceAnimationValues = (): EntranceAnimationValues => ({
  opacity: new Animated.Value(0),
  translateY: new Animated.Value(0),
  translateX: new Animated.Value(0),
  scale: new Animated.Value(1),
});

export const startEntranceAnimation = (
  config: EntranceAnimation,
  values: EntranceAnimationValues,
  delay: number = 0
): void => {
  const duration = config.duration || 400;
  const totalDelay = (config.delay || 0) + delay;
  const easing = getEasing(config.easing);

  // Set initial values based on animation type
  switch (config.type) {
    case 'fadeIn':
      values.opacity.setValue(0);
      break;
    case 'slideUp':
      values.opacity.setValue(0);
      values.translateY.setValue(30);
      break;
    case 'slideDown':
      values.opacity.setValue(0);
      values.translateY.setValue(-30);
      break;
    case 'slideLeft':
      values.opacity.setValue(0);
      values.translateX.setValue(30);
      break;
    case 'slideRight':
      values.opacity.setValue(0);
      values.translateX.setValue(-30);
      break;
    case 'scaleIn':
      values.opacity.setValue(0);
      values.scale.setValue(0.8);
      break;
    case 'none':
      values.opacity.setValue(1);
      return;
  }

  // Animate to final values
  Animated.parallel([
    Animated.timing(values.opacity, {
      toValue: 1,
      duration,
      delay: totalDelay,
      easing,
      useNativeDriver: true,
    }),
    Animated.timing(values.translateY, {
      toValue: 0,
      duration,
      delay: totalDelay,
      easing,
      useNativeDriver: true,
    }),
    Animated.timing(values.translateX, {
      toValue: 0,
      duration,
      delay: totalDelay,
      easing,
      useNativeDriver: true,
    }),
    Animated.timing(values.scale, {
      toValue: 1,
      duration,
      delay: totalDelay,
      easing,
      useNativeDriver: true,
    }),
  ]).start();
};

// ─── Interactive Animations ───

export const startInteractiveAnimation = (
  config: InteractiveAnimation,
  animatedValue: Animated.Value
): void => {
  const duration = config.duration || 200;
  const intensity = config.intensity || (config.type === 'scale' ? 0.95 : 10);

  // Trigger haptic if enabled
  if (config.haptic && config.hapticType) {
    triggerHaptic(config.hapticType);
  }

  switch (config.type) {
    case 'scale':
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: intensity,
          duration: duration / 2,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      break;

    case 'pulse':
      const pulseSequence = Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.05,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

      if (config.repeat) {
        Animated.loop(pulseSequence).start();
      } else {
        pulseSequence.start();
      }
      break;

    case 'shake':
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: intensity,
          duration: duration / 8,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: -intensity,
          duration: duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: intensity,
          duration: duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: -intensity,
          duration: duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: duration / 8,
          useNativeDriver: true,
        }),
      ]).start();
      break;

    case 'bounce':
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: -20,
          duration: duration / 3,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 5,
          duration: duration / 3,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: duration / 3,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      break;
  }
};

// ─── Typewriter Text Animation ───

export interface TypewriterState {
  displayedText: string;
  currentIndex: number;
  isComplete: boolean;
}

export const shouldTriggerHaptic = (
  index: number,
  frequency: string
): boolean => {
  switch (frequency) {
    case 'every':
      return true;
    case 'every-2':
      return index % 2 === 0;
    case 'every-3':
      return index % 3 === 0;
    case 'every-5':
      return index % 5 === 0;
    default:
      return false;
  }
};
