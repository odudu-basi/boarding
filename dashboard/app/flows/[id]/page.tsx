'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OnboardingConfig, Screen, ChatMessage, Asset, Element as FlowElement } from '@/lib/types'
import { useParams, useRouter } from 'next/navigation'
import { theme } from '@/lib/theme'
import { Button, Card, Heading, Text } from '@/components/ui'
import { PhoneFrame } from '@/components/PhoneFrame'
import { ScreenPreview } from '@/components/ScreenPreview'
import { VStackPropertiesPanel } from '@/components/VStackPropertiesPanel'
import { HStackPropertiesPanel } from '@/components/HStackPropertiesPanel'
import { ZStackPropertiesPanel } from '@/components/ZStackPropertiesPanel'
import { TextPropertiesPanel } from '@/components/TextPropertiesPanel'
import { ImagePropertiesPanel } from '@/components/ImagePropertiesPanel'
import { InputPropertiesPanel } from '@/components/InputPropertiesPanel'
import { CheckboxPropertiesPanel } from '@/components/CheckboxPropertiesPanel'
import { RadioPropertiesPanel } from '@/components/RadioPropertiesPanel'
import { DropdownPropertiesPanel } from '@/components/DropdownPropertiesPanel'
import { TogglePropertiesPanel } from '@/components/TogglePropertiesPanel'
import { SliderPropertiesPanel } from '@/components/SliderPropertiesPanel'
import { SpacerPropertiesPanel } from '@/components/SpacerPropertiesPanel'
import { DividerPropertiesPanel } from '@/components/DividerPropertiesPanel'
import { ScrollViewPropertiesPanel } from '@/components/ScrollViewPropertiesPanel'
import { GridPropertiesPanel } from '@/components/GridPropertiesPanel'
import { CarouselPropertiesPanel } from '@/components/CarouselPropertiesPanel'
import { publishFlow as publishFlowAction } from '@/app/actions'
import { useToast } from '@/components/Toast'
import { PublishModal } from '@/components/PublishModal'

const SCREEN_TYPES = [
  { type: 'noboard_screen', name: 'Noboard Screen', icon: '✨' },
  { type: 'custom_screen', name: 'Custom Screen', icon: '🛠️' },
]

const DEVICES = [
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', platform: 'ios' as const, width: 402, height: 874 },
  { id: 'iphone-se', name: 'iPhone SE', platform: 'ios' as const, width: 375, height: 667 },
  { id: 'pixel-7', name: 'Pixel 7', platform: 'android' as const, width: 412, height: 915 },
  { id: 'galaxy-s23', name: 'Galaxy S23', platform: 'android' as const, width: 360, height: 780 },
  { id: 'ipad-pro', name: 'iPad Pro', platform: 'ios' as const, width: 1024, height: 1366 },
]

export default function FlowBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [config, setConfig] = useState<OnboardingConfig | null>(null)
  const [screens, setScreens] = useState<Screen[]>([])
  const [selectedScreen, setSelectedScreen] = useState<number | null>(null)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showScreenPicker, setShowScreenPicker] = useState(false)
  const [showElementPicker, setShowElementPicker] = useState(false)
  const [addToParentId, setAddToParentId] = useState<string | null>(null)
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set())
  const [lockedElements, setLockedElements] = useState<Set<string>>(new Set())
  const [selectedDevice, setSelectedDevice] = useState<string>('iphone-16-pro')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [zoom, setZoom] = useState<number>(100)
  const [leftSidebarTab, setLeftSidebarTab] = useState<'layout' | 'ai-builder'>('layout')
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({})
  const [assets, setAssets] = useState<Asset[]>([])
  const [draggedScreenIndex, setDraggedScreenIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [screenMenuOpen, setScreenMenuOpen] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('free')
  const screenMenuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadConfig()
    loadUserCredits()
  }, [])

  // Close screen picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showScreenPicker) {
        const target = e.target as HTMLElement
        if (!target.closest('[data-screen-picker]')) {
          setShowScreenPicker(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showScreenPicker])

  // Close screen menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (screenMenuRef.current && !screenMenuRef.current.contains(e.target as Node)) {
        setScreenMenuOpen(false)
      }
    }
    if (screenMenuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [screenMenuOpen])

  const duplicateScreen = (index: number) => {
    const screen = screens[index]
    const copy: Screen = {
      ...JSON.parse(JSON.stringify(screen)),
      id: `screen_${Date.now()}`,
    }
    const newScreens = [...screens]
    newScreens.splice(index + 1, 0, copy)
    setScreens(newScreens)
    setSelectedScreen(index + 1)
  }

  const toggleScreenVisibility = (index: number) => {
    const newScreens = [...screens]
    newScreens[index] = { ...newScreens[index], hidden: !newScreens[index].hidden }
    setScreens(newScreens)
  }

  const loadConfig = async () => {
    const { data } = await supabase
      .from('onboarding_configs')
      .select('*, organizations(plan)')
      .eq('id', params.id)
      .single()

    if (data) {
      setConfig(data)
      setScreens(data.config.screens || [])
      setAssets(data.config.assets || [])

      // Set subscription plan from organization
      if (data.organizations && typeof data.organizations === 'object' && 'plan' in data.organizations) {
        setSubscriptionPlan((data.organizations as any).plan || 'free')
      }
    }
    setLoading(false)
  }

  const loadUserCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoadingCredits(false)
        return
      }

      const { data } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setUserCredits(Number(data.credits_remaining))
      } else {
        // User doesn't have a credits record yet, show 0
        setUserCredits(0)
      }
    } catch (error) {
      console.error('Error loading credits:', error)
      setUserCredits(0)
    } finally {
      setLoadingCredits(false)
    }
  }

  const addScreen = (type: string) => {
    const defaults = getDefaultProps(type)
    const newScreen: Screen = {
      id: `screen_${Date.now()}`,
      type: type as any,
      props: type === 'noboard_screen' || type === 'custom_screen' ? {} : defaults.props || defaults,
      ...(type === 'noboard_screen' && {
        layout: defaults.layout,
        elements: defaults.elements,
      }),
      ...(type === 'custom_screen' && {
        custom_component_name: '',
        custom_description: '',
        custom_variables: [],
      }),
    }
    setScreens([...screens, newScreen])
  }

  const removeScreen = (index: number) => {
    const screenToRemove = screens[index]
    if (screenToRemove) {
      // Clean up chat history for this screen
      setChatHistories(prev => {
        const updated = { ...prev }
        delete updated[screenToRemove.id]
        return updated
      })
    }
    setScreens(screens.filter((_, i) => i !== index))
    if (selectedScreen === index) {
      setSelectedScreen(null)
    }
  }

  const moveScreen = (index: number, direction: 'up' | 'down') => {
    const newScreens = [...screens]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= screens.length) return

    [newScreens[index], newScreens[targetIndex]] = [newScreens[targetIndex], newScreens[index]]
    setScreens(newScreens)
  }

  const updateScreenProp = (index: number, prop: string, value: any) => {
    const newScreens = [...screens]
    if (prop === '_full_screen') {
      // Replace entire screen object (used for custom screens)
      newScreens[index] = value
    } else {
      newScreens[index].props[prop] = value
    }
    setScreens(newScreens)
  }

  const updateScreen = (index: number, updates: Partial<Screen>) => {
    const newScreens = [...screens]
    newScreens[index] = { ...newScreens[index], ...updates }
    setScreens(newScreens)
  }

  const handleAssetSelection = (elementId: string, assetName: string, assetType: 'image' | 'video' | 'lottie') => {
    if (selectedScreen === null) return

    const updateElementInTree = (elements: any[]): any[] => {
      return elements.map(el => {
        if (el.id === elementId) {
          // Update URL to use asset reference
          const updatedEl = {
            ...el,
            props: {
              ...el.props,
              url: `asset:${assetName}`,
            },
          }

          // Auto-convert element type if needed
          if (el.type !== assetType) {
            updatedEl.type = assetType
            console.log(`Auto-converted element from ${el.type} to ${assetType}`)
          }

          return updatedEl
        }

        // Recursively update children
        if (el.children) {
          return {
            ...el,
            children: updateElementInTree(el.children),
          }
        }

        return el
      })
    }

    const currentScreen = screens[selectedScreen]
    if (currentScreen && currentScreen.elements) {
      const updatedElements = updateElementInTree(currentScreen.elements)
      updateScreen(selectedScreen, { elements: updatedElements })
      toast(`Asset "${assetName}" assigned`, 'success')
    }
  }

  const saveFlow = async () => {
    setSaving(true)
    await supabase
      .from('onboarding_configs')
      .update({
        config: {
          version: config?.version || '1.0.0',
          screens,
          assets,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    setSaving(false)
    toast('Flow saved', 'success')
  }

  const publishFlow = async (environment: 'test' | 'production') => {
    setSaving(true)

    try {
      // Save the config first (client-side to avoid body size limits with large assets)
      const { error: saveError } = await supabase
        .from('onboarding_configs')
        .update({
          config: {
            version: config?.version || '1.0.0',
            screens,
            assets,
          },
          environment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (saveError) {
        throw new Error(`Save failed: ${saveError.message}`)
      }

      // Then toggle publish status via server action (handles unpublishing others)
      const result = await publishFlowAction(params.id as string, environment)

      if (result.error) {
        throw new Error(`Publish failed: ${result.error}`)
      }

      await loadConfig()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="muted">Loading...</Text>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: `${theme.spacing.md} ${theme.spacing.xl}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <button
              onClick={() => router.push('/home')}
              style={{ background: 'none', border: 'none', color: theme.colors.textMuted, cursor: 'pointer', fontSize: theme.fontSizes.sm }}
            >
              ← Back
            </button>
            <div>
              <Heading level={3}>{config?.name}</Heading>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <Text variant="light" size="sm">v{config?.version}</Text>
                {!loadingCredits && (
                  <>
                    <span style={{ color: theme.colors.border }}>•</span>
                    <Text
                      variant="light"
                      size="sm"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: '600'
                      }}
                    >
                      {userCredits !== null ? `${userCredits.toFixed(2)} credits` : '0 credits'}
                    </Text>
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Button variant="secondary" onClick={saveFlow} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button variant="primary" onClick={() => setShowPublishModal(true)} disabled={saving}>
              {config?.is_published ? '✓ Published' : 'Publish'}
            </Button>
          </div>
        </div>
      </header>

      <div style={{ padding: `${theme.spacing.md} 0`, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 350px', gap: theme.spacing.md, height: '100%', gridTemplateRows: '1fr' }}>
          {/* Left Sidebar - Pages + Element Tree */}
          <div style={{ display: 'flex', gap: '1px', height: '100%', overflow: 'hidden', minHeight: 0 }}>
            {/* Page Numbers Column */}
            <div style={{ width: '60px', backgroundColor: theme.colors.surface, borderRadius: 0, padding: theme.spacing.sm, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, borderRight: `1px solid ${theme.colors.border}`, position: 'relative', overflow: 'visible', minHeight: 0 }}>
              <button
                data-screen-picker="true"
                onClick={() => setShowScreenPicker(!showScreenPicker)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  backgroundColor: theme.colors.background,
                  border: `2px dashed ${theme.colors.borderDashed}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: theme.fontSizes.xl,
                  color: theme.colors.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                +
              </button>

              {/* Screen Type Picker */}
              {showScreenPicker && (
                <div
                  data-screen-picker="true"
                  style={{
                    position: 'absolute',
                    top: '60px',
                    left: '60px',
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.lg,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    padding: theme.spacing.md,
                    zIndex: 100,
                    width: '250px',
                  }}
                >
                  <Heading level={4} style={{ marginBottom: theme.spacing.md, fontSize: theme.fontSizes.sm }}>Add Screen</Heading>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    {SCREEN_TYPES.map((screenType) => (
                      <button
                        key={screenType.type}
                        onClick={() => {
                          addScreen(screenType.type)
                          setShowScreenPicker(false)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.background,
                          border: 'none',
                          borderRadius: theme.borderRadius.md,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                          transition: 'all 0.2s',
                          fontSize: theme.fontSizes.sm,
                        }}
                        className="hover:bg-gray-200"
                      >
                        <span style={{ fontSize: theme.fontSizes.lg }}>{screenType.icon}</span>
                        <span>{screenType.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
              {screens.map((screen, index) => (
                <button
                  key={screen.id}
                  draggable
                  onClick={() => setSelectedScreen(index)}
                  onDragStart={(e) => {
                    setDraggedScreenIndex(index)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if (draggedScreenIndex !== null && draggedScreenIndex !== index) {
                      setDropTargetIndex(index)
                    }
                  }}
                  onDragLeave={() => {
                    setDropTargetIndex(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedScreenIndex !== null && draggedScreenIndex !== index) {
                      const newScreens = [...screens]
                      const [moved] = newScreens.splice(draggedScreenIndex, 1)
                      newScreens.splice(index, 0, moved)
                      setScreens(newScreens)
                      // Update selectedScreen to follow the moved screen
                      if (selectedScreen === draggedScreenIndex) {
                        setSelectedScreen(index)
                      } else if (selectedScreen !== null) {
                        // Adjust selectedScreen if it shifted
                        if (draggedScreenIndex < selectedScreen && index >= selectedScreen) {
                          setSelectedScreen(selectedScreen - 1)
                        } else if (draggedScreenIndex > selectedScreen && index <= selectedScreen) {
                          setSelectedScreen(selectedScreen + 1)
                        }
                      }
                    }
                    setDraggedScreenIndex(null)
                    setDropTargetIndex(null)
                  }}
                  onDragEnd={() => {
                    setDraggedScreenIndex(null)
                    setDropTargetIndex(null)
                  }}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: selectedScreen === index ? theme.colors.primary : theme.colors.background,
                    color: selectedScreen === index ? '#fff' : theme.colors.text,
                    border: `2px solid ${
                      dropTargetIndex === index
                        ? theme.colors.primary
                        : selectedScreen === index
                        ? theme.colors.primary
                        : theme.colors.border
                    }`,
                    borderRadius: theme.borderRadius.md,
                    cursor: draggedScreenIndex !== null ? 'grabbing' : 'grab',
                    fontSize: theme.fontSizes.lg,
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: draggedScreenIndex === index ? 0.4 : screen.hidden ? 0.4 : 1,
                    transform: dropTargetIndex === index ? 'scale(1.1)' : 'scale(1)',
                    textDecoration: screen.hidden ? 'line-through' : 'none',
                  }}
                >
                  {index + 1}
                </button>
              ))}
              </div>
            </div>

            {/* Element Tree Column */}
            <div style={{ flex: 1, backgroundColor: theme.colors.surface, borderRadius: `0 ${theme.borderRadius.lg} ${theme.borderRadius.lg} 0`, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              {/* Tabs */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.colors.border}`,
                padding: `${theme.spacing.sm} ${theme.spacing.md} 0`
              }}>
                <button
                  onClick={() => setLeftSidebarTab('layout')}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: leftSidebarTab === 'layout' ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                    color: leftSidebarTab === 'layout' ? theme.colors.primary : theme.colors.textMuted,
                    fontSize: theme.fontSizes.sm,
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: theme.fonts.sans,
                    transition: 'all 0.2s',
                  }}
                >
                  Layout
                </button>
                <button
                  onClick={() => setLeftSidebarTab('ai-builder')}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: leftSidebarTab === 'ai-builder' ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                    color: leftSidebarTab === 'ai-builder' ? theme.colors.primary : theme.colors.textMuted,
                    fontSize: theme.fontSizes.sm,
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: theme.fonts.sans,
                    transition: 'all 0.2s',
                  }}
                >
                  AI Chat
                </button>
                {/* Screen three-dot menu */}
                <div ref={screenMenuRef} style={{ marginLeft: 'auto', position: 'relative', marginBottom: '2px' }}>
                  <button
                    onClick={() => setScreenMenuOpen(!screenMenuOpen)}
                    disabled={selectedScreen === null}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: selectedScreen === null ? 'default' : 'pointer',
                      padding: '4px 6px',
                      borderRadius: theme.borderRadius.sm,
                      color: selectedScreen === null ? theme.colors.border : theme.colors.textMuted,
                      fontSize: '16px',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={selectedScreen === null ? 'Select a screen first' : 'Screen options'}
                  >
                    &#x22EE;
                  </button>
                  {screenMenuOpen && selectedScreen !== null && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      zIndex: 30,
                      minWidth: '160px',
                      overflow: 'hidden',
                      marginTop: '4px',
                    }}>
                      <button
                        onClick={() => {
                          duplicateScreen(selectedScreen)
                          setScreenMenuOpen(false)
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 14px', border: 'none',
                          backgroundColor: 'transparent', cursor: 'pointer',
                          fontSize: theme.fontSizes.sm, color: theme.colors.text,
                          fontFamily: theme.fonts.sans,
                        }}
                      >
                        Duplicate Screen
                      </button>
                      <button
                        onClick={() => {
                          toggleScreenVisibility(selectedScreen)
                          setScreenMenuOpen(false)
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 14px', border: 'none',
                          backgroundColor: 'transparent', cursor: 'pointer',
                          fontSize: theme.fontSizes.sm, color: theme.colors.text,
                          fontFamily: theme.fonts.sans,
                        }}
                      >
                        {screens[selectedScreen]?.hidden ? 'Show Screen' : 'Hide Screen'}
                      </button>
                      <div style={{ borderTop: `1px solid ${theme.colors.border}` }} />
                      <button
                        onClick={() => {
                          removeScreen(selectedScreen)
                          setScreenMenuOpen(false)
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 14px', border: 'none',
                          backgroundColor: 'transparent', cursor: 'pointer',
                          fontSize: theme.fontSizes.sm, color: '#dc2626',
                          fontFamily: theme.fonts.sans,
                        }}
                      >
                        Delete Screen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tab Content — both tabs always mounted, hidden via CSS to preserve state */}
              <div style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}>
                {/* Layout tab */}
                <div style={{
                  display: leftSidebarTab === 'layout' ? 'flex' : 'none',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: theme.spacing.md,
                }}>
                {(
                  <>
                    {screens.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textMuted }}>
                        <Text variant="muted" size="sm">No screens yet</Text>
                        <Text variant="light" size="xs" style={{ marginTop: theme.spacing.xs }}>Click + to add a screen</Text>
                      </div>
                    ) : selectedScreen !== null && screens[selectedScreen]?.type === 'noboard_screen' ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: theme.spacing.xl,
                        textAlign: 'center',
                        gap: theme.spacing.md
                      }}>
                        <div style={{
                          fontSize: '64px',
                          marginBottom: theme.spacing.sm
                        }}>
                          🤖
                        </div>
                        <Heading level={4} style={{ color: theme.colors.text }}>
                          Built with AI
                        </Heading>
                        <Text variant="muted" size="sm" style={{ maxWidth: '250px' }}>
                          Use the AI Chat to build and modify this screen. Add a reference image in the right sidebar for more context.
                        </Text>
                        <Button
                          onClick={() => setLeftSidebarTab('ai-builder')}
                          style={{
                            marginTop: theme.spacing.md,
                            padding: `${theme.spacing.sm} ${theme.spacing.lg}`
                          }}
                        >
                          Open AI Chat
                        </Button>
                      </div>
                    ) : selectedScreen !== null && screens[selectedScreen] ? (
                <ElementTree
                  screen={screens[selectedScreen]}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  onAddElement={(elementId, parentId) => {
                    // elementId is the clicked element, parentId is where to actually add
                    setAddToParentId(parentId)
                    setShowElementPicker(true)
                  }}
                  onReorderElement={(draggedId, targetId, position) => {
                    if (selectedScreen === null) return
                    const newScreens = [...screens]
                    const screen = newScreens[selectedScreen]

                    if (screen.type === 'noboard_screen' && screen.elements) {
                      // Find and remove dragged element
                      let draggedElement: any = null

                      const removeElement = (elements: any[]): any[] => {
                        const result: any[] = []
                        for (const el of elements) {
                          if (el.id === draggedId) {
                            draggedElement = el
                          } else {
                            if (el.children) {
                              const newChildren = removeElement(el.children)
                              result.push({ ...el, children: newChildren })
                            } else {
                              result.push(el)
                            }
                          }
                        }
                        return result
                      }

                      screen.elements = removeElement(screen.elements)

                      if (!draggedElement) return

                      // Check for circular nesting
                      const isDescendant = (elementId: string, ancestorId: string): boolean => {
                        const findElement = (elements: any[]): any => {
                          for (const el of elements) {
                            if (el.id === elementId) return el
                            if (el.children) {
                              const found = findElement(el.children)
                              if (found) return found
                            }
                          }
                          return null
                        }

                        const element = findElement([draggedElement])
                        if (!element) return false

                        const checkChildren = (el: any): boolean => {
                          if (el.id === ancestorId) return true
                          if (el.children) {
                            return el.children.some((child: any) => checkChildren(child))
                          }
                          return false
                        }

                        return checkChildren(element)
                      }

                      if (targetId && isDescendant(draggedId, targetId)) {
                        toast('Cannot move a stack into its own children', 'error')
                        setScreens(screens) // Reset
                        return
                      }

                      // Insert element at new position
                      const insertElement = (elements: any[]): any[] => {
                        if (targetId === null) {
                          // Insert at root level
                          return position === 'before' ? [draggedElement, ...elements] : [...elements, draggedElement]
                        }

                        const result: any[] = []
                        for (let i = 0; i < elements.length; i++) {
                          const el = elements[i]

                          if (el.id === targetId) {
                            if (position === 'before') {
                              result.push(draggedElement)
                              result.push(el)
                            } else if (position === 'after') {
                              result.push(el)
                              result.push(draggedElement)
                            } else if (position === 'inside') {
                              result.push({
                                ...el,
                                children: [...(el.children || []), draggedElement]
                              })
                            }
                          } else {
                            if (el.children) {
                              result.push({
                                ...el,
                                children: insertElement(el.children)
                              })
                            } else {
                              result.push(el)
                            }
                          }
                        }
                        return result
                      }

                      screen.elements = insertElement(screen.elements)
                      setScreens(newScreens)
                    }
                  }}
                  hiddenElements={hiddenElements}
                  lockedElements={lockedElements}
                  onToggleHide={(elementId) => {
                    const newHidden = new Set(hiddenElements)
                    if (newHidden.has(elementId)) {
                      newHidden.delete(elementId)
                    } else {
                      newHidden.add(elementId)
                    }
                    setHiddenElements(newHidden)
                  }}
                  onToggleLock={(elementId) => {
                    const newLocked = new Set(lockedElements)
                    if (newLocked.has(elementId)) {
                      newLocked.delete(elementId)
                    } else {
                      newLocked.add(elementId)
                    }
                    setLockedElements(newLocked)
                  }}
                  onDeleteElement={(elementId) => {
                    if (selectedScreen === null) return
                    const newScreens = [...screens]
                    const screen = newScreens[selectedScreen]

                    if (screen.type === 'noboard_screen' && screen.elements) {
                      const deleteFromTree = (elements: any[]): any[] => {
                        return elements.filter(el => {
                          if (el.id === elementId) return false
                          if (el.children) {
                            el.children = deleteFromTree(el.children)
                          }
                          return true
                        })
                      }
                      screen.elements = deleteFromTree(screen.elements)
                      setScreens(newScreens)
                      if (selectedElement === elementId) {
                        setSelectedElement(null)
                      }
                    }
                  }}
                />
                    ) : (
                      <Text variant="muted" size="sm">Select a screen</Text>
                    )}
                  </>
                )}
                </div>

                {/* AI Chat tab — always mounted, hidden via CSS */}
                <div style={{
                  display: leftSidebarTab === 'ai-builder' ? 'flex' : 'none',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                }}>
                {(
                  selectedScreen !== null && screens[selectedScreen]?.type === 'custom_screen' ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: theme.spacing.xl,
                      textAlign: 'center',
                      gap: theme.spacing.md,
                      height: '100%'
                    }}>
                      <div style={{
                        fontSize: '64px',
                        marginBottom: theme.spacing.sm
                      }}>
                        🛠️
                      </div>
                      <Heading level={4} style={{ color: theme.colors.text }}>
                        Custom Screen
                      </Heading>
                      <Text variant="muted" size="sm" style={{ maxWidth: '300px' }}>
                        You cannot use the AI Chat since this is a custom screen made in your app. Use the Layout tab to configure this screen.
                      </Text>
                      <Button
                        onClick={() => setLeftSidebarTab('layout')}
                        size="sm"
                        variant="secondary"
                      >
                        Go to Layout
                      </Button>
                    </div>
                  ) : (
                    <AIChatBuilder
                      selectedScreen={selectedScreen}
                      screens={screens}
                      assets={assets}
                      flowId={config?.id || null}
                      messages={selectedScreen !== null && screens[selectedScreen] ? (chatHistories[screens[selectedScreen].id] || []) : []}
                      onMessagesChange={(msgs) => {
                        if (selectedScreen !== null && screens[selectedScreen]) {
                          setChatHistories(prev => ({ ...prev, [screens[selectedScreen].id]: msgs }))
                        }
                      }}
                      onCreditsUpdate={loadUserCredits}
                      onScreenUpdate={(updatedScreen) => {
                        if (selectedScreen !== null) {
                          const newScreens = [...screens]
                          newScreens[selectedScreen] = updatedScreen
                          setScreens(newScreens)
                        }
                      }}
                      onGeneratingChange={setAiGenerating}
                    />
                  )
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle - Phone Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', overflow: 'hidden', minHeight: 0, gap: theme.spacing.lg }}>
            {/* Phone Frame with Preview */}
            {screens.length === 0 ? (
              <div style={{ textAlign: 'center', color: theme.colors.textMuted }}>
                <Text variant="muted" style={{ marginBottom: theme.spacing.sm }}>No screens yet</Text>
                <Text variant="light" size="sm">Click + to add your first screen</Text>
              </div>
            ) : selectedScreen !== null && screens[selectedScreen] ? (
              <>
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center', transition: 'transform 0.2s', position: 'relative', zIndex: 1 }}>
                  <PhoneFrame device={DEVICES.find(d => d.id === selectedDevice)} orientation={orientation}>
                    <ScreenPreview screen={screens[selectedScreen]} hiddenElements={hiddenElements} assets={assets} />
                  </PhoneFrame>
                  {aiGenerating && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.55)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: theme.spacing.sm,
                      zIndex: 20,
                      borderRadius: '50px',
                      backdropFilter: 'blur(2px)',
                    }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        border: `3px solid ${theme.colors.border}`,
                        borderTopColor: theme.colors.primary,
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      <span style={{
                        fontSize: theme.fontSizes.sm,
                        color: theme.colors.textMuted,
                        fontFamily: theme.fonts.sans,
                        fontWeight: '500',
                      }}>
                        Updating screen...
                      </span>
                    </div>
                  )}
                </div>

                {/* Device Controls */}
                <div style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative',
                  zIndex: 10,
                }}>
                  {/* Device Selector */}
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: theme.fontSizes.sm,
                      cursor: 'pointer',
                      backgroundColor: theme.colors.background,
                    }}
                  >
                    {DEVICES.map(device => (
                      <option key={device.id} value={device.id}>{device.name}</option>
                    ))}
                  </select>

                  {/* Divider */}
                  <div style={{ width: '1px', height: '24px', backgroundColor: theme.colors.border }} />

                  {/* Orientation Toggle */}
                  <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                    <button
                      onClick={() => setOrientation('portrait')}
                      style={{
                        padding: theme.spacing.xs,
                        borderRadius: theme.borderRadius.sm,
                        border: 'none',
                        backgroundColor: orientation === 'portrait' ? theme.colors.primary : theme.colors.background,
                        color: orientation === 'portrait' ? '#fff' : theme.colors.text,
                        cursor: 'pointer',
                        fontSize: '20px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Portrait"
                    >
                      📱
                    </button>
                    <button
                      onClick={() => setOrientation('landscape')}
                      style={{
                        padding: theme.spacing.xs,
                        borderRadius: theme.borderRadius.sm,
                        border: 'none',
                        backgroundColor: orientation === 'landscape' ? theme.colors.primary : theme.colors.background,
                        color: orientation === 'landscape' ? '#fff' : theme.colors.text,
                        cursor: 'pointer',
                        fontSize: '20px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'rotate(90deg)',
                      }}
                      title="Landscape"
                    >
                      📱
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ width: '1px', height: '24px', backgroundColor: theme.colors.border }} />

                  {/* Zoom Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <button
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      disabled={zoom <= 50}
                      style={{
                        padding: theme.spacing.xs,
                        borderRadius: theme.borderRadius.sm,
                        border: 'none',
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        cursor: zoom <= 50 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: zoom <= 50 ? 0.5 : 1,
                      }}
                      title="Zoom out"
                    >
                      −
                    </button>
                    <span style={{ fontSize: theme.fontSizes.sm, minWidth: '45px', textAlign: 'center', color: theme.colors.text }}>
                      {zoom}%
                    </span>
                    <button
                      onClick={() => setZoom(Math.min(150, zoom + 10))}
                      disabled={zoom >= 150}
                      style={{
                        padding: theme.spacing.xs,
                        borderRadius: theme.borderRadius.sm,
                        border: 'none',
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        cursor: zoom >= 150 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: zoom >= 150 ? 0.5 : 1,
                      }}
                      title="Zoom in"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setZoom(100)}
                      style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        borderRadius: theme.borderRadius.sm,
                        border: 'none',
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        cursor: 'pointer',
                        fontSize: theme.fontSizes.xs,
                      }}
                      title="Reset zoom"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Preview disclaimer */}
                <div style={{
                  fontSize: '11px',
                  color: theme.colors.textMuted,
                  textAlign: 'center',
                  maxWidth: 320,
                  lineHeight: '1.4',
                  opacity: 0.7,
                }}>
                  Preview is an estimate. Margins, padding, and layout may differ on device. Publish and test on Expo for accurate results.
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: theme.colors.textMuted }}>
                <Text variant="muted">Select a screen to preview</Text>
              </div>
            )}
          </div>

          {/* Right Sidebar - Assets + Properties/Slots/Variables */}
          <div style={{ backgroundColor: theme.colors.surface, borderRadius: 0, padding: theme.spacing.md, height: '100%', minHeight: 0, overflowY: 'auto' }}>
            {selectedScreen === null ? (
              <div style={{ textAlign: 'center', padding: `${theme.spacing['2xl']} 0`, color: theme.colors.textMuted }}>
                <Text variant="muted" size="sm">Select a screen</Text>
                <Text variant="light" size="xs" style={{ marginTop: theme.spacing.xs }}>to edit properties</Text>
              </div>
            ) : leftSidebarTab === 'ai-builder' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <ReferencePanel
                  screen={screens[selectedScreen]}
                  onUpdate={(updates) => updateScreen(selectedScreen, updates)}
                />
                <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md }}>
                  <AssetsPanel
                    assets={assets}
                    onAddAsset={(asset) => setAssets([...assets, asset])}
                    onRemoveAsset={(id) => setAssets(assets.filter(a => a.id !== id))}
                  />
                </div>
                <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md }}>
                  <ImageSlotsIndicator
                    elements={screens[selectedScreen]?.elements || []}
                    assets={assets}
                    onSelectAsset={handleAssetSelection}
                  />
                </div>
                <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md }}>
                  <VariablesPanel screens={screens} selectedScreen={selectedScreen} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <ReferencePanel
                  screen={screens[selectedScreen]}
                  onUpdate={(updates) => updateScreen(selectedScreen, updates)}
                />
                <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md }}>
                  <AssetsPanel
                    assets={assets}
                    onAddAsset={(asset) => setAssets([...assets, asset])}
                    onRemoveAsset={(id) => setAssets(assets.filter(a => a.id !== id))}
                  />
                </div>
                <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md }}>
                  <PropertiesPanel
                    screen={screens[selectedScreen]}
                    screenIndex={selectedScreen}
                    selectedElement={selectedElement}
                    onUpdate={(prop, value) => updateScreenProp(selectedScreen, prop, value)}
                    onUpdateElement={(elementId, updates) => {
                      const newScreens = [...screens]
                      const screen = newScreens[selectedScreen]
                      if (screen.elements) {
                        const updateElementInTree = (elements: any[]): any[] => {
                          return elements.map(el => {
                            if (el.id === elementId) {
                              return { ...el, ...updates }
                            }
                            if (el.children) {
                              return { ...el, children: updateElementInTree(el.children) }
                            }
                            return el
                          })
                        }
                        screen.elements = updateElementInTree(screen.elements)
                        setScreens(newScreens)
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Element Picker Modal */}
      {showElementPicker && selectedScreen !== null && (
        <ElementPicker
          onSelect={(elementType) => {
            const newElement = getDefaultElementProps(elementType)
            const newScreens = [...screens]
            const screen = newScreens[selectedScreen]

            if (screen.type === 'noboard_screen' && screen.elements) {
              // Add element to the tree
              if (addToParentId === null) {
                // Add to root
                screen.elements = [...screen.elements, newElement]
              } else {
                // Add to specific parent's children
                const addElementToParent = (elements: any[]): any[] => {
                  return elements.map((el) => {
                    if (el.id === addToParentId) {
                      // Found the parent - add to its children
                      return {
                        ...el,
                        children: [...(el.children || []), newElement],
                      }
                    }
                    if (el.children) {
                      // Keep looking in children
                      return {
                        ...el,
                        children: addElementToParent(el.children),
                      }
                    }
                    return el
                  })
                }
                screen.elements = addElementToParent(screen.elements)
              }

              setScreens(newScreens)
              setSelectedElement(newElement.id)
            }

            setShowElementPicker(false)
            setAddToParentId(null)
          }}
          onClose={() => {
            setShowElementPicker(false)
            setAddToParentId(null)
          }}
        />
      )}

      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={publishFlow}
        subscriptionPlan={subscriptionPlan}
        lastPublishedAt={config?.last_published_at}
        currentScreens={screens}
        configId={params.id as string}
        projectId={config?.project_id}
        organizationId={config?.organization_id}
      />
    </div>
  )
}

function ElementPropertiesEditor({ element, onUpdate }: { element: any; onUpdate: (updates: any) => void }) {
  // Use specialized properties panels for stack elements
  if (element.type === 'vstack') {
    return <VStackPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'hstack') {
    return <HStackPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'zstack') {
    return <ZStackPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  // Use TextPropertiesPanel for text, heading, and button elements
  if (element.type === 'text' || element.type === 'heading' || element.type === 'button') {
    return <TextPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  // Use ImagePropertiesPanel for image elements
  if (element.type === 'image') {
    return <ImagePropertiesPanel element={element} onUpdate={onUpdate} />
  }

  // Container elements
  if (element.type === 'scrollview') {
    return <ScrollViewPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'grid') {
    return <GridPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'carousel') {
    return <CarouselPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  // Input elements
  if (element.type === 'input') {
    return <InputPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'checkbox') {
    return <CheckboxPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'radio') {
    return <RadioPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'dropdown') {
    return <DropdownPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'toggle') {
    return <TogglePropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'slider') {
    return <SliderPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  // Layout helpers
  if (element.type === 'spacer') {
    return <SpacerPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  if (element.type === 'divider') {
    return <DividerPropertiesPanel element={element} onUpdate={onUpdate} />
  }

  const updateStyle = (key: string, value: any) => {
    onUpdate({ style: { ...element.style, [key]: value } })
  }

  const updateProp = (key: string, value: any) => {
    onUpdate({ props: { ...element.props, [key]: value } })
  }

  const updatePosition = (key: string, value: any) => {
    onUpdate({ position: { ...element.position, [key]: value } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Element Header */}
      <div>
        <Text style={{ fontWeight: '600', fontSize: theme.fontSizes.base, textTransform: 'capitalize' }}>
          {element.type.replace('_', ' ')}
        </Text>
        <Text variant="light" size="xs" style={{ marginTop: theme.spacing.xs }}>
          {element.id}
        </Text>
      </div>

      <div style={{ height: '1px', backgroundColor: theme.colors.border }} />

      {/* Content Properties */}
      {(element.type === 'text' || element.type === 'heading' || element.type === 'button') && (
        <PropertySection title="Content">
          <PropertyField label="Text">
            <input
              type="text"
              value={element.props.text || ''}
              onChange={(e) => updateProp('text', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Checkbox Properties */}
      {element.type === 'checkbox' && (
        <PropertySection title="Checkbox">
          <PropertyField label="Label">
            <input
              type="text"
              value={element.props.label || ''}
              onChange={(e) => updateProp('label', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
          <PropertyField label="Checked">
            <input
              type="checkbox"
              checked={element.props.checked || false}
              onChange={(e) => updateProp('checked', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </PropertyField>
          <PropertyField label="Size">
            <input
              type="number"
              value={element.props.size || 20}
              onChange={(e) => updateProp('size', parseInt(e.target.value) || 20)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Toggle Properties */}
      {element.type === 'toggle' && (
        <PropertySection title="Toggle">
          <PropertyField label="Label">
            <input
              type="text"
              value={element.props.label || ''}
              onChange={(e) => updateProp('label', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
          <PropertyField label="Checked">
            <input
              type="checkbox"
              checked={element.props.checked || false}
              onChange={(e) => updateProp('checked', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Slider Properties */}
      {element.type === 'slider' && (
        <PropertySection title="Slider">
          <PropertyField label="Label">
            <input
              type="text"
              value={element.props.label || ''}
              onChange={(e) => updateProp('label', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
          <PropertyField label="Min">
            <input
              type="number"
              value={element.props.min || 0}
              onChange={(e) => updateProp('min', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
          <PropertyField label="Max">
            <input
              type="number"
              value={element.props.max || 100}
              onChange={(e) => updateProp('max', parseInt(e.target.value) || 100)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
          <PropertyField label="Value">
            <input
              type="number"
              value={element.props.value || 50}
              onChange={(e) => updateProp('value', parseInt(e.target.value) || 50)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
          <PropertyField label="Step">
            <input
              type="number"
              value={element.props.step || 1}
              onChange={(e) => updateProp('step', parseInt(e.target.value) || 1)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
          <PropertyField label="Show Value">
            <input
              type="checkbox"
              checked={element.props.showValue || false}
              onChange={(e) => updateProp('showValue', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Layout Properties for VStack/HStack */}
      {(element.type === 'vstack' || element.type === 'hstack') && (
        <>
          <PropertySection title="Layout">
            <PropertyField label="Direction">
              <select
                value={element.style.flexDirection || 'column'}
                onChange={(e) => updateStyle('flexDirection', e.target.value)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
              >
                <option value="column">Vertical</option>
                <option value="row">Horizontal</option>
              </select>
            </PropertyField>

            <PropertyField label="Justify Content">
              <select
                value={element.style.justifyContent || 'flex-start'}
                onChange={(e) => updateStyle('justifyContent', e.target.value)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
              >
                <option value="flex-start">Start</option>
                <option value="center">Center</option>
                <option value="flex-end">End</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
              </select>
            </PropertyField>

            <PropertyField label="Align Items">
              <select
                value={element.style.alignItems || 'flex-start'}
                onChange={(e) => updateStyle('alignItems', e.target.value)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
              >
                <option value="flex-start">Start</option>
                <option value="center">Center</option>
                <option value="flex-end">End</option>
                <option value="stretch">Stretch</option>
              </select>
            </PropertyField>

            <PropertyField label="Gap">
              <input
                type="number"
                value={element.style.gap || 0}
                onChange={(e) => updateStyle('gap', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
              />
            </PropertyField>
          </PropertySection>
        </>
      )}

      {/* ScrollView Properties */}
      {element.type === 'scrollview' && (
        <PropertySection title="ScrollView">
          <PropertyField label="Direction">
            <select
              value={element.props.direction || 'vertical'}
              onChange={(e) => updateProp('direction', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </PropertyField>

          <PropertyField label="Show Scrollbar">
            <input
              type="checkbox"
              checked={element.props.showScrollbar !== undefined ? element.props.showScrollbar : true}
              onChange={(e) => updateProp('showScrollbar', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </PropertyField>

          <PropertyField label="Bounce">
            <input
              type="checkbox"
              checked={element.props.bounce !== undefined ? element.props.bounce : true}
              onChange={(e) => updateProp('bounce', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Grid Properties */}
      {element.type === 'grid' && (
        <PropertySection title="Grid">
          <PropertyField label="Columns">
            <input
              type="number"
              min="1"
              max="12"
              value={element.props.columns || 2}
              onChange={(e) => updateProp('columns', parseInt(e.target.value) || 2)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>

          <PropertyField label="Gap">
            <input
              type="number"
              value={element.style.gap || 0}
              onChange={(e) => updateStyle('gap', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Carousel Properties */}
      {element.type === 'carousel' && (
        <PropertySection title="Carousel">
          <PropertyField label="Gap Between Slides">
            <input
              type="number"
              value={element.props.gap || 0}
              onChange={(e) => updateProp('gap', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>

          <PropertyField label="Autoplay">
            <input
              type="checkbox"
              checked={element.props.autoplay || false}
              onChange={(e) => updateProp('autoplay', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </PropertyField>

          <PropertyField label="Loop">
            <input
              type="checkbox"
              checked={element.props.loop !== undefined ? element.props.loop : true}
              onChange={(e) => updateProp('loop', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </PropertyField>

          <PropertyField label="Show Dots">
            <input
              type="checkbox"
              checked={element.props.showDots !== undefined ? element.props.showDots : true}
              onChange={(e) => updateProp('showDots', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Text Style Properties */}
      {(element.type === 'text' || element.type === 'heading') && (
        <PropertySection title="Typography">
          <PropertyField label="Font Size">
            <input
              type="number"
              value={element.style.fontSize || 16}
              onChange={(e) => updateStyle('fontSize', parseInt(e.target.value) || 16)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            />
          </PropertyField>

          <PropertyField label="Font Weight">
            <select
              value={element.style.fontWeight || '400'}
              onChange={(e) => updateStyle('fontWeight', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            >
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
            </select>
          </PropertyField>

          <PropertyField label="Text Align">
            <select
              value={element.style.textAlign || 'left'}
              onChange={(e) => updateStyle('textAlign', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </PropertyField>

          <PropertyField label="Color">
            <input
              type="text"
              value={element.style.color || '#000000'}
              onChange={(e) => updateStyle('color', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
              placeholder="#000000"
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Spacer Properties */}
      {element.type === 'spacer' && (
        <PropertySection title="Spacer">
          <PropertyField label="Flex (Fill Space)">
            <input
              type="number"
              min="0"
              max="10"
              value={element.style.flex !== undefined ? element.style.flex : ''}
              onChange={(e) => updateStyle('flex', e.target.value ? parseInt(e.target.value) : undefined)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
              placeholder="0 = fixed, 1+ = flexible"
            />
          </PropertyField>
        </PropertySection>
      )}

      {/* Size Properties */}
      <PropertySection title="Size">
        <PropertyField label="Width">
          <input
            type="text"
            value={element.style.width !== undefined ? element.style.width : 'auto'}
            onChange={(e) => {
              const val = e.target.value
              updateStyle('width', val === 'auto' ? undefined : (isNaN(Number(val)) ? val : parseInt(val)))
            }}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
            placeholder="auto, 100%, or px"
          />
        </PropertyField>

        <PropertyField label="Height">
          <input
            type="text"
            value={element.style.height !== undefined ? element.style.height : 'auto'}
            onChange={(e) => {
              const val = e.target.value
              updateStyle('height', val === 'auto' ? undefined : (isNaN(Number(val)) ? val : parseInt(val)))
            }}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
            placeholder="auto, 100%, or px"
          />
        </PropertyField>
      </PropertySection>

      {/* Padding */}
      <PropertySection title="Padding">
        <PropertyField label="All Sides">
          <input
            type="number"
            value={typeof element.style.padding === 'number' ? element.style.padding : 0}
            onChange={(e) => updateStyle('padding', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>
      </PropertySection>

      {/* Background & Border */}
      <PropertySection title="Appearance">
        <PropertyField label="Background Color">
          <input
            type="text"
            value={element.style.backgroundColor || ''}
            onChange={(e) => updateStyle('backgroundColor', e.target.value)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
            placeholder="transparent"
          />
        </PropertyField>

        <PropertyField label="Opacity">
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={element.style.opacity !== undefined ? element.style.opacity : 1}
            onChange={(e) => updateStyle('opacity', parseFloat(e.target.value) || 1)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>

        <PropertyField label="Border Radius">
          <input
            type="number"
            value={element.style.borderRadius || 0}
            onChange={(e) => updateStyle('borderRadius', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>

        <PropertyField label="Border Width">
          <input
            type="number"
            value={element.style.borderWidth || 0}
            onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>

        {element.style.borderWidth > 0 && (
          <PropertyField label="Border Color">
            <input
              type="text"
              value={element.style.borderColor || '#000000'}
              onChange={(e) => updateStyle('borderColor', e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
              }}
              placeholder="#000000"
            />
          </PropertyField>
        )}
      </PropertySection>

      {/* Shadow */}
      <PropertySection title="Shadow">
        <PropertyField label="Shadow Color">
          <input
            type="text"
            value={element.style.shadowColor || '#000000'}
            onChange={(e) => updateStyle('shadowColor', e.target.value)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
            placeholder="#000000"
          />
        </PropertyField>

        <PropertyField label="Shadow Opacity">
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={element.style.shadowOpacity !== undefined ? element.style.shadowOpacity : 0}
            onChange={(e) => updateStyle('shadowOpacity', parseFloat(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>

        <PropertyField label="Shadow Radius">
          <input
            type="number"
            value={element.style.shadowRadius || 0}
            onChange={(e) => updateStyle('shadowRadius', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>

        <PropertyField label="Shadow Offset X">
          <input
            type="number"
            value={element.style.shadowOffsetX || 0}
            onChange={(e) => updateStyle('shadowOffsetX', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>

        <PropertyField label="Shadow Offset Y">
          <input
            type="number"
            value={element.style.shadowOffsetY || 0}
            onChange={(e) => updateStyle('shadowOffsetY', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>
      </PropertySection>

      {/* Position */}
      <PropertySection title="Position">
        <PropertyField label="Type">
          <select
            value={element.position?.type || 'relative'}
            onChange={(e) => updatePosition('type', e.target.value)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          >
            <option value="relative">Relative</option>
            <option value="absolute">Absolute</option>
          </select>
        </PropertyField>

        {element.position?.type === 'absolute' && (
          <>
            <PropertyField label="Top">
              <input
                type="number"
                value={element.position?.top !== undefined ? element.position.top : ''}
                onChange={(e) => updatePosition('top', e.target.value ? parseInt(e.target.value) : undefined)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
                placeholder="auto"
              />
            </PropertyField>

            <PropertyField label="Left">
              <input
                type="number"
                value={element.position?.left !== undefined ? element.position.left : ''}
                onChange={(e) => updatePosition('left', e.target.value ? parseInt(e.target.value) : undefined)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
                placeholder="auto"
              />
            </PropertyField>

            <PropertyField label="Right">
              <input
                type="number"
                value={element.position?.right !== undefined ? element.position.right : ''}
                onChange={(e) => updatePosition('right', e.target.value ? parseInt(e.target.value) : undefined)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
                placeholder="auto"
              />
            </PropertyField>

            <PropertyField label="Bottom">
              <input
                type="number"
                value={element.position?.bottom !== undefined ? element.position.bottom : ''}
                onChange={(e) => updatePosition('bottom', e.target.value ? parseInt(e.target.value) : undefined)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
                placeholder="auto"
              />
            </PropertyField>

            <PropertyField label="Center Horizontally">
              <input
                type="checkbox"
                checked={element.position?.centerX || false}
                onChange={(e) => updatePosition('centerX', e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                }}
              />
            </PropertyField>

            <PropertyField label="Center Vertically">
              <input
                type="checkbox"
                checked={element.position?.centerY || false}
                onChange={(e) => updatePosition('centerY', e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                }}
              />
            </PropertyField>
          </>
        )}

        <PropertyField label="Z-Index">
          <input
            type="number"
            value={element.position?.zIndex !== undefined ? element.position.zIndex : 0}
            onChange={(e) => updatePosition('zIndex', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSizes.sm,
            }}
          />
        </PropertyField>
      </PropertySection>
    </div>
  )
}

// ─── Reference Panel (screen-specific design mockup for AI builder) ───

function ReferencePanel({ screen, onUpdate }: {
  screen: Screen
  onUpdate: (updates: Partial<Screen>) => void
}) {
  const { toast } = useToast()
  const [showViewModal, setShowViewModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      onUpdate({ referenceImageData: dataUrl })
      toast('Reference image uploaded', 'success')
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    onUpdate({ referenceImageData: undefined, referenceImageUrl: undefined })
    toast('Reference image removed', 'success')
  }

  const formatSize = (dataUrl: string) => {
    const bytes = Math.round((dataUrl.length * 3) / 4)
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size="sm" style={{ fontWeight: '600' }}>
          📋 Reference
        </Text>
        {!screen.referenceImageData && (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: `2px ${theme.spacing.sm}`,
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: theme.colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
            }}
          >
            + Upload
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Reference Image or Empty State */}
      {screen.referenceImageData ? (
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.background,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <Text size="xs" style={{ fontWeight: '500', color: theme.colors.textMuted }}>
              Design Mockup · {formatSize(screen.referenceImageData)}
            </Text>
            <button
              onClick={handleRemove}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: 'transparent',
                color: theme.colors.textMuted,
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
              title="Remove reference"
            >
              ✕
            </button>
          </div>
          <div
            onClick={() => setShowViewModal(true)}
            style={{
              position: 'relative',
              width: '100%',
              height: '100px',
              borderRadius: theme.borderRadius.sm,
              overflow: 'hidden',
              cursor: 'pointer',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <img
              src={screen.referenceImageData}
              alt="Reference"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
            >
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '500',
              }}>
                👁️ View Full Size
              </div>
            </div>
          </div>
          <Text size="xs" style={{ marginTop: '4px', color: theme.colors.textMuted, fontStyle: 'italic' }}>
            AI uses this as design reference
          </Text>
        </div>
      ) : (
        <div style={{
          border: `1px dashed ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          textAlign: 'center',
          backgroundColor: theme.colors.background,
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: '32px', marginBottom: theme.spacing.xs, opacity: 0.3 }}>🖼️</div>
          <Text variant="muted" size="xs">
            Upload design mockup
          </Text>
          <Text variant="light" size="xs" style={{ marginTop: '2px' }}>
            AI will recreate this design
          </Text>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && screen.referenceImageData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.spacing.xl,
          }}
          onClick={() => setShowViewModal(false)}
        >
          <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}>
            <button
              onClick={() => setShowViewModal(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
            <img
              src={screen.referenceImageData}
              alt="Reference Full Size"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: theme.borderRadius.md,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Assets Panel (shown in right sidebar, all tabs) ───

const ASSET_TYPE_CONFIG = {
  image: { icon: '🖼️', accept: 'image/*', label: 'Image' },
  video: { icon: '🎬', accept: 'video/*', label: 'Video' },
  lottie: { icon: '✨', accept: '.json,application/json', label: 'Lottie' },
} as const

function AssetsPanel({ assets, onAddAsset, onRemoveAsset }: {
  assets: Asset[]
  onAddAsset: (asset: Asset) => void
  onRemoveAsset: (id: string) => void
}) {
  const { toast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAssetType, setNewAssetType] = useState<'image' | 'video' | 'lottie'>('image')
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetData, setNewAssetData] = useState<string | null>(null)
  const [newAssetFileName, setNewAssetFileName] = useState('')
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewAssetFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setNewAssetData(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAdd = () => {
    const sanitizedName = newAssetName.trim().replace(/\s+/g, '_')
    if (!sanitizedName) return
    if (!newAssetData) return
    if (assets.some(a => a.name === sanitizedName)) {
      toast(`An asset named "${sanitizedName}" already exists`, 'error')
      return
    }

    onAddAsset({
      id: `asset_${Date.now()}`,
      name: sanitizedName,
      type: newAssetType,
      data: newAssetData,
      createdAt: Date.now(),
    })

    setNewAssetName('')
    setNewAssetData(null)
    setNewAssetFileName('')
    setShowAddForm(false)
  }

  const formatSize = (dataUrl: string) => {
    const bytes = Math.round((dataUrl.length * 3) / 4)
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size="sm" style={{ fontWeight: '600' }}>
          Assets{assets.length > 0 ? ` (${assets.length})` : ''}
        </Text>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: `2px ${theme.spacing.sm}`,
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: showAddForm ? theme.colors.border : theme.colors.primary,
            color: showAddForm ? theme.colors.text : '#fff',
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add Asset Form */}
      {showAddForm && (
        <div style={{
          border: `1px solid ${theme.colors.primaryMuted}`,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.background,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.sm,
        }}>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(Object.keys(ASSET_TYPE_CONFIG) as Array<'image' | 'video' | 'lottie'>).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setNewAssetType(type)
                  setNewAssetData(null)
                  setNewAssetFileName('')
                }}
                style={{
                  flex: 1,
                  padding: `4px ${theme.spacing.xs}`,
                  fontSize: '11px',
                  fontWeight: newAssetType === type ? '600' : '400',
                  backgroundColor: newAssetType === type ? theme.colors.primary : 'transparent',
                  color: newAssetType === type ? '#fff' : theme.colors.textMuted,
                  border: `1px solid ${newAssetType === type ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                }}
              >
                {ASSET_TYPE_CONFIG[type].icon} {ASSET_TYPE_CONFIG[type].label}
              </button>
            ))}
          </div>

          {/* Name input */}
          <input
            type="text"
            placeholder="Asset name (e.g. hero_image)"
            value={newAssetName}
            onChange={(e) => setNewAssetName(e.target.value)}
            style={{
              width: '100%',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              fontSize: '12px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* File upload */}
          <div>
            <label
              style={{
                display: 'block',
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: '12px',
                textAlign: 'center',
                border: `1px dashed ${theme.colors.border}`,
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                color: theme.colors.textMuted,
                backgroundColor: theme.colors.background,
              }}
            >
              {newAssetFileName || 'Choose file...'}
              <input
                type="file"
                accept={ASSET_TYPE_CONFIG[newAssetType].accept}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Preview for images */}
          {newAssetData && newAssetType === 'image' && (
            <img
              src={newAssetData}
              alt="Preview"
              style={{
                width: '100%',
                height: '60px',
                objectFit: 'cover',
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!newAssetName.trim() || !newAssetData}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: (!newAssetName.trim() || !newAssetData) ? theme.colors.border : theme.colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: (!newAssetName.trim() || !newAssetData) ? 'not-allowed' : 'pointer',
            }}
          >
            Add Asset
          </button>
        </div>
      )}

      {/* Asset List */}
      {assets.length === 0 && !showAddForm && (
        <div style={{ padding: theme.spacing.md, textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: theme.spacing.xs, opacity: 0.3 }}>📦</div>
          <Text variant="muted" size="xs">
            No assets yet. Add images, videos, or Lottie files to reference by name.
          </Text>
        </div>
      )}

      {assets.map((asset) => (
        <div
          key={asset.id}
          style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.background,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <span style={{ fontSize: '12px' }}>{ASSET_TYPE_CONFIG[asset.type].icon}</span>
              <code style={{
                fontSize: '12px',
                fontWeight: '600',
                color: theme.colors.text,
                backgroundColor: theme.colors.border + '60',
                padding: '1px 6px',
                borderRadius: '4px',
              }}>
                {asset.name}
              </code>
            </div>
            <button
              onClick={() => onRemoveAsset(asset.id)}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: 'transparent',
                color: theme.colors.textMuted,
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
              title="Remove asset"
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: asset.type === 'image' ? '4px' : '0' }}>
            {ASSET_TYPE_CONFIG[asset.type].label} &middot; {formatSize(asset.data)}
          </div>
          {asset.type === 'image' && (
            <div
              onClick={() => setViewingAsset(asset)}
              style={{
                position: 'relative',
                width: '100%',
                height: '48px',
                borderRadius: theme.borderRadius.sm,
                marginTop: '2px',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement
                if (overlay) overlay.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement
                if (overlay) overlay.style.opacity = '0'
              }}
            >
              <img
                src={asset.data}
                alt={asset.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                }}
              />
              <div
                className="hover-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  borderRadius: theme.borderRadius.sm,
                }}
              >
                <span style={{ color: '#fff', fontSize: '11px', fontWeight: '500' }}>
                  View Full Size
                </span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* View Asset Modal */}
      {viewingAsset && (
        <div
          onClick={() => setViewingAsset(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: theme.spacing.xl,
            cursor: 'pointer',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={viewingAsset.data}
              alt={viewingAsset.name}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: theme.borderRadius.md,
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{
              position: 'absolute',
              top: '-40px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <code style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '4px 12px',
                borderRadius: '4px',
              }}>
                {viewingAsset.name}
              </code>
              <button
                onClick={() => setViewingAsset(null)}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Image Slots Indicator (shown in right sidebar when AI Chat is active) ───

interface ImageSlot {
  elementId: string
  slotNumber: number
  description: string
  hasUrl: boolean
  url?: string
  elementType: 'image' | 'video' | 'lottie'
}

function collectImageSlots(elements: any[]): ImageSlot[] {
  const slots: ImageSlot[] = []
  const walk = (els: any[]) => {
    for (const el of els) {
      if ((el.type === 'image' || el.type === 'video' || el.type === 'lottie') && el.props?.slotNumber) {
        slots.push({
          elementId: el.id,
          slotNumber: el.props.slotNumber,
          description: el.props.imageDescription || el.props.videoDescription || el.props.animationDescription || 'No description',
          hasUrl: !!el.props.url,
          url: el.props.url,
          elementType: el.type,
        })
      }
      if (el.children) walk(el.children)
    }
  }
  walk(elements)
  return slots.sort((a, b) => a.slotNumber - b.slotNumber)
}

function ImageSlotsIndicator({ elements, assets, onSelectAsset }: {
  elements: any[],
  assets: Asset[],
  onSelectAsset: (elementId: string, assetName: string, assetType: 'image' | 'video' | 'lottie') => void
}) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const slots = collectImageSlots(elements)

  if (slots.length === 0) {
    return null
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️'
      case 'video': return '🎬'
      case 'lottie': return '✨'
      default: return '📄'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      <div style={{ marginBottom: theme.spacing.xs }}>
        <Text size="sm" style={{ fontWeight: '600' }}>Media Slots</Text>
      </div>
      {slots.map((slot) => (
        <div
          key={slot.elementId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xs,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: slot.hasUrl ? '#f0fdf4' : theme.colors.background,
            border: `1px solid ${slot.hasUrl ? '#bbf7d0' : theme.colors.border}`,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <span style={{ fontSize: '13px' }}>{slot.hasUrl ? '✅' : getAssetIcon(slot.elementType)}</span>
            <Text size="xs" style={{ color: slot.hasUrl ? '#166534' : theme.colors.textMuted, flex: 1 }}>
              {slot.hasUrl
                ? `Slot ${slot.slotNumber} (${slot.elementType})`
                : `Slot ${slot.slotNumber} needs ${slot.elementType}`}
            </Text>
          </div>

          {/* Asset selector button */}
          <button
            onClick={() => setOpenDropdownId(openDropdownId === slot.elementId ? null : slot.elementId)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: 'transparent',
              color: theme.colors.primary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border
            }}
          >
            {openDropdownId === slot.elementId ? 'Hide assets' : 'Select asset'}
          </button>

          {/* Dropdown list */}
          {openDropdownId === slot.elementId && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              padding: '4px',
            }}>
              {assets.length === 0 ? (
                <Text size="xs" style={{ padding: '8px', color: theme.colors.textMuted, textAlign: 'center' }}>
                  No assets uploaded
                </Text>
              ) : (
                assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      onSelectAsset(slot.elementId, asset.name, asset.type)
                      setOpenDropdownId(null)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      padding: '6px 8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: theme.borderRadius.sm,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontFamily: theme.fonts.sans,
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.background
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{getAssetIcon(asset.type)}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <Text size="xs" style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: theme.colors.text
                      }}>
                        {asset.name}
                      </Text>
                      <Text size="xs" style={{ color: theme.colors.textMuted }}>
                        {asset.type}
                      </Text>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Variables Panel (shown in right sidebar below image slots) ───

interface VariableInfo {
  name: string
  values: string[]      // possible values from set_variable actions
  setByScreens: number[] // screen indices that set this variable
  readByScreens: number[] // screen indices that read this variable
}

function collectFlowVariables(screens: Screen[]): VariableInfo[] {
  const varMap: Record<string, VariableInfo> = {}

  const ensureVar = (name: string) => {
    if (!varMap[name]) {
      varMap[name] = { name, values: [], setByScreens: [], readByScreens: [] }
    }
    return varMap[name]
  }

  // Walk element tree collecting set_variable actions and template reads
  const walkElements = (elements: any[], screenIndex: number) => {
    for (const el of elements) {
      // Check action and actions for set_variable
      const allActions = [
        ...(el.action ? [el.action] : []),
        ...(el.actions || []),
      ]
      for (const action of allActions) {
        if (action.type === 'set_variable' && action.variable) {
          const info = ensureVar(action.variable)
          if (!info.setByScreens.includes(screenIndex)) info.setByScreens.push(screenIndex)
          const valStr = String(action.value ?? '')
          if (valStr && !info.values.includes(valStr)) info.values.push(valStr)
        }
      }

      // Check text props for {variable_name} templates
      if (el.props?.text && typeof el.props.text === 'string') {
        const matches = el.props.text.match(/\{(\w+(?:\.\w+)*)\}/g)
        if (matches) {
          for (const match of matches) {
            const varName = match.slice(1, -1)
            const info = ensureVar(varName)
            if (!info.readByScreens.includes(screenIndex)) info.readByScreens.push(screenIndex)
          }
        }
      }

      // Check conditions for variable references
      const walkCondition = (cond: any) => {
        if (!cond) return
        if (cond.variable) {
          const info = ensureVar(cond.variable)
          if (!info.readByScreens.includes(screenIndex)) info.readByScreens.push(screenIndex)
        }
        if (cond.all) cond.all.forEach(walkCondition)
        if (cond.any) cond.any.forEach(walkCondition)
        if (cond.not) walkCondition(cond.not)
      }
      if (el.conditions?.show_if) walkCondition(el.conditions.show_if)

      // Check conditional destinations
      const walkDestination = (dest: any) => {
        if (!dest || typeof dest === 'string') return
        if (dest.if) walkCondition(dest.if)
        if (dest.else && typeof dest.else !== 'string') walkDestination(dest.else)
        if (dest.routes) {
          for (const route of dest.routes) {
            walkCondition(route.condition)
          }
        }
      }
      for (const action of allActions) {
        if (action.destination && typeof action.destination !== 'string') {
          walkDestination(action.destination)
        }
      }

      if (el.children) walkElements(el.children, screenIndex)
    }
  }

  screens.forEach((screen, idx) => {
    // Add custom screen variables
    if (screen.type === 'custom_screen' && screen.custom_variables) {
      screen.custom_variables.forEach(varName => {
        const info = ensureVar(varName)
        if (!info.setByScreens.includes(idx)) info.setByScreens.push(idx)
      })
    }

    if (screen.elements) walkElements(screen.elements, idx)
  })

  return Object.values(varMap).sort((a, b) => a.name.localeCompare(b.name))
}

function VariablesPanel({ screens, selectedScreen }: { screens: Screen[]; selectedScreen: number }) {
  const variables = collectFlowVariables(screens)

  if (variables.length === 0) {
    return (
      <div style={{ padding: theme.spacing.md, textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: theme.spacing.xs, opacity: 0.3 }}>{ }</div>
        <Text variant="muted" size="sm">No variables</Text>
        <Text variant="light" size="xs" style={{ marginTop: theme.spacing.xs }}>
          Variables will appear here when screens use set_variable actions.
        </Text>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      <div style={{ marginBottom: theme.spacing.xs }}>
        <Text size="sm" style={{ fontWeight: '600' }}>Variables ({variables.length})</Text>
      </div>
      {variables.map((v) => {
        const isSetByCurrentScreen = v.setByScreens.includes(selectedScreen)
        const isReadByCurrentScreen = v.readByScreens.includes(selectedScreen)

        return (
          <div
            key={v.name}
            style={{
              border: `1px solid ${(isSetByCurrentScreen || isReadByCurrentScreen) ? theme.colors.primary + '40' : theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.sm,
              backgroundColor: isSetByCurrentScreen ? '#fff7ed' : isReadByCurrentScreen ? '#eff6ff' : theme.colors.background,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginBottom: '2px' }}>
              <code style={{
                fontSize: '12px',
                fontWeight: '600',
                color: theme.colors.text,
                backgroundColor: theme.colors.border + '60',
                padding: '1px 6px',
                borderRadius: '4px',
              }}>
                {v.name}
              </code>
            </div>

            {v.values.length > 0 && (
              <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {v.values.map((val) => (
                  <span key={val} style={{
                    fontSize: '10px',
                    color: theme.colors.textMuted,
                    backgroundColor: theme.colors.border + '40',
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}>
                    {val}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: '4px', display: 'flex', gap: theme.spacing.sm, fontSize: '10px', color: theme.colors.textMuted }}>
              {v.setByScreens.length > 0 && (
                <span>
                  Set by: {v.setByScreens.map(i => {
                    const screen = screens[i]
                    const screenLabel = screen?.type === 'custom_screen' && screen.custom_component_name
                      ? `Screen ${i + 1} (${screen.custom_component_name})`
                      : `Screen ${i + 1}`
                    return screenLabel
                  }).join(', ')}
                </span>
              )}
              {v.readByScreens.length > 0 && (
                <span>Read by: {v.readByScreens.map(i => `Screen ${i + 1}`).join(', ')}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PropertiesPanel({ screen, screenIndex, selectedElement, onUpdate, onUpdateElement }: { screen: Screen; screenIndex: number; selectedElement: string | null; onUpdate: (prop: string, value: any) => void; onUpdateElement: (elementId: string, updates: any) => void }) {
  // Find the selected element in the tree
  const findElement = (elements: any[], id: string): any | null => {
    for (const el of elements) {
      if (el.id === id) return el
      if (el.children) {
        const found = findElement(el.children, id)
        if (found) return found
      }
    }
    return null
  }

  const element = selectedElement && screen.elements ? findElement(screen.elements, selectedElement) : null

  // If an element is selected, show element properties
  if (element) {
    return <ElementPropertiesEditor element={element} onUpdate={(updates) => onUpdateElement(element.id, updates)} />
  }

  // Otherwise show screen properties
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Screen Info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <span style={{ fontSize: theme.fontSizes['2xl'] }}>
            {SCREEN_TYPES.find((t) => t.type === screen.type)?.icon}
          </span>
          <div style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: theme.fontSizes.base }}>
              Screen {screenIndex + 1}
            </Text>
            <Text variant="light" size="xs" style={{ textTransform: 'capitalize' }}>
              {screen.type.replace('_', ' ')}
            </Text>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: theme.colors.border }} />

      {/* Padding & Elements Section */}
      {screen.type === 'noboard_screen' && (
        <>
          <PropertySection title="Padding">
            <PropertyField label="All Sides">
              <input
                type="number"
                value={typeof screen.layout?.padding === 'number' ? screen.layout.padding : 24}
                onChange={(e) => {
                  const newScreen = { ...screen }
                  if (!newScreen.layout) newScreen.layout = {}
                  newScreen.layout.padding = parseInt(e.target.value) || 0
                  onUpdate('_full_screen', newScreen)
                }}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
              />
            </PropertyField>
          </PropertySection>

          <PropertySection title="Elements">
            <div style={{ backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.md }}>
              <Text variant="muted" size="xs" style={{ marginBottom: theme.spacing.xs }}>
                Total: {screen.elements?.length || 0}
              </Text>
              <Text variant="light" size="xs">
                Edit in JSON below or use the tree view
              </Text>
            </div>
          </PropertySection>
        </>
      )}

      {/* Custom Screen Properties */}
      {screen.type === 'custom_screen' && (
        <>
          <PropertySection title="Custom Component">
            <PropertyField label="Component Name">
              <input
                type="text"
                value={screen.custom_component_name || ''}
                onChange={(e) => {
                  const newScreen = { ...screen, custom_component_name: e.target.value }
                  onUpdate('_full_screen', newScreen)
                }}
                placeholder="e.g., MealTrackerScreen"
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                }}
              />
            </PropertyField>
            <PropertyField label="Description">
              <textarea
                value={screen.custom_description || ''}
                onChange={(e) => {
                  const newScreen = { ...screen, custom_description: e.target.value }
                  onUpdate('_full_screen', newScreen)
                }}
                rows={3}
                placeholder="Describe what this component does..."
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontFamily: theme.fonts.sans,
                  fontSize: theme.fontSizes.sm,
                  resize: 'vertical',
                }}
              />
            </PropertyField>
            <PropertyField label="Variables Provided">
              <input
                type="text"
                value={(screen.custom_variables || []).join(', ')}
                onChange={(e) => {
                  // Parse comma-separated variable names
                  const variablesInput = e.target.value
                  const variablesList = variablesInput
                    .split(',')
                    .map(v => v.trim())
                    .filter(v => v.length > 0)
                  const newScreen = { ...screen, custom_variables: variablesList.length > 0 ? variablesList : undefined }
                  onUpdate('_full_screen', newScreen)
                }}
                placeholder="e.g., height_cm, weight_kg, heightUnit"
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontFamily: theme.fonts.mono,
                  fontSize: theme.fontSizes.sm,
                }}
              />
              <Text size="xs" style={{ color: theme.colors.textMuted, marginTop: theme.spacing.xs }}>
                Comma-separated list of variable names this component provides (e.g., height_cm, weight_kg)
              </Text>
            </PropertyField>
          </PropertySection>
          <div style={{
            backgroundColor: '#FFF3CD',
            border: '1px solid #FFC107',
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
          }}>
            <Text size="xs" style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>
              Developer Component
            </Text>
            <Text variant="muted" size="xs">
              This screen renders a React Native component registered in the SDK via the customComponents prop. It cannot be previewed in the dashboard.
            </Text>
          </div>
        </>
      )}

      {/* JSON Editor */}
      <div>
        <Text variant="light" size="xs" style={{ marginBottom: theme.spacing.sm }}>JSON Preview</Text>
        <pre
          style={{
            backgroundColor: theme.colors.background,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            overflow: 'auto',
            maxHeight: '300px',
            fontSize: theme.fontSizes.xs,
            fontFamily: theme.fonts.mono,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {JSON.stringify(screen.type === 'noboard_screen' ? { layout: screen.layout, elements: screen.elements } : screen.props, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function PropertySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Text style={{ fontSize: theme.fontSizes.xs, fontWeight: '600', color: theme.colors.textMuted, marginBottom: theme.spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {children}
      </div>
    </div>
  )
}

function PropertyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: theme.fontSizes.sm, fontWeight: '500', color: theme.colors.text, marginBottom: theme.spacing.sm }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// Attempts to repair truncated JSON from max_tokens cutoff
// Closes any unclosed strings, arrays, and objects to make it parseable
function repairTruncatedJSON(text: string): string {
  let repaired = text.trim()

  // Remove any trailing incomplete key-value pair (e.g., `"fontWeight": "400` or `"color":`)
  // Strip trailing incomplete string value
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '')
  // Strip trailing key with no value
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, '')
  // Strip trailing comma
  repaired = repaired.replace(/,\s*$/, '')

  // Count unclosed brackets/braces
  let openBraces = 0
  let openBrackets = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') openBraces++
    else if (ch === '}') openBraces--
    else if (ch === '[') openBrackets++
    else if (ch === ']') openBrackets--
  }

  // If we're inside a string, close it
  if (inString) {
    repaired += '"'
  }

  // Close arrays then objects (arrays are usually nested inside objects)
  while (openBrackets > 0) { repaired += ']'; openBrackets-- }
  while (openBraces > 0) { repaired += '}'; openBraces-- }

  return repaired
}

// Applies AI edit patches to an existing element tree
// Each change targets an element by ID and merges style/props or adds/removes elements
function applyPatches(elements: FlowElement[], changes: any[]): FlowElement[] {
  // Build a lookup of changes by ID for fast access
  const changeMap = new Map<string, any>()
  for (const change of changes) {
    if (change.id) changeMap.set(change.id, change)
  }

  // Recursive function to process the tree
  function processElement(el: FlowElement): FlowElement | null {
    const change = changeMap.get(el.id)

    // If this element is marked for removal, return null
    if (change?.remove) return null

    // Clone the element
    let updated: FlowElement = { ...el }

    // Apply style merge
    if (change?.style) {
      updated.style = { ...(updated.style || {}), ...change.style }
    }

    // Apply props merge
    if (change?.props) {
      updated.props = { ...(updated.props || {}), ...change.props }
    }

    // Replace action(s) if provided
    if (change?.action !== undefined) {
      updated.action = change.action
    }
    if (change?.actions !== undefined) {
      updated.actions = change.actions
    }

    // Replace visibility rules if provided
    if (change?.visibleWhen !== undefined) {
      updated.visibleWhen = change.visibleWhen
    }
    if (change?.conditions !== undefined) {
      updated.conditions = change.conditions
    }

    // Replace animation configs if provided
    if (change?.entrance !== undefined) {
      updated.entrance = change.entrance
    }
    if (change?.textAnimation !== undefined) {
      updated.textAnimation = change.textAnimation
    }
    if (change?.interactive !== undefined) {
      updated.interactive = change.interactive
    }

    // Process children
    if (change?.children) {
      // Full children replacement
      updated.children = change.children
    } else if (updated.children) {
      // Recursively process existing children
      let newChildren: FlowElement[] = []
      for (const child of updated.children) {
        const processed = processElement(child)
        if (processed) {
          newChildren.push(processed)

          // Check if there's an insertChild targeting "after:this_child_id"
          for (const [, c] of changeMap) {
            if (c.insertChild && c.id === el.id && c.position === `after:${child.id}`) {
              newChildren.push(c.insertChild)
            }
          }
        }
      }

      // Handle insertChild with position "first" or "before:id"
      for (const [, c] of changeMap) {
        if (c.insertChild && c.id === el.id) {
          if (c.position === 'first') {
            newChildren = [c.insertChild, ...newChildren]
          } else if (c.position === 'last' || !c.position) {
            // Default: append at end (only if not already inserted via after:)
            if (!c.position || c.position === 'last') {
              const alreadyInserted = newChildren.some((ch: FlowElement) => ch.id === c.insertChild.id)
              if (!alreadyInserted) {
                newChildren.push(c.insertChild)
              }
            }
          } else if (c.position?.startsWith('before:')) {
            const beforeId = c.position.replace('before:', '')
            const idx = newChildren.findIndex((ch: FlowElement) => ch.id === beforeId)
            if (idx !== -1) {
              newChildren.splice(idx, 0, c.insertChild)
            } else {
              newChildren.push(c.insertChild)
            }
          }
        }
      }

      updated.children = newChildren
    }

    return updated
  }

  // Process root-level elements
  return elements.map(el => processElement(el)).filter((el): el is FlowElement => el !== null)
}

function AIChatBuilder({
  selectedScreen,
  screens,
  assets,
  messages,
  onMessagesChange,
  onScreenUpdate,
  onGeneratingChange,
  flowId,
  onCreditsUpdate
}: {
  selectedScreen: number | null
  screens: Screen[]
  assets: Asset[]
  messages: ChatMessage[]
  onMessagesChange: (messages: ChatMessage[]) => void
  onScreenUpdate: (screen: Screen) => void
  onGeneratingChange?: (generating: boolean) => void
  flowId: string | null
  onCreditsUpdate?: () => void
}) {
  const [inputText, setInputText] = useState('')
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingType, setStreamingType] = useState<'message' | 'generation' | 'edit' | null>(null)
  const [showStreamingJSON, setShowStreamingJSON] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset local input state when screen changes
  useEffect(() => {
    setInputText('')
    setPendingImages([])
  }, [selectedScreen])

  const compressImage = (file: File, maxDim = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round(height * (maxDim / width))
            width = maxDim
          } else {
            width = Math.round(width * (maxDim / height))
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const addImageFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(async (file) => {
      if (!file.type.startsWith('image/')) return
      const compressed = await compressImage(file)
      setPendingImages(prev => [...prev, compressed])
    })
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) imageFiles.push(file)
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault()
      addImageFiles(imageFiles)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      addImageFiles(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isGenerating])

  // Collect a map of element ID → base64 URL from the tree
  const collectBase64Urls = (elements: FlowElement[], map: Record<string, string> = {}): Record<string, string> => {
    for (const el of elements) {
      if (el.props?.url && typeof el.props.url === 'string' && el.props.url.startsWith('data:')) {
        map[el.id] = el.props.url
      }
      if (el.children) collectBase64Urls(el.children, map)
    }
    return map
  }

  // Strip base64 data URLs from elements before sending to the API
  const stripBase64FromElements = (elements: FlowElement[]): FlowElement[] => {
    return elements.map(el => {
      const cleaned = { ...el }
      if (cleaned.props) {
        cleaned.props = { ...cleaned.props }
        if (typeof cleaned.props.url === 'string' && cleaned.props.url.startsWith('data:')) {
          cleaned.props.url = '[uploaded-image]'
        }
      }
      if (cleaned.children) {
        cleaned.children = stripBase64FromElements(cleaned.children)
      }
      return cleaned
    })
  }

  // Restore base64 URLs into the AI's returned elements using the saved map
  const restoreBase64Urls = (elements: FlowElement[], map: Record<string, string>): FlowElement[] => {
    return elements.map(el => {
      const restored = { ...el }
      if (restored.props) {
        restored.props = { ...restored.props }
        if (map[restored.id] && (!restored.props.url || restored.props.url === '[uploaded-image]')) {
          restored.props.url = map[restored.id]
        }
      }
      if (restored.children) {
        restored.children = restoreBase64Urls(restored.children, map)
      }
      return restored
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    addImageFiles(files)
    if (e.target) e.target.value = ''
  }

  const handleSend = async () => {
    if (!inputText.trim() && pendingImages.length === 0) return
    if (selectedScreen === null) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim() || (pendingImages.length > 0 ? 'Recreate this screen' : ''),
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
      timestamp: Date.now(),
    }

    const updatedMessages = [...messages, userMessage]
    onMessagesChange(updatedMessages)
    setInputText('')
    setPendingImages([])
    setIsGenerating(true)
    onGeneratingChange?.(true)

    try {
      const currentScreen = screens[selectedScreen]
      // Save base64 URLs before stripping so we can restore them after
      const imageUrlMap = currentScreen?.elements ? collectBase64Urls(currentScreen.elements) : {}

      // Include all screens so AI can reference them by ID
      const allScreensForContext = screens.map((s, idx) => ({
        id: s.id,
        type: s.type,
        elements: s.elements ? stripBase64FromElements(s.elements) : null,
      }))

      // Collect available variables from all screens (for AI context)
      const flowVariables = collectFlowVariables(screens)

      // Get auth token for API request
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      if (!authToken) {
        throw new Error('Please sign in to use AI generation')
      }

      const response = await fetch('/api/generate-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          images: userMessage.images || null,
          referenceImage: currentScreen?.referenceImageData || null,
          currentElements: currentScreen?.elements ? stripBase64FromElements(currentScreen.elements) : null,
          allScreens: allScreensForContext,
          assets: assets.map(a => ({ name: a.name, type: a.type })),
          variables: flowVariables.map(v => ({
            name: v.name,
            setByScreens: v.setByScreens,
            values: v.values,
          })),
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            // Don't send elements in history to save tokens
          })),
          flowId: flowId,
          screenId: currentScreen?.id || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Handle insufficient credits error
        if (response.status === 402 || errorData.error === 'Insufficient credits') {
          const creditsNeeded = errorData.credits_needed || 0.1
          const creditsAvailable = errorData.credits_available || 0
          throw new Error(
            `Insufficient credits. You need ${creditsNeeded.toFixed(2)} credits but only have ${creditsAvailable.toFixed(2)}. Please purchase more credits to continue.`
          )
        }

        throw new Error(errorData.error || 'Failed to generate screen')
      }

      // Read the streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let fullText = ''
      let detectedType: 'message' | 'generation' | 'edit' | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setStreamingText(fullText)

        // Detect response type early from the first ~50 chars
        if (!detectedType && fullText.length > 15) {
          if (fullText.includes('"type":"message"') || fullText.includes('"type": "message"')) {
            detectedType = 'message'
            setStreamingType('message')
          } else if (fullText.includes('"type":"edit"') || fullText.includes('"type": "edit"')) {
            detectedType = 'edit'
            setStreamingType('edit')
          } else if (fullText.includes('"type":"generation"') || fullText.includes('"type": "generation"')) {
            detectedType = 'generation'
            setStreamingType('generation')
          }
        }
      }
      // Flush the decoder
      fullText += decoder.decode()

      // For edit type, show "Applying changes..." during the merge phase
      if (detectedType === 'edit') {
        setStreamingText('')
        setStreamingType('edit')
      } else {
        setStreamingText('')
        setStreamingType(null)
      }

      // Extract stop_reason metadata from end of stream
      let wasTruncated = false
      const stopMatch = fullText.match(/\n__STOP:(\w+)__$/)
      if (stopMatch) {
        wasTruncated = stopMatch[1] === 'max_tokens'
        fullText = fullText.replace(/\n__STOP:\w+__$/, '')
      }

      // Strip markdown code fences if present (AI sometimes wraps JSON in ```json ... ```)
      let jsonText = fullText.trim()
      if (jsonText.startsWith('```')) {
        // Remove opening fence (```json or ```)
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '')
        // Remove closing fence
        jsonText = jsonText.replace(/\n?```\s*$/, '')
      }

      // Try to extract JSON if there's extra text
      // Look for the first { and last } to extract just the JSON object
      const firstBrace = jsonText.indexOf('{')
      const lastBrace = jsonText.lastIndexOf('}')

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1)
      }

      // Parse the accumulated JSON
      let data
      try {
        data = JSON.parse(jsonText)
      } catch (parseError) {
        // If truncated (max_tokens hit), attempt to repair the JSON
        if (wasTruncated) {
          console.warn('Response was truncated (max_tokens). Attempting JSON repair...')
          try {
            data = JSON.parse(repairTruncatedJSON(jsonText))
            console.log('JSON repair successful')
          } catch (repairError) {
            console.error('JSON repair also failed:', repairError)
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: 'The screen is too complex for a single AI response (output was truncated). Try making smaller, targeted changes instead of regenerating the whole screen.',
              timestamp: Date.now(),
            }
            onMessagesChange([...updatedMessages, assistantMessage])
            setIsGenerating(false)
            return
          }
        } else {
          console.error('Failed to parse AI response:', fullText)

          // Show the AI's plain text response as a message instead of crashing
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `Error: AI returned plain text instead of JSON. Please try rephrasing your request.\n\nAI said: "${fullText.substring(0, 200)}${fullText.length > 200 ? '...' : ''}"`,
            timestamp: Date.now(),
          }
          onMessagesChange([...updatedMessages, assistantMessage])
          setIsGenerating(false)
          return
        }
      }

      // Check if this is a conversational message, patch edit, or full generation
      if (data.type === 'message') {
        // AI is responding conversationally, not generating a screen
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: Date.now(),
        }
        onMessagesChange([...updatedMessages, assistantMessage])
      } else if (data.type === 'edit') {
        // AI returned patches — apply them to the existing element tree
        const existingElements = currentScreen?.elements || []
        const patchedElements = applyPatches(existingElements, data.changes || [])

        // Restore base64 image URLs
        const restoredElements = Object.keys(imageUrlMap).length > 0
          ? restoreBase64Urls(patchedElements, imageUrlMap)
          : patchedElements

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message || 'Screen updated.',
          elements: restoredElements,
          timestamp: Date.now(),
        }

        onMessagesChange([...updatedMessages, assistantMessage])

        // Update the screen preview
        onScreenUpdate({
          ...currentScreen,
          type: 'noboard_screen' as const,
          elements: restoredElements,
          aiGenerated: true,
        })

        // Refresh credits after successful generation
        onCreditsUpdate?.()
      } else if (data.type === 'generation') {
        // AI generated a full screen (new screen or complete redesign)
        // Restore original base64 image URLs into the AI's returned elements
        const restoredElements = Object.keys(imageUrlMap).length > 0
          ? restoreBase64Urls(data.elements, imageUrlMap)
          : data.elements

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message || 'Screen updated.',
          elements: restoredElements,
          timestamp: Date.now(),
        }

        onMessagesChange([...updatedMessages, assistantMessage])

        // Update the screen preview
        onScreenUpdate({
          ...currentScreen,
          type: 'noboard_screen' as const,
          elements: restoredElements,
          aiGenerated: true,
        })

        // Refresh credits after successful generation
        onCreditsUpdate?.()
      } else {
        // Fallback for old format (backwards compatibility)
        const restoredElements = Object.keys(imageUrlMap).length > 0
          ? restoreBase64Urls(data.elements, imageUrlMap)
          : data.elements

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message || 'Screen updated.',
          elements: restoredElements,
          timestamp: Date.now(),
        }

        onMessagesChange([...updatedMessages, assistantMessage])

        // Update the screen preview if elements exist
        if (data.elements) {
          onScreenUpdate({
            ...currentScreen,
            type: 'noboard_screen' as const,
            elements: restoredElements,
            aiGenerated: true,
          })
        }

        // Refresh credits after successful generation
        onCreditsUpdate?.()
      }
    } catch (error: any) {
      console.error('Generation error:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: Date.now(),
      }
      onMessagesChange([...updatedMessages, errorMessage])
    } finally {
      setIsGenerating(false)
      setStreamingType(null)
      onGeneratingChange?.(false)
    }
  }

  if (selectedScreen === null) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textMuted }}>
        <Text variant="muted" size="sm">Select a screen to use AI Chat</Text>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <style>{`@keyframes blink { 50% { opacity: 0; } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: theme.spacing.sm,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.sm,
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textMuted }}>
            <div style={{ fontSize: '28px', marginBottom: theme.spacing.sm }}>AI</div>
            <Text variant="muted" size="sm">
              Describe the screen you want to build, or upload a screenshot to recreate it.
            </Text>
            <Text variant="muted" size="xs" style={{ marginTop: theme.spacing.xs }}>
              You can iterate — ask for changes after each generation.
            </Text>
          </div>
        )}
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isGenerating && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              fontSize: theme.fontSizes.sm,
              fontFamily: theme.fonts.sans,
              lineHeight: '1.5',
              wordBreak: 'break-word' as const,
            }}>
              {/* Neutral thinking state or message-type streaming (no generation UI) */}
              {(!streamingType || streamingType === 'message') && (
                <div>
                  {streamingText ? extractStreamingPreview(streamingText) : 'Thinking...'}
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 14,
                    backgroundColor: theme.colors.textMuted,
                    marginLeft: 2,
                    verticalAlign: 'text-bottom',
                    animation: 'blink 1s steps(2) infinite',
                  }} />
                </div>
              )}

              {/* Edit-type streaming: show JSON stream with toggle, then "Applying changes..." on merge */}
              {streamingType === 'edit' && (
                <>
                  <div>
                    {streamingText
                      ? (extractStreamingPreview(streamingText) || 'Reading changes...')
                      : 'Applying changes...'
                    }
                    <span style={{
                      display: 'inline-block',
                      width: 6,
                      height: 14,
                      backgroundColor: theme.colors.textMuted,
                      marginLeft: 2,
                      verticalAlign: 'text-bottom',
                      animation: 'blink 1s steps(2) infinite',
                    }} />
                  </div>

                  {/* JSON viewer (only while streaming) */}
                  {streamingText && showStreamingJSON && (
                    <StreamingJSONViewer jsonText={streamingText} />
                  )}

                  {/* Toggle button (only while streaming) */}
                  {streamingText && (
                    <button
                      onClick={() => setShowStreamingJSON(!showStreamingJSON)}
                      style={{
                        marginTop: theme.spacing.sm,
                        padding: '6px 10px',
                        fontSize: '11px',
                        backgroundColor: 'transparent',
                        color: theme.colors.textMuted,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        cursor: 'pointer',
                        fontFamily: theme.fonts.sans,
                        transition: 'all 0.2s',
                        display: 'block',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.primary
                        e.currentTarget.style.color = theme.colors.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.border
                        e.currentTarget.style.color = theme.colors.textMuted
                      }}
                    >
                      {showStreamingJSON ? 'hide { }' : 'show { }'}
                    </button>
                  )}
                </>
              )}

              {/* Generation-type streaming: show building UI with JSON toggle */}
              {streamingType === 'generation' && (
                <>
                  <div>
                    {extractStreamingPreview(streamingText) || 'Building screen...'}
                    <span style={{
                      display: 'inline-block',
                      width: 6,
                      height: 14,
                      backgroundColor: theme.colors.textMuted,
                      marginLeft: 2,
                      verticalAlign: 'text-bottom',
                      animation: 'blink 1s steps(2) infinite',
                    }} />
                  </div>

                  {/* JSON viewer */}
                  {showStreamingJSON && (
                    <StreamingJSONViewer jsonText={streamingText} />
                  )}

                  {/* Toggle button at bottom */}
                  <button
                    onClick={() => setShowStreamingJSON(!showStreamingJSON)}
                    style={{
                      marginTop: theme.spacing.sm,
                      padding: '6px 10px',
                      fontSize: '11px',
                      backgroundColor: 'transparent',
                      color: theme.colors.textMuted,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      cursor: 'pointer',
                      fontFamily: theme.fonts.sans,
                      transition: 'all 0.2s',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary
                      e.currentTarget.style.color = theme.colors.primary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.border
                      e.currentTarget.style.color = theme.colors.textMuted
                    }}
                  >
                    {showStreamingJSON ? 'hide { }' : 'show { }'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pending image previews */}
      {pendingImages.length > 0 && (
        <div style={{
          display: 'flex',
          gap: theme.spacing.xs,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          borderTop: `1px solid ${theme.colors.border}`,
          flexWrap: 'wrap',
        }}>
          {pendingImages.map((img, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <img src={img} alt="" style={{
                width: 48, height: 48, objectFit: 'cover',
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`,
              }} />
              <button
                onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: '#ff4444', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >x</button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: theme.spacing.xs,
          padding: theme.spacing.sm,
          borderTop: `1px solid ${isDraggingOver ? theme.colors.primary : theme.colors.border}`,
          backgroundColor: isDraggingOver ? theme.colors.primaryTint : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        {/* Image attach button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 36, height: 36, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: theme.borderRadius.sm,
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            cursor: 'pointer', flexShrink: 0,
            fontSize: '16px', color: theme.colors.textMuted,
          }}
          title="Attach image"
        >+</button>

        {/* Text input */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={messages.length === 0 ? 'Describe a screen or paste/drop an image...' : 'Ask for changes...'}
          rows={3}
          style={{
            flex: 1,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.background,
            border: `1px solid ${isDraggingOver ? theme.colors.primary : theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.text,
            fontSize: theme.fontSizes.sm,
            fontFamily: theme.fonts.sans,
            resize: 'none',
            outline: 'none',
            maxHeight: '120px',
            overflowY: 'auto',
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isGenerating || (!inputText.trim() && pendingImages.length === 0)}
          style={{
            width: 36, height: 36, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: theme.borderRadius.sm,
            backgroundColor: (isGenerating || (!inputText.trim() && pendingImages.length === 0))
              ? theme.colors.border
              : theme.colors.primary,
            color: '#ffffff', border: 'none',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            flexShrink: 0, fontSize: '16px',
          }}
          title="Send"
        >{'\u2191'}</button>
      </div>
    </div>
  )
}

function StreamingJSONViewer({ jsonText }: { jsonText: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when JSON updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [jsonText])

  return (
    <div style={{ position: 'relative', marginTop: theme.spacing.sm }}>
      {/* Fade gradient overlay at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '24px',
        background: 'linear-gradient(to bottom, rgba(26, 26, 26, 0.95), transparent)',
        pointerEvents: 'none',
        zIndex: 1,
        borderTopLeftRadius: theme.borderRadius.md,
        borderTopRightRadius: theme.borderRadius.md,
      }} />

      {/* Scrollable JSON container */}
      <div
        ref={containerRef}
        style={{
          maxHeight: '180px',
          overflowY: 'auto',
          backgroundColor: '#1a1a1a',
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.sm,
          fontFamily: theme.fonts.mono,
          fontSize: '11px',
          lineHeight: '1.4',
          color: '#a0a0a0',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {jsonText}
        </pre>
      </div>
    </div>
  )
}

function extractStreamingPreview(text: string): string {
  // Try to extract the "message" field value from partial JSON
  const messageMatch = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/)
  if (messageMatch) {
    return messageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }

  // Try to extract "content" field (for type: "message" responses)
  const contentMatch = text.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)/)
  if (contentMatch) {
    return contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }

  return 'Thinking...'
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isError = !isUser && message.content.startsWith('Error:')

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%',
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: isUser
          ? theme.colors.primary
          : isError
            ? '#fef2f2'
            : theme.colors.background,
        color: isUser
          ? '#ffffff'
          : isError
            ? '#dc2626'
            : theme.colors.text,
        fontSize: theme.fontSizes.sm,
        fontFamily: theme.fonts.sans,
        lineHeight: '1.5',
        wordBreak: 'break-word' as const,
      }}>
        <div>{message.content}</div>

        {/* Image thumbnails for user messages */}
        {message.images && message.images.length > 0 && (
          <div style={{
            display: 'flex', gap: theme.spacing.xs,
            marginTop: theme.spacing.xs, flexWrap: 'wrap',
          }}>
            {message.images.map((img, i) => (
              <img key={i} src={img} alt="" style={{
                width: 48, height: 48, objectFit: 'cover',
                borderRadius: theme.borderRadius.sm,
                border: '1px solid rgba(255,255,255,0.3)',
              }} />
            ))}
          </div>
        )}

        {/* Screen updated indicator */}
        {message.elements && message.elements.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: theme.spacing.xs,
            marginTop: theme.spacing.xs,
            padding: `4px ${theme.spacing.xs}`,
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textMuted,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: '#22c55e', display: 'inline-block',
            }} />
            Screen updated
          </div>
        )}
      </div>
    </div>
  )
}

function ElementTree({
  screen,
  selectedElement,
  onSelectElement,
  onAddElement,
  hiddenElements,
  lockedElements,
  onToggleHide,
  onToggleLock,
  onDeleteElement,
  onReorderElement
}: {
  screen: Screen;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onAddElement: (elementId: string | null, parentId: string | null) => void;
  hiddenElements: Set<string>;
  lockedElements: Set<string>;
  onToggleHide: (elementId: string) => void;
  onToggleLock: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onReorderElement: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
}) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  const [hoveredScreen, setHoveredScreen] = useState(false)
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string | null; position: 'before' | 'after' | 'inside' } | null>(null)

  const isStackElement = (type: string) => {
    return ['vstack', 'hstack', 'zstack', 'scrollview', 'grid', 'carousel'].includes(type)
  }

  const findParentId = (elementId: string, elements: any[], parentId: string | null = null): string | null => {
    for (const el of elements) {
      if (el.id === elementId) return parentId
      if (el.children) {
        const found = findParentId(elementId, el.children, el.id)
        if (found !== undefined) return found
      }
    }
    return null
  }

  const getElementIcon = (type: string) => {
    const icons: Record<string, string> = {
      vstack: '⬇️',
      hstack: '➡️',
      zstack: '📐',
      scrollview: '📜',
      grid: '⊞',
      carousel: '🎠',
      text: '📝',
      heading: '🔤',
      button: '⚫',
      image: '🖼️',
      input: '✏️',
      checkbox: '☑️',
      radio: '🔘',
      dropdown: '📋',
      toggle: '🔄',
      slider: '🎚️',
      spacer: '⬜',
      divider: '➖',
    }
    return icons[type] || '📄'
  }

  const renderElement = (element: any, depth = 0, parentId: string | null = null) => {
    const isSelected = selectedElement === element.id
    const isHovered = hoveredElement === element.id
    const hasChildren = element.children && element.children.length > 0
    const isHidden = hiddenElements.has(element.id)
    const isLocked = lockedElements.has(element.id)
    const isDragging = draggedElement === element.id
    const isDropBefore = dropTarget?.id === element.id && dropTarget?.position === 'before'
    const isDropAfter = dropTarget?.id === element.id && dropTarget?.position === 'after'
    const isDropInside = dropTarget?.id === element.id && dropTarget?.position === 'inside'

    return (
      <div key={element.id}>
        {/* Drop indicator - before */}
        {isDropBefore && (
          <div style={{
            height: '2px',
            backgroundColor: theme.colors.primary,
            marginLeft: `${depth * 20 + 8}px`,
            marginBottom: '2px',
          }} />
        )}

        <div
          draggable={!isLocked}
          onDragStart={(e) => {
            if (isLocked) return
            setDraggedElement(element.id)
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragEnd={() => {
            setDraggedElement(null)
            setDropTarget(null)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (draggedElement === element.id) return

            const rect = e.currentTarget.getBoundingClientRect()
            const y = e.clientY - rect.top
            const height = rect.height

            if (isStackElement(element.type) && y > height * 0.3 && y < height * 0.7) {
              setDropTarget({ id: element.id, position: 'inside' })
            } else if (y < height / 2) {
              setDropTarget({ id: element.id, position: 'before' })
            } else {
              setDropTarget({ id: element.id, position: 'after' })
            }
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (draggedElement && dropTarget) {
              onReorderElement(draggedElement, dropTarget.id, dropTarget.position)
            }
            setDraggedElement(null)
            setDropTarget(null)
          }}
          onMouseEnter={() => setHoveredElement(element.id)}
          onMouseLeave={() => setHoveredElement(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            padding: `6px ${theme.spacing.sm}`,
            paddingLeft: `${depth * 20 + 8}px`,
            cursor: isLocked ? 'not-allowed' : 'grab',
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.fontSizes.sm,
            backgroundColor: isDropInside
              ? '#e0f2fe'
              : isSelected
                ? theme.colors.primary
                : isHovered
                  ? theme.colors.background
                  : 'transparent',
            color: isSelected ? '#fff' : theme.colors.text,
            opacity: isDragging ? 0.5 : isHidden ? 0.5 : 1,
            transition: 'all 0.2s',
            marginBottom: '2px',
            position: 'relative',
            border: isDropInside ? `2px dashed ${theme.colors.primary}` : 'none',
          }}
        >
          <div
            onClick={() => onSelectElement(element.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              flex: 1,
            }}
          >
            {hasChildren && (
              <span style={{ fontSize: '10px', marginRight: '4px' }}>▼</span>
            )}
            <span style={{ fontSize: theme.fontSizes.base }}>{getElementIcon(element.type)}</span>
            <span style={{ fontSize: theme.fontSizes.sm, textTransform: 'capitalize', flex: 1 }}>
              {element.type.replace('_', ' ')}
              {isLocked && ' 🔒'}
            </span>
          </div>
          {isHovered && (
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleHide(element.id)
                }}
                title={isHidden ? 'Show' : 'Hide'}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: isHidden ? '#666' : theme.colors.background,
                  color: isHidden ? '#fff' : theme.colors.text,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isHidden ? '👁️' : '👁️'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLock(element.id)
                }}
                title={isLocked ? 'Unlock' : 'Lock'}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: isLocked ? '#666' : theme.colors.background,
                  color: isLocked ? '#fff' : theme.colors.text,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isLocked ? '🔒' : '🔓'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete ${element.type}?`)) {
                    onDeleteElement(element.id)
                  }
                }}
                title="Delete"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#ff4444',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                🗑️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Smart add: if element is a stack, add as child; otherwise add to parent
                  if (isStackElement(element.type)) {
                    onAddElement(element.id, element.id)
                  } else {
                    onAddElement(element.id, parentId)
                  }
                }}
                title={isStackElement(element.type) ? "Add child" : "Add to parent"}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Drop indicator - after */}
        {isDropAfter && (
          <div style={{
            height: '2px',
            backgroundColor: theme.colors.primary,
            marginLeft: `${depth * 20 + 8}px`,
            marginTop: '2px',
            marginBottom: '2px',
          }} />
        )}

        {hasChildren && element.children.map((child: any) => renderElement(child, depth + 1, element.id))}
      </div>
    )
  }

  if (screen.type === 'noboard_screen' && screen.elements) {
    return (
      <div>
        <div
          onMouseEnter={() => setHoveredScreen(true)}
          onMouseLeave={() => setHoveredScreen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            padding: `6px ${theme.spacing.sm}`,
            marginBottom: theme.spacing.sm,
            fontSize: theme.fontSizes.sm,
            fontWeight: '500',
            cursor: 'pointer',
            borderRadius: theme.borderRadius.sm,
            backgroundColor: selectedElement === null ? theme.colors.primary : hoveredScreen ? theme.colors.background : 'transparent',
            color: selectedElement === null ? '#fff' : theme.colors.text,
            position: 'relative',
          }}
        >
          <div
            onClick={() => onSelectElement(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              flex: 1,
            }}
          >
            <span>📱</span>
            <span>Screen</span>
          </div>
          {hoveredScreen && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddElement(null, null)
              }}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              +
            </button>
          )}
        </div>
        {screen.elements.map((element) => renderElement(element, 0, null))}
      </div>
    )
  }

  // For template screens, show a simple view
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          fontSize: theme.fontSizes.sm,
        }}
      >
        <span style={{ fontSize: theme.fontSizes.lg }}>
          {SCREEN_TYPES.find((t) => t.type === screen.type)?.icon}
        </span>
        <span style={{ fontSize: theme.fontSizes.sm, fontWeight: '600' }}>
          {SCREEN_TYPES.find((t) => t.type === screen.type)?.name}
        </span>
      </div>
      <Text variant="light" size="xs" style={{ marginTop: theme.spacing.md, marginLeft: theme.spacing.sm }}>
        Template screen - use JSON editor to customize
      </Text>
    </div>
  )
}

function PropertiesEditor({ screen, onUpdate }: { screen: Screen; onUpdate: (prop: string, value: any) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div>
        <label style={{ display: 'block', fontSize: theme.fontSizes.sm, fontWeight: '500', color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Screen ID
        </label>
        <input
          type="text"
          value={screen.id}
          onChange={(e) => onUpdate('id', e.target.value)}
          style={{
            width: '100%',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            fontFamily: theme.fonts.sans,
          }}
        />
      </div>

      {/* Note: noboard_screen is now handled in PropertiesPanel */}
    </div>
  )
}

function ElementPicker({ onSelect, onClose }: { onSelect: (type: string) => void; onClose: () => void }) {
  const displayElements = [
    { type: 'text', name: 'Text', icon: '📝', description: 'Paragraph text' },
    { type: 'heading', name: 'Heading', icon: '🔤', description: 'Large heading' },
    { type: 'image', name: 'Image', icon: '🖼️', description: 'Image element' },
    { type: 'spacer', name: 'Spacer', icon: '⬜', description: 'Empty space' },
    { type: 'divider', name: 'Divider', icon: '➖', description: 'Horizontal line' },
  ]

  const inputElements = [
    { type: 'input', name: 'Text Input', icon: '✏️', description: 'Text field' },
    { type: 'button', name: 'Button', icon: '⚫', description: 'Action button' },
    { type: 'checkbox', name: 'Checkbox', icon: '☑️', description: 'Single checkbox' },
    { type: 'radio', name: 'Radio', icon: '🔘', description: 'Multiple choice' },
    { type: 'dropdown', name: 'Dropdown', icon: '📋', description: 'Select menu' },
    { type: 'toggle', name: 'Toggle', icon: '🔄', description: 'On/off switch' },
    { type: 'slider', name: 'Slider', icon: '🎚️', description: 'Range slider' },
  ]

  const layoutElements = [
    { type: 'vstack', name: 'VStack', icon: '⬇️', description: 'Vertical stack' },
    { type: 'hstack', name: 'HStack', icon: '➡️', description: 'Horizontal stack' },
    { type: 'zstack', name: 'ZStack', icon: '📐', description: 'Layered stack' },
    { type: 'scrollview', name: 'ScrollView', icon: '📜', description: 'Scrollable container' },
    { type: 'grid', name: 'Grid', icon: '⊞', description: 'Multi-column grid' },
    { type: 'carousel', name: 'Carousel', icon: '🎠', description: 'Swipeable slides' },
  ]

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
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: theme.spacing.xl,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <h2 style={{ fontSize: theme.fontSizes['2xl'], fontWeight: '600', color: '#ffffff', margin: 0 }}>
            Elements
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#999',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search for elements"
          style={{
            width: '100%',
            padding: theme.spacing.md,
            backgroundColor: '#2a2a2a',
            border: 'none',
            borderRadius: theme.borderRadius.md,
            color: '#ffffff',
            fontSize: theme.fontSizes.base,
            marginBottom: theme.spacing.xl,
            outline: 'none',
          }}
        />

        {/* Display Elements */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h3 style={{ fontSize: theme.fontSizes.sm, color: '#999', marginBottom: theme.spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Display
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: theme.spacing.md,
            }}
          >
            {displayElements.map((element) => (
              <button
                key={element.type}
                onClick={() => onSelect(element.type)}
                style={{
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #3a3a3a',
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a'
                  e.currentTarget.style.borderColor = theme.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a'
                  e.currentTarget.style.borderColor = '#3a3a3a'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#3a3a3a',
                    borderRadius: theme.borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                  }}
                >
                  {element.icon}
                </div>
                <span style={{ fontSize: theme.fontSizes.sm, fontWeight: '500', color: '#ffffff' }}>
                  {element.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Elements */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h3 style={{ fontSize: theme.fontSizes.sm, color: '#999', marginBottom: theme.spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Input
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: theme.spacing.md,
            }}
          >
            {inputElements.map((element) => (
              <button
                key={element.type}
                onClick={() => onSelect(element.type)}
                style={{
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #3a3a3a',
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a'
                  e.currentTarget.style.borderColor = theme.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a'
                  e.currentTarget.style.borderColor = '#3a3a3a'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#3a3a3a',
                    borderRadius: theme.borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                  }}
                >
                  {element.icon}
                </div>
                <span style={{ fontSize: theme.fontSizes.sm, fontWeight: '500', color: '#ffffff' }}>
                  {element.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout Elements */}
        <div>
          <h3 style={{ fontSize: theme.fontSizes.sm, color: '#999', marginBottom: theme.spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Layout
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: theme.spacing.md,
            }}
          >
            {layoutElements.map((element) => (
              <button
                key={element.type}
                onClick={() => onSelect(element.type)}
                style={{
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #3a3a3a',
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a'
                  e.currentTarget.style.borderColor = theme.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a'
                  e.currentTarget.style.borderColor = '#3a3a3a'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#3a3a3a',
                    borderRadius: theme.borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                  }}
                >
                  {element.icon}
                </div>
                <span style={{ fontSize: theme.fontSizes.sm, fontWeight: '500', color: '#ffffff' }}>
                  {element.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getDefaultElementProps(elementType: string): any {
  const timestamp = Date.now()

  switch (elementType) {
    case 'vstack':
      return {
        id: `vstack_${timestamp}`,
        type: 'vstack',
        style: {
          flexDirection: 'column',
          gap: 16,
          padding: 16,
        },
        props: {},
        children: [],
      }

    case 'hstack':
      return {
        id: `hstack_${timestamp}`,
        type: 'hstack',
        style: {
          flexDirection: 'row',
          gap: 16,
          padding: 16,
        },
        props: {},
        children: [],
      }

    case 'zstack':
      return {
        id: `zstack_${timestamp}`,
        type: 'zstack',
        style: {
          width: 200,
          height: 200,
        },
        props: {},
        children: [],
      }

    case 'scrollview':
      return {
        id: `scrollview_${timestamp}`,
        type: 'scrollview',
        style: {
          flex: 1,
        },
        props: {
          direction: 'vertical',
          showScrollbar: true,
          bounce: true,
        },
        children: [],
      }

    case 'grid':
      return {
        id: `grid_${timestamp}`,
        type: 'grid',
        style: {
          gap: 16,
          padding: 16,
        },
        props: {
          columns: 2,
        },
        children: [],
      }

    case 'carousel':
      return {
        id: `carousel_${timestamp}`,
        type: 'carousel',
        style: {
          height: 300,
        },
        props: {
          gap: 16,
          autoplay: false,
          loop: true,
          showDots: true,
        },
        children: [],
      }

    case 'text':
      return {
        id: `text_${timestamp}`,
        type: 'text',
        style: {
          fontSize: 16,
          color: '#000000',
        },
        props: {
          text: 'Text',
        },
      }

    case 'heading':
      return {
        id: `heading_${timestamp}`,
        type: 'heading',
        style: {
          fontSize: 24,
          fontWeight: '700',
          color: '#000000',
        },
        props: {
          text: 'Heading',
        },
      }

    case 'button':
      return {
        id: `button_${timestamp}`,
        type: 'button',
        style: {
          backgroundColor: '#f26522',
          padding: 16,
          borderRadius: 12,
        },
        props: {
          text: 'Button',
          textColor: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
        },
      }

    case 'image':
      return {
        id: `image_${timestamp}`,
        type: 'image',
        style: {
          width: 200,
          height: 200,
          borderRadius: 8,
        },
        props: {
          source: '',
          alt: 'Image',
        },
      }

    case 'input':
      return {
        id: `input_${timestamp}`,
        type: 'input',
        style: {
          width: '100%',
          padding: 12,
          borderWidth: 1,
          borderColor: '#cccccc',
          borderRadius: 8,
        },
        props: {
          type: 'text',
          placeholder: 'Enter text...',
        },
      }

    case 'checkbox':
      return {
        id: `checkbox_${timestamp}`,
        type: 'checkbox',
        style: {},
        props: {
          label: 'Checkbox',
          checked: false,
          size: 20,
        },
      }

    case 'radio':
      return {
        id: `radio_${timestamp}`,
        type: 'radio',
        style: {},
        props: {
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
          ],
          selected: 'option1',
          size: 20,
        },
      }

    case 'dropdown':
      return {
        id: `dropdown_${timestamp}`,
        type: 'dropdown',
        style: {
          width: '100%',
          padding: 12,
          borderWidth: 1,
          borderColor: '#cccccc',
          borderRadius: 8,
        },
        props: {
          placeholder: 'Select an option',
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
          ],
          selected: '',
        },
      }

    case 'toggle':
      return {
        id: `toggle_${timestamp}`,
        type: 'toggle',
        style: {},
        props: {
          label: 'Toggle',
          checked: false,
          width: 50,
          height: 28,
        },
      }

    case 'slider':
      return {
        id: `slider_${timestamp}`,
        type: 'slider',
        style: {},
        props: {
          label: 'Slider',
          min: 0,
          max: 100,
          value: 50,
          step: 1,
          showValue: true,
        },
      }

    case 'spacer':
      return {
        id: `spacer_${timestamp}`,
        type: 'spacer',
        style: {
          height: 32,
          flex: undefined, // Can be set to fill available space
        },
        props: {},
      }

    case 'divider':
      return {
        id: `divider_${timestamp}`,
        type: 'divider',
        style: {
          height: 1,
          backgroundColor: '#e0e0e0',
        },
        props: {},
      }

    default:
      return {
        id: `element_${timestamp}`,
        type: elementType,
        style: {},
        props: {},
      }
  }
}

function getDefaultProps(type: string): any {
  switch (type) {
    case 'noboard_screen':
      return {
        layout: {
          backgroundColor: '#FFFFFF',
          padding: 24,
          safeArea: true,
        },
        elements: [
          {
            id: `vstack_${Date.now()}`,
            type: 'vstack',
            style: {
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
            },
            props: {},
            children: [
              {
                id: `heading_${Date.now()}`,
                type: 'heading',
                style: {
                  fontSize: 28,
                  fontWeight: '700',
                  textAlign: 'center',
                  color: '#1a1a1a',
                },
                props: {
                  text: 'Hello World',
                },
              },
              {
                id: `subtitle_${Date.now()}`,
                type: 'text',
                style: {
                  fontSize: 15,
                  textAlign: 'center',
                  color: '#999999',
                  maxWidth: 260,
                },
                props: {
                  text: 'Chat with the AI to build your screen. Insert a reference image on the right sidebar for more context.',
                },
              },
            ],
          },
        ],
        props: {},
      }
    case 'custom_screen':
      return {
        custom_component_name: '',
        custom_description: '',
        custom_variables: [],
      }
    default:
      return {}
  }
}
