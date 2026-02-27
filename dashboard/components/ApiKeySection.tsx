'use client'

import { Card, Heading, Text } from '@/components/ui'
import { CopyButton } from '@/components/CopyButton'
import { theme } from '@/lib/theme'
import { trackSdkApiKeyCopied } from '@/lib/mixpanel'

interface ApiKeySectionProps {
  testApiKey: string
  productionApiKey: string
  projectId?: string
}

export function ApiKeySection({ testApiKey, productionApiKey, projectId }: ApiKeySectionProps) {
  return (
    <Card padding="md" style={{ marginBottom: theme.spacing.xl }}>
      <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>Your API Keys</Heading>
      <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.md }}>
        Use these keys in your React Native app
      </Text>

      {/* Test API Key */}
      <div style={{ marginBottom: theme.spacing.md }}>
        <Text size="sm" style={{ marginBottom: theme.spacing.xs, fontWeight: 500 }}>
          Test API Key
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <code
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderRadius: theme.borderRadius.md,
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.text,
            }}
          >
            {testApiKey}
          </code>
          <CopyButton
            text={testApiKey}
            onCopy={() => trackSdkApiKeyCopied('test', projectId)}
          />
        </div>
        <Text variant="muted" size="xs" style={{ marginTop: theme.spacing.xs }}>
          For development and testing
        </Text>
      </div>

      {/* Production API Key */}
      <div>
        <Text size="sm" style={{ marginBottom: theme.spacing.xs, fontWeight: 500 }}>
          Production API Key
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <code
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderRadius: theme.borderRadius.md,
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.text,
            }}
          >
            {productionApiKey}
          </code>
          <CopyButton
            text={productionApiKey}
            onCopy={() => trackSdkApiKeyCopied('production', projectId)}
          />
        </div>
        <Text variant="muted" size="xs" style={{ marginTop: theme.spacing.xs }}>
          For production builds
        </Text>
      </div>
    </Card>
  )
}
