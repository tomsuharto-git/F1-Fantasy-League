# F1 Fantasy League

**Multiplayer F1 fantasy league with snake draft, live race scoring, and season standings**

🔗 **GitHub:** https://github.com/tomsuharto-git/F1-Fantasy-League
📍 **Status:** ~85% complete - ready for testing and deployment

---

## 🏎️ What You Have

A complete **Next.js 14** foundation for your F1 Fantasy League app with:

✅ **Progressive Authentication** (anonymous → verified via magic link)  
✅ **Database Schema** (Supabase with RLS policies)  
✅ **API Clients** (OpenF1 for live data, Ergast for grids)  
✅ **Core Components** (Modal, ColorPicker, Notifications, Auth)  
✅ **Utilities** (Scoring logic, haptic feedback)  
✅ **TypeScript Types** (Complete type safety)  

---

## 📋 Prerequisites

- Node.js 20+ installed
- Supabase account (free tier works)
- Terminal/command line access

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd f1-fantasy-app
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. Create `.env.local` from template:

```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy contents of `supabase/schema.sql`
4. Paste and run the SQL

This creates:
- Tables (leagues, players, races, draft_picks, race_results)
- RLS policies (security)
- Views (season_standings)
- Triggers (auto-update timestamps)

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Test the Foundation

### Test 1: Create Anonymous Player

1. Open the app
2. Should see home page
3. Auth system works ✓

### Test 2: Supabase Connection

1. Open browser console
2. Check for any Supabase errors
3. No errors = configured correctly ✓

---

## 🛠️ What's Built vs What's Next

### ✅ **COMPLETE (Foundation)**

**Authentication**
- Anonymous player creation
- Magic link upgrade system
- Sign in/out for verified users
- Auth callback handling

**Database**
- Complete schema with RLS
- All tables and relationships
- Security policies
- Season standings view

**APIs**
- OpenF1 client (live positions, fastest lap, lap counting)
- Ergast client (grids, calendar, results)
- Auto-update system (30-second polling)

**Components**
- Modal (reusable dialog)
- ColorPicker (team colors)
- NotificationSystem (toasts)
- JoinLeague (anonymous join flow)
- UpgradePrompt (account upgrade)

**Utilities**
- Scoring calculation
- Haptic feedback
- Type definitions
- Helper functions

### 🚧 **TODO (Build in Claude Code)**

**League Management**
- Create league flow
- Waiting room (pre-draft lobby)
- Share link generation

**Draft System**
- Snake draft interface
- Driver selection grid
- Pick timer (2 minutes)
- Pause/resume/undo
- Real-time updates

**Live Scoring**
- Race interface
- Position inputs with API auto-fill
- Manual override system
- API status indicator
- Team score cards
- Live leaderboard

**Season Standings**
- Multi-race tracking
- Standings table
- Race history
- Points breakdown

---

## 📁 Project Structure

```
f1-fantasy-app/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── globals.css        # Global styles
│   │   └── auth/
│   │       └── callback/      # Auth callback
│   │
│   ├── components/
│   │   ├── shared/            # Reusable components
│   │   │   ├── Modal.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   └── NotificationSystem.tsx
│   │   └── auth/              # Auth components
│   │       ├── JoinLeague.tsx
│   │       └── UpgradePrompt.tsx
│   │
│   └── lib/
│       ├── types.ts           # TypeScript types
│       ├── supabase.ts        # Supabase client
│       ├── scoring.ts         # Scoring logic
│       ├── haptics.ts         # Haptic feedback
│       ├── auth/              # Auth functions
│       │   ├── anonymous.ts
│       │   ├── upgrade.ts
│       │   └── signin.ts
│       └── api/               # API clients
│           ├── openf1.ts
│           └── ergast.ts
│
├── supabase/
│   └── schema.sql             # Database schema
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

---

## 🔄 Continue Building in Claude Code

### Start Claude Code

```bash
cd ~/Documents/Obsidian\ Vault/Claude\ Code/F1/f1-fantasy-app
claude
```

### Prompt for Claude Code:

```
I have the foundation for my F1 Fantasy League app built. 

Read these architecture docs:
- f1-app-architecture.md
- f1-api-integration.md
- f1-component-specs.md
- f1-auth-system.md

The foundation includes:
✅ Auth system (anonymous + verified)
✅ Database schema
✅ API clients (OpenF1, Ergast)
✅ Base components
✅ Utilities

Next, I need to build:
1. League creation flow
2. Draft interface (snake draft with timer)
3. Live scoring interface (API auto-fill + manual override)
4. Season standings

Start with the league creation flow. Create the pages and components needed.
```

---

## 🐛 Troubleshooting

### Error: Supabase not configured

**Fix:** Check your `.env.local` file has correct values from Supabase dashboard

### Error: Database tables don't exist

**Fix:** Run the SQL migration in Supabase SQL Editor

### Error: Auth callback not working

**Fix:** 
1. Check Supabase **Authentication > URL Configuration**
2. Add `http://localhost:3000/auth/callback` to redirect URLs

### Error: CORS issues with APIs

**Fix:** OpenF1 and Ergast have CORS enabled. If issues persist, add proxy in `next.config.js`

---

## 📚 Key Files to Reference

**Authentication:**
- `src/lib/auth/anonymous.ts` - Anonymous player creation
- `src/lib/auth/upgrade.ts` - Account upgrade
- `src/lib/auth/signin.ts` - Sign in/out

**APIs:**
- `src/lib/api/openf1.ts` - Live race data
- `src/lib/api/ergast.ts` - Race calendar & grids

**Scoring:**
- `src/lib/scoring.ts` - Point calculation logic

**Database:**
- `supabase/schema.sql` - Complete schema

---

## 🎯 Next Steps

1. **Test the foundation locally**
2. **Open Claude Code** and continue building features
3. **Reference architecture docs** when implementing
4. **Deploy to Vercel** when ready

---

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- OpenF1 API: https://openf1.org
- Ergast API: https://ergast.com/mrd/

---

**Built with:** Next.js 14, TypeScript, Tailwind CSS, Supabase

**Status:** Foundation Complete ✅ | Features In Progress 🚧
