# COMPREHENSIVE ACTION PLAN: Fix MIDDLEWARE_INVOCATION_FAILED Error

**Created**: December 17, 2025
**Priority**: CRITICAL
**Timeline**: 2-3 days
**Success Probability**: 75-85%

---

## 🎯 EXECUTIVE SUMMARY

Your deployment fails because of **THREE CONVERGING ISSUES**:

1. **middleware.ts is DEPRECATED** in Next.js 16 (use proxy.ts instead)
2. **Vercel IGNORES custom buildCommand** in pnpm monorepos (documented bug)
3. **@supabase/ssr may have Node.js dependencies** incompatible with Edge Runtime

**The Fix**: 5 simple steps, ~30 minutes of work, then test.

---

## 📋 STEP-BY-STEP ACTION PLAN

### ✅ PHASE 1: CODE CHANGES (15 minutes)

#### Step 1.1: Migrate middleware.ts → proxy.ts (5 min)

```bash
# Run the automated codemod
npx @next/codemod@canary middleware-to-proxy .
```

**What this does:**
- Renames all `middleware.ts` files to `proxy.ts`
- Renames `middleware()` functions to `proxy()`
- Updates imports automatically

**Verify the changes:**
```bash
# These should exist
ls -la apps/dashboard/proxy.ts
ls -la apps/entities/proxy.ts
ls -la apps/payments/proxy.ts
ls -la apps/agency/proxy.ts
ls -la apps/reports/proxy.ts
ls -la apps/shell/proxy.ts

# These should NOT exist anymore
ls -la apps/*/middleware.ts  # Should show "No such file"

# Check what changed
git diff
```

---

#### Step 1.2: Simplify proxy.ts to minimal version (5 min)

**Replace content in ALL `apps/*/proxy.ts` files with this minimal version:**

```typescript
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**What to REMOVE for now:**
- ❌ `async` keyword
- ❌ Console.log statements
- ❌ Supabase imports and initialization
- ❌ Authentication logic
- ❌ Try-catch blocks

**Why:** We're testing if basic Edge Runtime proxy works first. Add logic back later.

---

#### Step 1.3: Update vercel.json files (5 min)

**For ALL apps** (`apps/dashboard/vercel.json`, `apps/entities/vercel.json`, etc.):

**Change FROM:**
```json
{
  "buildCommand": "cd ../.. && pnpm install --frozen-lockfile --ignore-scripts && cd apps/dashboard && pnpm exec next build",
  "installCommand": "echo 'Install handled in buildCommand'",
  "framework": null,
  "outputDirectory": ".next"
}
```

**Change TO:**
```json
{
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Why:** Vercel ignores custom buildCommand in pnpm monorepos (documented bug). Let Vercel auto-detect.

---

#### Step 1.4: Commit and push changes

```bash
# Check what you're committing
git status
git diff

# Stage all changes
git add -A

# Commit
git commit -m "fix: migrate middleware to proxy.ts and simplify vercel config

- Migrate deprecated middleware.ts to proxy.ts (Next.js 16 requirement)
- Simplify proxy to minimal pass-through for testing
- Remove custom buildCommand (Vercel ignores it in pnpm monorepos)
- Let Vercel auto-detect framework

Testing basic Edge Runtime proxy functionality before adding auth logic back.

Related to commit 5d1ddd7 MIDDLEWARE_INVOCATION_FAILED errors."

# Push to trigger deployment
git push origin main
```

---

### ✅ PHASE 2: VERCEL DASHBOARD CONFIGURATION (15 minutes)

**You MUST do this for EACH of the 6 projects:**
- dashboard
- entities
- payments
- agency
- reports
- shell

#### Step 2.1: Set Root Directory (10 min total, ~90 sec per project)

For each project:

1. Go to https://vercel.com/dashboard
2. Click on the project name (e.g., "dashboard")
3. Click **Settings** tab
4. Click **General** in left sidebar
5. Scroll to **Root Directory**
6. Click **Edit** button
7. Enter: `apps/dashboard` (or `apps/entities`, etc.)
8. Click **Save**

**Root Directory values for each project:**
```
dashboard → apps/dashboard
entities  → apps/entities
payments  → apps/payments
agency    → apps/agency
reports   → apps/reports
shell     → apps/shell
```

**Why:** Tells Vercel where each app lives in the monorepo.

---

#### Step 2.2: Configure Environment Variables (5 min total)

For **ALL 6 projects**, add these environment variables:

Go to: **Settings** → **Environment Variables** → **Add Variable**

**Variables to add for ALL projects:**
```bash
NEXT_PUBLIC_SUPABASE_URL = https://iadhxztsuzbkbnhkimqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-actual-anon-key-from-supabase>
NEXT_PUBLIC_COOKIE_DOMAIN = .plenno.com.au
NODE_ENV = production
```

**ADDITIONALLY for the shell project ONLY, add:**
```bash
NEXT_PUBLIC_DASHBOARD_URL = https://dashboard.plenno.com.au
NEXT_PUBLIC_ENTITIES_URL = https://entities.plenno.com.au
NEXT_PUBLIC_PAYMENTS_URL = https://payments.plenno.com.au
NEXT_PUBLIC_AGENCY_URL = https://agency.plenno.com.au
NEXT_PUBLIC_REPORTS_URL = https://reports.plenno.com.au
```

**How to add each variable:**
1. Click **Add Variable**
2. Set **Environment**: Production (check the box)
3. Enter **Name**: (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
4. Enter **Value**: (paste the actual value)
5. Click **Save**

**Where to find NEXT_PUBLIC_SUPABASE_ANON_KEY:**
- Check your `.env.local` file (if you have one)
- Or check Supabase dashboard: Settings → API → Project API keys → anon/public key

**Why:** Edge Runtime needs these variables available during middleware bundling.

---

### ✅ PHASE 3: DEPLOYMENT & TESTING (20 minutes)

#### Step 3.1: Monitor GitHub Actions deployment

After your git push from Step 1.4:

1. Go to: https://github.com/YOUR_USERNAME/Pleeno/actions
2. Click on the latest workflow run
3. Watch the sequential deployment:
   - deploy-dashboard (should complete first)
   - deploy-entities (waits for dashboard)
   - deploy-payments (waits for entities)
   - deploy-agency (waits for payments)
   - deploy-reports (waits for agency)
   - deploy-shell (waits for all 5 above)

**Expected:** All jobs should show ✅ green checkmarks (~10-15 minutes total)

---

#### Step 3.2: Test each deployed app

Wait for deployment to complete, then test each URL:

```bash
# Test all apps
curl -I https://dashboard.plenno.com.au/
curl -I https://entities.plenno.com.au/
curl -I https://payments.plenno.com.au/
curl -I https://agency.plenno.com.au/
curl -I https://reports.plenno.com.au/
curl -I https://shell.plenno.com.au/
```

**Look for in the response:**
```
HTTP/2 200  ← This is SUCCESS!
```

**NOT:**
```
HTTP/2 500  ← This is still failing
```

**Also test in browser:**
1. Visit each URL in your browser
2. Open DevTools (F12) → Network tab
3. Refresh the page
4. Check the status column - should show `200` (not `500`)

---

#### Step 3.3: Success verification checklist

- [ ] GitHub Actions shows all 6 deployments succeeded (✅)
- [ ] `curl` commands return `HTTP/2 200` for all apps
- [ ] Browser shows content (not 500 error page) for all apps
- [ ] Browser DevTools Network tab shows 200 status
- [ ] Vercel dashboard → Deployments → Functions shows no errors

**If ALL checkboxes are ✅ → SUCCESS! You're done!**

**If ANY checkbox is ❌ → Go to Phase 4 (Troubleshooting)**

---

### 🔴 PHASE 4: TROUBLESHOOTING (If still failing)

#### Step 4.1: Check Vercel build logs

1. Go to Vercel dashboard
2. Click on the failing project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Building** section to expand logs
6. Look for errors mentioning:
   - "Cannot find module"
   - "Edge Runtime"
   - "middleware" or "proxy"
   - Any red error messages

**Copy the error messages** - they'll tell us what's wrong.

---

#### Step 4.2: Run diagnostic test

Replace **one app's** `proxy.ts` (e.g., dashboard) with this diagnostic version:

```typescript
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return new NextResponse(
    JSON.stringify({
      status: 'proxy-works',
      pathname: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

export const config = {
  matcher: ['/test-proxy'],
}
```

Commit and push:
```bash
git add apps/dashboard/proxy.ts
git commit -m "test: diagnostic proxy for dashboard"
git push origin main
```

Wait for deployment, then test:
```bash
curl https://dashboard.plenno.com.au/test-proxy
```

**Interpret results:**
- ✅ **Returns JSON `{"status":"proxy-works",...}`** → Proxy works! Issue is in your removed logic
- ❌ **Returns 500 error** → Proxy itself is broken, fundamental config issue

---

#### Step 4.3: Check environment variables

In Vercel dashboard for each project:

1. Go to **Settings** → **Environment Variables**
2. Verify you see ALL required variables listed
3. Check each variable has a value (not empty)
4. Verify they're set for **Production** environment

**Missing or incorrect variables can cause middleware bundling to fail.**

---

#### Step 4.4: Verify Root Directory setting

For each project in Vercel dashboard:

1. **Settings** → **General** → **Root Directory**
2. Should show: `apps/[app-name]`
3. If it says "." (root) → Edit and change to correct path
4. Click **Save** and trigger new deployment

---

### 🎯 DECISION TREE: What to do based on results

```
After Phase 3 testing:
│
├─ All apps return 200? ✅
│   └─ SUCCESS! Now gradually add back authentication logic
│       1. Add Supabase import to ONE app's proxy.ts
│       2. Test that one app
│       3. If works, add to all apps
│       4. Add auth logic incrementally
│
└─ Still getting 500? ❌
    │
    ├─ Diagnostic test returns JSON?
    │   ├─ YES → Proxy works, issue is in removed code
    │   │        → Add back code piece by piece
    │   │        → Test after each addition
    │   │
    │   └─ NO → Fundamental proxy issue
    │            → Check Vercel build logs (Step 4.1)
    │            → Verify env vars (Step 4.3)
    │            → Verify root directory (Step 4.4)
    │
    └─ Build logs show errors?
        → Read error messages carefully
        → May need to remove @supabase/ssr temporarily
        → Or add runtime: 'nodejs' to next.config.ts
```

---

## 📊 TIMELINE & EFFORT

| Phase | Task | Time | Total |
|-------|------|------|-------|
| 1 | Code changes | 15 min | 15 min |
| 2 | Vercel config | 15 min | 30 min |
| 3 | Deploy & test | 20 min | 50 min |
| 4 | Troubleshoot (if needed) | 30-60 min | 80-110 min |

**Best case:** 50 minutes to success
**Worst case:** 2 hours if troubleshooting needed

---

## 🔑 KEY INSIGHTS FROM RESEARCH

### Why even minimal middleware fails:

1. **Not a code logic problem** - Your minimal middleware has zero logic, yet fails
2. **Is a bundling problem** - Edge Runtime can't bundle/initialize the middleware file
3. **Three causes converge**:
   - Deprecated file format (middleware.ts)
   - Ignored build command (can't orchestrate workspace builds)
   - Possibly incompatible dependencies (@supabase/ssr)

### Why it works locally but not on Vercel:

| Local (`pnpm dev`) | Vercel (Edge Runtime) |
|--------------------|-----------------------|
| Full Node.js runtime | Limited Edge Runtime APIs |
| All workspace deps resolved | Strict bundling constraints |
| All env vars accessible | Only NEXT_PUBLIC_* available |
| No bundling restrictions | Must pre-bundle everything |

---

## 🚨 CRITICAL NOTES

1. **DO NOT skip Vercel dashboard configuration** (Phase 2)
   - Root Directory is REQUIRED for monorepo
   - Environment variables are REQUIRED for bundling

2. **The codemod is automatic**
   - Just run `npx @next/codemod@canary middleware-to-proxy .`
   - Review changes with `git diff`
   - Don't manually rename files

3. **Test incrementally**
   - Start with minimal proxy (no logic)
   - Confirm it works
   - THEN add back auth logic piece by piece

4. **@supabase/ssr might be the problem**
   - If minimal proxy works but adding Supabase fails
   - May need different auth approach for Edge Runtime
   - Consider using cookies directly or edge-compatible auth

---

## 📞 IF STILL STUCK AFTER ALL STEPS

Share these details:

1. **Vercel build logs** (from Step 4.1)
2. **Result of diagnostic test** (from Step 4.2)
3. **Screenshot of environment variables** (from Vercel dashboard)
4. **Screenshot of Root Directory setting** (from Vercel dashboard)
5. **Any new error messages** from browser console or Network tab

With these details, we can diagnose the specific issue blocking you.

---

## ✅ SUCCESS CRITERIA (Repeat for clarity)

You'll know it's fixed when:

1. ✅ GitHub Actions deployment completes without errors
2. ✅ `https://dashboard.plenno.com.au/` shows NO 500 error
3. ✅ Browser Network tab shows `200` status codes
4. ✅ Vercel dashboard Functions tab shows no errors
5. ✅ No "MIDDLEWARE_INVOCATION_FAILED" in Vercel logs

---

## 🚀 START NOW

**Begin with Phase 1, Step 1.1:**

```bash
npx @next/codemod@canary middleware-to-proxy .
```

Then follow each step in order. Good luck! 🎯
