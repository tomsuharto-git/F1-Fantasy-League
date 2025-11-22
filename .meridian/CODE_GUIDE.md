<CODE_GUIDE>
# Grid Kings (F1 Fantasy) - Code Guide

**Project:** F1 Fantasy League Application
**Stack:** Next.js 14, React 18, TypeScript, Supabase, Tailwind CSS
**Auth:** Progressive (Anonymous → Verified via Magic Link)
**APIs:** OpenF1 (live data), Ergast (historical/grids)
**Status:** Feature Building Phase + TDD Mode Enabled

---

## 🎯 Core Business Logic (NEVER CHANGE)

### F1 Scoring System

```typescript
// Official F1 Point System (src/lib/scoring.ts)
const POSITION_POINTS = {
  1: 25, 2: 20, 3: 15, 4: 12, 5: 10,
  6: 8, 7: 6, 8: 4, 9: 2, 10: 1
};
const FASTEST_LAP_BONUS = 1;
const POLE_POSITION_BONUS = 5;
```

**These are official F1 rules - NEVER modify**

### Snake Draft Algorithm

```typescript
// Round 1: [1,2,3,4,5,6,7,8]
// Round 2: [8,7,6,5,4,3,2,1]
// Round 3: [1,2,3,4,5,6,7,8] ...
```

**Pattern MUST alternate** - this is standard fantasy sports draft

---

## 🔌 API Integration

### OpenF1 (Live Race Data)
- **Use for:** Live positions, fastest lap, lap counting
- **Updates:** Every 30 seconds during races
- **File:** `src/lib/api/openf1.ts`

### Ergast (Historical Data)
- **Use for:** Race calendar, starting grids, past results  
- **Updates:** Static, updated after races
- **File:** `src/lib/api/ergast.ts`

**NEVER mix:** OpenF1 for live, Ergast for historical

---

## 🔐 Progressive Authentication

```typescript
// Step 1: Anonymous (no email)
const player = await createAnonymousPlayer(displayName);

// Step 2: Upgrade (optional magic link)
await upgradeToVerified(email);
```

**Principle:** Never block gameplay. Email is optional upgrade.

---

## 💾 Supabase + RLS

**All queries auto-scoped by Row-Level Security:**

```typescript
// Supabase RLS handles security - no manual filtering
const { data } = await supabase.from('leagues').select('*');
// Returns ONLY user's leagues (via RLS policy)
```

**Schema:** `supabase/schema.sql`

---

## ⚛️ React Patterns

**Server Components (default):**
```typescript
// No "use client" = Server Component
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

**Client Components (when needed):**
```typescript
"use client"; // Only for: state, effects, events, browser APIs

import { useState } from 'react';
export function Interactive() {
  const [state, setState] = useState();
}
```

---

## 🧪 TDD Workflow (ENABLED)

**1. Write Test First (Red)**
```typescript
it('awards 25 points for P1', () => {
  expect(calculatePoints({ position: 1 })).toBe(25);
});
```

**2. Implement (Green)**
```typescript
export function calculatePoints({ position }) {
  return POSITION_POINTS[position] || 0;
}
```

**3. Refactor (Clean)**

TDD mode is ENFORCED - tests before implementation.

---

## 🎨 Tailwind CSS

```typescript
// ✅ Utility classes
<div className="bg-gray-900 p-4 rounded-lg">

// ✅ Dynamic values (use style)
<div style={{ backgroundColor: teamColor }}>

// ❌ Template literals don't work (purged)
<div className={`bg-${color}-500`}>
```

---

## 📁 File Structure

```
src/
├── app/              # Next.js pages
├── components/
│   ├── shared/       # Reusable (Modal, ColorPicker)
│   └── auth/         # Auth-specific
└── lib/
    ├── types.ts      # TypeScript types
    ├── scoring.ts    # F1 scoring logic
    ├── supabase.ts   # DB client
    ├── auth/         # Auth functions
    └── api/          # OpenF1, Ergast clients
```

---

## 🚫 Anti-Patterns

❌ Changing F1 scoring values  
❌ Breaking snake draft order  
❌ Using Ergast for live data  
❌ Using OpenF1 for historical data  
❌ Using `any` type  
❌ Storing tokens in localStorage

---

## 📚 Key Files

- `README.md` - Setup guide
- `src/lib/types.ts` - Type definitions
- `src/lib/scoring.ts` - F1 scoring
- `src/lib/api/openf1.ts` - Live data
- `src/lib/api/ergast.ts` - Historical data
- `supabase/schema.sql` - Database schema

---

## 🔄 Version

**Last Updated:** November 16, 2025  
**Status:** Feature Building + TDD Enabled  
**Next:** Draft system, live scoring, standings

</CODE_GUIDE>
