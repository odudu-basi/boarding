'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, Heading, Text } from '@/components/ui'
import { theme } from '@/lib/theme'
import type { CustomScreenInfo } from './page'
import { trackSdkDocsViewed, trackSdkApiKeyCopied } from '@/lib/mixpanel'

// ── Types ──────────────────────────────────────────────────────────────

type Section =
  | 'quick-start'
  | 'ai-setup'
  | 'installation'
  | 'custom-screens'
  | 'variables'
  | 'revenuecat'
  | 'ab-testing'
  | 'sdk-reference'

interface NavGroup {
  label: string
  items: { id: Section; label: string }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Getting Started',
    items: [
      { id: 'quick-start', label: 'Quick Start' },
      { id: 'ai-setup', label: 'AI Setup' },
    ],
  },
  {
    label: 'Integration',
    items: [
      { id: 'installation', label: 'Installation & Setup' },
      { id: 'custom-screens', label: 'Custom Screens' },
      { id: 'variables', label: 'Variables & Conditions' },
    ],
  },
  {
    label: 'Monetization',
    items: [{ id: 'revenuecat', label: 'RevenueCat' }],
  },
  {
    label: 'Optimization',
    items: [{ id: 'ab-testing', label: 'A/B Testing' }],
  },
  {
    label: 'Reference',
    items: [{ id: 'sdk-reference', label: 'SDK Reference' }],
  },
]

// ── Shared Styles ──────────────────────────────────────────────────────

const codeBlockStyle: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  color: '#e5e5e5',
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.md,
  overflow: 'auto',
  fontFamily: theme.fonts.mono,
  fontSize: theme.fontSizes.sm,
  whiteSpace: 'pre-wrap',
  lineHeight: 1.6,
  margin: 0,
}

const inlineCodeStyle: React.CSSProperties = {
  backgroundColor: theme.colors.background,
  padding: '2px 6px',
  borderRadius: '4px',
  fontFamily: theme.fonts.mono,
  fontSize: theme.fontSizes.sm,
  color: theme.colors.primary,
}

const sectionGap: React.CSSProperties = {
  marginBottom: theme.spacing.lg,
}

const listItemStyle: React.CSSProperties = {
  marginBottom: theme.spacing.sm,
  lineHeight: 1.6,
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: theme.fontSizes.sm,
  fontFamily: theme.fonts.sans,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  borderBottom: `2px solid ${theme.colors.border}`,
  fontWeight: '600',
  color: theme.colors.text,
  fontSize: theme.fontSizes.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  borderBottom: `1px solid ${theme.colors.border}`,
  color: theme.colors.text,
  verticalAlign: 'top',
}

// ── Callout helper ─────────────────────────────────────────────────────

function Callout({ color, children }: { color: 'blue' | 'red' | 'green' | 'purple' | 'amber'; children: React.ReactNode }) {
  const palette: Record<string, { bg: string; border: string }> = {
    blue: { bg: '#f0f9ff', border: '#3b82f6' },
    red: { bg: '#fef2f2', border: '#ef4444' },
    green: { bg: '#f0fdf4', border: '#22c55e' },
    purple: { bg: '#faf5ff', border: '#8b5cf6' },
    amber: { bg: '#fef3c7', border: '#f59e0b' },
  }
  const p = palette[color]
  return (
    <Card padding="lg" style={{ marginBottom: theme.spacing.xl, backgroundColor: p.bg, borderLeft: `4px solid ${p.border}` }}>
      {children}
    </Card>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

interface DocsContentProps {
  testApiKey: string
  productionApiKey: string
  customScreens: CustomScreenInfo[]
  isAuthenticated: boolean
}

export function DocsContent({ testApiKey, productionApiKey, customScreens, isAuthenticated }: DocsContentProps) {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<Section>('quick-start')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)

  // Handle URL query parameter for direct navigation
  useEffect(() => {
    const section = searchParams.get('section')
    if (section && ['quick-start', 'ai-setup', 'installation', 'custom-screens', 'variables', 'revenuecat', 'ab-testing', 'sdk-reference'].includes(section)) {
      setActiveSection(section as Section)
    }
  }, [searchParams])

  // Track section views
  useEffect(() => {
    trackSdkDocsViewed(activeSection)
  }, [activeSection])

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return NAV_GROUPS
    const q = searchQuery.toLowerCase()
    return NAV_GROUPS
      .map(g => ({
        ...g,
        items: g.items.filter(i => i.label.toLowerCase().includes(q)),
      }))
      .filter(g => g.items.length > 0)
  }, [searchQuery])

  const copyPrompt = () => {
    const prompt = buildAIPrompt()
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start': return <QuickStartSection onNavigate={setActiveSection} />
      case 'ai-setup': return <AISetupSection onCopy={copyPrompt} copied={copied} />
      case 'installation': return <InstallationSection testApiKey={testApiKey} productionApiKey={productionApiKey} isAuthenticated={isAuthenticated} />
      case 'custom-screens': return <CustomScreensSection />
      case 'variables': return <VariablesSection />
      case 'revenuecat': return <RevenueCatSection />
      case 'ab-testing': return <ABTestingSection />
      case 'sdk-reference': return <SDKReferenceSection />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Dark Sidebar ── */}
      <aside style={{
        width: 280,
        minWidth: 280,
        backgroundColor: '#1a1a1a',
        padding: `${theme.spacing.xl} 0`,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: `0 ${theme.spacing.lg}`, marginBottom: theme.spacing.lg }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h2 style={{
              fontSize: theme.fontSizes.xl,
              fontWeight: '700',
              color: theme.colors.primary,
              fontFamily: theme.fonts.serif,
              fontStyle: 'italic',
              margin: 0,
            }}>
              Noboarding
            </h2>
          </a>
          <p style={{
            fontSize: theme.fontSizes.sm,
            color: '#999',
            margin: `${theme.spacing.xs} 0 0`,
            fontFamily: theme.fonts.sans,
          }}>
            Documentation
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: `0 ${theme.spacing.lg}`, marginBottom: theme.spacing.lg }}>
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: theme.borderRadius.sm,
              color: '#e5e5e5',
              fontSize: theme.fontSizes.sm,
              fontFamily: theme.fonts.sans,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Navigation Groups */}
        <nav style={{ flex: 1 }}>
          {filteredGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label)
            return (
              <div key={group.label} style={{ marginBottom: theme.spacing.md }}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
                    fontSize: theme.fontSizes.xs,
                    fontWeight: '600',
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: theme.fonts.sans,
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    transition: 'transform 0.15s ease',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    fontSize: '10px',
                  }}>
                    ▼
                  </span>
                  {group.label}
                </button>

                {/* Group Items */}
                {!isCollapsed && group.items.map((item) => {
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: `6px ${theme.spacing.lg} 6px 2.5rem`,
                        backgroundColor: isActive ? 'rgba(242,101,34,0.1)' : 'transparent',
                        border: 'none',
                        borderLeft: isActive ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: theme.fontSizes.sm,
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? theme.colors.primary : '#ccc',
                        transition: 'all 0.15s ease',
                        fontFamily: theme.fonts.sans,
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* ── Content Area ── */}
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: theme.colors.background }}>
        <div style={{ maxWidth: 800, padding: `${theme.spacing.xl} ${theme.spacing['2xl']}`, paddingBottom: '4rem' }}>
          {renderSection()}
        </div>
      </main>
    </div>
  )
}

// ── AI Prompt Builder ──────────────────────────────────────────────────

function buildAIPrompt(): string {
  return `I need help integrating the Noboarding SDK into my React Native / Expo app. Noboarding is a server-driven onboarding SDK — I design my onboarding screens in a web dashboard, and the SDK renders them natively in my app. No app update needed to change screens.

## Before You Start — Ask Me These Questions

Before writing any code, please ask me the following questions so you can tailor the integration to my app:

1. **What package manager do you use?** (npm, yarn, or bun)
2. **What are your Noboarding API keys?** (You can find them in the Noboarding dashboard under Settings. You need a Test Key starting with nb_test_ and a Production Key starting with nb_live_.)
3. **Do you have a notification/permissions screen in your onboarding flow?** (e.g. asking for push notification permission, camera access, etc.) If yes, we'll create a custom screen component for it.
4. **Do you have a sign-in or sign-up screen in your onboarding flow?** If yes, we'll create a custom screen component that integrates with my auth provider.
5. **Would you like to connect a paywall to your onboarding flow?** If yes, I'll need RevenueCat set up. We'll create a PaywallScreen custom component and configure the webhook for conversion tracking.
6. **Do you have any other custom screens** that need native code (e.g. a survey, a profile setup form, a fitness tracker connection)? If yes, describe each one.

Wait for my answers before proceeding. Then follow the steps below based on what I need.

---

## My Noboarding API Keys

- Test API Key (for development): [YOUR_NB_TEST_KEY]
- Production API Key (for production): [YOUR_NB_LIVE_KEY]

(Get these from the Noboarding dashboard → Settings page)

---

## Step 1: Install the Noboarding SDK

Install the SDK and its peer dependency:

\`\`\`bash
npm install noboarding @react-native-async-storage/async-storage
\`\`\`

---

## Step 2: Add OnboardingFlow to My App

Wrap my app's entry point with the OnboardingFlow component. Here's the basic setup:

\`\`\`tsx
import { OnboardingFlow } from 'noboarding';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <OnboardingFlow
        testKey="[YOUR_NB_TEST_KEY]"
        productionKey="[YOUR_NB_LIVE_KEY]"
        onComplete={(userData) => {
          // userData contains all collected data from the flow
          // userData._variables has all variable values
          console.log('Onboarding complete:', userData);
          setShowOnboarding(false);
        }}
        onSkip={() => {
          setShowOnboarding(false);
        }}
        // Add customComponents here if I have custom screens (see below)
        // Add onUserIdGenerated here if using RevenueCat (see below)
      />
    );
  }

  return <MyMainApp />;
}
\`\`\`

**How it works:**
- The SDK automatically uses \`testKey\` when \`__DEV__ === true\` (dev mode) and \`productionKey\` when \`__DEV__ === false\` (production builds).
- The onboarding screens are designed in the Noboarding web dashboard — no screen code is written here. The SDK fetches and renders them natively.

---

## Step 3: Custom Screen Components (If Needed)

Custom screens are React Native components that I build and register with the SDK. They're used for anything the visual dashboard builder can't handle — paywalls, sign-in forms, permission prompts, etc.

Every custom screen receives these props:

\`\`\`tsx
import { CustomScreenProps } from 'noboarding';

interface CustomScreenProps {
  analytics: { track: (event: string, properties?: Record<string, any>) => void };
  onNext: () => void;          // Go to next screen
  onBack?: () => void;         // Go to previous screen
  onSkip?: () => void;         // Skip entire onboarding
  preview?: boolean;           // true when rendering in the dashboard preview
  data?: Record<string, any>;  // Data from previous screens
  onDataUpdate?: (data: Record<string, any>) => void; // Pass data to next screens
}
\`\`\`

Register custom screens like this:

\`\`\`tsx
<OnboardingFlow
  testKey="..."
  productionKey="..."
  customComponents={{
    PaywallScreen: PaywallScreen,       // key must EXACTLY match the name in the dashboard
    NotificationScreen: NotificationScreen,
    SignUpScreen: SignUpScreen,
  }}
  onComplete={(userData) => { ... }}
/>
\`\`\`

**Important:** The key name (e.g. \`PaywallScreen\`) must exactly match the component name entered in the Noboarding dashboard. It is case-sensitive.

### If the user wants a Paywall Screen (RevenueCat):

Create a PaywallScreen component that:
- Imports \`CustomScreenProps\` from \`noboarding\`
- Imports \`Purchases\` from \`react-native-purchases\`
- Tracks these analytics events: \`paywall_viewed\` (on mount), \`paywall_loaded\` (offerings loaded), \`paywall_purchase_started\`, \`paywall_conversion\` (success), \`paywall_purchase_failed\`, \`paywall_dismissed\` (skip)
- Shows placeholder UI when \`preview === true\` (dashboard can't run native purchases)
- Loads offerings via \`Purchases.getOfferings()\`
- Handles purchase via \`Purchases.purchasePackage(pkg)\`
- Calls \`onDataUpdate?.({ premium: true })\` on successful purchase
- Calls \`onNext()\` after purchase to continue the flow
- Has a "Restore Purchases" button
- Has a skip/dismiss option

### If the user wants a Notification/Permission Screen:

Create a component that:
- Requests the relevant permission (push notifications, camera, etc.)
- Tracks \`notification_permission_granted\` or \`notification_permission_denied\`
- Calls \`onNext()\` after the user responds
- Shows a placeholder in preview mode

### If the user wants a Sign-In/Sign-Up Screen:

Create a component that:
- Integrates with their existing auth provider
- Tracks \`signup_completed\` or \`login_completed\`
- Calls \`onDataUpdate?.({ userId: user.id })\` to pass the user ID forward
- Calls \`onNext()\` after successful auth

---

## Step 4: RevenueCat Integration (If Using Paywall)

If the user wants paywall support, configure RevenueCat:

### 4a. Install RevenueCat SDK
\`\`\`bash
npm install react-native-purchases
# iOS: cd ios && pod install
\`\`\`

### 4b. Configure RevenueCat in App
\`\`\`tsx
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

useEffect(() => {
  Purchases.configure({
    apiKey: Platform.OS === 'ios' ? 'appl_YOUR_IOS_KEY' : 'goog_YOUR_ANDROID_KEY',
  });
}, []);
\`\`\`
Ask the user for their RevenueCat API keys if they haven't provided them.

### 4c. CRITICAL — Sync User IDs
Add the \`onUserIdGenerated\` callback so Noboarding and RevenueCat share the same user ID. Without this, conversion tracking and A/B test attribution will not work:

\`\`\`tsx
<OnboardingFlow
  testKey="..."
  productionKey="..."
  onUserIdGenerated={(userId) => {
    Purchases.logIn(userId); // Syncs Noboarding user ID with RevenueCat
  }}
  customComponents={{ PaywallScreen }}
  onComplete={(userData) => { ... }}
/>
\`\`\`

### 4d. Configure RevenueCat Webhook
Tell the user to set up a webhook in their RevenueCat dashboard so Noboarding receives purchase events:

1. Go to RevenueCat Dashboard → Integrations → Webhooks
2. Click "Add New Webhook"
3. Webhook URL: \`https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1/revenuecat-webhook\`
4. Authorization header: \`Bearer c3373PFzv9wPpISOu5XFz22zABeLjpzYwGqmclXR60o=\`
5. Select events: INITIAL_PURCHASE, TRIAL_STARTED, RENEWAL, CANCELLATION
6. Save and send a test event

---

## Step 5: Dashboard Setup

After the code integration is complete, tell the user to:

1. Log in to the **Noboarding dashboard** (https://noboarding.com)
2. Create or open an onboarding flow
3. Design the SDK screens using the visual builder or AI builder
4. If they have custom screens: click **"Add Custom Screen"** and enter the exact component name (e.g. \`PaywallScreen\`)
5. Arrange screens in the desired order
6. Click **Publish → Publish for Testing** to make the flow available in development
7. Test in the app with \`npm start\` / \`npx expo start\`
8. When ready for production: **Publish → Publish to Production**

---

## SDK Analytics Events (Automatic)

These events are tracked automatically by the SDK — no code needed:

| Event | When |
|-------|------|
| onboarding_started | Flow loads and first screen appears |
| screen_viewed | User navigates to a new screen |
| screen_completed | User completes a screen |
| onboarding_completed | User reaches the end of the flow |
| onboarding_abandoned | User skips/dismisses the flow |

---

## Important Notes
- Use TypeScript for all files
- The SDK only works with React Native / Expo apps
- Follow React Native best practices with proper error handling and loading states
- Add comments explaining the onUserIdGenerated callback (it's critical for analytics)
- Ask me questions if anything about my app setup is unclear — don't make assumptions`
}

// ════════════════════════════════════════════════════════════════════════
//  SECTIONS
// ════════════════════════════════════════════════════════════════════════

// ── 1. Quick Start ─────────────────────────────────────────────────────

function QuickStartSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        Quick Start
      </Heading>
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Get Noboarding running in your React Native app in minutes
      </Text>

      <Callout color="blue">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          What is Noboarding?
        </Heading>
        <Text variant="muted">
          Noboarding is a server-driven onboarding SDK for React Native. Design your onboarding flow in the dashboard, and the SDK renders it natively in your app — no app update required to change screens, copy, or flow order.
        </Text>
      </Callout>

      {/* 3-Step Flow */}
      <div style={{ display: 'flex', gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
        {[
          { step: '1', title: 'Install', desc: 'Add the SDK and peer dependencies to your React Native project.', link: 'installation' as Section },
          { step: '2', title: 'Configure', desc: 'Add your API keys and wrap your app with OnboardingFlow.', link: 'installation' as Section },
          { step: '3', title: 'Ship', desc: 'Design flows in the dashboard, publish, and iterate over the air.', link: 'ai-setup' as Section },
        ].map((item) => (
          <button
            key={item.step}
            onClick={() => onNavigate(item.link)}
            style={{
              flex: 1,
              textAlign: 'left',
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.lg,
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
              fontFamily: theme.fonts.sans,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: theme.colors.primary, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: theme.fontSizes.sm,
              marginBottom: theme.spacing.sm,
            }}>
              {item.step}
            </div>
            <p style={{ fontWeight: '600', fontSize: theme.fontSizes.base, margin: `0 0 ${theme.spacing.xs}`, color: theme.colors.text }}>
              {item.title}
            </p>
            <p style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textMuted, margin: 0, lineHeight: 1.5 }}>
              {item.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Key Features */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Key Features
        </Heading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
          {[
            { title: 'Server-Driven UI', desc: 'Change screens, copy, and images without shipping app updates.' },
            { title: 'Custom Screens', desc: 'Register your own React Native components (paywalls, forms, etc.) alongside SDK screens.' },
            { title: 'A/B Testing', desc: 'Run experiments on different flow variants and measure conversion impact.' },
            { title: 'RevenueCat Integration', desc: 'Track paywall conversions and attribute revenue to onboarding variants.' },
            { title: 'Analytics', desc: 'Screen-by-screen funnel, completion rates, and drop-off analysis.' },
            { title: 'Dual Environments', desc: 'Separate test and production flows with auto-detection via __DEV__.' },
          ].map((f) => (
            <Card key={f.title} padding="md">
              <p style={{ fontWeight: '600', margin: `0 0 ${theme.spacing.xs}`, color: theme.colors.text, fontSize: theme.fontSizes.sm }}>{f.title}</p>
              <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, lineHeight: 1.5 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Quick Links
        </Heading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {[
            { label: 'AI Setup — let your coding AI set everything up for you', target: 'ai-setup' as Section },
            { label: 'Installation & Setup — step-by-step manual integration', target: 'installation' as Section },
            { label: 'Custom Screens — build paywalls and custom components', target: 'custom-screens' as Section },
            { label: 'SDK Reference — all props, types, and events', target: 'sdk-reference' as Section },
          ].map((link) => (
            <button
              key={link.target}
              onClick={() => onNavigate(link.target)}
              style={{
                textAlign: 'left',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                color: theme.colors.primary,
                fontSize: theme.fontSizes.sm,
                fontFamily: theme.fonts.sans,
                transition: 'background-color 0.15s ease',
              }}
            >
              → {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 2. AI Setup ────────────────────────────────────────────────────────

function AISetupSection({
  onCopy,
  copied,
}: {
  onCopy: () => void
  copied: boolean
}) {
  const prompt = buildAIPrompt()

  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        AI Setup
      </Heading>
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Let your AI coding assistant set up Noboarding for you in minutes
      </Text>

      <Callout color="blue">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          How this works
        </Heading>
        <Text variant="muted">
          Copy the prompt below and paste it into your AI coding assistant (Claude Code, Cursor, GitHub Copilot, etc.). The AI will ask you a few questions about your app — like whether you need a paywall, notification permissions, or sign-up screen — then set up everything automatically based on your answers. It will also ask for your API keys, which you can find in the dashboard under Settings.
        </Text>
      </Callout>

      {/* Prompt Block */}
      <div style={sectionGap}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
          <Heading level={3} serif>
            Instructions for AI Assistant
          </Heading>
          <button
            onClick={onCopy}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              backgroundColor: copied ? '#22c55e' : theme.colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              fontSize: theme.fontSizes.sm,
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
              transition: 'background-color 0.15s ease',
              minWidth: 120,
            }}
          >
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
        </div>
        <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
          Copy everything in the box below and paste it into your AI coding assistant:
        </Text>
        <Card padding="none">
          <pre style={{ ...codeBlockStyle, maxHeight: 500, overflow: 'auto' }}>{prompt}</pre>
        </Card>
      </div>

      {/* What happens next */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          What Happens Next
        </Heading>
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          {[
            { step: '1', title: 'AI asks questions', desc: 'The AI will ask about your app — paywall, notifications, sign-up, etc. Answer based on what you need.' },
            { step: '2', title: 'AI writes the code', desc: 'Based on your answers, the AI installs the SDK, creates custom screen components, and wires everything up.' },
            { step: '3', title: 'Design in the dashboard', desc: 'Once the code is in place, open the Noboarding dashboard to design your onboarding screens and publish.' },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                flex: 1,
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                backgroundColor: theme.colors.primary, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: theme.fontSizes.sm,
                marginBottom: theme.spacing.sm,
              }}>
                {item.step}
              </div>
              <Text style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>{item.title}</Text>
              <Text variant="muted" size="sm">{item.desc}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 3. Installation & Setup ────────────────────────────────────────────

function InstallationSection({ testApiKey, productionApiKey, isAuthenticated }: { testApiKey: string; productionApiKey: string; isAuthenticated: boolean }) {
  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        Installation & Setup
      </Heading>

      {!isAuthenticated && (
        <Callout color="amber">
          <Text style={{ fontSize: theme.fontSizes.sm }}>
            📝 You're viewing placeholder API keys. <a href="/login" style={{ color: theme.colors.primary, fontWeight: '600', textDecoration: 'underline' }}>Log in</a> to see your real API keys pre-filled.
          </Text>
        </Callout>
      )}
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Step-by-step guide to manually integrate Noboarding into your app
      </Text>

      <Callout color="amber">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          Prefer an automated setup?
        </Heading>
        <Text variant="muted">
          If you use an AI coding assistant, check the <strong>AI Setup</strong> section — it generates a complete integration prompt with your API keys pre-filled.
        </Text>
      </Callout>

      {/* 1. Install */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          1. Install the SDK
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Install the Noboarding SDK:
        </Text>
        <Card padding="sm" style={{ marginBottom: theme.spacing.md }}>
          <pre style={codeBlockStyle}>{`npm install noboarding
# or
yarn add noboarding`}</pre>
        </Card>

        <Text style={{ marginBottom: theme.spacing.sm }}>
          Install peer dependencies:
        </Text>
        <Card padding="sm" style={{ marginBottom: theme.spacing.md }}>
          <pre style={codeBlockStyle}>{`npm install @react-native-async-storage/async-storage`}</pre>
        </Card>

        <Text style={{ marginBottom: theme.spacing.sm }}>
          For RevenueCat integration, also install:
        </Text>
        <Card padding="sm" style={{ marginBottom: theme.spacing.md }}>
          <pre style={codeBlockStyle}>{`npm install react-native-purchases`}</pre>
        </Card>

        <Text style={{ marginBottom: theme.spacing.sm }}>
          iOS setup:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`cd ios && pod install`}</pre>
        </Card>
      </div>

      {/* 2. API Keys */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          2. API Keys
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Noboarding uses separate API keys for test and production environments:
        </Text>
        <ul style={{ marginLeft: theme.spacing.lg, marginBottom: theme.spacing.md }}>
          <li style={listItemStyle}>
            <strong>Test Key</strong> (<code style={inlineCodeStyle}>{testApiKey || 'nb_test_...'}</code>): Used during development when <code style={inlineCodeStyle}>__DEV__</code> is true
          </li>
          <li style={listItemStyle}>
            <strong>Production Key</strong> (<code style={inlineCodeStyle}>{productionApiKey || 'nb_live_...'}</code>): Used in production builds when <code style={inlineCodeStyle}>__DEV__</code> is false
          </li>
        </ul>
        <Text variant="muted" size="sm">
          Find both keys in your dashboard: <a href="/settings" style={{ color: theme.colors.primary }}>Settings → API Keys</a>
        </Text>
      </div>

      {/* 3. Basic Integration */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          3. Basic Integration
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          In your <code style={inlineCodeStyle}>App.tsx</code>:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`import React, { useState } from 'react';
import { OnboardingFlow } from 'noboarding';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <OnboardingFlow
        testKey="${testApiKey || 'nb_test_your_test_key_here'}"
        productionKey="${productionApiKey || 'nb_live_your_production_key_here'}"
        // The SDK auto-detects: testKey in __DEV__, productionKey in production

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
}`}</pre>
        </Card>

        <Card padding="md" style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.background }}>
          <Text size="sm">
            The SDK automatically detects your environment. During development (when <code style={inlineCodeStyle}>__DEV__ === true</code>), it uses the test key. In production builds, it uses the production key.
          </Text>
        </Card>
      </div>

      {/* 4. RevenueCat */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          4. RevenueCat Configuration
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Initialize RevenueCat in your <code style={inlineCodeStyle}>App.tsx</code>:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export default function App() {
  useEffect(() => {
    Purchases.configure({
      apiKey: Platform.OS === 'ios'
        ? 'appl_YOUR_IOS_KEY'
        : 'goog_YOUR_ANDROID_KEY',
    });
  }, []);

  // Rest of your app...
}`}</pre>
        </Card>
      </div>

      {/* 5. User ID Sync */}
      <div style={sectionGap}>
        <Callout color="red">
          <Heading level={4} serif style={{ marginBottom: theme.spacing.sm }}>
            Critical: User ID Sync (Step 5)
          </Heading>
          <Text style={{ marginBottom: theme.spacing.sm }}>
            You <strong>must</strong> sync the user ID between Noboarding and RevenueCat for proper conversion attribution.
          </Text>
          <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
            <pre style={codeBlockStyle}>{`<OnboardingFlow
  testKey="${testApiKey || 'nb_test_...'}"
  productionKey="${productionApiKey || 'nb_live_...'}"
  // CRITICAL: Sync user ID with RevenueCat
  onUserIdGenerated={(userId) => {
    Purchases.logIn(userId);
  }}
  customComponents={{
    PaywallScreen: PaywallScreen,
  }}
/>`}</pre>
          </Card>
          <Text size="sm" style={{ marginTop: theme.spacing.sm }}>
            Without this, purchases won't be attributed to onboarding sessions and A/B test metrics will be incomplete.
          </Text>
        </Callout>
      </div>

      {/* 6. Testing */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          6. Testing
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Test locally with sandbox purchases:
        </Text>
        <Card padding="sm" style={{ marginBottom: theme.spacing.md }}>
          <pre style={codeBlockStyle}>{`npm start`}</pre>
        </Card>

        <Text style={{ marginBottom: theme.spacing.sm }}>
          Check your dashboard Analytics page for these events:
        </Text>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}><code style={inlineCodeStyle}>onboarding_started</code></li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>screen_viewed</code></li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>onboarding_completed</code></li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>paywall_viewed</code> (if using RevenueCat)</li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>paywall_conversion</code> (if using RevenueCat)</li>
        </ul>
      </div>

      {/* 7. Deployment */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          7. Deployment
        </Heading>
        <ol style={{ marginLeft: theme.spacing.lg, marginBottom: theme.spacing.md }}>
          <li style={listItemStyle}>Test your flow in development using the Test API Key</li>
          <li style={listItemStyle}>In the dashboard, click <strong>Publish → Publish for Testing</strong></li>
          <li style={listItemStyle}>Build production app</li>
          <li style={listItemStyle}>Submit to App Store / Google Play</li>
          <li style={listItemStyle}><strong>After app is live:</strong> click <strong>Publish → Publish to Production</strong></li>
        </ol>

        <Card padding="md" style={{ backgroundColor: theme.colors.background }}>
          <Text size="sm">
            <strong>Test vs Production:</strong> You can publish different flows to test and production environments. Your test key always fetches the test flow, and your production key fetches the production flow.
          </Text>
        </Card>
      </div>
    </div>
  )
}

// ── 4. Custom Screens ──────────────────────────────────────────────────

function CustomScreensSection() {
  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        Custom Screens
      </Heading>
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Build and register your own React Native components as onboarding screens
      </Text>

      <Callout color="green">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          When to use Custom Screens
        </Heading>
        <Text variant="muted">
          Use custom screens for paywalls, sign-up forms, permission prompts, or any screen that needs native code — anything the visual builder can't handle. Custom screens get the same analytics, navigation, and A/B testing as built-in screens.
        </Text>
      </Callout>

      {/* CustomScreenProps */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          CustomScreenProps Interface
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Every custom screen receives these props from the SDK:
        </Text>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Prop</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Required</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['analytics', '{ track: (event, props?) => void }', 'Yes', 'Track analytics events within your screen'],
                ['onNext', '() => void', 'Yes', 'Navigate to the next screen in the flow'],
                ['onBack', '() => void', 'No', 'Navigate to the previous screen (undefined if first screen)'],
                ['onSkip', '() => void', 'No', 'Skip the entire onboarding flow (undefined if onSkip not provided to OnboardingFlow)'],
                ['preview', 'boolean', 'No', 'True when rendering in the dashboard preview — show placeholder UI'],
                ['data', 'Record<string, any>', 'No', 'Collected data from previous screens'],
                ['onDataUpdate', '(data) => void', 'No', 'Pass data to subsequent screens (merged into collected data)'],
              ].map(([prop, type, req, desc], i) => (
                <tr key={prop} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.colors.background }}>
                  <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>{prop}</td>
                  <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>{type}</td>
                  <td style={tdStyle}>{req}</td>
                  <td style={tdStyle}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Registering a Custom Screen
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Pass your components to the <code style={inlineCodeStyle}>customComponents</code> prop. The key must exactly match the component name you enter in the dashboard.
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`import { OnboardingFlow } from 'noboarding';
import { PaywallScreen } from './screens/PaywallScreen';
import { SurveyScreen } from './screens/SurveyScreen';

<OnboardingFlow
  testKey="nb_test_..."
  productionKey="nb_live_..."
  customComponents={{
    PaywallScreen: PaywallScreen,   // key must match dashboard name
    SurveyScreen: SurveyScreen,
  }}
  onComplete={(userData) => {
    console.log('Complete:', userData);
  }}
/>`}</pre>
        </Card>
      </div>

      {/* Example */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Example: Paywall Screen
        </Heading>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`import { CustomScreenProps } from 'noboarding';
import Purchases from 'react-native-purchases';

export function PaywallScreen({
  analytics,
  onNext,
  onSkip,
  onDataUpdate,
  preview,
}: CustomScreenProps) {

  // Track paywall view
  useEffect(() => {
    analytics.track('paywall_viewed');
  }, []);

  // Load offerings
  useEffect(() => {
    async function loadOfferings() {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setPackages(offerings.current.availablePackages);
        analytics.track('paywall_loaded');
      }
    }
    if (!preview) loadOfferings();
  }, []);

  // Handle purchase
  const handlePurchase = async (pkg) => {
    analytics.track('paywall_purchase_started');
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPremium = customerInfo.entitlements.active['premium'];
      if (isPremium) {
        analytics.track('paywall_conversion');
        onDataUpdate?.({ premium: true });
        onNext();
      }
    } catch (e) {
      analytics.track('paywall_purchase_failed');
    }
  };

  // Show placeholder in dashboard preview
  if (preview) {
    return <View><Text>Paywall Preview</Text></View>;
  }

  // ... render your paywall UI
}`}</pre>
        </Card>
      </div>

      {/* Preview Mode */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Preview Mode
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          The <code style={inlineCodeStyle}>preview</code> prop is <code style={inlineCodeStyle}>true</code> when your component renders inside the Noboarding dashboard. Use it to show placeholder UI since native APIs (RevenueCat, camera, etc.) won't be available.
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`if (preview) {
  return (
    <View style={styles.previewContainer}>
      <Text>Paywall Preview</Text>
      <Text>Subscription options will appear here</Text>
    </View>
  );
}`}</pre>
        </Card>
      </div>

      {/* Name Matching */}
      <Callout color="amber">
        <Heading level={4} serif style={{ marginBottom: theme.spacing.sm }}>
          Name Matching
        </Heading>
        <Text variant="muted" size="sm">
          The key in <code style={inlineCodeStyle}>customComponents</code> must <strong>exactly</strong> match the component name you enter in the Noboarding dashboard. If you register <code style={inlineCodeStyle}>PaywallScreen</code> in code, enter exactly <code style={inlineCodeStyle}>PaywallScreen</code> in the dashboard — it's case-sensitive.
        </Text>
      </Callout>
    </div>
  )
}

// ── 5. Variables & Conditions ──────────────────────────────────────────

function VariablesSection() {
  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        Variables & Conditions
      </Heading>
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Store user choices, personalize content, and create branching flows — no app update needed
      </Text>

      <Callout color="purple">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          What are variables?
        </Heading>
        <Text variant="muted">
          Think of variables as sticky notes attached to your onboarding flow. When a user taps "I'm a beginner" on Screen 1, you can save that choice as a variable (e.g. <code style={inlineCodeStyle}>experience = "beginner"</code>). Later screens can read that variable to show personalized content, or your flow can branch to a completely different path based on the value.
        </Text>
      </Callout>

      {/* Why use variables */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Why Use Variables?
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Variables unlock three powerful capabilities in your onboarding:
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          {[
            { title: 'Personalization', desc: 'Show the user\'s name, selected preferences, or any stored value inside your screen text.' },
            { title: 'Branching Logic', desc: 'Send users down different paths based on their choices — e.g. fitness users see workout screens, nutrition users see meal screens.' },
            { title: 'Data Collection', desc: 'Gather information across screens and pass it to your app when onboarding completes.' },
          ].map((item) => (
            <Card key={item.title} padding="md">
              <Text style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>{item.title}</Text>
              <Text variant="muted" size="sm">{item.desc}</Text>
            </Card>
          ))}
        </div>
      </div>

      {/* Setting variables with AI */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Setting Variables with the AI Builder
        </Heading>
        <Callout color="blue">
          <Text variant="muted">
            The easiest way to work with variables is to <strong>just tell the AI what you want</strong>. Open the AI Builder tab in the screen editor and describe what you need in plain English. The AI will set up the variables, conditions, and actions for you automatically.
          </Text>
        </Callout>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Here are some examples of what you can say to the AI:
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          {[
            { prompt: '"When the user taps \'I\'m a beginner\', save their level as beginner"', result: 'AI adds a set_variable action to the button: experience = "beginner"' },
            { prompt: '"Show the user\'s name in the welcome text"', result: 'AI inserts {userName} into the text element' },
            { prompt: '"If the user selected fitness, go to the workout screen. Otherwise go to the general screen"', result: 'AI configures conditional navigation on the button based on the goal variable' },
            { prompt: '"Add three option buttons that each save a different plan choice"', result: 'AI creates three buttons, each with set_variable: selectedPlan = "free" / "pro" / "team"' },
          ].map((example, idx) => (
            <Card key={idx} padding="md" style={{ backgroundColor: theme.colors.background }}>
              <Text size="sm" style={{ fontWeight: '600', color: theme.colors.primary, marginBottom: theme.spacing.xs }}>
                You say: {example.prompt}
              </Text>
              <Text variant="muted" size="sm">
                {example.result}
              </Text>
            </Card>
          ))}
        </div>
        <Text variant="muted" size="sm">
          You don't need to understand the technical details below to use variables — the AI handles it. But if you want to configure things manually or understand how it works under the hood, read on.
        </Text>
      </div>

      {/* How variables work */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          How Variables Work (Under the Hood)
        </Heading>
        <Text style={{ marginBottom: theme.spacing.md }}>
          Variables are key-value pairs that travel with the user through the onboarding flow. There are three ways a variable gets set:
        </Text>
        <div style={{ overflowX: 'auto', marginBottom: theme.spacing.md }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Method</th>
                <th style={thStyle}>Where</th>
                <th style={thStyle}>How It Works</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Initial Variables', 'Your app code', 'Pass data you already know (user name, platform, etc.) when the flow starts'],
                ['set_variable action', 'Dashboard / AI Builder', 'A button tap saves a value — e.g. tapping "Pro Plan" sets selectedPlan = "pro"'],
                ['Custom screen data', 'Your React Native code', 'Your custom components call onDataUpdate() to pass data forward'],
              ].map(([method, where, how], i) => (
                <tr key={method} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.colors.background }}>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>{method}</td>
                  <td style={tdStyle}>{where}</td>
                  <td style={tdStyle}>{how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setting variables in the dashboard */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Setting Variables in the Dashboard (Manual)
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          If you prefer to configure variables manually instead of using the AI, here's how:
        </Text>
        <ol style={{ marginLeft: theme.spacing.lg, marginBottom: theme.spacing.md }}>
          <li style={listItemStyle}>Open your flow in the dashboard and select the screen you want to edit</li>
          <li style={listItemStyle}>Click on a button element in the Layout tab</li>
          <li style={listItemStyle}>In the element settings panel, find the <strong>Actions</strong> section</li>
          <li style={listItemStyle}>Add a new action with type <code style={inlineCodeStyle}>set_variable</code></li>
          <li style={listItemStyle}>Enter a <strong>variable name</strong> (e.g. <code style={inlineCodeStyle}>selectedPlan</code>) and a <strong>value</strong> (e.g. <code style={inlineCodeStyle}>pro</code>)</li>
          <li style={listItemStyle}>When a user taps that button, the variable is saved and available to all subsequent screens</li>
        </ol>
        <Card padding="md" style={{ backgroundColor: theme.colors.background }}>
          <Text size="sm">
            <strong>Example:</strong> You have three plan buttons — "Free", "Pro", and "Team". Each button has a <code style={inlineCodeStyle}>set_variable</code> action that sets <code style={inlineCodeStyle}>selectedPlan</code> to <code style={inlineCodeStyle}>"free"</code>, <code style={inlineCodeStyle}>"pro"</code>, or <code style={inlineCodeStyle}>"team"</code> respectively. The next screen can then display "You chose the {'{selectedPlan}'} plan!" using template syntax.
          </Text>
        </Card>
      </div>

      {/* Template syntax */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Displaying Variables in Text (Template Syntax)
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          You can display any variable's value inside a text element by wrapping the variable name in curly braces: <code style={inlineCodeStyle}>{'{variable_name}'}</code>
        </Text>
        <Text style={{ marginBottom: theme.spacing.md }}>
          For example, if you set a variable called <code style={inlineCodeStyle}>userName</code> with the value <code style={inlineCodeStyle}>"Sarah"</code>, the text below would render as shown:
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
          <Card padding="md" style={{ backgroundColor: '#1a1a1a' }}>
            <Text size="xs" style={{ color: '#999', marginBottom: theme.spacing.xs, fontWeight: '600' }}>What you type in the dashboard:</Text>
            <Text size="sm" style={{ fontFamily: theme.fonts.mono, color: '#e5e5e5' }}>
              Welcome back, {'{userName}'}! Let&apos;s get you set up.
            </Text>
          </Card>
          <Card padding="md" style={{ backgroundColor: theme.colors.background }}>
            <Text size="xs" style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.xs, fontWeight: '600' }}>What the user sees on their device:</Text>
            <Text size="sm">
              Welcome back, Sarah! Let&apos;s get you set up.
            </Text>
          </Card>
        </div>
        <Text variant="muted" size="sm">
          If the variable hasn't been set yet, the placeholder text (e.g. {'{userName}'}) is left as-is. Make sure the variable is set on an earlier screen.
        </Text>
      </div>

      {/* Conditional navigation */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Conditional Navigation (Branching Flows)
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          This is where variables become really powerful. You can send users down different paths based on the values they've chosen. For example:
        </Text>
        <Card padding="md" style={{ backgroundColor: theme.colors.background, marginBottom: theme.spacing.md }}>
          <Text size="sm" style={{ lineHeight: 1.8 }}>
            Screen 1: "What's your goal?" — user taps <strong>"Fitness"</strong> → sets <code style={inlineCodeStyle}>goal = "fitness"</code><br/>
            Screen 2 (conditional): If <code style={inlineCodeStyle}>goal === "fitness"</code> → go to <strong>Workout Setup</strong> screen<br/>
            Screen 2 (conditional): If <code style={inlineCodeStyle}>goal === "nutrition"</code> → go to <strong>Meal Plan</strong> screen<br/>
            Screen 2 (default): Otherwise → go to <strong>General Setup</strong> screen
          </Text>
        </Card>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          To set this up, you can either:
        </Text>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}><strong>Tell the AI:</strong> "If the user selected fitness, go to the workout screen. Otherwise go to the general setup screen." The AI will configure the conditions for you.</li>
          <li style={listItemStyle}><strong>Configure manually:</strong> Select a button, set its action to <code style={inlineCodeStyle}>navigate</code>, and add conditions that check a variable's value to determine which screen to go to.</li>
        </ul>
      </div>

      {/* Initial variables from code */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Passing Initial Variables from Your App
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Sometimes you already know things about the user before onboarding starts — their name, their platform, whether they've used the app before, etc. You can pass these as <code style={inlineCodeStyle}>initialVariables</code> so your onboarding screens can use them immediately:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`<OnboardingFlow
  testKey="nb_test_..."
  productionKey="nb_live_..."
  initialVariables={{
    userName: 'Sarah',        // Show their name in screens
    isPremium: false,         // Customize flow for free users
    platform: Platform.OS,    // Show platform-specific instructions
  }}
  onComplete={(userData) => {
    // All variables (initial + collected) are in userData._variables
    console.log(userData._variables);
    // { userName: 'Sarah', isPremium: false, platform: 'ios', goal: 'fitness', ... }
  }}
/>`}</pre>
        </Card>
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          These variables are immediately available to all screens in the flow. Screens can reference them with template syntax (e.g. {'{userName}'}) or use them in conditional navigation.
        </Text>
      </div>

      {/* Custom screen data flow */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Variables in Custom Screens (Advanced)
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          If you've built custom React Native screens (like a paywall or survey), those screens can both <strong>read</strong> existing variables and <strong>set new ones</strong>:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`function SurveyScreen({ data, onDataUpdate, onNext }: CustomScreenProps) {
  // READ variables from previous screens
  const userName = data?.userName || 'there';
  // data contains all variables set so far (initial + collected)

  const handleSubmit = () => {
    // SET new variables for the next screens to use
    onDataUpdate?.({
      goal: selectedGoal,         // e.g. "fitness"
      experienceLevel: selectedLevel, // e.g. "beginner"
    });
    onNext(); // move to the next screen
  };

  return (
    <View>
      <Text>Hey {userName}, what's your goal?</Text>
      {/* ... render survey options ... */}
    </View>
  );
}`}</pre>
        </Card>
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          The <code style={inlineCodeStyle}>data</code> prop contains all variables collected so far (from <code style={inlineCodeStyle}>initialVariables</code> + any variables set by previous screens). Call <code style={inlineCodeStyle}>onDataUpdate()</code> to add new variables that subsequent screens and your <code style={inlineCodeStyle}>onComplete</code> callback will receive.
        </Text>
      </div>

      {/* Summary */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Quick Reference
        </Heading>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>I want to...</th>
                <th style={thStyle}>How</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Save a user\'s button choice', 'Tell the AI: "When user taps X, save Y as Z" — or manually add a set_variable action'],
                ['Show a variable in text', 'Use {variableName} in any text element'],
                ['Branch to different screens', 'Tell the AI: "If X equals Y, go to screen Z" — or manually add conditions to a navigate action'],
                ['Pass data from my app', 'Use the initialVariables prop on OnboardingFlow'],
                ['Pass data from a custom screen', 'Call onDataUpdate({ key: value }) in your component'],
                ['Read all collected data', 'Use the onComplete callback — userData._variables has everything'],
              ].map(([want, how], i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.colors.background }}>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>{want}</td>
                  <td style={tdStyle}>{how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── 6. RevenueCat ──────────────────────────────────────────────────────

function RevenueCatSection() {
  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        RevenueCat Integration
      </Heading>
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Connect RevenueCat to Noboarding for paywall and subscription management
      </Text>

      <Callout color="green">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          Why RevenueCat + Noboarding?
        </Heading>
        <Text variant="muted">
          RevenueCat powers your in-app purchases and subscriptions. With Noboarding, you can measure exactly how your onboarding flow drives paywall conversions, run A/B tests to find the highest-converting paywall placement, and iterate on everything over the air — no app update required.
        </Text>
      </Callout>

      {/* Prerequisites */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Prerequisites
        </Heading>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}>RevenueCat account with products/subscriptions configured</li>
          <li style={listItemStyle}>RevenueCat API keys for iOS (<code style={inlineCodeStyle}>appl_...</code>) and/or Android (<code style={inlineCodeStyle}>goog_...</code>)</li>
          <li style={listItemStyle}>Noboarding SDK already installed in your React Native app</li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>react-native-purchases</code> installed</li>
        </ul>
      </div>

      {/* Install */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          1. Install RevenueCat SDK
        </Heading>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`npm install react-native-purchases
# iOS
cd ios && pod install`}</pre>
        </Card>
      </div>

      {/* Configure */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          2. Configure RevenueCat
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Initialize RevenueCat early in your app lifecycle:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export default function App() {
  useEffect(() => {
    Purchases.configure({
      apiKey: Platform.OS === 'ios'
        ? 'appl_YOUR_IOS_KEY'
        : 'goog_YOUR_ANDROID_KEY',
    });
  }, []);

  // ... render OnboardingFlow
}`}</pre>
        </Card>
      </div>

      {/* User ID Sync */}
      <div style={sectionGap}>
        <Callout color="red">
          <Heading level={4} serif style={{ marginBottom: theme.spacing.sm }}>
            Critical: Sync User IDs
          </Heading>
          <Text style={{ marginBottom: theme.spacing.sm }}>
            Noboarding generates a unique user ID for each onboarding session. You <strong>must</strong> pass this to RevenueCat so purchases are properly attributed. Without this, A/B test metrics and conversion tracking will not work.
          </Text>
          <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
            <pre style={codeBlockStyle}>{`<OnboardingFlow
  testKey="nb_test_..."
  productionKey="nb_live_..."
  onUserIdGenerated={(userId) => {
    // Critical — syncs Noboarding user with RevenueCat
    Purchases.logIn(userId);
  }}
  customComponents={{
    PaywallScreen: PaywallScreen,
  }}
  onComplete={(userData) => {
    console.log('Onboarding complete:', userData);
  }}
/>`}</pre>
          </Card>
        </Callout>
      </div>

      {/* Paywall Screen */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          3. Create Your Paywall Screen
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Create a custom screen component that uses RevenueCat. The component receives <code style={inlineCodeStyle}>CustomScreenProps</code>:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`import { CustomScreenProps } from 'noboarding';
import Purchases from 'react-native-purchases';

export function PaywallScreen({
  analytics, onNext, onSkip, onDataUpdate, preview,
}: CustomScreenProps) {

  useEffect(() => { analytics.track('paywall_viewed'); }, []);

  useEffect(() => {
    async function load() {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setPackages(offerings.current.availablePackages);
        analytics.track('paywall_loaded');
      }
    }
    if (!preview) load();
  }, []);

  const handlePurchase = async (pkg) => {
    analytics.track('paywall_purchase_started');
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['premium']) {
        analytics.track('paywall_conversion');
        onDataUpdate?.({ premium: true });
        onNext();
      }
    } catch (e) {
      analytics.track('paywall_purchase_failed');
    }
  };

  // ... render UI
}`}</pre>
        </Card>
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          The <code style={inlineCodeStyle}>preview</code> prop is true when rendering in the dashboard — show placeholder UI since RevenueCat won't be available.
        </Text>
      </div>

      {/* Register */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          4. Register the Paywall Screen
        </Heading>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`<OnboardingFlow
  testKey="nb_test_..."
  productionKey="nb_live_..."
  customComponents={{
    PaywallScreen: PaywallScreen,
  }}
  // ... other props
/>`}</pre>
        </Card>
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          The key name (<code style={inlineCodeStyle}>PaywallScreen</code>) must match the component name you enter in the Noboarding dashboard.
        </Text>
      </div>

      {/* Webhook */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          5. Configure RevenueCat Webhook
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          The webhook lets Noboarding receive real-time purchase events for analytics and conversion tracking.
        </Text>
        <ol style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}>Go to <a href="https://app.revenuecat.com/" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>RevenueCat Dashboard</a></li>
          <li style={listItemStyle}>Navigate to: <strong>Integrations → Webhooks</strong></li>
          <li style={listItemStyle}>Click <strong>"Add New Webhook"</strong></li>
          <li style={listItemStyle}>
            Webhook URL:
            <Card padding="sm" style={{ marginTop: theme.spacing.xs }}>
              <pre style={{ ...codeBlockStyle, fontSize: theme.fontSizes.xs }}>https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1/revenuecat-webhook</pre>
            </Card>
          </li>
          <li style={listItemStyle}>
            Authorization header:
            <Card padding="sm" style={{ marginTop: theme.spacing.xs }}>
              <pre style={{ ...codeBlockStyle, fontSize: theme.fontSizes.xs }}>Bearer c3373PFzv9wPpISOu5XFz22zABeLjpzYwGqmclXR60o=</pre>
            </Card>
          </li>
          <li style={listItemStyle}>Select events: <strong>INITIAL_PURCHASE</strong>, <strong>TRIAL_STARTED</strong>, <strong>RENEWAL</strong>, <strong>CANCELLATION</strong></li>
          <li style={listItemStyle}>Click <strong>Save</strong> and send a test event</li>
        </ol>
      </div>

      {/* Dashboard */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          6. Add to Your Flow in the Dashboard
        </Heading>
        <ol style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}>Open your onboarding flow in the Noboarding dashboard</li>
          <li style={listItemStyle}>Click <strong>"Add Custom Screen"</strong></li>
          <li style={listItemStyle}>Enter component name: <code style={inlineCodeStyle}>PaywallScreen</code></li>
          <li style={listItemStyle}>Drag it to the desired position in your flow</li>
          <li style={listItemStyle}>Save and publish</li>
        </ol>
        <Card padding="md" style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.background }}>
          <Text size="sm">
            <strong>Tip:</strong> Place the paywall after a few screens so users experience value first. Common pattern: Welcome → Feature Tour → PaywallScreen → Completion.
          </Text>
        </Card>
      </div>

      {/* Analytics Events */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Analytics Events
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          With the integration complete, these events appear in your Analytics dashboard:
        </Text>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}><code style={inlineCodeStyle}>paywall_viewed</code> — User saw the paywall</li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>paywall_loaded</code> — RevenueCat offerings loaded successfully</li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>paywall_purchase_started</code> — User tapped a purchase button</li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>paywall_conversion</code> — Purchase completed successfully</li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>paywall_purchase_failed</code> — Purchase failed or was cancelled</li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>paywall_dismissed</code> — User skipped the paywall</li>
        </ul>
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          RevenueCat webhook events (purchases, renewals, cancellations) are also tracked server-side for revenue attribution.
        </Text>
      </div>
    </div>
  )
}

// ── 7. A/B Testing ─────────────────────────────────────────────────────

function ABTestingSection() {
  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        A/B Testing
      </Heading>
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Optimize your onboarding flow with data-driven experiments
      </Text>

      <Callout color="purple">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          Test, learn, and optimize
        </Heading>
        <Text variant="muted">
          A/B testing lets you compare different versions of your onboarding flow to find what drives the best completion rates, conversions, and user experience — all without shipping app updates.
        </Text>
      </Callout>

      {/* How it works */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          How It Works
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Noboarding's A/B testing splits your users into groups and shows each group a different version of your onboarding flow. The SDK handles all assignment and tracking automatically.
        </Text>
        <ol style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}><strong>Create variants</strong> — Design two or more versions of your flow</li>
          <li style={listItemStyle}><strong>Set traffic split</strong> — Choose what percentage sees each variant (e.g., 50/50)</li>
          <li style={listItemStyle}><strong>Choose a primary metric</strong> — The metric you're optimizing for</li>
          <li style={listItemStyle}><strong>Run the test</strong> — Users are automatically assigned when they start onboarding</li>
          <li style={listItemStyle}><strong>Analyze results</strong> — View performance metrics for each variant</li>
        </ol>
      </div>

      {/* Creating a test */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Creating an A/B Test
        </Heading>
        <ol style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}>Go to <a href="/ab-tests" style={{ color: theme.colors.primary }}>A/B Tests</a> in your dashboard</li>
          <li style={listItemStyle}>Click <strong>"New Test"</strong></li>
          <li style={listItemStyle}>Give your test a descriptive name (e.g., "Paywall placement test")</li>
          <li style={listItemStyle}>Select the flow you want to test</li>
          <li style={listItemStyle}>Create your variants — each variant is a full flow configuration</li>
          <li style={listItemStyle}>Set your traffic allocation percentages</li>
          <li style={listItemStyle}>Choose your primary metric</li>
          <li style={listItemStyle}>Start the test</li>
        </ol>
      </div>

      {/* Metrics */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Available Metrics
        </Heading>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}><strong>Completion Rate</strong> — Percentage of users who finish the entire flow</li>
          <li style={listItemStyle}><strong>Conversion Rate</strong> — Percentage who make a purchase during onboarding</li>
          <li style={listItemStyle}><strong>Drop-off by Screen</strong> — Which screen users abandon the flow on</li>
          <li style={listItemStyle}><strong>Time to Complete</strong> — Average time in the onboarding flow</li>
          <li style={listItemStyle}><strong>Revenue per User</strong> — Average revenue attributed to each variant</li>
        </ul>
      </div>

      {/* What to test */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          What to Test
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          High-impact experiments to consider:
        </Text>

        {[
          { title: 'Paywall Placement', desc: 'Show the paywall early (screen 2) vs. late (screen 5). Early paywalls have higher visibility but late paywalls let users experience value first.' },
          { title: 'Flow Length', desc: 'Test a 3-screen flow vs. a 6-screen flow. Shorter flows have less drop-off but may not build enough value to convert.' },
          { title: 'Screen Content & Copy', desc: 'Test different headlines, descriptions, and imagery. Small copy changes can significantly impact conversion rates.' },
          { title: 'With vs. Without Paywall', desc: 'Compare showing a paywall during onboarding vs. no paywall at all. Measure long-term retention and revenue differences.' },
        ].map((item) => (
          <Card key={item.title} padding="md" style={{ marginBottom: theme.spacing.md }}>
            <p style={{ fontWeight: '600', margin: `0 0 ${theme.spacing.xs}`, color: theme.colors.text, fontSize: theme.fontSizes.sm }}>{item.title}</p>
            <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, lineHeight: 1.5 }}>{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* Best practices */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Best Practices
        </Heading>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}><strong>Test one thing at a time</strong> — Change only one variable per test</li>
          <li style={listItemStyle}><strong>Run tests long enough</strong> — Wait for statistical significance (a few hundred users per variant)</li>
          <li style={listItemStyle}><strong>Start with 50/50 splits</strong> — Equal traffic gives the fastest path to significant results</li>
          <li style={listItemStyle}><strong>Use test environment first</strong> — Verify everything works before going to production</li>
          <li style={listItemStyle}><strong>Look beyond the primary metric</strong> — Higher conversion might mean lower retention</li>
          <li style={listItemStyle}><strong>Document your hypotheses</strong> — Write down expectations before starting</li>
        </ul>
      </div>

      {/* Interpreting */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Interpreting Results
        </Heading>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}><strong>Check sample size</strong> — Results with fewer than 100 users per variant are unreliable</li>
          <li style={listItemStyle}><strong>Look for clear winners</strong> — 1-2% differences may not be meaningful</li>
          <li style={listItemStyle}><strong>Consider multiple metrics</strong> — Higher completion doesn't always mean higher revenue</li>
          <li style={listItemStyle}><strong>Watch for external factors</strong> — Seasonal trends or marketing campaigns can skew results</li>
        </ul>
        <Card padding="md" style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.background }}>
          <Text size="sm">
            <strong>Tip:</strong> Once you have a clear winner, end the test and roll out the winning variant to 100% of users. Then start your next experiment.
          </Text>
        </Card>
      </div>
    </div>
  )
}

// ── 8. SDK Reference ───────────────────────────────────────────────────

function SDKReferenceSection() {
  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        SDK Reference
      </Heading>
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Complete API reference for the Noboarding React Native SDK
      </Text>

      {/* OnboardingFlow Props */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          OnboardingFlow Props
        </Heading>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Prop</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Required</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['testKey', 'string', 'Yes', 'API key for test environment (nb_test_...). Used when __DEV__ is true.'],
                ['productionKey', 'string', 'Yes', 'API key for production environment (nb_live_...). Used when __DEV__ is false.'],
                ['onComplete', '(data: Record<string, any>) => void', 'Yes', 'Called when the user completes the last screen. Receives all collected data.'],
                ['onSkip', '() => void', 'No', 'Called when the user skips/dismisses the entire onboarding flow.'],
                ['customComponents', 'Record<string, React.FC<CustomScreenProps>>', 'No', 'Map of custom screen components. Keys must match dashboard component names.'],
                ['initialVariables', 'Record<string, any>', 'No', 'Pre-set variables available to all screens via template syntax.'],
                ['onUserIdGenerated', '(userId: string) => void', 'No', 'Called with the auto-generated user ID. Use to sync with RevenueCat.'],
                ['baseUrl', 'string', 'No', 'Custom API base URL. Only needed for self-hosted deployments.'],
              ].map(([prop, type, req, desc], i) => (
                <tr key={prop} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.colors.background }}>
                  <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs, whiteSpace: 'nowrap' }}>{prop}</td>
                  <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>{type}</td>
                  <td style={tdStyle}>{req}</td>
                  <td style={tdStyle}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CustomScreenProps */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          CustomScreenProps
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Interface received by all custom screen components:
        </Text>
        <Card padding="sm" style={{ marginBottom: theme.spacing.md }}>
          <pre style={codeBlockStyle}>{`import { CustomScreenProps } from 'noboarding';

interface CustomScreenProps {
  analytics: {
    track: (event: string, properties?: Record<string, any>) => void;
  };
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  preview?: boolean;
  data?: Record<string, any>;
  onDataUpdate?: (data: Record<string, any>) => void;
}`}</pre>
        </Card>
      </div>

      {/* Analytics Events */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Analytics Events
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Events automatically tracked by the SDK:
        </Text>
        <div style={{ overflowX: 'auto', marginBottom: theme.spacing.md }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Event</th>
                <th style={thStyle}>When Fired</th>
                <th style={thStyle}>Properties</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['onboarding_started', 'Flow initializes and first screen loads', 'flow_id, screen_id'],
                ['screen_viewed', 'User navigates to a new screen (index > 0)', 'flow_id, screen_id, screen_index'],
                ['screen_completed', 'User completes a screen', 'flow_id, screen_id'],
                ['onboarding_completed', 'User reaches the end of the flow', 'flow_id, screen_id'],
                ['onboarding_abandoned', 'User skips/dismisses the flow', 'flow_id, screen_id, current_screen_index'],
              ].map(([event, when, props], i) => (
                <tr key={event} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.colors.background }}>
                  <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs, whiteSpace: 'nowrap' }}>{event}</td>
                  <td style={tdStyle}>{when}</td>
                  <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>{props}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Text style={{ marginBottom: theme.spacing.sm }}>
          Common custom events (tracked in your custom screens):
        </Text>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Event</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['paywall_viewed', 'User saw the paywall screen'],
                ['paywall_loaded', 'RevenueCat offerings loaded successfully'],
                ['paywall_purchase_started', 'User tapped a purchase button'],
                ['paywall_conversion', 'Purchase completed successfully'],
                ['paywall_purchase_failed', 'Purchase failed or was cancelled'],
                ['paywall_dismissed', 'User skipped the paywall'],
              ].map(([event, desc], i) => (
                <tr key={event} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.colors.background }}>
                  <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs, whiteSpace: 'nowrap' }}>{event}</td>
                  <td style={tdStyle}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Environment Detection */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Environment Detection
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          The SDK automatically detects the environment:
        </Text>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Condition</th>
                <th style={thStyle}>Environment</th>
                <th style={thStyle}>API Key Used</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>__DEV__ === true</td>
                <td style={tdStyle}>Test</td>
                <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>testKey</td>
              </tr>
              <tr style={{ backgroundColor: theme.colors.background }}>
                <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>__DEV__ === false</td>
                <td style={tdStyle}>Production</td>
                <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>productionKey</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          In Expo and React Native dev mode, <code style={inlineCodeStyle}>__DEV__</code> is true. In production builds (app store releases), it's false.
        </Text>
      </div>

      {/* Data Flow */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Data Flow
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          When the flow completes, <code style={inlineCodeStyle}>onComplete</code> receives an object containing:
        </Text>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}>All data from <code style={inlineCodeStyle}>onDataUpdate()</code> calls across custom screens (merged)</li>
          <li style={listItemStyle}><code style={inlineCodeStyle}>_variables</code> — all variable values (from <code style={inlineCodeStyle}>initialVariables</code> + <code style={inlineCodeStyle}>set_variable</code> actions)</li>
        </ul>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`onComplete={(userData) => {
  // userData contains all collected data, e.g.:
  // { premium: true, goal: 'fitness', _variables: { userName: 'John' } }
  console.log(userData);
}}`}</pre>
        </Card>
      </div>
    </div>
  )
}
