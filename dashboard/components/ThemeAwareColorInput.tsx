import { FlowTheme } from '@/lib/types'
import { resolveTokenPath, isThemeToken } from '@/lib/themeResolver'
import { theme } from '@/lib/theme'

interface ThemeAwareColorInputProps {
  value: string
  onChange: (value: string) => void
  flowTheme?: FlowTheme
}

export function ThemeAwareColorInput({ value, onChange, flowTheme }: ThemeAwareColorInputProps) {
  const isToken = isThemeToken(value)
  const resolvedValue = isToken && flowTheme
    ? resolveTokenPath(value, flowTheme)
    : value

  // Ensure the color picker gets a valid hex value
  const colorPickerValue = typeof resolvedValue === 'string' && resolvedValue.startsWith('#')
    ? resolvedValue
    : '#000000'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.md,
      }}>
        <input
          type="color"
          value={colorPickerValue}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 28,
            height: 28,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
            padding: 0,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: theme.spacing.xs,
            backgroundColor: 'transparent',
            border: 'none',
            color: theme.colors.text,
            fontSize: theme.fontSizes.sm,
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
        {isToken && (
          <span style={{
            fontSize: '10px',
            color: theme.colors.primary,
            fontWeight: '500',
            whiteSpace: 'nowrap',
          }}>
            {value.replace('theme.colors.', '')}
          </span>
        )}
      </div>

      {/* Theme color swatches */}
      {flowTheme && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {(Object.entries(flowTheme.colors) as [string, string][]).map(([key, color]) => {
            const token = `theme.colors.${key}`
            const isActive = value === token
            return (
              <button
                key={key}
                onClick={() => onChange(token)}
                title={`${formatLabel(key)}: ${color}`}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: color,
                  border: isActive
                    ? `2px solid ${theme.colors.primary}`
                    : '1px solid rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}
