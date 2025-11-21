# Authentication Fixes Applied - 2025-11-21

## Summary

Fixed two critical issues preventing authentication from working across zones in development:

1. **Cookie Sharing Issue** - Cookies weren't being shared across localhost ports
2. **Metadata Location Issue** - User role and agency_id were in `user_metadata` instead of `app_metadata`

## Problem 1: Cookie Sharing Across Ports

### Issue
- Logged in at `http://localhost:3005/dashboard` ✅
- Accessing `http://localhost:3002/dashboard` directly → 401 errors ❌
- Cookies with `domain: 'localhost'` not being shared across ports

### Root Cause
Next.js `response.cookies.set()` wasn't properly honoring the `domain` attribute, causing cookies to be set with port-specific domains like `localhost:3005`.

### Fix
Modified `packages/database/src/api-route.ts`:
- Replaced `response.cookies.set()` with explicit `Set-Cookie` header serialization
- Created `serializeCookie()` function to properly format cookie attributes
- Ensures `Domain=localhost` is correctly set in HTTP headers

## Problem 2: User Metadata Location

### Issue
After cookie sharing was fixed, getting 403 errors:
```
User from Supabase: admin@test.local
User role: undefined  ❌
Allowed roles: ['agency_admin', 'agency_user']
❌ INSUFFICIENT PERMISSIONS - Returning 403
```

### Root Cause
The authentication code was looking for `user.app_metadata.role` and `user.app_metadata.agency_id`, but Supabase was storing them in `user.user_metadata` instead.

### Fix

1. **Updated all permission functions** in `packages/auth/src/utils/permissions.ts`
2. **Created helper function** `getUserAgencyId()`
3. **Updated 13 API route files** to use the helper

## Expected Behavior Now

### After Fixes
1. Login at `localhost:3005` ✅
2. Access `localhost:3002/dashboard` ✅ Works!
3. Cookies shared across all localhost ports ✅
4. Role and agency_id correctly retrieved ✅

## Testing

**The fixes are now applied. Test by:**

1. Refresh your browser at `http://localhost:3002/dashboard`
2. Check for successful API calls (no 401 or 403 errors)
3. Dashboard should load with data

**If you still see errors, you may need to clear cookies and re-login.**

## Debug Info

Check auth status:
```bash
curl -s "http://localhost:3002/dashboard/api/auth-status" | python3 -m json.tool
```

Expected: `"authenticated": true` with role `"agency_admin"`
