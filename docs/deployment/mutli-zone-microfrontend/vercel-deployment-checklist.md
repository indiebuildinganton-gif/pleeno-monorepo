# Vercel Deployment Checklist - Multi-Zone Architecture

**Status:** Local development working ✅ | Ready for production deployment

**Estimated Time:** 2.5-4 hours of active work (spread across 1-3 days for DNS propagation)

---

## Prerequisites ✅ (Already Completed)

- ✅ Shell app has correct rewrites in `next.config.ts`
- ✅ All child apps have `basePath` configured
- ✅ Environment-aware routing implemented
- ✅ All apps have `vercel.json` configuration files
- ✅ Local `.env.local` files configured correctly
- ✅ Turborepo filters and build commands set up

---

## Phase 1: Vercel Project Setup (30-45 minutes)

### Create 6 Separate Vercel Projects

You have two options:

### Option A: Via Vercel Dashboard (Recommended for first time)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Create these 6 projects with the following settings:

#### Project 1: Shell App
- **Project Name:** `pleeno-shell-uat` (or your preferred name)
- **Root Directory:** `apps/shell`
- **Build Command:** Automatically detected from `vercel.json` ✅
- **Install Command:** Automatically detected from `vercel.json` ✅
- **Framework Preset:** Next.js ✅

#### Project 2: Dashboard App
- **Project Name:** `pleeno-dashboard-uat`
- **Root Directory:** `apps/dashboard`
- **Build Command:** Automatically detected from `vercel.json` ✅
- **Install Command:** Automatically detected from `vercel.json` ✅
- **Framework Preset:** Next.js ✅

#### Project 3: Entities App
- **Project Name:** `pleeno-entities-uat`
- **Root Directory:** `apps/entities`
- **Build Command:** Automatically detected from `vercel.json` ✅
- **Install Command:** Automatically detected from `vercel.json` ✅
- **Framework Preset:** Next.js ✅

#### Project 4: Payments App
- **Project Name:** `pleeno-payments-uat`
- **Root Directory:** `apps/payments`
- **Build Command:** Automatically detected from `vercel.json` ✅
- **Install Command:** Automatically detected from `vercel.json` ✅
- **Framework Preset:** Next.js ✅

#### Project 5: Agency App
- **Project Name:** `pleeno-agency-uat`
- **Root Directory:** `apps/agency`
- **Build Command:** Automatically detected from `vercel.json` ✅
- **Install Command:** Automatically detected from `vercel.json` ✅
- **Framework Preset:** Next.js ✅

#### Project 6: Reports App
- **Project Name:** `pleeno-reports-uat`
- **Root Directory:** `apps/reports`
- **Build Command:** Automatically detected from `vercel.json` ✅
- **Install Command:** Automatically detected from `vercel.json` ✅
- **Framework Preset:** Next.js ✅

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally (optional)
npm i -g vercel

# Or use npx for each command
npx vercel login

# Link each app (run from project root)
cd apps/shell && npx vercel link
cd ../dashboard && npx vercel link
cd ../entities && npx vercel link
cd ../payments && npx vercel link
cd ../agency && npx vercel link
cd ../reports && npx vercel link
```

---

## Phase 2: Environment Variables Setup (45-60 minutes)

Once projects are created, configure environment variables for each project in the Vercel dashboard.

### For Shell Project (`pleeno-shell-uat`)

Navigate to: **Project Settings → Environment Variables**

Add these variables (for Production, Preview, and Development environments):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-production-anon-key>

# Application Configuration
NEXT_PUBLIC_APP_URL = https://plenno.com.au
NEXT_PUBLIC_SHELL_URL = https://plenno.com.au
NODE_ENV = production

# Multi-Zone Production URLs
# NOTE: Use actual Vercel URLs after child apps are deployed
NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports-uat.vercel.app
```

### For Dashboard Project (`pleeno-dashboard-uat`)

Navigate to: **Project Settings → Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-production-anon-key>

# Application Configuration
NEXT_PUBLIC_APP_URL = https://pleeno-dashboard-uat.vercel.app
NODE_ENV = production

# Shell/Auth URLs
NEXT_PUBLIC_SHELL_URL = https://plenno.com.au

# Multi-Zone Production URLs (same for all apps)
NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports-uat.vercel.app
```

### For Entities Project (`pleeno-entities-uat`)

Navigate to: **Project Settings → Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-production-anon-key>

# Application Configuration
NEXT_PUBLIC_APP_URL = https://pleeno-entities-uat.vercel.app
NODE_ENV = production

# Shell/Auth URLs
NEXT_PUBLIC_SHELL_URL = https://plenno.com.au

# Multi-Zone Production URLs (same for all apps)
NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports-uat.vercel.app
```

### For Payments Project (`pleeno-payments-uat`)

Navigate to: **Project Settings → Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-production-anon-key>

# Application Configuration
NEXT_PUBLIC_APP_URL = https://pleeno-payments-uat.vercel.app
NODE_ENV = production

# Shell/Auth URLs
NEXT_PUBLIC_SHELL_URL = https://plenno.com.au

# Multi-Zone Production URLs (same for all apps)
NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports-uat.vercel.app
```

### For Agency Project (`pleeno-agency-uat`)

Navigate to: **Project Settings → Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-production-anon-key>

# Application Configuration
NEXT_PUBLIC_APP_URL = https://pleeno-agency-uat.vercel.app
NODE_ENV = production

# Shell/Auth URLs
NEXT_PUBLIC_SHELL_URL = https://plenno.com.au

# Multi-Zone Production URLs (same for all apps)
NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports-uat.vercel.app
```

### For Reports Project (`pleeno-reports-uat`)

Navigate to: **Project Settings → Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-production-anon-key>

# Application Configuration
NEXT_PUBLIC_APP_URL = https://pleeno-reports-uat.vercel.app
NODE_ENV = production

# Shell/Auth URLs
NEXT_PUBLIC_SHELL_URL = https://plenno.com.au

# Multi-Zone Production URLs (same for all apps)
NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports-uat.vercel.app
```

---

## Phase 3: Initial Deployment (15-30 minutes)

### Step 1: Deploy Child Apps First

Deploy these apps and collect their Vercel URLs:

1. **Dashboard App**
   - Trigger deployment from Vercel dashboard or push to main branch
   - Wait for build to complete
   - Copy production URL: `https://pleeno-dashboard-uat.vercel.app`

2. **Entities App**
   - Trigger deployment
   - Copy production URL: `https://pleeno-entities-uat.vercel.app`

3. **Payments App**
   - Trigger deployment
   - Copy production URL: `https://pleeno-payments-uat.vercel.app`

4. **Agency App**
   - Trigger deployment
   - Copy production URL: `https://pleeno-agency-uat.vercel.app`

5. **Reports App**
   - Trigger deployment
   - Copy production URL: `https://pleeno-reports-uat.vercel.app`

### Step 2: Update Shell Environment Variables

1. Go to Shell project settings in Vercel dashboard
2. Navigate to **Environment Variables**
3. Update the `NEXT_PUBLIC_*_URL` variables with actual deployed URLs:
   ```bash
   NEXT_PUBLIC_DASHBOARD_URL = https://pleeno-dashboard-uat.vercel.app
   NEXT_PUBLIC_AGENCY_URL = https://pleeno-agency-uat.vercel.app
   NEXT_PUBLIC_ENTITIES_URL = https://pleeno-entities-uat.vercel.app
   NEXT_PUBLIC_PAYMENTS_URL = https://pleeno-payments-uat.vercel.app
   NEXT_PUBLIC_REPORTS_URL = https://pleeno-reports-uat.vercel.app
   ```

### Step 3: Deploy Shell App

1. Trigger deployment of shell app
2. Wait for build to complete
3. Shell will now have correct URLs to rewrite to child apps
4. Copy shell production URL: `https://pleeno-shell-uat.vercel.app`

### Step 4: Initial Testing (on Vercel Preview URLs)

Before adding custom domain, test the setup:

1. Visit: `https://pleeno-shell-uat.vercel.app`
2. Try login
3. Navigate to: `https://pleeno-shell-uat.vercel.app/dashboard`
4. Verify content loads from dashboard app (check Network tab)

---

## Phase 4: Custom Domain Setup (15-30 minutes + DNS propagation time)

### Add Custom Domain to Shell Project Only

1. Go to Shell project (`pleeno-shell-uat`) in Vercel dashboard
2. Navigate to **Settings → Domains**
3. Click **Add Domain**
4. Enter: `plenno.com.au`
5. Vercel will provide DNS configuration instructions

### Configure DNS

Vercel will show you one of these options:

**Option A: A Records (Recommended)**
```
Type: A
Name: @
Value: 76.76.21.21
```
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Option B: CNAME Record (Alternative)**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### DNS Propagation

- Can take 5 minutes to 48 hours
- Usually completes within 15 minutes
- Use https://dnschecker.org to monitor propagation
- Use Vercel preview URLs for immediate testing

### Important Notes

- **Only assign custom domain to Shell project**
- **Do NOT assign custom domain to child apps**
- Child apps remain on Vercel URLs (e.g., `pleeno-dashboard-uat.vercel.app`)
- Shell rewrites handle routing to child apps transparently

---

## Phase 5: Production Testing (30-60 minutes)

### Test Checklist

Once DNS has propagated, test the following:

#### 1. Shell Home Page
- [ ] Visit: `https://plenno.com.au`
- [ ] Shell home page loads correctly
- [ ] No console errors in browser DevTools

#### 2. Authentication Flow
- [ ] Visit: `https://plenno.com.au/login`
- [ ] Enter credentials and login
- [ ] Should redirect to: `https://plenno.com.au/dashboard`
- [ ] URL stays as `plenno.com.au/dashboard` (not redirecting to Vercel URL)

#### 3. Dashboard Access
- [ ] Visit: `https://plenno.com.au/dashboard`
- [ ] Dashboard content loads from dashboard app
- [ ] Open DevTools → Network tab
- [ ] Verify requests show `plenno.com.au` domain (not Vercel URLs)
- [ ] Check that content is being proxied correctly

#### 4. All Zone Routes
Test each zone:
- [ ] `https://plenno.com.au/entities` - Entities app loads
- [ ] `https://plenno.com.au/payments` - Payments app loads
- [ ] `https://plenno.com.au/agency` - Agency app loads
- [ ] `https://plenno.com.au/reports` - Reports app loads

#### 5. Authentication Persistence
- [ ] Login at shell
- [ ] Navigate to `/dashboard`
- [ ] Navigate to `/entities`
- [ ] Navigate to `/payments`
- [ ] Authentication should persist across all routes
- [ ] Check cookies in DevTools → Application → Cookies
- [ ] Verify session cookie is set at `plenno.com.au` domain

#### 6. Cross-App Navigation
- [ ] From dashboard, click link to entities
- [ ] From entities, click link to payments
- [ ] From payments, click link back to dashboard
- [ ] Navigation should be seamless
- [ ] URL should always stay as `plenno.com.au/*`

#### 7. Error Handling
- [ ] Try accessing protected route without auth
- [ ] Should redirect to `/login`
- [ ] After login, should redirect back to original route

#### 8. DevTools Inspection
Open Browser DevTools:

**Console Tab:**
- [ ] No JavaScript errors
- [ ] No 404 errors for assets

**Network Tab:**
- [ ] All requests show `plenno.com.au` domain
- [ ] No direct requests to Vercel URLs
- [ ] Assets loading correctly (CSS, JS, images)

**Application Tab → Cookies:**
- [ ] Session cookies visible
- [ ] Cookie domain set to `plenno.com.au` or `.plenno.com.au`
- [ ] Cookie `SameSite` attribute set appropriately

---

## Troubleshooting

### Issue: 404 on Dashboard Routes

**Symptom:** Visiting `https://plenno.com.au/dashboard` shows 404

**Causes & Fixes:**
1. **Child app doesn't have `basePath`** ✅ Already fixed
2. **Shell environment variables wrong:** Check `NEXT_PUBLIC_DASHBOARD_URL` in shell project
3. **Child app not deployed:** Verify dashboard app deployment succeeded
4. **Build cache issue:** Redeploy shell and dashboard apps

### Issue: Redirecting to Vercel URLs Instead of Custom Domain

**Symptom:** After login, browser redirects to `https://pleeno-dashboard-uat.vercel.app`

**Causes & Fixes:**
1. **Login page using wrong logic:** ✅ Already fixed in `apps/shell/app/(auth)/login/page.tsx`
2. **Environment not detected as production:** Verify `NODE_ENV=production` in shell project
3. **Custom domain not assigned:** Ensure custom domain added to shell project only

### Issue: Authentication Not Working

**Symptom:** Login fails or session doesn't persist

**Causes & Fixes:**
1. **Supabase URL wrong:** Verify `NEXT_PUBLIC_SUPABASE_URL` in all projects
2. **Cookie domain mismatch:** Check middleware cookie configuration
3. **CORS issues:** Verify Supabase project allows `plenno.com.au` domain

### Issue: Assets Not Loading (CSS/JS)

**Symptom:** Pages load but styling is broken

**Causes & Fixes:**
1. **basePath configuration:** ✅ Already correct
2. **Asset prefix issue:** Check `assetPrefix` in `next.config.ts`
3. **Build output issue:** Redeploy the affected app

### Issue: DNS Not Propagating

**Symptom:** Custom domain not resolving after 1 hour

**Causes & Fixes:**
1. **Incorrect DNS records:** Double-check DNS configuration in domain registrar
2. **TTL too high:** Old DNS records might have high TTL (time to live)
3. **Vercel verification pending:** Check Vercel dashboard for domain status

---

## Deployment Effort Summary

| Phase | Time | Difficulty | Tasks |
|-------|------|------------|-------|
| **Code Configuration** | ✅ Done | - | All basePath and rewrites configured |
| **Environment Files** | ✅ Done | - | All .env.local files ready |
| **Vercel Projects Setup** | 30-45 min | Easy | Create 6 projects via dashboard |
| **Environment Variables** | 45-60 min | Medium | Configure env vars for each project |
| **Initial Deployment** | 15-30 min | Easy | Deploy and collect URLs |
| **Custom Domain** | 15-30 min | Easy | Add domain and configure DNS |
| **Testing & Debugging** | 30-60 min | Medium | Comprehensive testing |
| **Total Active Time** | **2.5-4 hours** | **Medium** | Mostly configuration work |
| **Total Elapsed Time** | **1-3 days** | - | Including DNS propagation |

---

## Recommended Deployment Schedule

### Day 1: Setup (1.5-2 hours)
- ☐ Create all 6 Vercel projects via dashboard
- ☐ Configure environment variables for all projects
- ☐ Deploy all child apps (dashboard, entities, payments, agency, reports)
- ☐ Collect deployed URLs

### Day 2: Integration (1-1.5 hours)
- ☐ Update shell environment variables with actual child app URLs
- ☐ Deploy shell app
- ☐ Test on Vercel preview URLs (before custom domain)
- ☐ Verify rewrites work correctly
- ☐ Fix any issues

### Day 3: Production (30-60 minutes + DNS propagation)
- ☐ Add custom domain to shell project
- ☐ Configure DNS records
- ☐ Wait for DNS propagation
- ☐ Test on custom domain
- ☐ Verify all functionality
- ☐ Monitor for issues

---

## Post-Deployment

### Monitoring

Set up monitoring for:
- [ ] Vercel deployment status
- [ ] Build success/failure notifications
- [ ] Error tracking (Sentry already configured ✅)
- [ ] Performance metrics
- [ ] DNS uptime

### Documentation

Update team documentation:
- [ ] Deployment procedures
- [ ] Environment variable management
- [ ] Troubleshooting guide
- [ ] Rollback procedures

### CI/CD (Optional - Future Enhancement)

Consider setting up:
- [ ] Automated testing before deployment
- [ ] Preview deployments for pull requests
- [ ] Automated environment variable sync
- [ ] Deployment notifications (Slack, email)

---

## Critical Reminders

1. ✅ **basePath Configuration:** Do NOT remove `basePath` from child apps - already correctly configured
2. ✅ **Deploy Order:** Always deploy child apps before shell to get their URLs
3. ✅ **Environment Variables:** Shell needs actual Vercel URLs of child apps, not localhost
4. ✅ **Custom Domain:** Only assign to shell project, never to child apps
5. ✅ **Testing:** Test on Vercel preview URLs before adding custom domain
6. ⚠️ **DNS Propagation:** Can take time - be patient, use preview URLs for immediate testing
7. ⚠️ **Cookie Domain:** Ensure cookies work at root domain level for auth to work across zones

---

## Success Criteria

Your deployment is successful when:
- ✅ All 6 apps deployed to Vercel
- ✅ Custom domain `plenno.com.au` points to shell
- ✅ Login redirects to `https://plenno.com.au/dashboard` (not Vercel URL)
- ✅ All routes (`/dashboard`, `/entities`, `/payments`, `/agency`, `/reports`) load correctly
- ✅ Content is proxied from child apps transparently
- ✅ Authentication persists across all zones
- ✅ No console errors in browser DevTools
- ✅ DNS resolves correctly (check with https://dnschecker.org)

---

## Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Review the deployment guide: `docs/deployment/mutli-zone-microfrontend/multi-zones-deployment-guide.md`
3. Verify environment variables in Vercel dashboard
4. Check Vercel build logs for errors
5. Test with Vercel preview URLs before blaming DNS

**Your codebase is production-ready. The only work remaining is Vercel configuration!** 🚀
