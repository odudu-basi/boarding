'use client'

import React from 'react'
import { View } from 'react-native'
// Import the actual ElementRenderer from local SDK copy
import { ElementRenderer } from '@/lib/sdk/ElementRenderer'
import type { ElementNode } from '@/lib/sdk/types'
import type { Asset } from '@/lib/types'

interface RNPreviewProps {
  elements: ElementNode[]
  backgroundColor?: string
  hiddenElements?: Set<string>
  variables?: Record<string, any>
  onSetVariable?: (name: string, value: any) => void
  assets?: Asset[]
}

export function RNPreview({
  elements,
  backgroundColor = '#FFFFFF',
  hiddenElements = new Set(),
  variables = {},
  onSetVariable = () => {},
  assets = [],
}: RNPreviewProps) {
  // Mock analytics for preview mode
  const mockAnalytics = {
    track: (event: string, properties?: Record<string, any>) => {
      console.log('[Preview Analytics]', event, properties)
    },
    flush: async () => {
      console.log('[Preview Analytics] Flush called')
    },
  }

  // Mock navigation handlers for preview
  const handleNavigate = (destination: any) => {
    console.log('[Preview] Navigate to:', destination)
  }

  const handleDismiss = () => {
    console.log('[Preview] Dismiss called')
  }

  // Filter out hidden elements
  const visibleElements = filterHiddenElements(elements, hiddenElements)

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
      }}
    >
      <ElementRenderer
        elements={visibleElements}
        analytics={mockAnalytics}
        screenId="preview"
        onNavigate={handleNavigate}
        onDismiss={handleDismiss}
        variables={variables}
        onSetVariable={onSetVariable}
      />
    </View>
  )
}

// Helper to filter out hidden elements
function filterHiddenElements(
  elements: ElementNode[],
  hiddenElements: Set<string>
): ElementNode[] {
  return elements
    .filter((el) => !hiddenElements.has(el.id))
    .map((el) => ({
      ...el,
      children: el.children
        ? filterHiddenElements(el.children, hiddenElements)
        : undefined,
    }))
}
