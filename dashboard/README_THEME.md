# Noboarding Dashboard Theme System

## Overview
All design tokens are centralized in `/lib/theme.ts`. Change values there to update the entire app.

## Quick Start

### 1. Using Theme Colors
```tsx
import { theme, styles } from '@/lib/theme'

// Inline styles
<div style={styles.background}>Content</div>
<div style={{ backgroundColor: theme.colors.primary }}>Content</div>
```

### 2. Using UI Components
```tsx
import { Button, Card, Heading, Text, Container } from '@/components/ui'

// Button
<Button variant="primary" size="lg" href="/flows/new">
  + New Flow
</Button>

// Card
<Card hover padding="lg">
  <Heading level={3} serif>Title</Heading>
  <Text variant="muted">Description</Text>
</Card>

// Container (max-width wrapper)
<Container maxWidth="xl">
  {/* Your content */}
</Container>
```

### 3. Using Layout Component
```tsx
import { Layout } from '@/components/Layout'

export default function Page() {
  return (
    <Layout organizationName="Test Org" plan="free">
      <Container>
        <Heading level={1} serif>Page Title</Heading>
      </Container>
    </Layout>
  )
}
```

## Theme Configuration

### Colors (`/lib/theme.ts`)
```ts
colors: {
  background: '#f8f5f0',  // Cream background
  primary: '#f26522',     // Claude orange
  text: '#1a1a1a',        // Dark text
  // ... change these to rebrand
}
```

### Fonts
- **Sans**: Inter (body text)
- **Serif Italic**: Newsreader (headings)
- **Mono**: Consolas (code)

Use `className="font-serif-italic"` for italic serif headings.

## Component Props

### Button
- `variant`: 'primary' | 'secondary' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `href`: Make it a Link instead of button

### Card
- `padding`: 'sm' | 'md' | 'lg'
- `hover`: boolean (adds hover effect)
- `href`: Make it clickable

### Heading
- `level`: 1-6 (h1-h6)
- `serif`: boolean (use italic serif font)

### Text
- `size`: 'xs' | 'sm' | 'base' | 'lg'
- `variant`: 'default' | 'muted' | 'light'

## Changing the Theme

Want to rebrand? Just edit `/lib/theme.ts`:

```ts
export const theme = {
  colors: {
    primary: '#YOUR_COLOR',      // Change brand color
    background: '#YOUR_BG',      // Change background
    // ... etc
  }
}
```

All components will update automatically!
