'use client'

import { useState } from 'react'
import { Button, Text } from './ui'
import { theme } from '@/lib/theme'
import { useToast } from '@/components/Toast'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onPublish: (environment: 'test' | 'production') => Promise<void>
  subscriptionPlan?: string
  lastPublishedAt?: string | null
}

export function PublishModal({ isOpen, onClose, onPublish, subscriptionPlan = 'free', lastPublishedAt }: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [showProductionConfirm, setShowProductionConfirm] = useState(false)
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
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to publish', 'error')
    } finally {
      setIsPublishing(false)
    }
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
                  setShowProductionConfirm(true)
                } else {
                  toast('Upgrade to a paid plan to publish to production', 'error')
                }
              }}
              disabled={isPublishing || !canPublishProduction}
              style={{ width: '100%', opacity: canPublishProduction ? 1 : 0.5 }}
            >
              Publish to Production
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
