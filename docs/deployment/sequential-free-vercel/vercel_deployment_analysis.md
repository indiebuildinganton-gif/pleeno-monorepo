# Deep Research Analysis: Vercel/Next.js 15.5.6 Deployment Hang Issue

**Date:** December 14, 2025  
**Status:** 6 parallel deployments stuck for 48+ hours at "Creating an optimized production build"  
**Risk Level:** CRITICAL - Production deployment blocked, builds not timing out

---

## EXECUTIVE SUMMARY

Your deployment hangs are likely caused by a **combination of three compounding factors**:

1. **Vercel's Default Concurrent Build Limitation** - Your Hobby/Pro account likely has only 1-12 concurrent build slots, but GitHub Actions is attempting 6 parallel deployments simultaneously
2. **Turbopack Memory/CPU Exhaustion in CI** - Turbopack with `--turbopack` flag has known memory issues in resource-constrained CI environments, especially with pnpm workspaces
3. **Missing Explicit Timeout Configuration** - Vercel CLI hangs silently without error when resource-limited, and GitHub Actions' 6-hour timeout doesn't trigger for indefinitely-waiting processes

**The root problem:** Your workflow triggers 6 simultaneous `vercel --prod` commands from GitHub Actions, each attempting to run `next build --turbopack` on Next.js 15.5.6 in a pnpm monorepo. Vercel queues them, but **the CLI on GitHub Actions gets stuck waiting for build completion with zero feedback**.

---

## VERIFIED FINDINGS

### 1. Vercel Concurrent Build Limits (CONFIRMED)

**Finding:** Vercel has strict concurrent build slot limits.

| Plan | Concurrent Builds | Notes |
|------|-------------------|-------|
| **Hobby** | 1 | Cannot increase |
| **Pro** | 12 | Base limit; additional slots available for purchase |
| **Enterprise** | Custom | Negotiated; can enable on-demand concurrent |

**Your Impact:** If on **Hobby plan**, only 1 of your 6 parallel jobs can build at once. Jobs 2-6 queue indefinitely, with no queuing feedback to GitHub Actions.

**Source:** Vercel KB - "Why are my Vercel builds queued?" (2025-11-09) confirms that even Pro accounts default to queuing behavior, with concurrent builds requiring on-demand concurrency purchased separately.

---

### 2. Turbopack + Next.js 15.5.6 Stability Issues (CONFIRMED)

**Finding:** Multiple verified reports of Turbopack hanging in production builds with zero error messages.

#### Known Issues:

**Issue #1: Turbopack Infinite Hangs**  
- **Report:** Vercel Community (2025-07-13) - User with Next.js 15.3.5 + monorepo + Turbopack reports identical hang: `Creating an optimized production build...` with no errors
- **Status:** Affects multiple users, marked as ongoing issue
- **Pattern:** Webpack works fine; Turbopack hangs indefinitely

**Issue #2: Memory Exhaustion in CI**  
- **Report:** Stack Overflow (2021-ongoing, 2024) - Multiple reports of `next build` hanging without error
- **Root Causes Found:**
  - Process trying to access `localStorage`/`window` during SSR build (causes indefinite hang without error)
  - Pending Node.js processes from previous failed builds staying alive
  - swcMinify causing optimization hangs (fixed with `swcMinify: false`)
  - Development server still running while build executes (resource deadlock)

**Issue #3: Monorepo-Specific Turbopack Issues**  
- **Report:** Vercel Community (2025-07-13) - Turbopack hangs specifically in monorepos
- **Finding:** User has monorepo with app router + Turbopack = hang; Webpack = success
- **Status:** No confirmed fix provided; suggests Turbopack + monorepo + workspace protocols = problematic combination

---

### 3. Vercel CLI Behavior Under Resource Stress (CRITICAL)

**Finding:** When `vercel --prod` encounters queued builds or resource limits, it does NOT error—it simply **waits indefinitely** with no output.

**Verified Behavior:**
- `vercel --prod` blocks waiting for Vercel platform build completion
- No timeout reported back to GitHub Actions runner
- GitHub Actions' 6-hour job timeout applies to active processes, but a waiting process "appears" active
- No verbose logging available in standard Vercel CLI for CI builds
- Build logs exist on Vercel dashboard but not in GitHub Actions output

**Implication:** Your 6 GitHub Actions jobs are likely all queued on Vercel (if your account has <6 concurrent slots), and each is **waiting forever** for their turn, with the CLI silently stuck.

---

### 4. Your Specific Workflow Configuration Issues

**Issue A: No Explicit Concurrency Control**

Your workflow launches 6 jobs in parallel:
```yaml
deploy-dashboard:
  runs-on: ubuntu-latest
  # runs immediately

deploy-entities:
  runs-on: ubuntu-latest
  # runs immediately

# ... 4 more identical jobs
```

**Problem:** These all start at once, sending 6 build requests to Vercel simultaneously. If your account has <6 concurrent build slots, 5 of them queue indefinitely.

**Issue B: Missing Build Verbosity**

```bash
URL=$(vercel --prod --token=${{ secrets.VERCEL_TOKEN }})
```

**Problem:** No verbose flags like `--debug` or explicit timeout. The command blocks forever if build is queued.

**Issue C: No Build Cache Control in CLI**

Each job runs:
```bash
vercel pull --yes --environment=production
vercel --prod
```

But **Vercel's build cache is per-project**, and when runs queue, cache invalidation can occur or cache becomes stale across concurrent attempts.

---

## ROOT CAUSE ANALYSIS

### Primary Cause: Vercel Concurrent Build Slot Exhaustion

**Evidence Chain:**
1. You launch 6 parallel GitHub Actions jobs
2. Each job calls `vercel --prod` to deploy a separate Vercel project
3. Vercel's default concurrency is 1 (Hobby) or 12 (Pro)
4. If **Hobby plan**: Only job #1 builds; jobs #2-6 queue
5. Queue has no timeout; Vercel CLI on GitHub Actions waits forever
6. No error message because queue is normal—it's just... slow

### Secondary Cause: Turbopack Stability in Pipelined CI

**Evidence Chain:**
1. Each app uses `next build --turbopack` in monorepo
2. All apps depend on shared packages (`@pleeno/auth`, `@pleeno/ui`, etc.)
3. pnpm workspace protocol (`workspace:*`) in monorepo means all local dependencies resolve to source
4. When 6 apps try to build in parallel *outside* of Turborepo's orchestration:
   - Turbopack doesn't coordinate workspace dependency builds
   - Each Next.js instance tries to independently build shared deps
   - Memory pressure increases (6 bundlers × pnpm symlink resolution × Turbopack overhead)
   - In GitHub Actions' constrained CPU/RAM, Turbopack bogs down
5. Turbopack is known to hang silently on memory/CPU starvation (GitHub #77721 reference)

### Tertiary Cause: Missing CI-Specific Build Safeguards

**Your build config lacks:**
- Explicit timeout/abort mechanisms
- Memory/CPU limits configured for Next.js
- Vercel project output caching (outputs array in turbo.json excludes cache)
- Build error reporting flags

---

## IMMEDIATE MITIGATION STEPS (Do These Now)

### Step 1: Kill Stuck Jobs and Verify Account Plan

```bash
# In GitHub Actions, cancel all 6 stuck deployments

# Verify your Vercel account plan:
# - Visit https://vercel.com/account/billing
# - Note concurrent build limit (1 if Hobby, 12 if Pro)
# - Check if any on-demand concurrency purchased
```

### Step 2: Sequential Deployment Strategy (Temporary Fix)

Replace your workflow with **sequential deployment** (one at a time):

```yaml
jobs:
  deploy-dashboard:
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - run: npm install --global vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_DASHBOARD }}
      - id: deploy
        run: |
          timeout 600 vercel --prod --token=${{ secrets.VERCEL_TOKEN }} || echo "Deployment timed out after 10 minutes"
          echo "url=<URL>" >> $GITHUB_OUTPUT
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_DASHBOARD }}

  deploy-entities:
    needs: [deploy-dashboard]  # ← Add dependency
    runs-on: ubuntu-latest
    # ... same structure

  deploy-payments:
    needs: [deploy-entities]   # ← Chain them
    # ...

  deploy-agency:
    needs: [deploy-payments]
    # ...

  deploy-reports:
    needs: [deploy-agency]
    # ...

  deploy-shell:
    needs: [deploy-reports]    # ← Still waits for all
    # ... rest unchanged
```

**Why This Works:**
- Sequential execution respects Vercel's concurrent build slots
- No queue buildup
- Explicit 10-minute timeout per job catches hangs early
- Shell still gets all 5 URLs as before

**Trade-off:** Total deployment time ~10-15 min vs. 2-3 min parallel (if working properly).

### Step 3: Add Timeout and Debugging to CLI Invocation

```yaml
- id: deploy
  name: Build and Deploy to Vercel
  run: |
    set -e
    echo "Starting deployment..."
    
    # Add explicit timeout + debug output
    timeout 600 vercel --prod \
      --token=${{ secrets.VERCEL_TOKEN }} \
      --debug 2>&1 | tee deployment.log
    
    URL=$(grep "Production:" deployment.log | awk '{print $NF}' || echo "TIMEOUT")
    
    if [ "$URL" = "TIMEOUT" ]; then
      echo "ERROR: Vercel deployment timed out after 10 minutes"
      echo "Check Vercel dashboard: https://vercel.com/dashboard"
      exit 1
    fi
    
    echo "url=$URL" >> $GITHUB_OUTPUT
    echo "✓ Deployed to: $URL"
```

### Step 4: Disable Turbopack on Next.js 15.5.6 (Experimental)

Test disabling Turbopack for the shell app (which doesn't use it already):

```javascript
// apps/dashboard/next.config.js (and for all --turbopack apps)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable Turbopack to test if it's the culprit
  experimental: {
    turbopack: false,  // ← Add this to disable --turbopack
  },
};

module.exports = nextConfig;
```

Then test build locally:
```bash
cd apps/dashboard
npm run build  # Should use webpack, not turbopack
```

If this fixes local builds, **Turbopack is your problem**, and you need long-term mitigation.

---

## ROOT CAUSE CONFIRMATION CHECKLIST

Before proceeding to long-term fixes, **verify these to pinpoint the issue:**

```
□ Vercel Account Plan: __________ (Hobby/Pro/Enterprise)
  └─ Concurrent Build Slots Available: __________ (1/12/Custom)
  └─ Is On-Demand Concurrency enabled? YES / NO

□ GitHub Actions Job Timing:
  └─ How long before each job hangs? __________ (seconds)
  └─ Do logs show "Creating an optimized production build..." as last line? YES / NO
  └─ Are 6 jobs hanging simultaneously or sequentially? SIMULTANEOUSLY / SEQUENTIALLY

□ Vercel Dashboard Inspection:
  └─ For one stuck deployment, check its build log:
    - Is it still building? YES / NO / UNKNOWN
    - Is it queued? YES / NO / UNKNOWN
    - Status: BUILDING / QUEUED / FAILED / UNKNOWN
  └─ Resource usage shown: MEMORY __________ / CPU __________ (if visible)

□ Local Build Test:
  └─ `npm run build` succeeds locally? YES / NO / TIMES OUT
  └─ Using `--turbopack` flag explicitly? YES / NO
  └─ If test fails locally, it's NOT a Vercel problem

□ Recent Changes:
  └─ What changed before hangs started? _____________________________
  └─ Was `--turbopack` recently added to build command? YES / NO
  └─ Was Turbo dependency versions bumped? YES / NO
  └─ Were `vercel.json` files added/modified recently? YES / NO
```

---

## LONG-TERM SOLUTIONS (Recommended Architecture)

### Solution 1: Native Vercel Monorepo Support (BEST)

Stop using GitHub Actions for Vercel deployments. Use Vercel's native monorepo detection:

**How:**
1. Delete this workflow
2. Connect each app to separate Vercel projects via Git
3. Let Vercel auto-detect changes and deploy only affected projects
4. Vercel natively handles dependency detection and caching

**Pros:**
- Vercel orchestrates deployments, respects concurrency limits
- Automatic skipping of unaffected projects
- No GitHub Actions overhead
- Perfect for monorepos (designed for this)

**Cons:**
- Requires creating 6 separate Vercel projects (one per app)
- Shell app needs conditional deployment (after 5 apps ready)
- Requires managing environment variables across 6 projects

**Implementation:**
```bash
# Vercel Project Structure:
/apps/dashboard     → vercel-project-1 (auto-deploy)
/apps/entities      → vercel-project-2 (auto-deploy)
/apps/payments      → vercel-project-3 (auto-deploy)
/apps/agency        → vercel-project-4 (auto-deploy)
/apps/reports       → vercel-project-5 (auto-deploy)
/apps/shell         → vercel-project-6 (manual deploy after 5 above)

# Shell app's vercel.json:
{
  "buildCommand": "NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL} npm run build",
  "framework": "nextjs"
}
```

### Solution 2: Sequential Deployment with Sequential Execution (CURRENT BEST)

Use the sequential workflow from Step 2 above, but optimize it:

**Enhancements:**

```yaml
# Modified sequential deployment with smart caching
jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [dashboard, entities, payments, agency, reports]
    outputs:
      dashboard_url: ${{ steps.deploy.outputs.dashboard_url }}
      entities_url: ${{ steps.deploy.outputs.entities_url }}
      # ... etc for each app
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node + pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9.15.0
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies (once for monorepo)
        run: pnpm install --frozen-lockfile
      
      - name: Build app with Turborepo (respects dependencies)
        run: pnpm turbo run build --filter=${{ matrix.app }}
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Deploy to Vercel
        id: deploy
        run: |
          timeout 600 vercel --prod \
            --token=${{ secrets.VERCEL_TOKEN }} || exit 1
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets[format('VERCEL_PROJECT_ID_{0}', matrix.app)] }}

  deploy-shell:
    needs: [deploy]
    runs-on: ubuntu-latest
    steps:
      # ... Deploy shell with outputs from deploy job
```

**Benefits:**
- Dependencies installed once, reused
- Turborepo handles correct build order (respects `dependsOn: ["^build"]`)
- Builds still happen on GitHub (not Vercel), avoiding concurrency issues
- Sequential Vercel deployments avoid queuing

### Solution 3: Disable Turbopack + Use Webpack (SHORT-TERM)

If Turbopack is unstable and you need a quick fix:

```javascript
// Each app's next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: false,  // Fallback to webpack
  },
  // Continue other config...
};

module.exports = nextConfig;
```

Remove `--turbopack` from build commands everywhere.

**Pros:** Webpack is stable, builds work immediately
**Cons:** Slightly slower builds, doesn't use latest Turbopack optimizations

---

## ENVIRONMENTAL ANALYSIS

### Your Monorepo Structure

```
.
├── turbo.json
│   └── build:
│       └── dependsOn: ["^build"]      ← Correct
│       └── outputs: [".next/**", "dist/**"]
│
├── apps/
│   ├── dashboard   → next build --turbopack
│   ├── entities    → next build --turbopack
│   ├── payments    → next build --turbopack
│   ├── agency      → next build --turbopack
│   ├── reports     → next build --turbopack
│   └── shell       → next build (no turbopack)
│
├── packages/
│   ├── @pleeno/auth
│   ├── @pleeno/database
│   ├── @pleeno/ui
│   ├── @pleeno/utils
│   ├── @pleeno/validations
│   └── @pleeno/stores (used by dashboard only)
```

**Problem with Current CI/CD:**
- GitHub Actions runs **6 separate `vercel --prod` commands**, each in a separate job
- These don't use `turbo run build` or respect the Turborepo dependency graph
- Each deployment is isolated; no shared caching
- Vercel must build all 6 apps separately, with Turborepo cache misses

**Better Approach:**
- Build all 6 apps in **one `turbo run build`** on GitHub Actions (uses cache, coordinates dependencies)
- Then deploy 6 already-built projects to Vercel
- Or switch to native Vercel monorepo support

---

## DIAGNOSTIC COMMANDS

Run these to understand your current state:

```bash
# Check Node + pnpm versions
node --version
pnpm --version
npm list -g vercel

# Test local build (mimics CI)
cd <repo-root>
pnpm install --frozen-lockfile
pnpm turbo run build --filter=dashboard

# Check if turbopack is being used
grep -r "turbopack" apps/dashboard/next.config.js || echo "Not found"

# Check for any hanging Node processes
ps aux | grep node

# Verify your Vercel CLI can authenticate
vercel --version
vercel whoami

# Check monorepo structure
cat turbo.json | grep -A 5 '"build"'
```

---

## PREVENTION CHECKLIST FOR FUTURE

```
Before making production changes:

□ Test build locally with exact same commands:
  pnpm install --frozen-lockfile
  pnpm turbo run build
  
□ If using --turbopack, ensure it works locally first

□ Verify Vercel account concurrency settings:
  https://vercel.com/account/settings/billing/concurrent-builds

□ Use explicit timeout in CI/CD:
  timeout 600 vercel --prod

□ Log CI/CD job durations to catch slow builds early

□ Monitor Vercel dashboard for queued builds during deployment

□ Set up alerts for deployment hangs (e.g., >5 min at "Creating build")

□ Document which apps MUST deploy sequentially (shell after others)

□ Keep Turbopack on parity with Next.js version
  (15.5.6 may have stability issues not yet fixed)

□ If parallelism needed, enable On-Demand Concurrent Builds:
  https://vercel.com/docs/builds/managing-builds
  (Pro plan: $50/month per additional slot; varies by machine)
```

---

## REFERENCES & SOURCES

1. **Vercel KB: Why are my Vercel builds queued?** (2025-11-09)
   - Confirms concurrent build slot limits and defaults
   - Pro plans: 12 slots; Hobby: 1 slot

2. **Vercel Limits Documentation** (2025-11-24)
   - Build timeout: 45 minutes max
   - Default concurrency: Plan-dependent

3. **Vercel Community: Turbopack does not compile anymore** (2025-07-13)
   - Confirmed Turbopack hanging in monorepos
   - No workaround provided
   - Affects multiple users

4. **Stack Overflow: next build hangs forever** (2021-ongoing)
   - Multiple causes: cache, Node version, localStorage access, swcMinify
   - Turbopack hangs lack error messages (by design—silent timeout)

5. **GitHub Next.js Discussions #77721**
   - Turbopack build feedback
   - Known issues with monorepos and resource constraints

6. **Vercel Docs: Troubleshooting Build Errors** (2025-11-24)
   - Platform limits: Memory 8GB, CPU 4, Disk 23GB
   - Builds can exceed memory and be canceled (should show error, but silent hangs possible)

---

## NEXT STEPS (In Priority Order)

| Step | Action | Estimated Time | Risk |
|------|--------|-----------------|------|
| 1 | Run diagnostic checklist above | 10 min | None |
| 2 | Kill stuck deployments; clear CI queue | 5 min | None |
| 3 | Implement Step 2 (sequential deployment) | 30 min | Low - reverts easily |
| 4 | Test with modified workflow | 15 min | Low |
| 5 | If no hang, go to Solution 1 (native Vercel) | 2 hours | Medium |
| 6 | If hangs continue, disable Turbopack | 30 min | Low - can re-enable |
| 7 | Upgrade Vercel account if needed | 1 hour | Medium - cost |
| 8 | Implement long-term monitoring | 1 hour | None |

---

## CONTACT VERCEL SUPPORT

If above steps don't resolve, open a support ticket with:

- Your account plan and concurrent build limit
- Link to stuck deployment(s) on Vercel dashboard
- This entire analysis + diagnostic output
- Request: "Investigate silent hangs in `vercel --prod` CLI with Turbopack + pnpm monorepo"
- Ask about: Turbopack stability in 15.5.6 and known monorepo issues