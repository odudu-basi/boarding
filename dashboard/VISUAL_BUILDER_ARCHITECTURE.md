# Visual Builder Architecture

## Overview
Transform Noboarding from template-based to a full visual builder like Superwall, allowing users to create custom onboarding screens by dragging and dropping elements.

## Core Principles
1. **Backwards Compatible**: Existing template screens continue to work
2. **Cross-Platform**: Same JSON renders identically on web and React Native
3. **Constraint-Based**: Use flexbox for layouts (familiar to React Native devs)
4. **Progressive Complexity**: Simple screens are easy, complex screens are possible

---

## Data Structure

### New Screen Type: `custom_screen`

```typescript
interface CustomScreen {
  id: string
  type: 'custom_screen'
  layout: {
    backgroundColor?: string
    padding?: number | { top: number, right: number, bottom: number, left: number }
    safeArea?: boolean  // Respect safe area insets
  }
  elements: Element[]
}

interface Element {
  id: string
  type: ElementType
  style: ElementStyle
  props: Record<string, any>
  children?: Element[]  // For containers
}

type ElementType =
  | 'container'  // Flexbox container
  | 'text'
  | 'heading'
  | 'button'
  | 'image'
  | 'input'
  | 'spacer'
  | 'divider'

interface ElementStyle {
  // Layout (Flexbox)
  flex?: number
  flexDirection?: 'row' | 'column'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  gap?: number

  // Spacing
  margin?: number | { top: number, right: number, bottom: number, left: number }
  padding?: number | { top: number, right: number, bottom: number, left: number }

  // Dimensions
  width?: number | string  // number = fixed px, string = '100%' | 'auto'
  height?: number | string
  maxWidth?: number
  maxHeight?: number

  // Visual
  backgroundColor?: string
  borderRadius?: number
  borderWidth?: number
  borderColor?: string

  // Text (for text elements)
  color?: string
  fontSize?: number
  fontWeight?: '400' | '500' | '600' | '700'
  textAlign?: 'left' | 'center' | 'right'
}
```

### Example: Custom Welcome Screen

```json
{
  "id": "welcome_1",
  "type": "custom_screen",
  "layout": {
    "backgroundColor": "#FFFFFF",
    "padding": 24,
    "safeArea": true
  },
  "elements": [
    {
      "id": "root_container",
      "type": "container",
      "style": {
        "flex": 1,
        "flexDirection": "column",
        "justifyContent": "center",
        "alignItems": "center",
        "gap": 16
      },
      "children": [
        {
          "id": "image_1",
          "type": "image",
          "style": {
            "width": 200,
            "height": 200,
            "borderRadius": 16
          },
          "props": {
            "source": "https://via.placeholder.com/200",
            "alt": "Welcome illustration"
          }
        },
        {
          "id": "heading_1",
          "type": "heading",
          "style": {
            "fontSize": 28,
            "fontWeight": "700",
            "textAlign": "center",
            "color": "#000000"
          },
          "props": {
            "text": "Welcome to Our App!"
          }
        },
        {
          "id": "text_1",
          "type": "text",
          "style": {
            "fontSize": 16,
            "textAlign": "center",
            "color": "#666666"
          },
          "props": {
            "text": "Get started with the best onboarding experience"
          }
        },
        {
          "id": "spacer_1",
          "type": "spacer",
          "style": {
            "height": 32
          }
        },
        {
          "id": "button_1",
          "type": "button",
          "style": {
            "width": "100%",
            "backgroundColor": "#f26522",
            "padding": 16,
            "borderRadius": 12
          },
          "props": {
            "text": "Get Started",
            "textColor": "#FFFFFF",
            "fontSize": 16,
            "fontWeight": "600"
          }
        }
      ]
    }
  ]
}
```

---

## Component Library

### 1. Container
- **Purpose**: Group elements, control layout
- **Props**: None
- **Style**: Full flexbox support
- **Use Cases**: Stacks, rows, centered content

### 2. Text
- **Purpose**: Body text, descriptions
- **Props**: `text` (string)
- **Style**: color, fontSize, fontWeight, textAlign
- **Use Cases**: Paragraphs, labels, descriptions

### 3. Heading
- **Purpose**: Titles, section headers
- **Props**: `text` (string)
- **Style**: color, fontSize, fontWeight, textAlign
- **Use Cases**: Screen titles, section headers

### 4. Button
- **Purpose**: CTAs, actions
- **Props**: `text` (string), `action` (string), `textColor` (string)
- **Style**: backgroundColor, padding, borderRadius, fontSize, fontWeight
- **Use Cases**: Primary CTA, secondary actions

### 5. Image
- **Purpose**: Visual assets
- **Props**: `source` (URL), `alt` (string)
- **Style**: width, height, borderRadius
- **Use Cases**: Illustrations, logos, product shots

### 6. Input
- **Purpose**: Text input fields
- **Props**: `placeholder` (string), `type` ('text' | 'email' | 'password'), `required` (boolean)
- **Style**: backgroundColor, borderWidth, borderColor, borderRadius, padding
- **Use Cases**: Forms, user data collection

### 7. Spacer
- **Purpose**: Fixed spacing between elements
- **Props**: None
- **Style**: width or height (only)
- **Use Cases**: Vertical/horizontal gaps

### 8. Divider
- **Purpose**: Visual separation
- **Props**: None
- **Style**: backgroundColor, height (for horizontal) or width (for vertical)
- **Use Cases**: Separating sections

---

## Rendering Engine

### Web (Dashboard Preview)
```typescript
// components/VisualBuilder/Renderer.tsx
function RenderElement({ element }: { element: Element }) {
  const style = convertStyleToCSS(element.style)

  switch (element.type) {
    case 'container':
      return (
        <div style={style}>
          {element.children?.map(child => (
            <RenderElement key={child.id} element={child} />
          ))}
        </div>
      )

    case 'text':
      return <p style={style}>{element.props.text}</p>

    case 'heading':
      return <h2 style={style}>{element.props.text}</h2>

    case 'button':
      return (
        <button style={style}>
          <span style={{ color: element.props.textColor }}>
            {element.props.text}
          </span>
        </button>
      )

    case 'image':
      return <img src={element.props.source} alt={element.props.alt} style={style} />

    case 'input':
      return <input type={element.props.type} placeholder={element.props.placeholder} style={style} />

    case 'spacer':
      return <div style={style} />

    case 'divider':
      return <div style={style} />
  }
}
```

### React Native (SDK)
```typescript
// SDK: components/CustomScreenRenderer.tsx
import { View, Text, Image, TouchableOpacity, TextInput } from 'react-native'

function RenderElement({ element, onButtonPress }: Props) {
  const style = convertStyleToRN(element.style)

  switch (element.type) {
    case 'container':
      return (
        <View style={style}>
          {element.children?.map(child => (
            <RenderElement key={child.id} element={child} onButtonPress={onButtonPress} />
          ))}
        </View>
      )

    case 'text':
      return <Text style={style}>{element.props.text}</Text>

    case 'heading':
      return <Text style={[style, { fontWeight: 'bold' }]}>{element.props.text}</Text>

    case 'button':
      return (
        <TouchableOpacity
          style={style}
          onPress={() => onButtonPress(element.props.action)}
        >
          <Text style={{ color: element.props.textColor, fontSize: element.props.fontSize }}>
            {element.props.text}
          </Text>
        </TouchableOpacity>
      )

    case 'image':
      return <Image source={{ uri: element.props.source }} style={style} />

    case 'input':
      return (
        <TextInput
          placeholder={element.props.placeholder}
          secureTextEntry={element.props.type === 'password'}
          keyboardType={element.props.type === 'email' ? 'email-address' : 'default'}
          style={style}
        />
      )

    case 'spacer':
      return <View style={style} />

    case 'divider':
      return <View style={style} />
  }
}
```

---

## Builder UI

### Left Sidebar: Element Library
```
┌─────────────────┐
│ Elements        │
├─────────────────┤
│ 📦 Container    │
│ 📝 Text         │
│ 🔤 Heading      │
│ 🔘 Button       │
│ 🖼️  Image       │
│ ⌨️  Input       │
│ ↕️  Spacer      │
│ ━━ Divider     │
└─────────────────┘
```

### Center: Phone Preview + Element Tree
```
┌──────────────────────────┐
│   Screen 1   Screen 2    │ <- Tabs
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │                    │  │
│  │   iPhone Frame     │  │
│  │   with live        │  │
│  │   preview          │  │
│  │                    │  │
│  └────────────────────┘  │
├──────────────────────────┤
│ Element Tree:            │
│  📦 Container            │
│    └ 🖼️  Image          │
│    └ 🔤 Heading         │
│    └ 📝 Text            │
│    └ 🔘 Button          │
└──────────────────────────┘
```

### Right Sidebar: Properties Panel
```
┌──────────────────┐
│ Button           │
├──────────────────┤
│ Content          │
│  Text: [Get...] │
│  Action: [next] │
│                  │
│ Style            │
│  BG: [#f26522]  │
│  Padding: [16]  │
│  Border R: [12] │
│                  │
│ Layout           │
│  Width: [100%]  │
│  Align: [cente] │
└──────────────────┘
```

---

## Migration Path

### Phase 1: Infrastructure (Week 1-2)
- [ ] Create Element type definitions
- [ ] Build web renderer component
- [ ] Build React Native renderer component
- [ ] Update database schema to support custom_screen type

### Phase 2: Builder UI (Week 3-4)
- [ ] Element library sidebar
- [ ] Drag-drop elements onto canvas
- [ ] Element tree view with selection
- [ ] Properties panel for editing

### Phase 3: Advanced Features (Week 5-6)
- [ ] Copy/paste elements
- [ ] Undo/redo
- [ ] Templates (convert custom screens to templates)
- [ ] Component nesting drag-drop

### Phase 4: Polish (Week 7-8)
- [ ] Keyboard shortcuts
- [ ] Element duplication
- [ ] Quick style presets
- [ ] Export/import screens

---

## Database Changes

```sql
-- No schema changes needed!
-- custom_screen type stores elements in the config JSON
-- Fully backwards compatible with existing template screens
```

---

## API Changes

### Get Config (No Change)
```typescript
// Existing endpoint works as-is
// GET /api/config/:id
// Returns: { screens: Array<TemplateScreen | CustomScreen> }
```

### SDK Changes (Minor)
```typescript
// Add new renderer for custom screens
import { CustomScreenRenderer } from './components/CustomScreenRenderer'

function OnboardingFlow() {
  return screens.map(screen => {
    if (screen.type === 'custom_screen') {
      return <CustomScreenRenderer screen={screen} />
    }
    // Existing template renderers continue to work
    return <TemplateScreenRenderer screen={screen} />
  })
}
```

---

## Success Metrics
1. **Build Time**: User can recreate template welcome screen in <5 min using visual builder
2. **Flexibility**: Can build screens not possible with templates (e.g., 2-column layouts, image grids)
3. **Adoption**: 50%+ of new screens use visual builder within 3 months of launch
4. **Performance**: Custom screens render with <16ms frame time (60fps)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Complex to build | High | Start with minimal element set (5 elements) |
| Performance on RN | Medium | Limit nesting depth, optimize renders |
| User learning curve | Medium | Provide templates as starting points |
| Cross-platform bugs | Medium | Extensive testing, shared renderer logic |

---

## Next Steps

1. **Validate with users**: Show this architecture to potential customers
2. **Build renderer first**: Proves the data structure works
3. **Builder UI second**: Once rendering is solid, build the editor
4. **Launch in beta**: Invite early adopters to test before full release
