'use client'

import { useThemeMode } from '@/components/Providers'
import { theme } from '@/lib/theme'

const THEMES = [
  {
    id: 'light' as const,
    label: 'Light',
    previewBg: '#f8f5f0',
    previewSurface: '#ffffff',
    previewText: '#1a1a1a',
    previewAccent: '#f26522',
  },
  {
    id: 'dark' as const,
    label: 'Dark',
    previewBg: '#1a1a1a',
    previewSurface: '#2a2a2a',
    previewText: '#e8e8e8',
    previewAccent: '#f26522',
  },
]

export function ThemeSelector() {
  const { themeMode, setThemeMode } = useThemeMode()

  return (
    <div style={{ display: 'flex', gap: theme.spacing.md }}>
      {THEMES.map((t) => {
        const isActive = themeMode === t.id
        return (
          <button
            key={t.id}
            onClick={() => setThemeMode(t.id)}
            style={{
              flex: 1,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
              border: `2px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              textAlign: 'left',
            }}
          >
            {/* Mini preview swatch */}
            <div
              style={{
                borderRadius: theme.borderRadius.md,
                overflow: 'hidden',
                border: `1px solid ${theme.colors.border}`,
                marginBottom: theme.spacing.sm,
                height: 80,
                backgroundColor: t.previewBg,
                padding: theme.spacing.sm,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* Mini sidebar + content preview */}
              <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                <div style={{
                  width: 40,
                  backgroundColor: t.previewSurface,
                  borderRadius: 4,
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}>
                  <div style={{ width: 12, height: 2, backgroundColor: t.previewAccent, borderRadius: 1 }} />
                  <div style={{ width: '100%', height: 2, backgroundColor: t.previewAccent, borderRadius: 1, opacity: 0.3 }} />
                  <div style={{ width: '100%', height: 2, backgroundColor: t.previewText, borderRadius: 1, opacity: 0.15 }} />
                  <div style={{ width: '100%', height: 2, backgroundColor: t.previewText, borderRadius: 1, opacity: 0.15 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ height: 6, width: '60%', backgroundColor: t.previewText, borderRadius: 2, opacity: 0.8 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ flex: 1, height: 20, backgroundColor: t.previewSurface, borderRadius: 3 }} />
                    <div style={{ flex: 1, height: 20, backgroundColor: t.previewSurface, borderRadius: 3 }} />
                  </div>
                  <div style={{ flex: 1, backgroundColor: t.previewSurface, borderRadius: 3 }} />
                </div>
              </div>
            </div>

            {/* Label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `2px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {isActive && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.colors.primary,
                  }} />
                )}
              </div>
              <span style={{
                fontSize: theme.fontSizes.sm,
                fontWeight: isActive ? '600' : '400',
                color: theme.colors.text,
                fontFamily: theme.fonts.sans,
              }}>
                {t.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
