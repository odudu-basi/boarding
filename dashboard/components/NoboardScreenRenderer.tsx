import { Element, ElementStyle, ElementPosition, ElementAction, Asset } from '@/lib/types'
import { resolveTemplate, evaluateCondition } from '@/lib/variableUtils'
import { theme } from '@/lib/theme'
import React, { useState, useCallback } from 'react'

interface NoboardScreenRendererProps {
  elements: Element[]
  backgroundColor?: string
  hiddenElements?: Set<string>
  variables?: Record<string, any>
  onSetVariable?: (name: string, value: any) => void
  assets?: Asset[]
}

// Error boundary to catch rendering crashes and show useful error instead of blank screen
class RenderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('NoboardScreenRenderer error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#c00', fontSize: '14px', fontFamily: 'monospace' }}>
          <strong>Render Error:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>{this.state.error}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export function NoboardScreenRenderer({ elements, backgroundColor = '#FFFFFF', hiddenElements = new Set(), variables = {}, onSetVariable, assets = [] }: NoboardScreenRendererProps) {
  // Resolve asset:name references to actual data URLs
  const resolveAssetUrl = useCallback((url: string | undefined): string | undefined => {
    if (!url || !url.startsWith('asset:')) return url
    const assetName = url.slice(6)
    const asset = assets.find(a => a.name === assetName)
    return asset?.data || url
  }, [assets])
  // Track toggled element IDs for toggle actions
  const [toggledIds, setToggledIds] = useState<Set<string>>(new Set())
  // Track selection groups: group name → selected element ID
  const [groupSelections, setGroupSelections] = useState<Record<string, string>>({})

  const executeAction = useCallback((action: ElementAction, element: Element) => {
    switch (action.type) {
      case 'set_variable': {
        if (action.variable && onSetVariable) {
          onSetVariable(action.variable, action.value)
        }
        break
      }
      case 'toggle': {
        const group = action.group
        if (group) {
          // Single-select group: deselect previous, select new
          setGroupSelections(prev => {
            const prevSelected = prev[group]
            if (prevSelected === element.id) return prev // already selected, no-op
            return { ...prev, [group]: element.id }
          })
          setToggledIds(prev => {
            const next = new Set(prev)
            // Remove previous selection in this group
            const prevSelected = groupSelections[group]
            if (prevSelected) next.delete(prevSelected)
            next.add(element.id)
            return next
          })
        } else {
          // Ungrouped toggle: multi-select
          setToggledIds(prev => {
            const next = new Set(prev)
            if (next.has(element.id)) {
              next.delete(element.id)
            } else {
              next.add(element.id)
            }
            return next
          })
        }
        break
      }
      case 'navigate':
        console.log('Navigate to:', action.destination)
        break
      case 'link':
        if (action.destination && typeof action.destination === 'string') {
          window.open(action.destination, '_blank')
        }
        break
      case 'dismiss':
        console.log('Dismiss action triggered')
        break
      case 'tap':
        console.log('Tap action on:', element.id)
        break
    }
  }, [groupSelections, onSetVariable])

  const handleAction = useCallback((element: Element) => {
    // Execute single action (backward compat)
    if (element.action) {
      executeAction(element.action, element)
    }
    // Execute multi-actions array
    if (element.actions) {
      for (const action of element.actions) {
        executeAction(action, element)
      }
    }
  }, [executeAction])

  if (!elements || elements.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor }}>
        <p style={{ color: '#999', fontSize: '14px' }}>No elements to render</p>
      </div>
    )
  }

  return (
    <RenderErrorBoundary>
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {elements.filter(el => !hiddenElements.has(el.id)).map((element) => (
          <RenderElement
            key={element.id}
            element={element}
            hiddenElements={hiddenElements}
            toggledIds={toggledIds}
            groupSelections={groupSelections}
            onAction={handleAction}
            variables={variables}
            resolveAssetUrl={resolveAssetUrl}
          />
        ))}
      </div>
    </RenderErrorBoundary>
  )
}

interface RenderElementProps {
  element: Element
  hiddenElements?: Set<string>
  toggledIds: Set<string>
  groupSelections: Record<string, string>
  onAction: (element: Element) => void
  variables: Record<string, any>
  resolveAssetUrl?: (url: string | undefined) => string | undefined
}

function RenderElement({ element, hiddenElements = new Set(), toggledIds, groupSelections, onAction, variables, resolveAssetUrl }: RenderElementProps) {
  // Variable-based conditional visibility
  if (element.conditions?.show_if) {
    if (!evaluateCondition(element.conditions.show_if, variables)) {
      return null
    }
  }

  const style = convertStyleToCSS(element.style || {} as ElementStyle, element.position)

  // Check if this element is toggled (selected)
  const isToggled = toggledIds.has(element.id)

  // Apply toggle visual state: add a prominent border when selected
  const toggleStyle: React.CSSProperties = {}
  const hasToggle = element.action?.type === 'toggle' || element.actions?.some(a => a.type === 'toggle')
  if (hasToggle) {
    if (isToggled) {
      toggleStyle.borderWidth = '2px'
      toggleStyle.borderStyle = 'solid'
      toggleStyle.borderColor = element.style?.borderColor || '#000000'
      toggleStyle.boxSizing = 'border-box'
    } else {
      // Ensure consistent sizing even when not selected
      toggleStyle.borderWidth = style.borderWidth || '2px'
      toggleStyle.borderStyle = 'solid'
      toggleStyle.borderColor = 'transparent'
      toggleStyle.boxSizing = 'border-box'
    }
  }

  // Conditional visibility based on selection group state
  const visibilityStyle: React.CSSProperties = {}
  if (element.visibleWhen) {
    const groupHasSelection = !!groupSelections[element.visibleWhen.group]
    const shouldShow = groupHasSelection === element.visibleWhen.hasSelection
    visibilityStyle.opacity = shouldShow ? 1 : 0
    visibilityStyle.pointerEvents = shouldShow ? 'auto' : 'none'
    visibilityStyle.transition = 'opacity 0.3s ease'
  }

  // Action wrapper props
  const hasAction = element.action || (element.actions && element.actions.length > 0)
  const actionProps: React.HTMLAttributes<HTMLDivElement> = {}
  if (hasAction) {
    actionProps.onClick = (e) => {
      e.stopPropagation()
      onAction(element)
    }
    actionProps.style = { cursor: 'pointer' }
  }

  const childProps = { hiddenElements, toggledIds, groupSelections, onAction, variables, resolveAssetUrl }

  switch (element.type) {
    case 'vstack':
      return (
        <div
          {...actionProps}
          style={{
            ...style,
            display: 'flex',
            flexDirection: 'column',
            ...toggleStyle,
            ...visibilityStyle,
            ...(hasAction ? { cursor: 'pointer' } : {}),
          }}
        >
          {element.children?.filter(child => !hiddenElements.has(child.id)).map((child) => (
            <RenderElement key={child.id} element={child} {...childProps} />
          ))}
        </div>
      )

    case 'hstack':
      return (
        <div
          {...actionProps}
          style={{
            ...style,
            display: 'flex',
            flexDirection: 'row',
            ...toggleStyle,
            ...visibilityStyle,
            ...(hasAction ? { cursor: 'pointer' } : {}),
          }}
        >
          {element.children?.filter(child => !hiddenElements.has(child.id)).map((child) => (
            <RenderElement key={child.id} element={child} {...childProps} />
          ))}
        </div>
      )

    case 'zstack':
      return (
        <div
          {...actionProps}
          style={{
            ...style,
            position: 'relative',
            ...toggleStyle,
            ...visibilityStyle,
            ...(hasAction ? { cursor: 'pointer' } : {}),
          }}
        >
          {element.children?.filter(child => !hiddenElements.has(child.id)).map((child) => {
            const childWithPosition = {
              ...child,
              position: child.position || { type: 'absolute' as const, top: 0, left: 0 }
            }
            return <RenderElement key={child.id} element={childWithPosition} {...childProps} />
          })}
        </div>
      )

    case 'scrollview':
      return (
        <div
          style={{
            ...style,
            overflow: element.props?.direction === 'horizontal' ? 'auto' : 'auto',
            overflowX: element.props?.direction === 'horizontal' ? 'auto' : 'hidden',
            overflowY: element.props?.direction === 'horizontal' ? 'hidden' : 'auto',
            WebkitOverflowScrolling: 'touch',
            ...visibilityStyle,
          }}
        >
          {element.children?.filter(child => !hiddenElements.has(child.id)).map((child) => (
            <RenderElement key={child.id} element={child} {...childProps} />
          ))}
        </div>
      )

    case 'text':
      return (
        <div style={{ margin: 0, ...style }}>
          {resolveTemplate(element.props?.text || 'Text', variables)}
        </div>
      )

    case 'icon': {
      // Support both emoji and named icons
      if (element.props?.emoji) {
        return (
          <span style={{ ...style, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {element.props.emoji}
          </span>
        )
      }
      // Named icon fallback — show icon name as placeholder
      return (
        <div
          style={{
            ...style,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: style.backgroundColor || '#f0f0f0',
            borderRadius: style.borderRadius || '6px',
            width: style.width || '32px',
            height: style.height || '32px',
            fontSize: style.fontSize || '14px',
          }}
          title={`${element.props?.library || 'lucide'}/${element.props?.name || 'icon'}`}
        >
          {element.props?.name ? (
            <span style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
              {element.props.name}
            </span>
          ) : '●'}
        </div>
      )
    }

    case 'image': {
      const resolvedUrl = resolveAssetUrl?.(element.props?.url) ?? element.props?.url
      return (
        <div
          style={{
            ...style,
            backgroundColor: style.backgroundColor || '#f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
          title={element.props?.imageDescription || element.props?.alt}
        >
          {resolvedUrl ? (
            <img
              src={resolvedUrl}
              alt={element.props?.alt || 'Image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: element.props?.objectFit || 'cover'
              }}
            />
          ) : (
            <>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}>
                <div style={{ fontSize: '32px', opacity: 0.4 }}>🖼️</div>
                {element.props?.slotNumber && (
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#999',
                  }}>
                    Image {element.props.slotNumber}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )
    }

    case 'video':
      return (
        <div
          style={{
            ...style,
            backgroundColor: style.backgroundColor || '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
          title={element.props?.videoDescription}
        >
          {element.props?.url ? (
            <video
              src={element.props.url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎬</div>
              {element.props?.videoDescription && (
                <div style={{
                  fontSize: '11px',
                  color: '#aaa',
                  textAlign: 'center',
                  padding: '0 12px',
                  lineHeight: '1.4',
                  maxWidth: '80%',
                }}>
                  {element.props.videoDescription}
                </div>
              )}
            </>
          )}
        </div>
      )

    case 'lottie':
      return (
        <div
          style={{
            ...style,
            backgroundColor: style.backgroundColor || '#f8f8ff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          title={element.props?.animationDescription}
        >
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>✨</div>
          {element.props?.animationDescription && (
            <div style={{
              fontSize: '11px',
              color: '#666',
              textAlign: 'center',
              padding: '0 12px',
              lineHeight: '1.4',
              maxWidth: '80%',
            }}>
              {element.props.animationDescription}
            </div>
          )}
        </div>
      )

    case 'input':
      return (
        <input
          type={element.props?.type || 'text'}
          placeholder={element.props?.placeholder || 'Enter text...'}
          style={{
            ...style,
            fontFamily: theme.fonts.sans,
            outline: 'none',
            // Remove default browser border unless explicitly styled
            ...(style.borderWidth === undefined && style.borderColor === undefined && style.borderStyle === undefined
              ? { border: 'none' }
              : {}),
          }}
        />
      )

    case 'spacer':
      return <div style={style} />

    case 'divider':
      return <div style={{ ...style, backgroundColor: style.backgroundColor || '#e0e0e0' }} />

    default:
      // Backwards compatibility: handle old types gracefully
      const legacyType = element.type as string
      if (legacyType === 'button') {
        // Old button type → render as styled div with text
        return (
          <div
            onClick={hasAction ? (e) => { e.stopPropagation(); onAction(element) } : undefined}
            style={{
              ...style,
              cursor: hasAction ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: style.borderWidth ? undefined : 'none',
            }}
          >
            {resolveTemplate(element.props?.text || 'Button', variables)}
          </div>
        )
      }
      if (legacyType === 'heading') {
        return <div style={{ margin: 0, ...style }}>{resolveTemplate(element.props?.text || 'Heading', variables)}</div>
      }
      return <div style={style}>Unknown: {element.type}</div>
  }
}

function convertStyleToCSS(style: ElementStyle, position?: ElementPosition): React.CSSProperties {
  const css: React.CSSProperties = {}

  if (!style) return css

  // Position
  if (position) {
    css.position = position.type || 'relative'

    if (position.type === 'absolute') {
      if (position.top !== undefined) css.top = `${position.top}px`
      if (position.left !== undefined) css.left = `${position.left}px`
      if (position.right !== undefined) css.right = `${position.right}px`
      if (position.bottom !== undefined) css.bottom = `${position.bottom}px`

      if (position.centerX) {
        css.left = '50%'
        css.transform = position.centerY
          ? 'translate(-50%, -50%)'
          : 'translateX(-50%)'
      }
      if (position.centerY && !position.centerX) {
        css.top = '50%'
        css.transform = 'translateY(-50%)'
      }
      if (position.centerY && position.centerX) {
        css.top = '50%'
      }
    }

    if (position.zIndex !== undefined) css.zIndex = position.zIndex
  }

  // Layout (Flexbox)
  if (style.flex !== undefined) css.flex = style.flex
  if (style.flexDirection) css.flexDirection = style.flexDirection
  if (style.justifyContent) css.justifyContent = style.justifyContent
  if (style.alignItems) css.alignItems = style.alignItems
  if (style.gap !== undefined) css.gap = `${style.gap}px`
  if (style.wrap) css.flexWrap = 'wrap'
  if (style.overflow) css.overflow = style.overflow

  // Spacing - composite margin/padding
  if (style.margin !== undefined) {
    if (typeof style.margin === 'number') {
      css.margin = `${style.margin}px`
    } else {
      css.marginTop = `${style.margin.top}px`
      css.marginRight = `${style.margin.right}px`
      css.marginBottom = `${style.margin.bottom}px`
      css.marginLeft = `${style.margin.left}px`
    }
  }

  if (style.padding !== undefined) {
    if (typeof style.padding === 'number') {
      css.padding = `${style.padding}px`
    } else {
      css.paddingTop = `${style.padding.top}px`
      css.paddingRight = `${style.padding.right}px`
      css.paddingBottom = `${style.padding.bottom}px`
      css.paddingLeft = `${style.padding.left}px`
    }
  }

  // Spacing - individual margin/padding properties (AI often generates these)
  const anyStyle = style as any
  if (anyStyle.marginTop !== undefined) css.marginTop = `${anyStyle.marginTop}px`
  if (anyStyle.marginBottom !== undefined) css.marginBottom = `${anyStyle.marginBottom}px`
  if (anyStyle.marginLeft !== undefined) css.marginLeft = `${anyStyle.marginLeft}px`
  if (anyStyle.marginRight !== undefined) css.marginRight = `${anyStyle.marginRight}px`
  if (anyStyle.paddingTop !== undefined) css.paddingTop = `${anyStyle.paddingTop}px`
  if (anyStyle.paddingBottom !== undefined) css.paddingBottom = `${anyStyle.paddingBottom}px`
  if (anyStyle.paddingLeft !== undefined) css.paddingLeft = `${anyStyle.paddingLeft}px`
  if (anyStyle.paddingRight !== undefined) css.paddingRight = `${anyStyle.paddingRight}px`

  // Border - individual side properties (AI often generates these)
  if (anyStyle.borderBottomWidth !== undefined) {
    css.borderBottomWidth = `${anyStyle.borderBottomWidth}px`
    css.borderBottomStyle = anyStyle.borderBottomStyle || 'solid'
  }
  if (anyStyle.borderBottomColor) css.borderBottomColor = anyStyle.borderBottomColor
  if (anyStyle.borderTopWidth !== undefined) {
    css.borderTopWidth = `${anyStyle.borderTopWidth}px`
    css.borderTopStyle = anyStyle.borderTopStyle || 'solid'
  }
  if (anyStyle.borderTopColor) css.borderTopColor = anyStyle.borderTopColor

  // Dimensions
  if (style.width !== undefined) {
    css.width = typeof style.width === 'number' ? `${style.width}px` : style.width
  }
  if (style.height !== undefined) {
    css.height = typeof style.height === 'number' ? `${style.height}px` : style.height
  }
  if (style.maxWidth !== undefined) css.maxWidth = `${style.maxWidth}px`
  if (style.maxHeight !== undefined) css.maxHeight = `${style.maxHeight}px`

  // Extra layout properties for freeform AI generation
  if (anyStyle.alignSelf) css.alignSelf = anyStyle.alignSelf
  if (anyStyle.minHeight !== undefined) {
    css.minHeight = typeof anyStyle.minHeight === 'number' ? `${anyStyle.minHeight}px` : anyStyle.minHeight
  }

  // Visual - Background
  if (style.backgroundGradient && style.backgroundGradient.colors?.length) {
    const gradient = style.backgroundGradient
    const colorStops = gradient.colors
      .map((c: any, i: number, arr: any[]) => {
        // Handle both { color, position } objects and plain color strings
        const color = typeof c === 'string' ? c : c.color
        const position = typeof c === 'string'
          ? Math.round((i / Math.max(arr.length - 1, 1)) * 100)
          : (c.position ?? Math.round((i / Math.max(arr.length - 1, 1)) * 100))
        return `${color} ${position}%`
      })
      .join(', ')
    const gradientType = gradient.type || 'linear'
    if (gradientType === 'linear') {
      css.backgroundImage = `linear-gradient(${gradient.angle || 180}deg, ${colorStops})`
    } else if (gradientType === 'radial') {
      css.backgroundImage = `radial-gradient(circle, ${colorStops})`
    }
  } else if (style.backgroundColor) {
    css.backgroundColor = style.backgroundColor
  }

  if (style.opacity !== undefined) css.opacity = style.opacity
  if (style.hidden) css.display = 'none'

  // Border
  if (style.borderRadius !== undefined) {
    if (typeof style.borderRadius === 'number') {
      css.borderRadius = `${style.borderRadius}px`
    } else {
      css.borderTopLeftRadius = `${style.borderRadius.topLeft}px`
      css.borderTopRightRadius = `${style.borderRadius.topRight}px`
      css.borderBottomLeftRadius = `${style.borderRadius.bottomLeft}px`
      css.borderBottomRightRadius = `${style.borderRadius.bottomRight}px`
    }
  }

  if (style.borderWidth !== undefined) {
    css.borderWidth = `${style.borderWidth}px`
    css.borderStyle = style.borderStyle || 'solid'
  }
  if (style.borderColor) css.borderColor = style.borderColor

  // Shadow
  if (style.shadowColor && style.shadowOpacity !== undefined && style.shadowRadius !== undefined) {
    const offsetX = style.shadowOffsetX || 0
    const offsetY = style.shadowOffsetY || 0
    css.boxShadow = `${offsetX}px ${offsetY}px ${style.shadowRadius}px rgba(${hexToRgb(style.shadowColor)}, ${style.shadowOpacity})`
  }

  // Text
  if (style.color) css.color = style.color
  if (style.fontSize !== undefined) css.fontSize = `${style.fontSize}px`
  if (style.fontFamily) css.fontFamily = style.fontFamily
  if (style.fontWeight) css.fontWeight = style.fontWeight
  if (style.lineHeight !== undefined) {
    css.lineHeight = style.lineHeight > 4 ? `${style.lineHeight}px` : style.lineHeight
  }
  if (style.letterSpacing !== undefined) css.letterSpacing = `${style.letterSpacing}px`
  if (style.textAlign) css.textAlign = style.textAlign
  if (style.textTransform) css.textTransform = style.textTransform
  if (style.textDecoration) css.textDecoration = style.textDecoration

  // Transform
  if (style.transform) {
    const transforms: string[] = []
    if (style.transform.translateX) transforms.push(`translateX(${style.transform.translateX}px)`)
    if (style.transform.translateY) transforms.push(`translateY(${style.transform.translateY}px)`)
    if (style.transform.rotate) transforms.push(`rotate(${style.transform.rotate}deg)`)
    if (style.transform.scale !== undefined) transforms.push(`scale(${style.transform.scale})`)

    if (transforms.length > 0) {
      css.transform = transforms.join(' ')
    }
  }

  // Blur effects
  if (style.blur) {
    css.filter = `blur(${style.blur}px)`
  }
  if (style.backdropBlur) {
    css.backdropFilter = `blur(${style.backdropBlur}px)`
  }

  // Animation
  if (style.animation && style.animation.property && (style.animation.property as string) !== 'none') {
    const duration = style.animation.duration || 0.3
    const easing = style.animation.easing || 'ease-in-out'
    const delay = style.animation.delay || 0
    const property = style.animation.property === 'all' ? 'all' : style.animation.property

    css.transition = `${property} ${duration}s ${easing} ${delay}s`
  }

  // Default display for containers
  if (!css.display && (style.flexDirection || style.justifyContent || style.alignItems)) {
    css.display = 'flex'
  }

  return css
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0'
}
