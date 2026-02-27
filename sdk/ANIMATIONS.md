# 🎬 Noboarding Animations Guide

## Overview

Noboarding supports **fully OTA-updateable animations** for your onboarding screens. Update animation styles, timing, and effects instantly without App Store review.

All animations are configured via JSON and use React Native's built-in `Animated` API for optimal performance.

---

## ✨ Animation Types

### 1. Entrance Animations

Elements can animate in when the screen loads.

**Supported Types:**
- `fadeIn` - Fade from transparent to opaque
- `slideUp` - Slide up from below
- `slideDown` - Slide down from above
- `slideLeft` - Slide in from right
- `slideRight` - Slide in from left
- `scaleIn` - Scale up from small
- `none` - No animation (instant appearance)

**Configuration:**

```json
{
  "type": "vstack",
  "entrance": {
    "type": "fadeIn",
    "duration": 400,
    "delay": 200,
    "stagger": 50,
    "easing": "ease-in-out"
  },
  "children": [...]
}
```

**Parameters:**
- `type`: Animation style (required)
- `duration`: Animation duration in milliseconds (default: 400)
- `delay`: Delay before animation starts in milliseconds (default: 0)
- `stagger`: For containers - delay between each child (default: 0)
- `easing`: Timing function: `linear`, `ease-in`, `ease-out`, `ease-in-out`, `spring`

**Examples:**

```json
// Fade in welcome text
{
  "type": "text",
  "props": { "text": "Welcome!" },
  "entrance": {
    "type": "fadeIn",
    "duration": 600
  }
}

// Slide up with spring effect
{
  "type": "vstack",
  "entrance": {
    "type": "slideUp",
    "duration": 500,
    "easing": "spring"
  }
}

// Staggered list items
{
  "type": "vstack",
  "entrance": {
    "type": "fadeIn",
    "stagger": 100
  },
  "children": [
    { "type": "text", "props": { "text": "Item 1" } },
    { "type": "text", "props": { "text": "Item 2" } },
    { "type": "text", "props": { "text": "Item 3" } }
  ]
}
```

---

### 2. Interactive Animations

Elements respond to user interaction.

**Supported Types:**
- `scale` - Shrink slightly on tap
- `pulse` - Grow and shrink rhythmically
- `shake` - Shake horizontally
- `bounce` - Bounce vertically
- `none` - No animation

**Configuration:**

```json
{
  "type": "vstack",
  "interactive": {
    "type": "scale",
    "trigger": "tap",
    "duration": 200,
    "intensity": 0.95,
    "haptic": true,
    "hapticType": "light"
  },
  "action": { "type": "navigate", "destination": "next-screen" }
}
```

**Parameters:**
- `type`: Animation style (required)
- `trigger`: When to animate - `tap` or `load` (default: `tap`)
- `duration`: Animation duration in milliseconds (default: 200)
- `intensity`: Effect strength - 0-1 for scale, pixels for shake/bounce (default: 0.95 for scale, 10 for shake)
- `repeat`: Loop continuously - only for `pulse` (default: false)
- `haptic`: Trigger haptic feedback (default: false)
- `hapticType`: Haptic style - `light`, `medium`, `heavy`, `success`, `warning`, `error`

**Examples:**

```json
// Button with scale-down on tap
{
  "type": "vstack",
  "props": {},
  "interactive": {
    "type": "scale",
    "trigger": "tap",
    "intensity": 0.92,
    "haptic": true,
    "hapticType": "medium"
  },
  "action": { "type": "navigate", "destination": "next" }
}

// Continuous pulsing badge
{
  "type": "vstack",
  "interactive": {
    "type": "pulse",
    "trigger": "load",
    "repeat": true,
    "duration": 1000
  }
}

// Shake animation for errors
{
  "type": "text",
  "props": { "text": "Invalid input" },
  "interactive": {
    "type": "shake",
    "trigger": "load",
    "intensity": 8,
    "haptic": true,
    "hapticType": "error"
  }
}
```

---

### 3. Typewriter Text Animation

Text appears character-by-character with optional cursor and haptic feedback.

**Configuration:**

```json
{
  "type": "text",
  "props": {
    "text": "Welcome to BodyMaxx! Your #1 AI assistant to losing body fat sustainably."
  },
  "textAnimation": {
    "type": "typewriter",
    "speed": 25,
    "delay": 500,
    "cursor": true,
    "haptic": {
      "enabled": true,
      "type": "light",
      "frequency": "every-2"
    }
  }
}
```

**Parameters:**
- `type`: Must be `typewriter` or `none`
- `speed`: Characters per second (default: 20)
- `delay`: Delay before typing starts in milliseconds (default: 0)
- `cursor`: Show blinking cursor while typing (default: false)
- `haptic.enabled`: Trigger haptic feedback (default: false)
- `haptic.type`: Haptic style - `light`, `medium`, `heavy`
- `haptic.frequency`: How often to vibrate - `every`, `every-2`, `every-3`, `every-5`

**Examples:**

```json
// Fast typewriter with cursor
{
  "type": "text",
  "props": { "text": "Get started now!" },
  "textAnimation": {
    "type": "typewriter",
    "speed": 30,
    "cursor": true
  }
}

// Slow dramatic reveal with haptics
{
  "type": "text",
  "props": { "text": "You've completed your journey" },
  "textAnimation": {
    "type": "typewriter",
    "speed": 15,
    "delay": 1000,
    "haptic": {
      "enabled": true,
      "type": "light",
      "frequency": "every-3"
    }
  }
}
```

---

## 🎯 Best Practices

### Performance

1. **Use stagger sparingly** - Large stagger delays on long lists can feel slow
2. **Limit haptic frequency** - Use `every-2` or `every-3` for long text to avoid battery drain
3. **Disable typewriter for long text** - Typewriter works best for short, impactful messages (< 50 chars)

### UX Guidelines

1. **Entrance animations**
   - Keep duration under 500ms for most elements
   - Use `fadeIn` for subtle, professional feel
   - Use `slideUp` for content reveals
   - Use `spring` easing for playful, bouncy effects

2. **Interactive animations**
   - Always use `scale` on tap for buttons - it provides visual feedback
   - Use `pulse` for attention-grabbing elements (badges, notifications)
   - Reserve `shake` for errors and warnings
   - Keep intensity subtle (0.92-0.95 for scale)

3. **Typewriter animations**
   - Best for welcome messages, taglines, success messages
   - Speed 20-30 chars/sec feels natural
   - Use cursor for chat-like experiences
   - Haptic feedback adds tactile dimension but drains battery

4. **Combine animations thoughtfully**
   - ✅ Entrance + Interactive (fade in, then scale on tap)
   - ✅ Typewriter + Haptic (chatbot-style messages)
   - ❌ Multiple entrance animations on same screen (overwhelming)
   - ❌ Pulse + Typewriter (too many moving parts)

---

## 🚀 OTA Update Examples

### Before

```json
{
  "type": "text",
  "props": { "text": "Welcome to our app!" }
}
```

### After (No App Update Required!)

```json
{
  "type": "text",
  "props": { "text": "Welcome to our app!" },
  "entrance": {
    "type": "fadeIn",
    "duration": 600
  },
  "textAnimation": {
    "type": "typewriter",
    "speed": 25,
    "cursor": true
  }
}
```

**Result:** Your welcome text now fades in and types out character-by-character, all without submitting to the App Store!

---

## 📱 Haptic Feedback

Requires `expo-haptics` to be installed in your app:

```bash
npx expo install expo-haptics
```

If not installed, haptic animations will silently skip without errors.

**Haptic Types:**
- `light` - Subtle tap (best for typewriter, frequent events)
- `medium` - Noticeable feedback (buttons, selections)
- `heavy` - Strong impact (important actions)
- `success` - Confirmation (completed actions)
- `warning` - Attention (alerts)
- `error` - Problem notification (validation errors)

---

## 🎨 Animation Recipes

### Welcome Screen

```json
{
  "type": "vstack",
  "entrance": {
    "type": "fadeIn",
    "duration": 800
  },
  "children": [
    {
      "type": "text",
      "props": { "text": "Welcome!" },
      "textAnimation": {
        "type": "typewriter",
        "speed": 20,
        "delay": 800,
        "haptic": {
          "enabled": true,
          "type": "light",
          "frequency": "every-2"
        }
      }
    }
  ]
}
```

### Card List with Stagger

```json
{
  "type": "vstack",
  "entrance": {
    "type": "slideUp",
    "stagger": 80,
    "easing": "ease-out"
  },
  "children": [
    { "type": "vstack", "props": {} },
    { "type": "vstack", "props": {} },
    { "type": "vstack", "props": {} }
  ]
}
```

### Interactive Button

```json
{
  "type": "vstack",
  "entrance": {
    "type": "scaleIn",
    "duration": 400,
    "delay": 600
  },
  "interactive": {
    "type": "scale",
    "trigger": "tap",
    "intensity": 0.94,
    "haptic": true,
    "hapticType": "medium"
  },
  "action": { "type": "navigate", "destination": "next" }
}
```

### Error Message

```json
{
  "type": "text",
  "props": { "text": "Invalid email address" },
  "entrance": {
    "type": "fadeIn",
    "duration": 200
  },
  "interactive": {
    "type": "shake",
    "trigger": "load",
    "intensity": 10,
    "haptic": true,
    "hapticType": "error"
  }
}
```

---

## 🔧 Technical Details

### Implementation

- Uses React Native's `Animated` API (no external libraries required)
- All animations run on the native thread (60 FPS performance)
- Animation configurations stored in JSON (fully OTA updateable)
- Haptic feedback is optional (gracefully degrades if unavailable)

### Compatibility

- ✅ iOS 11+
- ✅ Android 5.0+
- ✅ Works with React Native Web (animations disabled for preview)

### Bundle Size

Zero impact - animations use built-in React Native APIs only!

---

## 🎓 Next Steps

1. **Try it out** - Add entrance animations to your first screen
2. **Experiment** - Test different timing and easing functions
3. **A/B test** - Create variants with and without animations to measure engagement
4. **Update OTA** - Push animation changes instantly to all users

**Questions?** Check the main README or contact support.
