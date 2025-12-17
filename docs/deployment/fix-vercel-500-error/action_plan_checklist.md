# IMMEDIATE ACTION PLAN: Fix Vercel Middleware Deployment

**Objective**: Resolve MIDDLEWARE_INVOCATION_FAILED errors  
**Timeline**: 2-3 days  
**Probability of Success**: 75-85%  

---

## THE 3-PART ROOT CAUSE

| # | Issue | Impact | Fix Complexity |
|---|-------|--------|-----------------|
| 1 | **middleware.ts is DEPRECATED in Next.js 16** | Vercel may use legacy compiler | 🟢 Easy |
| 2 | **Vercel ignores custom buildCommand in pnpm monorepos** | Workspace deps not built in correct order | 🟢 Easy |
| 3 | **@supabase/ssr has Node.js deps (Edge incompatible)** | Bundler fails during module resolution | 🟡 Medium |

---

## 🟢 QUICK FIXES (TODAY - 30 MINUTES)

### Fix #1: Migrate middleware.ts → proxy.ts (5 minutes)

**Run this command**:
```bash
npx @next/codemod@canary middleware-to-proxy .
```

**What it does**:
- Renames `middleware.ts` → `proxy.ts`
- Renames function `middleware()` → `proxy()`
- Handles all imports automatically

**Why**: 
- Removes deprecation warning
- Tells Vercel to use current Edge Runtime compiler
- Often fixes bundling issues

**Verify**:
```bash
# Check files renamed
ls -la apps/*/proxy.ts  # Should exist
ls -la apps/*/middleware.ts  # Should NOT exist

# Check function renamed in git diff
git diff
```

---

### Fix #2: Set Root Directory in Vercel (10 minutes)

**For EACH project** (dashboard, entities, payments, agency, reports, shell):

1. Go to https://vercel.com/dashboard
2. Click project name
3. Go to **Settings** → **General**
4. Find **Root Directory**
5. Click **Edit**
6. Set to: `apps/dashboard` (or `apps/entities`, etc.)
7. Click **Save**

**Verify**: Go to **Deployments** → recent build → check Output for:
```
✓ Detected "nextjs" framework
✓ Using root directory: apps/dashboard
```

---

### Fix #3: Configure Environment Variables in Vercel (15 minutes)

**For EACH project**, go to **Settings** → **Environment Variables**

**Add these for ALL projects**:
```
NEXT_PUBLIC_SUPABASE_URL = https://iadhxztsuzbkbnhkimqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-actual-key>
NEXT_PUBLIC_COOKIE_DOMAIN = .plenno.com.au
NODE_ENV = production
```

**Add for shell project ALSO**:
```
NEXT_PUBLIC_DASHBOARD_URL = https://dashboard.plenno.com.au
NEXT_PUBLIC_ENTITIES_URL = https://entities.plenno.com.au
NEXT_PUBLIC_PAYMENTS_URL = https://payments.plenno.com.au
NEXT_PUBLIC_AGENCY_URL = https://agency.plenno.com.au
NEXT_PUBLIC_REPORTS_URL = https://reports.plenno.com.au
```

**Why**: Edge Runtime cannot access unset environment variables during bundling

---

## 🟡 SECONDARY FIXES (TOMORROW - 20 MINUTES)

### Fix #4: Remove Custom buildCommand (5 minutes)

**In each `apps/*/vercel.json`**, change from:
```json
{
  "buildCommand": "cd ../.. && pnpm install --frozen-lockfile --ignore-scripts && cd apps/dashboard && pnpm exec next build",
  "installCommand": "echo 'Install handled in buildCommand'",
  "framework": null,
  "outputDirectory": ".next"
}
```

**To**:
```json
{
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Why**:
- Vercel ignores custom buildCommand in pnpm monorepos (documented bug)
- Let Vercel auto-detect - it works better
- Removes ambiguity and complexity

---

### Fix #5: Simplify Proxy File (5 minutes)

**In each `apps/*/proxy.ts`**, use this minimal version:

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

**Remove for now**:
- ❌ `async` keyword
- ❌ Console.log statements  
- ❌ Supabase initialization
- ❌ Authentication checks
- ❌ Try-catch blocks

**Why**: Testing basic proxy functionality first

---

## 🔴 IF STILL FAILING (DAY 3)

### Diagnostic Test: Check Edge Runtime Initialization

**Replace proxy.ts with this test version**:
```typescript
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Test 1: Can we access request properties?
  const pathname = request.nextUrl.pathname
  
  // Test 2: Can we return a response?
  return new NextResponse(
    JSON.stringify({ 
      status: 'ok',
      pathname,
      timestamp: new Date().toISOString()
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

**Test**:
```bash
# After deploying
curl https://dashboard.plenno.com.au/test-proxy

# Should see:
# {"status":"ok","pathname":"/test-proxy","timestamp":"2025-12-17T..."}

# If you see this, proxy works! Then gradually add back logic.
```

---

## DEPLOYMENT SEQUENCE

### Phase 1: Deploy Today

```bash
# 1. Run codemod
npx @next/codemod@canary middleware-to-proxy .

# 2. Update vercel.json for each app
# (Edit each file manually or with script)

# 3. Update proxy.ts to minimal version
# (Edit each file manually)

# 4. Commit and push
git add -A
git commit -m "fix: migrate middleware to proxy, simplify for edge runtime"
git push origin main

# 5. Watch GitHub Actions
# → Should deploy all 6 apps sequentially
```

### Phase 2: Set Configuration in Vercel Dashboard (Today)

- ✅ Root Directory for each project
- ✅ Environment variables for each project
- ✅ No other changes needed

### Phase 3: Test (Tomorrow)

- ✅ Visit each app URL
- ✅ Check browser console for errors
- ✅ Check Vercel dashboard for function errors

---

## VERIFICATION CHECKLIST

After each fix, verify:

- [ ] Code compiles locally: `pnpm build`
- [ ] Git shows expected changes: `git status`
- [ ] No syntax errors: `pnpm lint` (if you run it)
- [ ] Deployed to Vercel: GitHub Actions shows ✅
- [ ] App URL accessible: `curl https://dashboard.plenno.com.au/`
- [ ] No 500 errors: Check browser DevTools → Network
- [ ] Middleware invoked: Check Vercel → Deployments → Functions

---

## SUCCESS CRITERIA

You'll know it's working when:

1. ✅ GitHub Actions deployment completes without errors
2. ✅ Visiting `https://dashboard.plenno.com.au/` shows NO 500 error
3. ✅ Browser Network tab shows 200 status (not 500)
4. ✅ Vercel dashboard Functions tab shows no errors
5. ✅ No "MIDDLEWARE_INVOCATION_FAILED" in logs

---

## TROUBLESHOOTING

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Still getting 500 error | Missing env vars | Check Vercel dashboard env vars |
| Deployment fails at build | Syntax error in proxy.ts | Run `pnpm build` locally first |
| Error: "Cannot find module" | Workspace deps unresolved | Try removing buildCommand from vercel.json |
| Different error now | Progress! Something changed | Read error message carefully |

---

## Timeline Expectation

| When | What | Expected Result |
|------|------|-----------------|
| Now | Run codemod + update vercel.json | Code changes committed |
| In 5 min | Configure Vercel dashboard | Env vars visible in Vercel UI |
| In 5-10 min | GitHub Actions runs | All 6 apps deployed |
| In 10-15 min | Test apps | Hopefully ✅ working! |
| If not... | Run diagnostic test | Narrow down root cause |
| Day 2 | Incrementally add back features | Auth, Supabase, etc. |

---

**Start Now**: Migrate middleware.ts to proxy.ts  
**Then**: Configure Vercel dashboard  
**Test**: Visit your app URLs  
**Report back**: If still failing, run diagnostic test