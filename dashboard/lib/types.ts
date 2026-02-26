export interface Organization {
  id: string
  name: string
  plan: 'free' | 'starter' | 'pro' | 'scale' | 'enterprise'
  test_api_key: string
  production_api_key: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  subscription_status?: string
  screenshot_analyses_this_month: number
  screenshot_analyses_limit: number
  onboarding_completed: boolean
  company_size?: string
  user_role?: string
  referral_source?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  organization_id: string
  name: string
  platform: 'ios' | 'android' | 'cross_platform'
  bundle_id?: string
  test_api_key: string
  production_api_key: string
  revenuecat_api_key?: string
  superwall_api_key?: string
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  name: string
  type: 'image' | 'video' | 'lottie'
  data: string
  createdAt: number
}

export interface OnboardingConfig {
  id: string
  organization_id: string
  project_id?: string
  name: string
  version: string
  is_published: boolean
  config: {
    version: string
    screens: Screen[]
    assets?: Asset[]
  }
  created_at: string
  updated_at: string
}

export interface Screen {
  id: string
  type: ScreenType
  props: Record<string, any>
  // For noboard_screen type
  layout?: NoboardScreenLayout
  elements?: Element[]
  // For AI-generated screens
  aiGenerated?: boolean
  // For custom_screen type (developer components)
  custom_component_name?: string
  custom_description?: string
  custom_variables?: string[]  // Variable names provided by this custom screen
  // Visibility
  hidden?: boolean
  // Reference image for AI builder (design mockup/inspiration)
  referenceImageUrl?: string
  referenceImageData?: string  // base64 data URL
}

export type ScreenType = 'noboard_screen' | 'custom_screen'

// Visual Builder Types
export interface NoboardScreenLayout {
  backgroundColor?: string
  padding?: number | { top: number; right: number; bottom: number; left: number }
  safeArea?: boolean
}

export interface Element {
  id: string
  type: ElementType
  style: ElementStyle
  props: Record<string, any>
  children?: Element[]
  position?: ElementPosition
  action?: ElementAction
  actions?: ElementAction[]       // multi-action support (runs all in sequence)
  visibleWhen?: { group: string; hasSelection: boolean }
  conditions?: ElementConditions  // variable-based show/hide
}

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
  | 'divider'

// ─── Condition & Variable Types ───

export type ComparisonOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'is_empty' | 'is_not_empty'

export interface Condition {
  variable?: string
  operator?: ComparisonOperator
  value?: any
  all?: Condition[]    // AND — all must be true
  any?: Condition[]    // OR — at least one must be true
  not?: Condition      // NOT — negate
}

export interface ElementConditions {
  show_if?: Condition
}

export interface ConditionalDestination {
  if: Condition
  then: string
  else?: string | ConditionalDestination
}

export interface ConditionalRoutes {
  routes: Array<{ condition: Condition; destination: string }>
  default: string
}

// ─── Element Action ───

export interface ElementAction {
  type: 'tap' | 'navigate' | 'link' | 'toggle' | 'dismiss' | 'set_variable'
  destination?: string | ConditionalDestination | ConditionalRoutes  // screen ID, URL, or conditional
  group?: string  // selection group name for single-select toggles
  variable?: string  // for set_variable: variable name to set
  value?: any        // for set_variable: value to assign
}

export interface ElementPosition {
  type?: 'relative' | 'absolute'
  top?: number
  left?: number
  right?: number
  bottom?: number
  centerX?: boolean
  centerY?: boolean
  zIndex?: number
}

export interface ElementStyle {
  // Layout (Flexbox)
  flex?: number
  flexDirection?: 'row' | 'column'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  gap?: number
  wrap?: boolean // Whether flex items should wrap
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  scroll?: boolean // Whether container is scrollable

  // Spacing
  margin?: number | { top: number; right: number; bottom: number; left: number }
  padding?: number | { top: number; right: number; bottom: number; left: number }

  // Dimensions
  width?: number | string
  height?: number | string
  maxWidth?: number
  maxHeight?: number

  // Visual
  backgroundColor?: string
  backgroundGradient?: {
    type: 'linear' | 'radial'
    angle?: number // For linear gradients (in degrees)
    colors: Array<{ color: string; position: number }> // position 0-100
  }
  opacity?: number
  hidden?: boolean // Visibility

  // Border
  borderRadius?: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number }
  borderWidth?: number
  borderColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted'

  // Shadow
  shadowColor?: string
  shadowOpacity?: number
  shadowRadius?: number
  shadowOffsetX?: number
  shadowOffsetY?: number

  // Animations & Transforms
  animation?: {
    property?: 'opacity' | 'transform' | 'all'
    duration?: number // in seconds
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
    delay?: number // in seconds
  }
  transform?: {
    translateX?: number // in px
    translateY?: number // in px
    rotate?: number // in degrees
    scale?: number // 0-2 (1 = 100%)
  }
  blur?: number // in px
  backdropBlur?: number // Background blur in px

  // Text
  color?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  lineHeight?: number // multiplier (1.5 = 150%)
  letterSpacing?: number // in px
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textDecoration?: 'none' | 'underline' | 'line-through'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]        // base64 data URLs (user messages only)
  elements?: Element[]     // screen elements snapshot (assistant messages only)
  timestamp: number
}

export interface AnalyticsEvent {
  id: string
  organization_id: string
  event_name: string
  user_id: string
  session_id: string
  screen_id?: string
  properties: Record<string, any>
  timestamp: string
}

// ─── A/B Testing Types ───

export type ExperimentStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface ExperimentVariant {
  variant_id: string
  name: string
  weight: number
  config_id: string        // references an onboarding_configs.id
  config_name?: string     // denormalized for display
}

export interface Experiment {
  id: string
  organization_id: string
  project_id?: string
  name: string
  status: ExperimentStatus
  traffic_allocation: number
  variants: ExperimentVariant[]
  primary_metric: string
  secondary_metrics: string[]
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}
