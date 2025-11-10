# Phone Authentication Setup Guide

Complete guide to configure phone number authentication with SMS OTP for your F1 Fantasy League app.

---

## Overview

Phone authentication allows users to sign in using their phone number. Supabase sends a one-time password (OTP) via SMS, which the user enters to verify their identity.

---

## Prerequisites

You need an **SMS provider** to send OTP codes. Supabase supports:
- **Twilio** (most popular, reliable)
- **MessageBird**
- **Textlocal**
- **Vonage**

This guide uses **Twilio** as it's the most commonly used.

---

## Step 1: Create a Twilio Account

1. Go to [Twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number
4. You'll get **$15 free credit** to test with

---

## Step 2: Get Your Twilio Credentials

### Get Account SID and Auth Token

1. Go to [Twilio Console](https://console.twilio.com)
2. You'll see your **Account SID** and **Auth Token** on the dashboard
3. Copy both values - you'll need them for Supabase

### Get a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country
3. Choose a phone number (free trial gives you one number)
4. Click **Buy** to purchase the number
5. Copy your new phone number (format: `+1234567890`)

---

## Step 3: Configure Twilio for SMS

1. In Twilio Console, verify your phone number is active
2. For **trial accounts**, you can only send SMS to verified phone numbers
3. To verify a number: **Phone Numbers** → **Verified Caller IDs** → **Add a new number**
4. For **production**, upgrade your Twilio account to send to any number

---

## Step 4: Configure Supabase

### Enable Phone Authentication

1. Go to your Supabase project dashboard
2. Click **Authentication** in the left sidebar
3. Click **Providers** tab
4. Find **Phone** in the list
5. Toggle it **ON**

### Add Twilio Credentials

In the Phone provider settings, enter:

- **Twilio Account SID**: Your Account SID from Step 2
- **Twilio Auth Token**: Your Auth Token from Step 2
- **Twilio Phone Number**: Your Twilio number (format: `+1234567890`)

Click **Save**

---

## Step 5: Configure Phone Templates (Optional)

1. In Supabase → **Authentication** → **Providers** → **Phone**
2. Scroll down to **SMS Template**
3. Customize the OTP message (default works fine):

```
Your verification code is: {{ .Code }}
```

You can customize it to:

```
Your F1 Fantasy League verification code is: {{ .Code }}

This code expires in 60 seconds.
```

---

## Step 6: Test Phone Authentication

### Local Testing

1. Run your app locally:
```bash
npm run dev
```

2. Visit http://localhost:3000/signin
3. Click the **Phone** tab
4. Enter your phone number (must be verified in Twilio for trial accounts)
5. Click **Send OTP Code**
6. Check your phone for the SMS
7. Enter the 6-digit code
8. Click **Verify & Sign In**

### What to Expect

- OTP codes are **6 digits**
- Codes expire after **60 seconds**
- Each OTP can only be used **once**
- You can request a new code if it expires

---

## Production Configuration

### Upgrade Twilio Account

For production use, you'll need to upgrade your Twilio account:

1. Go to Twilio Console → **Billing**
2. Add payment method
3. Upgrade from trial to paid account
4. This allows sending SMS to any phone number worldwide

### Cost Estimates (Twilio)

- **SMS to US/Canada**: ~$0.0075 per message
- **SMS to International**: Varies by country ($0.01 - $0.15)
- **Monthly phone number rental**: ~$1.00/month

For 1,000 users signing in monthly = ~$7.50 in SMS costs

### Add Production Domain

Make sure your production domain is configured in Supabase:

1. Go to **Authentication** → **URL Configuration**
2. Add your production domain to **Redirect URLs**

---

## Troubleshooting

### Error: "Unable to send SMS"

**Cause**: Twilio credentials are incorrect
**Fix**:
- Verify Account SID and Auth Token in Supabase
- Make sure there are no extra spaces when copying
- Check that your Twilio account is active

### Error: "Phone number is not verified"

**Cause**: Trying to send to unverified number on Twilio trial
**Fix**:
- Add the phone number to Verified Caller IDs in Twilio
- OR upgrade to paid Twilio account

### Error: "Invalid phone number format"

**Cause**: Phone number missing country code
**Fix**:
- Always include country code: `+1` for US, `+44` for UK, etc.
- Format: `+1234567890` (no spaces or dashes)

### Code expired

**Cause**: OTP codes expire after 60 seconds
**Fix**:
- Request a new code
- Enter the code faster
- Consider increasing timeout in Supabase settings (max 10 minutes)

### SMS not arriving

**Check**:
1. Verify phone number is correct
2. Check Twilio logs: Console → **Monitor** → **Logs** → **Messaging**
3. Make sure your Twilio account has credits
4. Check if your carrier is blocking SMS

---

## Alternative: Email OTP (Free)

If you want OTP authentication but don't want to pay for SMS, you can use **Email OTP** instead:

1. In Supabase → **Authentication** → **Providers** → **Email**
2. Enable **Enable Email OTP** (magic link alternative)
3. Users enter their email and receive a 6-digit code
4. No SMS provider needed - completely free!

To implement email OTP, modify the phone handlers:

```typescript
// Send email OTP instead of phone OTP
const { data, error } = await supabase.auth.signInWithOtp({
  email: formData.email, // Use email instead of phone
});

// Verify email OTP
const { data, error } = await supabase.auth.verifyOtp({
  email: formData.email,
  token: formData.otp,
  type: 'email',
});
```

---

## Security Best Practices

1. **Rate Limiting**: Supabase automatically rate-limits OTP requests (max 1 per minute per phone)
2. **Code Expiry**: Keep default 60-second expiry for security
3. **One-Time Use**: Codes are automatically invalidated after use
4. **HTTPS Only**: Always use HTTPS in production
5. **Store Phone Hashed**: Supabase automatically hashes phone numbers

---

## Quick Reference

### Phone Number Format
```
+1234567890  ✅ Correct
(123) 456-7890  ❌ Incorrect - remove formatting
1234567890  ❌ Incorrect - missing country code
```

### Twilio URLs
- Console: https://console.twilio.com
- Messaging Logs: https://console.twilio.com/monitor/logs/messages

### Supabase Phone Auth Docs
- https://supabase.com/docs/guides/auth/phone-login

---

## Current Status

✅ **Phone authentication UI added** - Toggle between Email/Phone on signin page
✅ **OTP send/verify handlers implemented**
⏳ **Twilio setup required** - Follow steps above to enable SMS
⏳ **Testing needed** - Configure Twilio, then test the flow

---

## Need Help?

If you run into issues:
1. Check Twilio logs for SMS delivery status
2. Check Supabase logs: **Authentication** → **Logs**
3. Verify phone number format includes country code
4. Test with a verified phone number on Twilio trial

---

**Ready to test?** Complete Steps 1-4 above, then try signing in with your phone number!
