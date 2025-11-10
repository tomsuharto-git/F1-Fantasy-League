# Grid Kings Design System

Complete design system and brand guidelines for the F1 Fantasy League application.

---

## 🎨 Brand Colors

### Primary Colors

The Grid Kings brand uses a distinctive gold-to-red gradient as its primary accent.

```css
/* Gold */
--grid-kings-gold: #D2B83E;
--grid-kings-gold-light: #E5C94F; /* Hover/active state */

/* Red */
--grid-kings-red: #B42518;
--grid-kings-red-light: #C53829; /* Hover/active state */

/* Background */
--grid-kings-bg: #1A1A1A; /* Site-wide background */
```

### Tailwind Usage

The colors are available in your Tailwind config:

```tsx
// Individual colors
<div className="bg-grid-kings-bg text-grid-kings-gold">

// Gradients (recommended for buttons)
<button className="bg-grid-kings-gradient hover:bg-grid-kings-gradient-hover">

// Or using Tailwind utilities
<button className="bg-gradient-to-r from-grid-kings-gold to-grid-kings-red">
```

---

## 🔘 Button Styles

### Primary Button (Grid Kings Gradient)

Standard button style used throughout the app:

```tsx
<button className="bg-grid-kings-gradient hover:bg-grid-kings-gradient-hover text-white rounded-lg font-bold py-3 px-4 transition-all disabled:opacity-50">
  Click Me
</button>

// Or with explicit gradient
<button className="bg-gradient-to-r from-grid-kings-gold to-grid-kings-red hover:from-grid-kings-gold-light hover:to-grid-kings-red-light text-white rounded-lg font-bold py-3 px-4 transition-all disabled:opacity-50">
  Click Me
</button>
```

**Usage:**
- Sign in/sign up buttons
- Primary action buttons
- Submit buttons
- Call-to-action elements

### Secondary Button (Inactive)

Used for inactive states in toggle buttons:

```tsx
<button className="bg-gray-700 text-gray-400 hover:bg-gray-600 rounded-lg font-medium py-2 px-4 transition-colors">
  Inactive Option
</button>
```

**Usage:**
- Toggle buttons (inactive state)
- Secondary actions
- Cancel buttons

### Text Link Button

Used for less prominent actions:

```tsx
<button className="text-grid-kings-gold hover:text-grid-kings-gold-light text-sm transition-colors">
  Switch to sign up
</button>
```

**Usage:**
- Sign up/sign in toggles
- "Use a different phone number"
- Form state switches
- Less prominent navigation

---

## 🖼️ Logo Usage

### Grid Kings Logo

**Location:** `/public/grid-kings-logo.png`

**Sizing Guidelines:**
- **Sign-in page:** `h-32` (128px height)
- **Dashboard empty state:** `h-32 opacity-50` (128px, faded)
- **General pages:** `h-24` (96px height)

```tsx
// Sign-in page
<img
  src="/grid-kings-logo.png"
  alt="Grid Kings Logo"
  className="h-32 w-auto"
/>

// Empty states (faded)
<img
  src="/grid-kings-logo.png"
  alt="Grid Kings Logo"
  className="h-32 w-auto opacity-50"
/>
```

---

## 📐 Layout & Spacing

### Page Background

All pages use the Grid Kings background color:

```tsx
// Set globally in layout.tsx
<body className="bg-grid-kings-bg text-white min-h-screen">
```

### Cards & Containers

Cards blend into the background with subtle borders:

```tsx
<div className="bg-grid-kings-bg rounded-lg p-6 shadow-xl border border-gray-800">
  {/* Content */}
</div>
```

**Usage:**
- Sign-in form container
- Dashboard panels
- League cards
- Modal dialogs

### Spacing

Standard spacing throughout the app:
- **Container padding:** `p-4` or `p-6`
- **Element gaps:** `gap-2`, `gap-3`, `gap-4`
- **Section margins:** `mb-6`, `mb-8`
- **Button padding:** `py-3 px-4` (primary), `py-2 px-4` (secondary)

---

## 🔤 Typography

### Font Sizes

```tsx
// Headings
<h1 className="text-4xl font-bold">Main Title</h1>
<h2 className="text-3xl font-bold">Section Title</h2>
<h3 className="text-2xl font-bold">Subsection</h3>

// Body text
<p className="text-base">Regular text</p>
<p className="text-sm">Small text (labels, metadata)</p>
<p className="text-xs">Extra small (footer, fine print)</p>
```

### Font Weights

- **Regular:** Normal body text
- **Medium:** `font-medium` - Buttons, labels
- **Bold:** `font-bold` - Headings, primary buttons

### Text Colors

```tsx
// Primary text (white)
<p className="text-white">

// Secondary text (gray)
<p className="text-gray-400">

// Muted text (light gray)
<p className="text-gray-500">

// Accent text (gold)
<p className="text-grid-kings-gold">
```

---

## 📱 Sign-In Page Design

### Current Implementation

The sign-in page showcases the Grid Kings brand with:

**Structure:**
1. Grid Kings logo (centered, 128px height)
2. Sign-in form card (blends with background)
3. Footer text (extra small, gray)

**Elements:**
- Google OAuth button (gradient)
- Email/Phone toggle (gradient when active)
- Input fields (dark gray with blue focus ring)
- Submit buttons (gradient)
- Text links (gold)

**Visual Hierarchy:**
```
┌─────────────────────────────────┐
│                                 │
│      [Grid Kings Logo]          │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │  [Continue with Google]   │  │ ← Gradient button
│  │                           │  │
│  │         or                │  │
│  │                           │  │
│  │  [Email] [Phone]          │  │ ← Toggle (gradient when active)
│  │                           │  │
│  │  [Input fields]           │  │
│  │                           │  │
│  │  [Submit Button]          │  │ ← Gradient button
│  │                           │  │
│  │  [Text link]              │  │ ← Gold text
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Terms & Privacy (xs gray)      │
│                                 │
└─────────────────────────────────┘
```

---

## 🎯 Form Elements

### Input Fields

```tsx
<input
  type="text"
  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
/>
```

**States:**
- **Default:** Gray background, gray border
- **Focus:** Blue border (`focus:border-blue-500`)
- **Disabled:** Darker gray (`bg-gray-600 text-gray-400`)

### Dividers

```tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-700"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-grid-kings-bg text-gray-400">or</span>
  </div>
</div>
```

---

## 🎨 Color Usage Guidelines

### When to Use Each Color

**Gold (`#D2B83E`):**
- Primary accent color
- Start of gradient
- Text links (hover states)
- Active state indicators

**Red (`#B42518`):**
- End of gradient
- Error states (when needed)
- Important notifications

**Gradient (Gold → Red):**
- All primary buttons
- Active toggle states
- Call-to-action elements
- OAuth provider buttons

**Background (`#1A1A1A`):**
- Site-wide background
- Card backgrounds (with border)
- Divider backgrounds
- Areas that should blend seamlessly

---

## 📊 Component Examples

### Toggle Button Group

```tsx
<div className="flex gap-2 mb-6">
  <button
    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-grid-kings-gradient text-white'
        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
    }`}
  >
    Option 1
  </button>
  <button
    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
      !isActive
        ? 'bg-grid-kings-gradient text-white'
        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
    }`}
  >
    Option 2
  </button>
</div>
```

### Social Sign-In Button

```tsx
<button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-grid-kings-gradient hover:bg-grid-kings-gradient-hover text-white rounded-lg font-medium transition-all disabled:opacity-50">
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    {/* Icon SVG */}
  </svg>
  Continue with Google
</button>
```

---

## 🎭 Animations & Transitions

### Standard Transitions

```tsx
// Color transitions
className="transition-colors duration-200"

// All properties
className="transition-all duration-200"

// Custom animations (from tailwind.config.ts)
className="animate-slide-in-right"
className="animate-fade-in"
className="animate-pulse-once"
```

### Button Hover Effects

All buttons should have smooth transitions:
- **Colors:** `transition-colors`
- **Complex changes:** `transition-all`
- **Duration:** Default (200ms) or 300ms for prominent elements

---

## 📝 Implementation Notes

### Recent Design Changes (Nov 2025)

1. **Grid Kings Logo Integration**
   - Added logo to `/public/grid-kings-logo.png`
   - Replaced emoji (🏎️) with logo across app
   - Consistent sizing: h-32 for signin, h-24 for headers

2. **Color System Overhaul**
   - Changed from blue (#3B82F6) to gold-to-red gradient
   - Updated all buttons to use Grid Kings gradient
   - Background changed from gray-900 to #1A1A1A

3. **Sign-In Page Redesign**
   - Removed title text, logo-only header
   - Card background matches page background
   - All buttons use gradient styling
   - Footer text reduced to text-xs

4. **Phone Authentication**
   - Added phone number sign-in option
   - Email/Phone toggle buttons
   - OTP verification flow
   - Consistent gradient styling

5. **Apple Sign In**
   - Temporarily disabled (requires Apple Developer account)
   - Code remains commented in signin page
   - Can be re-enabled when credentials are available

---

## 🚀 Future Considerations

### Accessibility
- Ensure gradient buttons have sufficient contrast (AA/AAA)
- Add focus visible states for keyboard navigation
- Test with screen readers

### Dark Mode
- Current design is dark by default
- Consider light mode variant if needed
- Gradient may need adjustment for light backgrounds

### Responsive Design
- Logo sizing may need adjustment on mobile
- Button padding should scale appropriately
- Form layouts should stack on smaller screens

---

## 📚 Quick Reference

### Copy-Paste Button Styles

**Primary Action Button:**
```tsx
className="bg-grid-kings-gradient hover:bg-grid-kings-gradient-hover text-white rounded-lg font-bold py-3 px-4 transition-all disabled:opacity-50"
```

**Toggle Button (Active):**
```tsx
className="bg-grid-kings-gradient text-white rounded-lg font-medium py-2 px-4 transition-colors"
```

**Toggle Button (Inactive):**
```tsx
className="bg-gray-700 text-gray-400 hover:bg-gray-600 rounded-lg font-medium py-2 px-4 transition-colors"
```

**Text Link:**
```tsx
className="text-grid-kings-gold hover:text-grid-kings-gold-light text-sm transition-colors"
```

**Input Field:**
```tsx
className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
```

---

**Last Updated:** November 2025
**Version:** 1.0
**Maintained by:** Grid Kings Development Team
