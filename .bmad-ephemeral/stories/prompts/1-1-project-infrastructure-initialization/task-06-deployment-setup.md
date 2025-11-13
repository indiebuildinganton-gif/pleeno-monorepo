# Task 6: Set Up Deployment Environment

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 1

## Objective

Configure Vercel deployment for the multi-zone Next.js application with production environment variables.

## Context

Vercel natively supports multi-zone deployments and provides seamless integration with Next.js 15. This task sets up automated deployments from the main branch and configures production environment variables.

## Prerequisites

- Task 1-5 completed (monorepo initialized with all zones and environment variables)
- GitHub repository created for the project
- Vercel account (sign up at https://vercel.com if needed)
- Production Supabase project created at https://app.supabase.com
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno/pleeno-monorepo`

## Task Steps

### 1. Create Production Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** pleeno-production
   - **Database Password:** (generate strong password and save it)
   - **Region:** Choose closest to your users
4. Wait for project to be created (~2 minutes)
5. Go to Project Settings > API
6. Save these values for later:
   - Project URL
   - Anon/Public key
   - Service role key

### 2. Push Code to GitHub

If not already done:

```bash
git init
git add .
git commit -m "Initial commit: Pleeno infrastructure setup"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3. Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### 4. Create Vercel Configuration

Create `vercel.json` at the root:

```json
{
  "version": 2,
  "buildCommand": "turbo run build",
  "devCommand": "turbo run dev --parallel",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "github": {
    "silent": true
  }
}
```

### 5. Deploy Shell App to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Project Name:** pleeno-shell
   - **Framework Preset:** Next.js
   - **Root Directory:** apps/shell
   - **Build Command:** `cd ../.. && turbo run build --filter=shell`
   - **Install Command:** `npm install`

4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: (from production Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (from production Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY`: (from production Supabase)
   - `NEXT_PUBLIC_APP_URL`: https://<your-shell-domain>.vercel.app
   - `NODE_ENV`: production

5. Click "Deploy"

### 6. Deploy Remaining Zones

Repeat for each zone (dashboard, agency, entities, payments, reports):

**For dashboard zone:**
- **Project Name:** pleeno-dashboard
- **Root Directory:** apps/dashboard
- **Build Command:** `cd ../.. && turbo run build --filter=dashboard`
- Add same environment variables as shell
- Deploy

**For agency zone:**
- **Project Name:** pleeno-agency
- **Root Directory:** apps/agency
- **Build Command:** `cd ../.. && turbo run build --filter=agency`
- Add same environment variables as shell
- Deploy

**For entities zone:**
- **Project Name:** pleeno-entities
- **Root Directory:** apps/entities
- **Build Command:** `cd ../.. && turbo run build --filter=entities`
- Add same environment variables as shell
- Deploy

**For payments zone:**
- **Project Name:** pleeno-payments
- **Root Directory:** apps/payments
- **Build Command:** `cd ../.. && turbo run build --filter=payments`
- Add same environment variables as shell
- Deploy

**For reports zone:**
- **Project Name:** pleeno-reports
- **Root Directory:** apps/reports
- **Build Command:** `cd ../.. && turbo run build --filter=reports`
- Add same environment variables as shell
- Deploy

### 7. Update Shell App Multi-Zone Rewrites for Production

Edit `apps/shell/next.config.js` to support both local and production:

```javascript
const isDev = process.env.NODE_ENV === 'development'

const ZONE_URLS = {
  dashboard: isDev ? 'http://localhost:3001' : 'https://pleeno-dashboard.vercel.app',
  agency: isDev ? 'http://localhost:3002' : 'https://pleeno-agency.vercel.app',
  entities: isDev ? 'http://localhost:3003' : 'https://pleeno-entities.vercel.app',
  payments: isDev ? 'http://localhost:3004' : 'https://pleeno-payments.vercel.app',
  reports: isDev ? 'http://localhost:3005' : 'https://pleeno-reports.vercel.app',
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: `${ZONE_URLS.dashboard}/dashboard`,
      },
      {
        source: '/dashboard/:path*',
        destination: `${ZONE_URLS.dashboard}/dashboard/:path*`,
      },
      {
        source: '/agency',
        destination: `${ZONE_URLS.agency}/agency`,
      },
      {
        source: '/agency/:path*',
        destination: `${ZONE_URLS.agency}/agency/:path*`,
      },
      {
        source: '/entities',
        destination: `${ZONE_URLS.entities}/entities`,
      },
      {
        source: '/entities/:path*',
        destination: `${ZONE_URLS.entities}/entities/:path*`,
      },
      {
        source: '/payments',
        destination: `${ZONE_URLS.payments}/payments`,
      },
      {
        source: '/payments/:path*',
        destination: `${ZONE_URLS.payments}/payments/:path*`,
      },
      {
        source: '/reports',
        destination: `${ZONE_URLS.reports}/reports`,
      },
      {
        source: '/reports/:path*',
        destination: `${ZONE_URLS.reports}/reports/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

**Important:** Replace `pleeno-dashboard.vercel.app` etc. with your actual Vercel deployment URLs.

### 8. Configure Automatic Deployments

In each Vercel project:

1. Go to Settings > Git
2. Ensure "Production Branch" is set to `main`
3. Enable "Automatically deploy all commits"
4. Configure ignored build step (optional):
   - Ignore build if no changes in zone directory

### 9. Set Up Vercel CLI for Team (Optional)

Create `.vercelignore` at root:

```
node_modules
.next
dist
build
.env*.local
.git
```

Link local project to Vercel:

```bash
vercel link
# Follow prompts to link to your Vercel projects
```

## Verification Steps

1. **Verify all zones deployed:**
   - Visit each Vercel project dashboard
   - Confirm "Ready" status
   - Check build logs for errors

2. **Verify production URLs work:**
   - Open shell app URL
   - Test navigation to each zone via routes:
     - https://pleeno-shell.vercel.app/dashboard
     - https://pleeno-shell.vercel.app/agency
     - https://pleeno-shell.vercel.app/entities
     - https://pleeno-shell.vercel.app/payments
     - https://pleeno-shell.vercel.app/reports

3. **Verify environment variables:**
   - Check each project's Settings > Environment Variables
   - Confirm all required variables are set

4. **Test automatic deployment:**
   ```bash
   # Make a small change
   echo "# Test deployment" >> README.md
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   # Check Vercel dashboard - should trigger new deployment
   ```

5. **Verify production Supabase connection:**
   - Open shell app
   - Check browser console for errors
   - Confirm no Supabase connection errors

## Success Criteria

- [ ] Production Supabase project created
- [ ] Code pushed to GitHub repository
- [ ] All 6 zones deployed to Vercel
- [ ] Production environment variables configured in Vercel
- [ ] Multi-zone rewrites updated for production URLs
- [ ] Automatic deployments configured from main branch
- [ ] All production URLs accessible and functional
- [ ] Test deployment to main branch triggers redeployment

## Alternative: Railway Deployment

If using Railway instead of Vercel:

1. Go to https://railway.app
2. Create new project from GitHub repo
3. Configure each zone as separate service
4. Set environment variables in Railway dashboard
5. Configure custom domains or use Railway-provided URLs

**Note:** Railway requires additional configuration for multi-zone setup. Vercel is recommended for Next.js multi-zone architecture.

## Production Environment Variables Checklist

For each zone deployment, ensure these are set:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key (marked as secret)
- [ ] `NEXT_PUBLIC_APP_URL` - Production app URL
- [ ] `NODE_ENV` - Set to "production"
- [ ] `RESEND_API_KEY` - Resend API key (when ready)

## Troubleshooting

**Issue:** Build fails with "Module not found"
- **Solution:** Ensure build command includes `cd ../..` to run from monorepo root

**Issue:** Multi-zone rewrites not working
- **Solution:** Verify zone URLs in shell `next.config.js` match actual Vercel deployment URLs

**Issue:** Environment variables not loading
- **Solution:** Redeploy after adding environment variables (Vercel requires redeployment)

**Issue:** Supabase connection fails in production
- **Solution:** Verify production Supabase URL and keys are correct in Vercel environment variables

## Architecture References

- **Source:** docs/architecture.md - Deployment strategy
- **Source:** docs/architecture.md - ADR-001: Multi-zone architecture

## Next Task

After completing this task, proceed to **Task 7: Create Basic CI/CD Pipeline**
