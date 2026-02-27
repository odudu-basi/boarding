import mixpanel from 'mixpanel-browser'

// Initialize Mixpanel
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || 'fd9a8dbdb5d0dbae58f8dc26d4ad4bc4'

if (typeof window !== 'undefined') {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: false, // We'll manually track page views
    persistence: 'localStorage',
  })
}

// ── User Identity ──────────────────────────────────────────────────────
export const identifyUser = (userId: string, properties: Record<string, any>) => {
  if (typeof window === 'undefined') return

  mixpanel.identify(userId)
  mixpanel.people.set(properties)
}

export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined') return

  mixpanel.people.set(properties)
}

export const incrementUserProperty = (property: string, incrementBy: number = 1) => {
  if (typeof window === 'undefined') return

  mixpanel.people.increment(property, incrementBy)
}

// ── Event Tracking ──────────────────────────────────────────────────────

export const track = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return

  mixpanel.track(eventName, properties)
}

// ── Authentication Events ──────────────────────────────────────────────
export const trackSignupStarted = (referrerUrl?: string) => {
  track('auth_signup_started', {
    referrer_url: referrerUrl || document.referrer,
  })
}

export const trackSignupCompleted = (email: string, organizationName: string) => {
  track('auth_signup_completed', {
    email,
    organization_name: organizationName,
  })
}

export const trackLoginCompleted = (email: string) => {
  track('auth_login_completed', {
    email,
  })
}

// ── Onboarding Wizard Events ───────────────────────────────────────────
export const trackOnboardingWizardStarted = () => {
  track('onboarding_wizard_started')
}

export const trackOnboardingWizardStepCompleted = (stepNumber: number, stepName: string) => {
  track('onboarding_wizard_step_completed', {
    step_number: stepNumber,
    step_name: stepName,
  })
}

export const trackOnboardingWizardCompleted = (timeToCompleteSeconds: number) => {
  track('onboarding_wizard_completed', {
    time_to_complete_seconds: timeToCompleteSeconds,
  })
}

export const trackOnboardingWizardSkipped = (atStep: number) => {
  track('onboarding_wizard_skipped', {
    at_step: atStep,
  })
}

// ── Flow Events ─────────────────────────────────────────────────────────
export const trackFlowCreated = (projectId: string, projectPlatform: string) => {
  track('flow_created', {
    project_id: projectId,
    project_platform: projectPlatform,
  })
}

export const trackFlowPublished = (flowId: string, screenCount: number, customScreenCount: number, hasAiScreens: boolean) => {
  track('flow_published', {
    flow_id: flowId,
    screen_count: screenCount,
    custom_screen_count: customScreenCount,
    has_ai_screens: hasAiScreens,
  })
}

export const trackFlowDeleted = (flowId: string, screenCount: number, wasPublished: boolean) => {
  track('flow_deleted', {
    flow_id: flowId,
    screen_count: screenCount,
    was_published: wasPublished,
  })
}

export const trackFlowDuplicated = (sourceFlowId: string, newFlowId: string) => {
  track('flow_duplicated', {
    source_flow_id: sourceFlowId,
    new_flow_id: newFlowId,
  })
}

// ── Screen Building Events ──────────────────────────────────────────────
export const trackScreenAiChatOpened = (screenId: string, isNewScreen: boolean) => {
  track('screen_ai_chat_opened', {
    screen_id: screenId,
    is_new_screen: isNewScreen,
  })
}

export const trackScreenAiMessageSent = (screenId: string, messageLength: number, isFirstMessage: boolean, conversationTurn: number) => {
  track('screen_ai_message_sent', {
    screen_id: screenId,
    message_length: messageLength,
    is_first_message: isFirstMessage,
    conversation_turn: conversationTurn,
  })
}

export const trackScreenAiGeneratedSuccess = (
  screenId: string,
  promptTokens: number,
  completionTokens: number,
  generationTimeMs: number,
  hasImageSlots: boolean
) => {
  track('screen_ai_generated_success', {
    screen_id: screenId,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    generation_time_ms: generationTimeMs,
    has_image_slots: hasImageSlots,
  })
}

export const trackScreenAiGeneratedError = (screenId: string, errorType: string) => {
  track('screen_ai_generated_error', {
    screen_id: screenId,
    error_type: errorType,
  })
}

export const trackScreenCustomAdded = (flowId: string, componentName: string) => {
  track('screen_custom_added', {
    flow_id: flowId,
    component_name: componentName,
  })
}

// ── SDK Integration Events ──────────────────────────────────────────────
export const trackSdkDocsViewed = (section: string) => {
  track('sdk_docs_viewed', {
    section,
  })
}

export const trackSdkApiKeyCopied = (keyType: 'test' | 'production', projectId?: string) => {
  track('sdk_api_key_copied', {
    key_type: keyType,
    project_id: projectId,
  })
}

// ── A/B Testing Events ──────────────────────────────────────────────────
export const trackExperimentCreated = (experimentId: string, variantCount: number) => {
  track('experiment_created', {
    experiment_id: experimentId,
    variant_count: variantCount,
  })
}

export const trackExperimentStarted = (experimentId: string, variantCount: number, totalTrafficPercentage: number) => {
  track('experiment_started', {
    experiment_id: experimentId,
    variant_count: variantCount,
    total_traffic_percentage: totalTrafficPercentage,
  })
}

export const trackExperimentPaused = (experimentId: string, runningDurationHours: number) => {
  track('experiment_paused', {
    experiment_id: experimentId,
    running_duration_hours: runningDurationHours,
  })
}

// ── Analytics Events ────────────────────────────────────────────────────
export const trackAnalyticsPageViewed = (projectId: string, hasData: boolean) => {
  track('analytics_page_viewed', {
    project_id: projectId,
    has_data: hasData,
  })
}

export const trackAnalyticsPaywallSetupClicked = (userPlan: string) => {
  track('analytics_paywall_setup_clicked', {
    user_plan: userPlan,
  })
}

// ── Monetization Events ─────────────────────────────────────────────────
export const trackPricingPageViewed = (currentPlan: string, referrerPage: string) => {
  track('pricing_page_viewed', {
    current_plan: currentPlan,
    referrer_page: referrerPage,
  })
}

export const trackPricingPlanSelected = (planSelected: string, credits: number, price: number) => {
  track('pricing_plan_selected', {
    plan_selected: planSelected,
    credits,
    price,
  })
}

export const trackCheckoutStarted = (plan: string, price: number, credits: number) => {
  track('checkout_started', {
    plan,
    price,
    credits,
  })
}

export const trackSubscriptionActivated = (plan: string, price: number, stripeSubscriptionId: string) => {
  track('subscription_activated', {
    plan,
    price,
    stripe_subscription_id: stripeSubscriptionId,
  })
}

// ── Project Events ──────────────────────────────────────────────────────
export const trackProjectCreated = (projectId: string, platform: string, organizationId: string) => {
  track('project_created', {
    project_id: projectId,
    platform,
    organization_id: organizationId,
  })
}

export const trackProjectSwitched = (fromProjectId: string, toProjectId: string) => {
  track('project_switched', {
    from_project_id: fromProjectId,
    to_project_id: toProjectId,
  })
}

// ── Generic Helper ──────────────────────────────────────────────────────
export const mixpanelAnalytics = {
  identify: identifyUser,
  setProperties: setUserProperties,
  increment: incrementUserProperty,
  track,
}

export default mixpanelAnalytics
