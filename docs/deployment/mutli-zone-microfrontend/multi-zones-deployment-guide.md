# Next.js Multi-Zones on Vercel: Deployment Complexity Analysis

**Your Architecture**: Next.js Multi-Zones (shell app routing to multiple child apps via `rewrites` and `basePath`)

**Complexity Level**: **MEDIUM (5-6 out of 10)** - Not overly complex, but more nuanced than simple subdomain deployment

---

## The Good News

Next.js Multi-Zones is **officially supported by Vercel** and is their **recommended pattern for microfrontends**. They have:
- Official documentation and examples
- A Vercel Microfrontends SDK (`@vercel/microfrontends`) for newer patterns
- Template project you can reference
- Built-in routing infrastructure

Your local setup working is **the hardest part** - production deployment is more straightforward.

---

## What You Have vs What You Need

### Current Local Architecture (Working)
```
Shell App (port 3005)
├─ Route: / → serves home pages
├─ Route: /dashboard/* → rewrites to dashboard app (port 3002)
├─ Route: /agency/* → rewrites to agency app (port 3004)
├─ Route: /entities/* → rewrites to entities app (port 3001)
├─ Route: /payments/* → rewrites to payments app (port 3003)
└─ Route: /reports/* → rewrites to reports app (port 3000)

Each app has basePath set:
- dashboard: basePath: '/dashboard'
- agency: basePath: '/agency'
- entities: basePath: '/entities'
- payments: basePath: '/payments'
- reports: basePath: '/reports'

Authentication: Shared across all apps (cookies work at root level)
```

### Production Vercel Architecture (What You Need)
```
Single Production Domain: plenno.com.au

Vercel Projects:
1. Shell (main/routing app)
   ├─ Root directory: apps/shell
   ├─ Build command: turbo build --filter=shell
   ├─ basePath: / (none)
   └─ Configured with rewrites to other Vercel project URLs

2. Dashboard App
   ├─ Root directory: apps/dashboard
   ├─ Build command: turbo build --filter=dashboard
   ├─ basePath: '/dashboard'
   └─ Deployed as independent project on Vercel

3. Agency App
   ├─ Root directory: apps/agency
   ├─ Build command: turbo build --filter=agency
   ├─ basePath: '/agency'
   └─ Deployed as independent project on Vercel

4. Entities App
   ├─ Root directory: apps/entities
   ├─ Build command: turbo build --filter=entities
   ├─ basePath: '/entities'
   └─ Deployed as independent project on Vercel

5. Payments App
   ├─ Root directory: apps/payments
   ├─ Build command: turbo build --filter=payments
   ├─ basePath: '/payments'
   └─ Deployed as independent project on Vercel

6. Reports App
   ├─ Root directory: apps/reports
   ├─ Build command: turbo build --filter=reports
   ├─ basePath: '/reports'
   └─ Deployed as independent project on Vercel

Routing:
- plenno.com.au/ → Shell project
- plenno.com.au/dashboard/* → Dashboard project
- plenno.com.au/agency/* → Agency project
- plenno.com.au/entities/* → Entities project
- plenno.com.au/payments/* → Payments project
- plenno.com.au/reports/* → Reports project

Authentication: Same setup as local (shared cookies at root level)
Domain assignment: Single production domain assigned to Shell project
```

---

## Step-by-Step Deployment Setup

### Phase 1: Verify Shell App Configuration (Day 1)

**File: apps/shell/next.config.js**

```javascript
module.exports = {
  // Shell app has NO basePath (it's the root)
  // basePath: '/', ← Don't add this

  async rewrites() {
    return [
      // Dashboard rewrite
      {
        source: '/dashboard',
        destination: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/dashboard`,
      },
      {
        source: '/dashboard/:path*',
        destination: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/dashboard/:path*`,
      },
      // Agency rewrite
      {
        source: '/agency',
        destination: `${process.env.NEXT_PUBLIC_AGENCY_URL}/agency`,
      },
      {
        source: '/agency/:path*',
        destination: `${process.env.NEXT_PUBLIC_AGENCY_URL}/agency/:path*`,
      },
      // Entities rewrite
      {
        source: '/entities',
        destination: `${process.env.NEXT_PUBLIC_ENTITIES_URL}/entities`,
      },
      {
        source: '/entities/:path*',
        destination: `${process.env.NEXT_PUBLIC_ENTITIES_URL}/entities/:path*`,
      },
      // Payments rewrite
      {
        source: '/payments',
        destination: `${process.env.NEXT_PUBLIC_PAYMENTS_URL}/payments`,
      },
      {
        source: '/payments/:path*',
        destination: `${process.env.NEXT_PUBLIC_PAYMENTS_URL}/payments/:path*`,
      },
      // Reports rewrite
      {
        source: '/reports',
        destination: `${process.env.NEXT_PUBLIC_REPORTS_URL}/reports`,
      },
      {
        source: '/reports/:path*',
        destination: `${process.env.NEXT_PUBLIC_REPORTS_URL}/reports/:path*`,
      },
    ]
  },

  // Asset prefix to avoid conflicts
  assetPrefix: process.env.ASSET_PREFIX || '',
}
```

**Environment variables (apps/shell/.env.local for local development):**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3005
NEXT_PUBLIC_SHELL_URL=http://localhost:3005
NODE_ENV=development

# Multi-Zone Local URLs - these point to localhost during development
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3002
NEXT_PUBLIC_AGENCY_URL=http://localhost:3004
NEXT_PUBLIC_ENTITIES_URL=http://localhost:3001
NEXT_PUBLIC_PAYMENTS_URL=http://localhost:3003
NEXT_PUBLIC_REPORTS_URL=http://localhost:3000
```

**Port Assignment Reference:**
- Shell (auth): `3005`
- Dashboard: `3002`
- Entities: `3001`
- Payments: `3003`
- Agency: `3004`
- Reports: `3000`

**Environment variables (Vercel - for production):**
```bash
# Supabase Configuration (production instance)
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://plenno.com.au
NEXT_PUBLIC_SHELL_URL=https://plenno.com.au
NODE_ENV=production

# Multi-Zone Production URLs - these point to the Vercel deployment URLs
NEXT_PUBLIC_DASHBOARD_URL=https://pleeno-dashboard.vercel.app
NEXT_PUBLIC_AGENCY_URL=https://pleeno-agency.vercel.app
NEXT_PUBLIC_ENTITIES_URL=https://pleeno-entities.vercel.app
NEXT_PUBLIC_PAYMENTS_URL=https://pleeno-payments.vercel.app
NEXT_PUBLIC_REPORTS_URL=https://pleeno-reports.vercel.app
```

**Important Notes:**
- The environment detection happens automatically via [multi-zone-redirect.ts](../../apps/shell/lib/multi-zone-redirect.ts)
- In development (`NODE_ENV=development` or `NEXT_PUBLIC_APP_URL` contains `localhost`), it uses localhost URLs
- In production (`NODE_ENV=production`), it uses the configured production URLs
- Each child app also needs the complete set of multi-zone URLs for cross-app navigation

### Phase 2: Configure Child Apps (Day 1)

**File: apps/dashboard/next.config.js**

```javascript
module.exports = {
  basePath: '/dashboard',

  // dashboard app doesn't need rewrites to other apps
  // (all cross-app navigation goes through shell)

  assetPrefix: process.env.ASSET_PREFIX || '',
}
```

**Do this for all child apps:**
- apps/agency/next.config.js: `basePath: '/agency'`
- apps/entities/next.config.js: `basePath: '/entities'`
- apps/payments/next.config.js: `basePath: '/payments'`
- apps/reports/next.config.js: `basePath: '/reports'`

**Environment variables for each child app (e.g., apps/dashboard/.env.local):**

```bash
# Supabase Configuration (same for all apps)
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration (PORT VARIES PER APP - see Port Assignment Reference above)
NEXT_PUBLIC_APP_URL=http://localhost:3002  # For dashboard
NODE_ENV=development

# Shell/Auth URLs (same for all apps)
NEXT_PUBLIC_SHELL_URL=http://localhost:3005

# Multi-Zone Local URLs (same for all apps)
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3002
NEXT_PUBLIC_AGENCY_URL=http://localhost:3004
NEXT_PUBLIC_ENTITIES_URL=http://localhost:3001
NEXT_PUBLIC_PAYMENTS_URL=http://localhost:3003
NEXT_PUBLIC_REPORTS_URL=http://localhost:3000
```

**Note:** The only difference between child apps' `.env.local` files is the `NEXT_PUBLIC_APP_URL` port number, which should match that app's dev server port.

### Phase 3: Create Vercel Projects (Day 2)

**Project 1: Shell (pleeno-shell)**
```
Root Directory: apps/shell
Build Command: turbo build --filter=shell
Framework: Next.js
```

**Project 2: Dashboard (pleeno-dashboard)**
```
Root Directory: apps/dashboard
Build Command: turbo build --filter=dashboard
Framework: Next.js
```

**Repeat for**: Agency, Entities, Payments, Reports projects

### Phase 4: Configure Environment Variables in Vercel (Day 2)

**For Shell project** (`pleeno-shell`):
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-production-anon-key

# Application Configuration
NEXT_PUBLIC_APP_URL = https://plenno.com.au
NEXT_PUBLIC_SHELL_URL = https://plenno.com.au
NODE_ENV = production

# Multi-Zone Production URLs
NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard.vercel.app
NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency.vercel.app
NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities.vercel.app
NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments.vercel.app
NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports.vercel.app
```

**For each child project** (dashboard, agency, entities, payments, reports):
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-production-anon-key

# Application Configuration (use the child app's production URL)
NEXT_PUBLIC_APP_URL = https://pleeno-dashboard.vercel.app  # Example for dashboard
NODE_ENV = production

# Shell/Auth URLs
NEXT_PUBLIC_SHELL_URL = https://plenno.com.au

# Multi-Zone Production URLs (same for all apps)
NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard.vercel.app
NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency.vercel.app
NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities.vercel.app
NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments.vercel.app
NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports.vercel.app
```

**Important:** Make sure Vercel's `NODE_ENV` is set to `production` for all projects, or it will be auto-detected based on the deployment environment.

### Phase 5: Assign Production Domain (Day 3)

1. Go to **Shell project** (pleeno-shell)
2. Go to **Deployments → Production**
3. Click **Domains**
4. Add custom domain: `plenno.com.au`

**Important**: Only the Shell project gets the production domain assigned. All traffic to `plenno.com.au` goes to Shell, then Shell rewrites to child apps.

### Phase 6: Test the Complete Flow (Day 3)

```bash
# 1. Visit your domain
https://plenno.com.au
# Should load shell home page

# 2. Navigate to dashboard
https://plenno.com.au/dashboard
# Should load dashboard app
# URL should stay as plenno.com.au/dashboard (not redirect elsewhere)

# 3. Test authentication flow
# Login from shell
# Navigate to different routes
# Should maintain session across all apps

# 4. Check browser DevTools
# Network tab: See requests being rewritten
# Console: Should be no errors
# Cookies: Should see session cookie
```

---

## Key Configuration Gotchas

### ❌ Common Mistakes

**Mistake 1: Assigning production domain to child apps**
```
❌ WRONG:
- Shell project gets: plenno.com.au
- Dashboard project gets: plenno.com.au/dashboard  ← CAN'T DO THIS

✅ CORRECT:
- Shell project gets: plenno.com.au
- Dashboard project: No custom domain (only reachable via rewrites)
```

**Mistake 2: Child apps NOT having basePath**
```
❌ WRONG:
Dashboard next.config.js:
module.exports = {
  // No basePath configured
}

✅ CORRECT:
Dashboard next.config.js:
module.exports = {
  basePath: '/dashboard',
}
```

**Mistake 3: Rewrites pointing to wrong URLs**
```
❌ WRONG:
Shell rewrites to:
{
  source: '/dashboard/:path*',
  destination: 'https://localhost:3002/dashboard/:path*'  ← localhost in production!
}

✅ CORRECT:
Shell rewrites to:
{
  source: '/dashboard/:path*',
  destination: process.env.NEXT_PUBLIC_DASHBOARD_URL + '/dashboard/:path*'
  // where NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard.vercel.app in production
}
```

**Mistake 4: Using same path in shell and child**
```
❌ WRONG:
Shell app has: /dashboard page
Dashboard app (at /dashboard) also has: /dashboard page
↓ CONFLICT

✅ CORRECT:
Shell app has: only / and /api routes
Dashboard app has: all /dashboard routes
Each path belongs to exactly one zone
```

---

## Complexity Breakdown

| Task | Complexity | Time | Notes |
|------|-----------|------|-------|
| **Verify shell config** | Easy | 30 min | Just checking existing rewrites work |
| **Configure child apps** | Easy | 1 hour | Copy/paste basePath to 5 apps |
| **Create 6 Vercel projects** | Easy | 2 hours | Can do via CLI or dashboard |
| **Set environment variables** | Medium | 1.5 hours | Must be precise, easy to typo URLs |
| **Assign custom domain** | Easy | 15 min | Single click, then DNS propagation |
| **Test routing** | Medium | 2 hours | Need to test all paths and edge cases |
| **Configure authentication** | Medium | 2-3 hours | May need adjustments for basePath |
| **Set up build caching** | Medium | 1 hour | Turborepo remote cache (optional) |

**Total Time**: 10-13 hours of work (can spread over 3-4 days)

---

## Comparison: Old Recommendation vs Multi-Zones

### What I Originally Recommended (Separate Subdomains)
```
shell.plenno.com.au
dashboard.plenno.com.au
agency.plenno.com.au
```
- ✅ Simpler configuration
- ✅ Better deployment isolation
- ❌ More complex authentication (cross-subdomain cookies)
- ❌ Doesn't match your local working setup
- ❌ Requires users to remember multiple domains

### Multi-Zones (What You Actually Have)
```
plenno.com.au/
plenno.com.au/dashboard
plenno.com.au/agency
```
- ✅ Matches your local setup
- ✅ Single domain (better UX)
- ✅ Authentication naturally shared
- ✅ Official Vercel support
- ❌ Slightly more configuration

---

## Actual Steps to Deploy

### Day 1: Configuration Prep

1. **Review shell app rewrites** - Make sure they're using environment variables
2. **Add basePath to all child apps** - 5 files to update
3. **Verify local dev still works** - Test before pushing

### Day 2: Create Vercel Projects

```bash
# Create projects via Vercel CLI
vercel projects create --name pleeno-shell
vercel projects create --name pleeno-dashboard
vercel projects create --name pleeno-agency
vercel projects create --name pleeno-entities
vercel projects create --name pleeno-payments
vercel projects create --name pleeno-reports
```

Or do it manually in Vercel dashboard (easier to understand what's happening)

### Day 3: Configure and Deploy

1. Link each project to your monorepo
2. Set root directory for each
3. Set build command for each
4. Deploy shell first (get its URL)
5. Set environment variables in shell (pointing to other apps' URLs)
6. Trigger shell rebuild
7. Test that shell rewrites work
8. Assign production domain to shell

### Day 4: Testing & Optimization

1. Test all routes
2. Test authentication flow
3. Set up Turborepo caching (optional)
4. Monitor build times

---

## Is This Simpler Than Subdomain Approach?

**Yes, because:**
1. ✅ You already have it working locally
2. ✅ One domain = simpler DNS
3. ✅ No cross-subdomain cookie issues
4. ✅ Better matches SaaS user expectations
5. ✅ Vercel has native support

**Slightly more complex because:**
1. Each child app needs `basePath` configured correctly
2. Shell app needs environment variables per deployment environment
3. Must ensure path uniqueness (no conflicts between zones)

**Net complexity: Lower than subdomain approach**

---

## Alternative: Vercel Microfrontends (Newer Approach)

Vercel recently released **Vercel Microfrontends** (`@vercel/microfrontends` package) which automates some of this. It uses a `microfrontends.json` file instead of manual `rewrites`.

**Should you use it?**
- ✅ If starting fresh
- ❌ If you already have Multi-Zones working (stick with it)
- ❌ If you want simplicity (more new concepts to learn)

Stick with what's working locally.

---

## Quick Comparison: Effort Required

```
My Original Recommendation (Separate Subdomains):
- Fix configuration: 4 hours
- Set authentication: 6 hours
- Deploy: 2 hours
- Testing: 3 hours
Total: 15 hours

Your Actual Approach (Multi-Zones):
- Verify configuration: 1 hour
- Add basePath to apps: 2 hours
- Create Vercel projects: 2 hours
- Configure environment: 2 hours
- Assign domain: 0.5 hours
- Testing: 2 hours
Total: 9.5 hours

SAVINGS: ~5.5 hours (40% less work)
```

---

## Recommendation

**✅ Go with your Multi-Zones approach. It's:**
1. Already working locally
2. Less deployment work
3. Better user experience
4. Officially supported by Vercel
5. More aligned with typical SaaS architecture

**The deployment is straightforward:**
- Create 6 Vercel projects
- Configure each with correct root directory and build command
- Set environment variables in shell app
- Assign production domain to shell
- Test routing

**Estimated total setup time: 3-4 days (much less than subdomain approach)**

