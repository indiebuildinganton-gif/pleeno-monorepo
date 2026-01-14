# Authentication Fix & Post-Login Redirect Issue Report

**Date:** December 17, 2025
**Status:** ✅ Authentication FIXED | ⚠️ Redirect Issue Identified
**Deployment:** https://shell-pink-delta.vercel.app

---

## Executive Summary

The authentication issue on the Vercel shell deployment has been **successfully resolved**. The login API now returns **200 OK** with proper session tokens and user data. However, a **new issue has been identified**: after successful login, users are redirected to an invalid dashboard URL resulting in a **404 NOT_FOUND** error.

### Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Authentication API** | ✅ WORKING | Login endpoint returns 200 with valid session |
| **Supabase Connection** | ✅ WORKING | Connected to UAT instance successfully |
| **Cookie Setting** | ✅ WORKING | Auth cookies are set correctly |
| **Post-Login Redirect** | ❌ BROKEN | Redirects to invalid dashboard URL |

---

## Problem 1: Authentication Failure (RESOLVED ✅)

### Original Issue

```bash
# Before Fix
curl https://shell-pink-delta.vercel.app/api/auth/login \
  -H 'content-type: application/json' \
  --data-raw '{"email":"admin@test.local","password":"password"}'

# Response: 401 Unauthorized
{"error":"Invalid credentials"}
```

### Root Cause

The Vercel shell project was **missing Supabase environment variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are required by the API route client at [packages/database/src/api-route.ts:43-44](../../packages/database/src/api-route.ts#L43-L44):

```typescript
const supabase = createSupabaseSSRClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,      // ❌ Was undefined
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ❌ Was undefined
  { cookies: { ... } }
)
```

Without these variables, the Supabase client couldn't authenticate users, resulting in "Invalid credentials" errors even with correct passwords.

### Solution Implemented

**Updated Vercel environment variables via API:**

```bash
# 1. Updated NEXT_PUBLIC_SUPABASE_URL
curl -X PATCH "https://api.vercel.com/v9/projects/prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5/env/aT83uf5BBv2qdiQu" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -d '{"value": "https://ccmciliwfdtdspdlkuos.supabase.co", "target": ["production"]}'

# 2. Updated NEXT_PUBLIC_SUPABASE_ANON_KEY
curl -X PATCH "https://api.vercel.com/v9/projects/prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5/env/mnYwEA3ljOdXp4hC" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -d '{"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "target": ["production"]}'

# 3. Triggered redeployment
git commit --allow-empty -m "Trigger deployment to apply Supabase environment variables"
git push origin main
```

### Verification - Authentication Now Works ✅

```bash
# After Fix
curl https://shell-pink-delta.vercel.app/api/auth/login \
  -H 'content-type: application/json' \
  --data-raw '{"email":"admin@test.local","password":"password"}'

# Response: 200 OK
HTTP/2 200
set-cookie: sb-ccmciliwfdtdspdlkuos-auth-token=base64-eyJhY2Nlc3NfdG9rZW4iOiJleUp...

{
  "user": {
    "id": "10000000-0000-0000-0000-000000000001",
    "email": "admin@test.local",
    "role": "authenticated",
    "app_metadata": {
      "agency_id": "20000000-0000-0000-0000-000000000001",
      "role": "agency_admin"
    }
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

**✅ Authentication is fully functional**

---

## Problem 2: Post-Login Redirect Issue (ACTIVE ⚠️)

### Current Issue

After successful login, users are redirected to:
```
https://dashboard-4aygkovdf-antons-projects-1b1c34d6.vercel.app/
```

**Result:**
```
404: NOT_FOUND
Code: NOT_FOUND
```

### Root Cause Analysis

The dashboard URL being used is a **preview/branch deployment URL**, not the production URL. This happens because:

1. **Environment Variable Mismatch**
   - The `NEXT_PUBLIC_DASHBOARD_URL` stored in Vercel's environment variables is stale
   - It points to an old preview deployment that no longer exists

2. **Build-Time vs Runtime Configuration**
   - In the GitHub Actions workflow, child app URLs are passed as **build-time** environment variables:

   ```yaml
   # From .github/workflows/deploy-production.yml:531
   vercel --prod \
     --build-env NEXT_PUBLIC_DASHBOARD_URL="${{ needs.deploy-dashboard.outputs.url }}"
   ```

   - These build-time values should override the stored environment variables
   - However, when deploying manually (not via GitHub Actions), the stale stored values are used

3. **Deployment Method**
   - The current deployment was triggered by pushing a commit
   - GitHub Actions should deploy all apps sequentially and pass correct URLs
   - But the shell app might be using cached/stored environment variables instead

### Expected Behavior

After successful login, users should be redirected to the **production dashboard URL**:
- Should be something like: `https://dashboard.plenno.com.au` OR
- A valid Vercel production URL like: `https://dashboard-[hash].vercel.app`

### Where Redirect Logic Lives

The post-login redirect is likely handled in one of these locations:
1. Login page component that calls the API
2. Middleware that intercepts after authentication
3. API route response that sets a redirect header
4. Client-side redirect based on `NEXT_PUBLIC_DASHBOARD_URL`

**Investigation needed:** Find where the redirect URL is configured and ensure it uses the correct dashboard URL.

---

## Technical Details

### Supabase Configuration (UAT Instance)

```bash
# Instance: ccmciliwfdtdspdlkuos
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ
```

### Environment Variables Updated

| Variable | ID | Status | Target |
|----------|-----|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `aT83uf5BBv2qdiQu` | ✅ Updated | production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `mnYwEA3ljOdXp4hC` | ✅ Updated | production |
| `NEXT_PUBLIC_DASHBOARD_URL` | `fTxkx7hTJQmQT3gP` | ⚠️ Stale | production |

### API Endpoints

- **Login:** `POST https://shell-pink-delta.vercel.app/api/auth/login`
- **Implementation:** [apps/shell/app/api/auth/login/route.ts](../../apps/shell/app/api/auth/login/route.ts)
- **Supabase Client:** [packages/database/src/api-route.ts](../../packages/database/src/api-route.ts)

---

## Solution for Redirect Issue

### Option 1: Wait for Full GitHub Actions Deployment (Recommended)

Let the GitHub Actions workflow complete its full sequential deployment:
1. Dashboard deploys → gets production URL
2. Entities, Payments, Agency, Reports deploy
3. Shell deploys last with all child app URLs as build-env variables

**Action Required:**
- Monitor GitHub Actions workflow: https://github.com/[owner]/Pleeno/actions
- Wait for completion
- Test login again after deployment finishes

### Option 2: Update Dashboard URL Environment Variable

Update the stored `NEXT_PUBLIC_DASHBOARD_URL` to the correct production URL:

```bash
# Get the correct dashboard production URL
DASHBOARD_URL="https://dashboard.plenno.com.au"  # or correct Vercel URL

# Update via API
curl -X PATCH "https://api.vercel.com/v9/projects/prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5/env/fTxkx7hTJQmQT3gP" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"value\": \"$DASHBOARD_URL\", \"target\": [\"production\"]}"

# Redeploy
git commit --allow-empty -m "Update dashboard URL for post-login redirect"
git push origin main
```

### Option 3: Fix Redirect Logic

Investigate and update the code that handles post-login redirects:

**Files to check:**
1. Login form/page component
2. Middleware configuration
3. Auth callback handlers
4. Environment variable usage

**Search for:**
```bash
grep -r "NEXT_PUBLIC_DASHBOARD_URL" apps/shell/
grep -r "redirect.*dashboard" apps/shell/
grep -r "router.push.*dashboard" apps/shell/
```

---

## Comparison: Before vs After

### Authentication API

| Aspect | Before | After |
|--------|--------|-------|
| **Status Code** | 401 Unauthorized | ✅ 200 OK |
| **Response** | `{"error":"Invalid credentials"}` | ✅ User + Session data |
| **Cookies** | None | ✅ Auth token set |
| **Supabase Connection** | ❌ Failed | ✅ Connected |

### Login Flow

| Step | Before | After |
|------|--------|-------|
| 1. User submits credentials | ✅ Working | ✅ Working |
| 2. API authenticates with Supabase | ❌ Failed (no env vars) | ✅ Success |
| 3. API returns session | ❌ 401 error | ✅ 200 with data |
| 4. Cookie is set | ❌ No cookie | ✅ Cookie set |
| 5. Redirect to dashboard | N/A (failed before) | ❌ 404 error |

---

## Next Steps

### Immediate Actions

1. **Monitor GitHub Actions Deployment**
   - Check if the workflow is running: https://github.com/[owner]/Pleeno/actions
   - Wait for sequential deployment to complete
   - This should set correct URLs as build-env variables

2. **Verify Dashboard Deployment**
   - Confirm dashboard app deployed successfully
   - Get the production dashboard URL
   - Verify it's accessible

3. **Test Login Flow Again**
   - Once deployment completes, test login
   - Verify redirect goes to correct dashboard URL
   - Confirm dashboard page loads successfully

### Investigation Tasks

1. **Find Redirect Logic**
   ```bash
   # Search for redirect implementation
   grep -r "NEXT_PUBLIC_DASHBOARD_URL" apps/shell/
   grep -r "window.location" apps/shell/app
   grep -r "router.push" apps/shell/app
   ```

2. **Check Middleware**
   - Review [apps/shell/middleware.ts](../../apps/shell/middleware.ts)
   - Verify auth redirect logic
   - Ensure it uses correct environment variables

3. **Verify Environment Variables**
   ```bash
   # Check what's actually deployed
   curl https://shell-pink-delta.vercel.app/_next/static/chunks/main-*.js | grep -o "NEXT_PUBLIC_DASHBOARD_URL"
   ```

### Long-Term Solutions

1. **Automate Environment Variables in CI/CD**
   - Add dashboard URL update step in GitHub Actions
   - Ensure all child app URLs are updated before shell deployment
   - Reference: [.github/workflows/deploy-production.yml:531-536](../../.github/workflows/deploy-production.yml#L531-L536)

2. **Add Environment Variable Validation**
   - Create startup check for required env vars
   - Log warnings if URLs are missing or invalid
   - Add health check endpoint

3. **Improve Multi-Zone URL Management**
   - Consider using a configuration service
   - Implement fallback URLs for development
   - Document all required environment variables

---

## Lessons Learned

### Key Insights

1. **Environment Variables Are Critical**
   - Missing Supabase credentials caused complete auth failure
   - Even with correct code, missing config = broken functionality
   - Always verify env vars after deployment

2. **Build-Time vs Runtime Environment Variables**
   - Next.js public env vars must be available at build time
   - Stored Vercel env vars can become stale
   - Build-env overrides are preferred for dynamic URLs

3. **Sequential Dependencies in Multi-Zone Apps**
   - Shell app depends on child app URLs
   - Must deploy in correct order: children first, shell last
   - URLs must be passed at build time, not stored

4. **Testing After Env Changes**
   - Env var updates don't affect existing deployments
   - Must trigger new deployment to apply changes
   - Verify with actual API calls, not just dashboard checks

### Best Practices Established

1. **Always Set Environment Variables Via CI/CD**
   - Use GitHub Actions to set dynamic URLs
   - Pass as `--build-env` flags during deployment
   - Don't rely on stored Vercel environment variables for URLs

2. **Validate Configuration Early**
   - Check required env vars at application startup
   - Fail fast if critical config is missing
   - Log clear error messages

3. **Document All Required Environment Variables**
   - Maintain comprehensive .env.example
   - Document which vars are build-time vs runtime
   - Specify where each var is used in code

---

## Reference Links

### Documentation
- [Initial Deployment Report](./VERCEL_DEPLOYMENT_SUCCESS_REPORT.md)
- [Environment Variables Example](./.env.example)
- [UAT Configuration](./.env.uat)

### Code References
- [Login API Route](../../apps/shell/app/api/auth/login/route.ts)
- [Supabase API Client](../../packages/database/src/api-route.ts)
- [Deployment Workflow](../../.github/workflows/deploy-production.yml)

### API Endpoints
- **Shell (Auth):** https://shell-pink-delta.vercel.app
- **Login API:** https://shell-pink-delta.vercel.app/api/auth/login
- **Dashboard (Invalid):** https://dashboard-4aygkovdf-antons-projects-1b1c34d6.vercel.app/

---

## Timeline

| Time | Event | Status |
|------|-------|--------|
| 09:35 UTC | Authentication failing with 401 | ❌ |
| 09:45 UTC | Root cause identified: Missing env vars | 🔍 |
| 10:05 UTC | Updated NEXT_PUBLIC_SUPABASE_URL | ✅ |
| 10:06 UTC | Updated NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ |
| 10:07 UTC | Triggered redeployment | 🚀 |
| 10:15 UTC | Authentication working - 200 OK | ✅ |
| 10:16 UTC | Redirect issue discovered - 404 | ⚠️ |

---

**Document Version:** 1.0
**Last Updated:** December 17, 2025 10:16 UTC
**Author:** Claude Code Assistant
**Status:** Authentication Fixed ✅ | Redirect Issue Active ⚠️
