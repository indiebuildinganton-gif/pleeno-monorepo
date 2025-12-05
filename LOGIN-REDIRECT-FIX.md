# Login Redirect Fix Documentation

## Problem
After successful login, users were stuck on the login page with URL:
`https://pleeno-shell-uat.vercel.app/login?redirectTo=%2Fdashboard`

The page wouldn't redirect to the dashboard or other views even though authentication was successful.

## Root Causes

### 1. Client-Side Navigation Issue
The login page was using Next.js `router.push()` which doesn't always trigger a full page reload needed for cookie updates:
```typescript
// PROBLEM: Soft navigation doesn't properly update auth state
router.push(redirectTo)
router.refresh()
```

### 2. Middleware Redirect Logic
The middleware had a condition that prevented authenticated users from being redirected away from the login page when a `redirectTo` parameter was present, causing them to get stuck.

## The Solution

### Fix 1: Use Hard Navigation in Login Page
**File**: `/apps/shell/app/(auth)/login/page.tsx`

```typescript
// BEFORE: Soft navigation
router.push(redirectTo)
router.refresh()

// AFTER: Hard navigation ensures cookies are properly set
window.location.href = redirectTo
```

**Why this works:**
- `window.location.href` forces a full page reload
- Ensures cookies are properly set and read by the middleware
- Triggers a fresh middleware check with updated auth state

### Fix 2: Simplify Middleware Redirect Logic
**File**: `/apps/shell/middleware.ts`

```typescript
// BEFORE: Complex logic that could block redirects
const isAuthRoute =
  request.nextUrl.pathname.startsWith('/login') ||
  request.nextUrl.pathname.startsWith('/signup')

const hasRedirectTo = request.nextUrl.searchParams.has('redirectTo')

if (isAuthRoute && user && !hasRedirectTo) {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

// AFTER: Simpler logic that always redirects authenticated users
const isAuthRoute =
  request.nextUrl.pathname.startsWith('/login') ||
  request.nextUrl.pathname.startsWith('/signup')

if (isAuthRoute && user) {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
```

**Why this works:**
- Authenticated users are always redirected away from login page
- Respects the `redirectTo` parameter if present
- Falls back to dashboard if no redirect specified

## How the Flow Works Now

1. **User visits protected route** (e.g., `/dashboard`)
   - Not authenticated → Redirected to `/login?redirectTo=%2Fdashboard`

2. **User logs in successfully**
   - API sets authentication cookie
   - Page does hard navigation: `window.location.href = '/dashboard'`

3. **Browser loads `/dashboard`**
   - Middleware checks auth cookie
   - User is authenticated → Allowed to access dashboard

4. **If user visits `/login` while authenticated**
   - Middleware immediately redirects to dashboard (or `redirectTo` param)
   - Prevents authenticated users from seeing login page

## Testing the Fix

### Manual Test
1. Clear all cookies for the domain
2. Visit `https://pleeno-shell-uat.vercel.app/dashboard`
3. You should be redirected to login with `?redirectTo=%2Fdashboard`
4. Log in with valid credentials
5. You should be redirected to the dashboard

### Automated Test
```bash
# Clear cookies and test the flow
curl -c /tmp/cookies.txt -L -s \
  'https://pleeno-shell-uat.vercel.app/api/auth/login' \
  -H 'content-type: application/json' \
  --data '{"email":"admin@test.local","password":"password"}'

# Check if we can access dashboard
curl -b /tmp/cookies.txt -s -o /dev/null -w "%{http_code}" \
  'https://pleeno-shell-uat.vercel.app/dashboard'
# Should return 200 or 307 (redirect to dashboard zone)
```

## Common Issues and Solutions

### Issue 1: Still stuck on login page
**Solution**: Clear browser cache and cookies, then try again

### Issue 2: Redirect to wrong page
**Solution**: Check the `redirectTo` parameter is properly encoded

### Issue 3: Cookie not being set
**Solution**: Ensure the login API returns proper Set-Cookie headers

## Prevention Tips

1. **Always use hard navigation** (`window.location`) after authentication changes
2. **Test redirect flows** in incognito/private browsing mode
3. **Keep middleware logic simple** - avoid complex conditions that might block users
4. **Log redirect decisions** during development for debugging

## Multi-Zone Considerations

In a multi-zone architecture:
- The shell app handles authentication
- Other zones rely on authentication headers from the shell
- Hard navigation ensures all zones get updated auth state

## Summary

The fix involves:
1. Using `window.location.href` for post-login redirect (hard navigation)
2. Simplifying middleware to always redirect authenticated users from login page
3. Respecting the `redirectTo` parameter for proper flow

This ensures users are properly redirected after login and can access the application.

---

**Last Updated**: December 5, 2024
**Status**: ✅ Fixed and Deployed