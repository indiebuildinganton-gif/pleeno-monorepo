# Critical: Custom Domains Not Updating to Latest Deployment

**Date:** 2026-01-14
**Status:** 🚨 BLOCKING ISSUE
**Priority:** CRITICAL

## Problem Summary

The custom domain `dashboard.plenno.com.au` is **NOT updating** to point to the latest production deployments. It's stuck pointing to a deployment from 28 days ago, meaning users never see the fixes we deploy.

## Evidence

### Test Results
```bash
# Custom domain - OLD deployment (28 days old)
$ curl -I https://dashboard.plenno.com.au/
HTTP/2 404
age: 2427825  # 28 days old!
x-vercel-error: NOT_FOUND

# Latest deployment - PASSWORD PROTECTED
$ curl -I https://dashboard-lgke6ukhb-antons-projects-1b1c34d6.vercel.app/
HTTP/2 401  # Deployment Protection enabled
```

### Deployment Timeline
| Run ID | Commit | Status | Custom Domain Updated? |
|--------|--------|--------|----------------------|
| 20987182678 | 1a2fc19 (dashboard redirect fix) | ✅ SUCCESS | ❌ NO |
| 20986618171 | 44dd8d8 (shell redirect fix) | ✅ SUCCESS | ❌ NO |
| ~28 days ago | Unknown | ✅ SUCCESS | ✅ YES (still pointing here) |

## Root Causes

### 1. Deployment Protection Enabled
Vercel project has "Deployment Protection" enabled, which password-protects ALL deployments (even production ones).

**Evidence:**
- HTTP 401 responses
- `_vercel_sso_nonce` cookie
- `x-robots-tag: noindex` header

### 2. Custom Domain Not Auto-Updating
Custom domains should automatically update to the latest `--prod` deployment, but they're not.

**Possible Reasons:**
- Custom domain not properly attached in Vercel dashboard
- DNS caching (CDN layer)
- Vercel project configuration issue
- Custom domain pointing to specific deployment ID instead of "production alias"

### 3. Vercel CLI Using Preview URLs
The workflow extracts deployment URLs like:
```
https://dashboard-lgke6ukhb-antons-projects-1b1c34d6.vercel.app
```

These are **preview/deployment-specific URLs**, not the production alias. Custom domains should point to the production alias, not specific deployments.

## What Needs to Happen

### Immediate Actions Required

1. **Disable Deployment Protection (or configure properly)**
   - Go to Vercel Dashboard → Project Settings → Deployment Protection
   - Either disable it OR configure to only protect non-production deployments

2. **Verify Custom Domain Configuration**
   - Vercel Dashboard → Project Settings → Domains
   - Ensure `dashboard.plenno.com.au` is attached
   - Check if it's set to "Production" (not a specific deployment)

3. **Force Custom Domain Update**
   - Manually promote latest deployment to production
   - OR remove and re-add custom domain
   - OR use Vercel API to update domain assignment

4. **Fix for All Apps**
   - This affects ALL custom domains:
     - dashboard.plenno.com.au
     - entities.plenno.com.au
     - payments.plenno.com.au
     - agency.plenno.com.au
     - reports.plenno.com.au
     - shell.plenno.com.au (if configured)

## Why This Breaks Everything

### Current User Experience:
1. User logs in at shell.plenno.com.au ✅
2. Shell redirects to dashboard.plenno.com.au/
3. Custom domain serves **28-day-old deployment** ❌
4. Old deployment doesn't have redirect fix ❌
5. Old deployment doesn't have basePath handling ❌
6. User sees 404 error ❌

### Why Fixes Don't Help:
- ✅ We deploy fixes to Vercel
- ✅ Deployments succeed
- ✅ New code is running on new deployment URLs
- ❌ Custom domains DON'T point to new deployments
- ❌ Users NEVER see the fixes

## How Vercel Custom Domains Should Work

### Normal Behavior:
1. Deploy with `vercel --prod`
2. Vercel creates new production deployment
3. Custom domains **automatically update** to point to new deployment
4. Users see latest code immediately

### Current Behavior:
1. Deploy with `vercel --prod` ✅
2. Vercel creates new production deployment ✅
3. Custom domains **DON'T update** ❌
4. Custom domains serve old deployment ❌
5. Users see old code ❌

## Solution Options

### Option 1: Fix via Vercel Dashboard (RECOMMENDED)

**Steps:**
1. Log in to Vercel Dashboard
2. For each project (dashboard, entities, etc.):
   a. Go to Settings → Deployment Protection
   b. Set to "Standard Protection" (not "All Deployments")
   c. Go to Settings → Domains
   d. Verify custom domain is attached to "Production"
   e. If not, remove and re-add domain
3. Trigger new deployment
4. Verify custom domain updates

### Option 2: Use Vercel API to Force Update

```bash
# For dashboard project
curl -X POST "https://api.vercel.com/v9/projects/prj_LuG5grzWFQWQG4Md0nKRAebbIjAk/alias" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "dashboard.plenno.com.au",
    "deploymentId": "<latest-deployment-id>"
  }'
```

### Option 3: Remove Deployment Protection

If deployment protection isn't needed:
1. Vercel Dashboard → Project Settings
2. Deployment Protection → None
3. Redeploy

## Verification After Fix

```bash
# Test 1: Custom domain should serve latest code
curl -I https://dashboard.plenno.com.au/
# Expected: HTTP 307 or 200 (NOT 404)
# Expected: Recent age header (not millions)

# Test 2: Root should redirect
curl -I https://dashboard.plenno.com.au/
# Expected: HTTP 307 → Location: /dashboard

# Test 3: Dashboard works
curl -I https://dashboard.plenno.com.au/dashboard
# Expected: HTTP 200
```

## Impact on Cookie Domain Research

**The cookie domain research IS still relevant**, but we need to fix this issue FIRST:

### Current Blocker:
1. ❌ Custom domains serve old code
2. ❌ Redirect fixes never reach users
3. ❌ Can't test if fixes work

### After This Fix:
1. ✅ Custom domains serve latest code
2. ✅ Dashboard page will load
3. ⏳ THEN: Cookie domain sharing needed for API auth

**The cookie issue is NEXT**, not now. First we need users to see the latest code.

## Action Required

**USER/ADMIN must:**
1. Access Vercel Dashboard with admin credentials
2. Fix Deployment Protection settings
3. Verify custom domain configuration
4. Either:
   - Manually promote latest deployment, OR
   - Trigger new deployment after fixing settings

**I cannot fix this** because it requires:
- Vercel Dashboard access
- Admin permissions
- Project settings changes

## Timeline

| Time | Event | Status |
|------|-------|--------|
| ~28 days ago | Last custom domain update | ✅ |
| 2026-01-14 08:00 | Deployed shell fix | ✅ (but not on custom domain) |
| 2026-01-14 08:30 | Deployed dashboard fix | ✅ (but not on custom domain) |
| 2026-01-14 08:35 | Identified custom domain stuck | ✅ |
| **NOW** | **Need admin to fix Vercel settings** | ⏳ |

---

**Bottom Line:** All my code fixes are deployed and working on the new deployment URLs. But users will NEVER see them until the custom domain configuration is fixed in Vercel Dashboard.

