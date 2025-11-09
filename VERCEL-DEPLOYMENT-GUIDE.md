# Vercel Deployment Guide - F1 Fantasy League

## 🚀 Deploy to Vercel (Two Options)

You can deploy either via **Vercel Dashboard** (recommended, easier) or **Vercel CLI** (faster for experienced users).

---

## Option A: Deploy via Vercel Dashboard (Recommended)

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**

### Step 2: Import GitHub Repository
1. Click **"Import Git Repository"**
2. Search for **"F1-Fantasy-League"**
3. Click **"Import"**

### Step 3: Configure Project
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` (auto-filled)
- **Output Directory:** `.next` (auto-filled)

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add these:

**Required (Add Now):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Optional (Add Later):**
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

> ⚠️ **Important:** You need to set up Supabase first to get these values!
> See `SUPABASE-SETUP-GUIDE.md` for instructions.

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Click the deployment URL to view your app!

### Step 6: Configure Supabase Redirect URLs
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```

---

## Option B: Deploy via CLI

### Prerequisites
- Vercel CLI installed: `npm install -g vercel`
- Logged in: `vercel login`

### Step 1: Link Project
```bash
cd /Users/tomsuharto/Documents/Obsidian\ Vault/Claude\ Code/F1/f1-fantasy-app
vercel link
```

**When prompted:**
- Set up and deploy? **Y**
- Which scope? **tomsuharto-git** (your account)
- Link to existing project? **N**
- Project name? **f1-fantasy-league** (or press Enter for auto-generated)
- Directory? **./** (press Enter)

### Step 2: Add Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted
# Select: Production, Preview, Development (all three)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted
# Select: Production, Preview, Development (all three)
```

### Step 3: Deploy to Production
```bash
vercel --prod
```

Wait 2-3 minutes for deployment to complete. You'll get a URL like:
```
https://f1-fantasy-league.vercel.app
```

---

## Post-Deployment Checklist

### ✅ Verify Deployment
- [ ] Visit your Vercel URL
- [ ] Check that homepage loads correctly
- [ ] Open browser console - check for errors
- [ ] Test creating a league (will fail without Supabase)

### ✅ Configure Supabase
- [ ] Add Vercel URL to Supabase redirect URLs
- [ ] Test authentication flow
- [ ] Verify database connection works

### ✅ Test Core Features
- [ ] Create league flow
- [ ] Join league with share link
- [ ] Waiting room real-time updates
- [ ] Draft interface
- [ ] Live race scoring
- [ ] Season standings

### ✅ Set Up Auto-Deploy
Vercel automatically deploys when you push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel will auto-deploy in 2-3 minutes
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | Auto-detected by Vercel |

---

## Deployment URLs

Once deployed, your app will be available at:
- **Production:** `https://f1-fantasy-league.vercel.app` (or custom domain)
- **Preview:** Unique URL for each PR/branch
- **Development:** `http://localhost:3000`

---

## Troubleshooting

### Build Fails with "Module not found"
**Fix:** Run `npm install` locally first to update package-lock.json, then commit and push.

### Environment Variables Not Working
**Fix:** 
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Verify variables are set for "Production"
3. Redeploy: Vercel Dashboard → Deployments → [...] → Redeploy

### Supabase Connection Issues
**Fix:**
1. Check `.env.local` has correct values
2. Verify Vercel environment variables match
3. Check Supabase redirect URLs include your Vercel URL

### "Database table does not exist" Error
**Fix:** Run `supabase/schema.sql` in your Supabase SQL Editor

---

## Compare: Live Tracker vs Fantasy League

| Aspect | Grid Kings (Live Tracker) | F1 Fantasy League |
|--------|--------------------------|-------------------|
| **Vercel Project** | grid-kings | f1-fantasy-league |
| **URL** | grid-kings.vercel.app | f1-fantasy-league.vercel.app |
| **GitHub** | Grid-Kings | F1-Fantasy-League |
| **Database** | None (local state) | Supabase PostgreSQL |
| **Auth** | None | Supabase Auth |
| **Purpose** | Single-page viewer | Multiplayer league |

Both apps are completely independent - you can update one without affecting the other!

---

## Next Steps After Deployment

1. **Share with friends** - Send them the league creation link
2. **Test with real users** - Run a practice draft
3. **Monitor performance** - Check Vercel Analytics
4. **Collect feedback** - Iterate and improve
5. **Add custom domain** (optional) - e.g., `f1league.yourdomain.com`

---

## Quick Commands Reference

```bash
# View deployment status
vercel ls

# View project info
vercel inspect

# View logs
vercel logs

# Deploy to production
vercel --prod

# Open project in browser
vercel open
```

---

**Status:** Vercel configuration ready ✅  
**Next:** Set up Supabase, then deploy!

🔗 **GitHub:** https://github.com/tomsuharto-git/F1-Fantasy-League  
📦 **Vercel:** (Will be available after first deployment)
