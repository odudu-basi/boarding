'use client'

import { useState } from 'react'
import { Button, Text } from './ui'
import { theme } from '@/lib/theme'
import { useToast } from '@/components/Toast'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onPublish: (environment: 'test' | 'production') => Promise<void>
}

export function PublishModal({ isOpen, onClose, onPublish }: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [showProductionConfirm, setShowProductionConfirm] = useState(false)
  const { toast } = useToast()

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <Button
            variant="secondary"
            onClick={handleTestPublish}
            disabled={isPublishing}
            style={{ width: '100%' }}
          >
            {isPublishing ? 'Publishing...' : 'Publish for Testing'}
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowProductionConfirm(true)}
            disabled={isPublishing}
            style={{ width: '100%' }}
          >
            Publish to Production
          </Button>
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
