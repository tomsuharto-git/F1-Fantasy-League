# Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd f1-fantasy-app
npm install
```

## Step 2: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and give project a name
4. Set a strong database password (save it!)
5. Choose a region close to you
6. Click "Create new project"

## Step 3: Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into query editor
5. Click **"Run"**
6. You should see "Success. No rows returned"

## Step 4: Enable Email Auth

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Email** provider
3. Enable it if not already enabled
4. Go to **Authentication** > **Email Templates**
5. Find "Magic Link" template
6. Customize if desired (optional)
7. Set "Magic Link" expiry to 3600 (1 hour)

## Step 5: Get API Keys

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

## Step 6: Configure Environment Variables

1. In your project folder, copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 7: Configure Auth Settings

1. In Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000`
3. Add **Redirect URL**: `http://localhost:3000/auth/callback`
4. Click **Save**

## Step 8: Run the App

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## Testing the Auth Flow

### Test Anonymous Flow:
1. Click "Create New League"
2. Enter league name
3. Join as player (just name + color)
4. Should work without any login!

### Test Upgrade Flow:
1. Complete a race in a season league
2. Upgrade prompt should appear
3. Enter your email
4. Check email for magic link
5. Click link → Account created!

## Troubleshooting

### "Failed to connect to Supabase"
- Check your `.env.local` file has correct values
- Make sure Supabase project is running
- Verify API keys are correct

### "SQL Error" when running migration
- Make sure you're in the SQL Editor
- Check you copied the entire migration file
- Try running it in smaller sections

### "Auth redirect failed"
- Verify redirect URL in Supabase matches exactly
- Check Site URL is set correctly
- Make sure app is running on the configured port

### Magic link not received
- Check spam folder
- Verify email provider is enabled in Supabase
- Check Supabase logs for errors

## Next Steps

Once the app is running:

1. **Review Architecture Docs**
   - Read `f1-app-architecture.md` for system overview
   - Check `f1-api-integration.md` for API details
   - Review `f1-component-specs.md` for UI components

2. **Start Building Features**
   - Use Claude Code to build league creation
   - Implement draft interface
   - Add live scoring

3. **Deploy to Production**
   - Update environment variables for prod
   - Deploy to Vercel
   - Update Supabase redirect URLs

## Useful Commands

```bash
# Development
npm run dev          # Start dev server

# Building
npm run build        # Build for production
npm start           # Start production server

# Linting
npm run lint        # Check for issues
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [OpenF1 API Docs](https://openf1.org)
- [Ergast API Docs](http://ergast.com/mrd/)

---

**Need Help?**
Check the main README.md or architecture docs in the parent folder.
