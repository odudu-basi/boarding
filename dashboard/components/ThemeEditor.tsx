import { FlowTheme } from '@/lib/types'
import { THEME_PRESETS } from '@/lib/flowTheme'
import { theme } from '@/lib/theme'
import { useState } from 'react'

interface ThemeEditorProps {
  flowTheme: FlowTheme
  onChange: (theme: FlowTheme) => void
}

export function ThemeEditor({ flowTheme, onChange }: ThemeEditorProps) {
  const updateColors = (key: keyof FlowTheme['colors'], value: string) => {
    onChange({ ...flowTheme, colors: { ...flowTheme.colors, [key]: value } })
  }

  const updateTypography = (group: 'heading' | 'body', updates: Partial<{ fontSize: number; fontWeight: string }>) => {
    onChange({
      ...flowTheme,
      typography: {
        ...flowTheme.typography,
        [group]: { ...flowTheme.typography[group], ...updates },
      },
    })
  }

  const updateButton = (updates: Partial<FlowTheme['button']>) => {
    onChange({ ...flowTheme, button: { ...flowTheme.button, ...updates } })
  }

  const updateInput = (updates: Partial<FlowTheme['input']>) => {
    onChange({ ...flowTheme, input: { ...flowTheme.input, ...updates } })
  }

  const updateGeneral = (updates: Partial<FlowTheme['general']>) => {
    onChange({ ...flowTheme, general: { ...flowTheme.general, ...updates } })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      fontFamily: theme.fonts.sans,
      color: theme.colors.text,
    }}>
      {/* Presets */}
      <Section title="Presets" icon="◑">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.theme)}
              style={{
                flex: '1 1 calc(50% - 4px)',
                minWidth: 100,
                padding: '10px 8px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.colors.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.colors.border)}
            >
              <div style={{ display: 'flex', gap: 3 }}>
                {[preset.theme.colors.primary, preset.theme.colors.secondary, preset.theme.colors.background, preset.theme.colors.text].map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      backgroundColor: color,
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors" icon="◔">
        {(Object.keys(flowTheme.colors) as Array<keyof FlowTheme['colors']>).map((key) => (
          <Property key={key} label={formatLabel(key)}>
            <ColorInput
              value={flowTheme.colors[key]}
              onChange={(value) => updateColors(key, value)}
            />
          </Property>
        ))}
      </Section>

      {/* Typography */}
      <Section title="Typography" icon="Aa">
        <Property label="Font Family">
          <TextInputField
            value={flowTheme.typography.fontFamily || ''}
            onChange={(value) => onChange({
              ...flowTheme,
              typography: { ...flowTheme.typography, fontFamily: value || undefined },
            })}
            placeholder="system-ui"
          />
        </Property>

        <div style={{
          fontSize: theme.fontSizes.xs,
          fontWeight: '600',
          color: theme.colors.textMuted,
          marginTop: 8,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Heading
        </div>
        <Property label="Size">
          <NumberSlider
            value={flowTheme.typography.heading.fontSize}
            onChange={(v) => updateTypography('heading', { fontSize: v })}
            min={16}
            max={48}
            unit="px"
          />
        </Property>
        <Property label="Weight">
          <Select
            value={flowTheme.typography.heading.fontWeight}
            onChange={(v) => updateTypography('heading', { fontWeight: v })}
            options={FONT_WEIGHT_OPTIONS}
          />
        </Property>

        <div style={{
          fontSize: theme.fontSizes.xs,
          fontWeight: '600',
          color: theme.colors.textMuted,
          marginTop: 8,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Body
        </div>
        <Property label="Size">
          <NumberSlider
            value={flowTheme.typography.body.fontSize}
            onChange={(v) => updateTypography('body', { fontSize: v })}
            min={12}
            max={24}
            unit="px"
          />
        </Property>
        <Property label="Weight">
          <Select
            value={flowTheme.typography.body.fontWeight}
            onChange={(v) => updateTypography('body', { fontWeight: v })}
            options={FONT_WEIGHT_OPTIONS}
          />
        </Property>
      </Section>

      {/* Button */}
      <Section title="Button" icon="⬜">
        <Property label="Background">
          <ColorInput
            value={flowTheme.button.backgroundColor}
            onChange={(v) => updateButton({ backgroundColor: v })}
          />
        </Property>
        <Property label="Text Color">
          <ColorInput
            value={flowTheme.button.textColor}
            onChange={(v) => updateButton({ textColor: v })}
          />
        </Property>
        <Property label="Border Radius">
          <NumberSlider
            value={flowTheme.button.borderRadius}
            onChange={(v) => updateButton({ borderRadius: v })}
            min={0}
            max={32}
            unit="px"
          />
        </Property>
        <Property label="Min Height">
          <NumberSlider
            value={flowTheme.button.minHeight}
            onChange={(v) => updateButton({ minHeight: v })}
            min={36}
            max={64}
            unit="px"
          />
        </Property>
      </Section>

      {/* Input */}
      <Section title="Input" icon="▭">
        <Property label="Background">
          <ColorInput
            value={flowTheme.input.backgroundColor}
            onChange={(v) => updateInput({ backgroundColor: v })}
          />
        </Property>
        <Property label="Border Color">
          <ColorInput
            value={flowTheme.input.borderColor}
            onChange={(v) => updateInput({ borderColor: v })}
          />
        </Property>
        <Property label="Border Radius">
          <NumberSlider
            value={flowTheme.input.borderRadius}
            onChange={(v) => updateInput({ borderRadius: v })}
            min={0}
            max={24}
            unit="px"
          />
        </Property>
      </Section>

      {/* General */}
      <Section title="General" icon="⚙">
        <Property label="Border Radius">
          <NumberSlider
            value={flowTheme.general.borderRadius}
            onChange={(v) => updateGeneral({ borderRadius: v })}
            min={0}
            max={32}
            unit="px"
          />
        </Property>
        <Property label="Spacing">
          <NumberSlider
            value={flowTheme.general.spacing}
            onChange={(v) => updateGeneral({ spacing: v })}
            min={4}
            max={32}
            unit="px"
          />
        </Property>
      </Section>
    </div>
  )
}

// ─── Helper Components (matching existing property panel patterns) ───

const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
]

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: theme.spacing.md,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.colors.text,
          cursor: 'pointer',
          fontSize: theme.fontSizes.sm,
          fontWeight: '500',
          fontFamily: theme.fonts.sans,
        }}
      >
        <span>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>▾</span>
      </button>
      {isOpen && (
        <div style={{ padding: `0 ${theme.spacing.md} ${theme.spacing.md}` }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: theme.spacing.sm,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.xs,
    }}>
      <label style={{
        fontSize: theme.fontSizes.xs,
        color: theme.colors.textMuted,
        fontFamily: theme.fonts.sans,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
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
        value={value}
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
    </div>
  )
}

function NumberSlider({ value, onChange, min = 0, max = 100, unit }: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={min}
        max={max}
        style={{ flex: 1, accentColor: theme.colors.primary }}
      />
      <div style={{
        minWidth: 50,
        textAlign: 'right',
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text,
        fontFamily: 'monospace',
      }}>
        {Math.round(value)}{unit}
      </div>
    </div>
  )
}

function TextInputField({ value, onChange, placeholder }: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.md,
        color: theme.colors.text,
        fontSize: theme.fontSizes.sm,
        fontFamily: theme.fonts.sans,
        outline: 'none',
      }}
    />
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.md,
        color: theme.colors.text,
        fontSize: theme.fontSizes.sm,
        fontFamily: theme.fonts.sans,
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
