# Noboarding Dashboard

Next.js web dashboard for building, previewing, and managing onboarding flows. Includes an AI-powered conversational screen builder.

## Features

### Flow Builder
- Visual flow editor with drag-and-drop screen ordering
- Live phone preview (iPhone/Android device frames)
- Element tree with reordering, nesting, hide/lock controls
- Properties panel for fine-tuning styles and props

### AI Chat Builder
- Conversational interface for creating and iterating on screens
- Describe a screen in natural language or upload a screenshot
- Multi-turn conversation: ask for incremental changes ("make the heading red", "add a card below")
- The AI preserves existing content and only modifies what you request
- Chat history persists per-screen when switching tabs
- Powered by Claude Sonnet via the Anthropic API

### Image Slots
- AI-generated screens automatically number image placeholders (Image 1, Image 2, etc.)
- Right sidebar shows all image slots when the AI Chat tab is active
- Each slot supports uploading an image or generating one with AI

### Screen Types

**Noboard Screen** (AI-generated): Server-driven UI using the composable primitive system. The AI creates these screens as JSON element trees that are fully updateable over-the-air.

**Custom Screen**: Developer-registered React Native components for advanced native features (camera, payments, biometrics). Added to flows by entering the component name.

## Composable Primitive System

Noboard screens are built from a JSON element tree using these primitives:

**Containers** (have children):
- `vstack` — vertical flex column
- `hstack` — horizontal flex row
- `zstack` — layered/overlapping elements
- `scrollview` — scrollable container

**Content** (leaf elements):
- `text` — text content
- `image` — image with URL or slot number
- `video` — video placeholder
- `lottie` — Lottie animation placeholder
- `icon` — emoji or named icon (supports Feather, Material, Ionicons, FontAwesome)
- `input` — text input field with variable binding
- `spacer` — flexible empty space
- `divider` — horizontal line

**Actions** (attached to any container):
- `tap` — generic tap handler
- `navigate` — go to next/previous/specific screen
- `link` — open external URL
- `toggle` — toggle selected/unselected state
- `dismiss` — dismiss screen or flow
- `set_variable` — store value in variable store
- `trigger_native` — call native handler registered in SDK (for permissions, auth, ratings, etc.)

There are no dedicated button/checkbox/card elements — everything is composed from stacks + actions.

## Project Structure

```
dashboard/
├── app/
│   ├── api/
│   │   ├── generate-screen/route.ts   # AI chat endpoint (Claude Sonnet)
│   │   └── generate-image/route.ts    # AI image generation
│   ├── flows/[id]/page.tsx            # Flow builder (main page)
│   ├── analytics/page.tsx
│   └── docs/page.tsx
├── components/
│   ├── CustomScreenRenderer.tsx       # Web HTML/CSS element tree renderer
│   └── ui/                            # Shared UI components
├── lib/
│   ├── types.ts                       # Core type definitions
│   ├── sdk/                           # Local copies of SDK files for preview
│   │   ├── types.ts                   # Synced from sdk/src/types.ts
│   │   ├── variableUtils.ts           # Synced from sdk/src/variableUtils.ts
│   │   └── ElementRenderer.tsx        # Modified for web (react-icons)
│   └── supabase.ts                    # Supabase client
└── public/
```

## Key Files

| File | Purpose |
|------|---------|
| `app/flows/[id]/page.tsx` | Flow builder: screen list, phone preview, AI Chat, element tree, properties panel, image slots |
| `app/api/generate-screen/route.ts` | AI endpoint: system prompt with primitive spec, multi-turn conversation support, structured `{ message, elements }` response |
| `components/CustomScreenRenderer.tsx` | Recursive web renderer: maps element tree to HTML/CSS, handles toggle state and actions |
| `lib/types.ts` | Shared types: `Element`, `ElementType`, `ElementAction`, `ChatMessage`, `Screen` |
| `lib/sdk/` | Local copies of SDK files synced from `../sdk/src/` for preview |

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## AI System Prompt

The AI system prompt (`app/api/generate-screen/route.ts`) defines:

1. All primitive building blocks and their props
2. The action system (tap, navigate, link, toggle, dismiss, set_variable, trigger_native)
3. Common UI patterns (carousel, grid, card, button, selectable option, progress bar, etc.)
4. Rules for preserving content during edits
5. Image slot numbering for placeholder images
6. Variable templating and conditional logic
7. Response format: `{ message: string, elements: ElementNode[] }`

The prompt supports both single-shot generation and multi-turn conversation. When current screen elements are provided, the AI makes only the requested changes.

## SDK File Syncing

The dashboard preview uses **local copies** of SDK files in `lib/sdk/` because Next.js/Turbopack doesn't support importing from external directories with the react-native-web setup.

### Files That Need Syncing

- `sdk/src/types.ts` → `dashboard/lib/sdk/types.ts` (auto-synced)
- `sdk/src/variableUtils.ts` → `dashboard/lib/sdk/variableUtils.ts` (auto-synced)
- `sdk/src/components/ElementRenderer.tsx` → `dashboard/lib/sdk/ElementRenderer.tsx` (⚠️ NOT auto-synced, has web modifications)

### Syncing Methods

**From project root:**

```bash
# Manual sync
npm run sync

# Auto-sync (watches for changes)
npm run sync:watch

# Full dev mode (sync + watch + dev server)
npm run dev
```

### ElementRenderer Web Modifications

The dashboard copy of `ElementRenderer.tsx` has been modified to work in the browser:
- Uses `react-icons` instead of `@expo/vector-icons`
- Renders real icons in preview (Feather, Material, Ionicons, FontAwesome)
- Gradients fall back to solid colors (web limitation)
- Uses HTML/CSS instead of React Native components

If you make significant changes to the SDK's `ElementRenderer.tsx`:
1. Run `npm run sync:full` from project root
2. Manually re-add web icon imports and rendering logic
3. Check git diff to see what changed

## Development

### Running the Dashboard

**Option 1: Full development mode (with SDK sync)**
```bash
# From project root
npm run dev
```

**Option 2: Dashboard only**
```bash
cd dashboard
npm run dev
```

### Adding New Action Types

To add a new action type:

1. Update `lib/sdk/types.ts` (or sync from `sdk/src/types.ts`)
2. Update AI system prompt in `app/api/generate-screen/route.ts` to teach the AI about the new action
3. Update `lib/sdk/ElementRenderer.tsx` to handle the new action
4. Update `components/CustomScreenRenderer.tsx` (web preview) if needed

### Testing Screens

- Use the phone preview in the flow builder to see screens rendered
- Click elements to test actions
- Use the element tree to inspect and modify structure
- Properties panel shows all styles and props for selected element
