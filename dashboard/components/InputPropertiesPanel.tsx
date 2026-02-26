import { Element, ElementStyle } from '@/lib/types'
import { theme } from '@/lib/theme'
import { useState } from 'react'

interface InputPropertiesPanelProps {
  element: Element
  onUpdate: (updates: Partial<Element>) => void
}

export function InputPropertiesPanel({ element, onUpdate }: InputPropertiesPanelProps) {
  const style = element.style || {}
  const props = element.props || {}

  const updateStyle = (updates: Partial<ElementStyle>) => {
    onUpdate({ style: { ...style, ...updates } })
  }

  const updateProp = (key: string, value: any) => {
    onUpdate({ props: { ...props, [key]: value } })
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'auto',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: theme.fonts.sans,
    }}>
      {/* Content Section - Element-specific properties */}
      <Section title="Content" icon="📝">
        <></>
      </Section>

      {/* Layer Section */}
      <Section title="Layer" icon="◧">
        <Property label="Background">
          <ColorInput
            value={style.backgroundColor || '#FFFFFF'}
            onChange={(value) => updateStyle({ backgroundColor: value })}
          />
        </Property>
        <Property label="Opacity">
          <Slider
            value={style.opacity !== undefined ? style.opacity * 100 : 100}
            onChange={(value) => updateStyle({ opacity: value / 100 })}
            min={0}
            max={100}
            unit="%"
          />
        </Property>
      </Section>

      {/* Size Section */}
      <Section title="Size" icon="□">
        <Property label="Width">
          <TextInput
            value={typeof style.width === 'number' ? style.width.toString() : (style.width || '')}
            onChange={(value) => updateStyle({ width: value ? (value.includes('%') ? value : parseFloat(value)) : undefined })}
            placeholder="auto"
            unit="px"
          />
        </Property>
        <Property label="Height">
          <TextInput
            value={typeof style.height === 'number' ? style.height.toString() : (style.height || '')}
            onChange={(value) => updateStyle({ height: value ? (value.includes('%') ? value : parseFloat(value)) : undefined })}
            placeholder="auto"
            unit="px"
          />
        </Property>
      </Section>

      {/* Padding Section */}
      <Section title="Padding" icon="⊞">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
          {['top', 'bottom', 'left', 'right'].map(side => (
            <Property key={side} label={side.charAt(0).toUpperCase() + side.slice(1)}>
              <TextInput
                value={getPaddingValue(style, side as any).toString()}
                onChange={(value) => setPadding(style, side as any, parseInt(value) || 0, updateStyle)}
                unit="px"
              />
            </Property>
          ))}
        </div>
      </Section>

      {/* Margin Section */}
      <Section title="Margin" icon="⊟">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
          {['top', 'bottom', 'left', 'right'].map(side => (
            <Property key={side} label={side.charAt(0).toUpperCase() + side.slice(1)}>
              <TextInput
                value={getMarginValue(style, side as any).toString()}
                onChange={(value) => setMargin(style, side as any, parseInt(value) || 0, updateStyle)}
                unit="px"
              />
            </Property>
          ))}
        </div>
      </Section>

      {/* Corners Section */}
      <Section title="Corners" icon="⌜⌟">
        <Property label="Radius">
          <Slider
            value={typeof style.borderRadius === 'number' ? style.borderRadius : 0}
            onChange={(value) => updateStyle({ borderRadius: value })}
            min={0}
            max={100}
            unit="px"
          />
        </Property>
      </Section>

      {/* Borders Section */}
      <Section title="Borders" icon="□">
        <Property label="Width">
          <Slider
            value={style.borderWidth || 0}
            onChange={(value) => updateStyle({ borderWidth: value })}
            min={0}
            max={20}
            unit="px"
          />
        </Property>
        <Property label="Color">
          <ColorInput
            value={style.borderColor || '#000000'}
            onChange={(value) => updateStyle({ borderColor: value })}
          />
        </Property>
      </Section>

      {/* Position Section */}
      <Section title="Position" icon="∴">
        <Property label="Type">
          <Select
            value={element.position?.type || 'relative'}
            onChange={(value) => onUpdate({ position: { ...element.position, type: value as any } })}
            options={[
              { value: 'relative', label: 'Relative' },
              { value: 'absolute', label: 'Absolute' }
            ]}
          />
        </Property>
      </Section>

      {/* Effects Section */}
      <Section title="Effects" icon="✨">
        <Property label="Shadow">
          <ColorInput
            value={style.shadowColor || '#000000'}
            onChange={(value) => updateStyle({ shadowColor: value })}
          />
        </Property>
        <Property label="Shadow Opacity">
          <Slider
            value={(style.shadowOpacity || 0) * 100}
            onChange={(value) => updateStyle({ shadowOpacity: value / 100 })}
            min={0}
            max={100}
            unit="%"
          />
        </Property>
      </Section>
    </div>
  )
}

// Helper functions
function getMarginValue(style: ElementStyle, side: 'top' | 'bottom' | 'left' | 'right') {
  if (!style.margin) return 0
  return typeof style.margin === 'number' ? style.margin : style.margin[side] || 0
}

function setMargin(style: ElementStyle, side: 'top' | 'bottom' | 'left' | 'right', value: number, updateStyle: (updates: Partial<ElementStyle>) => void) {
  const current = style.margin || 0
  if (typeof current === 'number') {
    updateStyle({ margin: { top: side === 'top' ? value : current, right: side === 'right' ? value : current, bottom: side === 'bottom' ? value : current, left: side === 'left' ? value : current } })
  } else {
    updateStyle({ margin: { ...current, [side]: value } })
  }
}

function getPaddingValue(style: ElementStyle, side: 'top' | 'bottom' | 'left' | 'right') {
  if (!style.padding) return 0
  return typeof style.padding === 'number' ? style.padding : style.padding[side] || 0
}

function setPadding(style: ElementStyle, side: 'top' | 'bottom' | 'left' | 'right', value: number, updateStyle: (updates: Partial<ElementStyle>) => void) {
  const current = style.padding || 0
  if (typeof current === 'number') {
    updateStyle({ padding: { top: side === 'top' ? value : current, right: side === 'right' ? value : current, bottom: side === 'bottom' ? value : current, left: side === 'left' ? value : current } })
  } else {
    updateStyle({ padding: { ...current, [side]: value } })
  }
}

// UI Components
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <div style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: theme.spacing.md, display: 'flex', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: 'transparent', border: 'none', color: theme.colors.text, cursor: 'pointer', fontSize: theme.fontSizes.sm, fontWeight: '500', fontFamily: theme.fonts.sans }}>
        <span>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {isOpen && <div style={{ padding: `0 ${theme.spacing.md} ${theme.spacing.md}` }}>{children}</div>}
    </div>
  )
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: theme.spacing.sm, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      <label style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, fontFamily: theme.fonts.sans }}>{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: `${theme.spacing.xs} ${theme.spacing.sm}`, backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.md, color: theme.colors.text, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.sans, cursor: 'pointer' }}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  )
}

function Slider({ value, onChange, min = 0, max = 100, unit }: { value: number; onChange: (value: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
      <input type="range" value={value} onChange={(e) => onChange(parseInt(e.target.value))} min={min} max={max} style={{ flex: 1, accentColor: theme.colors.primary }} />
      <div style={{ minWidth: '60px', textAlign: 'right', fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{Math.round(value)} {unit}</div>
    </div>
  )
}

function TextInput({ value, onChange, placeholder, unit }: { value: string; onChange: (value: string) => void; placeholder?: string; unit?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, padding: `${theme.spacing.xs} ${theme.spacing.sm}`, backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.md, color: theme.colors.text, fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.sans }} />
      {unit && <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>{unit}</span>}
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, padding: `${theme.spacing.xs} ${theme.spacing.sm}`, backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.md }}>
      <input type="color" value={value === 'transparent' ? '#000000' : value} onChange={(e) => onChange(e.target.value)} style={{ width: '32px', height: '32px', border: 'none', borderRadius: theme.borderRadius.sm, cursor: 'pointer' }} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, padding: theme.spacing.xs, backgroundColor: 'transparent', border: 'none', color: theme.colors.text, fontSize: theme.fontSizes.sm, fontFamily: 'monospace' }} />
      <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, opacity: 0.7 }}>100 %</span>
    </div>
  )
}
