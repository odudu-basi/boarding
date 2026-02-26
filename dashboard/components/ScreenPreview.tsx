import { Screen, Asset } from '@/lib/types'
import { RNPreview } from './RNPreview'
import React, { useState, useCallback } from 'react'

interface ScreenPreviewProps {
  screen: Screen
  hiddenElements?: Set<string>
  assets?: Asset[]
}

export function ScreenPreview({ screen, hiddenElements = new Set(), assets = [] }: ScreenPreviewProps) {
  // Local variable state for previewing variable-driven behavior
  const [previewVariables, setPreviewVariables] = useState<Record<string, any>>({})
  const handleSetVariable = useCallback((name: string, value: any) => {
    setPreviewVariables(prev => ({ ...prev, [name]: value }))
  }, [])

  // Noboard screen type (AI builder / visual builder)
  if (screen.type === 'noboard_screen' && screen.elements) {
    return (
      <RNPreview
        elements={screen.elements as any}
        backgroundColor={screen.layout?.backgroundColor}
        hiddenElements={hiddenElements}
        variables={previewVariables}
        onSetVariable={handleSetVariable}
        assets={assets}
      />
    )
  }

  // Custom screen type (developer component — can't preview in browser)
  if (screen.type === 'custom_screen') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#F8F9FA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#333',
        }}>
          {screen.custom_component_name || 'Custom Component'}
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#666',
          maxWidth: '280px',
          lineHeight: '1.5',
        }}>
          {screen.custom_description || 'This screen renders a developer-provided React Native component. Preview is not available in the dashboard.'}
        </p>
      </div>
    )
  }

  // Unknown screen type fallback
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>❓</div>
      <p style={{ fontSize: '14px', color: '#999' }}>
        Unknown screen type: {screen.type}
      </p>
    </div>
  )
}
