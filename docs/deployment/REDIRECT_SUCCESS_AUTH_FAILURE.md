# Post-Login Redirect Success - New Authentication Issue

**Date:** 2025-12-17
**Status:** Redirect Fixed ✅ | API Authentication Failing ❌
**Priority:** HIGH

## Summary

The post-login redirect issue has been **successfully resolved**. Users logging in at the shell app are now redirected to a deployed dashboard URL. However, a **new critical issue** has emerged: all dashboard API calls are failing with 401 Unauthorized errors, preventing the dashboard from loading data.

## Problem Resolution: Redirect Issue

### What Was Fixed
The shell app's `NEXT_PUBLIC_DASHBOARD_URL` environment variable was pointing to a stale/invalid preview deployment:
```
OLD: https://dashboard-4aygkovdf-antons-projects-1b1c34d6.vercel.app/
```

### Solution Applied
Updated the Vercel environment variable to use the stable custom domain:
```
NEW: https://dashboard.plenno.com.au
```

**Actions Taken:**
1. ✅ Identified correct dashboard production URL (`https://dashboard.plenno.com.au`)
2. ✅ Verified dashboard URL is accessible (HTTP 200 on `/dashboard` route)
3. ✅ Updated `NEXT_PUBLIC_DASHBOARD_URL` via Vercel API
4. ✅ Triggered redeployment with empty commit

### Current Redirect Behavior
- **Shell Login URL:** `https://shell-pink-delta.vercel.app/login`
- **Redirects To:** `https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app/dashboard`
- **Redirect Status:** ✅ Working (no more 404)

**Note:** The redirect is going to a preview deployment URL instead of the custom domain `https://dashboard.plenno.com.au`. This suggests the environment variable may need another deployment cycle to fully propagate, or there's a caching issue.

---

## New Critical Issue: 401 Authentication Errors

### Problem Description
After successful login and redirect, the dashboard page loads but **all API calls fail with 401 Unauthorized** errors. This prevents any data from being displayed to the user.

### Affected API Endpoints

All dashboard API endpoints are returning 401:

```
/dashboard/api/seasonal-commission          → 401 Unauthorized
/dashboard/api/payment-status-summary       → 401 Unauthorized
/dashboard/api/kpis                         → 401 Unauthorized
/dashboard/api/commission-by-school         → 401 Unauthorized
/dashboard/api/commission-by-country        → 401 Unauthorized
/dashboard/api/entities/colleges            → 401 Unauthorized
/dashboard/api/entities/branches            → 401 Unauthorized
/dashboard/api/commission-by-college?period=all → 401 Unauthorized
/dashboard/api/cash-flow-projection         → 401 Unauthorized
/dashboard/api/activity-log                 → 401 Unauthorized
/dashboard/api/overdue-payments             → 401 Unauthorized
```

### Error Pattern
```
Failed to load resource: the server responded with a status of 401 ()
```

### Root Cause Analysis

This is an **authentication/session management issue** across the micro-frontend zones. The likely causes are:

#### 1. Session Cookie Not Shared Between Zones
**Most Likely Cause**

The authentication session created in the shell app is not accessible to the dashboard app due to:
- Different domains/subdomains (preview URLs vs custom domains)
- Cookie domain settings not configured for cross-zone sharing
- SameSite cookie restrictions

**Evidence:**
- Login succeeds in shell (shell can verify credentials)
- Redirect succeeds (dashboard page loads)
- API calls fail (dashboard cannot access session)

#### 2. Supabase Configuration Mismatch
The dashboard and shell apps may be using different Supabase configurations:
- Different Supabase URLs (production vs UAT)
- Different anonymous keys
- Inconsistent environment variables

**Related Context:**
From `docs/deployment/AUTHENTICATION_FIX_AND_REDIRECT_ISSUE.md`, we know:
- Shell uses UAT Supabase instance: `https://qyjftxpnlfumxwpxfdmx.supabase.co`
- Environment variables were recently updated for UAT

#### 3. Missing or Invalid JWT Token
The dashboard API routes expect a JWT token from Supabase, but:
- Token not being passed in request headers
- Token expired or invalid
- Token not being set after successful login

#### 4. Middleware Authentication Check Failing
The dashboard middleware may be checking for authentication and rejecting requests:
- Session not found in Supabase SSR context
- Cookie not being read correctly by middleware
- CORS or cookie access issues

---

## Technical Context

### Multi-Zone Architecture
The Pleeno app uses Next.js multi-zone architecture:
- **Shell app:** Entry point and authentication
- **Dashboard app:** Separate Next.js app for dashboard features
- **Other apps:** entities, payments, agency, reports

### Authentication Flow (Expected)
```
1. User visits shell app login page
2. User submits credentials
3. Shell app authenticates with Supabase
4. Shell app creates session (sets cookies)
5. Shell app redirects to dashboard app
6. Dashboard app reads session from cookies
7. Dashboard API routes verify session
8. Data loads successfully
```

### Authentication Flow (Current - Broken)
```
1. User visits shell app login page      ✅ Working
2. User submits credentials               ✅ Working
3. Shell app authenticates with Supabase  ✅ Working
4. Shell app creates session              ✅ Working
5. Shell app redirects to dashboard app   ✅ Working
6. Dashboard app reads session            ❌ FAILING
7. Dashboard API routes verify session    ❌ FAILING (401)
8. Data loads successfully                ❌ FAILING
```

---

## Environment Configuration

### Shell App
- **URL:** `https://shell-pink-delta.vercel.app`
- **Supabase URL:** `https://qyjftxpnlfumxwpxfdmx.supabase.co` (UAT)
- **Project ID:** `prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5`

### Dashboard App
- **Custom Domain:** `https://dashboard.plenno.com.au`
- **Preview URL:** `https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app`
- **Project ID:** `prj_LuG5grzWFQWQG4Md0nKRAebbIjAk`
- **Supabase Config:** Unknown (needs verification)

### Key Files
- Shell auth: `apps/shell/app/(auth)/login/page.tsx`
- Multi-zone redirect: `apps/shell/lib/multi-zone-redirect.ts`
- Dashboard middleware: `apps/dashboard/middleware.ts`
- Dashboard API routes: `apps/dashboard/app/api/**/*`

---

## Investigation Steps

### 1. Verify Supabase Configuration Consistency
```bash
# Check shell app Supabase config
vercel env ls --scope pleeno-yb5fuvs3z --project-name shell | grep SUPABASE

# Check dashboard app Supabase config
vercel env ls --scope pleeno-yb5fuvs3z --project-name dashboard | grep SUPABASE
```

**Expected:** Both apps should use the same Supabase URL and keys.

### 2. Inspect Session Cookies
In browser DevTools after login:
```
1. Open Network tab
2. Login to shell app
3. After redirect to dashboard, check:
   - Application → Cookies
   - Look for Supabase session cookies
   - Check cookie domain, path, SameSite attributes
```

**Look for:**
- `sb-<project-ref>-auth-token`
- Cookie domain settings
- SameSite=None (required for cross-domain)
- Secure flag (required for HTTPS)

### 3. Check Dashboard Middleware
```bash
# Review middleware authentication logic
cat apps/dashboard/middleware.ts
```

**Questions:**
- Does middleware check for Supabase session?
- Does it allow unauthenticated requests to pass through?
- Are there any CORS or cookie access issues?

### 4. Test API Routes Directly
```bash
# Get session token from browser after login
# Then test API endpoint with curl
curl -v "https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app/dashboard/api/kpis" \
  -H "Authorization: Bearer <token>" \
  -H "Cookie: sb-qyjftxpnlfumxwpxfdmx-auth-token=<cookie-value>"
```

### 5. Review Supabase SSR Setup
```bash
# Check how Supabase client is initialized
grep -r "createServerClient\|createBrowserClient" apps/dashboard/
```

**Verify:**
- Cookies are being set with correct domain
- Session is being persisted properly
- Client is initialized correctly

---

## Recommended Solutions

### Option 1: Configure Shared Cookie Domain (Recommended)
**If using custom domains:**

Update Supabase client configuration to set cookies with a shared parent domain:

```typescript
// apps/shell/lib/supabase.ts and apps/dashboard/lib/supabase.ts
import { createServerClient } from '@supabase/ssr'

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Set cookies on parent domain for cross-zone sharing
        domain: '.plenno.com.au',
        sameSite: 'lax',
        secure: true,
      }
    }
  )
}
```

**Benefits:**
- Shares session across all subdomains
- Works with custom domains
- Standard approach for multi-zone apps

**Requires:**
- All apps use custom domains (*.plenno.com.au)
- Cannot work with Vercel preview URLs

### Option 2: Use Vercel Preview Domain
If preview URLs must be used, configure cookies for `.vercel.app`:

```typescript
cookies: {
  domain: '.vercel.app',
  sameSite: 'none',
  secure: true,
}
```

**Warning:** This is less secure and may not work due to Vercel's subdomain isolation.

### Option 3: Token-Based Authentication
Pass authentication token via URL query parameter or localStorage:

```typescript
// After login in shell
const session = await supabase.auth.getSession()
const token = session.data.session?.access_token
// Redirect with token
router.push(`${dashboardUrl}?token=${token}`)

// In dashboard, read token and set session
const { searchParams } = new URL(request.url)
const token = searchParams.get('token')
if (token) {
  await supabase.auth.setSession({ access_token: token, refresh_token: '' })
}
```

**Pros:**
- Works across any domains
- Handles preview URLs

**Cons:**
- Token exposed in URL (less secure)
- Requires token handling logic
- Not ideal for production

### Option 4: Ensure All Apps Use Same Supabase Instance
Verify and align Supabase configuration:

```bash
# Update dashboard to use same Supabase as shell
vercel env add NEXT_PUBLIC_SUPABASE_URL production \
  --value "https://qyjftxpnlfumxwpxfdmx.supabase.co" \
  --project-name dashboard

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production \
  --value "<same-key-as-shell>" \
  --project-name dashboard
```

Then redeploy dashboard.

---

## Immediate Next Steps

1. **Verify Supabase Configuration**
   - Check if shell and dashboard use the same Supabase URL/keys
   - Ensure UAT Supabase instance is used consistently

2. **Inspect Cookie Behavior**
   - Use browser DevTools to check session cookies after login
   - Verify cookie domain, SameSite, and Secure attributes

3. **Review Dashboard Middleware**
   - Check `apps/dashboard/middleware.ts` for authentication logic
   - Identify why session is not accessible

4. **Test Session Sharing**
   - Add debug logging to dashboard middleware
   - Log whether Supabase session is found

5. **Implement Cookie Domain Fix**
   - Update Supabase client configuration in both apps
   - Set shared cookie domain (`.plenno.com.au`)
   - Redeploy both apps

---

## Success Criteria

✅ **Issue Fully Resolved When:**
1. User can login at shell app
2. User is redirected to dashboard custom domain (`https://dashboard.plenno.com.au`)
3. Dashboard page loads with authenticated session
4. All API endpoints return 200 OK with data
5. User can navigate dashboard without authentication errors

---

## Related Documentation

- Initial issue analysis: `docs/deployment/AUTHENTICATION_FIX_AND_REDIRECT_ISSUE.md`
- Redirect fix prompt: `docs/deployment/PROMPT_FIX_REDIRECT_ISSUE.md`
- Supabase SSR docs: https://supabase.com/docs/guides/auth/server-side/nextjs
- Next.js multi-zone: https://nextjs.org/docs/app/building-your-application/deploying/multi-zones

---

## Timeline

| Date | Event | Status |
|------|-------|--------|
| 2025-12-16 | Authentication working, but redirect to stale URL causing 404 | ❌ |
| 2025-12-17 | Updated `NEXT_PUBLIC_DASHBOARD_URL` to custom domain | ✅ |
| 2025-12-17 | Redirect now working to deployed dashboard | ✅ |
| 2025-12-17 | **New issue:** All dashboard API calls returning 401 | ❌ |

---

## Appendix: Full Error Log

```
Failed to load resource: the server responded with a status of 401 ()
/dashboard/api/seasonal-commission:1

Failed to load resource: the server responded with a status of 401 ()
payment-status-summary:1

Failed to load resource: the server responded with a status of 401 ()
/dashboard/api/kpis:1

Failed to load resource: the server responded with a status of 401 ()
/dashboard/api/commission-by-school:1

Failed to load resource: the server responded with a status of 401 ()
/dashboard/api/entities/colleges:1

Failed to load resource: the server responded with a status of 401 ()
/dashboard/api/commission-by-country:1

Failed to load resource: the server responded with a status of 401 ()
cash-flow-projection:1

Failed to load resource: the server responded with a status of 401 ()
/dashboard/api/commission-by-college?period=all:1

Failed to load resource: the server responded with a status of 401 ()
/dashboard/api/entities/branches?:1

Failed to load resource: the server responded with a status of 401 ()
activity-log:1

Failed to load resource: the server responded with a status of 401 ()
overdue-payments:1

[Pattern repeats for all dashboard API endpoints]
```
