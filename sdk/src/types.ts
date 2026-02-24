import type React from 'react';

// Screen component types
export type ScreenType = 'noboard_screen' | 'custom_screen';

// Screen configuration from remote
export interface ScreenConfig {
  id: string;
  type: ScreenType;
  props: Record<string, any>;
  // For noboard_screen type — the element tree from the AI builder
  elements?: ElementNode[];
  // For custom_screen type — name of the developer-registered component
  custom_component_name?: string;
  // Dashboard visibility control — if true, screen is hidden from onboarding flow
  hidden?: boolean;
}

// ─── Element Tree Types (matches dashboard primitives) ───

export type ElementType =
  // Containers (have children)
  | 'vstack'
  | 'hstack'
  | 'zstack'
  | 'scrollview'
  // Content (leaf elements)
  | 'text'
  | 'image'
  | 'video'
  | 'lottie'
  | 'icon'
  | 'input'
  | 'spacer'
  | 'divider';

export interface ElementNode {
  id: string;
  type: ElementType;
  style: ElementStyle;
  props: Record<string, any>;
  children?: ElementNode[];
  position?: ElementPosition;
  action?: ElementAction;
  actions?: ElementAction[];       // multi-action support (runs all in sequence)
  visibleWhen?: { group: string; hasSelection: boolean };
  conditions?: ElementConditions;  // variable-based show/hide
}

// ─── Condition & Variable Types ───

export type ComparisonOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'is_empty' | 'is_not_empty';

export interface Condition {
  variable?: string;
  operator?: ComparisonOperator;
  value?: any;
  all?: Condition[];    // AND — all must be true
  any?: Condition[];    // OR — at least one must be true
  not?: Condition;      // NOT — negate
}

export interface ElementConditions {
  show_if?: Condition;
}

export interface ConditionalDestination {
  if: Condition;
  then: string;
  else?: string | ConditionalDestination;
}

export interface ConditionalRoutes {
  routes: Array<{ condition: Condition; destination: string }>;
  default: string;
}

// ─── Element Action ───

export interface ElementAction {
  type: 'tap' | 'navigate' | 'link' | 'toggle' | 'dismiss' | 'set_variable';
  destination?: string | ConditionalDestination | ConditionalRoutes; // screen ID, URL, or conditional
  group?: string; // selection group name for single-select toggles
  variable?: string; // for set_variable: variable name to set
  value?: any;       // for set_variable: value to assign
}

export interface ElementPosition {
  type?: 'relative' | 'absolute';
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  centerX?: boolean;
  centerY?: boolean;
  zIndex?: number;
}

export interface ElementStyle {
  // Layout
  flex?: number;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  alignSelf?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: number;
  flexWrap?: 'wrap' | 'nowrap';
  overflow?: 'visible' | 'hidden' | 'scroll';

  // Spacing
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;

  // Size
  width?: number | string;
  height?: number | string;
  maxWidth?: number;
  minHeight?: number | string;

  // Visual
  backgroundColor?: string;
  backgroundGradient?: {
    type: 'linear' | 'radial';
    angle?: number;
    colors: Array<{ color: string; position: number }>;
  };
  opacity?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderBottomWidth?: number;
  borderBottomColor?: string;

  // Shadow
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Text
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecorationLine?: 'none' | 'underline' | 'line-through';
}

// Onboarding configuration from API
export interface OnboardingConfig {
  version: string;
  screens: ScreenConfig[];
}

// Experiment/A/B test variant
export interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
}

export interface Variant {
  variant_id: string;
  weight: number;
  name: string;
  screens: ScreenConfig[];
}

// Analytics event
export interface AnalyticsEvent {
  event: string;
  user_id: string;
  session_id: string;
  timestamp: number;
  properties?: Record<string, any>;
}

// API response types
export interface GetConfigResponse {
  config: OnboardingConfig;
  version: string;
  config_id: string | null;
  experiments: Experiment[];
  organization_id: string;
}

export interface TrackEventsResponse {
  success: boolean;
  inserted: number;
}

export interface AssignVariantResponse {
  variant_id: string;
  variant_config: {
    screens: ScreenConfig[];
  };
  cached: boolean;
}

// Component props
export interface BaseComponentProps {
  id: string;
  analytics: Analytics;
  onNext: (data?: Record<string, any>) => void;
  onSkip?: () => void;
}

// Analytics class interface
export interface Analytics {
  track(eventName: string, properties?: Record<string, any>): void;
  flush(): Promise<void>;
}

// Props interface for developer-registered custom screen components
export interface CustomScreenProps {
  analytics: {
    track: (event: string, properties?: Record<string, any>) => void;
  };
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  preview?: boolean;
  data?: Record<string, any>;
  onDataUpdate?: (data: Record<string, any>) => void;
}

// Main SDK props
export interface OnboardingFlowProps {
  // Option 1: Auto-detection with dual keys (recommended)
  testKey?: string;        // nb_test_... key for development/testing
  productionKey?: string;  // nb_live_... key for production

  // Option 2: Legacy single key (backwards compatible)
  apiKey?: string;

  onComplete: (data?: Record<string, any>) => void;
  onSkip?: () => void;
  baseUrl?: string;
  initialVariables?: Record<string, any>; // seed the variable store
  customComponents?: Record<string, React.ComponentType<CustomScreenProps>>;
  onUserIdGenerated?: (userId: string) => void; // Called when user ID is generated for analytics
}
