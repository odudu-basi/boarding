import { Element, ElementStyle } from '@/lib/types'
import { theme } from '@/lib/theme'
import { useState } from 'react'

interface ZStackPropertiesPanelProps {
  element: Element
  onUpdate: (updates: Partial<Element>) => void
}

export function ZStackPropertiesPanel({ element, onUpdate }: ZStackPropertiesPanelProps) {
  const style = element.style || {}

  const updateStyle = (updates: Partial<ElementStyle>) => {
    onUpdate({
      style: { ...style, ...updates }
    })
  }

  const getPaddingValue = (side: 'top' | 'bottom') => {
    if (!style.padding) return 0
    return typeof style.padding === 'number'
      ? style.padding
      : style.padding[side] || 0
  }

  const setPadding = (side: 'top' | 'bottom', value: number) => {
    const currentPadding = style.padding || 0
    if (typeof currentPadding === 'number') {
      updateStyle({
        padding: {
          top: side === 'top' ? value : currentPadding,
          right: typeof currentPadding === 'number' ? currentPadding : 0,
          bottom: side === 'bottom' ? value : currentPadding,
          left: typeof currentPadding === 'number' ? currentPadding : 0
        }
      })
    } else {
      updateStyle({
        padding: {
          ...currentPadding,
          [side]: value
        }
      })
    }
  }

  const getMarginValue = (side: 'top' | 'bottom' | 'left' | 'right') => {
    if (!style.margin) return 0
    return typeof style.margin === 'number'
      ? style.margin
      : style.margin[side] || 0
  }

  const setMargin = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    const currentMargin = style.margin || 0
    if (typeof currentMargin === 'number') {
      updateStyle({
        margin: {
          top: side === 'top' ? value : currentMargin,
          right: side === 'right' ? value : currentMargin,
          bottom: side === 'bottom' ? value : currentMargin,
          left: side === 'left' ? value : currentMargin
        }
      })
    } else {
      updateStyle({
        margin: {
          ...currentMargin,
          [side]: value
        }
      })
    }
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
      {/* Stack Section - ZStack specific */}
      <Section title="Stack" icon="▦">
        <div style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textMuted,
        }}>
          Z Stack layers children on top of each other. Use Position properties on child elements to control their placement.
        </div>

        <Property label="Overflow">
          <Select
            value={style.overflow || 'visible'}
            onChange={(value) => updateStyle({ overflow: value as any })}
            options={[
              { value: 'visible', label: 'Visible' },
              { value: 'hidden', label: 'Hidden' },
              { value: 'scroll', label: 'Scroll' },
              { value: 'auto', label: 'Auto' }
            ]}
          />
        </Property>
      </Section>

      {/* Layer Section */}
      <Section title="Layer" icon="◧">
        <Property label="Color">
          <ColorInput
            value={style.backgroundColor || '#000000'}
            onChange={(value) => updateStyle({ backgroundColor: value })}
          />
        </Property>

        <Property label="Fill">
          <Select
            value={style.backgroundGradient ? 'Linear Gradient' : 'None'}
            onChange={(value) => {
              if (value === 'None') {
                updateStyle({ backgroundGradient: undefined })
              } else {
                updateStyle({
                  backgroundGradient: {
                    type: 'linear',
                    angle: 180,
                    colors: [
                      { color: '#ffffff', position: 0 },
                      { color: '#000000', position: 100 }
                    ]
                  }
                })
              }
            }}
            options={[
              { value: 'None', label: 'None' },
              { value: 'Linear Gradient', label: 'Linear Gradient' }
            ]}
          />
        </Property>

        {style.backgroundGradient && (
          <>
            <Property label="Angle">
              <NumberInput
                value={style.backgroundGradient.angle || 180}
                onChange={(value) => updateStyle({
                  backgroundGradient: {
                    ...style.backgroundGradient!,
                    angle: value
                  }
                })}
                unit="deg"
                min={0}
                max={360}
              />
            </Property>

            <Property label="Start Color">
              <ColorInput
                value={style.backgroundGradient.colors[0]?.color || '#ffffff'}
                onChange={(value) => updateStyle({
                  backgroundGradient: {
                    ...style.backgroundGradient!,
                    colors: [
                      { ...style.backgroundGradient!.colors[0], color: value },
                      style.backgroundGradient!.colors[1]
                    ]
                  }
                })}
              />
            </Property>

            <Property label="End Color">
              <ColorInput
                value={style.backgroundGradient.colors[1]?.color || '#000000'}
                onChange={(value) => updateStyle({
                  backgroundGradient: {
                    ...style.backgroundGradient!,
                    colors: [
                      style.backgroundGradient!.colors[0],
                      { ...style.backgroundGradient!.colors[1], color: value }
                    ]
                  }
                })}
              />
            </Property>
          </>
        )}

        <Property label="Opacity">
          <Slider
            value={style.opacity !== undefined ? style.opacity * 100 : 100}
            onChange={(value) => updateStyle({ opacity: value / 100 })}
            min={0}
            max={100}
            unit="%"
          />
        </Property>

        <Property label="Hidden">
          <Select
            value={style.hidden ? 'hidden' : 'visible'}
            onChange={(value) => updateStyle({ hidden: value === 'hidden' })}
            options={[
              { value: 'visible', label: 'Visible' },
              { value: 'hidden', label: 'Hidden' }
            ]}
          />
        </Property>
      </Section>

      {/* Size Section */}
      <Section title="Size" icon="□">
        <Property label="Width">
          <TextInput
            value={style.width?.toString() || ''}
            onChange={(value) => updateStyle({ width: value })}
            placeholder="—"
            unit="px"
          />
        </Property>

        <Property label="Height">
          <TextInput
            value={style.height?.toString() || ''}
            onChange={(value) => updateStyle({ height: value })}
            placeholder="—"
            unit="px"
          />
        </Property>
      </Section>

      {/* Padding Section */}
      <Section title="Padding" icon="⊞">
        <Property label="Vertical">
          <Slider
            value={getPaddingValue('top')}
            onChange={(value) => {
              setPadding('top', value)
              setPadding('bottom', value)
            }}
            min={0}
            max={200}
            unit="px"
          />
        </Property>

        <Property label="Horizontal">
          <Slider
            value={typeof style.padding === 'number' ? style.padding : (style.padding?.left || 0)}
            onChange={(value) => {
              const currentPadding = style.padding || 0
              if (typeof currentPadding === 'number') {
                updateStyle({
                  padding: {
                    top: currentPadding,
                    right: value,
                    bottom: currentPadding,
                    left: value
                  }
                })
              } else {
                updateStyle({
                  padding: {
                    ...currentPadding,
                    left: value,
                    right: value
                  }
                })
              }
            }}
            min={0}
            max={200}
            unit="px"
          />
        </Property>
      </Section>

      {/* Margin Section */}
      <Section title="Margin" icon="⊟">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
          <Property label="Top">
            <TextInput
              value={getMarginValue('top').toString()}
              onChange={(value) => setMargin('top', parseInt(value) || 0)}
              placeholder="—"
              unit="px"
            />
          </Property>

          <Property label="Bottom">
            <TextInput
              value={getMarginValue('bottom').toString()}
              onChange={(value) => setMargin('bottom', parseInt(value) || 0)}
              placeholder="—"
              unit="px"
            />
          </Property>

          <Property label="Left">
            <TextInput
              value={getMarginValue('left').toString()}
              onChange={(value) => setMargin('left', parseInt(value) || 0)}
              placeholder="—"
              unit="px"
            />
          </Property>

          <Property label="Right">
            <TextInput
              value={getMarginValue('right').toString()}
              onChange={(value) => setMargin('right', parseInt(value) || 0)}
              placeholder="—"
              unit="px"
            />
          </Property>
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
        <Property label="Color">
          <ColorInput
            value={style.borderColor || '#000000'}
            onChange={(value) => updateStyle({ borderColor: value })}
          />
        </Property>

        <Property label="Width">
          <Slider
            value={style.borderWidth || 0}
            onChange={(value) => updateStyle({ borderWidth: value })}
            min={0}
            max={20}
            unit="px"
          />
        </Property>

        <Property label="Style">
          <Select
            value={style.borderStyle || 'solid'}
            onChange={(value) => updateStyle({ borderStyle: value as any })}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' }
            ]}
          />
        </Property>
      </Section>

      {/* Position Section */}
      <Section title="Position" icon="∴">
        <Property label="Position">
          <Select
            value={element.position?.type || 'relative'}
            onChange={(value) => onUpdate({
              position: { ...element.position, type: value as 'relative' | 'absolute' }
            })}
            options={[
              { value: 'relative', label: 'Normal' },
              { value: 'absolute', label: 'Absolute' }
            ]}
          />
        </Property>

        <Property label="Z Index">
          <TextInput
            value={element.position?.zIndex?.toString() || ''}
            onChange={(value) => onUpdate({
              position: { ...element.position, zIndex: parseInt(value) || 0 }
            })}
            placeholder="—"
          />
        </Property>

        {element.position?.type === 'absolute' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
            <Property label="Top">
              <TextInput
                value={element.position?.top?.toString() || ''}
                onChange={(value) => onUpdate({
                  position: { ...element.position, top: parseInt(value) || undefined }
                })}
                placeholder="—"
                unit="px"
              />
            </Property>

            <Property label="Bottom">
              <TextInput
                value={element.position?.bottom?.toString() || ''}
                onChange={(value) => onUpdate({
                  position: { ...element.position, bottom: parseInt(value) || undefined }
                })}
                placeholder="—"
                unit="px"
              />
            </Property>

            <Property label="Left">
              <TextInput
                value={element.position?.left?.toString() || ''}
                onChange={(value) => onUpdate({
                  position: { ...element.position, left: parseInt(value) || undefined }
                })}
                placeholder="—"
                unit="px"
              />
            </Property>

            <Property label="Right">
              <TextInput
                value={element.position?.right?.toString() || ''}
                onChange={(value) => onUpdate({
                  position: { ...element.position, right: parseInt(value) || undefined }
                })}
                placeholder="—"
                unit="px"
              />
            </Property>
          </div>
        )}
      </Section>

      {/* Effects Section with Animations */}
      <Section title="Effects" icon="✨">
        <Property label="Shadow">
          <ColorInput
            value={style.shadowColor || '#000000'}
            onChange={(value) => updateStyle({ shadowColor: value })}
          />
        </Property>

        <Property label="Shadow Opacity">
          <Slider
            value={style.shadowOpacity !== undefined ? style.shadowOpacity * 100 : 0}
            onChange={(value) => updateStyle({ shadowOpacity: value / 100 })}
            min={0}
            max={100}
            unit="%"
          />
        </Property>

        <Property label="Shadow Radius">
          <Slider
            value={style.shadowRadius || 0}
            onChange={(value) => updateStyle({ shadowRadius: value })}
            min={0}
            max={50}
            unit="px"
          />
        </Property>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
          <Property label="Offset X">
            <TextInput
              value={style.shadowOffsetX?.toString() || '0'}
              onChange={(value) => updateStyle({ shadowOffsetX: parseInt(value) || 0 })}
              unit="px"
            />
          </Property>

          <Property label="Offset Y">
            <TextInput
              value={style.shadowOffsetY?.toString() || '0'}
              onChange={(value) => updateStyle({ shadowOffsetY: parseInt(value) || 0 })}
              unit="px"
            />
          </Property>
        </div>

        <Property label="Animate">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
            <Select
              value={style.animation?.property || 'none'}
              onChange={(value) => {
                if (value === 'none') {
                  updateStyle({ animation: undefined })
                } else {
                  updateStyle({
                    animation: {
                      ...style.animation,
                      property: value as any,
                      duration: style.animation?.duration || 0.3,
                      easing: style.animation?.easing || 'ease-in-out'
                    }
                  })
                }
              }}
              options={[
                { value: 'none', label: 'None' },
                { value: 'opacity', label: 'Opacity' },
                { value: 'transform', label: 'Transform' },
                { value: 'all', label: 'All' }
              ]}
            />
            <Select
              value={style.animation?.easing || 'ease-in-out'}
              onChange={(value) => updateStyle({
                animation: {
                  ...style.animation,
                  property: style.animation?.property || 'all',
                  duration: style.animation?.duration || 0.3,
                  easing: value as any
                }
              })}
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'ease-in', label: 'Ease In' },
                { value: 'ease-out', label: 'Ease Out' },
                { value: 'ease-in-out', label: 'Ease In-Out' }
              ]}
            />
          </div>
        </Property>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
          <Property label="Move X">
            <TextInput
              value={style.transform?.translateX?.toString() || '0'}
              onChange={(value) => updateStyle({
                transform: {
                  ...style.transform,
                  translateX: parseInt(value) || 0
                }
              })}
              unit="px"
            />
          </Property>

          <Property label="Move Y">
            <TextInput
              value={style.transform?.translateY?.toString() || '0'}
              onChange={(value) => updateStyle({
                transform: {
                  ...style.transform,
                  translateY: parseInt(value) || 0
                }
              })}
              unit="px"
            />
          </Property>
        </div>

        <Property label="Rotate">
          <Slider
            value={style.transform?.rotate || 0}
            onChange={(value) => updateStyle({
              transform: {
                ...style.transform,
                rotate: value
              }
            })}
            min={0}
            max={360}
            unit="deg"
          />
        </Property>

        <Property label="Scale">
          <Slider
            value={style.transform?.scale !== undefined ? style.transform.scale * 100 : 100}
            onChange={(value) => updateStyle({
              transform: {
                ...style.transform,
                scale: value / 100
              }
            })}
            min={0}
            max={200}
            unit="%"
          />
        </Property>

        <Property label="Blur">
          <Slider
            value={style.blur || 0}
            onChange={(value) => updateStyle({ blur: value })}
            min={0}
            max={50}
            unit="px"
          />
        </Property>

        <Property label="BG Blur">
          <Slider
            value={style.backdropBlur || 0}
            onChange={(value) => updateStyle({ backdropBlur: value })}
            min={0}
            max={50}
            unit="px"
          />
        </Property>
      </Section>
    </div>
  )
}

// Shared UI Components
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
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▾
        </span>
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

function Select({ value, onChange, options }: {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
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
        cursor: 'pointer',
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

function NumberInput({ value, onChange, unit, min = 0, max = 1000 }: {
  value: number
  onChange: (value: number) => void
  unit?: string
  min?: number
  max?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={min}
        max={max}
        style={{
          flex: 1,
          accentColor: theme.colors.primary,
        }}
      />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        style={{
          width: '60px',
          padding: theme.spacing.xs,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.sm,
          color: theme.colors.text,
          fontSize: theme.fontSizes.sm,
          fontFamily: theme.fonts.sans,
          textAlign: 'center',
        }}
      />
      {unit && <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>{unit}</span>}
    </div>
  )
}

function Slider({ value, onChange, min = 0, max = 100, unit }: {
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
        style={{
          flex: 1,
          accentColor: theme.colors.primary,
        }}
      />
      <div style={{
        minWidth: '60px',
        textAlign: 'right',
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text,
      }}>
        {Math.round(value)} {unit}
      </div>
    </div>
  )
}

function TextInput({ value, onChange, placeholder, unit }: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  unit?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          color: theme.colors.text,
          fontSize: theme.fontSizes.sm,
          fontFamily: theme.fonts.sans,
        }}
      />
      {unit && <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>{unit}</span>}
    </div>
  )
}

function ColorInput({ value, onChange }: {
  value: string
  onChange: (value: string) => void
}) {
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
          width: '32px',
          height: '32px',
          border: 'none',
          borderRadius: theme.borderRadius.sm,
          cursor: 'pointer',
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
        }}
      />
      <span style={{
        fontSize: theme.fontSizes.xs,
        color: theme.colors.textMuted,
        opacity: 0.7
      }}>
        100 %
      </span>
    </div>
  )
}
