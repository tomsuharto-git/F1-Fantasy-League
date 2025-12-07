# Grid Kings - Infrastructure Costs & Scaling

> Last updated: December 2024

## Overview

Grid Kings relies on:
- **Supabase** - Database, auth, realtime
- **Claude API** - AI insights and analysis
- **OpenF1 API** - Live race data (free, unofficial)
- **Vercel** - Hosting and serverless functions

---

## Cost Breakdown by Service

### Supabase

| Tier | Price | Database | Bandwidth | Realtime | MAU |
|------|-------|----------|-----------|----------|-----|
| Free | $0 | 500MB | 2GB | 200 concurrent | 50K |
| Pro | $25/mo | 8GB | 250GB | 500 concurrent | 100K |
| Team | $599/mo | Unlimited | Unlimited | Unlimited | Unlimited |

**When you'll upgrade:**
- Free → Pro: ~5-10K active users, or hitting realtime limits during races
- Pro → Team: ~50-100K users, or needing advanced features

**Realtime consideration:** During live races, many users connected simultaneously. Free tier's 200 concurrent connections could be limiting with 500+ users watching live.

---

### Claude API

| Model | Input Cost | Output Cost | Best For |
|-------|------------|-------------|----------|
| Claude 3.5 Sonnet | $3/1M tokens | $15/1M tokens | Complex analysis |
| Claude 3 Haiku | $0.25/1M tokens | $1.25/1M tokens | Fast, simple insights |

**Per-insight cost estimate:**
```
Input: ~500 tokens (race context, positions, recent events)
Output: ~200 tokens (insight text)

Sonnet: (500 × $0.000003) + (200 × $0.000015) = $0.0045/insight
Haiku:  (500 × $0.00000025) + (200 × $0.00000125) = $0.0004/insight
```

**Monthly cost by scale:**

| Users | Insights/Race | Races/Month | Haiku Cost | Sonnet Cost |
|-------|---------------|-------------|------------|-------------|
| 1K | 10K | 2 | $8 | $90 |
| 10K | 100K | 2 | $80 | $900 |
| 50K | 500K | 2 | $400 | $4,500 |

**Cost optimization strategies:**
1. **Use Haiku by default** - 10x cheaper, fast enough for most insights
2. **Cache common insights** - Don't regenerate "Verstappen is pulling away" for every user
3. **Batch processing** - Generate insights server-side, push to all users
4. **Rate limit free tier** - Fewer AI calls for non-paying users
5. **Sonnet for premium only** - Complex analysis as a paid feature

---

### OpenF1 API

**Current:** Free, unofficial, community-maintained

**No published rate limits, but responsible usage matters.**

**Risk factors:**
- Could be rate-limited or shut down
- No SLA or uptime guarantees
- F1 could send cease & desist

**Scaling concern:**
```
BAD:  1,000 users × polling every 5s = 12,000 requests/minute to OpenF1
GOOD: 1 server × polling every 5s = 12 requests/minute to OpenF1
```

---

### Vercel (Hosting)

| Tier | Price | Bandwidth | Serverless | Edge |
|------|-------|-----------|------------|------|
| Hobby | $0 | 100GB | 100GB-hrs | Limited |
| Pro | $20/mo | 1TB | 1000GB-hrs | Full |
| Enterprise | Custom | Unlimited | Unlimited | Full |

**When you'll upgrade:**
- Hobby → Pro: ~10-20K users, or hitting function limits
- Pro → Enterprise: 100K+ users

---

## Architecture: Server-Side Caching

### Current (Per-User Polling) - DON'T DO THIS
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ User 1  │────▶│         │     │         │
├─────────┤     │         │     │         │
│ User 2  │────▶│ OpenF1  │────▶│  Data   │
├─────────┤     │   API   │     │         │
│ User N  │────▶│         │     │         │
└─────────┘     └─────────┘     └─────────┘

Problem: N users = N × requests to OpenF1
At 1000 users polling every 5s = 12,000 req/min
```

### Better: Server-Side Cache
```
┌─────────────────────────────────────────────────────┐
│                    YOUR SERVER                       │
│  ┌──────────────┐     ┌──────────────┐             │
│  │   OpenF1     │────▶│    Cache     │             │
│  │   Poller     │     │  (Redis/KV)  │             │
│  │  (every 5s)  │     │              │             │
│  └──────────────┘     └──────┬───────┘             │
│                              │                      │
│                              ▼                      │
│                    ┌──────────────┐                 │
│                    │  WebSocket   │                 │
│                    │   Server     │                 │
│                    └──────┬───────┘                 │
└─────────────────────┬─────┴─────┬───────────────────┘
                      │           │
              ┌───────▼───┐ ┌─────▼─────┐
              │  User 1   │ │  User N   │
              └───────────┘ └───────────┘

Result: 12 req/min to OpenF1 regardless of user count
```

### Implementation Approach

**Option A: Vercel KV + Serverless**
```typescript
// API route that caches OpenF1 data
export async function GET() {
  const cached = await kv.get('race-data');

  if (cached && Date.now() - cached.timestamp < 5000) {
    return Response.json(cached.data);
  }

  const fresh = await fetchOpenF1();
  await kv.set('race-data', { data: fresh, timestamp: Date.now() });
  return Response.json(fresh);
}
```

**Option B: Server-Sent Events (SSE)**
```typescript
// Single connection that streams updates to all clients
// Server polls OpenF1 once, broadcasts to all connected users
```

**Option C: Supabase Realtime + Background Job**
```typescript
// Background job updates Supabase table every 5s
// Users subscribe to table changes via Supabase Realtime
```

**Recommendation:** Option C (Supabase) - you're already using it, built-in realtime, no additional infrastructure.

---

## Total Cost Projections

### Early Stage (< 1K users)
| Service | Cost |
|---------|------|
| Supabase | $0 (free) |
| Claude API | ~$20/month |
| Vercel | $0 (free) |
| OpenF1 | $0 (free) |
| **Total** | **~$20/month** |

### Growth Stage (1K - 10K users)
| Service | Cost |
|---------|------|
| Supabase | $25/month |
| Claude API | ~$100/month |
| Vercel | $20/month |
| OpenF1 | $0 (free) |
| **Total** | **~$145/month** |

### Scale Stage (10K - 50K users)
| Service | Cost |
|---------|------|
| Supabase | $25-100/month |
| Claude API | ~$500/month |
| Vercel | $20-50/month |
| OpenF1 | $0 (free, but risk) |
| **Total** | **~$550-650/month** |

### Large Scale (50K+ users)
| Service | Cost |
|---------|------|
| Supabase | $599/month |
| Claude API | ~$1,500/month |
| Vercel | $100+/month |
| Data licensing? | ??? |
| **Total** | **~$2,200+/month** |

---

## Break-Even Analysis

**At $500/month costs:**
- Need 250 Pro subscribers ($24/year = $2/month each)
- Or ~100K ad impressions/month at $5 CPM
- Or mix of both

**At 10K users with 5% conversion:**
- 500 Pro subscribers × $24/year = $12,000/year = $1,000/month
- Easily covers $145/month costs
- $855/month profit

**Unit economics work.** Challenge is user acquisition, not cost management.

---

## OpenF1 Sustainability & Alternatives

### Current Dependency
OpenF1 is great but risky at scale:
- No official relationship
- Could be shut down
- No rate limit guarantees

### Risk Mitigation
1. **Server-side caching** (reduces load, good citizen)
2. **Graceful degradation** (app works without live data)
3. **Multiple data sources** (backup APIs if available)
4. **Relationship building** (contribute to OpenF1, communicate usage)

### Long-term Alternatives

| Source | Cost | Reliability | Notes |
|--------|------|-------------|-------|
| OpenF1 | Free | Medium | Current, unofficial |
| F1 Official API | $$$ | High | Enterprise licensing |
| Ergast API | Free | Medium | Historical data only |
| Own scraping | Dev time | Low | Legal gray area |
| Data partnership | Negotiated | High | Requires scale/leverage |

**At 50K+ users:** Worth exploring official F1 data licensing or partnerships.

---

## Optimization Checklist

### Immediate (Build Now)
- [ ] Implement server-side OpenF1 caching
- [ ] Use Haiku for AI by default
- [ ] Cache AI insights per-race (not per-user)
- [ ] Set up cost monitoring/alerts

### At Scale (10K+ users)
- [ ] Implement Redis/KV for hot data
- [ ] Add AI rate limiting for free tier
- [ ] Monitor Supabase realtime connections
- [ ] Set up usage dashboards

### Large Scale (50K+ users)
- [ ] Evaluate Supabase Team tier
- [ ] Explore official data partnerships
- [ ] Consider dedicated infrastructure
- [ ] Implement geographic caching (CDN)

---

## Monitoring & Alerts

**Set up alerts for:**
- Supabase approaching tier limits
- Claude API spend exceeding budget
- Vercel function invocations spiking
- Error rates increasing

**Tools:**
- Supabase Dashboard (built-in)
- Anthropic Console (API usage)
- Vercel Analytics (built-in)
- Sentry (error tracking)

---

## Summary

| Stage | Users | Monthly Cost | Sustainable? |
|-------|-------|--------------|--------------|
| MVP | < 1K | ~$20 | ✅ Side project budget |
| Growth | 1-10K | ~$150 | ✅ Coffee money |
| Scale | 10-50K | ~$600 | ✅ Covered by 5% conversion |
| Large | 50K+ | ~$2,200 | ✅ If monetization works |

**Key insight:** Costs scale slower than revenue potential. The challenge is getting users, not paying for infrastructure.
