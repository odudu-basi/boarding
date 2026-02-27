'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Layout } from '@/components/Layout'
import { Container, Card, Heading, Text } from '@/components/ui'
import { theme } from '@/lib/theme'
import { useRouter } from 'next/navigation'
import { trackAnalyticsPageViewed, trackAnalyticsPaywallSetupClicked } from '@/lib/mixpanel'

interface Screen {
  screen_id: string
  screen_number: number
  timestamp: string
  event_name: string
}

interface Session {
  session_id: string
  flow_id: string
  flow_name: string
  started_at: string
  completed_at?: string
  abandoned_at?: string
  screens_visited: Screen[]
  converted: boolean
}

interface UserActivity {
  user_id: string
  country: string
  total_sessions: number
  sessions: Session[]
  most_recent_session: Session
  most_recent_status: 'completed' | 'abandoned' | 'in_progress'
  total_screens_viewed: number
  converted: boolean
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all'
type FunnelTimeRange = 'deployment' | '24h' | '7d' | '30d' | 'custom'

interface FunnelBar {
  screenId: string
  screenIndex: number
  label: string
  count: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [revenueCatEvents, setRevenueCatEvents] = useState<any[]>([])
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [visibleRows, setVisibleRows] = useState(15)
  const [flowConfigs, setFlowConfigs] = useState<Map<string, any>>(new Map())
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  // Funnel chart state
  const [funnelFlowId, setFunnelFlowId] = useState<string | null>(null)
  const [funnelTimeRange, setFunnelTimeRange] = useState<FunnelTimeRange>('30d')
  const [funnelCustomStart, setFunnelCustomStart] = useState('')
  const [funnelCustomEnd, setFunnelCustomEnd] = useState('')
  const [funnelData, setFunnelData] = useState<FunnelBar[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalEvents: 0,
    uniqueUsers: 0,
    uniqueSessions: 0,
    completionRate: 0,
    onboardingCompletions: 0,
    onboardingStarts: 0,
    paywallViews: 0,
    paywallConversions: 0,
    paywallConversionRate: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    setVisibleRows(15)
    loadData()
  }, [timeRange])

  const getDateFromTimeRange = (range: TimeRange): Date | null => {
    const now = new Date()
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case 'all':
        return null
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  const getTimeRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case '24h': return 'Last 24 hours'
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case 'all': return 'All time'
      default: return 'Last 30 days'
    }
  }

  const loadData = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user's organization
      const { data: userOrgs } = await supabase
        .from('users')
        .select('organization_id, organizations(*)')
        .eq('auth_user_id', user.id)
        .single()

      if (!userOrgs || !userOrgs.organizations) {
        return
      }

      const org = userOrgs.organizations as any
      setOrganization(org)

      // Read selected project from cookie
      const projectCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('selected_project='))
        ?.split('=')[1]

      // Track analytics page view (will track again after data loads with hasData)
      trackAnalyticsPageViewed(projectCookie || org.id, false)

      // Get all onboarding configs for this org (filtered by project if set)
      let configsQuery = supabase
        .from('onboarding_configs')
        .select('*')
        .eq('organization_id', org.id)

      if (projectCookie) {
        configsQuery = configsQuery.eq('project_id', projectCookie)
      }

      const { data: configs } = await configsQuery

      const configMap = new Map()
      configs?.forEach(config => {
        configMap.set(config.id, config)
      })
      setFlowConfigs(configMap)

      // Calculate date based on selected time range
      const startDate = getDateFromTimeRange(timeRange)

      // Get analytics data from selected time range
      let query = supabase
        .from('analytics_events')
        .select('*', { count: 'exact' })
        .eq('organization_id', org.id)

      if (projectCookie) {
        query = query.eq('project_id', projectCookie)
      }

      // Only add timestamp filter if not 'all time'
      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString())
      }

      const { data: eventsData, count } = await query
        .order('timestamp', { ascending: false })
        .limit(5000)

      setEvents(eventsData || [])

      // Get RevenueCat events
      const { data: revData } = await supabase
        .from('revenuecat_events')
        .select('*')
        .order('purchased_at', { ascending: false })
        .limit(100)

      setRevenueCatEvents(revData || [])

      // Calculate stats
      const uniqueUsers = new Set(eventsData?.map((e) => e.user_id)).size
      const uniqueSessions = new Set(eventsData?.map((e) => e.session_id)).size
      const onboardingCompletions = eventsData?.filter((e) => e.event_name === 'onboarding_completed').length || 0
      const onboardingStarts = eventsData?.filter((e) => e.event_name === 'onboarding_started').length || 0
      const completionRate = onboardingStarts > 0 ? ((onboardingCompletions / onboardingStarts) * 100).toFixed(1) : 0

      const paywallViews = eventsData?.filter((e) => e.event_name === 'paywall_viewed').length || 0
      const paywallConversions = eventsData?.filter((e) => e.event_name === 'paywall_conversion').length || 0
      const paywallConversionRate = paywallViews > 0 ? ((paywallConversions / paywallViews) * 100).toFixed(1) : 0

      const totalRevenue = revData
        ?.filter((e: any) => e.event_type === 'INITIAL_PURCHASE' && e.price)
        .reduce((sum: number, e: any) => sum + parseFloat(e.price), 0) || 0

      setStats({
        totalEvents: count || 0,
        uniqueUsers,
        uniqueSessions,
        completionRate: parseFloat(completionRate as string),
        onboardingCompletions,
        onboardingStarts,
        paywallViews,
        paywallConversions,
        paywallConversionRate: parseFloat(paywallConversionRate as string),
        totalRevenue,
      })

      // Process user activities
      const activities = processUserActivities(eventsData || [], configMap)
      setUserActivities(activities)

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processUserActivities = (eventsData: any[], configMap: Map<string, any>): UserActivity[] => {
    // Group events by user_id (trim and normalize to handle any spacing issues)
    const userMap = new Map<string, any[]>()

    eventsData.forEach(event => {
      const normalizedUserId = event.user_id?.trim() || 'unknown'
      if (!userMap.has(normalizedUserId)) {
        userMap.set(normalizedUserId, [])
      }
      userMap.get(normalizedUserId)!.push(event)
    })

    const activities: UserActivity[] = []

    userMap.forEach((userEvents, user_id) => {
      // Group this user's events by session_id
      const sessionMap = new Map<string, any[]>()

      userEvents.forEach(event => {
        if (!sessionMap.has(event.session_id)) {
          sessionMap.set(event.session_id, [])
        }
        sessionMap.get(event.session_id)!.push(event)
      })

      const sessions: Session[] = []

      sessionMap.forEach((sessionEvents, session_id) => {
        // Sort events by timestamp
        sessionEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        const startEvent = sessionEvents.find(e => e.event_name === 'onboarding_started')
        if (!startEvent) return // Skip sessions without start event

        const completeEvent = sessionEvents.find(e => e.event_name === 'onboarding_completed')
        const abandonEvent = sessionEvents.find(e => e.event_name === 'onboarding_abandoned')

        const flow_id = sessionEvents[0]?.flow_id || null
        const flowConfig = flow_id ? configMap.get(flow_id) : null

        // Get screen visits
        const screenEvents = sessionEvents.filter(e =>
          e.event_name === 'screen_viewed' ||
          e.event_name === 'screen_completed' ||
          e.event_name === 'onboarding_started'
        )

        // Map screen IDs to screen numbers based on flow config
        const screensVisited = screenEvents.map((e, idx) => {
          let screenNumber = idx + 1

          // If we have flow config, get actual screen order
          if (flowConfig && flowConfig.config?.screens) {
            const screenIndex = flowConfig.config.screens.findIndex((s: any) => s.id === e.screen_id)
            if (screenIndex !== -1) {
              screenNumber = screenIndex + 1
            }
          }

          return {
            screen_id: e.screen_id || 'unknown',
            screen_number: screenNumber,
            timestamp: e.timestamp,
            event_name: e.event_name
          }
        })

        // Determine if converted
        const converted = sessionEvents.some(e =>
          e.event_name === 'paywall_conversion' ||
          e.event_name === 'purchase_completed'
        )

        sessions.push({
          session_id,
          flow_id: flow_id || 'unknown',
          flow_name: flowConfig?.name || 'Unknown Flow',
          started_at: startEvent.timestamp,
          completed_at: completeEvent?.timestamp,
          abandoned_at: abandonEvent?.timestamp,
          screens_visited: screensVisited,
          converted,
        })
      })

      // Sort sessions by most recent first
      sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

      if (sessions.length === 0) return

      const mostRecentSession = sessions[0]

      // Determine status: "in_progress" only if < 30 minutes old, otherwise "abandoned"
      const sessionAge = Date.now() - new Date(mostRecentSession.started_at).getTime()
      const THIRTY_MINUTES_MS = 30 * 60 * 1000

      const mostRecentStatus: 'completed' | 'abandoned' | 'in_progress' =
        mostRecentSession.completed_at ? 'completed' :
        mostRecentSession.abandoned_at ? 'abandoned' :
        sessionAge < THIRTY_MINUTES_MS ? 'in_progress' :
        'abandoned'

      // Get country from first event
      const country = userEvents[0]?.properties?.country || 'Unknown'

      // Check if user ever converted
      const userConverted = sessions.some(s => s.converted)

      // Total screens viewed across all sessions
      const totalScreensViewed = sessions.reduce((sum, s) => sum + s.screens_visited.length, 0)

      activities.push({
        user_id,
        country,
        total_sessions: sessions.length,
        sessions,
        most_recent_session: mostRecentSession,
        most_recent_status: mostRecentStatus,
        total_screens_viewed: totalScreensViewed,
        converted: userConverted,
      })
    })

    // Sort by most recent activity first
    return activities.sort((a, b) =>
      new Date(b.most_recent_session.started_at).getTime() - new Date(a.most_recent_session.started_at).getTime()
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'Unknown': '🌍'
    }
    return flags[countryCode] || '🌍'
  }

  // Compute funnel data — queries Supabase directly so it's independent of the global time range
  useEffect(() => {
    if (!funnelFlowId || flowConfigs.size === 0 || !organization) {
      setFunnelData([])
      return
    }

    const flowConfig = flowConfigs.get(funnelFlowId)
    if (!flowConfig?.config?.screens) {
      setFunnelData([])
      return
    }

    const screens: any[] = flowConfig.config.screens.filter((s: any) => !s.hidden)

    // Determine date filter
    let startDate: Date | null = null
    let endDate: Date | null = null
    const now = new Date()

    switch (funnelTimeRange) {
      case 'deployment':
        if (flowConfig.updated_at) {
          startDate = new Date(flowConfig.updated_at)
        }
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (funnelCustomStart) startDate = new Date(funnelCustomStart)
        if (funnelCustomEnd) endDate = new Date(funnelCustomEnd + 'T23:59:59')
        break
    }

    // Query Supabase directly — same event types as User Activity section
    // Uses screen_viewed + screen_completed + onboarding_started
    // Matches by flow_id OR by screen_id (handles events before flow_id migration)
    const fetchFunnelEvents = async () => {
      let query = supabase
        .from('analytics_events')
        .select('event_name, screen_id, session_id, flow_id')
        .eq('organization_id', organization.id)
        .in('event_name', ['screen_viewed', 'screen_completed', 'onboarding_started'])

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString())
      }
      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString())
      }

      const { data: funnelEvents } = await query.limit(10000)

      if (!funnelEvents || funnelEvents.length === 0) {
        setFunnelData(screens.map((screen: any, idx: number) => ({
          screenId: screen.id,
          screenIndex: idx + 1,
          label: `Screen ${idx + 1}`,
          count: 0,
        })))
        return
      }

      // Build a set of screen IDs belonging to this flow for fallback matching
      const flowScreenIds = new Set(screens.map((s: any) => s.id))
      const firstScreenId = screens[0]?.id

      // Count unique sessions per screen_id
      // Match events by flow_id, or by screen_id if flow_id is null (pre-migration events)
      const screenSessionMap = new Map<string, Set<string>>()

      funnelEvents.forEach((e: any) => {
        // Determine if this event belongs to the selected flow
        const matchesByFlowId = e.flow_id === funnelFlowId
        const matchesByScreenId = !e.flow_id && flowScreenIds.has(e.screen_id)

        let screenId = e.screen_id

        // onboarding_started maps to the first screen (SDK doesn't fire screen_viewed for screen 1)
        if (e.event_name === 'onboarding_started') {
          if (matchesByFlowId || (!e.flow_id && firstScreenId)) {
            screenId = firstScreenId
          } else {
            return // onboarding_started for a different flow
          }
        } else if (!matchesByFlowId && !matchesByScreenId) {
          return // Event doesn't belong to this flow
        }

        if (!screenId) return
        if (!screenSessionMap.has(screenId)) {
          screenSessionMap.set(screenId, new Set())
        }
        screenSessionMap.get(screenId)!.add(e.session_id)
      })

      const bars: FunnelBar[] = screens.map((screen: any, idx: number) => {
        const sessions = screenSessionMap.get(screen.id)
        return {
          screenId: screen.id,
          screenIndex: idx + 1,
          label: `Screen ${idx + 1}`,
          count: sessions ? sessions.size : 0,
        }
      })

      setFunnelData(bars)
    }

    fetchFunnelEvents()
  }, [funnelFlowId, funnelTimeRange, funnelCustomStart, funnelCustomEnd, flowConfigs, organization])

  // Auto-select published production flow for funnel on data load
  useEffect(() => {
    if (flowConfigs.size === 0 || funnelFlowId) return

    // Try to find the published production flow
    let productionFlowId: string | null = null
    let firstFlowId: string | null = null

    flowConfigs.forEach((config, id) => {
      if (!firstFlowId) firstFlowId = id
      if (config.is_published && config.environment === 'production') {
        productionFlowId = id
      }
    })

    setFunnelFlowId(productionFlowId || firstFlowId)
  }, [flowConfigs])

  if (loading) {
    return (
      <Layout organizationName={organization?.name || 'Loading...'} plan={organization?.plan || 'free'}>
        <Container>
          <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
            <Text>Loading analytics...</Text>
          </div>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout organizationName={organization?.name || ''} plan={organization?.plan || 'free'}>
      <Container>
        <div style={{ paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>
          {/* Header */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <Heading level={1} serif>
              Analytics
            </Heading>
            <Text variant="muted" size="sm">{getTimeRangeLabel(timeRange)}</Text>
          </div>

          {/* Time Range Tabs */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.xl,
            borderBottom: `1px solid ${theme.colors.border}`,
            paddingBottom: theme.spacing.sm
          }}>
            {(['24h', '7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.fontSizes.sm,
                  fontWeight: timeRange === range ? '600' : '500',
                  color: timeRange === range ? theme.colors.primary : theme.colors.textMuted,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: timeRange === range ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-1px',
                }}
                onMouseEnter={(e) => {
                  if (timeRange !== range) {
                    e.currentTarget.style.color = theme.colors.text
                  }
                }}
                onMouseLeave={(e) => {
                  if (timeRange !== range) {
                    e.currentTarget.style.color = theme.colors.textMuted
                  }
                }}
              >
                {range === '24h' ? '24 Hours' :
                 range === '7d' ? '7 Days' :
                 range === '30d' ? '30 Days' :
                 range === '90d' ? '90 Days' :
                 'All Time'}
              </button>
            ))}
          </div>

          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
            <Card padding="md">
              <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
                Total Events
              </Text>
              <Heading level={2} serif>{stats.totalEvents}</Heading>
            </Card>
            <Card padding="md">
              <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
                Unique Users
              </Text>
              <Heading level={2} serif>{stats.uniqueUsers}</Heading>
            </Card>
            <Card padding="md">
              <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
                Sessions
              </Text>
              <Heading level={2} serif>{stats.uniqueSessions}</Heading>
            </Card>
            <Card padding="md">
              <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
                Completion Rate
              </Text>
              <Heading level={2} serif style={{ color: theme.colors.successText }}>
                {stats.completionRate}%
              </Heading>
              <Text variant="light" size="xs" style={{ marginTop: theme.spacing.sm }}>
                {stats.onboardingCompletions} / {stats.onboardingStarts} completed
              </Text>
            </Card>
          </div>

          {/* Paywall Metrics */}
          <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
            💎 Paywall Performance
          </Heading>
          {stats.paywallViews === 0 && revenueCatEvents.length === 0 ? (
            // Show setup message when no paywall data
            <Card padding="lg" style={{ marginBottom: theme.spacing.xl, textAlign: 'center' }}>
              <Text style={{ fontSize: theme.fontSizes.base, marginBottom: theme.spacing.md, color: theme.colors.text }}>
                Track how your onboarding affects your paywall conversions (only for paid plans)
              </Text>
              <button
                onClick={() => {
                  const isPaid = organization?.plan && organization.plan !== 'free'
                  // Track paywall setup click
                  trackAnalyticsPaywallSetupClicked(organization?.plan || 'free')
                  // Navigate to pricing if free plan, or RevenueCat docs section if paid
                  window.location.href = isPaid ? '/docs?section=revenuecat' : '/pricing'
                }}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor: '#ea580c', // Orange theme
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c2410c'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ea580c'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Start Setup
              </button>
            </Card>
          ) : (
            // Show normal cards when paywall data exists
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
              <Card padding="md">
                <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
                  Paywall Views
                </Text>
                <Heading level={2} serif>{stats.paywallViews}</Heading>
              </Card>
              <Card padding="md">
                <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
                  Conversions
                </Text>
                <Heading level={2} serif>{stats.paywallConversions}</Heading>
              </Card>
              <Card padding="md">
                <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
                  Conversion Rate
                </Text>
                <Heading level={2} serif style={{ color: stats.paywallConversionRate > 0 ? theme.colors.successText : theme.colors.text }}>
                  {stats.paywallConversionRate}%
                </Heading>
                <Text variant="light" size="xs" style={{ marginTop: theme.spacing.sm }}>
                  {stats.paywallConversions} / {stats.paywallViews} converted
                </Text>
              </Card>
              <Card padding="md">
                <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
                  Total Revenue
                </Text>
                <Heading level={2} serif style={{ color: stats.totalRevenue > 0 ? theme.colors.successText : theme.colors.text }}>
                  ${stats.totalRevenue.toFixed(2)}
                </Heading>
                <Text variant="light" size="xs" style={{ marginTop: theme.spacing.sm }}>
                  From {revenueCatEvents?.filter((e: any) => e.event_type === 'INITIAL_PURCHASE').length || 0} purchases
                </Text>
              </Card>
            </div>
          )}

          {/* Screen Funnel */}
          <Card padding="md" style={{ marginBottom: theme.spacing.xl }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
              <Heading level={3} serif>
                Screen Funnel
              </Heading>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                {/* Flow selector */}
                <select
                  value={funnelFlowId || ''}
                  onChange={(e) => setFunnelFlowId(e.target.value || null)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    fontSize: theme.fontSizes.sm,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '160px',
                  }}
                >
                  {Array.from(flowConfigs.entries()).map(([id, config]) => (
                    <option key={id} value={id}>
                      {config.name}{config.is_published && config.environment === 'production' ? ' (Production)' : config.is_published && config.environment === 'test' ? ' (Test)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Funnel date range tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.lg,
              flexWrap: 'wrap',
            }}>
              {([
                { key: 'deployment' as FunnelTimeRange, label: 'Last Deployment' },
                { key: '24h' as FunnelTimeRange, label: '24 Hours' },
                { key: '7d' as FunnelTimeRange, label: '7 Days' },
                { key: '30d' as FunnelTimeRange, label: '30 Days' },
                { key: 'custom' as FunnelTimeRange, label: 'Custom' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFunnelTimeRange(key)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    fontSize: theme.fontSizes.xs,
                    fontWeight: funnelTimeRange === key ? '600' : '500',
                    color: funnelTimeRange === key ? '#fff' : theme.colors.textMuted,
                    backgroundColor: funnelTimeRange === key ? theme.colors.primary : theme.colors.background,
                    border: `1px solid ${funnelTimeRange === key ? theme.colors.primary : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (funnelTimeRange !== key) {
                      e.currentTarget.style.borderColor = theme.colors.primary
                      e.currentTarget.style.color = theme.colors.text
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (funnelTimeRange !== key) {
                      e.currentTarget.style.borderColor = theme.colors.border
                      e.currentTarget.style.color = theme.colors.textMuted
                    }
                  }}
                >
                  {label}
                </button>
              ))}

              {/* Custom date pickers */}
              {funnelTimeRange === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <input
                    type="date"
                    value={funnelCustomStart}
                    onChange={(e) => setFunnelCustomStart(e.target.value)}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      fontSize: theme.fontSizes.xs,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                    }}
                  />
                  <Text size="xs" variant="muted">to</Text>
                  <input
                    type="date"
                    value={funnelCustomEnd}
                    onChange={(e) => setFunnelCustomEnd(e.target.value)}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      fontSize: theme.fontSizes.xs,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bar chart */}
            {funnelData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {(() => {
                  const maxCount = Math.max(...funnelData.map(d => d.count), 1)
                  return funnelData.map((bar, idx) => {
                    const widthPct = maxCount > 0 ? (bar.count / maxCount) * 100 : 0
                    const pctOfFirst = funnelData[0].count > 0 ? ((bar.count / funnelData[0].count) * 100).toFixed(0) : '0'
                    const prevCount = idx > 0 ? funnelData[idx - 1].count : null
                    const dropOff = prevCount !== null && prevCount > 0
                      ? (((prevCount - bar.count) / prevCount) * 100).toFixed(0)
                      : null

                    return (
                      <React.Fragment key={bar.screenId}>
                        {/* Drop-off label between bars */}
                        {dropOff !== null && (
                          <div style={{
                            paddingLeft: theme.spacing.sm,
                            paddingTop: '2px',
                            paddingBottom: '2px',
                          }}>
                            <Text size="xs" variant="muted" style={{ fontSize: '0.7rem' }}>
                              ↓ {dropOff}% drop-off
                            </Text>
                          </div>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.md,
                        }}>
                          {/* Screen label */}
                          <div style={{
                            width: '80px',
                            flexShrink: 0,
                            textAlign: 'right',
                          }}>
                            <Text size="sm" style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
                              {bar.label}
                            </Text>
                          </div>
                          {/* Bar */}
                          <div style={{
                            flex: 1,
                            height: '36px',
                            backgroundColor: theme.colors.background,
                            borderRadius: theme.borderRadius.sm,
                            overflow: 'hidden',
                            position: 'relative',
                          }}>
                            <div style={{
                              width: `${widthPct}%`,
                              height: '100%',
                              backgroundColor: theme.colors.primary,
                              opacity: 1 - (idx * 0.08),
                              borderRadius: theme.borderRadius.sm,
                              transition: 'width 0.5s ease-out',
                              minWidth: bar.count > 0 ? '4px' : '0',
                            }} />
                            {/* Count label inside bar */}
                            {bar.count > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: `${Math.min(widthPct, 100)}%`,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: theme.spacing.sm,
                              }}>
                                <Text size="xs" style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                                  {bar.count} <span style={{ fontWeight: '400', color: theme.colors.textMuted }}>({pctOfFirst}%)</span>
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })
                })()}
              </div>
            ) : (
              <div style={{
                padding: theme.spacing.xl,
                textAlign: 'center',
                color: theme.colors.textMuted,
              }}>
                <Text variant="muted">
                  {funnelFlowId ? 'No data for this flow in the selected time range' : 'Select a flow to view the screen funnel'}
                </Text>
              </div>
            )}
          </Card>

          {/* User Activity */}
          <Card padding="md">
            <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
              User Activity
            </Heading>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
                    <th style={{ textAlign: 'left', padding: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted }}>
                      User ID
                    </th>
                    <th style={{ textAlign: 'left', padding: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted }}>
                      Flow
                    </th>
                    <th style={{ textAlign: 'left', padding: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted }}>
                      Country
                    </th>
                    <th style={{ textAlign: 'left', padding: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted }}>
                      Sessions
                    </th>
                    <th style={{ textAlign: 'left', padding: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted }}>
                      Total Screens
                    </th>
                    <th style={{ textAlign: 'left', padding: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted }}>
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userActivities.slice(0, visibleRows).map((activity) => (
                    <React.Fragment key={activity.user_id}>
                      <tr
                        onClick={() => setExpandedUser(expandedUser === activity.user_id ? null : activity.user_id)}
                        style={{
                          borderBottom: `1px solid ${theme.colors.border}`,
                          cursor: 'pointer',
                          backgroundColor: expandedUser === activity.user_id ? theme.colors.background : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (expandedUser !== activity.user_id) {
                            e.currentTarget.style.backgroundColor = theme.colors.background
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (expandedUser !== activity.user_id) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <td style={{ padding: theme.spacing.md, fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.mono, color: theme.colors.textMuted }}>
                          {activity.user_id.substring(0, 12)}...
                        </td>
                        <td style={{ padding: theme.spacing.md, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>
                          {activity.most_recent_session.flow_name}
                        </td>
                        <td style={{ padding: theme.spacing.md, fontSize: theme.fontSizes.sm }}>
                          <span style={{ marginRight: theme.spacing.xs }}>{getCountryFlag(activity.country)}</span>
                          {activity.country}
                        </td>
                        <td style={{ padding: theme.spacing.md, fontSize: theme.fontSizes.sm, color: theme.colors.textMuted }}>
                          {activity.total_sessions} sessions
                        </td>
                        <td style={{ padding: theme.spacing.md, fontSize: theme.fontSizes.sm, color: theme.colors.textMuted }}>
                          {activity.total_screens_viewed} screens
                        </td>
                        <td style={{ padding: theme.spacing.md, fontSize: theme.fontSizes.sm }}>
                          {activity.most_recent_status === 'completed' ? (
                            <span style={{
                              color: theme.colors.successText,
                              backgroundColor: theme.colors.success,
                              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: theme.fontSizes.xs,
                              fontWeight: '600'
                            }}>
                              ✓ Completed
                            </span>
                          ) : activity.most_recent_status === 'abandoned' ? (
                            <span style={{
                              color: theme.colors.errorText,
                              backgroundColor: theme.colors.error,
                              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: theme.fontSizes.xs,
                              fontWeight: '600'
                            }}>
                              × Abandoned
                            </span>
                          ) : (
                            <span style={{
                              color: theme.colors.textMuted,
                              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: theme.fontSizes.xs,
                            }}>
                              In Progress
                            </span>
                          )}
                          {activity.converted && (
                            <span style={{
                              marginLeft: theme.spacing.sm,
                              color: '#047857',
                              backgroundColor: '#d1fae5',
                              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: theme.fontSizes.xs,
                              fontWeight: '600'
                            }}>
                              💰 Converted
                            </span>
                          )}
                        </td>
                        <td style={{ padding: theme.spacing.md, fontSize: theme.fontSizes.sm, color: theme.colors.textMuted }}>
                          {formatDate(activity.most_recent_session.started_at)}
                        </td>
                      </tr>

                      {/* Expanded Session Breakdown */}
                      {expandedUser === activity.user_id && (
                        <tr>
                          <td colSpan={7} style={{ backgroundColor: theme.colors.background, padding: theme.spacing.lg }}>
                            <div>
                              <Text style={{ fontWeight: '600', marginBottom: theme.spacing.md, fontSize: theme.fontSizes.lg }}>
                                All Sessions ({activity.sessions.length})
                              </Text>

                              {activity.sessions.map((session, sessionIdx) => (
                                <div
                                  key={session.session_id}
                                  style={{
                                    marginBottom: theme.spacing.lg,
                                    padding: theme.spacing.md,
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: theme.borderRadius.md,
                                    border: `1px solid ${theme.colors.border}`
                                  }}
                                >
                                  {/* Session Header */}
                                  <div style={{ marginBottom: theme.spacing.md, paddingBottom: theme.spacing.sm, borderBottom: `1px solid ${theme.colors.border}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <Text style={{ fontWeight: '600' }}>
                                          Session {sessionIdx + 1}: {session.flow_name}
                                        </Text>
                                        <Text size="xs" variant="muted">
                                          Started {formatDate(session.started_at)}
                                        </Text>
                                      </div>
                                      <div>
                                        {(() => {
                                          const sessionAge = Date.now() - new Date(session.started_at).getTime()
                                          const THIRTY_MINUTES_MS = 30 * 60 * 1000
                                          const isInProgress = !session.completed_at && !session.abandoned_at && sessionAge < THIRTY_MINUTES_MS

                                          if (session.completed_at) {
                                            return (
                                              <span style={{
                                                color: theme.colors.successText,
                                                backgroundColor: theme.colors.success,
                                                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                                borderRadius: theme.borderRadius.sm,
                                                fontSize: theme.fontSizes.xs,
                                                fontWeight: '600'
                                              }}>
                                                ✓ Completed
                                              </span>
                                            )
                                          } else if (session.abandoned_at || !isInProgress) {
                                            return (
                                              <span style={{
                                                color: theme.colors.errorText,
                                                backgroundColor: theme.colors.error,
                                                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                                borderRadius: theme.borderRadius.sm,
                                                fontSize: theme.fontSizes.xs,
                                                fontWeight: '600'
                                              }}>
                                                × Abandoned
                                              </span>
                                            )
                                          } else {
                                            return (
                                              <span style={{
                                                color: theme.colors.textMuted,
                                                fontSize: theme.fontSizes.xs,
                                              }}>
                                                In Progress
                                              </span>
                                            )
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Screen Progression */}
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: theme.spacing.sm,
                                  }}>
                                    {session.screens_visited.map((screen, idx) => (
                                      <div
                                        key={idx}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: theme.spacing.md,
                                          padding: theme.spacing.sm,
                                          backgroundColor: theme.colors.background,
                                          borderRadius: theme.borderRadius.md,
                                          borderLeft: `3px solid ${theme.colors.primary}`
                                        }}
                                      >
                                        <div style={{
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '50%',
                                          backgroundColor: theme.colors.primary,
                                          color: '#fff',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: theme.fontSizes.sm,
                                          fontWeight: '600'
                                        }}>
                                          {screen.screen_number}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <Text size="sm" style={{ fontWeight: '500' }}>
                                            Screen {screen.screen_number}: {screen.screen_id}
                                          </Text>
                                          <Text size="xs" variant="muted">
                                            {formatDate(screen.timestamp)}
                                          </Text>
                                        </div>
                                        {idx === session.screens_visited.length - 1 && !session.completed_at && (
                                          <span style={{
                                            color: theme.colors.errorText,
                                            fontSize: theme.fontSizes.xs,
                                            fontWeight: '600'
                                          }}>
                                            ← Dropped off here
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {session.completed_at && (
                                    <div style={{
                                      marginTop: theme.spacing.md,
                                      padding: theme.spacing.md,
                                      backgroundColor: theme.colors.success,
                                      color: theme.colors.successText,
                                      borderRadius: theme.borderRadius.md,
                                      fontWeight: '600',
                                      textAlign: 'center'
                                    }}>
                                      ✓ Completed onboarding at {formatDate(session.completed_at)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {userActivities.length > visibleRows && (
              <button
                onClick={() => setVisibleRows((prev) => prev + 15)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: theme.spacing.md,
                  padding: theme.spacing.md,
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '600',
                  color: theme.colors.primary,
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.colors.primaryTint }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Show more ({userActivities.length - visibleRows} remaining)
              </button>
            )}
          </Card>
        </div>
      </Container>
    </Layout>
  )
}
