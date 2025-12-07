# Grid Kings - App Architecture

> Last updated: December 2024

## Overview

Grid Kings is an F1 second-screen experience with two core modes:
1. **Live Race Tracking** - Real-time race companion with AI insights
2. **Fantasy Leagues** - Draft drivers and compete with friends

All users must log in, enabling personalization and future monetization.

---

## Page Structure

### Public (No Auth)
```
/                   → Landing page (marketing, sign in/up)
/join/[code]        → Join league (redirects to auth)
```

### Authenticated
```
/home               → User home (live status + leagues)
/live               → Race hub (schedule, current session)
/live/[sessionKey]  → Live race view

/leagues            → Your leagues dashboard
/league/[id]        → League hub (standings, race history)
/league/[id]/draft/[raceId]  → Draft page
/league/[id]/race/[raceId]   → League race view (fantasy overlay)

/settings           → Account, subscription, preferences
```

---

## Page Details

### Landing Page `/`
**Purpose:** Marketing, conversion to sign-up

**Content:**
- Hero with value prop
- Feature highlights (live tracking, AI insights, fantasy)
- Screenshots/demo
- Sign In / Create Account CTAs
- Pricing preview (if applicable)

---

### Home Page `/home`
**Purpose:** Logged-in user's entry point

**Sections:**
1. **Live Now / Next Up**
   - Current session status or upcoming race
   - "Watch Live" or countdown

2. **Your Leagues**
   - List of leagues with current standing
   - Quick actions: View, active race status
   - Create/Join league buttons

---

### Race Hub `/live`
**Purpose:** Race weekend overview (spectator mode entry)

**Content:**
- Current/upcoming session info
- Weekend schedule (FP1, FP2, FP3, Quali, Race)
- Session status indicators
- "Watch Live" when active

---

### Live Race View `/live/[sessionKey]`
**Purpose:** Real-time race tracking (spectator mode)

**Features:**
- Live grid with positions
- Gap times, intervals
- Tire strategy visualization
- Overtake feed
- Team radio highlights
- AI insights (premium)
- Driver cards with live data

**No fantasy elements** - pure race focus

---

### Leagues Dashboard `/leagues`
**Purpose:** Manage all your fantasy leagues

**Content:**
- League cards with:
  - Name, player count
  - Your current ranking
  - Active race status
- Create League button
- Join League (enter code)

---

### League Hub `/league/[id]`
**Purpose:** Single league home base

**Sections:**

1. **Header**
   - League name
   - Settings (for creator)
   - Invite link/code

2. **Current/Next Race Card**
   Dynamic based on race state:

   | State | Display |
   |-------|---------|
   | Pre-draft | Race info, "Draft opens in X" |
   | Draft open | "Start Draft" / "Continue Draft" |
   | Draft complete | Teams summary, countdown, "View Grid" |
   | Race live | "Watch Race" with live indicator |
   | Race complete | Results summary, points earned |

3. **Season Standings**
   - Leaderboard (rank, player, total points)
   - Expandable: points per race

4. **Race History**
   - Past races with results
   - Expandable: team compositions, points breakdown

5. **Players**
   - Team list with colors
   - Ready status (during draft phase)

---

### Draft Page `/league/[id]/draft/[raceId]`
**Purpose:** Snake draft for driver selection

**Layout:**
- Team rosters (top) - 4 columns
- Available drivers by tier (bottom) - 4 columns

**Features:**
- Real-time sync between players
- Turn indicator (YOUR PICK / PICKING NOW badges)
- Tier-based dimming for unavailable picks
- Undo functionality
- Optimistic updates with polling fallback

**Post-draft:** Redirect to League Hub

---

### League Race View `/league/[id]/race/[raceId]`
**Purpose:** Live race with fantasy overlay

**Base:** Same as spectator live view

**Fantasy Overlay:**
- Your team highlighted on grid
- Live points accumulation
- League mini-standings
- "Your drivers" quick summary
- Points breakdown per driver

---

## Navigation

### Header (Logged Out)
```
[GRID KINGS Logo]                    [Sign In] [Get Started]
```

### Header (Logged In)
```
[GRID KINGS Logo]    [Home] [Live] [Leagues]         [Account ▼]
```

### Within League
```
[← Back]  [League Name]                    [Watch Live ↗] [Settings]
```

---

## User Modes & Access

### All Users (Logged In)
- Live race tracking
- Basic positions & timing
- Fantasy league participation

### Premium Users (Future)
- AI race insights
- Predictive analytics
- Advanced statistics
- Full team radio access
- Larger league sizes

---

## Data Model

### User
```typescript
interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  subscription_tier: 'free' | 'pro' | 'premium'
  created_at: string
}
```

### League
```typescript
interface League {
  id: string
  name: string
  share_code: string
  created_by: string
  drivers_per_team: number
  created_at: string
  players: Player[]
  races: Race[]
}
```

### Player (League Membership)
```typescript
interface Player {
  id: string
  user_id: string
  league_id: string
  display_name: string
  color: string
  draft_position: number
  is_ready: boolean
  total_points: number
}
```

### Race
```typescript
interface Race {
  id: string
  league_id: string
  race_name: string
  meeting_key: number
  session_key?: number
  status: 'pending' | 'drafting' | 'pre_race' | 'live' | 'complete'
  race_date?: string
  created_at: string
}
```

### DraftPick
```typescript
interface DraftPick {
  id: string
  race_id: string
  player_id: string
  driver_code: string
  driver_name: string
  driver_number: number
  team: string
  start_position: number
  pick_number: number
  created_at: string
}
```

### RaceResult
```typescript
interface RaceResult {
  id: string
  race_id: string
  player_id: string
  total_points: number
  driver_results: DriverResult[]
  created_at: string
}

interface DriverResult {
  driver_code: string
  start_position: number
  finish_position: number
  points_earned: number
}
```

---

## Race Lifecycle

```
pending → drafting → pre_race → live → complete
   │         │          │        │        │
   │         │          │        │        └── Results calculated
   │         │          │        └── OpenF1 live data
   │         │          └── Teams locked, countdown
   │         └── Draft in progress
   └── Waiting for draft window
```

---

## Component Architecture

### Shared Components (Both Modes)
- `DriverCard` - Driver info with team gradient
- `LiveGrid` - Real-time position grid
- `OvertakeFeed` - Position change notifications
- `TeamRadio` - Radio message display
- `RaceCountdown` - Time until race start
- `SessionStatus` - Current session indicator

### Spectator-Only Components
- `SpectatorHeader` - Clean navigation
- `FullGrid` - All 20 drivers focus

### League-Only Components
- `PointsTracker` - Live points calculation
- `LeagueStandings` - Mini leaderboard
- `TeamSummary` - Your drafted drivers
- `FantasyOverlay` - Highlights your drivers on grid
- `DraftBoard` - Draft interface

---

## API Integration

### OpenF1 API (External)
- Live timing data
- Driver positions
- Session status
- Team radio
- Used by: Live views (spectator & league)

### Supabase (Internal)
- User authentication
- League/player data
- Draft picks
- Race results
- Real-time subscriptions

---

## Build Priorities

### Phase 1: Core Fantasy Flow (Current)
- [x] Auth system
- [x] Create/join leagues
- [x] Draft page
- [ ] League Hub (evolve from waiting room)
- [ ] Post-draft flow fix

### Phase 2: Live Race Experience
- [ ] Port live tracker to `/live`
- [ ] League race view with fantasy overlay
- [ ] Points calculation system

### Phase 3: Polish & History
- [ ] Race results storage
- [ ] Season standings
- [ ] Race history in League Hub

### Phase 4: Monetization Prep
- [ ] Subscription tier model
- [ ] Feature gating
- [ ] Premium features (AI insights)

### Phase 5: Growth Features
- [ ] Landing page redesign
- [ ] Onboarding flow
- [ ] Social sharing
- [ ] Push notifications

---

## Technical Notes

### Real-time Strategy
- **Primary:** Supabase Realtime for draft sync
- **Fallback:** 3-second polling
- **Live data:** OpenF1 API polling (configurable interval)

### State Management
- React hooks for local state
- Supabase for persistent state
- No global state library needed (yet)

### Styling
- Tailwind CSS
- Custom team gradients
- Dark theme throughout
- Mobile-responsive

---

## Future Considerations

- **Chat/messaging** in leagues
- **Predictions** before race
- **Achievement badges**
- **Public leagues** (join random)
- **Historical stats** per driver
- **Multiple scoring systems**
