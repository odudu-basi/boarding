# System Prompt Update Summary

## What Changed

This document explains the updates made to the AI system prompts for screen generation and editing.

## Files Created

1. **UPDATED_GENERATION_PROMPT.md** - New system prompt for initial screen generation
2. **UPDATED_EDIT_PROMPT.md** - New system prompt for editing existing screens
3. **PROMPT_UPDATE_SUMMARY.md** - This file (explains changes)

## Major Improvements

### 1. Mobile-First Validation Rules

Added explicit validation checklist that emphasizes React Native (mobile) over react-native-web (dashboard preview):

**The Core Principle**: "Every sizing decision must be EXPLICIT. Don't rely on platform defaults."

Checklist includes:
- ☐ All input elements have EXPLICIT width constraints (`width: "100%"`, `flex: 1`, `alignSelf: "stretch"`)
- ☐ All text elements have EXPLICIT fontSize (never rely on defaults)
- ☐ All image elements have EXPLICIT dimensions (width + height or aspectRatio)
- ☐ All tappable elements have ADEQUATE touch targets (minHeight: 44pt)
- ☐ All scrollview containers have EXPLICIT height constraints (`flex: 1` or specific height)
- ☐ All padding/margins use PIXEL VALUES (not percentages)

**Why This Matters**:
- react-native-web (dashboard preview) is forgiving and adds browser defaults
- React Native (actual mobile app) is strict and requires explicit values
- What looks good in the preview might break on mobile without explicit constraints

### 2. Comprehensive Design Rules

Added detailed design guidelines from the other AI's prompt:

**Typography Rules**:
- Title/headline: 28-36px, fontWeight "700" or "800"
- Subtitle/description: 15-18px, fontWeight "400" or "500", muted color
- Button text: 16-18px, fontWeight "600" or "700"
- Small text (captions): 13-14px
- lineHeight for body text: 1.4-1.5× the fontSize

**Color Rules**:
- Maximum 3 colors per screen
- NEVER pure black (#000000) for backgrounds → use #0A0A0A, #111111, #1A1A1A
- NEVER pure white (#FFFFFF) text on colored backgrounds → use #F5F5F5, #FAFAFA
- Ensure WCAG AA contrast (4.5:1 for body text, 3:1 for large text)
- Subtle gradients > flat colors for premium feel

**Layout Rules**:
- Root element MUST be vstack or zstack with width: "100%", height: "100%"
- Keep screens simple: maximum 7 visible UI groups
- Use flexible spacers to position content (never hardcode positions)
- All tappable areas: minimum 44pt height (iOS HIG)
- Horizontal padding: 20-24px (never below 16px)
- Gap between elements: 12-24px

**Button Rules**:
- Primary CTA: Full width, borderRadius 12-16px, minHeight 52-54pt, at bottom
- Secondary action: Transparent background, muted text
- NEVER two solid-colored buttons side by side
- Use flexible spacer above CTA to anchor it at bottom

**Option Card Rules**:
- Build each option as hstack with toggle action + group name
- Minimum height: 56pt per option
- borderRadius: 12-16px
- Include emoji or icon for scannability
- Gap between cards: 10-14px

### 3. Common Screen Patterns

Added pre-built templates for common onboarding screens:

1. **Welcome Screen** - Logo, title, subtitle, primary CTA, secondary action
2. **Background Image + Overlay** - Full-screen background with gradient overlay + content
3. **Selection Screen** - Title, subtitle, multiple option cards, conditional Continue button
4. **Input/Form Screen** - Scrollable form with inputs, labels, CTA at bottom
5. **Feature Showcase** - Centered illustration, feature title, description, progress dots
6. **Permission Request** - Large icon, permission explanation (WHY), allow/skip buttons

Each pattern includes:
- Complete element hierarchy
- Recommended sizing
- Proper spacing/padding
- Accessibility considerations (touch targets, contrast)

### 4. Better Element Documentation

Reorganized and expanded element type documentation:

**Before**: Brief descriptions in a long paragraph
**After**: Structured sections with:
- Clear categorization (containers vs content)
- Props explained for each type
- Common style patterns
- Critical usage notes (e.g., "scrollview MUST have explicit height")
- Examples for complex patterns

### 5. Emphasis on Explicit Constraints

Added repeated warnings throughout:

- "If react-native-web makes it look good but you didn't set explicit constraints, it WILL break on mobile"
- "Did I make an EXPLICIT choice, or am I assuming a default?"
- "The preview lies - if something looks right but you didn't set explicit constraints, it WILL break"

This addresses the specific issue you showed in the screenshots (input full width on web preview, broken on mobile).

### 6. Improved Action Documentation

Clearer explanation of single action vs multi-action:

**Single action**:
```json
"action": { "type": "navigate", "destination": "next" }
```

**Multiple actions** (run in sequence):
```json
"actions": [
  { "type": "set_variable", "variable": "user_choice", "value": "premium" },
  { "type": "navigate", "destination": "next" }
]
```

## What Was Preserved

These features from your existing system are fully preserved:

✅ **Variable system** - set_variable, {variable_name} templates, variable conditions
✅ **Multi-action support** - actions array for sequential actions
✅ **Asset references** - "asset:asset_name" for user-uploaded assets
✅ **Toggle groups** - Single-select toggle groups with automatic visual feedback
✅ **Conditional visibility** - visibleWhen for toggle groups, conditions for variables
✅ **Conditional navigation** - Navigate to different screens based on variable values
✅ **Image slots** - slotNumber, imageDescription, needsUserInput for dashboard UI
✅ **Gradient support** - backgroundGradient with linear/radial options
✅ **Correct output format** - `{"type": "generation", "message": "...", "elements": [...]}`

## What Was Removed/Fixed

From the other AI's prompt, we REMOVED:

❌ **"custom_screen" type** - Replaced with "noboard_screen" (correct for your system)
❌ **Wrapped output format** - Their `{"screen": {...}}` wrapper is wrong
❌ **Brand context variables** - `{{app_name}}`, `{{primary_color}}` not implemented yet
❌ **Single root element mandate** - Too restrictive (your system allows multiple)
❌ **390×844 hard-coded** - Made more flexible ("typical: 390pt wide")

## Integration Steps

To use the new prompts:

1. Open `/Users/oduduabasivictor/Downloads/Boarding/dashboard/app/api/generate-screen/route.ts`

2. Replace `GENERATION_PROMPT` (lines 5-120) with the content from `UPDATED_GENERATION_PROMPT.md`

3. Replace `EDIT_PROMPT` (lines 123-175) with the content from `UPDATED_EDIT_PROMPT.md`

4. Keep all the rest of the route.ts file unchanged (the API logic is correct)

## Reference Image Support (Future Enhancement)

When you're ready to integrate reference images into the AI context, add this to the system prompt builder (around line 220):

```typescript
// Add reference image context if present
if (currentScreen?.referenceImageData) {
  systemContent += `\n\nREFERENCE IMAGE:\nThe user has uploaded a reference image for this screen. This is a design mockup or inspiration image. Use it to understand the desired visual style, layout, and aesthetic. The reference image will be provided in the next message.`

  // Then include it in the messages array:
  currentMessageContent.push({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/png' as const,
      data: currentScreen.referenceImageData.replace(/^data:image\/[\w+]+;base64,/, '')
    }
  })
}
```

## Testing Recommendations

After integrating the new prompts, test these scenarios:

1. **Input width issue** (your original problem):
   - Ask AI to create a form with email input
   - Verify it generates `width: "100%"` or `alignSelf: "stretch"`
   - Test on both web preview AND actual mobile device

2. **Font size consistency**:
   - Generate a welcome screen
   - Check that all text elements have explicit fontSize values
   - Compare rendering on web vs mobile

3. **Tappable areas**:
   - Create selection screen with option cards
   - Verify all options have minHeight: 56 (or paddingVertical that achieves 44pt+)

4. **Scroll containers**:
   - Generate a long form screen
   - Verify scrollview has `flex: 1` or explicit height
   - Test scrolling works on mobile

5. **Gradient fallback**:
   - Create screen with gradient background
   - Verify it renders on mobile (actual gradient)
   - Verify preview shows solid color (accepted limitation)

6. **Variable persistence**:
   - Create selection screen with toggle options + set_variable actions
   - Navigate to next screen
   - Use {variable_name} template to display saved value

## Expected Improvements

With these prompts, the AI should:

1. ✅ Never create inputs without explicit width constraints
2. ✅ Always specify fontSize for text elements
3. ✅ Always specify dimensions for images (width + height or aspectRatio)
4. ✅ Follow better typography hierarchy (consistent sizing and weights)
5. ✅ Use better color choices (no pure black, no pure white on colors)
6. ✅ Create buttons with adequate touch targets (44pt minimum)
7. ✅ Use flexible spacers for layout instead of hardcoded positions
8. ✅ Return proper JSON format (no markdown, no wrapped output)
9. ✅ Preserve existing content when editing (only change what's requested)
10. ✅ Leverage your platform's advanced features (variables, conditionals, multi-actions)

## Questions or Issues?

If the AI starts:
- Generating incorrect output format → Check that you copied the RESPONSE FORMAT section correctly
- Creating elements without explicit sizing → Emphasize the MOBILE-FIRST VALIDATION section
- Losing content when editing → Check the EDITING RULES (CRITICAL) section
- Not using your advanced features → Verify the VARIABLES & CONDITIONAL LOGIC section is included

The prompts are designed to be comprehensive and self-contained. The AI should follow them consistently.
