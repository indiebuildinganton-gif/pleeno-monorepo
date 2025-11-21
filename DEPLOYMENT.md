# Pleeno Deployment Guide

This guide covers deploying the Pleeno multi-zone Next.js application to Vercel with production environment variables.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Production Supabase Setup](#production-supabase-setup)
3. [Vercel Deployment Steps](#vercel-deployment-steps)
4. [Environment Variables Configuration](#environment-variables-configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- [x] Monorepo initialized with all zones (completed in previous tasks)
- [x] GitHub repository with code pushed
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Production Supabase project

## Production Supabase Setup

### Step 1: Create Production Supabase Project

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in the following:
   - **Name:** `pleeno-production`
   - **Database Password:** Generate a strong password and save it securely
   - **Region:** Choose the region closest to your users (e.g., `us-east-1`)
4. Wait for the project to be created (~2 minutes)

### Step 2: Get Production Credentials

1. Go to **Project Settings > API**
2. Save the following values (you'll need them for Vercel):
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### Step 3: Run Database Migrations

Run the migrations to set up your production database:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your production project
npx supabase link --project-ref <your-project-ref>

# Push migrations to production
npx supabase db push
```

## Vercel Deployment Steps

### Deploy Each Zone Separately

You need to deploy each of the 6 zones as separate Vercel projects:

1. **shell** (Main entry point)
2. **dashboard**
3. **agency**
4. **entities**
5. **payments**
6. **reports**

### General Deployment Process

For each zone, follow these steps:

#### 1. Go to Vercel

Visit https://vercel.com/new and import your GitHub repository.

#### 2. Configure the Project

For each zone, use the following configuration:

**For Shell App:**
- **Project Name:** `pleeno-shell`
- **Framework Preset:** Next.js
- **Root Directory:** `apps/shell`
- **Build Command:** `cd ../.. && turbo run build --filter=shell`
- **Install Command:** `npm install`
- **Output Directory:** Leave default (`.next`)

**For Dashboard Zone:**
- **Project Name:** `pleeno-dashboard`
- **Framework Preset:** Next.js
- **Root Directory:** `apps/dashboard`
- **Build Command:** `cd ../.. && turbo run build --filter=dashboard`
- **Install Command:** `npm install`
- **Output Directory:** Leave default (`.next`)

**For Agency Zone:**
- **Project Name:** `pleeno-agency`
- **Framework Preset:** Next.js
- **Root Directory:** `apps/agency`
- **Build Command:** `cd ../.. && turbo run build --filter=agency`
- **Install Command:** `npm install`
- **Output Directory:** Leave default (`.next`)

**For Entities Zone:**
- **Project Name:** `pleeno-entities`
- **Framework Preset:** Next.js
- **Root Directory:** `apps/entities`
- **Build Command:** `cd ../.. && turbo run build --filter=entities`
- **Install Command:** `npm install`
- **Output Directory:** Leave default (`.next`)

**For Payments Zone:**
- **Project Name:** `pleeno-payments`
- **Framework Preset:** Next.js
- **Root Directory:** `apps/payments`
- **Build Command:** `cd ../.. && turbo run build --filter=payments`
- **Install Command:** `npm install`
- **Output Directory:** Leave default (`.next`)

**For Reports Zone:**
- **Project Name:** `pleeno-reports`
- **Framework Preset:** Next.js
- **Root Directory:** `apps/reports`
- **Build Command:** `cd ../.. && turbo run build --filter=reports`
- **Install Command:** `npm install`
- **Output Directory:** Leave default (`.next`)

## Environment Variables Configuration

### For All Zones

Add these environment variables to **every zone** (Shell, Dashboard, Agency, Entities, Payments, Reports):

#### Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL=<your-production-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
```

#### Application Configuration

```
NEXT_PUBLIC_APP_URL=<your-shell-app-url>
NODE_ENV=production
```

#### Email Configuration (Optional - add when ready)

```
RESEND_API_KEY=<your-resend-api-key>
```

### Shell App Additional Configuration

For the **shell app only**, also add these zone URL variables:

```
NEXT_PUBLIC_DASHBOARD_URL=https://app.pleeno.com
NEXT_PUBLIC_AGENCY_URL=https://app.pleeno.com
NEXT_PUBLIC_ENTITIES_URL=https://app.pleeno.com
NEXT_PUBLIC_PAYMENTS_URL=https://app.pleeno.com
NEXT_PUBLIC_REPORTS_URL=https://app.pleeno.com
COOKIE_DOMAIN=.pleeno.com
```

**Important:** All zones MUST be deployed under the same root domain (`app.pleeno.com`) to enable cross-zone authentication cookie sharing. Each zone will be accessible via its basePath:
- Dashboard: `https://app.pleeno.com/dashboard`
- Agency: `https://app.pleeno.com/agency`
- Entities: `https://app.pleeno.com/entities`
- Payments: `https://app.pleeno.com/payments`
- Reports: `https://app.pleeno.com/reports`

### Adding Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** > **Environment Variables**
3. Add each variable:
   - **Key:** Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value:** Your actual value
   - **Environments:** Select `Production`, `Preview`, and `Development` as needed
4. Click **Save**
5. **Important:** Redeploy after adding environment variables

## Post-Deployment Configuration

### Single Domain Multi-Zone Architecture

This application uses a **single domain, multi-zone architecture** to enable seamless authentication across all zones. Here's how it works:

**Architecture Overview:**
```
https://app.pleeno.com (Shell App - Entry Point)
├─> /dashboard → Dashboard Zone (port 3002 in dev)
├─> /agency → Agency Zone (port 3004 in dev)
├─> /entities → Entities Zone (port 3001 in dev)
├─> /payments → Payments Zone (port 3003 in dev)
└─> /reports → Reports Zone (port 3000 in dev)
```

**Why Single Domain?**
- **Shared Authentication**: Cookies set at `.pleeno.com` work across all zones
- **Seamless UX**: Users stay logged in when navigating between zones
- **Security**: HTTP-only cookies cannot be accessed by client-side JavaScript
- **Simplicity**: No complex cross-domain auth token passing

**Vercel Deployment Setup:**

1. Deploy the **shell app** to `app.pleeno.com`
2. Deploy each **zone app** to Vercel (e.g., `pleeno-dashboard.vercel.app`)
3. Configure **rewrites** in shell app to proxy requests to zone deployments
4. Set `COOKIE_DOMAIN=.pleeno.com` in all zone environment variables

**Domain Configuration in Vercel:**

1. Add custom domain `app.pleeno.com` to your shell app project
2. Configure DNS records to point to Vercel
3. Each zone deployment gets rewritten by the shell app:
   - User visits: `https://app.pleeno.com/dashboard`
   - Shell rewrites to: `https://pleeno-dashboard.vercel.app/dashboard`
   - User sees: `https://app.pleeno.com/dashboard` (seamless!)

### Update Zone URLs

After deploying all zones, verify the shell app's environment variables are set correctly:

1. Go to **Shell App** project in Vercel
2. Navigate to **Settings** > **Environment Variables**
3. Verify all `NEXT_PUBLIC_*_URL` variables point to `https://app.pleeno.com`
4. Verify `COOKIE_DOMAIN=.pleeno.com` is set
5. Trigger a **new deployment** if any changes were made

### Configure Automatic Deployments

For each Vercel project:

1. Go to **Settings** > **Git**
2. Ensure **Production Branch** is set to `main`
3. Enable **Automatically deploy all commits**
4. (Optional) Configure **Ignored Build Step**:
   - Add this command to only build when changes affect the zone:
   ```bash
   bash -c "git diff HEAD^ HEAD --quiet apps/<zone-name>"
   ```
   Replace `<zone-name>` with the appropriate zone (e.g., `dashboard`, `agency`, etc.)

## Verification

### 1. Check All Deployments

Visit each Vercel project dashboard and confirm:
- [x] Status shows "Ready"
- [x] No build errors in logs
- [x] Environment variables are set

### 2. Test Production URLs

Visit each zone directly:
- Shell: `https://pleeno-shell.vercel.app`
- Dashboard: `https://pleeno-dashboard.vercel.app/dashboard`
- Agency: `https://pleeno-agency.vercel.app/agency`
- Entities: `https://pleeno-entities.vercel.app/entities`
- Payments: `https://pleeno-payments.vercel.app/payments`
- Reports: `https://pleeno-reports.vercel.app/reports`

### 3. Test Multi-Zone Routing

From the shell app, test navigation:
- Visit: `https://pleeno-shell.vercel.app/dashboard`
- Visit: `https://pleeno-shell.vercel.app/agency`
- Visit: `https://pleeno-shell.vercel.app/entities`
- Visit: `https://pleeno-shell.vercel.app/payments`
- Visit: `https://pleeno-shell.vercel.app/reports`

### 4. Test Automatic Deployment

```bash
# Make a small change
echo "# Test deployment" >> README.md
git add .
git commit -m "Test: Verify automatic deployment"
git push origin main

# Check Vercel dashboard - should trigger new deployment
```

### 5. Verify Supabase Connection

1. Open the shell app in production
2. Open browser console (F12)
3. Check for any Supabase connection errors
4. Try signing in (if auth is implemented)

## Troubleshooting

### Build Fails with "Module not found"

**Solution:** Ensure the build command includes `cd ../..` to run from the monorepo root:

```bash
cd ../.. && turbo run build --filter=<zone-name>
```

### Multi-Zone Rewrites Not Working

**Symptoms:** Clicking links to other zones returns 404

**Solutions:**
1. Verify zone URLs in shell `next.config.ts` match actual Vercel deployment URLs
2. Check that zone environment variables are set in Vercel
3. Ensure all zones are deployed and running

### Environment Variables Not Loading

**Symptoms:** App can't connect to Supabase or shows undefined env vars

**Solutions:**
1. Verify all environment variables are set in Vercel dashboard
2. **Redeploy** after adding environment variables (Vercel requires this)
3. Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)

### Supabase Connection Fails in Production

**Symptoms:** Database queries fail or auth doesn't work

**Solutions:**
1. Verify production Supabase URL and keys are correct
2. Check that Supabase project is running (not paused)
3. Verify database migrations were pushed to production
4. Check CORS settings in Supabase dashboard

### Build Times Are Very Long

**Solutions:**
1. Configure Vercel to only build when changes affect the zone (see Automatic Deployments)
2. Use Turborepo caching (should be enabled by default)
3. Consider upgrading to Vercel Pro for better build performance

## Next Steps

After successful deployment:

1. [ ] Set up custom domains (optional)
2. [ ] Configure monitoring and analytics
3. [ ] Set up error tracking (e.g., Sentry)
4. [ ] Create CI/CD pipeline (GitHub Actions)
5. [ ] Configure preview deployments for PRs

## Alternative: Railway Deployment

If you prefer Railway over Vercel:

1. Go to https://railway.app
2. Create new project from GitHub repo
3. Configure each zone as separate service
4. Set environment variables in Railway dashboard
5. Configure custom domains or use Railway-provided URLs

**Note:** Railway requires additional configuration for multi-zone setup. Vercel is recommended for Next.js multi-zone architecture.

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Multi-Zones](https://nextjs.org/docs/pages/building-your-application/deploying/multi-zones)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Turborepo Deployment](https://turbo.build/repo/docs/handbook/deploying-with-docker)

## Support

If you encounter issues not covered in this guide:

1. Check Vercel build logs for specific errors
2. Review Supabase logs in the dashboard
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly
