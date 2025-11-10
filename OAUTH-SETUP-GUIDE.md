# OAuth Provider Setup Guide

Quick guide to configure Google and Apple OAuth for your F1 Fantasy League app.

---

## Google OAuth Setup

### Step 1: Get Your Supabase Callback URL

1. Go to your Supabase project dashboard
2. Click **Authentication** in the left sidebar
3. Click **Providers** tab
4. Find the **Redirect URL** at the top of the page
5. Copy it - it looks like: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

### Step 2: Create Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing one)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: **F1 Fantasy League**
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue through the scopes (you can skip adding scopes)
   - Add test users if needed
   - Save and continue

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **F1 Fantasy League**
   - Authorized redirect URIs:
     - Add your Supabase callback URL from Step 1
     - Add `http://localhost:3000/auth/callback` for local testing
   - Click **CREATE**

7. Copy the **Client ID** and **Client Secret**

### Step 3: Configure in Supabase

1. Go back to Supabase → **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. Paste your **Client ID**
5. Paste your **Client Secret**
6. Click **Save**

✅ **Google OAuth is now configured!**

---

## Apple Sign In Setup

### Step 1: Prerequisites

You need an **Apple Developer Account** ($99/year)
- If you don't have one, sign up at [developer.apple.com](https://developer.apple.com)

### Step 2: Create Service ID

1. Go to [Apple Developer](https://developer.apple.com/account/)
2. Click **Certificates, Identifiers & Profiles**
3. Click **Identifiers** in the left sidebar
4. Click the **+** button to create a new identifier
5. Select **Services IDs** and click **Continue**
6. Fill in:
   - Description: **F1 Fantasy League**
   - Identifier: `com.yourname.f1fantasy` (must be unique)
   - Click **Continue** and **Register**

### Step 3: Configure Service ID

1. Click on your newly created Service ID
2. Check **Sign in with Apple**
3. Click **Configure**
4. In the configuration screen:
   - Primary App ID: Select or create an App ID (if you don't have one, create it first)
   - Domains and Subdomains: Add your Supabase project domain
     - Example: `YOUR-PROJECT-REF.supabase.co`
   - Return URLs: Add your Supabase callback URL
     - Example: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
5. Click **Save** and **Continue**

### Step 4: Create Private Key

1. Go to **Keys** in the left sidebar
2. Click the **+** button
3. Fill in:
   - Key Name: **F1 Fantasy League Key**
   - Check **Sign in with Apple**
   - Click **Configure**
   - Select your Primary App ID
4. Click **Save** and **Continue**
5. Click **Register**
6. **Download the key** (.p8 file) - you can only do this once!
7. Note the **Key ID** shown on the confirmation page

### Step 5: Get Team ID

1. Go to **Membership** in the left sidebar
2. Copy your **Team ID** (10-character string)

### Step 6: Generate Client Secret

Apple requires a JWT token as the client secret. You have two options:

**Option A: Use Supabase's built-in generator**
1. Go to Supabase → **Authentication** → **Providers** → **Apple**
2. Supabase should have a "Generate Client Secret" tool
3. Upload your .p8 key file
4. Enter your Key ID and Team ID
5. It will generate the secret for you

**Option B: Generate manually** (if Supabase doesn't have the tool)
You'll need to create a JWT token. This is more complex - I can help with this if needed.

### Step 7: Configure in Supabase

1. Go to Supabase → **Authentication** → **Providers**
2. Find **Apple** in the list
3. Toggle it **ON**
4. Fill in:
   - **Services ID**: Your Service ID (e.g., `com.yourname.f1fantasy`)
   - **Team ID**: Your 10-character Team ID
   - **Key ID**: The Key ID from your private key
   - **Secret Key**: Paste the contents of your .p8 file OR the generated JWT
5. Click **Save**

✅ **Apple Sign In is now configured!**

---

## Testing OAuth Providers

### Test Google OAuth:
```bash
npm run dev
```
1. Visit http://localhost:3000
2. Click "Continue with Google"
3. Sign in with your Google account
4. Should redirect back to dashboard

### Test Apple Sign In:
1. Visit http://localhost:3000
2. Click "Continue with Apple"
3. Sign in with your Apple ID
4. Should redirect back to dashboard

---

## Production Configuration

When deploying to production, make sure to:

### For Google:
1. Add your production domain to Authorized redirect URIs:
   - `https://your-domain.com/auth/callback`
   - `https://your-vercel-app.vercel.app/auth/callback`

### For Apple:
1. Add your production domain to Return URLs
2. Add production domain to Domains and Subdomains

---

## Troubleshooting

### Google OAuth Issues:

**Error: redirect_uri_mismatch**
- Make sure the redirect URI in Google Console exactly matches your Supabase callback URL
- Check for trailing slashes - they must match exactly

**Error: invalid_client**
- Double-check your Client ID and Client Secret
- Make sure they're copied correctly without extra spaces

### Apple Sign In Issues:

**Error: invalid_client**
- Verify your Service ID, Team ID, and Key ID are correct
- Make sure your .p8 key is correctly formatted

**Error: invalid_request**
- Check that your redirect URI is correctly configured in Apple Developer
- Verify the domain matches exactly

**JWT Expired**
- If using a manually generated JWT, it needs to be regenerated every 6 months

---

## Quick Reference

### Supabase Callback URL Format:
```
https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
```

### Local Development Callback:
```
http://localhost:3000/auth/callback
```

---

## Need Help?

If you run into issues:
1. Check the browser console for detailed error messages
2. Check Supabase logs: **Authentication** → **Logs**
3. Verify all redirect URIs match exactly (including http/https)

---

**Note:** Email/Password authentication works out of the box without any configuration!
