# Visual Screen Editor - Complete Guide

## Introduction

The Visual Screen Editor lets you design beautiful, fully customized onboarding screens without writing code. Arrange elements, adjust styling, and preview changes in real-time—all updates deploy instantly to your app without App Store review.

**Inspired by the best:** This editor uses the same flexible, container-based approach that powers Superwall's paywall editor, adapted specifically for onboarding flows.

---

## Table of Contents

1. [Understanding the Layout System](#understanding-the-layout-system)
2. [The Three Core Layouts](#the-three-core-layouts)
3. [Working with Stacks](#working-with-stacks)
4. [Element Library](#element-library)
5. [Styling Elements](#styling-elements)
6. [Common Layout Patterns](#common-layout-patterns)
7. [Advanced Features](#advanced-features)
8. [Tips & Best Practices](#tips--best-practices)

---

## Understanding the Layout System

### The Container Philosophy

Every onboarding screen is built using a **container-based layout system**. Think of it like building with blocks:

- **Containers** (Stacks) hold other elements
- **Elements** are the actual content (text, images, buttons)
- **Nesting** lets you create complex layouts from simple pieces

**Key Concept:** You don't position elements with X/Y coordinates. Instead, you arrange them in containers that handle layout automatically.

### Why This Approach?

✅ **Responsive** - Automatically adapts to different screen sizes
✅ **Maintainable** - Easy to reorder and adjust
✅ **Predictable** - Behaves consistently across devices
✅ **No Code** - Visual arrangement, no coordinate math

---

## The Three Core Layouts

### 1. Vertical Stack (VStack)

**Arranges elements from top to bottom**
```
┌─────────────────────┐
│                     │
│  Element 1 (Image)  │ ← Top
│                     │
├─────────────────────┤
│  Element 2 (Text)   │
├─────────────────────┤
│  Element 3 (Text)   │
├─────────────────────┤
│ Element 4 (Button)  │ ← Bottom
│                     │
└─────────────────────┘
```

**When to use:**
- ✅ Traditional onboarding flows
- ✅ Forms with multiple fields
- ✅ Step-by-step instructions
- ✅ Most screens (this is your default choice)

**Properties:**

| Property | Description | Values |
|----------|-------------|---------|
| **Spacing** | Gap between elements | 0-100px |
| **Padding** | Internal spacing | Individual: top, right, bottom, left |
| **Horizontal Alignment** | How elements align horizontally | Leading, Center, Trailing |
| **Vertical Distribution** | How to distribute vertical space | Top, Center, Bottom, Space Between, Space Around, Space Evenly |
| **Background Color** | Container background | Color, Gradient, or Transparent |

**Example: Welcome Screen**
```
VStack (spacing: 24px, padding: 20px, alignment: center)
├─ Image (logo, 120x120)
├─ Text ("Welcome to BodyMax", size: 32, bold)
├─ Text ("AI-powered fitness tracking", size: 16, gray)
├─ Spacer (flexible height)
└─ Button ("Get Started", full width)
```

---

### 2. Horizontal Stack (HStack)

**Arranges elements from left to right**
```
┌──────────────┬──────────────┬──────────────┐
│              │              │              │
│  Element 1   │  Element 2   │  Element 3   │
│              │              │              │
└──────────────┴──────────────┴──────────────┘
   Left          Center         Right
```

**When to use:**
- ✅ Side-by-side buttons ("Skip" | "Continue")
- ✅ Icon + Label combinations
- ✅ Multi-column forms (Age | Gender)
- ✅ Feature comparisons
- ✅ Social login buttons in a row

**Properties:**

| Property | Description | Values |
|----------|-------------|---------|
| **Spacing** | Gap between elements | 0-100px |
| **Padding** | Internal spacing | Individual: top, right, bottom, left |
| **Vertical Alignment** | How elements align vertically | Top, Center, Bottom |
| **Horizontal Distribution** | How to distribute horizontal space | Leading, Center, Trailing, Space Between, Space Around, Space Evenly |
| **Background Color** | Container background | Color, Gradient, or Transparent |

**Example: Button Row**
```
HStack (spacing: 12px, distribution: space-between)
├─ Button ("Skip", style: text-link, flexible width)
└─ Button ("Continue", style: primary, flexible width)
```

**Example: Icon + Text**
```
HStack (spacing: 8px, alignment: center)
├─ Icon (checkmark, 24x24, color: green)
└─ Text ("Verified Account", size: 14)
```

---

### 3. Z-Stack (Overlay Stack)

**Layers elements on top of each other**
```
┌─────────────────────┐
│  ┌──────────────┐   │
│  │  Element 3   │   │ ← Top layer
│  │  (overlay)   │   │
│  └──────────────┘   │
│                     │
│   Element 2 (text)  │ ← Middle layer
│                     │
│  [Element 1: BG]    │ ← Bottom layer
└─────────────────────┘
```

**When to use:**
- ✅ Background images with text overlay
- ✅ Floating badges or indicators
- ✅ Logo positioned on background
- ✅ Watermarks
- ✅ Advanced compositions

**Properties:**

| Property | Description | Values |
|----------|-------------|---------|
| **Padding** | Internal spacing | Individual: top, right, bottom, left |
| **Alignment** | Where child elements position | Top-Leading, Top-Center, Top-Trailing, Center-Leading, Center, Center-Trailing, Bottom-Leading, Bottom-Center, Bottom-Trailing |
| **Background Color** | Container background | Color, Gradient, or Transparent |

**Layer Order:**
- **First element** in list = **bottom layer** (background)
- **Last element** in list = **top layer** (foreground)
- Drag elements in layer panel to reorder

**Example: Hero Screen**
```
ZStack (alignment: center)
├─ Image (background, full width/height, cover mode)
├─ Color (black overlay, 40% opacity)
└─ VStack (centered content)
   ├─ Text ("Transform Your Body", white, 36px)
   ├─ Text ("Join 1M+ users", white, 18px)
   └─ Button ("Start Free Trial")
```

**Example: Badge on Avatar**
```
ZStack (alignment: top-trailing)
├─ Image (profile photo, 120x120, circular)
└─ View (badge container, 30x30, positioned top-right)
   └─ Icon (checkmark, white on blue background)
```

---

## Working with Stacks

### Creating Your First Screen

#### Step 1: Choose Root Container

Every screen needs a **root container**. For most screens, this is a **VStack** or **ScrollView** (which contains a VStack).

**Click "+ New Screen":**
```
┌─────────────────────────────────────┐
│  Choose Root Layout                  │
├─────────────────────────────────────┤
│                                      │
│  📋 Vertical Stack                   │
│  Most common - top to bottom flow   │
│  [Select]                            │
│                                      │
│  ↔️ Horizontal Stack                 │
│  Left to right layout                │
│  [Select]                            │
│                                      │
│  📐 Z-Stack (Overlay)                │
│  Layered elements                    │
│  [Select]                            │
│                                      │
│  📜 Scroll View                      │
│  Long content that scrolls           │
│  [Select]                            │
│                                      │
└─────────────────────────────────────┘
```

**Recommendation:** Start with **Scroll View** for most screens. This gives you a scrollable VStack that works for both short and long content.

---

#### Step 2: Add Elements

Once you have your root container, start adding elements.

**Element Palette (left sidebar):**
```
┌────────────────────────┐
│  ELEMENTS              │
├────────────────────────┤
│                        │
│  Display               │
│  ├─ 📝 Text            │
│  ├─ 🖼️ Image           │
│  ├─ 🎬 Video           │
│  ├─ ✨ Lottie          │
│  ├─ 🎨 Icon            │
│  ├─ ➖ Divider         │
│  └─ ⬜ Spacer          │
│                        │
│  Input                 │
│  ├─ 📝 Text Input      │
│  ├─ 🔘 Button          │
│  ├─ ☑️ Checkbox        │
│  ├─ 🔘 Radio Group     │
│  ├─ 🎚️ Slider          │
│  ├─ 📅 Date Picker     │
│  └─ 🔄 Toggle          │
│                        │
│  Layout                │
│  ├─ ⬇️ VStack          │
│  ├─ ➡️ HStack          │
│  ├─ 📐 ZStack          │
│  ├─ 📜 Scroll View     │
│  ├─ 🔄 Carousel        │
│  └─ ⊞ Grid             │
│                        │
│  Special               │
│  ├─ ● Progress Dots    │
│  ├─ 📸 Image Picker    │
│  ├─ ✍️ Signature       │
│  └─ 📍 Map             │
│                        │
└────────────────────────┘
```

**To add an element:**
1. Click element type in palette
2. Click on canvas where you want it
3. OR drag element onto canvas

---

#### Step 3: Arrange Elements

**Layer Panel (right sidebar):**

Shows your screen's structure as a tree:
```
┌────────────────────────────────┐
│  LAYERS                         │
├────────────────────────────────┤
│                                │
│  📜 Screen Root (ScrollView)   │ ← Currently selected
│  └─ ⬇️ VStack                  │
│     ├─ 🖼️ Background Image     │
│     ├─ ⬇️ Content Stack        │
│     │  ├─ 📝 Title Text        │
│     │  ├─ 📝 Subtitle Text     │
│     │  └─ ⬇️ Features Stack    │
│     │     ├─ ➡️ Feature 1      │
│     │     │  ├─ 🎨 Icon        │
│     │     │  └─ 📝 Text        │
│     │     └─ ➡️ Feature 2      │
│     │        ├─ 🎨 Icon        │
│     │        └─ 📝 Text        │
│     └─ ➡️ Buttons              │
│        ├─ 🔘 Skip Button       │
│        └─ 🔘 Continue Button   │
│                                │
│  [👁️] [🔒] [🗑️]              │ ← Actions
│                                │
└────────────────────────────────┘
```

**Layer Actions:**
- **👁️ Eye icon** - Hide/show element
- **🔒 Lock icon** - Prevent editing
- **🗑️ Trash icon** - Delete element
- **Drag handle** - Reorder by dragging

**Keyboard Shortcuts:**
- **Delete** - Remove selected element
- **Cmd+D** - Duplicate element
- **Cmd+C/V** - Copy/paste element
- **Cmd+Z** - Undo
- **Cmd+Shift+Z** - Redo
- **Tab** - Select next element
- **Shift+Tab** - Select previous element

---

### Nesting Stacks (Creating Complex Layouts)

The power comes from **nesting stacks inside other stacks**.

#### Example 1: Welcome Screen with Centered Content

**Goal:** Logo and text centered vertically, buttons at bottom

**Structure:**
```
VStack (root)
├─ Spacer (flex: 1) ← Pushes content down
├─ VStack (content, centered)
│  ├─ Image (logo, 80x80)
│  ├─ Text (title, 28px bold)
│  └─ Text (subtitle, 16px)
├─ Spacer (flex: 1) ← Pushes content up (centers it)
└─ HStack (buttons)
   ├─ Button (Skip)
   └─ Button (Continue)
```

**Visual Result:**
```
┌─────────────────────┐
│                     │
│                     │ ← Flexible space
│      [Logo]         │
│   Welcome to App    │
│  Get started today  │
│                     │
│                     │ ← Flexible space
│  [Skip] [Continue]  │
└─────────────────────┘
```

**How to build:**
1. Create VStack (root)
2. Add Spacer (set flex: 1)
3. Add nested VStack for content
4. Inside content VStack: add Image, Text, Text
5. Add another Spacer (flex: 1)
6. Add HStack for buttons
7. Inside button HStack: add two Buttons

---

#### Example 2: Feature Cards Grid

**Goal:** 2x2 grid of feature cards

**Structure:**
```
VStack (root)
├─ Text (section title)
├─ VStack (rows container, spacing: 16)
│  ├─ HStack (row 1, spacing: 16)
│  │  ├─ VStack (card 1)
│  │  │  ├─ Icon
│  │  │  ├─ Text (title)
│  │  │  └─ Text (description)
│  │  └─ VStack (card 2)
│  │     ├─ Icon
│  │     ├─ Text (title)
│  │     └─ Text (description)
│  └─ HStack (row 2, spacing: 16)
│     ├─ VStack (card 3)
│     │  └─ ...
│     └─ VStack (card 4)
│        └─ ...
└─ Button (Continue)
```

**Visual Result:**
```
┌─────────────────────────┐
│  Why Choose BodyMax?    │
│                         │
│  ┌─────────┬─────────┐  │
│  │ 📊 Track│ 🎯 Goals│  │
│  │ Progress│  Set &  │  │
│  │ Daily   │ Achieve │  │
│  └─────────┴─────────┘  │
│  ┌─────────┬─────────┐  │
│  │ 🏆 Share│ 📈 Stats│  │
│  │ Results │ Detailed│  │
│  │  Social │ Reports │  │
│  └─────────┴─────────┘  │
│                         │
│     [Get Started]       │
└─────────────────────────┘
```

---

#### Example 3: Full-Screen Background with Overlay

**Goal:** Background image covering entire screen with content layered on top

**Structure:**
```
ZStack (root, alignment: center)
├─ Image (background, width: 100%, height: 100%, mode: cover)
├─ Color (black overlay, opacity: 50%)
└─ VStack (content, centered, padding: 20)
   ├─ Spacer
   ├─ Text (title, white, bold, 36px)
   ├─ Text (subtitle, white, 18px)
   ├─ Button (CTA, white background)
   └─ Spacer
```

**Visual Result:**
```
┌─────────────────────────┐
│ [Photo Background]      │
│  [Darkened Overlay]     │
│                         │
│                         │
│    Transform Your       │
│       Fitness           │
│  Track. Improve. Grow.  │
│                         │
│    [Start Free Trial]   │
│                         │
│                         │
└─────────────────────────┘
```

---

## Element Library

### Display Elements

#### Text

**Purpose:** Display any text content

**Properties:**

| Property | Description | Options/Range |
|----------|-------------|---------------|
| Content | The text to display | Any string, supports `{variables}` |
| Font Family | Typeface | System, SF Pro, Custom uploads |
| Font Size | Text size | 8-72px |
| Font Weight | Thickness | Thin, Light, Regular, Medium, Semibold, Bold, Heavy, Black |
| Line Height | Space between lines | 1.0-3.0 or Auto |
| Letter Spacing | Space between characters | -2 to 5px |
| Color | Text color | Any color, supports gradients |
| Opacity | Transparency | 0-100% |
| Text Align | Horizontal alignment | Left, Center, Right, Justify |
| Text Transform | Case modification | None, Uppercase, Lowercase, Capitalize |
| Text Decoration | Underline/strikethrough | None, Underline, Strikethrough |
| Max Width | Constrain width | px or % |
| Margin | External spacing | Individual sides |
| Padding | Internal spacing | Individual sides |

**Common Use Cases:**
- Headlines (32-48px, Bold)
- Body text (16-18px, Regular)
- Captions (12-14px, Regular)
- Labels (14-16px, Medium)

**Dynamic Variables:**
Insert user data with `{variable_name}`:
- `{user.name}` - User's name
- `{user.email}` - User's email
- `{app.name}` - Your app name
- `{goal.name}` - Selected goal

---

#### Image

**Purpose:** Display static images

**Properties:**

| Property | Description | Options/Range |
|----------|-------------|---------------|
| Source URL | Image location | Upload or paste URL |
| Width | Image width | px, %, or auto |
| Height | Image height | px, %, or auto |
| Aspect Ratio | Lock proportions | 1:1, 4:3, 16:9, 21:9, Custom |
| Content Mode | How image fills space | Fill, Fit, Cover, Stretch |
| Border Radius | Rounded corners | 0-100px or % |
| Border Width | Border thickness | 0-10px |
| Border Color | Border color | Any color |
| Opacity | Transparency | 0-100% |
| Tint Color | Overlay color (for icons) | Any color |
| Shadow | Drop shadow | X, Y, Blur, Color, Opacity |
| Margin | External spacing | Individual sides |

**Common Patterns:**

**Circular Avatar:**
```
Width: 120px
Height: 120px
Aspect Ratio: 1:1
Border Radius: 50% (or 60px)
Content Mode: Cover
```

**Full-Width Hero:**
```
Width: 100%
Height: 300px
Content Mode: Cover
Border Radius: 0px
```

**Icon:**
```
Width: 48px
Height: 48px
Tint Color: #FF6B6B
Content Mode: Fit
```

---

#### Video

**Purpose:** Embedded video player

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Source URL | Video file URL | .mp4, .mov |
| Poster Image | Thumbnail before play | Image URL |
| Autoplay | Start automatically | Yes/No |
| Loop | Repeat when finished | Yes/No |
| Muted | Audio off by default | Yes/No |
| Controls | Show play/pause controls | Yes/No |
| Width/Height | Video dimensions | px or % |
| Border Radius | Rounded corners | 0-100px |

**Best Practices:**
- Keep videos under 30 seconds for onboarding
- Always provide poster image
- Host on CDN for fast loading
- Test on cellular data

---

#### Lottie (Animation)

**Purpose:** Vector animations (smaller than video)

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Source URL | Lottie JSON file | URL to .json file |
| Autoplay | Start on load | Yes/No |
| Loop | Repeat animation | Yes/No |
| Speed | Playback speed | 0.5-3.0x |
| Width/Height | Animation size | px or % |

**Where to find Lottie animations:**
- LottieFiles.com
- Custom from designer

---

#### Icon

**Purpose:** Scalable vector icons

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Icon Library | Icon source | FontAwesome, Material, SF Symbols |
| Icon Name | Which icon | Search by name |
| Size | Icon size | 16-128px |
| Color | Icon color | Any color |
| Background | Icon background | Color, gradient, transparent |
| Border Radius | Rounded background | 0-100px |
| Padding | Space around icon | 0-50px |

**Common Sizes:**
- Small: 16-20px (inline with text)
- Medium: 24-32px (feature icons)
- Large: 48-64px (hero icons)

---

#### Spacer

**Purpose:** Empty space for layout control

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Height | Fixed height | px (in VStack) |
| Width | Fixed width | px (in HStack) |
| Flex | Flexible size | 0-10 (fills available space) |

**Use Cases:**
- Push content to center (flex spacers above and below)
- Create gaps between sections
- Align elements to edges

---

#### Divider

**Purpose:** Horizontal or vertical line

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Orientation | Direction | Horizontal, Vertical |
| Thickness | Line width | 1-10px |
| Color | Line color | Any color |
| Opacity | Transparency | 0-100% |
| Margin | Spacing around | Individual sides |

**Common Uses:**
- Section separators
- Visual breaks
- Form field dividers

---

### Input Elements

#### Text Input

**Purpose:** Single-line text field

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | Used for data collection |
| Label | Field label | Text above or inside input |
| Placeholder | Hint text | Gray text when empty |
| Required | Must be filled | Yes/No |
| Initial Value | Pre-filled text | Any string |
| Keyboard Type | Keyboard layout | Default, Email, Number, Phone, URL |
| Autocomplete | Fill suggestions | Name, Email, etc. |
| Secure | Hide text (passwords) | Yes/No |
| Max Length | Character limit | Number |
| Validation | Rules | Email, Phone, Custom regex |

**Styling:**

| Property | Description | Options |
|----------|-------------|---------|
| Font Size | Input text size | 14-20px |
| Font Weight | Input text weight | Regular, Medium, Semibold |
| Text Color | Input text color | Any color |
| Placeholder Color | Hint color | Light gray recommended |
| Background | Field background | Color or transparent |
| Border Width | Border thickness | 0-5px |
| Border Color | Border color | Any color |
| Border Radius | Rounded corners | 0-20px |
| Focus Border Color | Border when active | Usually accent color |
| Padding | Internal spacing | 8-16px |
| Height | Field height | 40-56px |

**Validation States:**

| State | Border Color | Icon | Message |
|-------|-------------|------|---------|
| Default | Gray | None | - |
| Focus | Accent color | None | - |
| Valid | Green | ✓ | - |
| Error | Red | ✗ | Error message |

**Example: Standard Text Input**
```
Label: "Full Name"
Placeholder: "Enter your name"
Required: Yes
Background: #F5F5F5
Border: 1px solid #E0E0E0
Border Radius: 8px
Padding: 12px
Height: 48px
Focus Border: #FF6B6B
```

---

#### Button

**Purpose:** Tap target for actions

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Text | Button label | Any string |
| Icon | Optional icon | Icon name, position (left/right) |
| Action | What happens on tap | Next screen, Skip, Submit, Custom event |
| Loading State | Show spinner | Yes/No |

**Styling:**

| Property | Description | Options |
|----------|-------------|---------|
| Font Size | Text size | 14-20px |
| Font Weight | Text weight | Medium, Semibold, Bold |
| Text Color | Label color | Any color |
| Background Color | Fill color | Solid or gradient |
| Border Width | Border thickness | 0-5px |
| Border Color | Border color | Any color |
| Border Radius | Rounded corners | 0-100px |
| Padding Vertical | Top/bottom space | 10-20px |
| Padding Horizontal | Left/right space | 20-50px |
| Width | Button width | Auto, Full Width, Fixed px |
| Shadow | Drop shadow | X, Y, Blur, Color, Opacity |

**Button States:**

| State | Appearance |
|-------|------------|
| Default | Normal style |
| Pressed | Darker (90% opacity or darker shade) |
| Disabled | Grayed out (50% opacity) |
| Loading | Show spinner, disable interaction |

**Button Styles (Pre-defined):**

**Primary:**
```
Background: #FF6B6B (brand color)
Text Color: #FFFFFF
Font Weight: Semibold
Border Radius: 12px
Padding: 16px vertical, 40px horizontal
Shadow: 0px 4px 12px rgba(0,0,0,0.15)
```

**Secondary (Outline):**
```
Background: Transparent
Text Color: #FF6B6B
Border: 2px solid #FF6B6B
Border Radius: 12px
Padding: 14px vertical, 40px horizontal
Shadow: None
```

**Text Link:**
```
Background: Transparent
Text Color: #007AFF
Font Weight: Regular
Text Decoration: Underline
Padding: 8px vertical
Shadow: None
```

**Destructive:**
```
Background: #FF3B30 (red)
Text Color: #FFFFFF
Font Weight: Semibold
Border Radius: 12px
Padding: 16px vertical, 40px horizontal
```

---

#### Checkbox

**Purpose:** Single true/false selection

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | For data collection |
| Label | Text next to checkbox | String |
| Initial State | Default value | Checked/Unchecked |
| Required | Must be checked | Yes/No |

**Styling:**

| Property | Options |
|----------|---------|
| Size | 16-32px |
| Check Color | Any color |
| Border Color | Any color |
| Background (checked) | Any color |
| Border Radius | 0-8px (0 = square, 50% = circle) |

---

#### Checkbox Group

**Purpose:** Multiple checkboxes (multi-select)

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | For data collection |
| Label | Group title | String |
| Options | List of choices | Array of {value, label} |
| Required | Must select at least one | Yes/No |
| Min Selections | Minimum choices | Number |
| Max Selections | Maximum choices | Number |

**Example:**
```
Label: "Fitness Goals"
Options:
  - {value: "lose_weight", label: "Lose Weight"}
  - {value: "build_muscle", label: "Build Muscle"}
  - {value: "improve_endurance", label: "Improve Endurance"}
  - {value: "flexibility", label: "Increase Flexibility"}
Min Selections: 1
Max Selections: 3
```

---

#### Radio Group

**Purpose:** Single selection from multiple options

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | For data collection |
| Label | Group title | String |
| Options | List of choices | Array of {value, label} |
| Required | Must select one | Yes/No |
| Initial Selection | Default value | Option value |

**Example:**
```
Label: "Gender"
Options:
  - {value: "male", label: "Male"}
  - {value: "female", label: "Female"}
  - {value: "other", label: "Other"}
  - {value: "prefer_not", label: "Prefer not to say"}
Required: No
```

**Layout Options:**
- Vertical (stacked)
- Horizontal (row)
- Grid (2 or 3 columns)

---

#### Slider

**Purpose:** Select value from range

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | For data collection |
| Label | Field label | String |
| Min Value | Minimum | Number |
| Max Value | Maximum | Number |
| Step | Increment | Number (1, 5, 10, etc.) |
| Initial Value | Starting position | Number |
| Show Value | Display current number | Yes/No |
| Unit | Value suffix | "kg", "lbs", "cm", etc. |

**Styling:**

| Property | Options |
|----------|---------|
| Track Color | Any color |
| Fill Color | Any color (filled portion) |
| Thumb Color | Any color (draggable handle) |
| Thumb Size | 16-32px |

**Example: Height Selector**
```
Label: "Height"
Min: 100
Max: 250
Step: 1
Initial: 170
Show Value: Yes
Unit: "cm"
```

---

#### Dropdown (Select)

**Purpose:** Choose from dropdown list

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | For data collection |
| Label | Field label | String |
| Placeholder | Hint when empty | String |
| Options | List of choices | Array of {value, label} |
| Required | Must select | Yes/No |
| Searchable | Filter options | Yes/No |

**Example:**
```
Label: "Country"
Placeholder: "Select your country"
Options: [{value: "us", label: "United States"}, ...]
Searchable: Yes
```

---

#### Date Picker

**Purpose:** Select date/time

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | For data collection |
| Label | Field label | String |
| Mode | What to pick | Date, Time, Date+Time |
| Min Date | Earliest allowed | Date |
| Max Date | Latest allowed | Date |
| Initial Date | Default selection | Date |

**Example: Birthday Picker**
```
Label: "Birthday"
Mode: Date
Max Date: Today (must be 13+ years old)
Initial Date: 18 years ago
```

---

#### Toggle Switch

**Purpose:** On/off switch

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | For data collection |
| Label | Switch label | String |
| Initial State | Default | On/Off |

**Styling:**

| Property | Options |
|----------|---------|
| On Color | Any color |
| Off Color | Any color |
| Thumb Color | Any color |

---

#### Image Picker

**Purpose:** Upload or select image

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| ID | Unique identifier | For data collection |
| Label | Field label | String |
| Placeholder Image | Shown before selection | Image URL |
| Shape | Preview shape | Rectangle, Circle |
| Max Size | File size limit | MB |
| Aspect Ratio | Crop ratio | Free, Square, 4:3, 16:9 |

**Example: Profile Photo**
```
Label: "Profile Photo"
Placeholder: Default avatar image
Shape: Circle
Size: 120x120px
Aspect Ratio: Square (1:1)
Max Size: 5MB
```

---

### Layout Elements

#### Scroll View

**Purpose:** Scrollable container for long content

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Direction | Scroll direction | Vertical, Horizontal |
| Show Scrollbar | Visibility | Yes/No/Auto |
| Bounce | Elastic scroll | Yes/No (iOS only) |

**When to use:**
- Forms longer than screen height
- Long text content
- Multiple sections

**Contains:** Usually a single VStack with all content

---

#### Carousel

**Purpose:** Swipeable slides

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Auto Advance | Automatic sliding | Yes/No |
| Interval | Time between slides | Seconds |
| Loop | Restart after last | Yes/No |
| Show Indicators | Pagination dots | Yes/No |
| Indicator Style | Dot appearance | Circle, Dash, Custom |

**Each Slide:** Can be any element or stack

**Example: Feature Showcase**
```
Carousel (3 slides, auto-advance: No, indicators: Yes)
├─ Slide 1 (VStack)
│  ├─ Image (feature 1 screenshot)
│  ├─ Text (title)
│  └─ Text (description)
├─ Slide 2 (VStack)
│  └─ ...
└─ Slide 3 (VStack)
   └─ ...
```

---

#### Grid

**Purpose:** Multi-column layout

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Columns | Number of columns | 2-4 |
| Row Spacing | Gap between rows | 0-50px |
| Column Spacing | Gap between columns | 0-50px |
| Equal Height | Make all cells same height | Yes/No |

**Each Cell:** Can be any element or stack

**Example: Icon Grid**
```
Grid (2 columns, spacing: 16px)
├─ Cell 1 (VStack, centered)
│  ├─ Icon (track icon)
│  └─ Text ("Track Progress")
├─ Cell 2 (VStack, centered)
│  ├─ Icon (goal icon)
│  └─ Text ("Set Goals")
├─ Cell 3 (VStack, centered)
│  └─ ...
└─ Cell 4 (VStack, centered)
   └─ ...
```

---

### Special Elements

#### Progress Indicator

**Purpose:** Show position in multi-screen flow

**Properties:**

| Property | Description | Options |
|----------|-------------|---------|
| Total Steps | Number of screens | Number |
| Current Step | Active screen | Number (1-based) |
| Style | Visual style | Dots, Line, Numeric |
| Active Color | Current step color | Any color |
| Inactive Color | Other steps color | Any color |

**Styles:**

**Dots:**
```
● ● ○ ○ ○  (step 2 of 5)
```

**Line:**
```
━━━━━━━━░░░░░░░░  (40% complete)
```

**Numeric:**
```
2 / 5
```

---

## Styling Elements

### Typography Styling

#### Font Properties

**Font Family:**
- **System** - Native iOS/Android fonts (SF Pro, Roboto)
- **Custom** - Upload .ttf or .otf files

**Font Size:**
- Heading 1: 32-48px
- Heading 2: 24-32px
- Heading 3: 20-24px
- Body: 16-18px
- Caption: 12-14px

**Font Weight:**
| Weight | When to Use |
|--------|-------------|
| Thin (100) | Large display text only |
| Light (300) | Subtle secondary text |
| Regular (400) | Body text, most text |
| Medium (500) | Emphasized text |
| Semibold (600) | Headings, buttons |
| Bold (700) | Important headings |
| Heavy (800) | Rarely - very large text |
| Black (900) | Rarely - display text |

**Line Height:**
- Headlines: 1.1-1.3
- Body text: 1.4-1.6
- Captions: 1.3-1.4

**Letter Spacing:**
- Negative (-1 to -2px): Tight headlines
- Zero: Most text
- Positive (1-3px): Uppercase buttons, labels

---

#### Text Appearance

**Color:**
- Hex: #FF6B6B
- RGB: rgb(255, 107, 107)
- Gradient: Linear or radial

**Opacity:**
- Primary text: 100%
- Secondary text: 70-80%
- Disabled text: 40-50%

**Text Align:**
- Left: Default for paragraphs
- Center: Headlines, buttons
- Right: Rarely used
- Justify: Long text blocks

**Text Transform:**
- None: Most text
- Uppercase: Buttons, labels
- Lowercase: Rarely
- Capitalize: Titles

---

### Color Styling

#### Background Colors

**Solid Colors:**
```
Background: #FFFFFF
```

**Linear Gradients:**
```
Type: Linear
Colors: [#FF6B6B, #FF8E53]
Angle: 135° (diagonal)
Stops: [0%, 100%]
```

**Radial Gradients:**
```
Type: Radial
Colors: [#FF6B6B, #FF8E53]
Center: [50%, 50%]
Radius: 100%
```

**Common Gradient Patterns:**

**Sunrise:**
```
Colors: [#FF512F, #F09819]
Angle: 135°
```

**Ocean:**
```
Colors: [#2E3192, #1BFFFF]
Angle: 45°
```

**Sunset:**
```
Colors: [#FF6B6B, #FFE66D]
Angle: 180°
```

---

#### Border Styling

**Border Width:**
- Hairline: 0.5-1px
- Standard: 1-2px
- Thick: 3-5px

**Border Color:**
- Subtle: Light gray (#E0E0E0)
- Visible: Medium gray (#CCCCCC)
- Accent: Brand color

**Border Radius:**
- Square: 0px
- Slight: 4-8px
- Rounded: 12-16px
- Pill: 100px or 50%
- Circle: 50% (with equal width/height)

---

### Spacing Styling

#### Margin (External Spacing)

**Individual Sides:**
```
Margin Top: 20px
Margin Right: 0px
Margin Bottom: 24px
Margin Left: 0px
```

**Shorthand:**
```
Margin: 20px (all sides)
Margin: 20px 16px (vertical | horizontal)
Margin: 20px 16px 24px (top | horizontal | bottom)
Margin: 20px 16px 24px 16px (top | right | bottom | left)
```

**Common Values:**
- Tight: 8px
- Standard: 16px
- Comfortable: 24px
- Spacious: 32px

---

#### Padding (Internal Spacing)

**Same syntax as margin**

**Common Button Padding:**
- Compact: 10px vertical, 20px horizontal
- Standard: 14px vertical, 32px horizontal
- Large: 18px vertical, 48px horizontal

**Common Container Padding:**
- Mobile: 16-20px
- Tablet: 24-32px

---

### Shadow Styling

**Shadow Properties:**

| Property | Description | Range |
|----------|-------------|-------|
| X Offset | Horizontal position | -20 to 20px |
| Y Offset | Vertical position | -20 to 20px |
| Blur | Softness | 0-50px |
| Spread | Size expansion | -10 to 10px |
| Color | Shadow color | Any color |
| Opacity | Transparency | 0-100% |

**Shadow Presets:**

**Subtle:**
```
X: 0px
Y: 2px
Blur: 4px
Spread: 0px
Color: #000000
Opacity: 8%
```

**Standard:**
```
X: 0px
Y: 4px
Blur: 12px
Spread: 0px
Color: #000000
Opacity: 15%
```

**Heavy:**
```
X: 0px
Y: 8px
Blur: 24px
Spread: 0px
Color: #000000
Opacity: 20%
```

---

### Responsive Design

#### Breakpoint System

Your designs automatically adapt to different screen sizes:

| Breakpoint | Devices | Width |
|-----------|---------|-------|
| Small | iPhone SE, 8, mini | 320-375px |
| Medium | iPhone 13, 14, Pro | 390-414px |
| Large | iPhone Pro Max, iPad | 428-768px |

#### Per-Breakpoint Overrides

**How it works:**
1. Design for **Medium** (default)
2. Switch to **Small** or **Large** preview
3. Adjust any property for that size
4. Property shows 📱 icon = breakpoint-specific

**Common Adjustments:**

**Small Screens:**
- Reduce font sizes (title: 28px → 24px)
- Reduce padding (20px → 16px)
- Stack elements vertically (HStack → VStack)
- Hide non-essential elements

**Large Screens:**
- Increase max-width constraints
- Add more padding
- Switch to multi-column layouts

**Example:**
```
Title Text:
Medium: Font Size 32px, Margin Bottom 16px
Small:  Font Size 24px, Margin Bottom 12px ← Override
Large:  Font Size 40px, Margin Bottom 20px ← Override
```

---

### Dark Mode Support

#### Enabling Dark Mode

Toggle "Support Dark Mode" in screen settings.

#### Color Adaptation

**Semantic Colors (Auto-adapt):**
- Text Color → Automatically inverts
- Background → Automatically inverts
- Border → Automatically adjusts

**Custom Colors (Manual):**
Specify light and dark variants:
```
Background:
  Light Mode: #FFFFFF
  Dark Mode: #1A1A1A

Text:
  Light Mode: #1A1A1A
  Dark Mode: #FFFFFF

Accent:
  Light Mode: #FF6B6B
  Dark Mode: #FF8888 (lighter for dark bg)
```

**Preview Toggle:**
Switch between light/dark in editor to test both modes.

---

### Animation Styling

#### Entrance Animations

When element first appears:

**Types:**
- **Fade In** - Opacity 0 → 100%
- **Slide In** - From top, bottom, left, or right
- **Scale In** - From 0% to 100% size
- **Bounce In** - Spring animation

**Properties:**

| Property | Description | Range |
|----------|-------------|-------|
| Duration | Animation length | 0.1-2.0 seconds |
| Delay | Wait before starting | 0-2.0 seconds |
| Easing | Speed curve | Linear, Ease In, Ease Out, Ease In-Out, Spring |

**Example: Stagger Effect**
```
Title: Fade In, Duration 0.3s, Delay 0s
Subtitle: Fade In, Duration 0.3s, Delay 0.1s
Button: Slide In (bottom), Duration 0.4s, Delay 0.2s
```

---

#### Interactive Animations

**On Tap (Buttons):**
- Scale: 95% (slight shrink)
- Opacity: 80%
- Background: Darken 10%

**On Scroll (Advanced):**
- Parallax: Move at different speed
- Fade: Opacity based on scroll position
- Scale: Size based on scroll position

---

## Common Layout Patterns

### Pattern 1: Centered Hero Screen

**Use for:** Welcome screens, splash screens

**Structure:**
```
VStack (root, alignment: center, distribution: space-between)
├─ Spacer (flex: 1)
├─ VStack (content, spacing: 24px, alignment: center)
│  ├─ Image (logo, 100x100)
│  ├─ Text (title, 36px bold, center)
│  └─ Text (subtitle, 18px, center, gray)
├─ Spacer (flex: 1)
└─ Button (CTA, full width, margin: 20px)
```

**Visual:**
```
┌─────────────────────┐
│                     │
│                     │
│      [Logo]         │
│   Welcome to App    │
│  Your tagline here  │
│                     │
│                     │
│  [Get Started Free] │
└─────────────────────┘
```

---

### Pattern 2: Full-Screen Background + Overlay

**Use for:** Premium feel, photo-based onboarding

**Structure:**
```
ZStack (root)
├─ Image (background, width: 100%, height: 100%, mode: cover)
├─ Color (overlay, black 40% opacity)
└─ VStack (content, padding: 20px)
   ├─ Spacer
   ├─ Text (title, white, 40px bold)
   ├─ Text (subtitle, white, 18px)
   ├─ Spacer
   └─ Button (CTA, white background, black text)
```

---

### Pattern 3: Form with Sections

**Use for:** Profile setup, multi-step forms

**Structure:**
```
ScrollView
└─ VStack (spacing: 32px, padding: 20px)
   ├─ Text ("Personal Info", 24px bold)
   ├─ VStack (spacing: 16px)
   │  ├─ TextInput (Name)
   │  ├─ HStack (spacing: 12px)
   │  │  ├─ TextInput (Age, flex: 1)
   │  │  └─ Dropdown (Gender, flex: 1)
   │  └─ TextInput (Email)
   ├─ Divider
   ├─ Text ("Preferences", 24px bold)
   ├─ CheckboxGroup (Goals)
   ├─ Spacer (flex: 1)
   └─ Button (Continue, full width)
```

---

### Pattern 4: Feature Cards (2x2 Grid)

**Use for:** Showcasing app features

**Structure:**
```
VStack (spacing: 24px, padding: 20px)
├─ Text (section title, 28px bold)
├─ VStack (rows, spacing: 16px)
│  ├─ HStack (row 1, spacing: 16px)
│  │  ├─ VStack (card 1, background: white, padding: 20px, radius: 12px)
│  │  │  ├─ Icon (48px, blue)
│  │  │  ├─ Text (title, 18px bold)
│  │  │  └─ Text (description, 14px, gray)
│  │  └─ VStack (card 2, ...)
│  └─ HStack (row 2, spacing: 16px)
│     ├─ VStack (card 3, ...)
│     └─ VStack (card 4, ...)
└─ Button (Continue)
```

---

### Pattern 5: Horizontal Carousel

**Use for:** Feature showcase, tutorials

**Structure:**
```
VStack (root)
├─ Text (title, 28px bold, center)
├─ Carousel (height: 400px)
│  ├─ Slide 1
│  │  └─ VStack (centered)
│  │     ├─ Image (300x300)
│  │     ├─ Text (title, 24px bold)
│  │     └─ Text (description, 16px)
│  ├─ Slide 2
│  └─ Slide 3
├─ PageControl (dots, 3 pages)
└─ HStack (buttons)
   ├─ Button (Skip, text link)
   └─ Button (Next, primary)
```

---

### Pattern 6: Split Screen (Image + Content)

**Use for:** Feature details, testimonials

**Structure:**
```
VStack (root)
├─ Image (hero, full width, height: 50%)
└─ VStack (content, padding: 20px)
   ├─ Text (title, 24px bold)
   ├─ Text (description, 16px)
   ├─ Spacer
   └─ Button (CTA)
```

---

## Advanced Features

### Dynamic Variables

Insert user data dynamically:

**Available Variables:**
- `{user.name}` - User's first name
- `{user.email}` - User's email
- `{user.age}` - User's age
- `{app.name}` - Your app name
- `{current_step}` - Current screen number
- `{total_steps}` - Total screen count

**Example:**
```
Text: "Welcome back, {user.name}!"
Text: "Step {current_step} of {total_steps}"
```

---

### Conditional Display

Show/hide elements based on conditions:

**Conditions:**
- User has email
- User age > 18
- User selected goal = "weight_loss"
- Platform = iOS
- Dark mode enabled

**Example:**
```
Element: Premium Badge
Condition: user.plan = "premium"
Result: Only shows for premium users
```

---

### Custom Fonts

**Upload fonts:**
1. Go to Settings → Fonts
2. Upload .ttf or .otf file
3. Font appears in Font Family dropdown

**Best Practices:**
- Upload web-optimized fonts
- Include regular, bold, and italic weights
- Test on actual devices

---

### Component Library (Reusable Patterns)

**Save layouts as components:**

1. Design a card/section
2. Click "Save as Component"
3. Name it (e.g., "Feature Card")
4. Reuse in other screens

**Benefits:**
- Consistency across screens
- Update once, changes everywhere
- Speed up design

---

## Tips & Best Practices

### Typography Tips

✅ **Do:**
- Use **2-3 font sizes** (creates hierarchy without chaos)
- Maintain **consistent font weights** (Regular for body, Semibold for headings)
- Ensure **4.5:1 contrast ratio** minimum (WCAG AA accessibility)
- Use **line height 1.4-1.6** for body text (readability)
- Use **letter spacing 1-2px** for uppercase labels

❌ **Don't:**
- Mix more than 2 font families (looks amateurish)
- Use font size < 16px for body text (hard to read on mobile)
- Use pure black (#000000) on pure white (harsh, causes eye strain)
- Use all caps for long paragraphs (hard to read)

**Recommended Scale:**
```
H1: 32-36px, Bold
H2: 24-28px, Semibold
H3: 20-22px, Semibold
Body: 16-18px, Regular
Caption: 12-14px, Regular
```

---

### Color Tips

✅ **Do:**
- Use a **consistent color palette** (2-3 brand colors max)
- Create **lighter/darker shades** of main colors (tints/shades)
- **Test in dark mode** (colors may need adjustment)
- Consider **colorblind users** (don't rely solely on red/green)
- Use **semantic colors** (success: green, error: red, warning: yellow)

❌ **Don't:**
- Use rainbow colors randomly (unprofessional)
- Use low contrast (accessibility issue, hard to read)
- Rely only on color to convey information (use icons + color)
- Use more than 3-4 colors (overwhelming)

**Recommended Palette:**
```
Primary: #FF6B6B (brand color - CTAs, highlights)
Secondary: #4ECDC4 (accents)
Success: #51CF66 (positive actions)
Error: #FF6B6B (errors, destructive)
Warning: #FFD93D (warnings)

Neutrals:
  Text: #1A1A1A
  Secondary Text: #666666
  Border: #E0E0E0
  Background: #F5F5F5
```

---

### Spacing Tips

✅ **Do:**
- Use a **spacing scale** (8px, 16px, 24px, 32px, 40px, 48px)
- Use **more spacing** for important elements (makes them stand out)
- Balance **white space** (don't cram everything)
- Use **consistent spacing** throughout (8px or 16px, not random)

❌ **Don't:**
- Use random values (13px, 27px, 35px - inconsistent)
- Cram everything together (claustrophobic)
- Use too much spacing (feels disconnected)

**8-Point Grid System:**
```
Tight: 8px
Standard: 16px
Comfortable: 24px
Spacious: 32px
Very spacious: 40px+
```

---

### Button Tips

✅ **Do:**
- Make tap targets **at least 44x44px** (Apple HIG recommendation)
- Use **action-oriented labels** ("Get Started", "Continue", "Save")
- Distinguish **primary vs secondary** buttons (visual hierarchy)
- Show **loading state** during actions (spinner + disabled)
- Use **icon + text** for clarity (when appropriate)

❌ **Don't:**
- Use tiny buttons < 40px (hard to tap)
- Use vague labels ("Submit", "OK", "Click Here")
- Make all buttons look the same (no hierarchy)
- Use more than 2 CTAs per screen (decision paralysis)

**Button Hierarchy:**
```
Primary: Full color, prominent (1 per screen max)
Secondary: Outline or ghost (supporting action)
Tertiary: Text link (minor action)
```

---

### Image Tips

✅ **Do:**
- **Optimize image sizes** (use appropriate resolution for display size)
- Use **modern formats** (WebP > JPG/PNG for photos)
- Provide **alt text** (accessibility)
- Use **consistent image style** (all illustrations OR all photos)
- Use **aspect ratios** (maintain proportions)

❌ **Don't:**
- Use massive images (slow loading, wasted data)
- Use blurry/pixelated images (unprofessional)
- Mix illustration styles (confusing brand identity)
- Forget alt text (accessibility issue)

**Image Optimization:**
```
Profile avatars: 120x120px @ 2x = 240x240px actual
Hero images: 375x300px @ 2x = 750x600px actual
Icons: 48x48px @ 2x = 96x96px actual

Use WebP format (30% smaller than JPG)
Compress with tools like TinyPNG, Squoosh
```

---

### Form Tips

✅ **Do:**
- **Group related fields** (personal info, preferences, etc.)
- Use **clear labels** above or inside fields
- Show **validation inline** (instant feedback)
- Use **appropriate keyboards** (email, number, phone)
- Make **optional fields clear** ("Optional" or not required)

❌ **Don't:**
- Ask for unnecessary info (minimize form fields)
- Use placeholder-only labels (disappears on input)
- Show all errors at once (overwhelming)
- Use vague error messages ("Invalid input")

**Best Practices:**
```
✅ "Email must be valid (e.g., you@example.com)"
❌ "Invalid input"

✅ Required fields marked with *
❌ All fields look the same

✅ Real-time validation (as user types)
❌ Only validate on submit
```

---

### Performance Tips

✅ **Do:**
- **Lazy load images** below fold (improve initial load)
- **Optimize animations** (use CSS transforms, not position)
- **Cache assets** (images, fonts)
- **Test on 3G** (simulate slow connection)

❌ **Don't:**
- Auto-play videos (uses data, slows load)
- Use heavy animations (janky on low-end devices)
- Load all images upfront (slow initial render)

---

### Accessibility Tips

✅ **Do:**
- Ensure **4.5:1 contrast ratio** for text (WCAG AA)
- Use **semantic colors** (green = success, red = error)
- Provide **alt text** for images
- Make tap targets **at least 44x44px**
- Support **VoiceOver/TalkBack** (screen readers)
- Support **dynamic text sizing** (respect user font size settings)

❌ **Don't:**
- Rely only on color (use icons + color)
- Use low contrast (hard to read)
- Use tiny text/buttons (accessibility barrier)
- Ignore screen reader testing

---

## Keyboard Shortcuts

| Action | Shortcut (Mac) | Shortcut (Windows) |
|--------|---------------|-------------------|
| **Undo** | Cmd+Z | Ctrl+Z |
| **Redo** | Cmd+Shift+Z | Ctrl+Shift+Z |
| **Duplicate** | Cmd+D | Ctrl+D |
| **Delete** | Delete | Delete |
| **Select All** | Cmd+A | Ctrl+A |
| **Copy** | Cmd+C | Ctrl+C |
| **Paste** | Cmd+V | Ctrl+V |
| **Save** | Cmd+S | Ctrl+S |
| **Preview** | Cmd+P | Ctrl+P |
| **Toggle Layers Panel** | Cmd+L | Ctrl+L |
| **Toggle Properties Panel** | Cmd+I | Ctrl+I |
| **Select Next Element** | Tab | Tab |
| **Select Previous Element** | Shift+Tab | Shift+Tab |
| **Zoom In** | Cmd+Plus | Ctrl+Plus |
| **Zoom Out** | Cmd+Minus | Ctrl+Minus |
| **Fit to Screen** | Cmd+0 | Ctrl+0 |

---



**This editor is inspired by Superwall's excellent paywall editor.** We've adapted their flexible, container-based approach specifically for onboarding flows, giving you the same power and flexibility to create beautiful, converting onboarding experiences.

Happy building! 🚀