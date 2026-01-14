# CRITICAL: Dashboard 404 After Redeployment - Deep Analysis

**Date:** 2026-01-14
**Status:** ROOT CAUSE IDENTIFIED ✅
**Priority:** CRITICAL

## Executive Summary

The dashboard **was working on Dec 17, 2025** but now returns 404. GitHub Actions has **NEVER successfully deployed** any app - all production deployments have been done manually. The secrets you configured are either:
1. Not actually saved in GitHub (configuration error)
2. Saved but with incorrect names
3. Saved but with invalid values

## Evidence: GitHub Actions Has Never Succeeded

```bash
# ALL production deployment runs have FAILED:
gh run list --workflow=deploy-production.yml --limit 50
# Result: 0 successful runs, 100% failures

# Latest run (after you "configured secrets"):
Run ID: 20985550719
Status: FAILED
Error: "VERCEL_ORG_ID: (empty)"
Error: "VERCEL_PROJECT_ID: (empty)"
```

**The GitHub Actions logs show the secrets are STILL EMPTY even after you configured them.**

## Critical Discovery: Working Apps Were Deployed Manually

### Timeline Analysis

**December 17, 2025:**
- Dashboard WAS accessible: `https://dashboard.plenno.com.au` (HTTP 200) ✅
- Preview URL working: `https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app` ✅
- Source: [docs/deployment/REDIRECT_SUCCESS_AUTH_FAILURE.md](docs/deployment/REDIRECT_SUCCESS_AUTH_FAILURE.md:26-27)

**January 14, 2026:**
- Dashboard returns 404: `https://dashboard.plenno.com.au` (NOT_FOUND) ❌
- Custom domain not attached to any deployment ❌

### How Were Shell & Entities Deployed?

Since GitHub Actions has never succeeded, shell and entities must have been deployed via:
- **Vercel Dashboard** (web UI), OR
- **Manual Vercel CLI** commands, OR
- **Different workflow** (not deploy-production.yml)

## Root Cause Analysis

### Why Dashboard Worked Before But Not Now

**Hypothesis 1: Deployment Expired/Deleted**
- Vercel preview deployments can be automatically deleted after 30 days
- The working deployment from Dec 17 may have been cleaned up
- Custom domain lost its attachment to the deleted deployment

**Hypothesis 2: Custom Domain Configuration Lost**
- Custom domain `dashboard.plenno.com.au` was manually configured in Vercel
- Configuration may have been removed or reset
- Deployment exists but domain isn't pointing to it

**Hypothesis 3: Project Settings Changed**
- Vercel project may have been reconfigured
- Build settings may have changed
- Framework preset may have been modified

## GitHub Secrets Configuration Problem

### The Logs Don't Lie

Your latest deployment run shows:
```
env:
  VERCEL_ORG_ID:
  VERCEL_PROJECT_ID:
```

**Both are EMPTY.** This proves the secrets are NOT configured correctly.

### Possible Reasons for Empty Secrets

1. **Wrong Secret Names**
   - You may have created secrets with different names than the workflow expects
   - Workflow expects: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_DASHBOARD`, etc.
   - You may have named them differently

2. **Wrong Scope**
   - Secrets were added to wrong location (environment instead of repository)
   - Secrets were added to a different repository/fork
   - Secrets were added but not saved properly

3. **Permissions Issue**
   - Your GitHub account may not have permission to add secrets
   - Repository may have protection rules blocking secret access
   - Organization settings may be restricting secret usage

4. **Configuration Not Saved**
   - Secrets page was filled out but not submitted
   - Browser/network error during save
   - Changes were discarded

## Action Plan: Manual Deployment Required

Since GitHub Actions is not working, deploy manually:

### Option 1: Deploy via Vercel Dashboard (RECOMMENDED)

1. **Log in to Vercel:**
   - Go to https://vercel.com/dashboard
   - Navigate to your team/organization

2. **Find Dashboard Project:**
   - Project name: `dashboard`
   - Project ID: `prj_LuG5grzWFQWQG4Md0nKRAebbIjAk`

3. **Deploy from Vercel UI:**
   - Click "Deployments" tab
   - Click "Deploy" button
   - Select branch: `main`
   - Click "Deploy"

4. **Configure Custom Domain:**
   - Go to "Settings" → "Domains"
   - Add domain: `dashboard.plenno.com.au`
   - If already there, click "Refresh" or "Redeploy"

5. **Verify:**
   ```bash
   curl -I https://dashboard.plenno.com.au
   # Should return HTTP 307 or 200, NOT 404
   ```

### Option 2: Deploy via Vercel CLI Locally

If you have a valid Vercel token:

```bash
# Navigate to dashboard app
cd apps/dashboard

# Set environment variable
export VERCEL_TOKEN="<your-token>"

# Deploy to production
vercel --prod --yes

# The CLI will output the deployment URL
# Vercel should automatically attach to dashboard.plenno.com.au
```

### Option 3: Fix GitHub Secrets Properly

**Verify secret names match EXACTLY:**

Go to: `https://github.com/mystbrent/pleeno/settings/secrets/actions`

Required secrets (case-sensitive):
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID_DASHBOARD
VERCEL_PROJECT_ID_ENTITIES
VERCEL_PROJECT_ID_PAYMENTS
VERCEL_PROJECT_ID_AGENCY
VERCEL_PROJECT_ID_REPORTS
VERCEL_PROJECT_ID_SHELL
```

**Values:**
- `VERCEL_ORG_ID` = `team_3mCod2SbRmzu38gdxZd84tpe`
- `VERCEL_PROJECT_ID_DASHBOARD` = `prj_LuG5grzWFQWQG4Md0nKRAebbIjAk`
- `VERCEL_TOKEN` = Get from https://vercel.com/account/tokens

**After saving secrets:**
```bash
# Trigger new workflow run
gh workflow run deploy-production.yml

# Watch it run
gh run watch

# If it fails again, check logs:
gh run view --log-failed
```

## Diagnostic Commands

### Check GitHub Secrets Configuration

```bash
# List configured secrets (won't show values)
gh secret list --repo mystbrent/pleeno

# Expected output should include:
# VERCEL_TOKEN
# VERCEL_ORG_ID
# VERCEL_PROJECT_ID_DASHBOARD
# ... etc
```

### Check Vercel Projects

```bash
# Get Vercel token from environment
export VERCEL_TOKEN="<your-token>"

# List all projects
vercel list

# Check dashboard project specifically
vercel ls --scope <your-team-scope>
```

### Test Vercel CLI Auth

```bash
# Test if your token works
export VERCEL_TOKEN="<your-token>"
vercel whoami

# Should print your username/email
# If error: token is invalid
```

## Why Shell & Entities Work

**They were deployed MANUALLY via Vercel Dashboard**, not via GitHub Actions. That's why:
- ✅ They have active deployments
- ✅ Custom domains work (shell.plenno.com.au, entities.plenno.com.au)
- ✅ They return HTTP 307 (redirect)
- ❌ GitHub Actions still fails for them too

**You need to deploy dashboard the same way shell and entities were deployed.**

## Immediate Next Step

**Stop trying to use GitHub Actions until secrets are working.**

Instead:

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Find dashboard project**
3. **Click "Deploy" from main branch**
4. **Wait for deployment**
5. **Verify custom domain**

This will get dashboard working immediately while you debug the GitHub secrets issue separately.

## Success Criteria

✅ Dashboard deployed (check Vercel dashboard)
✅ Custom domain attached (check Vercel domains settings)
✅ `curl -I https://dashboard.plenno.com.au` returns HTTP 307 or 200
✅ Login redirect to dashboard works

## Questions to Answer

1. **How did you deploy shell and entities?**
   - Via Vercel Dashboard?
   - Via local Vercel CLI?
   - Via a different CI/CD tool?

2. **Can you access Vercel Dashboard?**
   - Can you see the dashboard project?
   - Can you see its deployments?
   - Can you see the custom domain configuration?

3. **Did you actually see the GitHub secrets saved?**
   - Can you run `gh secret list` and see them?
   - Did you get any error messages when saving?
   - Are you sure you're in the correct repository?

## Related Files

- Working deployment docs: `docs/deployment/REDIRECT_SUCCESS_AUTH_FAILURE.md`
- Deployment workflow: `.github/workflows/deploy-production.yml`
- Dashboard project config: `apps/dashboard/.vercel/project.json`
- Shell project config: `apps/shell/.vercel/project.json`
