# Dashboard 404 Issue - Root Cause Analysis

**Date:** 2026-01-14
**Status:** IDENTIFIED - GitHub Secrets Missing ❌
**Priority:** HIGH

## Problem Summary

After successful login on the shell app, users are redirected to `https://dashboard.plenno.com.au`, which returns a **404 NOT_FOUND** error from Vercel.

## Root Cause

The dashboard app **is not deployed** to production. The custom domain `dashboard.plenno.com.au` is returning a 404 because there is no active production deployment attached to it.

### Why No Deployment?

GitHub Actions deployment workflow is **failing due to missing/invalid GitHub secrets**:

```
VERCEL_ORG_ID: (empty)
VERCEL_PROJECT_ID_DASHBOARD: (empty)
VERCEL_TOKEN: (empty or invalid)
```

## Evidence

### 1. Custom Domain Returns 404
```bash
$ curl -I https://dashboard.plenno.com.au
HTTP/2 404
x-vercel-error: NOT_FOUND
```

### 2. Other Apps Work Fine
```bash
$ curl -I https://shell.plenno.com.au
HTTP/2 307  # ✅ Working - redirects to /login

$ curl -I https://entities.plenno.com.au
HTTP/2 307  # ✅ Working - redirects to /login
```

### 3. Preview Deployment Exists But Is Protected
```bash
$ curl -I https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app
HTTP/2 401  # Password-protected preview deployment
```

### 4. GitHub Actions Failures
All recent deployment attempts fail at the "Pull Vercel Environment Information" step:

```
Error: No existing credentials found. Please run `vercel login` or pass "--token"
```

Latest failed run: https://github.com/mystbrent/pleeno/actions/runs/20985550719

### 5. Vercel CLI Fails Locally
```bash
$ vercel --prod --yes
Error: The specified token is not valid.
```

## Impact

- ✅ Users can login successfully on shell app
- ✅ Shell app redirects to correct URL (`https://dashboard.plenno.com.au`)
- ❌ Dashboard page shows 404 error
- ❌ Users cannot access dashboard functionality

## Solution Options

### Option 1: Configure GitHub Secrets (Recommended)

Set up the required GitHub secrets to enable automated deployments:

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel team/org ID (`team_3mCod2SbRmzu38gdxZd84tpe`)
- `VERCEL_PROJECT_ID_DASHBOARD` - Dashboard project ID (`prj_LuG5grzWFQWQG4Md0nKRAebbIjAk`)
- `VERCEL_PROJECT_ID_ENTITIES` - Entities project ID
- `VERCEL_PROJECT_ID_PAYMENTS` - Payments project ID
- `VERCEL_PROJECT_ID_AGENCY` - Agency project ID
- `VERCEL_PROJECT_ID_REPORTS` - Reports project ID
- `VERCEL_PROJECT_ID_SHELL` - Shell project ID

**Steps:**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add/update each secret with correct values
3. Trigger deployment: `gh workflow run deploy-production.yml`

**How to get values:**
- VERCEL_TOKEN: Vercel Dashboard → Settings → Tokens
- Project IDs: Found in `.vercel/project.json` in each app directory
- Org ID: Found in `.vercel/project.json` (`team_3mCod2SbRmzu38gdxZd84tpe`)

### Option 2: Manual Deployment via Vercel CLI

If you have a valid Vercel token locally:

```bash
cd apps/dashboard
export VERCEL_TOKEN="your-valid-token"
vercel --prod --yes
```

This will deploy the dashboard and should automatically attach to the custom domain.

### Option 3: Deploy via Vercel Dashboard

1. Log in to Vercel dashboard
2. Find the dashboard project
3. Click "Deploy" → Select main branch
4. Wait for deployment to complete
5. Verify custom domain is attached

## Temporary Workaround

Until the dashboard is deployed, you could:

1. **Update redirect to use preview URL** (if accessible):
   ```bash
   # Update NEXT_PUBLIC_DASHBOARD_URL in shell project
   vercel env add NEXT_PUBLIC_DASHBOARD_URL production \
     --value "https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app"
   ```

   Note: Preview deployments may be password-protected.

2. **Use localhost for testing**:
   ```bash
   # Run dashboard locally
   cd apps/dashboard
   pnpm dev

   # Update shell to point to localhost
   export NEXT_PUBLIC_DASHBOARD_URL="http://localhost:3002"
   ```

## Verification Steps

After deploying the dashboard:

1. **Check custom domain works:**
   ```bash
   curl -I https://dashboard.plenno.com.au
   # Should return HTTP 200 or 307 (not 404)
   ```

2. **Test login flow:**
   - Visit https://shell.plenno.com.au/login
   - Login with credentials
   - Verify redirect to dashboard.plenno.com.au
   - Confirm dashboard page loads (not 404)

3. **Check API endpoints:**
   - Dashboard should load data without 401 errors
   - If 401 errors appear, see `REDIRECT_SUCCESS_AUTH_FAILURE.md` for cookie/session fixes

## Project Configuration

### Dashboard App
- **Vercel Project:** `dashboard`
- **Project ID:** `prj_LuG5grzWFQWQG4Md0nKRAebbIjAk`
- **Org ID:** `team_3mCod2SbRmzu38gdxZd84tpe`
- **Custom Domain:** `dashboard.plenno.com.au`
- **Config:** `apps/dashboard/.vercel/project.json`

### Shell App
- **Redirect Config:** `apps/shell/lib/multi-zone-redirect.ts:28`
- **Default Dashboard URL:** `https://dashboard.plenno.com.au`
- **Env Var:** `NEXT_PUBLIC_DASHBOARD_URL`

## Next Steps

**Immediate Action Required:**
1. Set up GitHub secrets for automated deployments
2. Trigger deployment workflow
3. Verify dashboard custom domain works
4. Test complete login → redirect → dashboard flow

## Related Documentation

- Vercel project IDs: `apps/*/vercel/project.json`
- Deployment workflow: `.github/workflows/deploy-production.yml`
- Previous auth issues: `docs/deployment/REDIRECT_SUCCESS_AUTH_FAILURE.md`
- Environment setup: `docs/deployment/VERCEL_ENV_SETUP.md`

## Timeline

| Date | Event | Status |
|------|-------|--------|
| 2025-12-17 | Dashboard was deployed and working | ✅ |
| 2025-12-17 | Redirect fixed to use custom domain | ✅ |
| 2026-01-14 | Dashboard custom domain returns 404 | ❌ |
| 2026-01-14 | Identified missing GitHub secrets | ✅ |
| 2026-01-14 | **Action needed:** Configure secrets and redeploy | ⏳ |
