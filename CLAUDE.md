# CLAUDE.md - F1 Fantasy League App

**Project:** Grid Kings (F1 Fantasy League)
**Owner:** Tom Suharto
**Type:** Personal project - F1 fantasy league with live scoring
**Stack:** Next.js 14, TypeScript, Supabase, Tailwind CSS
**Status:** Foundation Complete, Building Features

---

## Project Overview

F1 Fantasy League app with live race tracking, progressive authentication (anonymous → verified), and real-time scoring during races.

**Core Value:** Simple, fast fantasy league setup with live scoring during F1 races - no complex registration required.

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **APIs:** OpenF1 (live race data), Ergast (calendar, grids)
- **Deployment:** Vercel (frontend)

---

## Architecture

### Progressive Auth System
1. **Anonymous players** - Join league with name + color (no email)
2. **Verified accounts** - Upgrade via magic link to save progress
3. **RLS policies** - Row-level security for multi-tenancy

### Data Flow
```
User → Next.js App → Supabase (Auth + DB) → Real-time subscriptions
                  ↓
              OpenF1 API (live positions, timing)
                  ↓
              Ergast API (calendar, starting grids)
```

### Key Features
- League creation & join via share code
- Snake draft system with real-time updates
- Live race scoring (30-second polling)
- Season standings & race history

---

## File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── auth/callback/      # Auth callback handler
│   ├── dashboard/          # User dashboard
│   └── signin/             # Sign-in page
│
├── lib/                    # Core logic & utilities
│   ├── types.ts            # TypeScript types
│   ├── supabase.ts         # Supabase client
│   ├── scoring.ts          # Scoring calculations
│   ├── haptics.ts          # Haptic feedback
│   ├── auth/               # Auth utilities
│   │   ├── client.ts       # Client-side auth
│   │   └── server.ts       # Server-side auth
│   └── api/                # API clients
│       ├── openf1.ts       # OpenF1 client
│       └── ergast.ts       # Ergast client
│
└── components/             # React components
    └── shared/             # Reusable components

supabase/
└── migrations/
    └── 003_auth_required.sql  # Database schema
```

---

## Key Patterns & Conventions

### Auth Pattern
```typescript
// Server components (read session)
import { createClient } from '@/lib/auth/server';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Client components (interactive auth)
import { createClient } from '@/lib/auth/client';

const supabase = createClient();
await supabase.auth.signInWithOtp({ email });
```

### API Integration
```typescript
// OpenF1 - Live race data
import { openF1 } from '@/lib/api/openf1';

const positions = await openF1.getLivePositions(sessionKey);

// Auto-update during race (30s polling)
openF1.startAutoUpdate(sessionKey, (positions, fastestLap, lap) => {
  // Update UI
});

// Ergast - Historical data
import { ergast } from '@/lib/api/ergast';

const races = await ergast.getSeasonCalendar(2025);
const grid = await ergast.getStartingGrid(2025, roundNumber);
```

### Database Queries
```typescript
// Always use Supabase client
const { data, error } = await supabase
  .from('leagues')
  .select('*')
  .eq('id', leagueId)
  .single();

if (error) throw error;
```

### Scoring Logic
```typescript
import { calculateDriverScore } from '@/lib/scoring';

const score = calculateDriverScore(
  driver,
  finishPosition,
  hasFastestLap
);
// Returns: { score, bonus, movementPoints, fastestLapPoints, isDNF }
```

---

## Communication Preferences for This Project

### Next.js & React Best Practices

**Component Patterns**
- Use Server Components by default, only use 'use client' when necessary
- Challenge client components that could be server components
- Flag missing loading.tsx and error.tsx in route segments
- Point out when useState could be server-side data fetching
- Question useEffect when Next.js data fetching would be better

**App Router Conventions**
- Route handlers in app/api/ for backend logic
- Page components in app/ following folder structure
- Layouts for shared UI across routes
- Loading states and error boundaries for better UX
- Metadata exports for SEO

**TypeScript Strictness**
- Challenge any 'any' types - always provide proper typing
- Flag missing type exports from lib/types.ts
- Point out when interfaces should be used vs types
- Question implicit types - make them explicit
- Ensure API responses are properly typed

### Supabase Patterns

**Database Operations**
- Always handle errors from Supabase queries
- Use RLS policies, never bypass security
- Question direct database access without proper typing
- Flag missing .single() when expecting one result
- Point out when real-time subscriptions would be better than polling

**Auth System**
- Follow progressive auth pattern (anonymous → verified)
- Always check user session before protected operations
- Use server-side auth for SSR/API routes
- Use client-side auth for interactive components
- Question auth flows that don't match the established pattern

### API Integration

**OpenF1 & Ergast**
- Use existing API clients, don't create new fetch calls
- Handle API errors gracefully with fallbacks
- Question polling intervals - 30 seconds for live data only
- Flag missing loading states during API calls
- Point out when data should be cached vs. fetched fresh

**Real-time Features**
- Use Supabase real-time for draft updates
- Question polling when real-time subscriptions exist
- Flag missing cleanup for subscriptions/intervals
- Point out race conditions in real-time updates

### Project-Specific Reality Checks

**Stop me when:**
- Creating new auth patterns (use existing progressive auth)
- Bypassing Supabase RLS (security issue)
- Adding dependencies without checking if feature exists
- Using client components unnecessarily
- Not handling API errors or edge cases
- Creating duplicate API clients or utilities
- Breaking the anonymous → verified auth flow
- Ignoring loading/error states
- Using 'any' types instead of proper TypeScript

**What Good Looks Like:**
- "This should be a Server Component - you're only fetching data. Remove 'use client' and use async/await"
- "This API error isn't handled. Add try/catch and show user-friendly error: [code]"
- "You're polling for this data, but Supabase real-time would be better: [example]"
- "This breaks the progressive auth pattern - anonymous users should be able to access this: [explanation]"
- "Add TypeScript types for this API response in lib/types.ts: [interface]"

**When to Let Vibes Flow:**
- UI experimentation and styling
- Prototyping new features
- Quick design iterations
- Exploring new libraries (with approval)

**Always Flag (Even During Prototyping):**
- Auth bypasses or security holes
- API keys exposed in client-side code
- Database queries without RLS
- Missing error handling on critical paths
- TypeScript errors or 'any' types in core logic
- Memory leaks (uncleared intervals/subscriptions)

### Tone & Style for This Project

**Professional & Direct:**
- No "Great idea, but..." - just "This approach has issues: [list]"
- Lead with the problem, then the solution
- Show code examples, not just explanations
- Reference existing patterns: "Follow the pattern in lib/auth/client.ts"

**Challenge Technical Decisions:**
- "This creates a client component unnecessarily. Make it a Server Component: [code]"
- "This bypasses RLS - security issue. Use proper auth check: [example]"
- "You're creating a new API client - use the existing one in lib/api/openf1.ts"
- "This 'any' type should be properly typed. Add to lib/types.ts: [interface]"
- "This error isn't handled - race condition when API fails: [fix]"

### Response Format

**When Reviewing Code:**
- Lead with the issue (security, performance, pattern violation)
- Show the problematic code snippet
- Provide the corrected version
- Explain WHY it's problematic
- Reference existing patterns in the codebase

**When Implementing Features:**
- Follow Next.js App Router conventions
- Use Server Components by default
- Implement proper loading and error states
- Type everything explicitly
- Handle all error cases
- Test auth flows (anonymous & verified)

### Critical Analysis Areas

**Be especially critical of:**
- Client components when Server Components would work
- Any auth bypass or RLS circumvention
- Untyped API responses or database queries
- Missing error handling on async operations
- Memory leaks (uncleaned intervals, subscriptions)
- Duplicate code when utilities exist
- Breaking the progressive auth pattern
- API calls without loading/error states
- TypeScript 'any' types or implicit typing
- Direct fetch calls instead of using existing clients

---

## Development Workflow

### Running Locally
```bash
cd /Users/tomsuharto/Documents/Obsidian\ Vault/Claude\ Code/F1/f1-fantasy-app

# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

### Testing
- Test anonymous user flow (no email signup)
- Test account upgrade (magic link)
- Test league creation & joining
- Test live scoring during race weekend
- Test on mobile (PWA features)

### Deployment
- **Frontend:** Vercel (auto-deploy from GitHub)
- **Database:** Supabase (cloud hosted)
- **Environment:** Production env vars in Vercel

---

## Key Documentation

**In this directory:**
- `README.md` - Full project documentation
- `SETUP.md` - Setup instructions
- `PROJECT-SUMMARY.md` - Foundation status (what's built)
- `IMPLEMENTATION.md` - Implementation guide
- `USER-FLOW.md` - User experience flows
- `DESIGN-SYSTEM.md` - Design tokens & components
- `AUTH-REFACTORING-COMPLETE.md` - Auth system details

**In parent F1 folder:**
- `f1-app-architecture.md` - System design
- `f1-api-integration.md` - API implementation
- `f1-component-specs.md` - Component specifications
- `f1-auth-system.md` - Auth flow details

---

## Current Phase

**Phase 1: Foundation** ✅ Complete
- Next.js setup, Supabase, Auth, APIs

**Phase 2: League & Draft** 🔨 In Progress
- League creation, join flow, draft system

**Phase 3: Live Scoring** ⏳ Next
- Live race interface, scoring updates

**Phase 4: Season Features** 📋 Future
- Standings, history, export

---

## Tom's Context

**Project Goal:** Learn Next.js/React/TypeScript through building
**Priority:** Working features > perfect code (but catch security issues)
**Style:** Mobile-first, clean, fast
**Timeline:** Build in sprints, ship features progressively

**Related Project:** Playbook (separate codebase - don't mix code!)

---

## Quick Reference

### Common Commands
```bash
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # Lint check
npm run type-check       # TypeScript check
```

### Important URLs
- **Local:** http://localhost:3000
- **Production:** (TBD - will deploy to Vercel)
- **Supabase:** (Project dashboard)
- **GitHub:** https://github.com/tomsuharto-git/Grid-Kings

### Key Files to Reference
```
lib/auth/client.ts       # Client auth patterns
lib/auth/server.ts       # Server auth patterns
lib/api/openf1.ts        # OpenF1 API usage
lib/api/ergast.ts        # Ergast API usage
lib/types.ts             # TypeScript types
lib/scoring.ts           # Scoring logic
```

---

**Last Updated:** November 17, 2025
**Maintained By:** Tom Suharto + Claude Code
