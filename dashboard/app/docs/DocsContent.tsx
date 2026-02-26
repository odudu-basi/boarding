'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, Heading, Text } from '@/components/ui'
import { theme } from '@/lib/theme'
import type { CustomScreenInfo } from './page'

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
}

export function DocsContent({ testApiKey, productionApiKey, customScreens }: DocsContentProps) {
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
    const prompt = buildAIPrompt(testApiKey, productionApiKey, customScreens)
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start': return <QuickStartSection onNavigate={setActiveSection} />
      case 'ai-setup': return <AISetupSection testApiKey={testApiKey} productionApiKey={productionApiKey} customScreens={customScreens} onCopy={copyPrompt} copied={copied} />
      case 'installation': return <InstallationSection testApiKey={testApiKey} productionApiKey={productionApiKey} />
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

function buildAIPrompt(testApiKey: string, productionApiKey: string, customScreens: CustomScreenInfo[]): string {
  let customScreenTable = ''
  if (customScreens.length > 0) {
    customScreenTable = `

## My Existing Custom Screens

Here are the custom screens already configured in my Noboarding dashboard. Each needs a matching React Native component:

| Flow | Component Name | Description | Variables (received/set) |
|------|---------------|-------------|--------------------------|
${customScreens.map(s => `| ${s.flowName} | ${s.componentName} | ${s.description || 'N/A'} | ${s.variables.length > 0 ? s.variables.join(', ') : 'None'} |`).join('\n')}

Please implement each of these custom screen components following the CustomScreenProps interface from the Noboarding SDK.`
  }

  return `I need you to integrate the Noboarding SDK into my React Native app with RevenueCat paywall support. Here are the requirements:

## Context
- I already have RevenueCat configured in my app with API keys
- I have a Noboarding account with two API keys:
  - Test API Key (for development): ${testApiKey || '[No test key found — check Settings]'}
  - Production API Key (for production): ${productionApiKey || '[No production key found — check Settings]'}
- My RevenueCat iOS key: [PASTE_YOUR_IOS_KEY_HERE]
- My RevenueCat Android key: [PASTE_YOUR_ANDROID_KEY_HERE]
${customScreenTable}

## Task 1: Install Noboarding SDK

1. Install the Noboarding SDK package:
   \`\`\`bash
   npm install noboarding
   # or
   yarn add noboarding
   \`\`\`

2. Install peer dependencies if not already installed:
   \`\`\`bash
   npm install @react-native-async-storage/async-storage
   \`\`\`

## Task 2: Create RevenueCat Paywall Screen

Create a new file at \`src/screens/PaywallScreen.tsx\` with the following implementation:

Requirements for the PaywallScreen component:
- Import CustomScreenProps from 'noboarding'
- Import necessary RevenueCat types (PurchasesOffering, PurchasesPackage)
- Use analytics.track() for these events:
  - paywall_viewed (on mount)
  - paywall_loaded (when offerings load)
  - paywall_purchase_started
  - paywall_conversion (on successful purchase)
  - paywall_purchase_failed
  - paywall_dismissed (when user skips)
- Implement preview mode that shows a placeholder UI when preview={true}
- Load offerings from RevenueCat using Purchases.getOfferings()
- Handle purchase with Purchases.purchasePackage()
- Check for premium entitlement after purchase
- Call onDataUpdate() with purchase info on successful purchase
- Call onNext() to continue after purchase
- Call onSkip() or onNext() when user dismisses

The component should:
- Show loading state while fetching offerings
- Display all available packages from the current offering
- Show package title, price, and any intro pricing
- Have a "Restore Purchases" button
- Have a skip/dismiss button (conditionally shown if onSkip is provided)
- Use Alert.alert() to show success/error messages
- Style it nicely with a modern, clean UI

## Task 3: Integrate SDK in App.tsx

Update the main App.tsx file:

1. Import OnboardingFlow from 'noboarding'
2. Import the PaywallScreen component
3. Import Purchases from 'react-native-purchases'
4. Add state to manage onboarding visibility: useState(true)
5. In useEffect, configure RevenueCat with the API keys I provided above
6. Render OnboardingFlow component with:
   - testKey="${testApiKey || 'nb_test_your_test_key_here'}"
   - productionKey="${productionApiKey || 'nb_live_your_production_key_here'}"
   - NOTE: The SDK automatically detects the environment using __DEV__ and uses the appropriate key
   - customComponents={{ PaywallScreen: PaywallScreen${customScreens.length > 0 ? customScreens.map(s => `, ${s.componentName}: ${s.componentName}`).join('') : ''} }}
   - onUserIdGenerated callback that calls Purchases.logIn(userId) - CRITICAL for attribution
   - onComplete callback that logs userData and hides onboarding
   - onSkip callback (optional)
7. Show main app content when onboarding is complete

## Task 4: Configure RevenueCat Webhook

After you complete the code changes, provide me with instructions to configure the RevenueCat webhook. The webhook should point to:

**Webhook URL:** https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1/revenuecat-webhook
**Authorization Header:** Bearer c3373PFzv9wPpISOu5XFz22zABeLjpzYwGqmclXR60o=

Tell me:
1. Where to find the webhook settings in RevenueCat dashboard
2. Which events to select (minimum: INITIAL_PURCHASE, RENEWAL, CANCELLATION)
3. How to test the webhook

## Task 5: Usage Instructions

After completing the integration, provide me with:
1. How to add the PaywallScreen to my onboarding flow in the Noboarding dashboard
2. How to test the integration locally
3. What analytics events I can expect to see
4. How conversions will be tracked

## Important Notes
- Use TypeScript for all files
- Follow React Native best practices
- Add proper error handling
- Include loading states
- Make the UI accessible
- Add comments explaining critical parts (especially the onUserIdGenerated callback)

Please implement all of this and let me know when you're done. If you need any clarification on my existing code structure, ask me first before making assumptions.`
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
  testApiKey,
  productionApiKey,
  customScreens,
  onCopy,
  copied,
}: {
  testApiKey: string
  productionApiKey: string
  customScreens: CustomScreenInfo[]
  onCopy: () => void
  copied: boolean
}) {
  const prompt = buildAIPrompt(testApiKey, productionApiKey, customScreens)

  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        AI Setup
      </Heading>
      <Text variant="muted" style={{ marginBottom: theme.spacing.xl }}>
        Set up Noboarding using your AI coding assistant
      </Text>

      <Callout color="blue">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          For developers using AI coding assistants
        </Heading>
        <Text variant="muted">
          Copy the instructions below and paste them into your AI coding assistant (Claude Code, Cursor, GitHub Copilot, etc.) to automatically set up the Noboarding SDK with RevenueCat integration. Your API keys have been pre-filled.
        </Text>
      </Callout>

      {/* API Keys Status */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Your API Keys
        </Heading>
        <div style={{ display: 'flex', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <div style={{ flex: 1 }}>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>Test Key</Text>
            <code style={{
              display: 'block',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.sm,
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSizes.xs,
              color: testApiKey ? theme.colors.text : theme.colors.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {testApiKey || 'Not found — check Settings'}
            </code>
          </div>
          <div style={{ flex: 1 }}>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>Production Key</Text>
            <code style={{
              display: 'block',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.sm,
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSizes.xs,
              color: productionApiKey ? theme.colors.text : theme.colors.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {productionApiKey || 'Not found — check Settings'}
            </code>
          </div>
        </div>
      </div>

      {/* Custom Screen Variable Table */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Your Custom Screens
        </Heading>
        {customScreens.length > 0 ? (
          <>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
              These custom screens from your flows will be included in the AI prompt so your assistant knows what components to build.
            </Text>
            <div style={{ overflowX: 'auto', marginBottom: theme.spacing.md }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Flow</th>
                    <th style={thStyle}>Component Name</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Variables</th>
                  </tr>
                </thead>
                <tbody>
                  {customScreens.map((s, i) => (
                    <tr key={`${s.screenId}-${i}`} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.colors.background }}>
                      <td style={tdStyle}>{s.flowName}</td>
                      <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>{s.componentName}</td>
                      <td style={tdStyle}>{s.description || <span style={{ color: theme.colors.textMuted }}>—</span>}</td>
                      <td style={{ ...tdStyle, fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.xs }}>
                        {s.variables.length > 0 ? s.variables.join(', ') : <span style={{ color: theme.colors.textMuted }}>None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Card padding="md" style={{ backgroundColor: theme.colors.background }}>
            <Text variant="muted" size="sm">
              No custom screens found. Custom screens will appear here once you add them to your flows in the dashboard.
            </Text>
          </Card>
        )}
      </div>

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
          Copy everything in the box below and paste it to your AI coding assistant:
        </Text>
        <Card padding="none">
          <pre style={{ ...codeBlockStyle, maxHeight: 500, overflow: 'auto' }}>{prompt}</pre>
        </Card>
      </div>

      {/* Post-Setup Steps */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          After Your AI Assistant Completes the Setup
        </Heading>

        <div style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{ fontWeight: '600', marginBottom: theme.spacing.sm }}>
            1. Add PaywallScreen to Dashboard
          </Text>
          <ul style={{ marginLeft: theme.spacing.lg }}>
            <li style={listItemStyle}>Log in to your Noboarding dashboard</li>
            <li style={listItemStyle}>Go to your onboarding flow</li>
            <li style={listItemStyle}>Click "Add Custom Screen"</li>
            <li style={listItemStyle}>Enter component name: <code style={inlineCodeStyle}>PaywallScreen</code></li>
            <li style={listItemStyle}>Position it in your flow</li>
            <li style={listItemStyle}>Save and publish</li>
          </ul>
        </div>

        <div style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{ fontWeight: '600', marginBottom: theme.spacing.sm }}>
            2. Configure RevenueCat Webhook
          </Text>
          <ul style={{ marginLeft: theme.spacing.lg }}>
            <li style={listItemStyle}>Go to <a href="https://app.revenuecat.com/" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>RevenueCat Dashboard</a></li>
            <li style={listItemStyle}>Navigate to: Integrations → Webhooks</li>
            <li style={listItemStyle}>Click "Add New Webhook"</li>
            <li style={listItemStyle}>URL: <code style={inlineCodeStyle}>https://hhmmzmrsptegprfztqtq.supabase.co/functions/v1/revenuecat-webhook</code></li>
            <li style={listItemStyle}>Authorization: <code style={inlineCodeStyle}>Bearer c3373PFzv9wPpISOu5XFz22zABeLjpzYwGqmclXR60o=</code></li>
            <li style={listItemStyle}>Events: Select INITIAL_PURCHASE, RENEWAL, CANCELLATION</li>
            <li style={listItemStyle}>Save and test</li>
          </ul>
        </div>

        <div style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{ fontWeight: '600', marginBottom: theme.spacing.sm }}>
            3. Test Your Integration
          </Text>
          <Card padding="sm" style={{ marginTop: theme.spacing.sm }}>
            <pre style={codeBlockStyle}>{`npm start
# Test in development with sandbox purchases`}</pre>
          </Card>
        </div>

        <div>
          <Text style={{ fontWeight: '600', marginBottom: theme.spacing.sm }}>
            4. Deploy to Production
          </Text>
          <ul style={{ marginLeft: theme.spacing.lg }}>
            <li style={listItemStyle}>Test your flow in development with the Test API Key</li>
            <li style={listItemStyle}>Click <strong>Publish → Publish for Testing</strong> in the dashboard</li>
            <li style={listItemStyle}>Build your app for production</li>
            <li style={listItemStyle}>Submit to App Store / Google Play</li>
            <li style={listItemStyle}>After approval, click <strong>Publish → Publish to Production</strong> in the dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── 3. Installation & Setup ────────────────────────────────────────────

function InstallationSection({ testApiKey, productionApiKey }: { testApiKey: string; productionApiKey: string }) {
  return (
    <div>
      <Heading level={1} serif style={{ marginBottom: theme.spacing.xs }}>
        Installation & Setup
      </Heading>
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
        Pass data between screens and create conditional navigation
      </Text>

      <Callout color="purple">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
          Dynamic flows powered by variables
        </Heading>
        <Text variant="muted">
          Variables let you personalize screen content, pass data between screens, and create conditional navigation paths — all configured in the dashboard with no app update required.
        </Text>
      </Callout>

      {/* What are variables */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          What Are Variables?
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Variables are key-value pairs that flow through your onboarding screens. They can be:
        </Text>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}><strong>Pre-set</strong> — passed via <code style={inlineCodeStyle}>initialVariables</code> prop when the flow starts</li>
          <li style={listItemStyle}><strong>Collected by custom screens</strong> — set via <code style={inlineCodeStyle}>onDataUpdate()</code> in your components</li>
          <li style={listItemStyle}><strong>Set by actions</strong> — using the <code style={inlineCodeStyle}>set_variable</code> action type in the dashboard builder</li>
        </ul>
      </div>

      {/* initialVariables */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Initial Variables
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Pass pre-known data to the flow using <code style={inlineCodeStyle}>initialVariables</code>:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`<OnboardingFlow
  testKey="nb_test_..."
  productionKey="nb_live_..."
  initialVariables={{
    userName: 'John',
    isPremium: false,
    platform: Platform.OS,
  }}
  onComplete={(userData) => {
    // userData._variables contains all variable values
    console.log(userData._variables);
  }}
/>`}</pre>
        </Card>
      </div>

      {/* Template syntax */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Template Syntax in SDK Screens
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          In the dashboard builder, use <code style={inlineCodeStyle}>{'{variable_name}'}</code> in text elements to display variable values:
        </Text>
        <Card padding="md" style={{ backgroundColor: theme.colors.background }}>
          <Text size="sm" style={{ fontFamily: theme.fonts.mono }}>
            "Welcome back, {'{userName}'}! Let's get you set up."
          </Text>
        </Card>
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          If the variable isn't set, the placeholder is left as-is.
        </Text>
      </div>

      {/* Custom screen data flow */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Data Flow in Custom Screens
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          Custom screens can read data from previous screens and pass data forward:
        </Text>
        <Card padding="sm">
          <pre style={codeBlockStyle}>{`function SurveyScreen({ data, onDataUpdate, onNext }: CustomScreenProps) {
  // Read data from previous screens
  const userName = data?.userName || 'there';

  const handleSubmit = () => {
    // Pass data to subsequent screens
    onDataUpdate?.({
      goal: selectedGoal,
      experience: selectedLevel,
    });
    onNext();
  };

  // ... render survey UI
}`}</pre>
        </Card>
      </div>

      {/* Conditional navigation */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          Conditional Navigation
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          In the dashboard builder, you can configure navigation actions to go to different screens based on variable values. For example:
        </Text>
        <ul style={{ marginLeft: theme.spacing.lg }}>
          <li style={listItemStyle}>If <code style={inlineCodeStyle}>goal === "fitness"</code> → go to Fitness Setup screen</li>
          <li style={listItemStyle}>If <code style={inlineCodeStyle}>goal === "nutrition"</code> → go to Nutrition Setup screen</li>
          <li style={listItemStyle}>Default → go to next screen</li>
        </ul>
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          Conditional routes are configured per-button in the dashboard's screen builder using the navigate action type.
        </Text>
      </div>

      {/* set_variable action */}
      <div style={sectionGap}>
        <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
          set_variable Action
        </Heading>
        <Text style={{ marginBottom: theme.spacing.sm }}>
          SDK screens can set variables using the <code style={inlineCodeStyle}>set_variable</code> action type, configured in the dashboard. When a user taps a button with this action, the specified variable is set to the configured value.
        </Text>
        <Card padding="md" style={{ backgroundColor: theme.colors.background }}>
          <Text size="sm">
            Example: A "Select Plan" button can set <code style={inlineCodeStyle}>selectedPlan = "pro"</code>, which downstream screens or conditional navigation can reference.
          </Text>
        </Card>
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
          <li style={listItemStyle}>Select events: <strong>INITIAL_PURCHASE</strong>, <strong>RENEWAL</strong>, <strong>CANCELLATION</strong></li>
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
                ['testKey', 'string', 'Yes*', 'API key for test environment (nb_test_...). Used when __DEV__ is true.'],
                ['productionKey', 'string', 'Yes*', 'API key for production environment (nb_live_...). Used when __DEV__ is false.'],
                ['apiKey', 'string', 'No', 'Legacy single API key. Deprecated — use testKey + productionKey instead.'],
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
        <Text variant="muted" size="sm" style={{ marginTop: theme.spacing.sm }}>
          * Either <code style={inlineCodeStyle}>testKey + productionKey</code> (recommended) or <code style={inlineCodeStyle}>apiKey</code> must be provided.
        </Text>
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
