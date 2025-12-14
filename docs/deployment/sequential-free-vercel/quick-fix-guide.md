# Vercel Deployment Hang - Quick Action Guide

> **TL;DR:** 6 parallel GitHub Actions jobs → Vercel queues them (max 1-12 concurrent) → CLI hangs indefinitely waiting → no error message

---

## 🚨 IMMEDIATE ACTIONS (Next 30 Minutes)

### 1. STOP THE BLEEDING
```bash
# In GitHub Actions:
# Cancel all 6 stuck workflow runs

# Or via CLI:
gh run cancel <run-id> --repo <org/repo>
```

### 2. VERIFY YOUR BOTTLENECK
```bash
# Is it a concurrency issue?
# Go to: https://vercel.com/account/billing
# Note: Concurrent Builds limit (1 = Hobby, 12 = Pro)

# Is it Turbopack?
# Try locally:
cd apps/dashboard
npm run build  # Should see: ▲ Next.js 15.5.6 (Turbopack)
# If this hangs locally → Turbopack issue
# If this works locally but hangs on Vercel CI → Concurrency issue
```

### 3. QUICK TEST: DISABLE TURBOPACK
```javascript
// apps/dashboard/next.config.js
const nextConfig = {
  experimental: {
    turbopack: false,  // Temporarily test with webpack
  },
};
module.exports = nextConfig;
```

Then test locally:
```bash
cd apps/dashboard
npm run build
```

**If this works locally:** Turbopack is unstable  
**If this still hangs:** Monorepo build ordering issue

---

## 🔍 DIAGNOSTIC FLOWCHART

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions triggers 6 parallel jobs: vercel --prod     │
│  (dashboard, entities, payments, agency, reports, shell)    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────┐
            │ Check Vercel account concurrency │
            │ (https://vercel.com/account)     │
            └──────────────┬───────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
     Hobby (1) or                      Pro (12)
     1st attempt queues           Multiple queues possible
          │                                 │
          ▼                                 ▼
   Only 1 builds at               Max 12 concurrent
   time; 5 queue                  (likely only 5-6 in use)
          │                                 │
          ▼                                 ▼
   CLI waits forever            CLI waits for queue
   (no timeout)                 (no queue feedback)
          │                                 │
          └────────────────┬────────────────┘
                           │
                           ▼
              Does Vercel dashboard show:
              - Builds still "BUILDING"? → Check 3a
              - Builds "QUEUED"? → Check 3b
              - Build failed/error? → Check 3c
                           │
        ┌──────────┬──────────┬──────────┐
        │          │          │          │
        ▼3a        ▼3b        ▼3c        ▼
    BUILDING  QUEUED      FAILED    UNKNOWN
        │          │          │
        │          │      Check CI
        ▼          │      logs for
   Turbopack       │      error
   hanging        │
        │         ▼
        │     Queue timeout?
        │     (>30 min)
        │         │
        ▼         ▼
   Issue:    Issue:
   Turbo     Vercel
   hang      queue
        │         │
        └────┬────┘
             │
             ▼
    Apply mitigation
    (see below)
```

---

## 🛠️ IMMEDIATE FIXES (Pick One)

### FIX #1: Sequential Deployment (SAFEST, 10 min setup)
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Vercel Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}

jobs:
  deploy-dashboard:
    name: Deploy Dashboard
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - run: npm install --global vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_DASHBOARD }}
      - id: deploy
        run: timeout 600 vercel --prod --token=${{ secrets.VERCEL_TOKEN }} > deployment.log 2>&1
        env:
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_DASHBOARD }}
      - run: cat deployment.log && grep -oP '(?<=deployed:\s)[^\s]+' deployment.log | head -1 > url.txt || echo "unknown" > url.txt
      - run: echo "url=$(cat url.txt)" >> $GITHUB_OUTPUT
        id: deploy

  # Then next job depends on previous:
  deploy-entities:
    needs: deploy-dashboard  # ← KEY: Makes it sequential
    # ... same structure
    
  deploy-payments:
    needs: deploy-entities
    # ... same structure
    
  deploy-agency:
    needs: deploy-payments
    # ... same structure
    
  deploy-reports:
    needs: deploy-agency
    # ... same structure
    
  deploy-shell:
    needs: [deploy-dashboard, deploy-entities, deploy-payments, deploy-agency, deploy-reports]
    # ... takes all URLs
```

**Why it works:** One job at a time respects Vercel's concurrency limits, no queuing occurs.

---

### FIX #2: Turbopack Disabled Fallback (5 min setup)
```bash
# Test if Turbopack is the issue
cd apps/dashboard

# Create next.config.js with turbopack disabled:
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: false,  // Fallback to webpack
  },
};
module.exports = nextConfig;
EOF

# Test build
npm run build  # If this works, Turbopack is unstable
```

Then update all app build commands:
```bash
# Remove --turbopack flag everywhere
# From: next build --turbopack
# To:   next build

# Or keep the flag but let next.config.js disable it
```

---

### FIX #3: Hybrid Local Build + Vercel Deploy (30 min setup)
Instead of letting Vercel build (and queue), build on GitHub Actions first:

```yaml
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [dashboard, entities, payments, agency, reports]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      # Build on GitHub (doesn't hit Vercel queue)
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=${{ matrix.app }}
      
      # Deploy pre-built to Vercel
      - run: npm install --global vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets[format('VERCEL_PROJECT_ID_{0}', matrix.app)] }}
      
      # Tell Vercel NOT to build (already built)
      - run: timeout 600 vercel --prod --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets[format('VERCEL_PROJECT_ID_{0}', matrix.app)] }}
```

**Pros:** Avoids Vercel queue entirely, builds use same cache  
**Cons:** Longer GitHub Actions job time, uses more Actions minutes

---

## 📊 VERIFICATION MATRIX

After applying a fix, verify it worked:

| Check | How | Expected | If Failed |
|-------|-----|----------|-----------|
| **No queue** | Vercel dashboard → click deployment | Status shows "Building" → "Deployed" (no "Queued" step) | Queue still present → try next fix |
| **Build succeeds** | Check deployment URL is live | App loads without errors | Check build logs for errors |
| **Timeout works** | Intentionally break build locally, run workflow | Job fails within 10 min with timeout error | CI hangs past 10 min → timeout flag not working |
| **All 6 deployed** | Vercel dashboard shows 6 projects deployed | All with recent timestamps | Some missing → check shell app dependencies |

---

## 🔑 KEY CONFIGURATION CHANGES NEEDED

### 1. Add Timeout
**Before:**
```yaml
run: URL=$(vercel --prod --token=${{ secrets.VERCEL_TOKEN }})
```

**After:**
```yaml
run: timeout 600 vercel --prod --token=${{ secrets.VERCEL_TOKEN }} || echo "ERROR: Deployment timed out"
```

### 2. Add Job Dependencies (Sequential)
**Before:**
```yaml
jobs:
  deploy-dashboard:  # Runs immediately
  deploy-entities:   # Runs immediately (parallel)
  deploy-payments:   # Runs immediately (parallel)
```

**After:**
```yaml
jobs:
  deploy-dashboard:
    runs-on: ubuntu-latest

  deploy-entities:
    needs: deploy-dashboard    # ← Waits for dashboard
    runs-on: ubuntu-latest

  deploy-payments:
    needs: deploy-entities     # ← Waits for entities
    runs-on: ubuntu-latest
```

### 3. Add Build Verbosity (Optional)
```yaml
run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }} --debug 2>&1 | tee vercel.log
# Then: cat vercel.log in next step
```

---

## 🎯 EXPECTED TIMELINE

- **Sequential workflow:** 10-15 minutes total (5 apps × 2-3 min each + shell)
- **Turbopack disabled:** Should be 5-8 minutes total
- **Hybrid (build on Actions):** 15-20 minutes total

If deployment time is **>30 minutes**, something is still wrong. Check:
1. Vercel dashboard logs for build errors
2. GitHub Actions logs for timeout errors
3. If Turbopack still mentioned → it wasn't disabled properly

---

## ⚠️ COMMON MISTAKES

```
❌ DO NOT:
- Keep parallel jobs without on-demand concurrency purchased
- Ignore Vercel dashboard build status
- Assume "no error" = "no problem" (silent hangs!)
- Delete .next cache before investigating

✅ DO:
- Add explicit timeout (600 seconds = 10 min is reasonable)
- Make sequential workflow first, optimize later
- Check Vercel logs when CI logs show nothing
- Test build command locally first (npm run build)
```

---

## 📞 ESCALATION PATH

If none of the above fixes the hang:

1. **Collect evidence:**
   ```bash
   # Save these outputs
   node --version
   pnpm --version
   vercel --version
   cat turbo.json | grep -A 5 '"build"'
   npm run build 2>&1 | head -50  # First 50 lines of local build
   ```

2. **Open Vercel support ticket** with:
   - Your account tier + concurrent build limit
   - Link to stuck deployment(s)
   - Output from commands above
   - Ask about: "Turbopack hanging in 15.5.6 with pnpm monorepo"

3. **Ask about upgrade options:**
   - Enable On-Demand Concurrent Builds (Pro plan, ~$50/month)
   - Enterprise plan with custom concurrency

---

## 🎓 LEARNING: Why This Happened

**The Perfect Storm:**

| Factor | Impact |
|--------|--------|
| Vercel default concurrency = 1-12 | Can't handle 6+ simultaneous builds without queuing |
| GitHub Actions parallelizes 6 jobs | All 6 start at once, all 6 request builds |
| `vercel --prod` CLI blocks indefinitely | No timeout, no feedback while queued |
| Turbopack unproven in monorepos | May compound memory issues |
| No explicit timeout in workflow | GitHub Actions 6-hour timeout doesn't help queued processes |

**Result:** 6 jobs queued, 5 waiting forever, CLI process not responding, no error message.

---

## ✅ PREVENTION FOR NEXT TIME

- [ ] Test production workflow in staging environment first
- [ ] Set reasonable timeouts on all long-running tasks
- [ ] Monitor Vercel dashboard during deployments
- [ ] Keep Turbopack/Next.js up-to-date (15.5.6 may have fixes in 15.6+)
- [ ] Document deployment concurrency limits for your account
- [ ] Set up alerts if deployment takes >10 minutes

---

**Last Updated:** December 14, 2025  
**Prepared For:** Monorepo with 6 Next.js apps on Vercel + GitHub Actions  
**Critical Issue:** All 6 deployments stuck at build optimization step, no error messages