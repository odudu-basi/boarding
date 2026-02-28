'use client'

import { useState } from 'react'
import { Button, Text } from './ui'
import { theme } from '@/lib/theme'
import { useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase/client'
import type { Screen } from '@/lib/types'

interface CustomScreenChange {
  type: 'added' | 'removed' | 'edited'
  componentName: string
}

function detectCustomScreenChanges(
  currentScreens: Screen[],
  publishedScreens: Screen[]
): CustomScreenChange[] {
  const changes: CustomScreenChange[] = []

  const currentCustom = currentScreens.filter(
    (s) => s.type === 'custom_screen' && s.custom_component_name
  )
  const publishedCustom = publishedScreens.filter(
    (s) => s.type === 'custom_screen' && s.custom_component_name
  )

  const publishedMap = new Map(
    publishedCustom.map((s) => [s.id, s])
  )
  const currentMap = new Map(
    currentCustom.map((s) => [s.id, s])
  )

  // Check for added or edited screens
  for (const screen of currentCustom) {
    const published = publishedMap.get(screen.id)
    if (!published) {
      changes.push({ type: 'added', componentName: screen.custom_component_name! })
    } else if (
      screen.custom_component_name !== published.custom_component_name ||
      screen.custom_description !== published.custom_description ||
      JSON.stringify(screen.custom_variables || []) !== JSON.stringify(published.custom_variables || [])
    ) {
      changes.push({ type: 'edited', componentName: screen.custom_component_name! })
    }
  }

  // Check for removed screens
  for (const screen of publishedCustom) {
    if (!currentMap.has(screen.id)) {
      changes.push({ type: 'removed', componentName: screen.custom_component_name! })
    }
  }

  return changes
}

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onPublish: (environment: 'test' | 'production') => Promise<void>
  subscriptionPlan?: string
  lastPublishedAt?: string | null
  currentScreens: Screen[]
  configId: string
  projectId?: string | null
  organizationId?: string
}

export function PublishModal({
  isOpen,
  onClose,
  onPublish,
  subscriptionPlan = 'free',
  lastPublishedAt,
  currentScreens,
  configId,
  projectId,
  organizationId,
}: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [showProductionConfirm, setShowProductionConfirm] = useState(false)
  const [showCustomScreenWarning, setShowCustomScreenWarning] = useState(false)
  const [customScreenChanges, setCustomScreenChanges] = useState<CustomScreenChange[]>([])
  const [checkingChanges, setCheckingChanges] = useState(false)
  const { toast } = useToast()

  const canPublishProduction = subscriptionPlan !== 'free'

  if (!isOpen) return null

  const handleTestPublish = async () => {
    try {
      setIsPublishing(true)
      await onPublish('test')
      toast('Published to test environment', 'success')
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to publish', 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleProductionPublish = async () => {
    try {
      setIsPublishing(true)
      await onPublish('production')
      toast('Published to production', 'success')
      setShowProductionConfirm(false)
      setShowCustomScreenWarning(false)
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to publish', 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  const checkCustomScreenChanges = async () => {
    setCheckingChanges(true)
    try {
      const supabase = createClient()

      // Find the currently published production config for this project/org
      let query = supabase
        .from('onboarding_configs')
        .select('config')
        .eq('is_published', true)
        .eq('environment', 'production')
        .neq('id', configId)

      if (projectId) {
        query = query.eq('project_id', projectId)
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data: publishedConfigs } = await query.limit(1)

      // Also check if this same config was previously published to production
      const { data: selfConfig } = await supabase
        .from('onboarding_configs')
        .select('config, is_published, environment')
        .eq('id', configId)
        .single()

      let publishedScreens: Screen[] = []

      if (selfConfig?.is_published && selfConfig?.environment === 'production') {
        // This config is already published to production, compare against its saved state
        publishedScreens = selfConfig.config?.screens || []
      } else if (publishedConfigs && publishedConfigs.length > 0) {
        // Another config is published to production
        publishedScreens = publishedConfigs[0].config?.screens || []
      }
      // If nothing is published to production yet, publishedScreens stays empty,
      // so any custom screen in the current config will count as "added"

      const changes = detectCustomScreenChanges(currentScreens, publishedScreens)

      if (changes.length > 0) {
        setCustomScreenChanges(changes)
        setShowCustomScreenWarning(true)
      } else {
        setShowProductionConfirm(true)
      }
    } catch {
      // If we fail to check, just proceed with normal confirmation
      setShowProductionConfirm(true)
    } finally {
      setCheckingChanges(false)
    }
  }

  // Custom screen warning modal
  if (showCustomScreenWarning) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowCustomScreenWarning(false)}
      >
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            maxWidth: '460px',
            width: '90%',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Text
            size="lg"
            style={{ marginBottom: theme.spacing.sm, fontWeight: 600 }}
          >
            Custom Screen Changes Detected
          </Text>
          <Text
            variant="muted"
            size="sm"
            style={{ marginBottom: theme.spacing.lg, lineHeight: 1.6 }}
          >
            This update includes changes to custom screens. Make sure you have released a new version of your app with the updated custom screen components before publishing to production.
          </Text>

          {/* List of changes */}
          <div style={{
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.xl,
          }}>
            {customScreenChanges.map((change, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.xs} 0`,
                borderBottom: i < customScreenChanges.length - 1 ? `1px solid ${theme.colors.border}` : undefined,
              }}>
                <span style={{
                  fontSize: theme.fontSizes.xs,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: change.type === 'added' ? '#16a34a' : change.type === 'removed' ? '#dc2626' : '#f26522',
                  minWidth: 60,
                }}>
                  {change.type}
                </span>
                <Text size="sm" style={{ fontFamily: theme.fonts.mono }}>
                  {change.componentName}
                </Text>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <Button
              variant="secondary"
              onClick={() => setShowCustomScreenWarning(false)}
              disabled={isPublishing}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowCustomScreenWarning(false)
                setShowProductionConfirm(true)
              }}
              disabled={isPublishing}
              style={{ flex: 1 }}
            >
              I have updated my app
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Production confirmation modal
  if (showProductionConfirm) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowProductionConfirm(false)}
      >
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            maxWidth: '400px',
            width: '90%',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Text
            size="lg"
            style={{ marginBottom: theme.spacing.md, fontWeight: 600 }}
          >
            Publish to Production?
          </Text>
          <Text
            variant="muted"
            style={{ marginBottom: theme.spacing.xl }}
          >
            This will update your live onboarding flow for all production users. Are you sure you want to continue?
          </Text>
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <Button
              variant="secondary"
              onClick={() => setShowProductionConfirm(false)}
              disabled={isPublishing}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleProductionPublish}
              disabled={isPublishing}
              style={{ flex: 1 }}
            >
              {isPublishing ? 'Publishing...' : 'Yes, Publish'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Format last published timestamp
  const formatLastPublished = (timestamp: string | null | undefined) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Main publish modal
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          maxWidth: '400px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Text
          size="lg"
          style={{ marginBottom: theme.spacing.md, fontWeight: 600 }}
        >
          Publish Onboarding Flow
        </Text>
        <Text
          variant="muted"
          style={{ marginBottom: theme.spacing.xl }}
        >
          Choose which environment to publish to:
        </Text>

        {/* Last published timestamp */}
        {lastPublishedAt && (
          <div style={{
            backgroundColor: theme.colors.background,
            padding: theme.spacing.sm,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.lg,
          }}>
            <Text variant="muted" size="xs" style={{ display: 'block', marginBottom: '2px' }}>
              Last published to production
            </Text>
            <Text size="sm" style={{ fontWeight: 500 }}>
              {formatLastPublished(lastPublishedAt)}
            </Text>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <Button
            variant="secondary"
            onClick={handleTestPublish}
            disabled={isPublishing}
            style={{ width: '100%' }}
          >
            {isPublishing ? 'Publishing...' : 'Publish for Testing'}
          </Button>
          <div>
            <Button
              variant="primary"
              onClick={() => {
                if (canPublishProduction) {
                  checkCustomScreenChanges()
                } else {
                  toast('Upgrade to a paid plan to publish to production', 'error')
                }
              }}
              disabled={isPublishing || checkingChanges || !canPublishProduction}
              style={{ width: '100%', opacity: canPublishProduction ? 1 : 0.5 }}
            >
              {checkingChanges ? 'Checking...' : 'Publish to Production'}
            </Button>
            {!canPublishProduction && (
              <Text variant="muted" size="xs" style={{ marginTop: theme.spacing.xs, textAlign: 'center', display: 'block' }}>
                Requires paid plan
              </Text>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isPublishing}
          style={{ width: '100%', marginTop: theme.spacing.md }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
