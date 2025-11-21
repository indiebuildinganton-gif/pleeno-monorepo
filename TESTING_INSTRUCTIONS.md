# Testing Cookie Sharing Fix

## Changes Made

1. **Modified `/packages/database/src/api-route.ts`**:
   - Added explicit `Set-Cookie` header serialization
   - Ensures `Domain=localhost` is properly set
   - Added debug logging to show cookie attributes

2. **Modified `/apps/shell/app/api/auth/login/route.ts`**:
   - Added logging to show cookies being set on login

## Testing Steps

### Step 1: Restart Dev Servers
The code changes require a server restart:

```bash
# Kill all Next.js dev servers
pkill -f "next dev"

# Restart all zones
pnpm dev
```

Wait for all servers to start (watch for "Ready in..." messages).

### Step 2: Clear Browser Cookies
**IMPORTANT**: Must clear old cookies for new ones to work.

1. Open DevTools (F12)
2. Application → Cookies → localhost
3. Right-click → Clear all
4. OR manually delete all cookies starting with `sb-`

### Step 3: Login
1. Navigate to: `http://localhost:3005/login`
2. Enter credentials:
   - Email: `admin@test.local`
   - Password: `Password123`
3. Click "Login"

### Step 4: Check Server Logs
Look for this in the shell zone terminal:

```
🍪 [API Route Client] Setting cookies:
  sb-127-auth-token: { domain: 'localhost', path: '/', httpOnly: true, sameSite: 'lax' }
  sb-127-auth-token-code-verifier: { domain: 'localhost', path: '/', httpOnly: true, sameSite: 'lax' }
```

✅ Good: `domain: 'localhost'` is set
❌ Bad: `domain: '(not set)'` means cookies won't be shared

### Step 5: Check Browser Cookies
After login, check DevTools:

1. Application → Cookies → localhost (or localhost:3005)
2. Find cookies starting with `sb-127-auth-token`
3. Check the **Domain** column:
   - ✅ Should show: `localhost` (without port)
   - ❌ If it shows: `localhost:3005` (with port) - cookies won't share

### Step 6: Test Direct Dashboard Access
1. Navigate to: `http://localhost:3002/dashboard`
2. Check if dashboard loads with data
3. Check browser console for errors
4. Check Network tab for API calls - should return 200, not 401

### Expected Behavior

**Before Fix:**
- ❌ Login at port 3005
- ❌ Access port 3002 → 401 errors
- ❌ Cookies not shared across ports

**After Fix:**
- ✅ Login at port 3005
- ✅ Access port 3002 → Dashboard works
- ✅ Cookies shared across all localhost ports

## Debugging

### If still getting 401 errors:

**Check 1: Server logs show correct domain**
```bash
# Should see: domain: 'localhost'
# in the server logs when you login
```

**Check 2: Browser cookies have correct domain**
```
DevTools → Application → Cookies → localhost
Domain column should show "localhost" not "localhost:3005"
```

**Check 3: Cookies are being sent**
```
DevTools → Network → Select API request → Cookies tab
Should show sb-* cookies being sent
```

**Check 4: Test auth status**
```bash
# Should return authenticated: true
curl -s "http://localhost:3002/dashboard/api/auth-status"
```

## Still Not Working?

If cookies still show `localhost:3005` in the Domain column, this is a browser limitation. Try:

1. **Use Chrome's localhost alias**: `127.0.0.1` instead
   - Login at: `http://127.0.0.1:3005/login`
   - Access: `http://127.0.0.1:3002/dashboard`
   - Cookies on `127.0.0.1` might share better

2. **Use only shell zone**: Access everything through port 3005
   - Dashboard: `http://localhost:3005/dashboard`
   - This uses the shell zone proxy, which works

3. **Production deployment**: This is only a dev issue
   - In production, all zones share the same domain
   - Cookies work perfectly in production
