# Design & Feature Changelog

Complete log of design changes and feature additions to the F1 Fantasy League application.

---

## November 10, 2025 - Grid Kings Brand Integration

### 🎨 Design System Overhaul

**Summary:** Complete redesign of the application to match Grid Kings branding with custom color scheme and logo integration.

#### Color System

**Before:**
- Blue accent colors (#3B82F6)
- Gray-900 background (#111827)
- Standard Tailwind color palette

**After:**
- Gold-to-red gradient (#D2B83E → #B42518)
- Custom background (#1A1A1A)
- Grid Kings theme colors added to Tailwind config

**Files Changed:**
- `tailwind.config.ts` - Added Grid Kings color palette
- `src/app/layout.tsx` - Updated global background color
- `src/app/signin/page.tsx` - Applied new color scheme

#### Logo Integration

**Changes:**
- Added Grid Kings logo from live tracker repo
- Replaced emoji (🏎️) with actual logo
- Logo file: `/public/grid-kings-logo.png`

**Locations Updated:**
- Sign-in page header (h-32)
- Dashboard empty state (h-32, opacity-50)

**Commits:**
- `85ba811` - Add Grid Kings logo to F1 Fantasy League
- `a545c72` - Clean up signin page: remove text and match Grid Kings branding

#### Sign-In Page Redesign

**Visual Changes:**

1. **Header Simplification**
   - Removed: "F1 Fantasy League" title text
   - Removed: Context-sensitive subtitle
   - Added: Grid Kings logo only (128px height)
   - Result: Clean, logo-focused design

2. **Background Updates**
   - Changed from gradient to solid #1A1A1A
   - Card background matches page background
   - Subtle border added for definition (border-gray-800)

3. **Button Redesign**
   - All buttons use gold-to-red gradient
   - Hover states with lighter gradient
   - Google button updated from white to gradient
   - Consistent styling across all CTAs

4. **Typography Updates**
   - Footer text reduced from text-sm to text-xs
   - Text links changed from blue to gold
   - Improved visual hierarchy

**Commits:**
- `c18c765` - Update signin page with black card and gold-to-red gradient buttons
- `935a908` - Match signin card background to page background
- `8fb0ccb` - Make footer text smaller on signin page
- `fe74167` - Apply gradient styling to Google sign-in button

---

## November 10, 2025 - Authentication Enhancements

### 📱 Phone Number Authentication

**Summary:** Added phone number authentication with SMS OTP verification as an alternative to email/password sign-in.

#### Features Added

1. **Phone Sign-In UI**
   - Email/Phone toggle buttons
   - Phone number input with country code
   - 6-digit OTP verification screen
   - Clear user flow with state transitions

2. **OTP Verification Flow**
   - Send OTP to phone number
   - Large, centered OTP input (text-2xl, tracking-widest)
   - Option to change phone number
   - Automatic redirect after verification

3. **Twilio Integration**
   - Configured Twilio in Supabase
   - SMS delivery setup
   - Documentation created (PHONE-AUTH-SETUP.md)

**User Flow:**
1. Click "Phone" tab
2. Enter phone with country code (+1234567890)
3. Click "Send OTP Code"
4. Receive 6-digit SMS code
5. Enter code in verification form
6. Sign in and redirect to dashboard

**Files Changed:**
- `src/app/signin/page.tsx` - Added phone auth UI and handlers
- `PHONE-AUTH-SETUP.md` - Created setup documentation

**Commits:**
- `3371b0f` - Add phone number authentication with SMS OTP

### 🍎 Apple Sign In

**Summary:** Apple Sign In button and OAuth flow added, then disabled pending Apple Developer account.

**Status:**
- Code implemented but commented out
- Requires $99/year Apple Developer Program membership
- Helper script created for future setup (`scripts/generate-apple-secret.js`)

**Files Changed:**
- `src/app/signin/page.tsx` - Apple button commented out
- `scripts/generate-apple-secret.js` - JWT generator for OAuth secret
- `package.json` - Added jsonwebtoken dependency
- `.gitignore` - Added *.p8 and apple-oauth-secret.txt
- `OAUTH-SETUP-GUIDE.md` - Documentation for future setup

**Commits:**
- `faccba6` - Disable Apple Sign In (requires paid Apple Developer account)

---

## November 9, 2025 - Deployment Fixes

### 🐛 Vercel Deployment Issues

#### Issue 1: Route Conflict

**Problem:**
- Both `page.tsx` and `route.ts` in `/auth/callback`
- Next.js 14 doesn't allow both in same directory

**Solution:**
- Removed old `page.tsx` (localStorage auth)
- Kept `route.ts` (Supabase auth)

**Commit:**
- `4c32712` - Remove conflicting auth callback page.tsx

---

## Authentication System Evolution

### Timeline of Auth Changes

**Phase 1: Anonymous Authentication (Earlier)**
- localStorage-based player tracking
- Anonymous player creation
- Magic link upgrade system

**Phase 2: Supabase Authentication (Nov 9)**
- Removed localStorage tracking
- Added Email/Password authentication
- Added Google OAuth
- Added Apple Sign In (later disabled)
- Database migration to require auth

**Phase 3: Phone Authentication (Nov 10)**
- Added SMS OTP sign-in
- Twilio integration
- Email/Phone toggle UI

**Current Authentication Methods:**
1. ✅ Email/Password
2. ✅ Google OAuth
3. ✅ Phone/SMS OTP
4. ⏸️ Apple Sign In (disabled, can be enabled later)

---

## Design System Documentation

### New Documentation Files

1. **DESIGN-SYSTEM.md**
   - Complete brand guidelines
   - Color palette reference
   - Component examples
   - Typography guidelines
   - Accessibility notes

2. **PHONE-AUTH-SETUP.md**
   - Twilio configuration guide
   - Testing instructions
   - Troubleshooting tips
   - Cost estimates

3. **OAUTH-SETUP-GUIDE.md**
   - Google OAuth setup
   - Apple Sign In setup (for future)
   - Provider configuration
   - Testing procedures

---

## Tailwind Configuration Updates

### Added to Theme

```typescript
colors: {
  'grid-kings': {
    bg: '#1A1A1A',
    gold: '#D2B83E',
    'gold-light': '#E5C94F',
    red: '#B42518',
    'red-light': '#C53829',
  },
},
backgroundImage: {
  'grid-kings-gradient': 'linear-gradient(to right, #D2B83E, #B42518)',
  'grid-kings-gradient-hover': 'linear-gradient(to right, #E5C94F, #C53829)',
},
```

### Usage Examples

```tsx
// Individual colors
<div className="bg-grid-kings-bg">

// Gradient utility
<button className="bg-grid-kings-gradient hover:bg-grid-kings-gradient-hover">

// Color references
<span className="text-grid-kings-gold">
```

---

## Package Dependencies Added

### New Dependencies

**Dev Dependencies:**
- `jsonwebtoken@^9.0.2` - For Apple OAuth JWT generation

**Purpose:**
- Generate Apple Sign In OAuth secrets
- Create JWT tokens for Apple authentication
- Helper script: `scripts/generate-apple-secret.js`

---

## Git Ignore Updates

### Added Entries

```gitignore
# Apple OAuth secrets
*.p8
scripts/apple-oauth-secret.txt
```

**Purpose:**
- Prevent committing Apple private keys
- Protect OAuth credentials
- Security best practice

---

## Visual Design Summary

### Before & After Comparison

**Before (Original Design):**
```
┌─────────────────────────────┐
│  🏎️ F1 Fantasy League       │
│  Sign in to continue        │
│                             │
│  [Continue with Google]     │ ← White button
│                             │
│  or                         │
│                             │
│  [Email] [Password]         │
│  [Sign In]                  │ ← Blue button
│                             │
│  Don't have an account?     │ ← Blue link
└─────────────────────────────┘
```

**After (Grid Kings Design):**
```
┌─────────────────────────────┐
│                             │
│    [Grid Kings Logo]        │ ← Actual logo
│                             │
│  [Continue with Google]     │ ← Gold→Red gradient
│                             │
│  or                         │
│                             │
│  [Email] [Phone]            │ ← Gradient toggles
│                             │
│  [Email] [Password]         │
│  [Sign In]                  │ ← Gold→Red gradient
│                             │
│  Don't have an account?     │ ← Gold link
│                             │
│  Terms & Privacy (xs)       │ ← Smaller text
└─────────────────────────────┘
```

---

## Deployment History

### Recent Deployments

1. **Commit `4c32712`** - Fixed route conflict
2. **Commit `faccba6`** - Disabled Apple Sign In
3. **Commit `3371b0f`** - Added phone authentication
4. **Commit `85ba811`** - Added Grid Kings logo
5. **Commit `a545c72`** - Clean signin design
6. **Commit `0a12660`** - Site-wide background color
7. **Commit `c18c765`** - Gradient buttons
8. **Commit `935a908`** - Card background match
9. **Commit `8fb0ccb`** - Footer text size
10. **Commit `fe74167`** - Google button gradient

All deployed successfully to Vercel.

---

## Breaking Changes

### Authentication Migration

**Impact:** Users from previous version
- Must sign in with Google, Email/Password, or Phone
- Old localStorage-based sessions invalidated
- Database migration required (`003_auth_required.sql`)

**Migration Notes:**
- Existing leagues may need data migration
- Players must create authenticated accounts
- One player per user per league (unique constraint)

---

## Future Roadmap

### Design
- [ ] Light mode variant (if needed)
- [ ] Mobile responsive refinements
- [ ] Accessibility improvements (WCAG AA/AAA)
- [ ] Animation polish

### Authentication
- [ ] Enable Apple Sign In (when Apple Developer account available)
- [ ] Social login analytics
- [ ] Multi-factor authentication
- [ ] Session management improvements

### Features
- [ ] League creation flow
- [ ] Draft system
- [ ] Live race scoring
- [ ] Season standings

---

**Last Updated:** November 10, 2025
**Version:** 1.1.0
**Status:** Production Ready
