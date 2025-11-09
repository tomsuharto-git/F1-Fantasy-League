# Supabase Setup Guide - F1 Fantasy League

## 🗄️ Set Up Supabase Database (30 minutes)

The F1 Fantasy League requires a Supabase database for:
- **Authentication** (anonymous + verified email)
- **League management** (leagues, players, teams)
- **Draft system** (draft picks, snake order)
- **Race tracking** (results, scores, standings)
- **Real-time updates** (live draft, race scoring)

---

## Step 1: Create Supabase Project

### 1.1 Sign Up / Log In
1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign in with GitHub (recommended)

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in details:
   - **Name:** `F1 Fantasy League` (or any name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to you (e.g., US East, EU West)
   - **Pricing Plan:** Free (perfect for testing)
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to provision

---

## Step 2: Run Database Migration

### 2.1 Open SQL Editor
1. In your Supabase project dashboard
2. Click **"SQL Editor"** in left sidebar
3. Click **"New query"**

### 2.2 Copy Schema SQL
1. Open `supabase/schema.sql` in your project
2. Copy the **entire file** contents
3. Paste into the SQL Editor

### 2.3 Execute Migration
1. Click **"Run"** (or press Cmd/Ctrl + Enter)
2. Wait for confirmation: "Success. No rows returned"
3. Verify tables were created:
   - Click **"Table Editor"** in left sidebar
   - You should see: `leagues`, `players`, `races`, `draft_picks`, `race_results`

---

## Step 3: Get API Credentials

### 3.1 Navigate to API Settings
1. Click **"Settings"** in left sidebar (gear icon)
2. Click **"API"**

### 3.2 Copy Credentials
You'll need two values:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**Anon/Public Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...
```

> ⚠️ **Important:** The `anon` key is safe to use in your frontend. DO NOT use the `service_role` key!

---

## Step 4: Configure Local Environment

### 4.1 Create `.env.local`
```bash
cd /Users/tomsuharto/Documents/Obsidian\ Vault/Claude\ Code/F1/f1-fantasy-app
cp .env.local.example .env.local
```

### 4.2 Edit `.env.local`
Open `.env.local` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 💡 **Tip:** Never commit `.env.local` to git - it's already in `.gitignore`

---

## Step 5: Configure Authentication

### 5.1 Enable Email Auth
1. Go to **Authentication** → **Providers**
2. Ensure **"Email"** is enabled (should be by default)
3. Configure email templates (optional):
   - Click **"Email Templates"**
   - Customize "Magic Link" template if desired

### 5.2 Set Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add these redirect URLs:
   ```
   http://localhost:3000/auth/callback
   https://your-vercel-app.vercel.app/auth/callback
   ```
   (Add Vercel URL after deployment)

### 5.3 Configure Site URL
Set **Site URL** to:
```
http://localhost:3000
```
(Update to Vercel URL after deployment)

---

## Step 6: Verify Setup

### 6.1 Test Database Connection
```bash
cd /Users/tomsuharto/Documents/Obsidian\ Vault/Claude\ Code/F1/f1-fantasy-app
npm install
npm run dev
```

### 6.2 Check Browser Console
1. Open http://localhost:3000
2. Open browser DevTools (F12)
3. Look for any Supabase errors
4. Should see no connection errors

### 6.3 Test Table Access
1. Go to **Table Editor** in Supabase
2. Click on `leagues` table
3. Try adding a test row manually
4. Verify row appears (confirms database is working)

---

## Database Schema Overview

Your database now has these tables:

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `leagues` | League settings | name, type, max_races, drivers_per_team |
| `players` | League participants | name, email, color, is_ready |
| `races` | Individual races | league_id, round, circuit, status |
| `draft_picks` | Draft selections | race_id, player_id, driver_code, pick_number |
| `race_results` | Race scores | race_id, player_id, final_position, points |

### Special Features

**Row-Level Security (RLS):**
- ✅ All tables have RLS policies enabled
- Players can only see their own leagues
- Public data is read-only for anonymous users

**Real-time Subscriptions:**
- ✅ Enabled on all tables
- Powers live draft updates
- Powers waiting room player status

**Views:**
- `season_standings` - Aggregates points across multiple races

---

## Environment Variables Summary

### Development (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)
Same variables, but update `NEXT_PUBLIC_APP_URL`:
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Troubleshooting

### "Failed to fetch" Error
**Cause:** Incorrect Supabase URL or key  
**Fix:** Double-check credentials in `.env.local` match Supabase dashboard

### "Row-level security policy violation"
**Cause:** Database policies not set up correctly  
**Fix:** Re-run `supabase/schema.sql` - it includes all RLS policies

### Tables Don't Exist
**Cause:** Migration SQL didn't run successfully  
**Fix:** 
1. Go to SQL Editor
2. Click **"Query History"**
3. Check if schema.sql ran without errors
4. If errors, fix and re-run

### Real-time Not Working
**Cause:** Real-time not enabled on tables  
**Fix:**
1. Go to **Database** → **Replication**
2. Ensure all tables have replication enabled
3. Re-run schema.sql (it includes REPLICA IDENTITY settings)

---

## Next Steps

✅ **Supabase is ready!** You can now:

1. **Test locally:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

2. **Deploy to Vercel:**
   - See `VERCEL-DEPLOYMENT-GUIDE.md`
   - Add same environment variables to Vercel

3. **Create your first league:**
   - Test the create league flow
   - Invite friends with share link
   - Run a practice draft!

---

## Supabase Dashboard Quick Links

- **SQL Editor:** Run queries and migrations
- **Table Editor:** View/edit data manually
- **Authentication:** Manage users and settings
- **Database:** View schema and performance
- **API:** Get credentials and documentation
- **Logs:** Debug errors and monitor usage

---

**Status:** Supabase setup complete ✅  
**Next:** Deploy to Vercel!

🔗 **Supabase Dashboard:** https://supabase.com/dashboard  
📖 **Supabase Docs:** https://supabase.com/docs
