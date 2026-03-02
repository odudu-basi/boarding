'use client'

import { useState } from 'react'
import { Container, Card, Heading, Text, Button } from '@/components/ui'
import { theme } from '@/lib/theme'

export function SupportContent({ userEmail }: { userEmail: string }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })

      if (!res.ok) throw new Error('Failed to send')

      setStatus('sent')
      setSubject('')
      setMessage('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Container>
      <div style={{ paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl, maxWidth: 640 }}>
        <div style={{ marginBottom: theme.spacing.xl }}>
          <Heading level={1} serif>
            Support
          </Heading>
          <Text variant="muted" style={{ marginTop: theme.spacing.sm }}>
            Send us a message and we'll get back to you via email.
          </Text>
        </div>

        {status === 'sent' ? (
          <Card padding="lg">
            <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <div style={{ fontSize: 48, marginBottom: theme.spacing.md }}>&#10003;</div>
              <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
                Message Sent
              </Heading>
              <Text variant="muted" style={{ marginBottom: theme.spacing.lg }}>
                We'll reply to {userEmail} as soon as possible.
              </Text>
              <Button onClick={() => setStatus('idle')}>Send Another Message</Button>
            </div>
          </Card>
        ) : (
          <Card padding="lg">
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: theme.spacing.md }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.fontSizes.sm,
                    fontWeight: '500',
                    color: theme.colors.text,
                    fontFamily: theme.fonts.sans,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Your Email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.background,
                    color: theme.colors.textMuted,
                    fontSize: theme.fontSizes.sm,
                    fontFamily: theme.fonts.sans,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: theme.spacing.md }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.fontSizes.sm,
                    fontWeight: '500',
                    color: theme.colors.text,
                    fontFamily: theme.fonts.sans,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What can we help with?"
                  required
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontSize: theme.fontSizes.sm,
                    fontFamily: theme.fonts.sans,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.fontSizes.sm,
                    fontWeight: '500',
                    color: theme.colors.text,
                    fontFamily: theme.fonts.sans,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or feedback..."
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontSize: theme.fontSizes.sm,
                    fontFamily: theme.fonts.sans,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              {status === 'error' && (
                <div style={{
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.md,
                  backgroundColor: theme.colors.error,
                  border: `1px solid ${theme.colors.errorText}`,
                  borderRadius: theme.borderRadius.sm,
                  color: theme.colors.errorText,
                  fontSize: theme.fontSizes.sm,
                }}>
                  Failed to send message. Please try again.
                </div>
              )}

              <Button
                type="submit"
                disabled={status === 'sending' || !subject || !message}
                style={{ width: '100%' }}
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </Container>
  )
}
