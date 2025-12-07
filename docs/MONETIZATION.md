# Grid Kings - Monetization Strategy

> Last updated: December 2024

## Overview

Grid Kings uses a **freemium + native ads** model:
- **Free tier:** Full features with native sponsor cards
- **Pro tier:** Ad-free experience ($24/year or $3/month)

The focus is maximum user growth first, monetization second.

---

## Pricing

| Tier | Price | Experience |
|------|-------|------------|
| Free | $0 | All features, native sponsor cards in feed |
| Pro | $24/year | Ad-free, same features |
| Pro Monthly | $3/month | Ad-free, same features |

**Founding Member Rate (2026):** $19/year locked forever

---

## Native Sponsor Cards

### Concept

Ads appear as cards styled identically to driver cards, inserted into the grid feed. They feel native to the experience rather than intrusive overlays.

### Card Design

```
┌─────────────────────────────────────────────────┐
│ [Sponsor gradient - matches driver card style]  │
│                                                 │
│  [Icon]  Sponsor Name                           │
│          Headline text (short)                  │
│                                    [CTA Button] │
│                                            Ad   │
└─────────────────────────────────────────────────┘
```

**Specs:**
- Same dimensions as DriverCard component
- Same border radius (14px)
- Gradient background (sponsor brand colors)
- Small "Ad" label in corner for transparency
- Tappable - opens external link or in-app browser

### Placement Strategy

| Location | When | Notes |
|----------|------|-------|
| After P4 in grid | Live race | High visibility, natural scroll pause |
| After P10 in grid | Live race | Midfield break, less intrusive |
| Home page feed | Always | Between race card and leagues |
| Post-race summary | After race | Lower intent, higher engagement |
| League hub | In league | Between standings and history |

**Rules:**
- Maximum 1 sponsor card per screen/scroll viewport
- Never interrupt critical race moments
- Never cover timing data
- Always clearly labeled as "Ad"

### Card Variations

**Affiliate Card:**
```typescript
{
  type: 'affiliate',
  sponsor: 'F1 TV',
  gradient: { from: '#E10600', to: '#1E1E1E' },
  icon: '📺',
  headline: 'Never miss a moment',
  cta: 'Start Free Trial',
  ctaUrl: 'https://f1tv.formula1.com/?ref=gridkings',
  trackingId: 'f1tv_grid_001'
}
```

**Merch Card (Contextual):**
```typescript
{
  type: 'merch',
  sponsor: 'McLaren Store',
  gradient: { from: '#FF8000', to: '#1E1E1E' },
  icon: '🧢',
  headline: 'Rep the papaya',
  cta: 'Shop Now',
  ctaUrl: 'https://store.mclaren.com/?ref=gridkings',
  contextTrigger: 'mclaren_driver_podium' // Show when McLaren driver on podium
}
```

**Game Card:**
```typescript
{
  type: 'game',
  sponsor: 'EA Sports F1 24',
  gradient: { from: '#1A1A2E', to: '#E10600' },
  icon: '🎮',
  headline: 'Drive the grid yourself',
  cta: 'Download',
  ctaUrl: 'https://www.ea.com/games/f1/f1-24',
  trackingId: 'ea_f124_001'
}
```

---

## Upgrade Flow

### Trigger Points

Users see upgrade prompts in:
1. **Settings page** - Primary upgrade location
2. **Sponsor card itself** - "Remove ads" link
3. **Onboarding** - Mention Pro tier exists (soft)

### Settings Page UI

```
┌─────────────────────────────────────────────────┐
│  ⚙️  Settings                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ACCOUNT                                        │
│  ├─ Profile                                     │
│  ├─ Notifications                               │
│  └─ Sign Out                                    │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✨ GO PRO                                      │
│                                                 │
│  Remove sponsor cards for a cleaner experience  │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  $24/year                               │   │
│  │  Best value - save 33%                  │   │
│  │                          [Choose Plan]  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  $3/month                               │   │
│  │  Flexible, cancel anytime              │   │
│  │                          [Choose Plan]  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Pro members enjoy:                             │
│  • No sponsor cards in feed                     │
│  • Support Grid Kings development               │
│  • Early access to new features                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Payment Integration

**Recommended:** Stripe for web, RevenueCat for mobile (if app store)

For web-only MVP:
- Stripe Checkout for payment
- Stripe Customer Portal for subscription management
- Webhook to update user `subscription_tier` in Supabase

---

## Finding Advertisers & Pricing

### Phase 1: Affiliate Programs (Easiest Start)

No sales required - sign up for existing programs and earn per conversion.

| Partner | Program | Commission | How to Join |
|---------|---------|------------|-------------|
| F1 TV | Affiliate | ~$10-20/signup | Apply at formula1.com partners |
| Amazon (F1 merch) | Associates | 4-8% | affiliate-program.amazon.com |
| Fanatics (team gear) | Affiliate | 5-10% | fanatics.com/affiliate |
| EA Games | Affiliate | $2-5/install | ea.com/affiliate |
| Betting (where legal) | Affiliate | $50-100/signup | Various (complex regulations) |

**Affiliate is best for < 50K users** - no negotiation, instant setup, performance-based.

### Phase 2: Direct Sponsorship (With Scale)

Once you have 25K+ MAU, approach brands directly.

**Target sponsors:**
- F1 TV (official streaming)
- Team merchandise stores
- Racing games (F1 24, Gran Turismo)
- Automotive brands (tire companies, etc.)
- Sports betting (DraftKings, FanDuel - where legal)
- Travel (race weekend packages)

**How to pitch:**
1. Build a media kit (user stats, demographics, engagement)
2. Email marketing/partnerships contacts
3. Offer exclusive placement or sponsored features
4. Start with 30-day trial at reduced rate

### Pricing Guide

**CPM (Cost Per 1,000 Impressions):**
- Generic display ads: $2-5 CPM
- Niche sports audience: $5-15 CPM
- Premium native placement: $15-30 CPM
- Exclusive sponsorship: $30-50+ CPM

**Example calculation:**
- 10,000 MAU × 20 impressions/race × 24 races = 4.8M impressions/year
- At $10 CPM = $48,000/year potential
- At $5 CPM = $24,000/year potential

**CPC (Cost Per Click):**
- Typical: $0.50 - $2.00 per click
- High-intent (betting): $5-20 per click

**Flat Rate Sponsorship:**
- "Presented by [Sponsor]" for season: $5,000 - $50,000+ (depends on audience size)
- Per-race sponsorship: $500 - $5,000

### Phase 3: Ad Networks (Fallback)

If direct sales are too much work, use ad networks:

| Network | Pros | Cons |
|---------|------|------|
| Google AdSense | Easy setup | Low CPM ($1-3), generic ads |
| Carbon Ads | Dev/tech focused | Limited F1 relevance |
| BuySellAds | Direct marketplace | Need traffic first |
| Raptive | Premium | Need 100K+ pageviews/month |

**Recommendation:** Start with affiliates, graduate to direct sales with scale.

---

## Revenue Projections

### Conservative (Year 1)

| Source | Assumption | Revenue |
|--------|------------|---------|
| Affiliate | 100 conversions × $15 avg | $1,500 |
| Pro subscriptions | 200 users × $24 | $4,800 |
| **Total** | | **$6,300** |

### Growth (Year 2, 25K users)

| Source | Assumption | Revenue |
|--------|------------|---------|
| Affiliate | 500 conversions × $15 avg | $7,500 |
| Pro subscriptions | 1,250 users (5%) × $24 | $30,000 |
| Direct sponsorship | 2 sponsors × $5,000 | $10,000 |
| **Total** | | **$47,500** |

### Scale (Year 3, 100K users)

| Source | Assumption | Revenue |
|--------|------------|---------|
| Affiliate | 2,000 conversions × $15 avg | $30,000 |
| Pro subscriptions | 5,000 users (5%) × $24 | $120,000 |
| Direct sponsorship | 4 sponsors × $15,000 | $60,000 |
| **Total** | | **$210,000** |

*These are rough estimates - actual results vary wildly.*

---

## Implementation Checklist

### Phase 1: Foundation (Build Now)
- [ ] Add `subscription_tier` field to User model
- [ ] Create SponsorCard component (mirrors DriverCard styling)
- [ ] Add Settings page with upgrade section
- [ ] Implement Stripe Checkout integration
- [ ] Add subscription status check to hide/show sponsor cards

### Phase 2: Ads (When Ready)
- [ ] Sign up for F1 TV affiliate program
- [ ] Sign up for Amazon Associates
- [ ] Create sponsor card content management (hardcoded initially)
- [ ] Add placement logic for sponsor cards in feed
- [ ] Implement click tracking for attribution

### Phase 3: Scale (With Users)
- [ ] Build media kit with user analytics
- [ ] Reach out to direct sponsors
- [ ] A/B test sponsor card placements
- [ ] Implement contextual ads (team-specific based on results)
- [ ] Consider ad network integration as supplement

---

## User Data Model Update

```typescript
interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  subscription_tier: 'free' | 'pro'
  subscription_expires_at?: string  // For annual/monthly tracking
  stripe_customer_id?: string
  created_at: string
}
```

---

## Key Principles

1. **Never degrade the core experience** - Ads are additive, not blocking
2. **Native over intrusive** - Sponsor cards feel like content
3. **Transparent** - Always label ads clearly
4. **User choice** - Easy path to ad-free if desired
5. **Relevant** - F1-related sponsors only, no generic garbage
6. **Growth first** - Don't optimize monetization until you have users

---

## Resources

- Stripe Docs: https://stripe.com/docs
- RevenueCat (mobile): https://www.revenuecat.com/
- F1 affiliate inquiries: Check formula1.com footer for partnerships
- Amazon Associates: https://affiliate-program.amazon.com/
