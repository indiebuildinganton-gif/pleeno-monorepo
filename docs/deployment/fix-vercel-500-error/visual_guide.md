# VERCEL MONOREPO MIDDLEWARE: VISUAL FLOW GUIDE

## YOUR CURRENT SITUATION

```
Local Development                    Vercel Production
==================                   ====================

✅ Works perfectly                   ❌ 500 Error
    ↓                                    ↓
pnpm dev                             MIDDLEWARE_INVOCATION_FAILED
    ↓                                    ↓
Full Node.js Runtime                 Edge Runtime
    ↓                                    ↓
All APIs available                   Limited APIs
    ↓                                    ↓
Workspace imports work               Workspace imports fail?
    ↓                                    ↓
All 6 apps run fine                  All 6 apps fail identically
```

---

## THE 3-PART ROOT CAUSE

### CAUSE #1: Deprecated File Format

```
Next.js 16 Changes:

OLD (Your Code)          NEW (Fix)
================         ================
middleware.ts   ──→     proxy.ts
middleware()    ──→     proxy()

Impact:
  middleware.ts is deprecated
        ↓
  Vercel uses legacy compiler
        ↓
  Different behavior = different error
```

### CAUSE #2: Custom buildCommand Ignored

```
What You Have:
  vercel.json:
    "buildCommand": "cd ../.. && pnpm install && ..."

What Happens:
  User Config            Vercel Detection         Actual Action
  ==============         ================         ===============
  buildCommand:          + pnpm detected          "vercel build"
  "cd ../.. && ..."      + monorepo detected ← Override! Ignore!
                         + turbo detected

Result:
  - Your buildCommand NEVER runs
  - Workspace deps not built in order
  - Middleware bundling fails
```

### CAUSE #3: @supabase/ssr Node.js Dependencies

```
What You Added (commit 60c743c):
  ALL apps/*/package.json:
    "@supabase/ssr": "^0.5.2"

What Happens During Build:
  
  Middleware Bundling:
    ├─ Middleware.ts includes:
    │   import { createServerClient } from '@supabase/ssr'
    │
    └─ Bundler includes @supabase/ssr
         ├─ Which depends on:
         │   ├─ @supabase/supabase-js
         │   ├─ various packages
         │   └─ maybe Node.js APIs?
         │
         └─ Edge Runtime:
             ├─ Can't load Node.js packages
             ├─ Module resolution fails
             └─ ❌ MIDDLEWARE_INVOCATION_FAILED
```

---

## THE FLOW OF FAILURE

```
Commit 60c743c
Added @supabase/ssr
      ↓
GitHub Actions Deployment
      ↓
Sequential Build (6 apps)
      ↓
✓ Build logs say "SUCCESS"
      ↓
Vercel compiles middleware
for Edge Runtime
      ↓
Vercel's Bundler encounters:
"import { ... } from '@supabase/ssr'"
      ↓
Bundler tries to resolve:
@supabase/ssr → @supabase/supabase-js → ... → Node.js API?
      ↓
❌ Cannot include in Edge Runtime
(Node.js APIs not available)
      ↓
❌ Bundling fails silently
      ↓
Edge Runtime receives broken middleware
      ↓
User requests route
      ↓
Middleware tries to initialize
      ↓
❌ 500: MIDDLEWARE_INVOCATION_FAILED
```

---

## THE FIX FLOW (TODAY - 30 MINUTES)

```
┌─────────────────────────────────────────────────┐
│ Step 1: Migrate middleware.ts → proxy.ts      │
│ Effect: Removes deprecation, uses current       │
│         Edge Runtime compiler                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 2: Configure Root Directory in Vercel     │
│ Effect: Vercel knows app location, can         │
│         resolve paths correctly                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 3: Set Environment Variables              │
│ Effect: Variables available during bundling    │
│         no missing dependencies                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 4: Remove Custom buildCommand             │
│ Effect: Let Vercel's auto-detection handle it  │
│         (it ignores custom anyway)             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 5: Simplify Proxy to Minimal              │
│ Effect: Tests if Edge Runtime can initialize   │
│         proxy at all                           │
└─────────────────────────────────────────────────┘
                    ↓
            git push origin main
                    ↓
        GitHub Actions Deploys All Apps
                    ↓
             Wait 10-15 minutes...
                    ↓
                TEST YOUR APPS ✅
```

---

## TESTING AFTER FIX

```
❶ Visit each app:
   
   https://dashboard.plenno.com.au/    ← should work
   https://entities.plenno.com.au/     ← should work
   https://payments.plenno.com.au/     ← should work
   https://agency.plenno.com.au/       ← should work
   https://reports.plenno.com.au/      ← should work
   https://shell.plenno.com.au/        ← should work

❷ Check status:
   
   Browser shows content? ✅ You're done!
   Browser shows 500? ❌ Run diagnostic test

❸ Check DevTools Network:
   
   Status column should show 200 (not 500)
```

---

## IF STILL FAILING: DIAGNOSTIC TEST

```
Replace proxy.ts temporarily with:

  export function proxy(request: NextRequest) {
    return new NextResponse(
      JSON.stringify({ 
        status: 'proxy-works',
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  export const config = {
    matcher: ['/test-proxy'],
  }

Then test:

  curl https://dashboard.plenno.com.au/test-proxy

Results:
  ✅ Returns JSON?     → Proxy works, issue elsewhere
  ❌ Returns 500?      → Proxy still broken, deeper issue
```

---

## DECISION TREE: NEXT STEPS

```
Success after fixes?
│
├─ YES ✅
│   └─ Done! Middleware working
│       Gradually add back auth logic
│
└─ NO ❌
    │
    ├─ Diagnostic test returns JSON?
    │   ├─ YES → Proxy works, issue in your logic
    │   │        Gradually re-add code
    │   │
    │   └─ NO → Proxy broken, fundamental issue
    │           Check Vercel build logs
    │           May need to remove @supabase/ssr
    │
    └─ Still stuck?
        → Check deep_research.md
        → Run extended diagnostic
```

---

## EFFORT ESTIMATE

```
Total Time to Fix:           ~30 minutes
  - Codemod:                  5 min
  - Vercel dashboard:        15 min
  - Environment vars:        10 min

Deployment Time:            10-15 min
  - GitHub Actions runs all 6 apps

Testing Time:                5 min
  - Visit each app URL

Total Time to Success:      50 minutes (if everything works)
```

---

## KEY MENTAL MODELS

### Model 1: Local vs Vercel

```
Local:     Full Node.js runtime → Everything works
Vercel:    Edge Runtime (limited) → Some things fail
```

### Model 2: Bundling is Key

```
The issue isn't CODE logic (minimal code still fails)
The issue is BUNDLING (what gets included in middleware)
```

### Model 3: Dependencies Matter

```
@supabase/ssr → has dependencies → those have dependencies
Some nested dependency uses Node.js API → Edge can't load it
→ Bundling fails
```

---

## QUICK REFERENCE: COMMANDS

```bash
# Run codemod
npx @next/codemod@canary middleware-to-proxy .

# Check changes
git diff

# Build locally to verify
pnpm build

# Commit
git add -A
git commit -m "fix: middleware deprecation and vercel configuration"
git push

# Test each app
curl -I https://dashboard.plenno.com.au/
curl -I https://entities.plenno.com.au/
curl -I https://payments.plenno.com.au/
```

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
| Still 500 error | Missing env vars | Check Vercel dashboard |
| Build fails | Syntax error | Run `pnpm build` locally |
| "Cannot find module" | Workspace deps unresolved | Remove buildCommand |
| Different error | Progress! | Read error carefully |

---

**You've got this. Follow the steps. It should work. 🚀**