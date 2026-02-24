// Main component
export { OnboardingFlow } from './OnboardingFlow';

// Types
export type {
  OnboardingFlowProps,
  ScreenConfig,
  OnboardingConfig,
  AnalyticsEvent,
  BaseComponentProps,
  CustomScreenProps,
  // Element tree types
  ElementNode,
  ElementType,
  ElementAction,
  ElementStyle,
  ElementPosition,
  // Variable & condition types
  Condition,
  ComparisonOperator,
  ConditionalDestination,
  ConditionalRoutes,
  ElementConditions,
} from './types';

// Components
export { ElementRenderer } from './components/ElementRenderer';

// Utilities (if developers want to use them)
export { API } from './api';
export { AnalyticsManager } from './analytics';
export { resolveTemplate, evaluateCondition, resolveDestination } from './variableUtils';
