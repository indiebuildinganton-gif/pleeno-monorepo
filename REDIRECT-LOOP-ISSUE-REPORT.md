# Vercel UAT Deployment - Redirect Loop Issue Report
## December 5, 2024

## Executive Summary
After successfully resolving the 502 Bad Gateway errors, a new critical issue has emerged: users encounter an `ERR_TOO_MANY_REDIRECTS` error after successfully logging in. This creates an infinite redirect loop between the login page and the dashboard, preventing authenticated users from accessing the application.

## Current Status

### ✅ Previously Fixed Issues
- **502 Bad Gateway (DNS_HOSTNAME_NOT_FOUND)**: RESOLVED
  - All zone URLs correctly configured
  - Shell app properly routes to all zones
  - No more DNS resolution errors

- **Authentication API**: WORKING
  - Login endpoint returns valid JWT tokens
  - Test credentials: `admin@test.local` / `password`
  - Supabase connection established

### 🔴 New Critical Issue
- **Error**: `ERR_TOO_MANY_REDIRECTS`
- **Location**: `https://pleeno-shell-uat.vercel.app/login?redirectTo=%2Fdashboard`
- **Behavior**: Infinite redirect loop after successful authentication
- **Impact**: Users cannot access the application even with valid credentials
- **Reproducible**: Yes, even in incognito/private browsing mode

## Problem Analysis

### Redirect Loop Pattern
1. User logs in at `/login`
2. Authentication succeeds (JWT token issued)
3. Redirect to `/dashboard` initiated
4. Dashboard checks authentication
5. Redirects back to `/login?redirectTo=%2Fdashboard`
6. Loop continues indefinitely

### Technical Flow
```
/login (authenticate)
    ↓ (success)
/dashboard (check auth)
    ↓ (auth check fails)
/login?redirectTo=%2Fdashboard
    ↓ (already authenticated)
/dashboard (check auth)
    ↓ (auth check fails)
[INFINITE LOOP]
```

## Root Cause Analysis

### Potential Causes

#### 1. Cookie Domain/Path Mismatch
- **Issue**: Authentication cookies set by shell app may not be accessible to dashboard zone
- **Evidence**: Multi-zone architecture with different subdomains
- **Impact**: Dashboard middleware cannot read auth cookies

#### 2. Middleware Authentication Check Failure
- **Issue**: Dashboard middleware may be incorrectly validating authentication
- **Evidence**: Successful login but immediate redirect back to login
- **Files Involved**:
  - `/apps/dashboard/middleware.ts` (lines 17-151)
  - `/apps/shell/middleware.ts`

#### 3. Cookie Forwarding in Rewrites
- **Issue**: Next.js rewrites may not properly forward cookies to proxied zones
- **Configuration**: `/apps/shell/next.config.ts`
- **Rewrite Pattern**: `/dashboard` → `https://pleeno-dashboard-uat.vercel.app/dashboard`

#### 4. Session Refresh Race Condition
- **Issue**: Multiple middleware instances trying to refresh the same session
- **Impact**: Token refresh conflicts causing auth invalidation

## Technical Details

### Current Architecture
```
Shell App (pleeno-shell-uat.vercel.app)
├── /login → Authentication endpoint
├── /dashboard → Rewrite to Dashboard Zone
├── /agency → Rewrite to Agency Zone
├── /entities → Rewrite to Entities Zone
├── /payments → Rewrite to Payments Zone
└── /reports → Rewrite to Reports Zone

Dashboard Zone (pleeno-dashboard-uat.vercel.app)
├── basePath: '/dashboard'
├── Middleware: Checks authentication
└── Redirects to shell's /login if not authenticated
```

### Cookie Configuration
- **Cookie Name**: `sb-ccmciliwfdtdspdlkuos-auth-token`
- **Domain**: Not explicitly set (defaults to origin domain)
- **Path**: `/`
- **SameSite**: `lax`
- **HttpOnly**: Not specified

### Environment Variables (Verified)
```bash
# Shell App
NEXT_PUBLIC_DASHBOARD_URL=https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[VALID_KEY]

# Dashboard App
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[VALID_KEY]
NEXT_PUBLIC_ZONE_NAME=dashboard
NODE_ENV=production
```

## Diagnostic Tests Performed

### 1. Direct Authentication Test
```bash
curl 'https://pleeno-shell-uat.vercel.app/api/auth/login' \
  -H 'content-type: application/json' \
  --data-raw '{"email":"admin@test.local","password":"password"}'
```
**Result**: ✅ Returns valid JWT token

### 2. Dashboard Access with Cookie
```bash
curl -c /tmp/cookies.txt -s 'https://pleeno-shell-uat.vercel.app/api/auth/login' \
  -H 'content-type: application/json' \
  --data-raw '{"email":"admin@test.local","password":"password"}' > /dev/null

curl -b /tmp/cookies.txt -s -I 'https://pleeno-shell-uat.vercel.app/dashboard'
```
**Result**: ❌ Returns 307 redirect to `/login?redirectTo=%2Fdashboard`

### 3. Browser Testing
- **Regular Browser**: Redirect loop occurs
- **Incognito Mode**: Same redirect loop
- **Different Browsers**: Issue persists

## Impact Assessment

### User Impact
- **Critical**: Complete inability to access the application
- **Scope**: All users, including administrators
- **Workaround**: None available

### Business Impact
- UAT environment unusable for testing
- Deployment pipeline blocked
- Cannot validate features or fixes

## Recommended Solutions

### Immediate Actions

#### Solution 1: Implement Server-Side Cookie Forwarding
Modify the shell app to explicitly forward authentication cookies in rewrite headers:

```typescript
// apps/shell/next.config.ts
async rewrites() {
  return [
    {
      source: '/dashboard/:path*',
      destination: `${ZONE_URLS.dashboard}/dashboard/:path*`,
      has: [
        {
          type: 'cookie',
          key: 'sb-ccmciliwfdtdspdlkuos-auth-token',
        },
      ],
    },
  ]
}
```

#### Solution 2: Shared Authentication Service
Implement a centralized authentication check at the shell level before rewriting:

1. Shell middleware validates authentication
2. Adds authentication headers to forwarded requests
3. Dashboard trusts headers instead of checking cookies

#### Solution 3: Use Subdomain with Shared Cookie Domain
Configure all zones to use subdomains of a single domain:
- Shell: `shell.pleeno-uat.com`
- Dashboard: `dashboard.pleeno-uat.com`
- Set cookie domain to `.pleeno-uat.com`

### Long-term Recommendations

1. **Implement Distributed Session Store**
   - Use Redis or similar for session management
   - All zones read from same session store

2. **API Gateway Pattern**
   - Shell app acts as true API gateway
   - Handle all authentication centrally
   - Forward authenticated requests with headers

3. **Monolithic Deployment Option**
   - Consider single deployment with route-based splitting
   - Eliminates cross-domain cookie issues

## Testing Checklist

- [ ] Verify cookie is set after login
- [ ] Check cookie domain and path attributes
- [ ] Validate middleware authentication logic
- [ ] Test cookie forwarding in rewrites
- [ ] Verify Supabase session refresh
- [ ] Check for console errors in browser
- [ ] Review network tab for redirect chain
- [ ] Test with simplified middleware

## Fixes Applied

### 1. Shell Middleware Fix
**File**: `/apps/shell/middleware.ts`
- Modified to NOT redirect authenticated users away from `/login` when a `redirectTo` parameter is present
- This prevents the redirect loop where authenticated users couldn't stay on login page
- Added authentication headers (`x-user-id`, `x-user-email`, `x-authenticated`) to pass auth state to zones

### 2. Dashboard Middleware Fix
**File**: `/apps/dashboard/middleware.ts`
- Modified to trust authentication headers from the shell proxy
- Checks for `x-authenticated` header as an alternative authentication method
- Uses shell-provided user info when Supabase cookies aren't available

### 3. Environment Variable Fix
- Added `NEXT_PUBLIC_SHELL_URL=https://pleeno-shell-uat.vercel.app` to dashboard zone
- This ensures dashboard redirects to the correct shell login URL

### Deployments
- Shell: Successfully deployed with middleware fixes
- Dashboard: Successfully deployed with authentication header support

## Current Status After Fixes

### ✅ Partial Success
- Login page no longer redirects away when `redirectTo` parameter is present (HTTP 200)
- Authentication headers are being added by shell middleware
- Dashboard middleware can now trust shell authentication

### ⚠️ Remaining Issue
- Cookie-based authentication still doesn't work across domains
- The fundamental limitation: cookies set on `pleeno-shell-uat.vercel.app` cannot be read by `pleeno-dashboard-uat.vercel.app`
- This is a browser security feature (Same-Origin Policy)

## Next Steps

1. **Test in Browser**: The fixes may work better in a real browser environment with proper cookie handling
2. **Consider Domain Architecture**:
   - Option A: Use subdomains of same base domain (e.g., `shell.pleeno-uat.com`, `dashboard.pleeno-uat.com`)
   - Option B: Deploy all zones under single domain using path-based routing only
3. **Alternative Authentication**: Implement token-based auth that doesn't rely on cookies
4. **Production Solution**: Use a custom domain with proper subdomain configuration

## Conclusion

While the 502 errors have been successfully resolved, the redirect loop issue presents a critical blocker for the UAT environment. The issue appears to be related to cookie handling across the multi-zone architecture, where authentication state is not properly shared between the shell and dashboard zones.

This is a common challenge with multi-zone Next.js deployments on separate domains and requires careful consideration of authentication flow and cookie management strategies.

---

**Report Generated**: December 5, 2024
**Issue Status**: 🔴 CRITICAL - In Progress
**Environment**: UAT (pleeno-shell-uat.vercel.app)
**Previous Issues**: 502 errors (RESOLVED)
**Current Issue**: ERR_TOO_MANY_REDIRECTS (ACTIVE)