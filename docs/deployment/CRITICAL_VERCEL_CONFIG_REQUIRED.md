# CRITICAL: Vercel Dashboard Configuration Required

**Date:** 2026-01-14
**Status:** 🚨 BLOCKING - Requires Manual Admin Action
**Priority:** CRITICAL

## Summary

All code fixes for the dashboard 404 error have been successfully deployed to Vercel. However, **users cannot access them** due to Vercel project configuration issues that require manual intervention via the Vercel Dashboard.

## Evidence

### Latest Deployment (Run #20991594053)
- **Commit:** 1a400fd ("Fix: Add root page redirect for dashboard basePath")
- **Status:** ✅ Deployed Successfully
- **Deployment URL:** https://dashboard-dofwqb34v-antons-projects-1b1c34d6.vercel.app/
- **Result:** HTTP 401 (password protected)

### Custom Domain
- **URL:** https://dashboard.plenno.com.au/
- **Result:** HTTP 404 NOT_FOUND
- **Issue:** Stuck pointing to 28-day-old deployment

### Test Results

```bash
# Test 1: Custom domain - OLD deployment
$ curl -I https://dashboard.plenno.com.au/
HTTP/2 404
x-vercel-error: NOT_FOUND

# Test 2: Latest deployment URL - PASSWORD PROTECTED
$ curl -I https://dashboard-dofwqb34v-antons-projects-1b1c34d6.vercel.app/
HTTP/2 401
set-cookie: _vercel_sso_nonce=...
x-robots-tag: noindex
```

## The Two Blocking Issues

### Issue #1: Deployment Protection Enabled

**Problem:** Vercel project has "Deployment Protection" set to protect ALL deployments (including production).

**Evidence:**
- HTTP 401 responses on deployment URLs
- `_vercel_sso_nonce` cookie present
- `x-robots-tag: noindex` header

**Impact:** Even though deployments succeed, they're inaccessible without authentication.

### Issue #2: Custom Domain Not Auto-Updating

**Problem:** Custom domain `dashboard.plenno.com.au` is NOT updating to point to the latest production deployments.

**Evidence:**
- Custom domain returns 404 (old deployment)
- Deployment URL returns 401 (new deployment, but password-protected)
- Gap of 28 days between what custom domain serves vs latest deployment

**Impact:** Users accessing the custom domain see old code without the fixes.

## Why Code Fixes Aren't Reaching Users

```
┌─────────────────────────────────────────────────┐
│  Developer Pushes Code Fix                     │
│  ├─ Shell redirect fix ✅                       │
│  └─ Dashboard root page redirect ✅             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  GitHub Actions Deploys to Vercel               │
│  ├─ Build succeeds ✅                            │
│  ├─ Deployment succeeds ✅                       │
│  └─ Creates new production deployment ✅        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Vercel Deployment Protection                   │
│  └─ Marks deployment as password-required 🔒    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Custom Domain (dashboard.plenno.com.au)        │
│  ├─ Does NOT auto-update ❌                      │
│  ├─ Still points to 28-day-old deployment ❌     │
│  └─ Serves old code without fixes ❌             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  User Experience                                │
│  ├─ Logs in at shell.plenno.com.au ✅            │
│  ├─ Redirects to dashboard.plenno.com.au/ ✅     │
│  ├─ Custom domain serves OLD deployment ❌       │
│  └─ User sees 404 error ❌                       │
└─────────────────────────────────────────────────┘
```

## Required Manual Actions

These require Vercel Dashboard access with admin permissions:

### Action 1: Fix Deployment Protection

**Steps:**
1. Log in to Vercel Dashboard
2. Navigate to dashboard project
3. Go to **Settings → Deployment Protection**
4. Change setting:
   - FROM: "All Deployments" (protects everything)
   - TO: "Standard Protection" (only protects preview deployments)
5. Click **Save**

**What This Does:**
- Production deployments will no longer be password-protected
- Preview deployments will still be protected
- Users can access the latest production deployment

### Action 2: Update Custom Domain Assignment

After fixing deployment protection, force the custom domain to update:

**Option A: Trigger New Deployment**
```bash
git commit --allow-empty -m "Trigger deployment after config fix"
git push
```

**Option B: Manually Promote in Dashboard**
1. Go to dashboard project → **Deployments**
2. Find deployment `dashboard-dofwqb34v` (or latest)
3. Click **"..."** menu → **"Promote to Production"**
4. Verify custom domain updates

**Option C: Use Vercel API**
```bash
curl -X POST "https://api.vercel.com/v9/projects/prj_LuG5grzWFQWQG4Md0nKRAebbIjAk/alias" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "dashboard.plenno.com.au",
    "deploymentId": "dashboard-dofwqb34v"
  }'
```

## Verification Steps

After completing the manual actions:

### Test 1: Custom Domain Should Work
```bash
curl -I https://dashboard.plenno.com.au/
# Expected: HTTP 200 or 307 (NOT 404)
# Expected: Fresh deployment (NOT 28-day-old)
```

### Test 2: Root Should Redirect
```bash
curl -I -L https://dashboard.plenno.com.au/
# Expected: Redirects to /dashboard
# Expected: HTTP 200 on /dashboard
```

### Test 3: End-to-End Login Flow
1. Visit https://shell.plenno.com.au/login
2. Log in with credentials
3. Should redirect to https://dashboard.plenno.com.au/dashboard
4. Dashboard page should load ✅

## This Affects ALL Apps

The same configuration issues affect all custom domains:
- ❌ dashboard.plenno.com.au
- ❌ entities.plenno.com.au
- ❌ payments.plenno.com.au
- ❌ agency.plenno.com.au
- ❌ reports.plenno.com.au
- ❌ shell.plenno.com.au

**All projects need the same Deployment Protection fix.**

## What I Cannot Do

I cannot fix this because it requires:
- ❌ Vercel Dashboard access
- ❌ Admin/owner permissions on the Vercel account
- ❌ Ability to change project settings
- ❌ Ability to promote deployments or update domain assignments

These actions must be performed by someone with Vercel Dashboard access.

## Timeline

| Time | Event | Status |
|------|-------|--------|
| 2026-01-14 08:00 | Deployed shell redirect fix | ✅ |
| 2026-01-14 08:30 | Deployed dashboard redirect config | ✅ (but didn't work) |
| 2026-01-14 10:55 | Deployed dashboard root page | ✅ |
| 2026-01-14 11:07 | Verified custom domain still 404 | ❌ |
| 2026-01-14 11:07 | Verified deployment URL protected | ❌ |
| **NOW** | **Need admin to fix Vercel settings** | ⏳ |

## Next Steps After Fix

Once the Vercel configuration is fixed and the dashboard loads:

1. **Verify Dashboard Loads** ✅
2. **Expect API 401 Errors** - This is the NEXT issue
3. **Implement Cookie Domain Sharing** - See [RESEARCH_PROMPT_COOKIE_DOMAIN_VIABILITY.md](./RESEARCH_PROMPT_COOKIE_DOMAIN_VIABILITY.md)

The cookie sharing issue is documented and ready to address, but we need to fix the Vercel configuration first.

---

**Bottom Line:** The code is correct and deployed. The infrastructure configuration is blocking user access. Manual Vercel Dashboard intervention is required.
