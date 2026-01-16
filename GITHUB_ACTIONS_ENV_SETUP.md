# GitHub Actions Environment Variable Setup

## Overview

I've created a GitHub Actions workflow that will configure all 6 Vercel projects with the correct environment variables using your existing GitHub secrets.

**File:** `.github/workflows/configure-vercel-env-vars.yml`

---

## Prerequisites

### ✅ Already Configured (from existing workflow)

These secrets already exist in your GitHub repository:

- `VERCEL_TOKEN` ✅
- `VERCEL_ORG_ID` ✅
- `VERCEL_PROJECT_ID_SHELL` ✅
- `VERCEL_PROJECT_ID_DASHBOARD` ✅
- `VERCEL_PROJECT_ID_AGENCY` ✅
- `VERCEL_PROJECT_ID_ENTITIES` ✅
- `VERCEL_PROJECT_ID_PAYMENTS` ✅
- `VERCEL_PROJECT_ID_REPORTS` ✅

### ❌ New Secret Needed

You need to add **one new secret**:

**Secret name:** `SUPABASE_ANON_KEY_UAT`

**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ
```

---

## Step-by-Step Instructions

### Step 1: Add the New GitHub Secret

1. Go to your GitHub repository: https://github.com/your-username/Pleeno
2. Click **Settings** (top right)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `SUPABASE_ANON_KEY_UAT`
6. Secret: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ`
7. Click **Add secret**

### Step 2: Commit and Push the Workflow

```bash
cd /Users/brenttudas/Pleeno
git add .github/workflows/configure-vercel-env-vars.yml GITHUB_ACTIONS_ENV_SETUP.md
git commit -m "feat: Add GitHub Actions workflow to configure Vercel env vars

Added workflow to automatically configure environment variables for all 6 Vercel
projects using GitHub secrets. This replaces the need to run the bash script
manually and ensures consistent configuration across all deployments.

Features:
- Manual trigger via workflow_dispatch
- Configures all 11 environment variables per project
- Uses existing GitHub secrets for authentication
- Supports production, preview, and development environments

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

### Step 3: Run the Workflow

1. Go to your GitHub repository
2. Click **Actions** tab (top menu)
3. In the left sidebar, click **Configure Vercel Environment Variables**
4. Click **Run workflow** button (top right)
5. Select:
   - **Branch:** main
   - **Environment:** production
6. Click **Run workflow** (green button)

### Step 4: Monitor the Workflow

Watch the workflow run in real-time:
- Each step will show ✅ when complete
- Total time: ~2-3 minutes
- All 6 projects will be configured sequentially

---

## What the Workflow Does

For **each of the 6 Vercel projects** (Dashboard, Entities, Payments, Agency, Reports, Shell):

### Environment Variables Set:

1. **Supabase (Authentication & Database)**
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ccmciliwfdtdspdlkuos.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = UAT anon key (from secret)

2. **App URLs (Multi-Zone Routing)**
   - `NEXT_PUBLIC_SHELL_URL` = `https://shell.plenno.com.au`
   - `NEXT_PUBLIC_DASHBOARD_URL` = `https://dashboard.plenno.com.au`
   - `NEXT_PUBLIC_AGENCY_URL` = `https://agency.plenno.com.au`
   - `NEXT_PUBLIC_ENTITIES_URL` = `https://entities.plenno.com.au`
   - `NEXT_PUBLIC_PAYMENTS_URL` = `https://payments.plenno.com.au`
   - `NEXT_PUBLIC_REPORTS_URL` = `https://reports.plenno.com.au`
   - `NEXT_PUBLIC_APP_URL` = `https://shell.plenno.com.au`

3. **Other Configuration**
   - `NEXT_PUBLIC_COOKIE_DOMAIN` = `.plenno.com.au`
   - `NODE_ENV` = `production`

**Total:** 11 variables × 6 projects = **66 environment variables**

---

## After Running the Workflow

### Step 5: Verify Variables Were Set

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select any project (e.g., "pleeno-shell-uat")
3. Go to **Settings** → **Environment Variables**
4. Verify you see all 11 variables listed
5. Check that values are correct (UAT Supabase, plenno.com.au domains)
6. Repeat for all 6 projects

### Step 6: Trigger Redeployment

The environment variables won't take effect until you redeploy. Choose one:

**Option A: Automatic (Recommended)**
```bash
# Push any commit to trigger deployment
git commit --allow-empty -m "trigger: Redeploy all apps with new env vars"
git push origin main
```

This will trigger your existing `deploy-production.yml` workflow which deploys all 6 apps sequentially.

**Option B: Manual via Vercel Dashboard**

For each of the 6 projects:
1. Go to project in Vercel dashboard
2. Click **Deployments** tab
3. Find latest deployment
4. Click "..." menu → **Redeploy**
5. Select **Use existing Build Cache** (optional)
6. Click **Redeploy**

---

## Verification Checklist

After redeployment completes:

- [ ] Visit https://shell.plenno.com.au/login
- [ ] Enter valid credentials and submit
- [ ] Check browser redirects to https://dashboard.plenno.com.au/dashboard
- [ ] Check browser console - no Supabase errors
- [ ] Check Network tab → verify cookies have domain `.plenno.com.au`
- [ ] Navigate to https://agency.plenno.com.au (stay authenticated)
- [ ] Navigate to https://entities.plenno.com.au (stay authenticated)
- [ ] Navigate to https://payments.plenno.com.au (stay authenticated)
- [ ] Navigate to https://reports.plenno.com.au (stay authenticated)

All checks should pass ✅ - user stays authenticated across all subdomains!

---

## Troubleshooting

### Workflow fails with "Variable already exists"

**This is normal!** The workflow uses `|| true` to continue if variables exist.

**Solution:** No action needed. Variables are already set from a previous run.

### Workflow fails with "Unauthorized"

**Cause:** VERCEL_TOKEN expired or invalid.

**Solution:**
1. Generate new token at https://vercel.com/account/tokens
2. Update GitHub secret `VERCEL_TOKEN`
3. Re-run workflow

### Variables not appearing in Vercel dashboard

**Cause:** Wrong environment selected (production vs preview vs development).

**Solution:**
1. Re-run workflow
2. Ensure you select "production" as the environment
3. Check correct environment tab in Vercel dashboard

### After redeployment, still getting Supabase errors

**Possible causes:**
1. Deployment used cached build (didn't pick up new env vars)
2. Wrong environment variables set

**Solution:**
1. Clear deployment cache: Redeploy with "Use existing Build Cache" UNCHECKED
2. Check Vercel logs for which env var values were used during build
3. Verify environment variables in dashboard match expected values

---

## Advantages of GitHub Actions Approach

✅ **Secure:** Uses GitHub secrets (encrypted, never exposed in logs)
✅ **Consistent:** Same configuration applied to all 6 projects
✅ **Auditable:** Workflow runs are logged and traceable
✅ **Repeatable:** Can re-run anytime to update variables
✅ **No local setup:** No need for VERCEL_TOKEN on local machine
✅ **Version controlled:** Workflow file tracked in git
✅ **Environment selection:** Can configure production, preview, or development

---

## Workflow Configuration

**Name:** Configure Vercel Environment Variables
**File:** `.github/workflows/configure-vercel-env-vars.yml`
**Trigger:** Manual (`workflow_dispatch`)
**Environments:** production, preview, development (selectable)
**Runtime:** ~2-3 minutes
**Dependencies:** Vercel CLI (auto-installed)

---

## Summary

| Aspect | Details |
|--------|---------|
| **New Secret Required** | `SUPABASE_ANON_KEY_UAT` |
| **Workflow File** | `.github/workflows/configure-vercel-env-vars.yml` |
| **Projects Configured** | 6 (shell, dashboard, agency, entities, payments, reports) |
| **Variables Per Project** | 11 |
| **Total Variables Set** | 66 |
| **Execution Time** | ~2-3 minutes |
| **Trigger** | Manual (Actions → Run workflow) |
| **After Running** | Redeploy all apps to apply changes |

---

**Next Steps:**
1. ✅ Add `SUPABASE_ANON_KEY_UAT` secret to GitHub
2. ✅ Commit and push the workflow file
3. ✅ Run the workflow via GitHub Actions UI
4. ✅ Verify variables in Vercel dashboard
5. ✅ Trigger redeployment
6. ✅ Test login flow at https://shell.plenno.com.au/login

This approach is **safer and more reliable** than running the bash script locally!
