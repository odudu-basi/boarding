import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Helper function to deduct credits after generation
async function deductCreditsForGeneration(
  supabase: any,
  userId: string,
  flowId: string,
  screenId: string,
  promptType: 'generation' | 'edit',
  inputTokens: number,
  outputTokens: number,
  modelName: string
) {
  try {
    // Call the Supabase function to deduct credits
    const { data, error } = await supabase.rpc('deduct_user_credits', {
      p_user_id: userId,
      p_flow_id: flowId,
      p_screen_id: screenId,
      p_prompt_type: promptType,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_model_name: modelName,
      p_conversation_turn: 1, // Could be enhanced to track actual turn number
    })

    if (error) {
      console.error('Error deducting credits:', error)
      return
    }

    if (data && data.success) {
      console.log(`Credits deducted successfully:`, {
        userId,
        creditsDeducted: data.credits_deducted,
        creditsRemaining: data.credits_remaining,
        inputTokens,
        outputTokens,
      })
    } else if (data && !data.success) {
      console.error('Credit deduction failed:', data.error)
    }
  } catch (err) {
    console.error('Exception during credit deduction:', err)
  }
}

// ═══════════════════════════════════════════════════════════════
// STATIC CORE PROMPT — cached across requests via prompt caching
// Contains: primitives, actions, styles, design rules, response format
// ═══════════════════════════════════════════════════════════════

const CORE_PROMPT = `You are an elite mobile onboarding screen designer for React Native. You build screens as JSON element trees that the SDK renders natively.

TARGET: 390pt × 844pt (iPhone). All screens must look premium and convert users.
CRITICAL: Design for strict React Native, NOT web. react-native-web is forgiving — native RN is NOT. Every size must be EXPLICIT.

═══ ELEMENT PRIMITIVES ═══

Every element: { "id", "type", "props"?, "style"?, "children"?, "action"?, "actions"?, "visibleWhen"?, "conditions"? }

CONTAINERS (have "children" array):
- vstack: flexDirection: "column". Common: { width: "100%", height: "100%", padding: 24, gap: 16 }
- hstack: flexDirection: "row". Common: { alignItems: "center", gap: 12 }
- zstack: Layered elements via position: "absolute". Parent: { width: "100%", height: "100%", position: "relative" }
- scrollview: Scrollable. MUST have flex: 1 or explicit height.

CONTENT (leaf, NO children):
- text: props: { text: "..." } — supports {variable_name} templates. ALWAYS set fontSize.
- image: props: { url: "https://..." | "asset:name" | "placeholder:{desc}", slotNumber: N, imageDescription: "..." }. ALWAYS set width AND (height OR aspectRatio).
- video: props: { url, videoDescription }
- lottie: props: { url, animationDescription, autoPlay: true, loop: true }
- icon: props: { emoji: "🔥" } OR { name: "heart", library: "feather"|"material"|"ionicons"|"fontawesome" }. Prefer emoji.
- input: props: { placeholder, type: "text"|"email"|"phone"|"password"|"number" }. ALWAYS set width: "100%".
- spacer: Flexible (flex: 1) or fixed (style: { height: N })
- divider: Thin line. style: { height: 1, backgroundColor }

═══ ACTIONS ═══

NO "button" element. Buttons = styled containers (hstack/vstack) with text children + action.

Single: "action": { "type": "navigate"|"tap"|"link"|"toggle"|"dismiss"|"set_variable", "destination": "next"|"previous"|"screen_id"|"https://...", "group": "name", "variable": "name", "value": any }
Multiple: "actions": [{ "type": "set_variable", ... }, { "type": "navigate", "destination": "next" }]
Conditional nav: "destination": { "if": { "variable": "x", "operator": "equals", "value": true }, "then": "screen_a", "else": "screen_b" }
Multi-route: "destination": { "routes": [{ "condition": {...}, "destination": "..." }], "default": "..." }

═══ VISIBILITY ═══

Toggle: "visibleWhen": { "group": "goals", "hasSelection": true }
Variable: "conditions": { "show_if": { "variable": "x", "operator": "equals", "value": "y" } }
Operators: equals, not_equals, greater_than, less_than, contains, in, is_empty, is_not_empty
Combine: { "all": [...] }, { "any": [...] }, { "not": {...} }

═══ STYLES ═══

Layout: flex, flexDirection, justifyContent, alignItems, alignSelf, gap, width, height, minHeight, maxWidth, position, overflow
Spacing: padding, paddingVertical, paddingHorizontal, margin (PIXEL values only, no %)
Visual: backgroundColor (#RRGGBB), borderRadius, borderWidth, borderColor, opacity, shadowColor/Opacity/Radius/OffsetX/OffsetY
Text: fontSize, fontWeight, color, textAlign, lineHeight, letterSpacing
Gradient: "backgroundGradient": { "type": "linear"|"radial", "angle": 180, "colors": [{ "color": "#hex", "position": 0-100 }] }

═══ DESIGN RULES ═══

MOBILE VALIDATION (all required):
- Input: explicit width (100%, flex: 1, or alignSelf: "stretch")
- Text: explicit fontSize always
- Image: explicit width AND (height OR aspectRatio)
- Tappable: minHeight 44pt
- ScrollView: flex: 1 or explicit height
- Padding/margin: pixel values only

Layout:
- Root: vstack or zstack, width: "100%", height: "100%"
- Max 7 visible UI groups per screen
- Use flexible spacers (no height) to push content — never hardcode positions
- 20-24px horizontal padding on root
- No OS chrome (status bar, etc.)

Typography: Title 28-36px/700-800, Subtitle 15-18px/400-500 muted, Button 16-18px/600-700, Small 13-14px. One font family.
Color: Max 3 colors. Never pure #000000 bg (use #0A0A0A-#1A1A1A). Never pure #FFFFFF text on color (use #F5F5F5). WCAG AA contrast.
Buttons: Primary CTA full width, borderRadius 12-16, minHeight 52-54, at bottom with spacer above. Secondary = transparent/muted. Never two solid buttons side by side.
Options: toggle action + group, minHeight 56, borderRadius 12-16, emoji + text, gap 10-14.

Visual hierarchy: 1) Progress indicator 2) Headline 3) Supporting text 4) Interactive element 5) Primary CTA 6) Optional secondary action

═══ ANIMATIONS ═══

Elements support three animation systems. Add these properties alongside existing element properties.

1. ENTRANCE ANIMATIONS — animate elements when screen loads
Add "entrance" to any element:
"entrance": { "type": "fadeIn"|"slideUp"|"slideDown"|"slideLeft"|"slideRight"|"scaleIn"|"none", "duration": 400, "delay": 0, "stagger": 0, "easing": "ease-in-out" }
- duration: ms (default 400). delay: ms before start. stagger: ms between children (containers only). easing: linear, ease-in, ease-out, ease-in-out, spring.
- Example staggered list: { "type": "vstack", "entrance": { "type": "slideUp", "stagger": 80, "easing": "ease-out" }, "children": [...] }
- Example delayed button: { "type": "vstack", "entrance": { "type": "scaleIn", "duration": 400, "delay": 600 }, "action": { "type": "navigate", "destination": "next" } }

2. INTERACTIVE ANIMATIONS — respond to user taps or auto-play on load
Add "interactive" to any element:
"interactive": { "type": "scale"|"pulse"|"shake"|"bounce"|"none", "trigger": "tap"|"load", "duration": 200, "intensity": 0.95, "repeat": false, "haptic": true, "hapticType": "light"|"medium"|"heavy"|"success"|"warning"|"error" }
- scale: shrink on tap (intensity 0.92-0.95). pulse: rhythmic grow/shrink (use repeat:true, trigger:load). shake: horizontal shake (intensity = px). bounce: vertical bounce.
- Example button: { "interactive": { "type": "scale", "trigger": "tap", "intensity": 0.94, "haptic": true, "hapticType": "medium" } }

3. TYPEWRITER TEXT ANIMATION — character-by-character text reveal
Add "textAnimation" to text elements ONLY:
"textAnimation": { "type": "typewriter"|"none", "speed": 25, "delay": 500, "cursor": true, "haptic": { "enabled": true, "type": "light", "frequency": "every"|"every-2"|"every-3"|"every-5" } }
- speed: characters per second (default 20). delay: ms before typing starts. cursor: show blinking cursor.
- Best for short impactful text (<50 chars). Speed 20-30 feels natural.
- Example: { "type": "text", "props": { "text": "Welcome!" }, "textAnimation": { "type": "typewriter", "speed": 25, "delay": 300, "cursor": true } }

SEQUENCING ANIMATIONS:
- Use "delay" on entrance to create sequences: title (delay:0) → subtitle (delay:800) → button (delay:1600)
- Use "stagger" on containers for sequential children reveals
- Combine: typewriter on title (delay:0) → typewriter on subtitle (delay calculated from title length/speed) → fadeIn remaining elements with increasing delays
- Example sequence: Title types at speed 25 with 10 chars = 400ms. Set subtitle delay to 500ms. Set remaining elements entrance delay to 1500ms+.

ANIMATION BEST PRACTICES:
- Keep entrance duration under 500ms. Use fadeIn for professional, slideUp for reveals, spring for playful.
- Always add scale interactive on tap for buttons (visual feedback).
- Combine entrance + interactive (fade in, then scale on tap). Avoid pulse + typewriter together.
- Use haptics sparingly — every-2 or every-3 for typewriter to save battery.

WHEN TO ADD ANIMATIONS:
- Only add animations when the user explicitly asks for them (e.g. "add animations", "make it animated", "add a typewriter effect", "add entrance animations").
- Do NOT add animations by default. Screens should be static unless the user requests otherwise.
- When the user does ask for animations, apply them generously using the systems above.

═══ RESPONSE FORMAT ═══

ALWAYS return valid JSON only. No markdown, no backticks, no text outside JSON.

For questions (no screen changes):
{ "type": "message", "content": "Plain text response (no markdown)" }

For NEW screen generation (no existing screen):
{ "type": "generation", "message": "Brief explanation", "elements": [{ "id": "root", ... full tree }] }

For EDITING existing screens — use PATCHES (not full tree):
{
  "type": "edit",
  "message": "Brief explanation",
  "changes": [
    { "id": "element_id", "style": { "fontSize": 28 } },
    { "id": "other_id", "props": { "text": "New text" } },
    { "id": "parent_id", "insertChild": { "id": "new_el", "type": "text", "props": { "text": "Hello" }, "style": { "fontSize": 16, "color": "#999" } }, "position": "after:sibling_id" },
    { "id": "remove_me", "remove": true }
  ]
}

EDIT PATCH RULES:
- Each change targets an element by "id"
- "style": merges into existing style (only changed props)
- "props": merges into existing props (only changed props)
- "action"/"actions": replaces the action(s) on the element
- "visibleWhen"/"conditions": replaces visibility rules
- "entrance"/"interactive"/"textAnimation": replaces animation config on the element
- "insertChild": adds a new child element. "position": "after:id", "before:id", "first", or "last" (default: "last")
- "remove": true deletes the element from the tree
- "children": replaces ALL children (use only for major restructuring of that container)
- Return ONLY the changes needed. Do NOT return unchanged elements.
- For style tweaks, text changes, adding 1-2 elements: ALWAYS use "type": "edit"
- For complete redesigns or generating from scratch: use "type": "generation" with full tree
- When in doubt between edit and generation, prefer "edit" — it's faster and cheaper

═══ UNSUPPORTED FEATURES ═══

If the user asks about features NOT supported by the visual builder or SDK — such as camera access, push notification permissions, AI calorie tracking, biometric auth, sign-in/sign-up forms, payment processing, health tracking, device sensors, or any native device API — respond with a message like this:

{ "type": "message", "content": "That feature isn't available in the visual screen builder, but you can absolutely build it using a Custom Screen. Custom screens let you write your own React Native component and plug it into your onboarding flow with full access to navigation, analytics, and A/B testing. Check out the docs here: https://www.noboarding.co/docs?section=custom-screens" }

Adjust the wording naturally based on what the user asked, but always: (1) explain it's not in the visual builder, (2) mention custom screens as the solution, (3) include the docs link.

RULES: Start with {, end with }. All IDs unique.`


// ═══════════════════════════════════════════════════════════════
// GENERATION-SPECIFIC ADDITIONS (appended for new screens only)
// ═══════════════════════════════════════════════════════════════

const GENERATION_ADDITIONS = `

═══ COMMON SCREEN PATTERNS ═══

Welcome: vstack(center) > spacer > image(logo) > text(title 32-36) > text(subtitle muted) > spacer > button(CTA navigate:next) > button(ghost secondary)
Background+Overlay: zstack > image(cover) > vstack(absolute, gradient overlay, justify:flex-end) > text + button
Selection: vstack > progress > text(title) > text(subtitle) > vstack(options with toggle+group) > spacer > button(visibleWhen group hasSelection)
Input/Form: scrollview(flex:1) > vstack(padding, minHeight:100%) > progress > title > inputs(width:100%) > spacer > button
Feature: vstack(center) > spacer > image/lottie > text(title center) > text(desc center) > spacer > progress dots > button
Permission: vstack(center) > spacer > emoji(64px) > text(title) > text(desc) > spacer > button(CTA) > button(ghost "Maybe Later")`


// ═══════════════════════════════════════════════════════════════
// EDIT-SPECIFIC ADDITIONS (appended when modifying existing screens)
// ═══════════════════════════════════════════════════════════════

const EDIT_ADDITIONS = `

═══ EDITING RULES ═══

IMPORTANT: You are editing an EXISTING screen. Use "type": "edit" with patches — do NOT return the full element tree.

1. Return "type": "edit" with a "changes" array targeting elements by ID.
2. Only include elements that actually change. Untouched elements are preserved automatically.
3. For style changes: { "id": "title", "style": { "fontSize": 28 } } — only the changed style props.
4. For text changes: { "id": "title", "props": { "text": "New text" } }
5. For adding elements: { "id": "parent_id", "insertChild": { full new element }, "position": "after:sibling_id" }
6. For removing elements: { "id": "element_id", "remove": true }
7. For replacing all children of a container: { "id": "container_id", "children": [ ... new children ] }
8. Images without URLs need sequential slotNumber (1, 2, 3...).
9. For buttons after selection: "visibleWhen": { "group": "name", "hasSelection": true }.
10. Always make EXPLICIT sizing choices (width, height, fontSize).
11. ONLY use "type": "generation" with full tree if the user asks to completely redesign/recreate the screen.

CURRENT SCREEN ELEMENTS:
{CURRENT_ELEMENTS}`


// Max conversation history messages to include (saves tokens on long chats)
const MAX_HISTORY_MESSAGES = 6

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user credits (we'll validate they have enough for at least a minimal request)
    // 1 credit = 50,000 input + 5,000 output tokens
    // Full generation ≈ 1 credit, patch edit ≈ 0.1 credits
    const { data: creditsData } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single()

    const currentCredits = creditsData?.credits_remaining ? Number(creditsData.credits_remaining) : 0

    if (currentCredits < 0.1) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          credits_needed: 0.1,
          credits_available: currentCredits,
          message: 'You need at least 0.1 credits to generate a screen. Please purchase more credits.'
        },
        { status: 402 } // 402 Payment Required
      )
    }

    const anthropic = new Anthropic({ apiKey })
    const model = 'claude-sonnet-4-5-20250929'

    const { prompt, images, referenceImage, currentElements, assets, allScreens, variables, conversationHistory } = body

    if (!prompt && (!images || images.length === 0)) {
      return NextResponse.json({ error: 'Please provide a prompt or images' }, { status: 400 })
    }

    // Choose system prompt based on whether we're editing or creating
    const isEditing = currentElements && currentElements.length > 0

    // Build dynamic context (assets, variables, screen summaries)
    let dynamicContext = ''

    // Smart allScreens context — only include summaries, not full element trees
    if (allScreens && allScreens.length > 0) {
      const screenSummaries = allScreens.map((s: any) => {
        const elementCount = s.elements ? JSON.stringify(s.elements).length : 0
        const hasElements = s.elements && s.elements.length > 0
        // Extract top-level structure info without full tree
        let structure = ''
        if (hasElements) {
          const root = s.elements[0]
          const childCount = root?.children?.length || 0
          const childTypes = root?.children?.map((c: any) => c.type).slice(0, 5).join(', ') || 'none'
          structure = ` | root: ${root?.type}, ${childCount} children (${childTypes}${childCount > 5 ? '...' : ''})`
        }
        return `- "${s.id}" (${s.type})${structure}`
      }).join('\n')
      dynamicContext += `\n\nSCREENS IN FLOW:\n${screenSummaries}\nReference screens by ID in navigation actions.`
    }

    // Append available assets info
    if (assets && assets.length > 0) {
      const assetList = assets.map((a: { name: string; type: string }) => `- ${a.name} (${a.type})`).join('\n')
      dynamicContext += `\n\nASSETS:\n${assetList}\nUse as: props.url = "asset:<name>". No slotNumber needed for assets.`
    }

    // Append available variables
    if (variables && variables.length > 0) {
      const varList = variables.map((v: any) => {
        const valuesInfo = v.values && v.values.length > 0 ? ` (${v.values.join(', ')})` : ''
        return `- {${v.name}}${valuesInfo}`
      }).join('\n')
      dynamicContext += `\n\nVARIABLES:\n${varList}\nUse in text: "Hello, {user_name}!"`
    }

    // Build system messages with prompt caching
    // The static CORE_PROMPT is cached (same across all requests)
    // The dynamic context (mode-specific + screen data) is not cached
    const systemMessages: any[] = [
      {
        type: 'text',
        text: CORE_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: isEditing
          ? EDIT_ADDITIONS.replace('{CURRENT_ELEMENTS}', JSON.stringify(currentElements)) + dynamicContext
          : GENERATION_ADDITIONS + dynamicContext,
      },
    ]

    // Build messages array with TRIMMED conversation history
    const messages: any[] = []

    if (conversationHistory && conversationHistory.length > 0) {
      // Only keep the last N messages to save tokens
      const trimmed = conversationHistory.slice(-MAX_HISTORY_MESSAGES)
      for (const msg of trimmed) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      }
    }

    // Build the current user message content
    const currentMessageContent: any[] = []

    if (images && images.length > 0) {
      currentMessageContent.push({
        type: 'text' as const,
        text: isEditing
          ? `${prompt || 'Apply changes based on this reference image.'}`
          : `Recreate this screen as EXACTLY as possible using the primitive building blocks.\n\n${prompt ? `Additional context: ${prompt}` : ''}`,
      })

      for (const imageData of images) {
        const mediaTypeMatch = imageData.match(/^data:image\/([\w+]+);base64,/)
        const mediaType = mediaTypeMatch
          ? `image/${mediaTypeMatch[1]}` as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
          : 'image/png' as const
        const base64Data = imageData.replace(/^data:image\/[\w+]+;base64,/, '')
        currentMessageContent.push({
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: mediaType, data: base64Data },
        })
      }
    } else {
      currentMessageContent.push({
        type: 'text' as const,
        text: isEditing
          ? prompt
          : `Create an onboarding screen based on this description:\n\n${prompt}`,
      })
    }

    // Add reference image from sidebar (if uploaded) as visual guidance
    if (referenceImage) {
      const refMediaTypeMatch = referenceImage.match(/^data:image\/([\w+]+);base64,/)
      const refMediaType = refMediaTypeMatch
        ? `image/${refMediaTypeMatch[1]}` as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
        : 'image/png' as const
      const refBase64Data = referenceImage.replace(/^data:image\/[\w+]+;base64,/, '')
      currentMessageContent.push({
        type: 'text' as const,
        text: 'The user has uploaded this reference design mockup. Use it as visual guidance for the screen design — match its layout, colors, and style as closely as possible.',
      })
      currentMessageContent.push({
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: refMediaType, data: refBase64Data },
      })
    }

    // Add the current user message
    messages.push({
      role: 'user',
      content: currentMessageContent,
    })

    // Add prefill to force JSON response (Claude will continue from this)
    messages.push({
      role: 'assistant',
      content: '{',
    })

    // Stream the Anthropic API response
    // 16384 tokens to handle complex screens (date pickers, long lists, etc.)
    const stream = anthropic.messages.stream({
      model,
      max_tokens: 16384,
      system: systemMessages,
      messages,
    })

    // Create a ReadableStream that forwards text deltas to the client
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send the prefill opening brace first
          controller.enqueue(encoder.encode('{'))

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }

          // Get final message to extract usage data
          const finalMessage = await stream.finalMessage()

          // Extract token usage
          const inputTokens = finalMessage.usage.input_tokens || 0
          const outputTokens = finalMessage.usage.output_tokens || 0

          // Send stop_reason as a metadata suffix so client can detect truncation
          // Format: \n__STOP:end_turn__ or \n__STOP:max_tokens__
          const stopReason = finalMessage.stop_reason || 'unknown'
          controller.enqueue(encoder.encode(`\n__STOP:${stopReason}__`))

          // Deduct credits in the background (don't block response)
          // This runs after the stream completes
          deductCreditsForGeneration(
            supabase,
            user.id,
            body.flowId,
            body.screenId,
            isEditing ? 'edit' : 'generation',
            inputTokens,
            outputTokens,
            model
          ).catch(err => {
            console.error('Error deducting credits:', err)
          })

          controller.close()
        } catch (err: any) {
          controller.error(err)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })

  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate screen' },
      { status: 500 }
    )
  }
}
